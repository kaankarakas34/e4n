import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import { Button } from '../shared/Button';

import { Coffee, Calendar as CalendarIcon } from 'lucide-react';
import { WebCalendarPanel } from '../components/WebCalendarPanel';
import { useAuthStore } from '../stores/authStore';

import { ActivitySummary } from '../shared/ActivitySummary';
import { TasksCard } from '../shared/TasksCard';

import { MeetingRequestsList } from '../components/MeetingRequestsList';
import { ActivityRecordForm } from '../components/ActivityRecordForm';

import { Referrals } from './Referrals';
import { UserEvents } from './UserEvents';

export function Activities() {
  const [activeTab, setActiveTab] = useState<'overview' | 'referrals' | 'events' | 'requests'>('overview');
  const { user } = useAuthStore();
  const [openOneToOne, setOpenOneToOne] = useState(false);
  const [revision, setRevision] = useState(0);
  const context = `${user?.id}:${user?.role}`;
  useEffect(() => { setOpenOneToOne(false); }, [context]);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Sticky Top Navigation */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b shadow-sm transition-all duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-900">Aktivite Merkezi</h1>
            <div className="flex flex-wrap gap-3 items-center">
              <div className="bg-gray-100 p-1 rounded-lg border flex space-x-1 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'overview' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'}`}
                >
                  Genel Bakış
                </button>
                <button
                  onClick={() => setActiveTab('referrals')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'referrals' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'}`}
                >
                  Yönlendirmeler
                </button>
                <button
                  onClick={() => setActiveTab('events')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'events' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'}`}
                >
                  Etkinlikler
                </button>
                <button
                  onClick={() => setActiveTab('requests')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'requests' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'}`}
                >
                  Toplantı Talepleri
                </button>
              </div>
              <Button variant="primary" size="sm" onClick={() => setOpenOneToOne(true)}>
                <Coffee className="h-4 w-4 mr-2" />
                Birebir Görüşme
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full">

        {activeTab === 'referrals' ? (
          <Referrals />
        ) : activeTab === 'events' ? (
          <UserEvents />
        ) : activeTab === 'requests' ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <MeetingRequestsList />
          </div>
        ) : (
          /* Overview */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card className="mb-2">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CalendarIcon className="h-5 w-5 mr-2 text-indigo-600" />
                      Takvim
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="w-full">
                      <WebCalendarPanel refreshVersion={revision} />
                    </div>
                  </CardContent>
                </Card>

                {/* Added Events Card to Overview for visibility */}
                <Card>
                  <CardHeader>
                    <CardTitle>Yaklaşan Etkinlikler</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <UserEvents />
                  </CardContent>
                </Card>

                <TasksCard />
              </div>
              <div className="space-y-6">
                <div className="max-h-[800px] overflow-y-auto">
                  <ActivitySummary refreshVersion={revision} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <ActivityRecordForm open={openOneToOne} onClose={()=>setOpenOneToOne(false)} onSaved={()=>setRevision(value=>value+1)} />
    </div>
  );
}
