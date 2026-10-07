# Güncel durum ve sıradaki işler

**2 Ekim 2026.** Linear proje kayıtları ile Devam-Notu karşılaştırıldı. Proje: [E4N — Platform Denetimi ve Geliştirme](https://linear.app/e4n/project/e4n-platform-denetimi-ve-gelistirme-8bea47be5f8b).

## Durum

64 kayıt: 10 Done, 11 In Progress, 43 Backlog. Epic ve PAR program üst kayıtları dahil; bunlar 64 bağımsız geliştirme işi değildir. Sprintler Linear milestone olarak tutuluyor, süre taahhüdü değil.

Sprint 0 haritalama, veri tabanı denetimi, hata envanteri ve hedef fark analizi tamamlandı. Sprint 1 P04 izole ortam, P05 etkinlik GET/500 düzeltmesi, P06 mobil API hedef doğrulaması, P07 bildirim sözleşmesi Done. Mobil yayın paketi/cihaz kabulü ayrıca açık.

Kısmi ilerleme: P09 sürümlü kurulum/HTTP DDL temizliği; P40 17 gölgeli route kaldırıldı; P39 referans sahte başarı/hata gizleme kaldırıldı, rapor hata/tekrar ve aylık demo grafikler düzeltildi. Bunlar ana görevlerin tüm kabul koşullarını karşılamıyor. Son commit 1249290 yönetilen dalda; canlı dağıtım yapılmadı.

## Yakın çalışma sırası

1. **P39/P41 rapor doğruluğu:** stats sabit %20 dönüşüm, 70/30 gelir bölüşümü, kayıp üye 0 ve gelir sorgusu hatasının 0'a çevrilmesi. Gerçek veri yok/hata ayrımını tamamla; metrik tanımı olmadan formül icat etme.
2. **P08/P40 API sahipliği:** eksik/yöntem/yanıt farklarının aktif çağıranlarını ve hedeflerini kapat; bağlantısız modülleri topluca bağlama. Referans güncellemesinin doğrudan Supabase yolu için taraf/rol provası ve ortak API kararı.
3. **PAR-01/02 ve P32:** mobil kaynak/yayın eşlemesi ve gerçek cihaz doğrulaması; referans receiver_id/receiverId, destek support/tickets, görüşme activities/one-to-ones, admin başvuru yanıt farkları. Denetim kanıtı var, hedef uygulama henüz tamamlanmadı.
4. **P09–P11 veri temeli:** gerçek üretim yedeğinin izole geçiş provası; veri modeli/eski veri eşlemesi ve durum kısıtları. Canlı yazma yapılmaz; geçmiş hak/ödeme olayları uydurulmaz.

Bu sıra bağımsız teknik işleri ilerletir. Ana ürün uygulama sırası aşağıdaki sprintlere ve açık kararlara bağlıdır.

## Ana sprint planı

| Sprint | Kalan teslimler | Görevler |
|---|---|---|
| 1 — Kararlar/stabilizasyon | D kararları, API sözleşmesi, route sahipliği, web/mobil denetim kapanışı | P01–P03, P08, P40; PAR-01/02 |
| 2 — Veri/üyelik | Mevcut şema geçişi, hedef model/status, üyelik-grup hak ayrımı, şirket şartı, ödeme sahipliği/tekrar güvenliği | P09–P14 |
| 3 — Lonca/grup | Lonca yaşam döngüsü; hizmet çakışması, kapasite/eşzamanlı kabul, başkan görüşmesi, tek aktif grup/geçmiş, ret/taşıma | P15–P20 |
| 4 — Puan/haklar | Aylık olay defteri, kesinleşme, çıkarma, sekiz ay yasak; etkinlik indirimi, kayıt/bilet/ödeme bütünlüğü | P21–P26 |
| 5 — Shuffle/arayüz | Dört aylık dönem, kurallı önizleme, atomik uygulama; üye/başkan/admin/web/mobil eşitliği, site anlatımı, API/demo temizliği | P27–P33, P39/P41; PAR-03/04 |
| 6 — Operasyon/sürüm | Cron, kalıcı fatura dosyası, geçiş/geri dönüş, regresyon, iki platform kabulü, güvenlik ve sürüm kararı | P34–P38; PAR-05; E4N-58/59/120 |

## Ürün kararı bekleyenler

- **P01 / D01–D04:** puan faaliyet/değer/eşik/ay kapanışı/mazeret; ilk çıkarma sonrası başvuru; çıkarılma sayım dönemi/üçüncü çıkarma; sekiz ay başlangıç ve bitiş hesabı.
- **P02 / D05,D06,D08,D09:** hizmet çakışması/çoklu hizmet; shuffle kesin ve tercih koşulları; başkan/son kabul yetkisi; 35 kesin tavan mı ve başkan dahil mi.
- **P03 / D07,D10:** ücret/dönem/gecikme/iptal hakları; şirket şartının aşaması/kanıtları ve eski hesaplar.

Karar paketi: [[E4N/01-Kararlar/Sprint1-Karar-Paketi]]. Bu kararların eksikliği denetimi ve bağımsız teknik düzeltmeleri durdurmaz; bağlı ürün davranışlarının kapanmasını engeller.

## Doğrulanan ama henüz giderilmeyen önemli bulgular

- Grup/lonca ret, taşıma ve ziyaretçi dönüşümünde izole 500/status kısıtı çelişkileri.
- İki eşzamanlı kabulde 34→36 ACTIVE; status onayında meslek çakışması kaçıyor.
- MEMBER başka grubun başvurusunu görüşmesiz onaylayabiliyor; aynı kişi iki aktif grupta ve çıkış geçmişi yok.
- Tekrarlanan ziyaretçi puanı iki kez artırıyor; aylık kaynak/kural sürümü/geçmiş eksik.
- Geç başarısız ödeme callback'i işlem FAILED yaparken üyelik ACTIVE kalıyor.
- Shuffle admin kaydı izole 500/rollback; bildirim yolu 404; dönem/önizleme demo koşullar kullanıyor.

Kanıtlar [[E4N/09-Dogrulama]] ve [[E4N/07-Hata-Denetimi/Mevcut-Hata-ve-Calisma-Durumu]] altında. İzole testlerin geçmesi bu bilinen sorunların çözüldüğü anlamına gelmez; bazı testler mevcut hatayı tekrar üretir.

## Yayın sınırı

Tam güvenlik denetimi Sprint 6'da; değişiklik sırasında ilgili rol/veri sınırı testleri sürer. Canlı Supabase yazması, gerçek ödeme ve üretim dağıtımı yok. PR entegrasyonu 403 olsa da commit/push ilerliyor. P09'un gerçek yedek provası ve ürün kararları açıkken tüm sistem tamamlandı/yayına hazır sayılmaz.
