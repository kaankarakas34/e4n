import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { VisitorForm } from '../components/VisitorForm';

import { useEffect, useState } from 'react';
import { Button } from '../shared/Button';
import { Logo } from '../shared/Logo';
import { ArrowRight, CheckCircle, Users, BarChart, Calendar, Trophy, MapPin, ExternalLink, XCircle, ShieldAlert, AlertCircle, ShieldCheck, Handshake, ChevronDown, ChevronUp, Search, Plus, Minus } from 'lucide-react';
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

const faqs = [
    {
        q: "Event4Network’e kimler katılabilir?",
        a: "Event4Network; şirket sahipleri, girişimciler, danışmanlar, uzmanlar ve B2B hizmet sağlayıcıları için uygundur.\n\nAncak üyelik sürecinde yalnızca meslek veya sektör uygunluğuna bakılmaz. Adayın faaliyet süresi, iş hacmi, hizmet kapasitesi, grup dengesi ve karşılıklı değer üretme potansiyeli de ön değerlendirme görüşmesinde ele alınır."
    },
    {
        q: "Her başvuru kabul ediliyor mu?",
        a: "Hayır. Event4Network seçici bir yapıya sahiptir.\n\nBaşvurular; adayın sektörü, iş yapma biçimi, mevcut grup yapısı, meslek koltuğu uygunluğu ve gruba sağlayabileceği katkılar doğrultusunda değerlendirilir.\n\nBu yaklaşım, grup içindeki güveni, dengeyi ve iş yönlendirme kalitesini korumak için önemlidir."
    },
    {
        q: "Şirketin en az kaç yıldır açık olması gerekiyor?",
        a: "Event4Network’e katılım için adayın belirli bir faaliyet geçmişine ve iş hacmine sahip olması önemlidir.\n\nGenel olarak en az 2 yıldır aktif faaliyet gösteren, belirli bir müşteri portföyü veya hizmet kapasitesi oluşmuş işletmeler daha uygun profil olarak değerlendirilir.\n\nAncak bu kriter tek başına yeterli veya belirleyici değildir. Detaylar ön değerlendirme görüşmesinde adayın sektörü, iş modeli ve grup içindeki potansiyel katkısı üzerinden değerlendirilir."
    },
    {
        q: "Aynı meslekten birden fazla kişi aynı grupta yer alabilir mi?",
        a: "Event4Network’te grup içi rekabeti azaltmak ve üyeler arasında daha sağlıklı referans ilişkileri kurmak için meslek koltuğu sistemine dikkat edilir.\n\nBu nedenle aynı grupta aynı meslek veya doğrudan rakip alanlarda faaliyet gösteren üyelerin çakışmamasına özen gösterilir."
    },
    {
        q: "Meslek koltuğu sistemi nedir?",
        a: "Meslek koltuğu sistemi, her grupta belirli meslek veya sektörlerden sınırlı sayıda kişinin yer almasını ifade eder.\n\nBu sistem sayesinde üyeler, grup içinde doğrudan rakipleriyle değil; birbirini tamamlayabilecek farklı sektörlerden profesyonellerle bir araya gelir.\n\nAmaç, grup içi güveni artırmak ve nitelikli iş yönlendirmelerini daha sağlıklı hale getirmektir."
    },
    {
        q: "Toplantılar ne sıklıkla yapılıyor?",
        a: "Event4Network grupları düzenli olarak bir araya gelir.\n\nGenellikle toplantılar belirli periyotlarla, örneğin ayın belirli haftalarında gerçekleştirilir. Toplantı düzeni, ilgili grubun yapısına ve dönem takvimine göre üyelerle paylaşılır.\n\nDüzenli katılım, üyelerin görünürlüğü ve güven inşası açısından oldukça önemlidir."
    },
    {
        q: "Toplantılar online mı, fiziksel mi?",
        a: "Event4Network’te hem online toplantılar hem de fiziksel buluşmalar yapılabilir.\n\nDüzenli grup toplantıları çoğunlukla online olarak gerçekleştirilebilirken; fiziksel buluşmalar, kahve toplantıları, beyaz yaka etkinlikleri ve farklı platformlarla yapılan iş birlikleri de network sürecinin bir parçasıdır."
    },
    {
        q: "Toplantılara katılım zorunlu mu?",
        a: "Event4Network’te düzenli katılım oldukça önemlidir.\n\nÇünkü networking, yalnızca bir defa görünmekle değil; düzenli olarak tanınmak, hatırlanmak ve güven oluşturmakla sonuç verir.\n\nBu nedenle üyelerin toplantılara mümkün olduğunca düzenli katılması beklenir. Katılım disiplini, hem kişinin kendi görünürlüğü hem de grubun sağlıklı ilerlemesi için önemlidir."
    },
    {
        q: "Birebir toplantılar neden önemli?",
        a: "Birebir toplantılar, Event4Network sisteminin en önemli parçalarından biridir.\n\nGenel toplantılarda insanlar birbirini tanımaya başlar; ancak asıl güven, detaylı tanışma ve iş yönlendirme potansiyeli birebir görüşmelerde oluşur.\n\nKimin kimi tanıdığını, hangi çevrelere ulaşabileceğini ve hangi iş birliklerinin doğabileceğini anlamanın en etkili yolu birebir toplantılardır."
    },
    {
        q: "Event4Network doğrudan müşteri kazandırır mı?",
        a: "Event4Network doğrudan satış garantisi veren bir yapı değildir.\n\nBuradaki temel amaç; doğru insanlarla düzenli temas kurmak, güven oluşturmak, referans ilişkileri geliştirmek ve zaman içinde nitelikli iş fırsatlarının doğabileceği bir çevre oluşturmaktır.\n\nReklam hızlı görünürlük sağlayabilir; ancak referans, güven üzerinden daha güçlü iş ilişkileri oluşturur."
    },
    {
        q: "Gruptaki kişiler benim müşterim mi olacak?",
        a: "Event4Network’te asıl değer, yalnızca gruptaki kişileri potansiyel müşteri olarak görmek değildir.\n\nBir grupta yer aldığınızda, zamanla 35 kişinin çevresinde güvenilir bir profesyonel olarak konumlanırsınız. Yani üyelerin kendisinden çok, onların çevresi sizin için daha büyük bir pazar haline gelebilir.\n\nBu nedenle Event4Network’te amaç satış yapmak değil; güvenilir şekilde tavsiye edilebilir hale gelmektir."
    },
    {
        q: "Event4Network’te referans sistemi nasıl işler?",
        a: "Üyeler düzenli toplantılar ve birebir görüşmeler sayesinde birbirlerinin işlerini, uzmanlıklarını ve hedef müşteri profillerini daha iyi tanır.\n\nBu güven oluştukça, üyeler kendi çevrelerinde uygun gördükleri kişilere diğer üyeleri tavsiye edebilir veya iş yönlendirmesi yapabilir.\n\nReferansların sağlıklı oluşması için üyelerin kendini net anlatması, toplantılara düzenli katılması ve birebir görüşmeler yapması önemlidir."
    },
    {
        q: "Ziyaretçi olarak toplantıya katılabilir miyim?",
        a: "Evet, uygun görülen adaylar Event4Network toplantılarına ziyaretçi olarak davet edilebilir.\n\nZiyaretçi katılımı, hem adayın sistemi yakından görmesi hem de Event4Network ekibinin adayın grup yapısına uygunluğunu değerlendirmesi için önemli bir adımdır."
    },
    {
        q: "Üyelik süreci nasıl ilerliyor?",
        a: "Üyelik süreci genellikle şu adımlardan oluşur:\n\n- Başvuru veya davet\n- Ön değerlendirme görüşmesi\n- Uygun grup ve meslek koltuğu kontrolü\n- Tanışma toplantısına katılım\n- Üyelik değerlendirmesi\n- Uygun bulunması halinde gruba dahil olma\n\nBu süreç, hem adayın beklentilerini hem de grubun yapısını korumak için uygulanır."
    },
    {
        q: "Event4Network ücretli mi?",
        a: "Event4Network bir üyelik sistemiyle çalışır.\n\nÜyelik detayları, dönemsel yapı, grup uygunluğu ve katılım şartları ön değerlendirme görüşmesinde paylaşılır.\n\nAmaç, yalnızca katılım sağlamak değil; düzenli, sürdürülebilir ve karşılıklı değer üreten bir iş ağına dahil olmaktır."
    },
    {
        q: "Başvuru yaptıktan sonra ne oluyor?",
        a: "Başvurunuz alındıktan sonra Event4Network ekibi sizinle iletişime geçer.\n\nÖn görüşmede işiniz, sektörünüz, hedef müşteri profiliniz, faaliyet süreniz, beklentileriniz ve uygun grup ihtimali değerlendirilir.\n\nUygun görülmeniz halinde sizi bir tanışma toplantısına veya ilgili üyelik sürecine yönlendiririz."
    },
    {
        q: "Event4Network hangi sektörler için uygundur?",
        a: "Event4Network birçok farklı sektör için uygundur. Özellikle B2B çalışan, hizmet sunan, referansla büyüyebilecek veya karar vericilerle ilişki kurmak isteyen profesyoneller için güçlü bir yapıdır.\n\nÖrnek olarak:\n- Danışmanlık\n- Hukuk\n- Finans\n- Sigorta\n- Yazılım\n- Pazarlama\n- Gayrimenkul\n- İnsan kaynakları\n- Eğitim\n- Sağlık turizmi\n- E-ticaret\n- Mimarlık ve mühendislik\n\nAncak her sektör için uygunluk, mevcut grup yapısı ve meslek koltuğu durumuna göre değerlendirilir."
    },
    {
        q: "Event4Network sadece grup içi ilişkilerden mi oluşur?",
        a: "Hayır. Event4Network yalnızca kapalı grup toplantılarından ibaret değildir.\n\nÜyelerin farklı çevrelerde de görünür olabilmesi için fiziksel buluşmalar, beyaz yaka toplantılar, dış etkinlik katılımları ve farklı platformlarla yapılan iş birlikleri de sürecin parçasıdır.\n\nBu sayede üyeler yalnızca kendi gruplarıyla değil, daha geniş bir iş ekosistemiyle temas kurabilir."
    },
    {
        q: "Event4Network’e neden katılmalıyım?",
        a: "Event4Network’e katılmak, yalnızca yeni insanlarla tanışmak anlamına gelmez.\n\nBurada düzenli olarak görünür olur, işinizi anlatır, diğer üyeleri tanır, birebir görüşmeler yapar ve zaman içinde güvenilir bir referans ağı içinde yer alırsınız.\n\nDoğru kişiler tarafından tanınmak, iş dünyasında reklamdan çok daha güçlü ve kalıcı sonuçlar doğurabilir."
    }
];

