import json, re, csv
from pathlib import Path
folder=Path('output/playwright/e4n-seo-aud02-2026-10-12')
log=(folder/'browser-audit.log').read_text(encoding='utf-8-sig')
chunk=log.split('### Result',1)[1].lstrip()
data=json.JSONDecoder().raw_decode(chunk)[0]
if isinstance(data,str):data=json.loads(data)
(folder/'browser-audit.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
rows=[]
def nodes(value):
 if isinstance(value,list):
  for item in value:yield from nodes(item)
 elif isinstance(value,dict):
  if '@type' in value:yield value
  for item in value.values():
   if isinstance(item,(dict,list)):yield from nodes(item)
for row in data['results']:
 r=row.get('rendered',{});raw=row.get('raw',{})
 schema=[n for s in r.get('schema',[]) for n in nodes(s.get('data',{}))]
 summary={'url':row['url'],'http':row.get('status'),'final':r.get('url'),'rawH1':len(raw.get('h1',[])),'h1':len(r.get('h1',[])),'title':r.get('title'),'rawCanonical':' | '.join(raw.get('canonical',[])),'canonical':' | '.join(r.get('canonical',[])),'descriptionCount':len(r.get('description',[])),'robots':' | '.join(r.get('robots',[])),'links':len(r.get('links',[])),'schemaTypes':sorted(set(str(n['@type']) for n in schema)),'schemaErrors':sum('error' in s for s in r.get('schema',[])),'error':row.get('error')}
 rows.append(summary)
with (folder/'url-render-comparison.csv').open('w',encoding='utf-8-sig',newline='') as f:
 w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)
lh=[]
for file in folder.glob('lighthouse-*.json'):
 d=json.loads(file.read_text(encoding='utf-8'))
 a=d.get('audits',{})
 failed=[{'id':k,'title':v['title'],'score':v.get('score'),'value':v.get('displayValue'),'details':v.get('details')} for k,v in a.items() if v.get('score') is not None and v['score']<1 and any(k in c['auditRefs'][i]['id'] for c in d.get('categories',{}).values() for i in range(len(c.get('auditRefs',[])))) ]
 lh.append({'file':file.name,'url':d.get('finalDisplayedUrl',d.get('finalUrl')),'fetchTime':d.get('fetchTime'),'version':d.get('lighthouseVersion'),'runtimeError':d.get('runtimeError'),'config':d.get('configSettings'),'scores':{k:round(v['score']*100) if v['score'] is not None else None for k,v in d.get('categories',{}).items()},'metrics':{k:{'value':a.get(k,{}).get('numericValue'),'display':a.get(k,{}).get('displayValue')} for k in ['first-contentful-paint','largest-contentful-paint','total-blocking-time','cumulative-layout-shift','speed-index']},'failedAudits':failed})
summary={'count':len(rows),'sitemapCount':len(data['sitemap']['urls']),'errors':[r for r in rows if r['error']],'rows':rows,'mobile':data['mobile'],'lighthouse':lh}
(folder/'summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'count':len(rows),'sitemap':len(data['sitemap']['urls']),'errors':summary['errors'],'metadata':rows,'mobile':data['mobile'],'lighthouse':[{k:v for k,v in d.items() if k not in ['failedAudits','config']} for d in lh]},ensure_ascii=False))
