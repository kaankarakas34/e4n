import { useNavigate } from 'react-router-dom';
import { VisitorForm } from '../components/VisitorForm';

import { useEffect, useState } from 'react';
import { Button } from '../shared/Button';
import { Logo } from '../shared/Logo';
import { ArrowRight, CheckCircle, Users, BarChart, Calendar, Trophy, MapPin, ExternalLink } from 'lucide-react';
import processMeeting from '../assets/process-meeting.png';
import { api } from '../api/api';

interface GroupStat {
    id: string;
    name: string;
    turnover: number;
    member_count: number;
}

interface PublicEvent {
    id: string;
    title: string;
    description: string;
    start_at: string;
    location: string;
}

export function LandingPage() {
    const navigate = useNavigate();
    const [groups, setGroups] = useState<GroupStat[]>([]);
    const [events, setEvents] = useState<PublicEvent[]>([]);

    useEffect(() => {
        // Fetch groups and events
        api.getGroups().then((data: any) => setGroups(data.slice(0, 4))).catch(() => { });
        api.getEvents().then((data: any) => {
            const publicEvents = data.filter((e: any) => e.is_public).slice(0, 3);
            setEvents(publicEvents);
        }).catch(() => { });
    }, []);

    const processes = [
        {
            icon: <Users className="h-8 w-8 text-red-600" />,
            title: "Başvuru ve Tanışma",
            description: "Online form üzerinden başvurunuzu yapın. Size en yakın grupla tanışmanız için davet edileceksiniz."
        },
        {
            icon: <CheckCircle className="h-8 w-8 text-red-600" />,
            title: "Mülakat ve Kabul",
            description: "Grup liderleri ile yapacağınız görüşme sonrası, sektörünüzde tek olma kuralına uygunluğunuz değerlendirilir."
        },
        {
            icon: <Calendar className="h-8 w-8 text-red-600" />,
            title: "Oryantasyon ve Eğitim",
            description: "Kabul sonrası sistemin işleyişini ve networking stratejilerini öğreneceğiniz kapsamlı bir eğitim alırsınız."
        },
        {
            icon: <BarChart className="h-8 w-8 text-red-600" />,
            title: "İş Birliği ve Büyüme",
            description: "Haftalık toplantılar ve düzenli etkinliklerle iş ağınızı genişletir, nitelikli referanslar alırsınız."
        }
    ];

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(value);
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* Header */}
            <header className="fixed w-full bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                            <Logo className="h-10 w-auto" />
                        </div>

                        <nav className="hidden md:flex space-x-8">
                            <a href="#nasil-calisir" className="text-gray-600 hover:text-red-600 font-medium transition-colors">Nasıl Çalışır?</a>
                            <a href="#basarilar" className="text-gray-600 hover:text-red-600 font-medium transition-colors">Başarılar</a>
                            <a href="#etkinlikler" className="text-gray-600 hover:text-red-600 font-medium transition-colors">Etkinlikler</a>
                            <a href="#iletisim" className="text-gray-600 hover:text-red-600 font-medium transition-colors">İletişim</a>
                        </nav>

                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                onClick={() => navigate('/auth/register')}
                                className="hidden md:inline-flex"
                            >
                                Kayıt Ol
                            </Button>
                            <Button
                                variant="primary"
                                onClick={() => navigate('/auth/login')}
                                className="shadow-md hover:shadow-lg shadow-red-200"
                            >
                                Giriş Yap
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
                        <div className="mb-12 lg:mb-0">
                            <div className="inline-flex items-center px-4 py-2 rounded-full bg-red-50 text-red-700 font-medium text-sm mb-6 border border-red-100">
                                🚀 Profesyonel İş Ağı Platformu
                            </div>
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight leading-tight mb-6">
                                İşinizi <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-800">Referanslarla</span> Büyütün
                            </h1>
                            <p className="text-lg text-gray-600 mb-8 leading-relaxed max-w-lg">
                                Event 4 Network, iş sahiplerinin bir araya gelerek birbirlerine iş fırsatları yarattığı, global standartlarda bir networking platformudur.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Button
                                    size="lg"
                                    variant="primary"
                                    onClick={() => navigate('/auth/register')}
                                    className="text-lg px-8 h-14 shadow-xl shadow-red-200"
                                >
                                    Hemen Başvurun <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="text-lg px-8 h-14"
                                >
                                    Detaylı Bilgi
                                </Button>
                            </div>

                            <div className="mt-10 flex items-center gap-6 text-sm text-gray-500">
                                <div className="flex items-center">
                                    <div className="flex -space-x-2 mr-3">
                                        {[1, 2, 3, 4].map((i) => (
                                            <div key={i} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white" />
                                        ))}
                                    </div>
                                    <span>5000+ Üye</span>
                                </div>
                                <div className="h-4 w-px bg-gray-300"></div>
                                <div>₺100M+ İş Hacmi</div>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute -inset-4 bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl blur-2xl opacity-20 animate-pulse"></div>
                            <img
                                src={processMeeting}
                                alt="Business Meeting"
                                className="relative rounded-2xl shadow-2xl border border-gray-100 w-full object-cover transform hover:scale-[1.02] transition-transform duration-500"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works / About Section */}
            <section id="nasil-calisir" className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-red-600 font-semibold tracking-wide uppercase text-sm">Nasıl Çalışır?</h2>
                        <h3 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">Event For Network Nedir?</h3>
                        <p className="mt-6 text-lg text-gray-600 max-w-4xl mx-auto leading-relaxed">
                            <span className="font-bold text-gray-900">Event For Network (EFN)</span>, iş dünyasındaki profesyonelleri ve iş sahiplerini bir araya getiren, hem sosyal etkileşimi hem de ticari iş birliklerini aynı potada eriten yenilikçi bir kuruluştur.
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-16 items-start">
                        {/* Mission Column */}
                        <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 h-full">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-red-100 rounded-xl">
                                    <Users className="h-8 w-8 text-red-600" />
                                </div>
                                <h4 className="text-2xl font-bold text-gray-900">Misyonumuz</h4>
                            </div>
                            <p className="text-gray-600 leading-relaxed mb-6">
                                EFN, "aynı dili konuşan" insanların bir araya geldiği, samimi ve güvene dayalı bir sosyal iş ortamı yaratmayı amaçlar.
                            </p>
                            <p className="text-gray-600 leading-relaxed">
                                Temel hedefimiz, üyelerimizin bu yapı içerisinden ticari ve sosyal anlamda <span className="font-bold text-red-700">maksimum faydayı</span> sağlamalarıdır. Sadece bir iş ağı değil, aynı zamanda güçlü bir sosyal paylaşım platformudur.
                            </p>
                        </div>

                        {/* Principles Column */}
                        <div className="space-y-8">
                            <div>
                                <h4 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                    <Trophy className="h-6 w-6 text-red-600" />
                                    Temel İlkemiz: Fırsat Eşitliği
                                </h4>
                                <p className="text-gray-600 mb-6">
                                    EFN'in en belirleyici özelliklerinden biri <span className="font-bold text-gray-900">Fırsat Eşitliği</span> ilkesidir. Bu ilke, üyelerimize güçlü bir rekabet avantajı sağlamak üzere tasarlanmıştır.
                                </p>
                            </div>

                            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                                <h5 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                                    Tekillik Prensibi
                                </h5>
                                <p className="text-gray-600">
                                    Gruplarımız içerisinde, her bir meslek kolu sadece <span className="font-bold text-gray-900">tek bir kişi</span> tarafından temsil edilir.
                                </p>
                            </div>

                            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                                <h5 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                                    Rekabet Avantajı
                                </h5>
                                <p className="text-gray-600">
                                    Aynı meslekten birden fazla kişinin olmaması, grup içi rekabeti ortadan kaldırır. Bu sayede, o meslek grubuna yönlendirilecek tüm iş potansiyeli ve referanslar doğrudan o üyeye akar.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Group Types Section */}
                    <div className="mt-20">
                        <div className="text-center mb-12">
                            <h3 className="text-2xl font-bold text-gray-900">Grup Yapımız</h3>
                            <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
                                Dinamik ve etkileşimi yüksek bir yapı için iki farklı grup türü sunuyoruz.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Main Groups */}
                            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm relative overflow-hidden group hover:border-red-200 transition-colors">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Users className="h-32 w-32 text-red-600 transform rotate-12" />
                                </div>
                                <div className="relative z-10">
                                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-6">
                                        <Users className="h-6 w-6 text-red-600" />
                                    </div>
                                    <h4 className="text-xl font-bold text-gray-900 mb-4">Ana Gruplar</h4>
                                    <p className="text-gray-600 mb-4">
                                        Genel networking faaliyetlerinin yürütüldüğü, farklı sektörlerden profesyonellerin bulunduğu dinamik gruplardır.
                                    </p>
                                    <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                                        <div className="flex items-start gap-3">
                                            <Calendar className="h-5 w-5 text-red-600 mt-0.5" />
                                            <div>
                                                <span className="block font-bold text-gray-900 text-sm mb-1">4 Ayda Bir Üye Karması</span>
                                                <p className="text-xs text-gray-600 leading-relaxed">
                                                    Ana gruplarımızda her 4 ayda bir üye değişimi (karması) yapılır. Bu dinamik yapı sayesinde yıl boyunca sabit bir kitleyle değil, sürekli yeni kişilerle tanışma ve iş ağınızı katlayarak büyütme fırsatı yakalarsınız.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Loncalar */}
                            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm relative overflow-hidden group hover:border-red-200 transition-colors">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <BarChart className="h-32 w-32 text-blue-600 transform rotate-12" />
                                </div>
                                <div className="relative z-10">
                                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                                        <Users className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <h4 className="text-xl font-bold text-gray-900 mb-4">Loncalar (Lonca Grupları)</h4>
                                    <p className="text-gray-600 mb-4">
                                        Birbirini tamamlayan sektörlerin (örneğin; İnşaat, Mimarlık, Gayrimenkul) bir araya gelerek oluşturduğu özel iş birliği takımlarıdır.
                                    </p>
                                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                                        <div className="flex items-start gap-3">
                                            <Trophy className="h-5 w-5 text-blue-600 mt-0.5" />
                                            <div>
                                                <span className="block font-bold text-gray-900 text-sm mb-1">Odaklı İş Birliği</span>
                                                <p className="text-xs text-gray-600 leading-relaxed">
                                                    Sizinle aynı hedef kitleye hitap eden ancak rakibiniz olmayan sektörlerle yakın temas halinde çalışarak, daha nitelikli ve sonuç odaklı referanslar üretirsiniz.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Group Success Stats Section */}
            <section id="basarilar" className="py-20 bg-gray-900 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-red-500 font-semibold tracking-wide uppercase text-sm">Başarılarımız</h2>
                        <p className="mt-2 text-3xl font-bold sm:text-4xl">Gruplarımızın Yarattığı Ekonomi</p>
                        <p className="mt-4 text-gray-400 max-w-2xl mx-auto">
                            Event 4 Network grupları, üyeleri arasında güçlü iş birlikleri kurarak ticaret hacmini her geçen gün artırıyor.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {groups.map((group) => (
                            <div key={group.id} className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-red-500/50 transition-colors duration-300">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-red-500/10 rounded-lg">
                                        <Trophy className="h-6 w-6 text-red-500" />
                                    </div>
                                    <span className="text-xs font-medium bg-gray-700 px-2.5 py-1 rounded-full text-gray-300">
                                        {group.member_count} Üye
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold mb-2">{group.name}</h3>
                                <div className="space-y-1">
                                    <p className="text-xs text-gray-400">Yaratılan İş Hacmi</p>
                                    <p className="text-2xl font-bold text-white tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                                        {formatCurrency(group.turnover || 0)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Upcoming Events Section */}
            <section id="etkinlikler" className="py-24 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-end mb-12">
                        <div>
                            <h2 className="text-red-600 font-semibold tracking-wide uppercase text-sm">Takvim</h2>
                            <p className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">Yaklaşan Etkinlikler</p>
                        </div>
                        <Button variant="outline" className="hidden sm:flex" onClick={() => navigate('/public-events')}>
                            Tümünü Gör <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {events.map((event) => (
                            <div key={event.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                                <div className="h-2 bg-red-600"></div>
                                <div className="p-6">
                                    <div className="flex items-center text-sm text-gray-500 mb-4 space-x-4">
                                        <div className="flex items-center text-red-600 font-medium bg-red-50 px-3 py-1 rounded-full">
                                            <Calendar className="h-4 w-4 mr-2" />
                                            {new Date(event.start_at).toLocaleDateString()}
                                        </div>
                                        <div className="flex items-center">
                                            <MapPin className="h-4 w-4 mr-1" />
                                            {event.location}
                                        </div>
                                    </div>
                                    <h3 onClick={() => navigate(`/event/${event.id}`)} className="text-xl font-bold text-gray-900 mb-3 cursor-pointer hover:text-red-600 transition-colors">{event.title}</h3>
                                    <p className="text-gray-600 mb-6 line-clamp-2">
                                        {event.description}
                                    </p>
                                    <div className="flex gap-2">
                                        <Button variant="outline" className="flex-1 justify-center" onClick={() => navigate(`/event/${event.id}`)}>
                                            İncele
                                        </Button>
                                        <Button variant="ghost" className="justify-center px-3" onClick={() => navigate('/auth/register')}>
                                            <ExternalLink className="h-4 w-4 text-gray-400 hover:text-red-600 transition-colors" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Process Steps Section */}
            <section id="sürecler" className="py-24 bg-white border-t border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-base font-semibold text-red-600 tracking-wide uppercase">Süreçler</h2>
                        <p className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
                            Platforma Nasıl Katılırsınız?
                        </p>
                        <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
                            Event 4 Network ailesine katılmak ve işinizi büyütmek için izlemeniz gereken adımlar.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {processes.map((step, index) => (
                            <div key={index} className="relative group">
                                <div className="absolute inset-0 bg-white rounded-xl shadow-lg transform transition-transform group-hover:-translate-y-2 duration-300"></div>
                                <div className="relative p-8 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-xl transition-shadow duration-300 h-full">
                                    <div className="w-14 h-14 bg-red-50 rounded-lg flex items-center justify-center mb-6 group-hover:bg-red-600 group-hover:text-white transition-colors duration-300">
                                        <div className="group-hover:text-white transition-colors duration-300">
                                            {step.icon}
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                                    <p className="text-gray-600 leading-relaxed">
                                        {step.description}
                                    </p>
                                </div>
                                {index < processes.length - 1 && (
                                    <div className="hidden lg:block absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 z-10">
                                        <ArrowRight className="h-6 w-6 text-gray-300" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Visitor Form Section */}
            <section id="ziyaretci-ol" className="py-24 bg-gray-50 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="lg:grid lg:grid-cols-12 lg:gap-16 items-center">
                        <div className="lg:col-span-6 mb-12 lg:mb-0">
                            <h2 className="text-red-600 font-semibold tracking-wide uppercase text-sm mb-3">Aramıza Katılın</h2>
                            <h3 className="text-4xl font-extrabold text-gray-900 mb-6 leading-tight">
                                Ziyaretçi Olmak İstiyorum
                            </h3>
                            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                                Event 4 Network toplantılarına misafir olarak katılarak sistemimizi yakından tanıyabilir, iş çevrenizi genişletmek için ilk adımı atabilirsiniz.
                            </p>

                            <div className="space-y-6">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <div className="flex items-center justify-center h-12 w-12 rounded-md bg-red-100 text-red-600">
                                            <Users className="h-6 w-6" />
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <h4 className="text-lg font-medium text-gray-900">Tanışma Toplantısı</h4>
                                        <p className="mt-1 text-gray-500">
                                            Size en yakın grupla tanışın ve işleyişi yerinde gözlemleyin.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <div className="flex items-center justify-center h-12 w-12 rounded-md bg-red-100 text-red-600">
                                            <Trophy className="h-6 w-6" />
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <h4 className="text-lg font-medium text-gray-900">Fırsatları Keşfedin</h4>
                                        <p className="mt-1 text-gray-500">
                                            Sektörünüzde tek olma avantajını ve referans sistemini öğrenin.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-6">
                            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
                                <VisitorForm source="main_page_section" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gray-900 relative overflow-hidden">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-1/2 -right-1/2 w-[1000px] h-[1000px] rounded-full bg-red-900/20 blur-3xl"></div>
                    <div className="absolute -bottom-1/2 -left-1/2 w-[1000px] h-[1000px] rounded-full bg-blue-900/10 blur-3xl"></div>
                </div>
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <h2 className="text-3xl font-extrabold text-white sm:text-4xl mb-6">
                        İşinizi Bir Sonraki Seviyeye Taşıyın
                    </h2>
                    <p className="text-xl text-gray-300 mb-10">
                        Siz de binlerce başarılı iş sahibi arasına katılın. Ücretsiz bilgilendirme toplantımıza davetlisiniz.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Button
                            size="lg"
                            variant="primary"
                            onClick={() => navigate('/auth/register')}
                            className="text-lg h-14 px-10 bg-red-600 hover:bg-red-500"
                        >
                            Hemen Başvurun
                        </Button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 pt-16 pb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                        <div className="col-span-1 md:col-span-1">
                            <Logo className="h-8 w-auto mb-4" />
                            <p className="text-gray-500 text-sm leading-relaxed">
                                Profesyonel iş ağı ve referans yönetim sistemi ile işinizi büyütün.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 mb-4">Platform</h4>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li><a href="#" className="hover:text-red-600">Hakkımızda</a></li>
                                <li><a href="#" className="hover:text-red-600">Süreçler</a></li>
                                <li><a href="#" className="hover:text-red-600">Başarı Hikayeleri</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 mb-4">Kaynaklar</h4>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li><a href="#" className="hover:text-red-600">Blog</a></li>
                                <li><a href="#" className="hover:text-red-600">Sıkça Sorulan Sorular</a></li>
                                <li><a href="#" className="hover:text-red-600">İletişim</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 mb-4">Yasal</h4>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li><a href="#" className="hover:text-red-600">Kullanım Şartları</a></li>
                                <li><a href="#" className="hover:text-red-600">Gizlilik Politikası</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
                        <p>&copy; 2024 Event 4 Network. Tüm hakları saklıdır.</p>
                        <div className="flex space-x-6 mt-4 md:mt-0">
                            {/* Social icons would go here */}
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
