import json, shutil, hashlib
from pathlib import Path
out=Path('output/playwright/e4n-seo-aud02-2026-10-12')
dest=Path('E4N/09-Dogrulama/E4N-SEO-AUD02-2026-10-12')
dest.mkdir(parents=True,exist_ok=True)
def result(name):
 text=(out/name).read_text(encoding='utf-8-sig')
 if '### Result' not in text:raise ValueError(name+' has no successful result')
 data=json.JSONDecoder().raw_decode(text.split('### Result',1)[1].lstrip())[0]
 return json.loads(data) if isinstance(data,str) else data
schema=result('schema-followup-final.log')
discovered=result('discovered-routes.log')
faq=result('faq-visible-check.log')
for name,data in [('schema-followup.json',schema),('discovered-routes.json',discovered),('faq-visible-check.json',faq)]:
 (out/name).write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
data=json.loads((out/'browser-audit.json').read_text(encoding='utf-8'))
summary=json.loads((out/'summary.json').read_text(encoding='utf-8'))
checks={
 'primaryRows':len(data['results']),
 'extraRows':len(discovered),
 'primaryRequestErrors':sum('error' in r for r in data['results']),
 'rawPagesWithoutH1':sum(not r.get('raw',{}).get('h1') for r in data['results']),
 'duplicateCanonicalRows':sum(len(r.get('rendered',{}).get('canonical',[]))>1 for r in data['results']),
 'schemaParseErrors':sum('error' in s for r in data['results'] for s in r.get('rendered',{}).get('schema',[])),
 'faqAnswersMatched':faq['answersMatched'],
 'mobilePagesWithoutOverflow':sum(not r['overflow'] for r in data['mobile']),
 'mobilePagesTotal':len(data['mobile']),
 'sitemapClientRedirectRows':[r['url'] for r in data['results'] if r['url'] in data['sitemap']['urls'] and r.get('rendered',{}).get('url')!=r['url']],
 'lh':[{k:d[k] for k in ['url','scores','metrics']} for d in summary['lighthouse']]
}
assert checks['primaryRequestErrors']==0
assert checks['primaryRows']==29 and checks['extraRows']==4
assert faq['count']==25 and faq['answersMatched']==25
assert len(summary['lighthouse'])==2 and all(d['runtimeError'] is None for d in summary['lighthouse'])
(out/'checks.json').write_text(json.dumps(checks,ensure_ascii=False,indent=2),encoding='utf-8')
names=['browser-audit.json','summary.json','url-render-comparison.csv','schema-followup.json','discovered-routes.json','faq-visible-check.json','checks.json','lighthouse-home.json','lighthouse-uyelik.json','gsc-access.json','psi-mobile.json','rich-results-access.log']
names += [p.name for p in out.glob('mobile-*.png')]
for name in names:shutil.copy2(out/name,dest/name)
manifest={name:hashlib.sha256((dest/name).read_bytes()).hexdigest() for name in names}
(dest/'manifest-sha256.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
print(json.dumps(checks,ensure_ascii=False))
