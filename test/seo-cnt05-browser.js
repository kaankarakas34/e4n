async (page) => {
 const base = new URL(page.url()).origin;
 const local = new URL(base).hostname === '127.0.0.1';
 const paths = ['/business-networking', '/is-cevresi-nasil-genisletilir', '/profesyonel-is-agi-nasil-kurulur', '/networking-neden-kartvizit-toplamak-degildir', '/networking-ile-satis-arasindaki-fark'];
 const errors = [], rows = [], journeys = [];
 page.on('pageerror', error => errors.push(String(error)));
 if (local) {
  await page.route('**/*.supabase.co/**', route => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await page.route(base + '/api/blogs/public*', route => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
 }
 for (const width of [320, 390, 768, 1440]) {
  await page.setViewportSize({ width, height: 900 });
  for (const path of paths) {
   const raw = await page.request.get(base + path, { maxRedirects: 0 });
   if (raw.status() !== 200) throw Error('Guide must return 200 without redirect: ' + path + ' ' + raw.status());
   await page.goto(base + path, { waitUntil: 'networkidle' });
   await page.locator('main h1').waitFor({ state: 'visible' });
   const row = await page.evaluate(() => {
    const graph = [...document.querySelectorAll('script[type="application/ld+json"]')].flatMap(node => JSON.parse(node.textContent)['@graph'] || []);
    return {
     path: location.pathname, width: innerWidth, title: document.title,
     canonical: [...document.querySelectorAll('link[rel=canonical]')].map(node => node.href),
     h1: document.querySelectorAll('h1').length, descriptions: document.querySelectorAll('meta[name=description]').length,
     overflow: document.documentElement.scrollWidth > innerWidth + 1,
     article: graph.find(node => node['@type'] === 'Article'),
     links: [...document.querySelectorAll('nav[aria-label="Networking rehberleri"] a')].map(node => node.getAttribute('href')),
     smallestLinkHeight: Math.min(...[...document.querySelectorAll('nav[aria-label="Networking rehberleri"] a')].map(node => node.getBoundingClientRect().height)),
     heroLinks: [...document.querySelectorAll('main section:first-of-type a')].map(node => { const style = getComputedStyle(node); return { color: style.color, background: style.backgroundColor }; }),
    };
   });
   if (row.path !== path || row.h1 !== 1 || row.descriptions !== 1 || row.overflow || row.canonical.length !== 1 || row.canonical[0] !== 'https://www.event4network.com' + path) throw Error('Rendered guide mismatch: ' + JSON.stringify(row));
   if (row.article?.mainEntityOfPage !== row.canonical[0] || row.article?.dateModified !== '2026-10-28') throw Error('Article schema mismatch: ' + path);
   if (paths.filter(target => target !== path).some(target => !row.links.includes(target)) || row.smallestLinkHeight < 44) throw Error('Cluster links missing or too small: ' + path);
   if (row.heroLinks.some(link => link.color === link.background)) throw Error('Invisible hero link: ' + path);
   rows.push(row);
   if (width === 390 && path === paths[0]) {
    await page.screenshot({ path: 'output/playwright/seo-cnt05-' + (local ? 'local' : 'live') + '-mobile.png', fullPage: true });
    await page.screenshot({ path: 'output/playwright/seo-cnt05-' + (local ? 'local' : 'live') + '-hero.png' });
   }
  }
 }
 await page.goto(base + '/blog', { waitUntil: 'networkidle' });
 await page.getByRole('navigation', { name: 'Networking rehberleri', exact: true }).getByRole('link', { name: 'Business Networking Nedir?', exact: false }).click();
 await page.waitForURL(base + paths[0]);
 journeys.push('Rehber index → pillar');
 await page.getByRole('navigation', { name: 'Networking rehberleri', exact: true }).getByRole('link', { name: 'Profesyonel İş Ağı Nasıl Kurulur?', exact: false }).click();
 await page.waitForURL(base + paths[2]);
 await page.getByRole('navigation', { name: 'Networking rehberleri', exact: true }).getByRole('link', { name: 'Business Networking Nedir?', exact: false }).click();
 await page.waitForURL(base + paths[0]);
 journeys.push('pillar → support → pillar (client navigation)');
 const keyboardLink = page.getByRole('navigation', { name: 'Networking rehberleri', exact: true }).getByRole('link').first();
 await keyboardLink.focus();
 await page.keyboard.press('Enter');
 await page.waitForURL(base + paths[1]);
 journeys.push('Focused guide link → Enter → support');
 for (const path of paths) {
  await page.goto(base + path, { waitUntil: 'networkidle' });
  await page.locator('main a[href="/uyelik"]').first().click();
  await page.waitForURL(base + '/uyelik');
  await page.locator('main h1').waitFor({ state: 'visible' });
  journeys.push(path + ' → membership');
 }
 if (errors.length) throw Error('Browser errors: ' + JSON.stringify(errors));
 return { base, rows, journeys, errors, scope: local ? 'Local production build, read-only API fixtures, no DB or forms submitted' : 'Anonymous live pages, navigation only, no DB mutations or forms submitted' };
}
