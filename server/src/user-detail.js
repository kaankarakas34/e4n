const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(v);
const failure=(status,message)=>Object.assign(new Error(message),{status});

export async function readUserDetailSnapshot(pool,ownerId,targetId,query={}) {
  if(!uuid(ownerId))throw failure(401,'Oturum doğrulanamadı.');
  if(!uuid(targetId)||Object.keys(query).length)throw failure(400,'Geçersiz profil sorgusu.');
  let client;
  try{
    client=await pool.connect();await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    const {rows:[owner]}=await client.query('SELECT id,role FROM users WHERE id=$1',[ownerId]);
    if(!owner)throw failure(401,'Oturum doğrulanamadı.');
    if(owner.id!==targetId.toLowerCase()&&owner.role!=='ADMIN')throw failure(404,'Üye bulunamadı.');
    const {rows:[user]}=await client.query(`
      SELECT u.id,u.name,u.name AS full_name,u.profession,u.email,u.phone,u.city,u.role,
        u.performance_score,u.performance_color,u.company,u.tax_number,u.tax_office,u.billing_address,u.account_status,
        u.subscription_plan,u.subscription_end_date,
        (SELECT count(*)::int FROM referrals WHERE giver_id=u.id) metric_referrals,
        (SELECT coalesce(sum(amount),0)::float FROM referrals WHERE giver_id=u.id AND status='SUCCESSFUL') metric_revenue,
        (SELECT count(*)::int FROM visitors WHERE inviter_id=u.id) metric_visitors,
        (SELECT count(*)::int FROM one_to_ones WHERE requester_id=u.id OR partner_id=u.id) metric_one_to_ones,
        coalesce((SELECT json_agg(m ORDER BY m.meeting_date DESC,m.id DESC) FROM (
          SELECT o.id,o.meeting_date,o.status,p.name AS partner_name
          FROM one_to_ones o LEFT JOIN users p ON p.id=CASE WHEN o.requester_id=u.id THEN o.partner_id ELSE o.requester_id END
          WHERE o.requester_id=u.id OR o.partner_id=u.id ORDER BY o.meeting_date DESC,o.id DESC LIMIT 3
        ) m),'[]'::json) last_meetings,
        coalesce((SELECT json_agg(g ORDER BY g.name,g.id) FROM (
          SELECT DISTINCT g.id,g.name FROM group_members gm JOIN groups g ON g.id=gm.group_id
          WHERE gm.user_id=u.id AND gm.status='ACTIVE'
        ) g),'[]'::json) groups
      FROM users u WHERE u.id=$1`,[targetId]);
    if(!user)throw failure(404,'Üye bulunamadı.');
    await client.query('COMMIT');
    return {...user,profileVersion:1,ownerId:owner.id,metricScope:'ALL_HISTORY',group_name:user.groups.length===1?user.groups[0].name:null};
  }catch(e){if(client)await client.query('ROLLBACK').catch(()=>{});throw e;}
  finally{client?.release();}
}
