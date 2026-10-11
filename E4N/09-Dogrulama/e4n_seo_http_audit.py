"""Read-only raw HTTP SEO baseline; no browser rendering or analytics claims."""
import concurrent.futures, csv, hashlib, json, re, urllib.request, urllib.error
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
import xml.etree.ElementTree as ET

BASE = 'https://www.event4network.com'
OUT = Path(__file__).parent / 'E4N-SEO-HTTP-2026-10-11'
OUT.mkdir(exist_ok=True)

class HeadParser(HTMLParser):
    def __init__(self):
        super().__init__(); self.title=False; self.t=[]; self.c=[]; self.r=[]; self.h1=0; self.links=0; self.schema=0; self.desc=[]
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if tag=='title': self.title=True
        if tag=='h1': self.h1+=1
        if tag=='a' and a.get('href'): self.links+=1
        if tag=='link' and 'canonical' in a.get('rel','').split(): self.c.append(a.get('href',''))
        if tag=='meta' and a.get('name','').lower()=='robots': self.r.append(a.get('content',''))
        if tag=='meta' and a.get('name','').lower()=='description': self.desc.append(a.get('content',''))
        if tag=='script' and a.get('type')=='application/ld+json': self.schema+=1
    def handle_endtag(self, tag):
        if tag=='title': self.title=False
    def handle_data(self, data):
        if self.title:self.t.append(data)

class Redirects(urllib.request.HTTPRedirectHandler):
    def __init__(self):self.chain=[]
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        self.chain.append({'status':code,'from':req.full_url,'to':newurl})
        return super().redirect_request(req,fp,code,msg,headers,newurl)

def fetch(url):
    h=Redirects(); op=urllib.request.build_opener(h)
    req=urllib.request.Request(url,headers={'User-Agent':'E4N-SEO-Baseline/1.0','Accept':'text/html,application/xml,text/plain,*/*'})
    row={'url':url,'checkedAt':datetime.now(timezone.utc).isoformat()}
    try:
        try:r=op.open(req,timeout=20)
        except urllib.error.HTTPError as e:r=e
        with r:
            data=r.read(2_000_000)
            try:body=data.decode('utf-8');row['validUtf8']=True
            except UnicodeDecodeError:body=data.decode('utf-8',errors='replace');row['validUtf8']=False
            row.update(status=r.code,finalUrl=r.url,contentType=r.headers.get('Content-Type',''),xRobotsTag=r.headers.get('X-Robots-Tag',''),redirects=h.chain,bytes=len(data),sha256=hashlib.sha256(data).hexdigest())
        filename=re.sub(r'[^a-zA-Z0-9]+','_',url.replace('https://','')).strip('_')+'.txt'
        (OUT/filename).write_text(body,encoding='utf-8');row['rawFile']=filename
        (OUT/(filename+'.bin')).write_bytes(data)
        if 'text/html' in row['contentType']:
            p=HeadParser();p.feed(body)
            row.update(title=''.join(p.t),canonical=p.c,robots=p.r,description=p.desc,h1Count=p.h1,anchorCount=p.links,jsonLdCount=p.schema)
        return row,body
    except Exception as e:row['error']=str(e);return row,''

sm,body=fetch(BASE+'/sitemap.xml');results=[sm]
try:
    urls=[x.text for x in ET.fromstring(body).findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
except ET.ParseError:urls=[]
extras=[BASE+p for p in ['/robots.txt','/llms.txt','/ziyaretci-basvurusu','/egitim','/degerlendirme-basvurusu','/public-events','/auth/login','/auth/register','/dashboard','/seo-audit-missing-20261011']]+['https://event4network.com/','http://www.event4network.com/']
targets=list(dict.fromkeys(urls+extras))
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    for row,_ in pool.map(fetch,targets):results.append(row)
report={'scope':'Raw HTTP only; no rendered DOM, GSC, CrUX or authenticated data','sitemapUrlCount':len(urls),'results':results}
(OUT/'baseline.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
fields=['url','status','finalUrl','title','canonical','robots','h1Count','anchorCount','jsonLdCount','error']
with (OUT/'url-inventory.csv').open('w',encoding='utf-8-sig',newline='') as f:
    w=csv.DictWriter(f,fieldnames=fields,extrasaction='ignore');w.writeheader();w.writerows(results)
print(json.dumps({'requests':len(results),'sitemapUrls':len(urls),'errors':sum('error' in r for r in results),'html':sum('h1Count' in r for r in results),'rawHtmlWithH1':sum(r.get('h1Count',0)>0 for r in results),'uniqueHtmlTitles':len({r.get('title') for r in results if 'title'in r}),'missingRoute':next((r for r in results if 'seo-audit-missing' in r['url']),{})},ensure_ascii=False))
