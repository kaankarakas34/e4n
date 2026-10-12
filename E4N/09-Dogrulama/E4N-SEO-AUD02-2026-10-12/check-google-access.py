import json, urllib.request, urllib.error
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
out=Path('output/playwright/e4n-seo-aud02-2026-10-12')
urls={
 'psi-mobile':'https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https%3A%2F%2Fwww.event4network.com%2F&strategy=mobile&category=performance',
 'gsc-access':'https://search.google.com/search-console?resource_id=https%3A%2F%2Fwww.event4network.com%2F',
}
def fetch(item):
 key,url=item
 try:
  try:r=urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'}),timeout=45)
  except urllib.error.HTTPError as e:r=e
  with r:
   body=r.read().decode('utf-8',errors='replace')
   result={'url':url,'status':r.code,'finalUrl':r.url,'body':body if key.startswith('psi') else None,'loginRequired':'accounts.google.com' in r.url}
 except Exception as e:result={'url':url,'error':str(e)}
 (out/(key+'.json')).write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
 return {k:v for k,v in result.items() if k!='body'}
with ThreadPoolExecutor(max_workers=2) as pool:
 print(json.dumps(list(pool.map(fetch,urls.items())),ensure_ascii=False))
