import {randomUUID} from 'node:crypto';

export const subscriptionReminderLock = [4020, 36];
export const subscriptionReminderDays = [3, 1, -1, -3, -5];

function reminderCopy(user, daysLeft) {
  if (daysLeft > 0) return {
    title: 'Üyelik Ödeme Hatırlatması',
    message: `Sayın ${user.name}, üyeliğinizin bitmesine ${daysLeft} gün kaldı. Hesabınızın kısıtlanmaması için lütfen en kısa sürede dashboard üzerindeki Üyelik İşlemleri sayfasından ödemenizi gerçekleştiriniz.`,
  };
  const overdueDay = Math.abs(daysLeft);
  return {
    title: overdueDay >= 5 ? 'Gecikmiş Üyelik Ödemesi — Son Uyarı (5. Gün)' : `Gecikmiş Üyelik Ödemesi Uyarısı (${overdueDay}. Gün)`,
    message: `Sayın ${user.name}, üyeliğinizin süresi dolalı ${overdueDay} gün olmuştur. ${overdueDay >= 5 ? '5 günlük gecikme süresi dolduğu için hesabınız kısıtlanmaktadır.' : 'Hizmetlerinizin kesilmemesi için'} lütfen acilen dashboard üzerindeki Üyelik İşlemleri sayfasından ödemenizi tamamlayınız.`,
  };
}

export async function runSubscriptionReminders(pool, {
  now = new Date(),
  sendMail = async () => ({success:false}),
  log = entry => console.log(JSON.stringify(entry)),
} = {}) {
  const runId=randomUUID(),started=Date.now();let client;
  const report=(status,fields={})=>({job:'subscription-reminders',runId,status,elapsedMs:Date.now()-started,...fields});
  const emit=entry=>{try{log(entry);}catch{/* A logging outage cannot change a committed result. */}};
  const claimed=[];
  try {
    if (!(now instanceof Date) || !Number.isFinite(now.getTime())) throw Object.assign(new Error('Invalid reminder clock'),{code:'INVALID_CLOCK'});
    client=await pool.connect();await client.query('BEGIN');
    await client.query("SET LOCAL lock_timeout='5s'; SET LOCAL statement_timeout='30s'");
    const acquired=(await client.query('SELECT pg_try_advisory_xact_lock($1,$2) AS acquired',subscriptionReminderLock)).rows[0].acquired;
    if(!acquired){await client.query('ROLLBACK');const result=report('SKIPPED',{reason:'ALREADY_RUNNING',claimed:0,notifications:0,emailsSent:0,emailsUnknown:0});emit(result);return result;}
    const candidates=(await client.query(`
      SELECT id,name,email,subscription_end_date,last_reminder_trigger,
        ((subscription_end_date AT TIME ZONE 'UTC')::date - ($1::timestamptz AT TIME ZONE 'UTC')::date)::int AS days_left
      FROM users
      WHERE account_status='ACTIVE' AND subscription_end_date IS NOT NULL
        AND ((subscription_end_date AT TIME ZONE 'UTC')::date - ($1::timestamptz AT TIME ZONE 'UTC')::date)::int = ANY($2::int[])
      ORDER BY id
      FOR UPDATE`,[now.toISOString(),subscriptionReminderDays])).rows;
    for(const user of candidates){
      const daysLeft=Number(user.days_left),copy=reminderCopy(user,daysLeft);
      const delivery=(await client.query(`INSERT INTO subscription_reminder_deliveries(user_id,subscription_end_date,trigger_days)
        VALUES($1,$2,$3) ON CONFLICT(user_id,subscription_end_date,trigger_days) DO NOTHING RETURNING id`,[user.id,user.subscription_end_date,daysLeft])).rows[0];
      if(!delivery)continue;
      const notification=(await client.query(`INSERT INTO notifications(user_id,type,title,message,read)
        VALUES($1,'SYSTEM',$2,$3,false) RETURNING id`,[user.id,copy.title,copy.message])).rows[0];
      await client.query('UPDATE subscription_reminder_deliveries SET notification_id=$1 WHERE id=$2',[notification.id,delivery.id]);
      await client.query('UPDATE users SET last_reminder_trigger=$1 WHERE id=$2',[daysLeft,user.id]);
      if(daysLeft <= -5) {
        await client.query("UPDATE users SET account_status='RESTRICTED' WHERE id=$1 AND account_status='ACTIVE'",[user.id]);
      }
      claimed.push({deliveryId:delivery.id,email:user.email,title:copy.title,message:copy.message});
    }
    await client.query(`
      UPDATE users SET account_status='RESTRICTED'
      WHERE account_status='ACTIVE' AND subscription_end_date IS NOT NULL
        AND ((subscription_end_date AT TIME ZONE 'UTC')::date - ($1::timestamptz AT TIME ZONE 'UTC')::date)::int < -5`,[now.toISOString()]);
    await client.query('COMMIT');client.release();client=undefined;
    let emailsSent=0,emailsUnknown=0,noEmail=0;
    for(const item of claimed){
      let state='UNKNOWN';
      if(!item.email){state='NO_EMAIL';noEmail+=1;}
      else {
        try{const sent=await sendMail(item.email,item.title,`<p>${item.message}</p>`);if(sent?.success===true){state='SENT';emailsSent+=1;}else emailsUnknown+=1;}
        catch{emailsUnknown+=1;}
      }
      await pool.query('UPDATE subscription_reminder_deliveries SET delivery_state=$1,completed_at=now() WHERE id=$2',[state,item.deliveryId]);
    }
    const result=report('SUCCESS',{claimed:claimed.length,notifications:claimed.length,emailsSent,emailsUnknown,noEmail});emit(result);return result;
  } catch(error) {
    if(client)try{await client.query('ROLLBACK');}catch{/* Preserve original failure. */}
    emit(report('FAILED',{errorCode:typeof error.code==='string'?error.code:'JOB_ERROR'}));throw error;
  } finally {client?.release();}
}

export function scheduleSubscriptionReminders(schedule,pool,options={}) {
  return schedule('0 9 * * *',async()=>{
    try{return await runSubscriptionReminders(pool,options);}catch{return undefined;}
  });
}
