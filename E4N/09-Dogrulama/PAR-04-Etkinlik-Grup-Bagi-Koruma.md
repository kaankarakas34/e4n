# PAR-04 — Etkinlik grup bağını koruma

3 Ekim 2026. Commit `9ff09bb`, yönetilen dala push edildi.

## Teslim

AdminEvents formunda grup seçme kontrolü yok; API kaydı group_id döndürürken form chapter_id alıp boş fallback üzerinden group_id=null yazıyordu. Düzenleme gövdesi artık group_id içermez; kullanılmayan chapter_id form alanı kaldırıldı. Yeni create mevcut group_id=null davranışı korunur. EventItem modeline gerçek nullable group_id eklendi; legacy model alanı diğer kaynak uyumu için korunur.

Aktif server PUT group_id!==undefined olduğunda günceller; omission kaynakta mevcut bağı korur. Bu statik kaynak koşuludur, bu tur HTTP/DB önce-sonra testi yapılmadı. Yeni grup atama/çıkarma işlevi veya ürün kuralı eklenmedi.

## Doğrulama

Gerçek TSX kontrollü test (`node test/admin-event-participants.mjs`) bağlı/null/eksik group_id ve çakışan legacy chapter_id ile edit gövdesinde alan yok; yeni create null. Önceki fiyat/tarih/tür/katılımcı/pending/rol/form regresyonları başarılı. `node test/event-store-write.mjs` gerçek store ACK/read/stale/non-admin regresyonu, `npm run check` ve staged diff başarılı.

Gerçek DOM/tarayıcı/HTTP/DB/mobil kabulü değil; canlı işlem/ödeme/dağıtım yok. Ana görev ve Sprint6 güvenlik açık.

## Sonraki bağımsız iş

AdminSupportTickets kaynak taraması liste GET hatasını yalnız console'a yazıyor; loadingfalse/tickets[] sonucu Talep bulunamadı ve0 sayacı sunuyor. Null/geçersiz yanıt ve eski oturum için sınır yok. Önce liste doğruluğu/error/retry/context; sonra detay okuma/yazma ACK/pending. Kaynak bulgusu çalışma zamanı kanıtı değildir.
