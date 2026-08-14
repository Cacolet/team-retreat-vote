// 2026 年放假调休安排：国办发明电〔2025〕7 号
// https://www.gov.cn/zhengce/zhengceku/202511/content_7047091.htm
const dateRange = (start: string, end: string) => {
  const dates: string[] = []
  const cursor = new Date(`${start}T00:00:00`)
  const last = new Date(`${end}T00:00:00`)

  while (cursor <= last) {
    const year = cursor.getFullYear()
    const month = String(cursor.getMonth() + 1).padStart(2, '0')
    const day = String(cursor.getDate()).padStart(2, '0')
    dates.push(`${year}-${month}-${day}`)
    cursor.setDate(cursor.getDate() + 1)
  }
  return dates
}

const calendar2026 = {
  holidays: [
    ...dateRange('2026-01-01', '2026-01-03'),
    ...dateRange('2026-02-15', '2026-02-23'),
    ...dateRange('2026-04-04', '2026-04-06'),
    ...dateRange('2026-05-01', '2026-05-05'),
    ...dateRange('2026-06-19', '2026-06-21'),
    ...dateRange('2026-09-25', '2026-09-27'),
    ...dateRange('2026-10-01', '2026-10-07'),
  ],
  makeupWorkdays: ['2026-01-04', '2026-02-14', '2026-02-28', '2026-05-09', '2026-09-20', '2026-10-10'],
}

export const officialCalendar: Record<number, { holidays: string[]; makeupWorkdays: string[] }> = {
  2026: calendar2026,
}
