async (page) => {
  if (await page.getByRole('alert').count()) throw new Error('Report error still visible after retry');
  await page.getByRole('heading', { name: 'Yönetici Raporları', exact: true }).waitFor();
  await page.getByRole('heading', { name: 'Veri yok', exact: true }).waitFor();
  if (await page.getByText('78.5', { exact: true }).count()) throw new Error('Demo score still visible');
  if (!await page.getByText('₺0', { exact: true }).count()) throw new Error('Actual zero revenue missing');
  const sizes = await page.evaluate(() => ({
    viewport: innerWidth,
    page: document.documentElement.scrollWidth,
    charts: Array.from(document.querySelectorAll('.recharts-responsive-container')).map(element => {
      const { width, height } = element.getBoundingClientRect();
      return { width, height };
    }),
  }));
  if (sizes.page > sizes.viewport) throw new Error('Horizontal page overflow');
  if (sizes.charts.length !== 0) throw new Error('Unavailable charts should not render a series');
  if (await page.getByText('Veri yok', { exact: true }).count() !== 3) throw new Error('Unavailable chart labels missing');
  return { retry: 'passed', realZero: 'passed', unavailableScore: 'passed', sizes };
}
