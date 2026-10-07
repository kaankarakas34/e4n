# Mevcut durum — 1 Ekim 2026

## Doğrulanan ortam

| Alan | Sonuç |
|---|---|
| Obsidian vault | `C:\Users\murat\OneDrive\Desktop\e4n2`; Obsidian yapılandırmasında açık görünüyor |
| Repo | `C:\Users\murat\OneDrive\Desktop\e4n2` |
| Branch / commit | `main`, `7ead1690ab1b7344fe2ea98d6217700e3f39e0ab` |
| GitHub remote | `https://github.com/kaankarakas34/e4n.git` |
| Linear | `e4n` çalışma alanı, `E4n` takımı, ayrı proje `P-E4N-3` |
| AGENTS.md | Bu repo içinde hedefli aramada bulunmadı |
| Çalışma ağacı | Başlangıçta çok sayıda değiştirilmiş/eklenmiş dosya vardı; `deploy/api`, `server/.env`, `.env` ve `mobile` dahil. Korunuyor. |

`mobile` iç içe Git deposu olarak görünüyor; üst depoda gitlink var ancak `.gitmodules` eşlemesi bulunmadı. İç repo `master` branch ve `db2028480fa28ad1a421d14189345f04368130c8` commit'inde; orada da önceden var olan çok sayıda değişiklik var.

## İlk teknik resim

- Web: React 18, TypeScript, Vite, React Router, Zustand. Ana route tablosu `src/App.tsx`.
- API: Express/Node, PostgreSQL (`pg`). Vercel giriş noktası `api/index.js` üzerinden `server/src/index.js`; ayrıca `deploy/api` kopyası var.
- Veri: `server/init.sql` başlangıç şeması, `server/src/config/migrate.js` açılışta şema eklemeleri; Supabase bağlantı seçeneği. Gerçek canlı şema bu aşamada okunmadı.
- Mobil: `mobile/` içinde Expo/React Native uygulaması; üst repo ile sürüm bağı doğrulanacak.
- Dış sistemler: ödeme, e-posta, bilet ve etkinlik izleri var; tam akış ve canlı yapılandırma henüz doğrulanmadı.

## Doğrulama sınırı

Web için `npm run check` başarılı. `npm run lint` 763 hata ve 21 uyarıyla başarısız; mobil kaynaklar da lint kapsamına giriyor. Canlı Supabase'de yalnız şema, izin ve toplu satır sayımı sorguları çalıştırıldı; migration, ödeme veya veri değişikliği yapılmadı. Kaynak incelemesi sistemin üretimde aynı biçimde çalıştığını tek başına kanıtlamaz.

Önce [[E4N/02-Mevcut-Sistem/Ilk-Envanter|ilk envanter]] tamamlanıp rota, API ve şema eşlemesi derinleştirilecek.
