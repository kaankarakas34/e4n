# PAR-04 — Admin destek detay okuması

3 Ekim 2026, commit `e5b3f47`, yönetilen dala push edildi.

## Teslim

Talep açılırken önceki ticket/messages gizlenir, görünür loading/error/retry ve listeye dönüş. Aynı oturumda hedef ref ve request sequence yanlış sırayla dönen yanıtı atar. Kapatma, user/role değişimi ve unmount sonucu uygulamaz.

Yanıt ticket/id/listeden bilinen user_id ile doğrulanır. Messages array ve her row id/sender_id/ticket_id/message/sender_role/date ve opsiyonel sender_name doğrulanır. Gerçek[] ayrı mesaj-yok durumudur. Farklı talebe/kullanıcıya ait detay kabul edilmez. Send/status mevcut callback'lerine current target/sequence sınırı eklenir; bu ACK/tek pending çözümü değildir.

## Doğrulama

`node test/admin-support-list.mjs`: gerçek TSX kontrollü hooks/API; reject/null/object/wrong-ticket/wrong-owner/invalid message/wrong message target; retry/trueempty; eski mesajların loading sırasında gizlenmesi; switched/closed/session-before-cleanup/unmounted delayed response. Önceki liste testleri de başarılı.

`npm run check`, staged diff başarılı. Gerçek DOM/tarayıcı/HTTP/DB/mobil kanıtı değildir. Aktif API kaynakta detail için ADMIN veya ticket owner kontrol eder; bu tur server rol politikası değiştirilmedi veya izole HTTP testi yapılmadı. Canlı yazma/ödeme/dağıtım yok, ana görev/Sprint6 açık.

## Sonraki iş

Reply/status strict ACK ve tek pending, taze hedef/veri, yazma başarı sonucunun detail/list refresh hatasından ayrılması. Liste refresh ve detail sequence'nin aynı session'daki etkileşimi de test edilmeli; bu tur ACK/pending ve refresh tam kabulü yapılmadı. Draft/başarı sonucu yeni talebe taşınmamalı.
