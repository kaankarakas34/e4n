import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
globalThis.localStorage={getItem:()=>null};let response,payload;
globalThis.fetch=async(_url,options)=>{payload=JSON.parse(options.body);return response;};
const code=ts.transpileModule(readFileSync(new URL('../src/api/api.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replace(/import \{ emailService \} from ['"]\.\.\/services\/emailService['"];?/,'const emailService = {};').replaceAll('import.meta.env.PROD','false');
const {api}=await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
const reply={success:true,ticket_id:'target',message_id:'message',status:'ANSWERED'};
for(const bad of [null,{}, {...reply,success:false},{...reply,ticket_id:'other'},{...reply,message_id:''},{...reply,status:'CLOSED'}]) {
  response=new Response(JSON.stringify(bad));await assert.rejects(api.replyTicket('target','text','key'));
}
response=new Response(JSON.stringify(reply));assert.equal((await api.replyTicket('target','text','key')).message_id,'message');assert.deepEqual(payload,{message:'text',requestKey:'key'});
const status={success:true,ticket_id:'target',status:'CLOSED'};
for(const bad of [null,{}, {...status,success:'true'},{...status,ticket_id:'other'},{...status,status:'OPEN'}]) {
  response=new Response(JSON.stringify(bad));await assert.rejects(api.updateTicketStatus('target','CLOSED','key'));
}
response=new Response(JSON.stringify(status));assert.equal((await api.updateTicketStatus('target','CLOSED','key')).status,'CLOSED');assert.deepEqual(payload,{status:'CLOSED',requestKey:'key'});
response=new Response('Not found',{status:404});await assert.rejects(api.updateTicketStatus('target','CLOSED','key'),e=>e.status===404);
console.log('Support API: wrong-target/malformed/message/status ACKs rejected; requestKey transported and HTTP errors preserved. Controlled fetch.');
