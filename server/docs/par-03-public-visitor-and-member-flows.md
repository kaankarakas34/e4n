# PAR-03 — Genel, Ziyaretçi ve Üye Akışlarını Web ve Mobilde Eşitleme (Public, Visitor & Member Flows)

Bu doküman, Event4Network (E4N) Web ve Mobil istemcileri arasındaki açık kayıt, üye keşfi, etkinlik biletleme, doğrudan mesajlaşma ve profil yönetimi akışlarının uzlaştırılmasını belgeler.

---

## 1. Yürütülen Eşitlemeler ve Kapsam

### 1.1. Açık ve Kurumsal Üyelik Kaydı (`mobile/app/(auth)/register.tsx`)
- **Web Sözleşmesi:** `POST /api/auth/register` (BAŞ-01 / E4N-161 zorunlu alan kuralları).
- **Eklenen Zorunlu Alanlar:**
  - `company`: Şirket tam ticari unvanı.
  - `taxNumber` (`tax_number`): 10 haneli VKN veya şahıs firması için 11 haneli TCKN.
  - `taxOffice` (`tax_office`): Bağlı bulunulan vergi dairesi.
  - `billingAddress` (`billing_address`): Resmi şirket fatura adresi.
  - `city`: Türkiye ili doğrulaması.
  - `ref` / `referralCode`: İsteğe bağlı sponsor üye referans kodu desteği (BAŞ-02).
- **Validasyon:** Eksik kurumsal alan, 10/11 haneden farklı vergi numarası ve 8 karakterden kısa şifre istemci seviyesinde engellendi.

### 1.2. Üye Ağı ve Detaylı Profil Keşfi (`mobile/app/(tabs)/network.tsx`)
- **Etkileşim:** Üye kartlarına `onPress` etkileşimi kazandırıldı; tıklanan üye için detaylı profil modali render edildi.
- **Profil Kartı:**
  - Ad Soyad, Uzmanlık Mesleği, Şirket Unvanı, İl.
  - İletişim bilgileri (e-posta, telefon).
  - Performans Karnesi: Canlı puan (`performance_score`), Trafik ışığı rozeti (`performance_color`: Yeşil, Sarı, Kırmızı, Gri).
- **Aksiyonlar:**
  - `Birebir Toplantı Talep Et` -> `/features/meeting-requests`
  - `İş Referansı Ver` -> `/features/referrals`
  - `Mesaj Gönder` -> `/features/messages`

### 1.3. Etkinlik Detayı, Bilet Hakları ve Çoklu Bilet (`mobile/app/(tabs)/events.tsx`)
- **P25 Üyelikten Bilet Hakları Rozetleri:**
  - Ağ toplantıları ve ziyaretçi günleri için: `Üyelere Ücretsiz (P25)`.
  - Ücretli eğitim ve sosyal organizasyonlar için: `%50 Üye İndirimi` ve orijinal fiyat karşılaştırması.
- **P26 Çoklu / Misafir Bilet Seçimi:**
  - Kart tıklandığında açılan detay penceresinde bilet adedi artırma/azaltma seçicisi (`- / +`, 1-10 adet).
  - Katılım teyit modalı ve `POST /events/:id/register` çağrısı.

### 1.4. Gerçek Doğrudan Mesajlaşma Akışı (`mobile/app/features/messages.tsx`)
- Sabit mock veri (`MESSAGES_MOCK`) tamamen kaldırıldı.
- `GET /api/messages/conversations` ile konuşma listesi bağlandı (arkadaş bilgisi, son mesaj metni ve UTC tarihi).
- Konuşma tıklandığında `GET /api/messages/:targetId` ile mesaj geçmişi sayfası yüklendi.
- `POST /api/messages/:targetId` ile metin gönderme ve `uuid.v4()` idempotent `requestKey` desteği sağlandı.

### 1.5. Profil Yönetimi ve Düzenleme (`mobile/app/(tabs)/profile.tsx`)
- `Profili Düzenle` modalı eklendi.
- `name`, `phone`, `city`, `profession` alanları `PUT /api/users/me` (`installSelfProfile`) sözleşmesiyle güncellendi.
- `Yardım ve Destek` butonu doğrudan `/features/support` rotasına bağlandı.

---

## 2. Doğrulama ve Test Kanıtları

- **Sözleşme Koşucusu:** `server/test/par-03-public-visitor-member-flow-contract.mjs`
- **İzole Ortam:** PostgreSQL 17 Docker konteyneri, 28 sürüm, 50 tablo invariyantı (Sıfır DDL).
- **Test Senaryoları (4/4 PASS):**
  1. `Corporate Registration`: Eksik kurumsal alanlar 400 ile engellendi; VKN, vergi dairesi, şirket unvanı ve fatura adresi ile 201 kayıt başarıyla oluşturuldu ve veritabanı teyit edildi.
  2. `Self-Profile Update`: `PUT /users/me` ile profil bilgileri atomik güncellendi ve veritabanı okuması doğrulandı.
  3. `Event Registration`: Etkinlik katılımı sözleşmeye uygun şekilde doğrulandı.
  4. `Direct Messages`: Bağlantılı iki üye arasında mesaj gönderimi (200), konuşmalar listesi okuması (200) ve mesaj geçmişi (200) başarıyla doğrulandı.
- **Tip & Derleme Kontrolleri:**
  - `mobile`: `npx tsc --noEmit` -> **0 hata (PASS)**
  - `web`: `npm run check` -> **203 rota, 31 sağlayıcı, 0 TS hatası (PASS)**
  - `web`: `npm run build` -> **2814 modül temiz derleme (PASS)**
