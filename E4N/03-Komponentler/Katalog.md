# Web komponent kataloğu — ilk tur

**Kaynak:** `src/components/**/*.tsx` (16 dosya), `src/shared/**/*.tsx` (23 dosya), toplam 39 kaynak dosyası. Dosya varlığı aktif kullanım kanıtı değildir. Her birinin import edildiği route, props, API bağı ve boş/yükleniyor/hata durumları E4N-61 ve E4N-60 kapsamında incelenecek.

Her dosyanın statik import izi: [[E4N/03-Komponentler/Kullanim-Haritasi|Kullanım Haritası]]. Beş dosyayı içe alan kaynak bulunmadı; aktiflikleri ayrıca doğrulanacak.

| Grup | Komponent dosyaları | İlk işlev |
|---|---|---|
| Genel arayüz | `MainPublicLayout`, `PublicHeader`, `PublicFooter`, `SEO`, `ScrollToTopButton`, `Empty` | Public sayfa iskeleti ve ortak görünüm |
| Form/işlem | `MeetingRequestModal`, `MeetingRequestsList`, `PaymentModal`, `ProfessionSelect`, `UserSelect`, `VisitorForm` | Görüşme, ödeme, meslek, kullanıcı ve ziyaretçi etkileşimi |
| Eğitim | `CourseForm`, `LessonManager`, `StudentDashboard`, `lms/ExamRunner` | Kurs, ders, öğrenci ve sınav deneyimi |
| Paylaşılan UI | `Alert`, `Badge`, `Button`, `Calendar`, `Card`, `Input`, `Logo`, `Modal`, `ProgressBar`, `Select`, `TextArea`, `Upload`, `LegalModals`, `Navigation` | Temel görsel yapı taşları ve navigasyon |
| Dashboard parçaları | `ActivitySummary`, `ChampionsWidget`, `FriendRequestsWidget`, `GroupMembersWidget`, `QuickActions`, `ScoreCard`, `TasksCard`, `TrafficLightCard`, `VisitorInviteWidget` | Özet, puan, grup ve hızlı işlem kartları |

Önce üyelik, grup başvurusu/kabulü, puan, shuffle ve bilet akışlarına bağlı komponentlerin ayrıntılı kartları hazırlanacak. Diğerleri kullanım haritasıyla tutulacak. Hedef kart biçimi master planın 5. bölümünde tanımlıdır.
