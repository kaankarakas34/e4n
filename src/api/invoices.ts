import {invoiceTransport} from './api';
const uuid=(v:unknown):v is string=>typeof v==='string'&&/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(v);
export type InvoiceTarget={id:string;type:'MEMBER'|'VISITOR'};
export const invoiceId=(url:string|null)=>{const id=url?.match(/^\/api\/invoices\/([0-9a-f-]+)$/i)?.[1];return uuid(id)?id:null;};
export const invoicesApi={
 async upload(owner:string,target:InvoiceTarget,file:File,key:string){
  const body=new FormData();body.set('invoice',file);body.set('requestKey',key);
  const r=await invoiceTransport.upload(target.type,target.id,body);
  if(!r||r.success!==true||r.ownerId!==owner||r.targetType!==target.type||r.targetId!==target.id||r.requestKey!==key||!uuid(r.invoiceId)||r.invoice_url!==`/api/invoices/${r.invoiceId}`||typeof r.filename!=='string'||r.size_bytes!==file.size||typeof r.replay!=='boolean'||!['ATTEMPTED','SENT','UNKNOWN','NO_ADDRESS'].includes(r.emailState))throw new Error('Fatura sonucu doğrulanamadı. Aynı gönderimi tekrar kontrol edin.');
  return r as {invoice_url:string;emailState:'ATTEMPTED'|'SENT'|'UNKNOWN'|'NO_ADDRESS'};
 },
 async download(url:string|null){const id=invoiceId(url);if(!id)throw new Error('Eski fatura bağlantısı henüz kalıcı depoya taşınmamış.');const blob=await invoiceTransport.download(id);if(blob.type!=='application/pdf'||blob.size<1||blob.size>3145728)throw new Error('Fatura dosyası doğrulanamadı.');return blob;},
};
