async (page) => {
  let statsRequests = 0;
  await page.context().unroute('**/*');
  await page.context().route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin === 'http://127.0.0.1:5178') return route.continue();
    if (url.origin !== 'http://localhost:4005') return route.abort();
    if (route.request().headers().authorization !== 'Bearer fixture-admin-token') {
      return route.fulfill({ status: 401, contentType: 'application/json', body: '{}' });
    }
    const data = {
      '/api/reports/stats': { totalRevenue: 0, totalMembers: 0 },
      '/api/reports/charts': { revenue: [], growth: [], availability: { revenue: false, growth: false } },
      '/api/groups': [],
      '/api/reports/traffic-lights': [],
      '/api/reports/attendance-stats': [],
    };
    if (!(url.pathname in data)) return route.abort();
    if (url.pathname === '/api/reports/stats' && ++statsRequests === 1) {
      return route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"fixture unavailable"}' });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data[url.pathname]) });
  });
  await page.addInitScript(() => localStorage.setItem('auth-storage', JSON.stringify({ state: { token: 'fixture-admin-token' } })));
  await page.goto('http://127.0.0.1:5178/test/admin-reports-browser.html');
}
