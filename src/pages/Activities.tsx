import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { Coffee, Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '../shared/Calendar';
import { useAuthStore } from '../stores/authStore';
import { api } from '../api/api';
import { Modal } from '../shared/Modal';
import { ActivitySummary } from '../shared/ActivitySummary';
import { TasksCard } from '../shared/TasksCard';
import { Upload } from '../shared/Upload';
import { MeetingRequestsList } from '../components/MeetingRequestsList';

export function Activities() {
  const [view, setView] = useState<'calendar' | 'requests'>('calendar');
  const [activeTab, setActiveTab] = useState<'onetoone' | 'visitors' | 'ceu'>('onetoone');
  const { user } = useAuthStore();
  const [calendarEvents, setCalendarEvents] = useState<Array<{ date: string; type: 'one_to_one' | 'visitor' | 'education' | 'meeting' }>>([]);
  const [openOneToOne, setOpenOneToOne] = useState(false);
  const [partnerOptions, setPartnerOptions] = useState<any[]>([]);
  const [partnerSearch, setPartnerSearch] = useState('');
  const [showPartnerDropdown, setShowPartnerDropdown] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState('');

  useEffect(() => {
    if (!user) return;
    const fetchPartners = async () => {
      try {
        const partnersMap = new Map();

        // Get User Groups
        const myGroups = await api.getUserGroups(user.id);
        for (const group of myGroups) {
          const members = await api.getGroupMembers(group.id);
          members.forEach((m: any) => {
            if (m.id !== user.id) partnersMap.set(m.id, m);
          });
        }
        // Get Power Teams
        try {
          const myPowerTeams = await api.getUserPowerTeams(user.id);
          for (const team of myPowerTeams) {
            const members = await api.getPowerTeamMembers(team.id);
            members.forEach((m: any) => {
              if (m.id !== user.id) partnersMap.set(m.id, m);
            });
          }
        } catch (e) { console.error('Lonca fetch error:', e); }

        setPartnerOptions(Array.from(partnersMap.values()));
      } catch (e) {
        console.error(e);
      }
    };
    fetchPartners();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // 1. Generate Recurring Weekly Meetings (Client-side logic)
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const meetings = [];

    // Generate for current month + next 2 months
    for (let m = month - 1; m <= month + 2; m++) {
      const currentYear = year + Math.floor(m / 12);
      const currentMonth = m % 12;
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(currentYear, currentMonth, d);
        // Weekly Meeting on Tuesday (2)
        if (date.getDay() === 2) {
          meetings.push({
            date: date.toISOString().split('T')[0],
            type: 'meeting',
            title: 'Haftalık E4N Toplantısı (07:00)'
          });
        }
      }
    }

    // 2. Fetch Real Calendar Data from Backend
    const fetchCalendar = async () => {
      try {
        const apiEvents = await api.getCalendar(user.id);

        // Transform API events to Calendar format if needed
        // Backend returns: { start_at, type, title, ... }
        // Calendar component expects: { date: string, type: ..., title: ... }

        const realEvents = apiEvents.map((e: any) => ({
          date: new Date(e.start_at).toISOString().split('T')[0],
          type: e.type,
          title: e.title
        }));

        // Merge with weekly meetings
        setCalendarEvents([...meetings, ...realEvents] as any);
      } catch (e) {
        console.error(e);
        setCalendarEvents(meetings as any);
      }
    };

    fetchCalendar();
  }, [user, user?.id]); // Re-fetch when user changes

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Aktiviteler</h1>
          <div className="flex space-x-2">
            <div className="bg-white p-1 rounded-lg border shadow-sm flex space-x-1">
              <button
                onClick={() => setView('calendar')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${view === 'calendar' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Takvim
              </button>
              <button
                onClick={() => setView('requests')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${view === 'requests' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Toplantı Talepleri
              </button>
            </div>
            <Button variant="primary" onClick={() => setOpenOneToOne(true)}>
              <Coffee className="h-4 w-4 mr-2" />
              Birebir Görüşme
            </Button>
          </div>
        </div>

        <div className="w-full h-[calc(100vh-180px)] overflow-y-auto no-scrollbar">
          <div className="w-full">
            {view === 'calendar' && (
              <Card className="mb-2">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CalendarIcon className="h-5 w-5 mr-2 text-indigo-600" />
                    Takvim
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="w-full">
                    <Calendar events={calendarEvents} />
                  </div>
                </CardContent>
              </Card>
            )}

            {view === 'requests' && (
              <MeetingRequestsList />
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3">
          <Card>
            <CardHeader>
              <CardTitle>İşlem Geçmişi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[420px] overflow-y-auto">
                <ActivitySummary />
              </div>
            </CardContent>
          </Card>

          <TasksCard />
        </div>

        <Modal open={openOneToOne} title="Yeni Birebir Görüşme" onClose={() => setOpenOneToOne(false)}>
          <form className="space-y-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Katılımcı Üye</label>

              {/* Click outside handler */}
              {showPartnerDropdown && (
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowPartnerDropdown(false)}
                ></div>
              )}

              <div className="relative z-20">
                <Input
                  type="text"
                  placeholder="İsim veya meslek ile ara..."
                  value={partnerSearch}
                  onChange={(e) => {
                    setPartnerSearch(e.target.value);
                    setShowPartnerDropdown(true);
                  }}
                  onFocus={() => setShowPartnerDropdown(true)}
                  className="w-full"
                />
                {showPartnerDropdown && (
                  <div className="absolute z-30 w-full mt-1 bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                    {partnerOptions.filter(p =>
                      (p.full_name || p.name).toLowerCase().includes(partnerSearch.toLowerCase()) ||
                      (p.profession || '').toLowerCase().includes(partnerSearch.toLowerCase())
                    ).length > 0 ? (
                      partnerOptions
                        .filter(p =>
                          (p.full_name || p.name).toLowerCase().includes(partnerSearch.toLowerCase()) ||
                          (p.profession || '').toLowerCase().includes(partnerSearch.toLowerCase())
                        )
                        .map((partner) => (
                          <div
                            key={partner.id}
                            className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-indigo-50"
                            onClick={() => {
                              setPartnerSearch(`${partner.full_name || partner.name} - ${partner.profession}`);
                              setSelectedPartnerId(partner.id);
                              setShowPartnerDropdown(false);
                            }}
                          >
                            <div className="flex items-center">
                              <span className="font-medium block truncate text-gray-900">
                                {partner.full_name || partner.name}
                              </span>
                              <span className="ml-2 text-gray-500 text-xs">
                                {partner.profession}
                              </span>
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="cursor-default select-none relative py-2 pl-3 pr-9 text-gray-500 italic">
                        Sonuç bulunamadı.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Tarih</label>
                <Input type="date" className="mt-1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Süre (saat)</label>
                <Input type="number" step="0.5" min="0.5" className="mt-1" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Lokasyon</label>
              <Input type="text" placeholder="Toplantı yerini girin..." className="mt-1" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Notlar</label>
              <textarea rows={3} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Toplantı notlarınız..." />
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" variant="primary">Oluştur</Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}
