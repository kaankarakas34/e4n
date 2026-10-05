import { useMemo, useState } from 'react'
import { ChevronsLeft, ChevronsRight, Dot } from 'lucide-react'
import { calendarDay, calendarGrid } from '../utils/calendarDates'

type CalendarEventType = 'one_to_one' | 'visitor' | 'education' | 'meeting'

interface CalendarEvent {
  date: string
  type: CalendarEventType
  title?: string
}

interface CalendarProps {
  events?: CalendarEvent[]
  onSelectDate?: (date: string) => void
  month?: Date
  onMonthChange?: (date: Date) => void
  selectedDate?: string
}

export function Calendar({ events = [], onSelectDate, month, onMonthChange, selectedDate }: CalendarProps) {
  const today = new Date()
  const [internalMonth, setCurrent] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const current = month ?? internalMonth
  const [selected, setSelected] = useState<string>('')

  const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
  const weekdays = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cts', 'Paz']

  const eventMap = useMemo(() => {
    const m = new Map<string, CalendarEvent[]>()
    events.forEach(e => {
      const k = /^\d{4}-\d{2}-\d{2}$/.test(e.date) ? e.date : calendarDay(new Date(e.date))
      const arr = m.get(k) || []
      arr.push(e)
      m.set(k, arr)
    })
    return m
  }, [events])

  const grid = useMemo(() => calendarGrid(current), [current])
  const changeMonth = (offset: number) => {
    const next = new Date(current.getFullYear(), current.getMonth() + offset, 1)
    setCurrent(next); onMonthChange?.(next)
  }
  const goPrev = () => changeMonth(-1)
  const goNext = () => changeMonth(1)

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
        <button aria-label="Önceki ay" onClick={goPrev} className="p-2 rounded hover:bg-indigo-100">
          <ChevronsLeft className="h-4 w-4 text-indigo-700" />
        </button>
        <div className="text-sm font-medium text-indigo-900">{months[current.getMonth()]} {current.getFullYear()}</div>
        <button aria-label="Sonraki ay" onClick={goNext} className="p-2 rounded hover:bg-indigo-100">
          <ChevronsRight className="h-4 w-4 text-indigo-700" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {weekdays.map(w => (
          <div key={w} className="bg-white text-xs text-gray-600 font-medium px-2 py-2 text-center">{w}</div>
        ))}
        {grid.map((cell, idx) => {
          const isToday = cell.dateStr === calendarDay(today)
          const dayEvents = eventMap.get(cell.dateStr) || []
          const isSelected = (selectedDate ?? selected) === cell.dateStr
          return (
            <div key={idx} className="relative group">
              <button
                aria-label={cell.dateStr}
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
                  <div className="text-xs font-medium text-gray-900 mb-2">{cell.dateStr.split('-').reverse().join('.')}</div>
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
