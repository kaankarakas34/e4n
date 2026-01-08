import { useMemo, useState } from 'react'
import { ChevronsLeft, ChevronsRight, Dot } from 'lucide-react'

type CalendarEventType = 'one_to_one' | 'visitor' | 'education' | 'meeting'

interface CalendarEvent {
  date: string
  type: CalendarEventType
  title?: string
}

interface CalendarProps {
  events?: CalendarEvent[]
  onSelectDate?: (date: string) => void
}

export function Calendar({ events = [], onSelectDate }: CalendarProps) {
  const today = new Date()
  const [current, setCurrent] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selected, setSelected] = useState<string>('')

  const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
  const weekdays = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cts', 'Paz']

  const eventMap = useMemo(() => {
    const m = new Map<string, CalendarEvent[]>()
    events.forEach(e => {
      const k = e.date.split('T')[0]
      const arr = m.get(k) || []
      arr.push(e)
      m.set(k, arr)
    })
    return m
  }, [events])

  const grid = useMemo(() => {
    const year = current.getFullYear()
    const month = current.getMonth()
    const first = new Date(year, month, 1)
    const last = new Date(year, month + 1, 0)
    const startIdx = ((first.getDay() + 6) % 7)
    const totalDays = last.getDate()
    const cells: { dateStr: string; day: number; inMonth: boolean }[] = []
    for (let i = 0; i < startIdx; i++) {
      const d = new Date(year, month, -startIdx + i + 1)
      cells.push({ dateStr: d.toISOString().split('T')[0], day: d.getDate(), inMonth: false })
    }
    for (let d = 1; d <= totalDays; d++) {
      const cur = new Date(year, month, d)
      cells.push({ dateStr: cur.toISOString().split('T')[0], day: d, inMonth: true })
    }
    while (cells.length % 7 !== 0) {
      const next = new Date(year, month, totalDays + (cells.length - startIdx) + 1)
      cells.push({ dateStr: next.toISOString().split('T')[0], day: next.getDate(), inMonth: false })
    }
    return cells
  }, [current])

  const goPrev = () => setCurrent(new Date(current.getFullYear(), current.getMonth() - 1, 1))
  const goNext = () => setCurrent(new Date(current.getFullYear(), current.getMonth() + 1, 1))

  const colorFor = (type: CalendarEventType) => {
    if (type === 'one_to_one') return 'text-purple-600'
    if (type === 'visitor') return 'text-green-600'
    if (type === 'meeting') return 'text-cyan-600'
    return 'text-indigo-600'
  }

  const colorBgFor = (type: CalendarEventType) => {
    if (type === 'one_to_one') return 'bg-purple-600'
    if (type === 'visitor') return 'bg-green-600'
    if (type === 'meeting') return 'bg-cyan-600'
    return 'bg-indigo-600'
  }

  const labelFor = (type: CalendarEventType) => {
    if (type === 'one_to_one') return 'Birebir'
    if (type === 'visitor') return 'Ziyaretçi'
    if (type === 'meeting') return 'Toplantı'
    return 'Eğitim'
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-indigo-50 border-b">
        <button onClick={goPrev} className="p-2 rounded hover:bg-indigo-100">
          <ChevronsLeft className="h-4 w-4 text-indigo-700" />
        </button>
        <div className="text-sm font-medium text-indigo-900">{months[current.getMonth()]} {current.getFullYear()}</div>
        <button onClick={goNext} className="p-2 rounded hover:bg-indigo-100">
          <ChevronsRight className="h-4 w-4 text-indigo-700" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {weekdays.map(w => (
          <div key={w} className="bg-white text-xs text-gray-600 font-medium px-2 py-2 text-center">{w}</div>
        ))}
        {grid.map((cell, idx) => {
          const isToday = cell.dateStr === today.toISOString().split('T')[0]
          const dayEvents = eventMap.get(cell.dateStr) || []
          const isSelected = selected === cell.dateStr
          return (
            <div key={idx} className="relative group">
              <button
                onClick={() => { setSelected(cell.dateStr); onSelectDate && onSelectDate(cell.dateStr) }}
                className={`bg-white px-2 py-3 text-center w-full ${cell.inMonth ? 'text-gray-900' : 'text-gray-400'} ${isSelected ? 'ring-2 ring-indigo-500' : ''}`}
              >
                <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${isToday ? 'bg-indigo-100 text-indigo-700' : ''}`}>{cell.day}</div>
                <div className="flex items-center justify-center gap-1 mt-2">
                  {dayEvents.slice(0, 4).map((e, i) => (
                    <div key={i} className={`h-1.5 w-1.5 rounded-full ${colorBgFor(e.type)}`} />
                  ))}
                </div>
              </button>
              {dayEvents.length > 0 && (
                <div className="absolute z-30 hidden group-hover:block -top-2 left-1/2 -translate-x-1/2 -translate-y-full w-56 bg-white border rounded-md shadow-lg p-3">
                  <div className="text-xs font-medium text-gray-900 mb-2">{new Date(cell.dateStr).toLocaleDateString('tr-TR')}</div>
                  <ul className="space-y-1 max-h-40 overflow-y-auto">
                    {dayEvents.map((e, i) => (
                      <li key={i} className="flex items-center text-xs text-gray-700">
                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${colorBgFor(e.type)}`}></span>
                        <span>{labelFor(e.type)}{e.title ? `: ${e.title}` : ''}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Calendar
