export const normalizeTaxNumber=value=>typeof value==='string'?value.replace(/[\s-]/g,''):'';
export function companyIdentity(company,taxNumber,taxOffice,billingAddress){
 const name=typeof company==='string'?company.trim():'';const tax=normalizeTaxNumber(taxNumber);
 if(!name||name.length>255||name.includes('\0'))throw Object.assign(Error('Şirket bilgisi zorunludur.'),{status:400,code:'COMPANY_REQUIRED'});
 if(!/^(?:[0-9]{10}|[1-9][0-9]{10})$/.test(tax))throw Object.assign(Error('10 haneli VKN veya 11 haneli TCKN girin.'),{status:400,code:'INVALID_TAX_NUMBER'});
 const office=typeof taxOffice==='string'?taxOffice.trim():'';const address=typeof billingAddress==='string'?billingAddress.trim():'';
 if(!office||office.length>100||office.includes('\0')||!address||address.length>5000||address.includes('\0'))throw Object.assign(Error('Vergi dairesi ve şirket adresi zorunludur.'),{status:400,code:'COMPANY_BILLING_REQUIRED'});
 return {company:name,tax_number:tax,tax_office:office,billing_address:address};
}
export function companyWriteError(error){
 if((error.code==='23505'&&['users_tax_number_unique','company_tax_registry_pkey'].includes(error.constraint))||(error.code==='P0001'&&error.message==='TAX_NUMBER_RESERVED'))return {status:409,error:'Bu vergi numarası zaten bir hesaba bağlıdır.',code:'TAX_NUMBER_IN_USE'};
 if(error.code==='23514'&&error.constraint==='users_company_identity_check')return {status:400,error:'Şirket ve geçerli VKN/TCKN bilgileri gereklidir.',code:'INVALID_COMPANY_IDENTITY'};
 if(error.code==='23514'&&error.constraint==='users_company_billing_check')return {status:400,error:'Vergi dairesi ve şirket adresi zorunludur.',code:'COMPANY_BILLING_REQUIRED'};
 if(error.code==='23505'&&['users_email_key','users_email_lower_unique'].includes(error.constraint))return {status:409,error:'Bu e-posta adresi zaten kayıtlı.',code:'EMAIL_IN_USE'};
 return null;
}
