import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import { Button } from '../shared/Button';

import { Coffee, Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '../shared/Calendar';
import { useAuthStore } from '../stores/authStore';
import { api } from '../api/api';

import { ActivitySummary } from '../shared/ActivitySummary';
import { TasksCard } from '../shared/TasksCard';

import { MeetingRequestsList } from '../components/MeetingRequestsList';
import { ActivityRecordForm } from '../components/ActivityRecordForm';

import { Referrals } from './Referrals';
import { UserEvents } from './UserEvents';

export function Activities() {
  const [activeTab, setActiveTab] = useState<'overview' | 'referrals' | 'events' | 'requests'>('overview');
  const { user } = useAuthStore();
  const [calendarEvents, setCalendarEvents] = useState<Array<{ date: string; type: 'one_to_one' | 'visitor' | 'education' | 'meeting' }>>([]);
  const [openOneToOne, setOpenOneToOne] = useState(false);
  const [revision,setRevision]=useState(0),[calendarError,setCalendarError]=useState<string|null>(null),[calendarLoading,setCalendarLoading]=useState(false);
  const context=`${user?.id}:${user?.role}`,current=useRef(context),sequence=useRef(0);
  current.current=context;
  const [calendarFor,setCalendarFor]=useState<string|null>(null);
  useEffect(()=>{setOpenOneToOne(false);},[context]);

  useEffect(() => {
    if (!user) return;

    // Fetch Real Calendar Data from Backend
    let active=true;const seq=++sequence.current;const valid=()=>active&&current.current===context&&sequence.current===seq;
    const fetchCalendar = async () => {
      setCalendarLoading(true);setCalendarError(null);
      try {
        const apiEvents = await api.getCalendar(user.id);
        if(!Array.isArray(apiEvents)||apiEvents.some((e:any)=>!e||typeof e.start_at!=='string'||!Number.isFinite(Date.parse(e.start_at))||typeof e.type!=='string'))throw new Error('Invalid calendar');
        const realEvents = apiEvents.map((e: any) => ({
          date: (()=>{const value=new Date(e.start_at);return `${value.getFullYear()}-${String(value.getMonth()+1).padStart(2,'0')}-${String(value.getDate()).padStart(2,'0')}`;})(),
          type: e.type,
          title: e.title
        }));
        if(valid())setCalendarEvents(realEvents as any);
      } catch (e) {
        if(valid()){setCalendarEvents([]);setCalendarError('Aktivite takvimi yüklenemedi.');}
      }finally{if(valid()){setCalendarLoading(false);setCalendarFor(context);}
      }
    };

    fetchCalendar();
    return()=>{active=false;};
  }, [context, revision]);

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
                      {calendarLoading||calendarFor!==context?<p role="status">Takvim yükleniyor...</p>:calendarError?<div><p role="alert">{calendarError}</p><Button onClick={()=>setRevision(value=>value+1)}>Takvimi tekrar yükle</Button></div>:<Calendar events={calendarEvents} />}
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
