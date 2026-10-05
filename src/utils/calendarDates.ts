export const calendarDay = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export const calendarGrid = (month: Date) => {
  const year = month.getFullYear(), index = month.getMonth();
  const leading = (new Date(year, index, 1).getDay() + 6) % 7;
  const days = new Date(year, index + 1, 0).getDate();
  return Array.from({ length: Math.ceil((leading + days) / 7) * 7 }, (_, i) => {
    const date = new Date(year, index, i - leading + 1);
    return { dateStr: calendarDay(date), day: date.getDate(), inMonth: date.getMonth() === index };
  });
};

export const calendarRange = (month: Date) => {
  const grid = calendarGrid(month);
  const [year, index, day] = grid[0].dateStr.split('-').map(Number);
  return { from: new Date(year, index - 1, day).toISOString(), to: new Date(year, index - 1, day + grid.length).toISOString() };
};