export function LandingPage() {
    const navigate = useNavigate();
    const [groups, setGroups] = useState<GroupStat[]>([]);
    const [events, setEvents] = useState<PublicEvent[]>([]);
    const [openFaqs, setOpenFaqs] = useState<Record<number, boolean>>({});
    const [faqSearch, setFaqSearch] = useState("");

    useEffect(() => {
        // Fetch groups and events
        api.getGroups().then((data: any) => setGroups(data.slice(0, 4))).catch(() => { });
        api.getEvents().then((data: any) => {
            const publicEvents = data.filter((e: any) => e.is_public).slice(0, 3);
            setEvents(publicEvents);
        }).catch(() => { });
    }, []);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(value);
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <Helmet>
                <title>Event4Network | İş İnsanları İçin Seçici Networking Platformu</title>
                <meta name="description" content="Event4Network, iş insanlarını seçici networking gruplarında bir araya getirerek kalıcı iş ilişkileri, nitelikli referanslar ve güvene dayalı iş bağlantıları oluşturur." />
                <meta name="author" content="Event4Network" />
                <meta name="robots" content="index, follow" />
                <meta name="keywords" content="networking, iş ağı, seçici networking, B2B networking, iş insanları, referansla iş geliştirme, nitelikli iş yönlendirmesi, kalıcı iş ilişkileri" />
                <link rel="canonical" href="https://www.event4network.com/" />
                
                <meta property="og:type" content="website" />
                <meta property="og:title" content="Event4Network | İş İnsanları İçin Seçici Networking Platformu" />
                <meta property="og:description" content="Event4Network, iş insanlarını seçici networking gruplarında bir araya getirerek kalıcı iş ilişkileri, nitelikli referanslar ve güvene dayalı iş bağlantıları oluşturur." />
                <meta property="og:url" content="https://www.event4network.com/" />
                <meta property="og:site_name" content="Event4Network" />
                
                <meta name="twitter:card" content="summary" />
                <meta name="twitter:title" content="Event4Network | İş İnsanları İçin Seçici Networking Platformu" />
                <meta name="twitter:description" content="Kalıcı iş ilişkileri, güvene dayalı referanslar ve seçici networking yapısı için Event4Network." />

                <script type="application/ld+json">
{`{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Event4Network",
  "alternateName": "E4N",
  "url": "https://www.event4network.com/",
  "logo": "https://www.event4network.com/logo.png",
  "description": "Event4Network, iş insanları için seçici networking grupları oluşturan, kalıcı iş ilişkileri, güvene dayalı bağlantılar ve nitelikli referans sistemi üzerine kurulu bir networking platformudur.",
  "sameAs": [
    "https://www.instagram.com/event4network/"
  ],
  "knowsAbout": [
    "Networking",
    "B2B networking",
    "İş ağı kurma",
    "İş geliştirme",
    "Nitelikli iş yönlendirmesi",
    "Referansla müşteri kazanma",
    "Kalıcı iş ilişkileri",
    "Girişimcilik",
    "Profesyonel iş bağlantıları"
  ]
}`}
                </script>
                <script type="application/ld+json">
{`{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Event4Network",
  "url": "https://www.event4network.com/"
}`}
                </script>
                <script type="application/ld+json">
{`{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Event4Network nedir?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Event4Network, iş insanlarının düzenli olarak bir araya gelerek kalıcı iş ilişkileri kurduğu, seçici ve güvene dayalı bir networking platformudur."
      }
    },
    {
      "@type": "Question",
      "name": "Event4Network kimler için uygundur?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Event4Network; şirket sahipleri, girişimciler, danışmanlar, B2B hizmet veren profesyoneller ve referansla iş geliştirmek isteyen işletmeler için uygundur."
      }
    },
    {
      "@type": "Question",
      "name": "Event4Network klasik networking etkinliklerinden nasıl ayrılır?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Event4Network, tek seferlik tanışmalar yerine düzenli toplantılar, birebir görüşmeler, seçici üyelik yapısı ve güvene dayalı nitelikli iş yönlendirmeleri üzerine kurulu sürdürülebilir bir networking sistemidir."
      }
    },
    {
      "@type": "Question",
      "name": "Event4Network üyelik süreci nasıl işler?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Event4Network üyelik süreci ön bilgilendirme ve ön değerlendirme ile ilerler. Başvuran kişinin veya şirketin faaliyet alanı, gruba değer katma potansiyeli ve mevcut grup yapısıyla uyumu değerlendirilir."
      }
    },
    {
      "@type": "Question",
      "name": "Event4Network’te birebir görüşmeler neden önemlidir?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Birebir görüşmeler, üyelerin birbirini daha yakından tanımasını sağlar. Gerçek iş bağlantıları çoğu zaman bu görüşmelerde oluşur çünkü kişiler birbirinin işini, çevresini ve potansiyel iş fırsatlarını daha iyi anlar."
      }
    },
    {
      "@type": "Question",
      "name": "Event4Network’te amaç sadece yeni insanlarla tanışmak mı?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Hayır. Event4Network’te amaç yalnızca yeni insanlarla tanışmak değil; aynı kişilerle düzenli temas kurarak güven oluşturmak, birbirini tanımak ve bu güven üzerinden nitelikli iş birlikleri geliştirmektir."
      }
    }
  ]
}`}
                </script>
            </Helmet>
            {/* Hero Section */}
            <section className="pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
                        <div className="mb-12 lg:mb-0">
                            <div className="inline-flex items-center px-4 py-2 rounded-full bg-red-50 text-red-700 font-medium text-sm mb-6 border border-red-100">
                                🚀 Profesyonel İş Ağı Platformu
                            </div>
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight leading-tight mb-6">
                                İş İnsanları İçin <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600">Seçici Networking Platformu</span>
                            </h1>
                            <p className="text-lg text-gray-600 mb-8 leading-relaxed max-w-xl">
                                Event4Network, iş insanlarını düzenli ve seçici gruplarda bir araya getirerek güvene dayalı, sürdürülebilir ve nitelikli iş bağlantıları kurulmasını sağlayan yeni nesil bir networking platformudur.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Button
                                    size="lg"
                                    variant="primary"
                                    onClick={() => navigate('/degerlendirme-basvurusu')}
                                    className="text-lg px-8 h-14 shadow-xl shadow-red-200"
                                >
                                    Katıl <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    onClick={() => navigate('/e4n-nedir')}
                                    className="text-lg px-8 h-14"
                                >
                                    E4N Nedir?
                                </Button>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    onClick={() => navigate('/uyelik')}
                                    className="text-lg px-8 h-14"
                                >
                                    Üyelik Süreci
                                </Button>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute -inset-4 bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl blur-2xl opacity-20 animate-pulse"></div>
                            <img
                                src={processMeeting}
                                alt="Event4Network iş insanları için seçici networking platformu"
                                width="1200"
                                height="700"
                                loading="eager"
                                fetchPriority="high"
                                className="relative rounded-2xl shadow-2xl border border-gray-100 w-full object-cover transform hover:scale-[1.02] transition-transform duration-500"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* SEO Kısaca Block */}
            <section id="event4network-nedir" className="py-16 bg-white border-t border-gray-100">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">Event4Network Nedir?</h2>
                    <p className="text-lg text-gray-600 leading-relaxed">
                        Event4Network, iş insanlarının düzenli olarak bir araya gelerek kalıcı iş ilişkileri kurduğu, seçici ve güvene dayalı bir networking platformudur.
                    </p>
                </div>
            </section>

            {/* Problem Section: Why Classic Networking Fails */}
            <section className="py-24 bg-gray-50 border-t border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <div className="text-red-600 font-semibold tracking-wide uppercase text-sm">Neden Farklıyız?</div>
                        <h2 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl leading-tight">
                            Klasik Networking Neden Yetersiz Kalır?
                        </h2>
                        <div className="mt-6 text-lg text-gray-600 max-w-3xl mx-auto space-y-4 leading-relaxed">
                            <p>
                                Birçok networking etkinliğinde insanlar tanışır, kartvizit değiştirir ve sonra birbirini unutur. Çünkü güven oluşmaz, ilişki derinleşmez ve düzenli temas kurulmaz.
                            </p>
                            <p className="font-semibold text-red-600 bg-red-50/50 py-2 px-4 rounded-lg inline-block border border-red-100/50">
                                Event4Network, bu problemi çözmek için yalnızca tanışmaya değil; tanınmaya, güven oluşturmaya ve sürdürülebilir iş ilişkileri kurmaya odaklanır.
                            </p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Card 1: Yüzeysel Tanışmalar */}
                        <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 hover:shadow-lg hover:border-red-100 transition-all duration-300">
                            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-6">
                                <XCircle className="h-6 w-6 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Yüzeysel Tanışmalar</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Tek seferlik etkinliklerde insanlar birbirini yeterince tanıyamaz.
                            </p>
                        </div>

                        {/* Card 2: Güven Eksikliği */}
                        <div className="bg-white rounded-2xl p-8 border border-gray-100 hover:shadow-lg hover:border-red-100 transition-all duration-300">
                            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-6">
                                <ShieldAlert className="h-6 w-6 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Güven Eksikliği</h3>
                            <p className="text-gray-600 leading-relaxed">
                                İş yönlendirmesi için sadece tanışmak değil, güven oluşması gerekir.
                            </p>
                        </div>

                        {/* Card 3: Takip Eksikliği */}
                        <div className="bg-white rounded-2xl p-8 border border-gray-100 hover:shadow-lg hover:border-red-100 transition-all duration-300">
                            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-6">
                                <AlertCircle className="h-6 w-6 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Takip Eksikliği</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Düzenli temas olmadığında ilişkiler kısa sürede kopar.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Çözüm Section: Event4Network Nasıl Fark Yaratır? */}
            <section id="neden-event4network" className="py-24 bg-gray-50/70 border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <div className="text-red-600 font-semibold tracking-wide uppercase text-sm">Çözüm Platformu</div>
                        <h2 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl leading-tight">
                            Neden Event4Network?
                        </h2>
                        <p className="mt-6 text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
                            Event4Network, iş insanlarını rastgele değil; dengeli, seçici ve sürdürülebilir gruplar içerisinde bir araya getirir. Her üye yalnızca kendi işiyle değil, çevresiyle birlikte bu yapıya değer katar.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {/* Card 1: Seçici Gruplar */}
                        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-lg hover:border-red-100 transition-all duration-300 flex flex-col h-full">
                            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-6">
                                <Users className="h-6 w-6 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Seçici Gruplar</h3>
                            <p className="text-gray-600 leading-relaxed text-sm">
                                Her grupta farklı sektörlerden iş insanları yer alır.
                            </p>
                        </div>

                        {/* Card 2: Meslek Koltuğu Sistemi */}
                        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-lg hover:border-red-100 transition-all duration-300 flex flex-col h-full">
                            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-6">
                                <ShieldCheck className="h-6 w-6 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Meslek Koltuğu Sistemi</h3>
                            <p className="text-gray-600 leading-relaxed text-sm">
                                Aynı meslekten üyelerin çakışması engellenerek grup içi rekabet azaltılır.
                            </p>
                        </div>

                        {/* Card 3: Düzenli Toplantılar */}
                        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-lg hover:border-red-100 transition-all duration-300 flex flex-col h-full">
                            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-6">
                                <Calendar className="h-6 w-6 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Düzenli Toplantılar</h3>
                            <p className="text-gray-600 leading-relaxed text-sm">
                                Üyeler belirli aralıklarla bir araya gelerek görünürlüklerini artırır.
                            </p>
                        </div>

                        {/* Card 4: Birebir Görüşmeler */}
                        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-lg hover:border-red-100 transition-all duration-300 flex flex-col h-full">
                            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-6">
                                <Handshake className="h-6 w-6 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Birebir Görüşmeler</h3>
                            <p className="text-gray-600 leading-relaxed text-sm">
                                Asıl güven ve iş akışı, üyeler arasında yapılan birebir toplantılarla oluşur.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Video Section */}
            <section id="nasil-calisir" className="py-24 bg-white border-t border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="lg:grid lg:grid-cols-12 lg:gap-16 items-center">
                        <div className="lg:col-span-6 mb-12 lg:mb-0">
                            <div className="text-red-600 font-semibold tracking-wide uppercase text-sm mb-3">Video Anlatım</div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-6 leading-tight">
                                Event4Network Nasıl Çalışır?
                            </h2>
                            <div className="space-y-6 text-lg text-gray-600 leading-relaxed">
                                <p>
                                    Event4Network’te amaç yalnızca yeni insanlarla tanışmak değildir. Aynı kişilerle düzenli olarak bir araya gelmek, zaman içinde birbirini gerçekten tanımak, güven oluşturmak ve bu güven üzerinden nitelikli iş birlikleri geliştirmektir.
                                </p>
                                <p className="border-l-4 border-red-600 pl-4 italic text-gray-700 font-medium bg-red-50/50 py-3 rounded-r-lg">
                                    Burada gruptaki 35 kişi yalnızca potansiyel müşteriniz değildir; onların çevresi, güvenilir bir referansla ulaşabileceğiniz gerçek pazarınızdır.
                                </p>
                            </div>
                        </div>

                        <div className="lg:col-span-6">
                            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200 aspect-video w-full">
                                <iframe 
                                    className="absolute top-0 left-0 w-full h-full"
                                    src="https://www.youtube.com/embed/qGg8v6TRjNY?si=RcbLDMovaMS7L3gu" 
                                    title="Event4Network seçici networking platformu tanıtım videosu" 
                                    frameBorder="0" 
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                                    referrerPolicy="strict-origin-when-cross-origin" 
                                    allowFullScreen
                                    loading="lazy"
                                ></iframe>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Group Types Section */}
            <section id="grup-yapisi" className="py-24 bg-gray-50 border-t border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <div className="text-gray-900 font-semibold tracking-wide uppercase text-sm mb-3">Grup Yapımız</div>
                        <h2 className="text-3xl font-bold text-gray-900">İki Ana Yapı</h2>
                        <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
                            Dinamik ve sürdürülebilir ilişkiler için iki ana yapı sunuyoruz.
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
                                <h3 className="text-xl font-bold text-gray-900 mb-4">Ana Gruplar</h3>
                                <p className="text-gray-600 mb-4">
                                    Yaklaşık 35 iş insanından oluşan, genel networking faaliyetlerinin yürütüldüğü dinamik gruplardır.
                                </p>
                                <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                                    <div className="flex items-start gap-3">
                                        <Calendar className="h-5 w-5 text-red-600 mt-0.5" />
                                        <div>
                                            <span className="block font-bold text-gray-900 text-sm mb-1">Dinamik Döngü</span>
                                            <p className="text-xs text-gray-600 leading-relaxed">
                                                Dört aylık süreç sonunda kimlerle yol alabileceğiniz netleşir. "Shuffle" sistemi ile bu doğal süreci yeni bağlantılarla genişletiriz.
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
                                <h3 className="text-xl font-bold text-gray-900 mb-4">Loncalar (Sektörel Takımlar)</h3>
                                <p className="text-gray-600 mb-4">
                                    Aynı sektöre hizmet eden ancak birbirinin rakibi olmayan, farklı uzmanlık alanlarından iş insanlarını bir araya getirir.
                                </p>
                                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                                    <div className="flex items-start gap-3">
                                        <Trophy className="h-5 w-5 text-blue-600 mt-0.5" />
                                        <div>
                                            <span className="block font-bold text-gray-900 text-sm mb-1">Tamamlayıcı Güç</span>
                                            <p className="text-xs text-gray-600 leading-relaxed">
                                                Bir sektördeki işletmelerin ihtiyaç duyduğu hizmetler, tamamlayıcı bir yapı içinde buluşur. Rekabet değil, iş birliği esastır.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Meeting Format Section */}
            <section className="py-24 bg-gray-900 text-white relative overflow-hidden">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center opacity-10"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/95 to-gray-900/90"></div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="lg:grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <div className="text-red-500 font-semibold tracking-wide uppercase text-sm mb-3">Toplantı Deneyimi</div>
                            <h2 className="text-3xl font-bold text-white mb-6">Sıkıcı Toplantılara Son</h2>
                            <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                                Ana grup toplantılarımızda sıkıcı, monoton sunumlar yerine interaktif ve eğlenceli bir akış sunuyoruz.
                            </p>

                            <ul className="space-y-6">
                                <li className="flex items-start">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30">
                                        <span className="text-red-500 font-bold">15</span>
                                    </div>
                                    <div className="ml-4">
                                        <h3 className="text-xl font-bold text-white">Dakika İnteraktif Sunum</h3>
                                        <p className="mt-1 text-gray-400">Üyelerimizin işini anlattığı kısa, öz ve etkileşimli sunumlar.</p>
                                    </div>
                                </li>
                                <li className="flex items-start">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                                        <Users className="h-5 w-5 text-blue-400" />
                                    </div>
                                    <div className="ml-4">
                                        <h3 className="text-xl font-bold text-white">Networking Oyunları</h3>
                                        <p className="mt-1 text-gray-400">Buzları eriten, tanışmayı hızlandıran ve eğlendiren aktiviteler.</p>
                                    </div>
                                </li>
                            </ul>
                        </div>

                        <div className="mt-12 lg:mt-0 bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                            <h3 className="text-2xl font-bold text-white mb-6">Hibrit Yaklaşım: Online + Yüz Yüze</h3>
                            <p className="text-gray-300 mb-6 leading-relaxed">
                                Hem online'ın pratikliğinden hem de yüz yüze iletişimin gücünden faydalanıyoruz.
                            </p>
                            <div className="space-y-4">
                                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                        <span className="font-bold text-white">Online Yüzeyselliğine Son</span>
                                    </div>
                                    <p className="text-sm text-gray-400">
                                        Genel gruplar ve loncalar için tasarlanan yüz yüze etkinlikler sayesinde sıkı iş bağlantıları kuruyoruz.
                                    </p>
                                </div>
                                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                                        <span className="font-bold text-white">Maksimum Verim</span>
                                    </div>
                                    <p className="text-sm text-gray-400">
                                        Zamanı verimli kullanan online toplantılar ve ilişkiyi derinleştiren fiziksel buluşmaların mükemmel dengesi.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Group Success Stats Section */}
            <section id="basarilar" className="py-20 bg-gray-900 text-white border-t border-gray-800">
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
                                        <Button variant="ghost" className="justify-center px-3" onClick={() => navigate('/degerlendirme-basvurusu')}>
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
            <section id="sürecler" className="py-24 bg-white border-t border-gray-100 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-20">
                        <div className="text-base font-semibold text-red-600 tracking-wide uppercase">Süreçler</div>
                        <h2 className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
                            Üyelik Süreci Nasıl İşler?
                        </h2>
                        <p className="mt-4 max-w-2xl text-lg text-gray-500 mx-auto">
                            Event4Network ailesine katılmak ve sistemin parçası olmak için izleyeceğiniz adımlar.
                        </p>
                    </div>

                    <div className="relative">
                        {/* Desktop Horizontal Line */}
                        <div className="hidden lg:block absolute top-10 left-10 right-10 h-1 bg-red-100 rounded-full -z-10"></div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-8 relative">
                            {[
                                {
                                    step: "01",
                                    title: "Başvuru",
                                    description: "Event4Network’e katılım başvuru veya davet yoluyla başlar."
                                },
                                {
                                    step: "02",
                                    title: "Ön Görüşme",
                                    description: "Sektör, beklentiler ve grup uygunluğu değerlendirilir."
                                },
                                {
                                    step: "03",
                                    title: "Tanışma",
                                    description: "Sistemi yakından görmek için bir toplantıya davet edilirsiniz."
                                },
                                {
                                    step: "04",
                                    title: "Üyelik",
                                    description: "Uygun bulunan adaylar ilgili gruba dahil edilir."
                                },
                                {
                                    step: "05",
                                    title: "Networking",
                                    description: "Düzenli toplantı ve referans yönlendirmeleri süreci."
                                }
                            ].map((item, index) => (
                                <div key={index} className="relative group text-center flex flex-col items-center">
                                    {/* Mobile Vertical Line */}
                                    {index !== 4 && (
                                        <div className="lg:hidden absolute top-20 bottom-[-3rem] left-1/2 w-1 bg-red-100 -translate-x-1/2 -z-10"></div>
                                    )}
                                    
                                    <div className="w-20 h-20 bg-white border-4 border-red-50 text-red-600 rounded-full flex items-center justify-center font-black text-2xl mb-6 shadow-xl shadow-red-100/50 group-hover:-translate-y-2 group-hover:bg-red-600 group-hover:text-white group-hover:border-red-100 transition-all duration-300 relative z-10">
                                        {item.step}
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-red-600 transition-colors">{item.title}</h3>
                                    <p className="text-gray-600 text-sm leading-relaxed px-2">
                                        {item.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Qualification: Who is it for */}
            <section id="kimler-icin" className="py-24 bg-gray-50/70 border-t border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <div className="text-red-600 font-semibold tracking-wide uppercase text-sm">Hedef Kitle</div>
                        <h2 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl leading-tight">
                            Event4Network Kimler İçin Uygun?
                        </h2>
                        <div className="mt-6 text-lg text-gray-600 max-w-4xl mx-auto space-y-4 leading-relaxed">
                            <p>
                                Event4Network; işini büyütmek, doğru insanlarla tanışmak, çevresini genişletmek ve güvene dayalı iş ilişkileri kurmak isteyen profesyoneller için tasarlanmıştır.
                            </p>
                            <p className="text-sm bg-red-50/50 border border-red-100/50 text-red-700 py-3 px-6 rounded-2xl max-w-3xl mx-auto font-medium">
                                Event4Network’te üyelik yalnızca meslek veya sektör uygunluğuna göre değil; faaliyet süresi, iş hacmi, hizmet kalitesi, grup dengesi ve karşılıklı değer üretme potansiyeli dikkate alınarak değerlendirilir. Bu kriterler ön değerlendirme görüşmesinde detaylandırılır.
                            </p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {/* Card 1: Şirket Sahipleri */}
                        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-lg hover:border-red-100 transition-all duration-300 flex flex-col h-full">
                            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mb-6">
                                <Users className="h-6 w-6 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Şirket Sahipleri</h3>
                            <p className="text-gray-600 leading-relaxed text-sm">
                                Yeni iş bağlantıları ve stratejik ilişkiler kurmak isteyen işletme sahipleri.
                            </p>
                        </div>

                        {/* Card 2: Girişimciler */}
                        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-lg hover:border-red-100 transition-all duration-300 flex flex-col h-full">
                            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-6">
                                <Trophy className="h-6 w-6 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Girişimciler</h3>
                            <p className="text-gray-600 leading-relaxed text-sm">
                                Fikirlerini, ürünlerini veya hizmetlerini doğru çevrelerle buluşturmak isteyen girişimciler.
                            </p>
                        </div>

                        {/* Card 3: Danışmanlar ve Uzmanlar */}
                        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-lg hover:border-red-100 transition-all duration-300 flex flex-col h-full">
                            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-6">
                                <CheckCircle className="h-6 w-6 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Danışmanlar ve Uzmanlar</h3>
                            <p className="text-gray-600 leading-relaxed text-sm">
                                Hizmet verdiği alanda güvenilir referanslarla büyümek isteyen profesyoneller.
                            </p>
                        </div>

                        {/* Card 4: B2B Hizmet Sağlayıcıları */}
                        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-lg hover:border-red-100 transition-all duration-300 flex flex-col h-full">
                            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-6">
                                <BarChart className="h-6 w-6 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">B2B Hizmet Sağlayıcıları</h3>
                            <p className="text-gray-600 leading-relaxed text-sm">
                                Şirketlere hizmet sunan ve karar vericilerle tanışmak isteyen firmalar.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ (SSS) Section */}
            <section id="sss" className="py-24 bg-gray-50 border-t border-b border-gray-100">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <div className="text-red-600 font-semibold tracking-wide uppercase text-sm">Destek</div>
                        <h2 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">Sıkça Sorulan Sorular</h2>
                        <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
                            Event4Network sistemi, üyelik süreci ve işleyiş hakkında merak ettiğiniz tüm soruların cevapları.
                        </p>
                        
                        {/* Search Bar */}
                        <div className="mt-8 max-w-md mx-auto relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Soru veya kelime ara..."
                                value={faqSearch}
                                onChange={(e) => setFaqSearch(e.target.value)}
                                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-2xl bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm shadow-sm transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        {(() => {
                            const filteredFaqs = faqs.filter(faq => 
                                faq.q.toLowerCase().includes(faqSearch.toLowerCase()) || 
                                faq.a.toLowerCase().includes(faqSearch.toLowerCase())
                            );

                            return filteredFaqs.length > 0 ? (
                                filteredFaqs.map((faq) => {
                                    const originalIndex = faqs.findIndex(f => f.q === faq.q);
                                    const isOpen = !!openFaqs[originalIndex];
                                    return (
                                        <div 
                                            key={originalIndex}
                                            className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300"
                                        >
                                            <button
                                                onClick={() => {
                                                    setOpenFaqs(prev => ({ ...prev, [originalIndex]: !prev[originalIndex] }));
                                                }}
                                                className="w-full flex justify-between items-center p-6 text-left focus:outline-none"
                                            >
                                                <span className="text-lg font-bold text-gray-900 pr-4">{faq.q}</span>
                                                <span className={`flex-shrink-0 p-1.5 rounded-full bg-gray-50 text-gray-500 transition-all duration-300 ${isOpen ? 'bg-red-50 text-red-600 rotate-180' : ''}`}>
                                                    <ChevronDown className="h-5 w-5" />
                                                </span>
                                            </button>
                                            <div 
                                                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                                                    isOpen ? 'max-h-[500px] border-t border-gray-50' : 'max-h-0'
                                                }`}
                                            >
                                                <div className="p-6 text-gray-600 leading-relaxed text-base whitespace-pre-line">
                                                    {faq.a}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-12 text-gray-500">
                                    Arama kriterlerinize uygun soru bulunamadı.
                                </div>
                            );
                        })()}
                    </div>
                </div>
            </section>

            {/* Unified CTA Section */}
            <section id="on-bilgilendirme-formu" className="py-24 bg-gray-900 text-white relative overflow-hidden">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-1/2 -right-1/2 w-[1000px] h-[1000px] rounded-full bg-red-900/20 blur-3xl"></div>
                    <div className="absolute -bottom-1/2 -left-1/2 w-[1000px] h-[1000px] rounded-full bg-blue-900/10 blur-3xl"></div>
                </div>
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <div className="bg-red-600/10 text-red-400 font-semibold tracking-wider uppercase text-xs px-4 py-1.5 rounded-full border border-red-500/20 mb-6 inline-block">
                        Değerlendirme Başvurusu
                    </div>
                    <h2 className="text-4xl font-extrabold text-white sm:text-5xl mb-6 leading-tight">
                        Profesyonel İş Ağına İlk Adımı Atın
                    </h2>
                    <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
                        Event4Network’e katılım doğrudan kayıt sistemiyle değil, adayların iş profili ve topluluk dengesiyle uyumluluğunu ele alan bir ön değerlendirme süreciyle gerçekleşir. Siz de profesyonel profilinizi paylaşarak değerlendirme sürecini başlatabilirsiniz.
                    </p>
                    <div className="flex justify-center">
                        <Button
                            size="lg"
                            variant="primary"
                            onClick={() => navigate('/degerlendirme-basvurusu')}
                            className="text-lg h-16 px-12 bg-red-600 hover:bg-red-500 hover:scale-105 transform transition-all shadow-xl font-bold rounded-xl"
                        >
                            Değerlendirme Başvurusu Başlat
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    );
}
