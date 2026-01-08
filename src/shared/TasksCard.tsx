import { Card, CardContent, CardHeader, CardTitle } from './Card'
import { CheckCircle2, Circle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useReferralStore } from '../stores/referralStore'
import { api } from '../api/api'

interface ViewTask {
  id: string
  title: string
  period: 'weekly' | 'monthly'
  effect: number
  completed: boolean
}

export function TasksCard() {
  const { user } = useAuthStore()
  const { referrals, fetchReferrals } = useReferralStore()
  const [calendarEvents, setCalendarEvents] = useState<Array<{ date: string; type: 'one_to_one' | 'visitor' | 'education' | 'meeting' }>>([])

  useEffect(() => {
    if (user?.id) {
      fetchReferrals(user.id)
      api.getCalendar(user.id)
        .then((rows) => {
          const mapped = (rows || []).map((r: any) => ({ date: new Date(r.start_at).toISOString().split('T')[0], type: (r.type || 'meeting') }))
          setCalendarEvents(mapped)
        })
        .catch(() => setCalendarEvents([]))
    }
  }, [user?.id, fetchReferrals])

  const metrics = useMemo(() => {
    const now = new Date()
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const weeklyReferrals = referrals.filter((r: any) => {
      const d = new Date(r.createdAt || r.created_at)
      return d >= weekStart
    }).length

    const weeklyOneToOnes = calendarEvents.filter(e => e.type === 'one_to_one' && new Date(e.date) >= weekStart).length

    const monthlyVisitors = calendarEvents.filter(e => e.type === 'visitor' && new Date(e.date) >= monthStart).length

    // Eğitim saatleri ileride saat bazlı ölçüme geçirilecektir.
    const monthlyEducation = calendarEvents.filter(e => e.type === 'education' && new Date(e.date) >= monthStart).length

    return { weeklyReferrals, weeklyOneToOnes, monthlyVisitors, monthlyEducation }
  }, [referrals, calendarEvents])

  const items: ViewTask[] = [
    {
      id: 'weekly-ref-2',
      title: 'Haftalık: 2 yönlendirme',
      period: 'weekly',
      effect: 6,
      completed: metrics.weeklyReferrals >= 2,
    },
    {
      id: 'weekly-1to1-1',
      title: 'Haftalık: 1 birebir görüşme',
      period: 'weekly',
      effect: 5,
      completed: metrics.weeklyOneToOnes >= 1,
    },
    {
      id: 'monthly-visitor-2',
      title: 'Aylık: 2 ziyaretçi',
      period: 'monthly',
      effect: 4,
      completed: metrics.monthlyVisitors >= 2,
    },
    {
      id: 'monthly-edu-4',
      title: 'Aylık: 4 eğitim (saat)',
      period: 'monthly',
      effect: 5,
      completed: metrics.monthlyEducation >= 4,
    },
  ]

  return (
    <Card>
      <CardHeader className="bg-gradient-to-r from-indigo-50 via-cyan-50 to-purple-50 border-b">
        <CardTitle className="text-lg">Görevler</CardTitle>
        <p className="text-sm text-gray-600">Başarımla puana otomatik yansır; görevler görünür kalır</p>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className={`flex items-center justify-between p-3 rounded-lg border ${item.completed ? 'border-green-200 bg-green-50' : (item.period === 'weekly' ? 'border-indigo-200 bg-indigo-50' : 'border-purple-200 bg-purple-50')}`}>
              <div className="flex items-center">
                {item.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
                ) : (
                  <Circle className={`h-5 w-5 mr-2 ${item.period === 'weekly' ? 'text-indigo-500' : 'text-purple-500'}`} />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.title}</p>
                  <p className={`text-xs ${item.period === 'weekly' ? 'text-indigo-700' : 'text-purple-700'}`}>{item.period === 'weekly' ? 'Haftalık' : 'Aylık'}</p>
                </div>
              </div>
              <span className={`text-xs ${item.completed ? 'text-green-700' : (item.period === 'weekly' ? 'text-indigo-700' : 'text-purple-700')}`}>+{item.effect} puan</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

export default TasksCard
