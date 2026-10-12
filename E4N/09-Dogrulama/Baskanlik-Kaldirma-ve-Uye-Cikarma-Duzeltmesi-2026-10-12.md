# Başkanlık kaldırma ve üye çıkarma düzeltmesi — 12 Ekim 2026

## Canlı veri işlemi

- Kullanıcının belirttiği ayrılan kişinin Diamond aktif üyeliği ve global başkanlık rolü/unvanı tutarsızdı. Kullanıcı gruptan çıkarma ve başkanlığını kaldırma yetkisi verdi; platform hesabının silinmesi uygulanmadı.
- İlk transaction geçmiş context kısıtına uymadığı için tamamen rollback oldu. İkinci transaction yalnız doğrulanmış hedef üyeliği sildi, hesap rolünü MEMBER/unvanını NULL yaptı. Teknik işlem için kullanıcı aktörü uydurulmadı; mevcut history trigger kaydı context=NULL olarak korudu.
- Ayrı canlı SELECT: hedef Diamond üyeliği0, Diamond başkan0, son DELETE geçmiş kaydı1. Ayrılan başkana atanmış açık Diamond başvurusu0. Kişisel satırlar bu nota kopyalanmadı.

## Kalıcı düzeltme

- Üye çıkarma API'sindeki REMOVAL bildirim türü canlı notifications_type_check içinde yok; bu INSERT transactionı rollback edip arayüzde “İşlem sonucu doğrulanamadı” oluşturuyordu. Manuel grup çıkarma artık izinli GROUP_UPDATE türünü kullanır. Başvuru ve üyelik geçmişi okuyucuları yalnız ilgili başlıkla bu kayıtları da okur; eski REMOVAL uyumluluğu korunur.
- Yeni DELETE /api/admin/groups/:id/president, güncel DB ADMIN yetkisi, transaction/advisory lock, hedef üyelik/kapasite kontrolü ve doğrulanmış ACK ile atamayı kaldırır; üyeliği korur. Rol/unvan ve yerel membership başkan rolü temizlenir. Tekrar güvenlidir. Diğer gruptaki global başkanlığın etkilenmesi409; grup kapasitesinin aşılması409 ve rollback.
- Grup detail kartında admin için Başkan atamasını kaldır; boşsa Yönetimi admin yürütür. Discovery başkansız/admin var grubunu hazır gösterir; admin seçimi mevcut başvuru yürütücüsüyle aynı. Birden fazla başkan belirsizliği admin fallback ile maskelenmez.
- Üye listesi okuyucuları yerel gm.role=PRESIDENT atamasını da gösterir. PENDING üyelik, işlem sonrası doğrulanmış liste okuyucusunda kabul edilir.
- Migration yok. Önceki otomatik puan çıkarma/diğer politika kapsamları bu manuel düzeltmeyle tam kabul sayılmaz.

## Doğrulama

- npm run check/build, 234 rota/33provider, syntax/diff kontrolleri PASS.
- server/test/group-presidency-contract.mjs: gerçek HTTP handlerlar + izole sorgu adaptörü; anon401/currentDBadmin403, clear/tekrar/yerel rol, üyeliği koruma, kapasite/diğer kapsam rollback409, eksik404, grup çıkarma GROUP_UPDATE ve başkansız admin fallback PASS. Gerçek PostgreSQL testi değildir; Docker kapalı.
- Önceki üye ziyaret kuyruğu gerçek HTTP/DTO adaptör regresyonu PASS.
- Playwright gerçek AdminGroupDetail + izole API fixture: başkan kartı/kaldır düğmesi, kaldırma sonrası üyenin kalması, 1üye/0başkan, admin yönetimi mesajı PASS. output/playwright/group-president-{before,cleared}.txt ve group-president-cleared.png. Dış analitik istekleri engellendi. Production oturumlu browser kabulü değildir.
- Lint tam PASS değil: no-explicit-any hariç bile önceki AdminGroupDetail7error/1warning, GroupDiscovery1error/1warning devam eder; yeni lint bulgusu yok.
- Kalıcı kodun canlı yayını bu not hazırlanırken bekliyor. Canlı doğrudan hedef veri işlemi tamamlandı.
