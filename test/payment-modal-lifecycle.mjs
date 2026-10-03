import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

let cursor = 0, props, response, statusRead, reads = 0, calls = 0, opens = 0, successes = 0, popup;
const storage = new Map(), keys = [];
globalThis.sessionStorage = {getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)};
globalThis.paymentAttemptSupport = await import(`data:text/javascript;base64,${Buffer.from(ts.transpileModule(readFileSync(new URL('../src/services/paymentAttempt.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64')}`);
const state = [], dependencies = [], cleanups = [], effects = [], listeners = new Set(), timers = new Map();
globalThis.paymentHooks = {
  useState(initial) {
    const i = cursor++;
    if (!(i in state)) state[i] = initial;
    return [state[i], value => { state[i] = typeof value === 'function' ? value(state[i]) : value; }];
  },
  useRef(initial) { const i = cursor++; return state[i] ??= { current: initial }; },
  useEffect(callback, deps) {
    const i = cursor++;
    if (!dependencies[i] || deps.some((value, j) => value !== dependencies[i][j])) {
      dependencies[i] = deps;
      effects.push(() => { cleanups[i]?.(); cleanups[i] = callback(); });
    }
  },
};
globalThis.paymentApi = {
  payWithSipay: body => { calls++; keys.push(body.requestKey); return response(); },
  resumePayment: async () => ({success:true,is3D:false,recoveryOnly:true,invoiceId:'fixture-invoice',receiptToken:'fixture-receipt'}),
  getPaymentStatus: (id,token) => { reads++; assert.equal(id,'fixture-invoice');assert.equal(token,'fixture-receipt');return statusRead(); },
  updateMe: () => { throw new Error('Unexpected profile write'); },
};
globalThis.paymentAuth = () => ({ user: null, updateUser: () => {} });
globalThis.window = {
  open: () => { opens++; return popup; },
  addEventListener: (type, callback) => { assert.equal(type, 'message'); listeners.add(callback); },
  removeEventListener: (type, callback) => listeners.delete(callback),
  setInterval: callback => { const id = Symbol(); timers.set(id, callback); return id; },
  clearInterval: id => timers.delete(id),
};
let compiled = ts.transpileModule(readFileSync(new URL('../src/components/PaymentModal.tsx', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
compiled = compiled.replace(/import React, \{([^}]+)\} from ['"]react['"];?/, (_, names) =>
  `import React from '${import.meta.resolve('react')}'; const {${names}} = globalThis.paymentHooks;`);
compiled = compiled.replace(/import \{([^}]+)\} from ['"]([^'"]+)['"];?/g, (line, names, source) => {
  if (source === 'react/jsx-runtime') return line.replace(source, import.meta.resolve(source));
  if (source === '../api/api') return 'const api = globalThis.paymentApi;';
  if (source === '../stores/authStore') return 'const useAuthStore = globalThis.paymentAuth;';
  if (source === '../services/paymentAttempt') return `const {${names}} = globalThis.paymentAttemptSupport;`;
  return names.split(',').map(name => `const ${name.trim()} = '${name.trim()}';`).join('\n');
});
const { PaymentModal } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const render = () => { cursor = 0; return PaymentModal(props); };
const nodes = tree => Array.isArray(tree) ? tree.flatMap(nodes) : tree && typeof tree === 'object' ? [tree, ...nodes(tree.props?.children)] : [];
const commit = () => { render(); while (effects.length) effects.shift()(); };
const flush = () => new Promise(resolve => setTimeout(resolve,20));
const hasText = text => nodes(render()).some(node => node.props?.children === text);
const submit = () => nodes(render()).find(node => node.type === 'form').props.onSubmit({ preventDefault() {} });
const emit = (status, source = popup) => { for (const callback of [...listeners]) callback({ source, data: { status, invoice_id: 'fixture-invoice' } }); };
const idle = () => assert.equal(nodes(render()).find(node => node.type === 'Modal').props.onClose, props.onClose);
const clean = () => { assert.equal(listeners.size, 0); assert.equal(timers.size, 0); };
const unmount = () => { for (const cleanup of cleanups) cleanup?.(); cleanups.length = 0; clean(); };
async function setup(onSuccess = async () => { successes++; }, preserveStorage = false) {
  unmount(); state.length = 0; dependencies.length = 0; effects.length = 0;
  if (!preserveStorage) storage.clear();
  popup = { closed: false, document: { write() {}, close() {} } };
  response = async () => ({ success: true, is3D: true, html: '<p>Fixture</p>',invoiceId:'fixture-invoice',receiptToken:'fixture-receipt' });
  statusRead = async () => ({invoice_id:'fixture-invoice',status:'SUCCESS',amount:100,action_type:'membership'});
  props = { isOpen: true, onClose() {}, onSuccess, amount: 100, planTitle: 'Fixture', action: { type: 'membership', data: {} },
    initialBillingData: { company: 'Fixture', tax_number: 'Fixture', tax_office: 'Fixture', billing_address: 'Fixture' } };
  commit(); await flush(); await submit(); // Billing step, no logged-in profile write.
  for (const [name, value] of Object.entries({ cardName: 'Fixture', cardNumber: '1111111111111111', expiryDate: '1230', cvv: '111' })) {
    nodes(render()).find(node => node.props?.name === name).props.onChange({ target: { name, value } });
  }
}

await setup(); await submit();
assert.equal(listeners.size, 1); assert.equal(timers.size, 1);
const before = successes;
emit('success', {}); assert.equal(successes, before); assert.equal(listeners.size, 1);
emit('success'); emit('success'); await flush(); clean(); idle();
assert.equal(successes, before + 1);

await setup(); await submit(); statusRead=async()=>({invoice_id:'fixture-invoice',status:'FAILED',amount:100,action_type:'membership'});emit('fail');await flush();clean(); idle();
assert.ok(hasText('Ödeme sağlayıcısı işlemi başarısız olarak doğruladı.'));

await setup(); await submit(); popup.closed = true;
for (const tick of [...timers.values()]) tick();
clean(); idle();
assert.ok(hasText('Doğrulama penceresi kapandı. Ödeme sonucu doğrulanamadı; tekrar ödeme yapmadan işlem durumunu kontrol edin.'));

await setup(); popup = null; await submit(); clean(); idle();
assert.ok(hasText('3D Secure doğrulama penceresi engellendi. Yeni ödeme başlatmadan işlem durumunu kontrol edin.'));

await setup(); popup.document.write = () => { throw new Error('Fixture popup write failure'); };
const savedError = console.error; console.error = () => {};
try { await submit(); } finally { console.error = savedError; }
clean(); idle(); assert.ok(hasText('Fixture popup write failure'));

await setup(); await submit(); props = { ...props, isOpen: false }; commit(); clean();
props = { ...props, isOpen: true }; commit(); idle();

await setup(); await submit(); unmount(); emit('success');

await setup(); let resolvePay;
response = () => new Promise(resolve => { resolvePay = resolve; });
const beforeCalls = calls, beforeOpens = opens;
const first = submit(); await flush(); await submit(); assert.equal(calls, beforeCalls + 1);
props = { ...props, isOpen: false }; commit();
resolvePay({ success: true, is3D: true, html: '<p>Stale</p>' }); await first;
assert.equal(opens, beforeOpens); clean();

for (const is3D of [true]) {
  await setup(async () => { throw new Error('Fixture consumer failure'); });
  response = async () => ({ success: true, is3D, html: '<p>Fixture</p>',invoiceId:'fixture-invoice',receiptToken:'fixture-receipt' });
  await submit(); if (is3D) emit('success'); await flush();
  clean(); idle();
  assert.ok(hasText('Ödeme bildirimi işlenemedi. Tekrar ödeme yapmadan işlem durumunu kontrol edin.'));
}
// A popup signal alone never confirms payment; recovery reads do not start a new charge.
for (const result of [{invoice_id:'fixture-invoice',status:'PENDING',amount:100,action_type:'membership'},
  {invoice_id:'other',status:'SUCCESS',amount:100,action_type:'membership'},
  {invoice_id:'fixture-invoice',status:'SUCCESS',amount:99,action_type:'membership'}]) {
  await setup();await submit();const successBefore=successes,payBefore=calls;statusRead=async()=>result;
  emit('success');await flush();assert.equal(successes,successBefore);idle();
  await submit();assert.equal(calls,payBefore);
  statusRead=async()=>({invoice_id:'fixture-invoice',status:'SUCCESS',amount:100,action_type:'membership'});
  await nodes(render()).find(n=>n.props?.children==='İşlem durumunu kontrol et').props.onClick();
  assert.equal(successes,successBefore+1);assert.equal(calls,payBefore);
}
await setup();await submit();const readBefore=reads;
for(const cb of [...listeners])cb({source:popup,data:{status:'success',invoice_id:'wrong'}});
assert.equal(reads,readBefore);assert.equal(listeners.size,1);
let resolveStatus;statusRead=()=>new Promise(resolve=>{resolveStatus=resolve;});emit('success');
props={...props,action:{type:'membership',data:{plan:'other'}}};commit();const successBefore=successes;
resolveStatus({invoice_id:'fixture-invoice',status:'SUCCESS',amount:100,action_type:'membership'});await flush();assert.equal(successes,successBefore);
unmount();
// A lost initiation response survives a reload and retries the same immutable intent.
await setup(); response=async()=>{throw new Error('Synthetic offline');};
console.error=()=>{};try{await submit();}finally{console.error=savedError;}
const offlineKey=keys.at(-1);assert.match(offlineKey,/^[a-f0-9-]{36}$/);assert.equal(storage.size,1);
assert.equal((await paymentAttemptSupport.readPaymentAttempt(JSON.stringify([null,null,{data:{},type:'membership'},100]))).requestKey,offlineKey);
assert.ok(![...storage.values()][0].includes('111111'));assert.ok(![...storage.values()][0].includes('cvv'));
await setup(undefined,true);await submit();assert.equal(keys.at(-1),offlineKey);
const callsBeforeReload=calls;await setup(undefined,true);
await nodes(render()).find(n=>n.props?.children==='İşlem durumunu kontrol et').props.onClick();
assert.equal(calls,callsBeforeReload);assert.equal(storage.size,0);
// Consumer rejection keeps recovery data; acknowledgement clears it.
await setup(async()=>{throw new Error('Synthetic consumer failure');});await submit();emit('success');await flush();assert.equal(storage.size,1);
await setup(undefined,true);await nodes(render()).find(n=>n.props?.children==='İşlem durumunu kontrol et').props.onClick();assert.equal(storage.size,0);
// Duplicate server reply enters reconciliation without opening another bank form.
await setup();const opensBeforeRecovery=opens;
response=async()=>({success:true,is3D:false,recoveryOnly:true,invoiceId:'fixture-invoice',receiptToken:'fixture-receipt'});
await submit();assert.equal(opens,opensBeforeRecovery);assert.equal(storage.size,0);
// Storage failure stops initiation before any network charge attempt.
await setup();const setItem=sessionStorage.setItem,payBeforeStorageFailure=calls;
sessionStorage.setItem=()=>{throw new Error('Synthetic storage unavailable');};console.error=()=>{};
try{await submit();}finally{sessionStorage.setItem=setItem;console.error=savedError;}
assert.equal(calls,payBeforeStorageFailure);unmount();
// NOT_SENT is the only server recovery state that permits resending the same key.
await setup();response=async()=>{throw new Error('Synthetic token failure');};console.error=()=>{};
try{await submit();}finally{console.error=savedError;}
const notSentKey=keys.at(-1),resume=paymentApi.resumePayment;
paymentApi.resumePayment=async()=>({success:true,is3D:false,recoveryOnly:true,invoiceId:'fixture-invoice',receiptToken:'fixture-receipt',retryAllowed:true});
await nodes(render()).find(n=>n.props?.children==='İşlem durumunu kontrol et').props.onClick();
response=async()=>({success:true,is3D:true,html:'Fixture',invoiceId:'fixture-invoice',receiptToken:'fixture-receipt'});
await submit();assert.equal(keys.at(-1),notSentKey);paymentApi.resumePayment=resume;unmount();
console.log('Payment modal: one pending submit, popup blocked/closed/fail/success, source separation, close/reopen/unmount cleanup, stale API response ignored, async consumer rejection caught. Controlled hooks/window/API only; no payment/network calls.');
