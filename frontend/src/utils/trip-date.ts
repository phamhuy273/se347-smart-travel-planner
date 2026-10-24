export function formatTripDate(value: string) {
  if (!value) return '';
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
    new Date(year, month - 1, day),
  );
}

export function getTripDays(startDate: string, endDate: string) {
  if (!startDate || !endDate || endDate < startDate) return [];
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const days: Date[] = [];
  for (
    let current = start;
    current <= end;
    current = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1)
  ) {
    days.push(current);
  }
  return days;
}