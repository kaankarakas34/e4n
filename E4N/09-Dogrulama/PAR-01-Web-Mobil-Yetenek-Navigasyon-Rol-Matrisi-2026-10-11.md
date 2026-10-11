# PAR-01 — Web ve Mobil Yetenek, Navigasyon ve Rol Matrisi Denetimi (E4N-115)

**Tarih:** 11 Ekim 2026  
**Görev:** [E4N-115 (PAR-01 / Web ve mobil yetenek, navigasyon ve rol matrisi denetimi)](https://linear.app/e4n/issue/E4N-115) -> **DONE**  
**Milestone:** Sprint 7 — Mobil Uygulama  
**Kapsam ve Kısıtlar:** Sıfır DDL (28 migration, 50 tablo invariyantı); web ve mobil istemci çalışma ağaçları (`src/`, `mobile/app`, `mobile/hooks`) kaynak kodları baz alınarak yetenek, navigasyon ve rol matrisi denetlenmiştir.

---

## 1. Yönetici Özeti ve Denetim Sonucu

Sprint 7'nin ikinci görevi olan **PAR-01 (E4N-115)** denetimi başarıyla tamamlanmıştır.
Web ve Mobil (React Native / Expo) istemcilerinin kullanıcı rolleri (`ANONYMOUS`, `MEMBER`, `PRESIDENT / VP`, `ADMIN`), navigasyon şemaları ve 20 temel fonksiyonel yetenek alanı uçtan uca incelenmiş; eşitlik düzeyleri (Parity Full, Parity Partial, Web Only Intentional, Gap to Close) sınıflandırılmış ve teknik dokümantasyon (`server/docs/par-01-web-mobile-capability-and-role-matrix.md`) ile sözleşme testi (`server/test/par-01-matrix-contract.mjs`) hazırlanmıştır.

---

## 2. Denetlenen Rol ve Navigasyon Mimarisi

1. **ANONYMOUS / GUEST (Ziyaretçi):**
   - Web: Açık landing, etkinlikler, blog, iletişim, giriş, açık normal kayıt (BAŞ-01 vergi alanları), şifre oluşturma.
   - Mobil: Giriş (`/(auth)/login`), Kayıt (`/(auth)/register`).
   - Bulgu: Açık tanıtım içerikleri mobilde web view veya hafif bilgi kartları olarak korunacak; açık kayıt formundaki kurumsal kimlik alanları PAR-03 ile desteklenecektir.
2. **MEMBER (Normal Üye):**
   - Web: Dashboard, Ağ, Gruplar, Loncalar, Etkinlikler, Bilet hakları, Referanslar, Birebirler, Raporlar, Fatura geçmişi.
   - Mobil: 5 Sekme (`Ana Sayfa`, `Network`, `Etkinlikler`, `Profilim`, `Menü`). Menü altında 10 özellik kartı: `meeting-requests`, `referrals`, `activities`, `lms`, `messages`, `reports` (Doğrulandı), `payment`, `store`, `support`, `settings`.
   - Bulgu: MOB-01 ile kişisel raporlar tam eşitlendi (`PARITY_FULL`). Referanslar ve Destek biletleri ortak API sözleşmesine bağlıdır.
3. **PRESIDENT / VICE_PRESIDENT (Grup Başkanı / Liderlik):**
   - Web: `/group-management` altında grup başvuru kuyruğu (7 gün SLA takibi), kabul/ret, toplantı yoklaması.
   - Mobil: `mobile/hooks/use-auth.tsx` içinde başkan rolü `MEMBER` ile aynı sekmelere yönlendirilmekte; menüde özel başkan yönetim kartı bulunmamaktadır.
   - Bulgu & Karar: Başkan rolündeki kullanıcılar için Menü ekranına özel "Grup Yönetimi (Başkanlık)" kartı eklenecek ve PAR-04'te başvuru inceleme & yoklama ekranları eşitlenecektir.
4. **ADMIN (Sistem Yöneticisi):**
   - Web: `/admin` altında tüm modüller (CRM üye oluşturma, 35 kapasite, muhasebe/fatura yükleme, shuffle simülasyonu, cron takılı iş kurtarma).
   - Mobil: `mobile/app/admin/index.tsx` altında 12 yönetim kartı ve katı `user.role === 'ADMIN'` rol kapısı doğrulanmıştır.
   - Bulgu & Karar: Karmaşık 4 aylık shuffle simülasyonu ve cron alarm konsolu gibi masaüstü operasyonları bilinçli olarak web'de tutulacaktır (`WEB_ONLY_INTENTIONAL`).

---

## 3. 20 Yetenek Alanının Eşitlik Sınıflandırması

- **PARITY_FULL (Tam Eşit - 5 Alan):**
  - PAR-01 Kimlik Doğrulama & Oturum
  - PAR-02 Kişisel Performans Raporu (MOB-01 ile tamamlandı)
  - PAR-03 Referans Yaşam Döngüsü (P32-D ile eşitlendi)
  - PAR-04 Destek Talepleri ve Biletler (P32-A ile eşitlendi)
  - PAR-05 Birebir Toplantı Talepleri (P32-B ile eşitlendi)
  - PAR-18 Admin Etkinlik ve Bilet Yönetimi
- **PARITY_PARTIAL (Kısmi Eşit - 6 Alan):**
  - PAR-07 Üye Ağı ve Profil Arama (Detay navigasyonu bağlanacak)
  - PAR-08 Kendi Profilim ve Ayarlar (Düzenleme formu güncellenecek)
  - PAR-09 Etkinlik Keşfi ve Kayıt (Kart tıklama detay ekranına bağlanacak)
  - PAR-13 Bildirimler (Okundu ve derin linkleme)
  - PAR-14 Birebir Mesajlaşma (Mock veriden gerçek API'ye geçiş)
  - PAR-17 Admin Üye ve Grup Yönetimi (Kamu ziyaretçileri yolu güncellenecek)
- **GAP_TO_CLOSE (Kapatılacak Somut Farklar - 6 Alan):**
  - PAR-06 Birebir Görüşmeler (Mobildeki `/activities` -> `/one-to-ones` eşitlemesi - PAR-02)
  - PAR-10 Çoklu Bilet ve Misafir Biletleme (Etkinlik detayında çoklu seçim - PAR-03)
  - PAR-11 Grup ve Lonca Keşfi (Mobil grup detay ekranı - PAR-03)
  - PAR-12 Abonelik & Ödeme Geçmişi (`/payments/me` -> `/memberships` - PAR-02)
  - PAR-15 Başkan Başvuru İnceleme & 7 Gün SLA (Mobil başkan paneli - PAR-04)
  - PAR-16 Başkan Toplantı Yoklaması (Mobil toplu yoklama arayüzü - PAR-04)
- **WEB_ONLY_INTENTIONAL (Bilinçli Olarak Masaüstünde Kalanlar - 3 Alan):**
  - PAR-19 Admin Muhasebe ve PDF Fatura Yükleme (Masaüstü operasyonu)
  - PAR-20 Admin 4 Aylık Shuffle Simülasyonu ve Cron Kurtarma Konsolu

---

## 4. Doğrulama ve Test Kanıtları

1. **Sözleşme Testi:** `node server/test/par-01-matrix-contract.mjs` (**PASS**)
   - 4 rol tanımı, 20 yetenek alanı, eşitlik kategorileri, mobil 5 sekme, 10 menü özelliği ve 12 admin özelliği doğrulandı.
2. **Mobil TypeScript Kontrolü:** `mobile` dizininde `npx tsc --noEmit` (**0 Hata — PASS**).
3. **Web Sağlık Kontrolleri:**
   - `npm run check`: 203 rota, 31 sağlayıcı, 0 TypeScript hatası **PASS**.
   - `npm run build`: 2814 modül temiz Vite derlemesi **PASS**.

---

## 5. İlgili Dosyalar

- **Teknik Dokümantasyon:** [`server/docs/par-01-web-mobile-capability-and-role-matrix.md`](file:///C:/Users/murat/.codex/worktrees/e4n-sprint1-foundation/e4n2/server/docs/par-01-web-mobile-capability-and-role-matrix.md)
- **Sözleşme Testi:** [`server/test/par-01-matrix-contract.mjs`](file:///C:/Users/murat/.codex/worktrees/e4n-sprint1-foundation/e4n2/server/test/par-01-matrix-contract.mjs)
- **Devam Durumu Notu:** [`E4N/00-Proje/Devam-Notu.md`](file:///C:/Users/murat/.codex/worktrees/e4n-sprint1-foundation/e4n2/E4N/00-Proje/Devam-Notu.md)

---

## 6. Sıradaki Sprint 7 İşi

Kullanıcı "devam" dediğinde Sprint 7'nin üçüncü görevi olan **[E4N-116 / PAR-02]**: Ortak API, veri ve rol davranışını iki platformda denetle ve eşitle görevine geçilecektir.
