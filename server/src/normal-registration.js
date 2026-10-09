import bcrypt from 'bcryptjs';
import {canonicalProvince} from './turkey-provinces.js';
import {companyIdentity,companyWriteError} from './company-registration.js';
import {resolveReferrer,recordMembershipReferral} from './membership-referrals.js';
const fail=(message,status=400)=>Object.assign(Error(message),{status});
const text=(body,key,max,required=true)=>{const v=body[key];if(v!==undefined&&typeof v!=='string')throw fail('Geçersiz kayıt bilgisi.');const s=(v??'').trim();if((required&&!s)||s.length>max||s.includes('\0'))throw fail('Kayıt alanları eksik veya geçersiz.');return s;};
export function installNormalRegistration(app,{pool}){
 app.post('/api/auth/register',async(req,res)=>{
  res.set('Cache-Control','private, no-store');let client;
  try{
   const b=req.body;if(!b||typeof b!=='object'||Array.isArray(b)||Object.keys(req.query).length)throw fail('Geçersiz kayıt isteği.');
   const allowed=['name','email','password','confirmPassword','phone','city','profession','company','tax_number','taxNumber','tax_office','taxOffice','billing_address','billingAddress','kvkkConsent','explicitConsent','marketingConsent','token','role','ref','referralCode','referredBy'];
   if(Object.keys(b).some(k=>!allowed.includes(k))||b.role!==undefined&&b.role!=='MEMBER')throw fail('Geçersiz kayıt alanı veya rol.');
   const name=text(b,'name',100),email=text(b,'email',255).toLowerCase(),phone=text(b,'phone',20),city=canonicalProvince(text(b,'city',100)),profession=text(b,'profession',100);
   if(!city)throw fail('Geçerli bir il seçin.');
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw fail('Geçerli e-posta girin.');
   const password=b.password;if(typeof password!=='string'||password.length<8||Buffer.byteLength(password,'utf8')>72)throw fail('Şifre en az 8 karakter olmalı ve 72 baytı aşmamalıdır.');
   if(b.confirmPassword!==undefined&&b.confirmPassword!==password)throw fail('Şifreler eşleşmiyor.');
   if(b.kvkkConsent!==true||b.explicitConsent!==true||b.marketingConsent!==undefined&&typeof b.marketingConsent!=='boolean')throw fail('Kayıt metinlerini onaylayın.');
   const alias=(snake,camel)=>{if(b[snake]!==undefined&&b[camel]!==undefined&&b[snake]!==b[camel])throw fail('Şirket alanları çelişiyor.');return b[snake]??b[camel];};
   const identity=companyIdentity(b.company,alias('tax_number','taxNumber'),alias('tax_office','taxOffice'),alias('billing_address','billingAddress'));
   const hash=await bcrypt.hash(password,10);
   client=await pool.connect();await client.query('BEGIN');await client.query("SET LOCAL lock_timeout='5s';SET LOCAL statement_timeout='30s'");
   const referrer=await resolveReferrer(client,{ref:b.ref,referralCode:b.referralCode,referredBy:b.referredBy,token:b.token});
   if(referrer&&referrer.email.toLowerCase()===email.toLowerCase())throw fail('Kullanıcı kendi kendine referans olamaz.',400);
   // Database uniqueness, including deleted accounts, is the final race barrier.
   const {rows}=await client.query(`INSERT INTO users(name,email,password_hash,phone,city,profession,company,tax_number,tax_office,billing_address,role,account_status,kvkk_consent,explicit_consent,marketing_consent,consent_date,company_registration)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'MEMBER','UNSUBSCRIBED',true,true,$11,now(),true)
    RETURNING id,email,name,role,account_status`,[name,email,hash,phone,city,profession,identity.company,identity.tax_number,identity.tax_office,identity.billing_address,b.marketingConsent??false]);
   if(referrer){
    await recordMembershipReferral(client,{userId:rows[0].id,userEmail:email,referrer,source:b.token?'INVITATION_LINK':'REGISTRATION',referralCode:b.ref||b.referralCode||null});
   }
   await client.query('COMMIT');res.status(201).json(rows[0]);
  }catch(e){if(client)await client.query('ROLLBACK').catch(()=>{});const mapped=companyWriteError(e);res.status(mapped?.status??e.status??500).json(mapped??{error:e.status?e.message:'Kayıt oluşturulamadı. Tekrar deneyin.'});}finally{client?.release();}
 });
}
