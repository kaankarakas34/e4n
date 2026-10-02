async (page) => {
  await page.route('http://localhost:4005/api/reports/stats', async route => route.fulfill({
    status: route.request().headers().authorization === 'Bearer fixture-admin-token' ? 200 : 401,
    contentType: 'application/json',
    body: JSON.stringify({ totalRevenue: null, totalMembers: 3, internalRevenue: null,
      externalRevenue: null, lostMembers: null, visitorConversionRate: null }),
  }));
  await page.reload();
  await page.getByText('Ciro kırılımı için veri yok', { exact: true }).waitFor();
  await page.getByText('Kayıp üye verisi yok', { exact: true }).waitFor();
  if (await page.getByText('₺0', { exact: true }).count()) throw new Error('Unavailable revenue shown as zero');
  if (await page.getByText('Veri yok', { exact: true }).count() !== 5) throw new Error('Unavailable metric labels missing');
  return { unavailableRevenue: 'passed', unavailableBreakdown: 'passed', unavailableLoss: 'passed', unavailableConversion: 'passed' };
}
