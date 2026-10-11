import {spawnSync} from 'node:child_process';
const cli=process.argv[2];if(!cli)throw Error('Pass installed playwright-cli.js path');
const base=process.argv[3]||'http://127.0.0.1:5187';
function run(args){const r=spawnSync(process.execPath,[cli,'-s=e4n-guild',...args],{encoding:'utf8',windowsHide:true});console.log(r.stdout);if(r.status!==0||r.stdout.includes('### Error'))throw Error(r.stderr||r.stdout);}
run(['open',base+'/topluluklarimiz']);
run(['snapshot']);
run(['run-code',`async page => { const anchors = page.locator('a[href^="https://chat.whatsapp.com/"]'); if(await anchors.count() !== 10) throw Error('Expected 10 invites'); const auth = await page.evaluate(() => JSON.parse(localStorage.getItem('auth-storage') || 'null')); if(auth?.state?.user || auth?.state?.token) throw Error('Expected anonymous browser'); for(const a of await anchors.all()) if(await a.getAttribute('target') !== '_blank') throw Error('Invite not directly clickable'); console.log('PASS: anonymous visitor has 10 direct WhatsApp invites'); }`]);
run(['screenshot','--filename=output/playwright/public-whatsapp.png']);
for(const route of ['/power-teams','/power-teams/old','/admin/power-teams/old']) {run(['goto',base+route]);run(['run-code',`async page => { if(!page.url().endsWith('/topluluklarimiz'))throw Error('Expected public redirect'); if(await page.locator('a[href^="https://chat.whatsapp.com/"]').count() !== 10) throw Error('Invites missing'); console.log('PASS: ${route} redirects to public communities'); }`]);}
