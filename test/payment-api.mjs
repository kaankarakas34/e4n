import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
globalThis.localStorage={getItem:()=>JSON.stringify({state:{token:'fixture-token'}})};
let response;
globalThis.fetch=async()=>response;
let code=ts.transpileModule(readFileSync(new URL('../src/api/api.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
  .replace(/import \{ emailService \} from ['"]\.\.\/services\/emailService['"];?/,'const emailService = {};').replaceAll('import.meta.env.PROD','false');
const {api}=await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
for(const bad of [null,{success:true},{success:true,is3D:false},{success:true,is3D:true,html:'x',invoiceId:'id'},{success:true,is3D:true,html:'',invoiceId:'id',receiptToken:'receipt'}]) {
  response=new Response(JSON.stringify(bad));await assert.rejects(api.payWithSipay({}));
}
response=new Response(JSON.stringify({success:true,is3D:true,html:'x',invoiceId:'id',receiptToken:'receipt'}));assert.equal((await api.payWithSipay({})).invoiceId,'id');
for(const bad of [null,{}, {invoice_id:'other',status:'SUCCESS',amount:100,action_type:'membership'},
  {invoice_id:'id',status:'SUCCESS',amount:'100',action_type:'membership'}, {invoice_id:'id',status:'unknown',amount:100,action_type:'membership'}]) {
  response=new Response(JSON.stringify(bad));await assert.rejects(api.getPaymentStatus('id','receipt'));
}
for(const status of ['PENDING','FAILED','SUCCESS','PAID']) {
  response=new Response(JSON.stringify({invoice_id:'id',status,amount:100,action_type:'membership'}));assert.equal((await api.getPaymentStatus('id','receipt')).status,status);
}
response=new Response('Unavailable',{status:503});await assert.rejects(api.getPaymentStatus('id','receipt'));
console.log('Real payment API: initiation/receipt and result shape/target/status/amount, HTTP errors preserved. Controlled fetch; no real payment.');
