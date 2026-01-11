
CREATE TABLE IF NOT EXISTS professions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL,
  category VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO professions (name, category) VALUES
-- Hukuk & Danışmanlık
('Avukat', 'Hukuk'),
('Arabulucu', 'Hukuk'),
('Noter', 'Hukuk'),
('Fikri Haklar Danışmanı', 'Hukuk'),
('Gümrük Müşaviri', 'Hukuk & Lojistik'),
('Marka Patent Vekili', 'Danışmanlık'),
('Yönetim Danışmanı', 'Danışmanlık'),
('İK Danışmanı', 'Danışmanlık'),
('KVKK Danışmanı', 'Danışmanlık'),

-- Finans & Muhasebe & Bankacılık
('Mali Müşavir', 'Finans'),
('Yeminli Mali Müşavir', 'Finans'),
('Bağımsız Denetçi', 'Finans'),
('Banka Müdürü', 'Finans'),
('Finansal Analist', 'Finans'),
('Yatırım Danışmanı', 'Finans'),
('Sigorta Acentesi', 'Finans'),
('Bireysel Emeklilik Uzmanı', 'Finans'),
('Aktüer', 'Finans'),

-- Emlak & İnşaat & Mimarlık
('Gayrimenkul Danışmanı', 'Emlak'),
('Emlak Değerleme Uzmanı', 'Emlak'),
('Mimar', 'İnşaat'),
('İç Mimar', 'İnşaat'),
('İnşaat Mühendisi', 'İnşaat'),
('Harita Mühendisi', 'İnşaat'),
('Peyzaj Mimarı', 'İnşaat'),
('Müteahhit', 'İnşaat'),
('Yapı Denetim Uzmanı', 'İnşaat'),
('Şehir Plancısı', 'İnşaat'),

-- Teknoloji & Bilişim & Yazılım
('Yazılım Mühendisi', 'Bilişim'),
('Web Geliştirici (Frontend/Backend)', 'Bilişim'),
('Mobil Uygulama Geliştirici', 'Bilişim'),
('Veri Analisti / Veri Bilimci', 'Bilişim'),
('Siber Güvenlik Uzmanı', 'Bilişim'),
('Sistem Yöneticisi (DevOps)', 'Bilişim'),
('SEO Uzmanı', 'Bilişim'),
('E-Ticaret Yöneticisi', 'Bilişim'),
('IT Danışmanı', 'Bilişim'),
('Oyun Geliştiricisi', 'Bilişim'),

-- Sağlık & Medikal
('Doktor (Genel)', 'Sağlık'),
('Doktor (Diş Hekimi)', 'Sağlık'),
('Diyetisyen', 'Sağlık'),
('Psikolog', 'Sağlık'),
('Fizyoterapist', 'Sağlık'),
('Eczacı', 'Sağlık'),
('Veteriner Hekim', 'Sağlık'),
('Medikal Estetik Hekimi', 'Sağlık'),
('Optisyen', 'Sağlık'),

-- Medya & İletişim & Pazarlama
('Grafik Tasarımcı', 'Medya'),
('Sosyal Medya Yöneticisi', 'Medya'),
('Dijital Pazarlama Uzmanı', 'Pazarlama'),
('Reklamcı', 'Pazarlama'),
('Halkla İlişkiler Uzmanı (PR)', 'Medya'),
('Fotoğrafçı', 'Medya'),
('Video Prodüktörü / Videographer', 'Medya'),
('Metin Yazarı', 'Medya'),
('Organizasyon / Etkinlik Yöneticisi', 'Medya'),

-- Eğitim & Akademi
('Eğitim Danışmanı', 'Eğitim'),
('Kurumsal Eğitmen', 'Eğitim'),
('Dil Eğitmeni', 'Eğitim'),
('Koç (Yaşam/Kariyer)', 'Eğitim'),
('Özel Okul Kurucusu/Yöneticisi', 'Eğitim'),
('Akademisyen', 'Eğitim'),

-- Turizm & Hizmet & Gıda
('Turizm Acentesi Sahibi', 'Turizm'),
('Otel Yöneticisi', 'Turizm'),
('Restoran Sahibi / İşletmecisi', 'Hizmet'),
('Şef / Aşçıbaşı', 'Hizmet'),
('Kafe İşletmecisi', 'Hizmet'),
('Catering Hizmetleri', 'Hizmet'),
('Güzellik Merkezi Sahibi', 'Hizmet'),
('Kuaför / Saç Tasarımcısı', 'Hizmet'),
('Spor Salonu İşletmecisi / Antrenör', 'Hizmet'),

-- Lojistik & Üretim & Sanayi
('Lojistik Yöneticisi', 'Lojistik'),
('Dış Ticaret Uzmanı', 'Ticaret'),
('Fabrika Müdürü', 'Üretim'),
('Makine Mühendisi', 'Sanayi'),
('Endüstri Mühendisi', 'Sanayi'),
('Tekstil Mühendisi / Tasarımcı', 'Sanayi'),
('Gıda Mühendisi', 'Sanayi'),
('Ziraat Mühendisi', 'Tarım'),

-- Diğer
('Otomotiv Satış / Galeri', 'Otomotiv'),
('Güvenlik Sistemleri Uzmanı', 'Hizmet'),
('Baskı / Matbaa İşletmecisi', 'Hizmet')
ON CONFLICT (name) DO NOTHING;
