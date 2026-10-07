# PAR-04 — Web grup/lonca detay yükleme ve metrik doğruluğu

3 Ekim 2026. `e9be608`, `codex/e4n-sprint1-foundation` dalına gönderildi.

## Değişiklik

`src/pages/AdminGroupDetail.tsx` yükleme hatasını yalnız console'a yazıp kısmi kayıt/boş metrik göstermeyi bıraktı. Detay id eşleşmesi ve bütün liste yanıtlarının array/object satır biçimi doğrulanır; null/bozuk yanıt hata olur. Bağımsız alt okumalar paralel yapılır; bütün okumalar başarılı olmadan ekran verisi kabul edilmez. Görünür alert ve Tekrar dene vardır. Eksik id çağrı yapmaz.

Route/tür/kullanıcı/rol kapsamı değişince eski detay hemen gizlenir; effect temizliği eski veya unmount sonrası sonucun ekrana yazılmasını engeller. Mevcut web ADMIN/PRESIDENT/VICE_PRESIDENT/SECRETARY_TREASURER rol listesi korunur, MEMBER/VISITOR/oturumsuz kullanıcı veri okumaz. Bu istemci kontrolüdür; API sahiplik/rol politikası tamamlanmış sayılmaz. Mobil detay bu aşamada yalnız ADMIN kapsamındadır; tam eşitlik kabulü açık.

Kaynaksız sabit gelecek etkinlik 0 yerine Veri yok gösterilir. Aktif Üyeler kartı bütün members.length yerine status=ACTIVE kayıtlarını sayar; gerçek boş liste 0 kalır. Yeni etkinlik hesabı/ürün kuralı icat edilmedi.

## Doğrulama

- `node test/admin-group-detail.mjs` başarılı: gerçek TSX kontrollü hooks/API ortamında grup ve loncanın her yükleme kaynağı hata/null/tekrar; eski metrik gizleme, başarılı/boş ve REQUESTED dışlayan ACTIVE sayımı, route ve kullanıcı değişimi, gecikmiş eski route/unmount sonucu, dört mevcut izinli rol ve MEMBER/VISITOR/oturumsuz/eksik id sıfır çağrı.
- `npm run check` TypeScript exit0; `git diff --check` başarılı. Commit/push başarılı, yönetilen çalışma ağacı temiz.

Tarayıcı/gerçek DOM veya yeni HTTP/DB testi yapılmadı. API/sunucu bu tur değişmedi; son izole grup okuma rol/veri kanıtı `6bb352e` ve [[E4N/09-Dogrulama/PAR-04-Mobil-Grup-Lonca-Detay-Okuma]]. Canlı Supabase, ödeme/e-posta ve dağıtım yok.

## Açık sonraki işler

Web lonca detayında toplantı/ziyaretçi okumaları halen grup yollarını kullanıyor. Bu yolların lonca id'si için gerçek kaynak/boş yanıt sözleşmesi izole ölçülecek; alias/varsayılan boş veri icat edilmeyecek. `getGroupMeetings` eksik attendance sayısını 0'a dönüştürüyor; ayrı veri doğruluğu işi.

Yoklamayı Kaydet mevcut kodda yalnız yerel rastgele toplantı oluşturuyor ve herkesi katılmış sayıyor; gerçek sunucu yazması/kullanıcı seçimi tamamlanmadı. Sonraki bağımsız iş bunun API/kayıt eşlemesi; D kararları gerektiğinde sahte başarı kaldırılır, hak/puan kuralları icat edilmez.

Ciro null tutar→0 indirgemesi, lonca varsayılan dönem/durum metinleri, yazma/rol yönetimi, cihaz/yayın ve ana PAR-04/PAR-02/Sprint6 kabulü açık kalır.
