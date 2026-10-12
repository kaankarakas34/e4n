// E4N Level 1 Member Business DNA Taxonomy & Question Definitions
// 16 Structured Questions (q01 - q16) across 5 Canonical Sections

export interface TaxonomyTerm {
  id: string;
  label: string;
  category?: string;
}

export interface QuestionDefinition {
  id: string;
  step: number;
  section: string;
  title: string;
  helperText: string;
  placeholder?: string;
  type: 'textarea' | 'select' | 'multi-select' | 'services-matrix' | 'structured-project' | 'text-list';
  required: boolean;
  minChars?: number;
  maxChars?: number;
  maxItems?: number;
  minItems?: number;
  hasNoneOption?: boolean;
  noneOptionLabel?: string;
  taxonomyType?: 'professions' | 'services' | 'sectors' | 'customerTypes' | 'businessModels' | 'interests' | 'goals';
}

// 5 Sections of Business DNA Form
export const BUSINESS_DNA_SECTIONS = [
  { step: 1, id: 'expertise', title: 'İş ve Uzmanlık', desc: 'Faaliyet alanınız, sunduğunuz hizmetler ve icra yönteminiz.' },
  { step: 2, id: 'market', title: 'Müşteri ve Sektör', desc: 'Hizmet verdiğiniz kitleler, tecrübe ettiğiniz ve hedeflediğiniz sektörler.' },
  { step: 3, id: 'experience', title: 'Gerçek İş Deneyimi', desc: 'Somut bir proje tecrübesi ve kapsam dışı bıraktığınız alanlar.' },
  { step: 4, id: 'network', title: 'Network ve Yönlendirme', desc: 'İdeal müşteri profiliniz, iş birliği meslekleri ve yönlendirme potansiyeliniz.' },
  { step: 5, id: 'interests', title: 'İlgi Alanları ve Beklentiler', desc: 'İş ilgi alanlarınız, topluluk katılım amacınız ve üyelere katkınız.' },
];

// Delivery Methods for Q04
export const SERVICE_DELIVERY_METHODS = [
  { id: 'self', label: 'Kendim / Bireysel İcra' },
  { id: 'internal_team', label: 'Şirket Ekibim / Kadrom' },
  { id: 'partner', label: 'Çözüm Ortağım / Dış Kaynak' },
] as const;

export type ServiceDeliveryMethod = 'self' | 'internal_team' | 'partner';

// Business Models for Q05
export const BUSINESS_MODELS: TaxonomyTerm[] = [
  { id: 'B2B', label: 'B2B (İşletmeden İşletmeye / Kurumsal)' },
  { id: 'B2C', label: 'B2C (İşletmeden Tüketiciye / Bireysel)' },
  { id: 'B2G', label: 'B2G (İşletmeden Kamuya / Kamu Kurumları)' },
];

// Customer Types for Q05
export const CUSTOMER_TYPES: TaxonomyTerm[] = [
  { id: 'sme', label: 'KOBİ / Küçük ve Orta Ölçekli İşletmeler' },
  { id: 'corporate', label: 'Kurumsal Şirketler / Holdingler' },
  { id: 'manufacturer', label: 'Üretici / Sanayi Tesisleri' },
  { id: 'exporter', label: 'İhracatçı Firmalar' },
  { id: 'importer', label: 'İthalatçı ve Distribütörler' },
  { id: 'startup', label: 'Girişimler ve Erken Aşama Şirketler' },
  { id: 'clinic', label: 'Klinik, Muayenehane ve Sağlık Merkezleri' },
  { id: 'individual', label: 'Bireysel Son Tüketici ve Aileler' },
  { id: 'professionals', label: 'Serbest Meslek Mensupları (Avukat, Mali Müşavir vb.)' },
  { id: 'ecommerce', label: 'E-Ticaret ve Dijital Satıcılar' },
  { id: 'public_sector', label: 'Belediyeler ve Kamu İktisadi Kuruluşları' },
];

// Sectors for Q06 & Q07
export const SECTORS_TAXONOMY: TaxonomyTerm[] = [
  { id: 'it_software', label: 'Bilişim, Yazılım ve Siber Güvenlik' },
  { id: 'digital_marketing', label: 'Dijital Pazarlama, Medya ve Reklamcılık' },
  { id: 'construction_realestate', label: 'İnşaat, Taahhüt, Mimarlık ve Gayrimenkul' },
  { id: 'finance_accounting', label: 'Mali Müşavirlik, Bağımsız Denetim ve Finansal Danışmanlık' },
  { id: 'legal_compliance', label: 'Hukuk, Avukatlık, KVKK ve Uyum' },
  { id: 'health_wellness', label: 'Sağlık, Medikal, Klinik ve İyi Yaşam' },
  { id: 'manufacturing_industry', label: 'İmalat Sanayii, Makine ve Metal' },
  { id: 'logistics_foreign_trade', label: 'Lojistik, Taşımacılık, Dış Ticaret ve Gümrük' },
  { id: 'education_coaching', label: 'Eğitim, Akademi ve Yönetim Koçluğu' },
  { id: 'food_beverage', label: 'Gıda, İçecek, Restoran ve Tarım' },
  { id: 'textile_fashion', label: 'Tekstil, Konfeksiyon ve Moda' },
  { id: 'automotive_mobility', label: 'Otomotiv, Yedek Parça ve Mobilite' },
  { id: 'energy_environment', label: 'Enerji, Güneş Santralleri ve Çevre Teknolojileri' },
  { id: 'tourism_hospitality', label: 'Turizm, Otelcilik, Etkinlik ve Organizasyon' },
  { id: 'insurance_risk', label: 'Sigortacılık ve Risk Yönetimi' },
  { id: 'retail_ecommerce', label: 'Perakende, Mağazacılık ve E-Ticaret' },
  { id: 'consulting_hr', label: 'İnsan Kaynakları, İşe Alım ve Yönetim Danışmanlığı' },
];

// Services Taxonomy for Q03
export const SERVICES_TAXONOMY: TaxonomyTerm[] = [
  { id: 'custom_software', label: 'Özel Yazılım, Web ve Mobil Uygulama Geliştirme' },
  { id: 'seo_performance_ads', label: 'SEO, Google Ads ve Performans Pazarlaması' },
  { id: 'corporate_branding', label: 'Kurumsal Kimlik, Grafik Tasarım ve Prodüksiyon' },
  { id: 'audit_tax_planning', label: 'Mali Danışmanlık, Vergi Planlaması ve Bordrolama' },
  { id: 'legal_contracts', label: 'Ticaret Hukuku, Sözleşme Yönetimi ve Dava Takibi' },
  { id: 'architecture_interior', label: 'Mimari Tasarım, İç Mimarlık ve Şantiye Uygulama' },
  { id: 'real_estate_brokerage', label: 'Ticari ve Konut Gayrimenkul Danışmanlığı' },
  { id: 'corporate_insurance', label: 'Kurumsal Sigorta, BES ve Filo Kasko Poliçeleri' },
  { id: 'export_import_consulting', label: 'İhracat Müşteri Bulma ve Dış Ticaret Operasyonu' },
  { id: 'freight_logistics', label: 'Uluslararası / Yurtiçi Nakliye ve Depolama' },
  { id: 'medical_aesthetic', label: 'Estetik, Diş Tedavisi ve Klinik Sağlık Hizmetleri' },
  { id: 'industrial_automation', label: 'Endüstriyel Otomasyon, Pano ve Makine İmalatı' },
  { id: 'hr_recruitment', label: 'Üst Düzey Yönetici ve Uzman Personel İşe Alımı' },
  { id: 'corporate_events', label: 'Kurumsal Etkinlik, Lansman ve Fuar Organizasyonu' },
  { id: 'cloud_cybersecurity', label: 'Bulut Bilişim, Sunucu ve Siber Güvenlik Altyapısı' },
  { id: 'management_consulting', label: 'Stratejik Yönetim, Süreç İyileştirme ve ERP Danışmanlığı' },
];

// Interests for Q14
export const INTERESTS_TAXONOMY: TaxonomyTerm[] = [
  { id: 'ai_automation', label: 'Yapay Zekâ ve İş Süreçleri Otomasyonu' },
  { id: 'global_expansion', label: 'Yurtdışı Pazarlara Açılma ve İhracat' },
  { id: 'fundraising_investment', label: 'Yatırım Alma, Fonlama ve Melek Yatırımcılık' },
  { id: 'strategic_alliances', label: 'Stratejik Ortaklıklar ve Ortak Girişimler' },
  { id: 'b2b_sales_growth', label: 'B2B Satış Taktikleri ve Gelir Artırma' },
  { id: 'leadership_culture', label: 'Liderlik, Kurumsal Kültür ve Yetenek Tutma' },
  { id: 'digital_transformation', label: 'Dijital Dönüşüm ve ERP/CRM Entegrasyonları' },
  { id: 'esg_sustainability', label: 'Sürdürülebilirlik ve Yeşil Dönüşüm' },
  { id: 'wealth_risk_management', label: 'Varlık ve Finansal Risk Yönetimi' },
  { id: 'brand_positioning', label: 'Marka Konumlandırma ve İtibar Yönetimi' },
];

// Goals for Q15
export const GOALS_TAXONOMY: TaxonomyTerm[] = [
  { id: 'new_clients', label: 'Yeni müşteriler ve nitelikli iş yönlendirmeleri edinmek' },
  { id: 'business_partners', label: 'Güvenilir iş ortakları ve çözüm ortakları bulmak' },
  { id: 'new_sectors', label: 'Farklı ve yeni sektörlere açılmak' },
  { id: 'expand_network', label: 'Nitelikli iş çevremi ve profesyonel ağımı genişletmek' },
  { id: 'share_knowledge', label: 'Bilgi, uzmanlık ve saha deneyimi paylaşmak' },
  { id: 'joint_ventures', label: 'Ortak projeler ve konsorsiyumlar geliştirmek' },
];

// Complete 16 Question Definitions
export const BUSINESS_DNA_QUESTIONS: QuestionDefinition[] = [
  // SECTION A: İŞ VE UZMANLIK
  {
    id: 'q01',
    step: 1,
    section: 'İş ve Uzmanlık',
    title: 'Şirketiniz tam olarak ne iş yapıyor?',
    helperText: 'Kime, hangi ürün veya hizmeti sunduğunuzu somut ve açık biçimde anlatın. (Örnek: "Orta ölçekli üretim şirketlerine ERP entegrasyonu ve stok takip yazılımı geliştiriyoruz.")',
    placeholder: 'Faaliyetlerinizi ve sunduğunuz temel değeri kısaca açıklayın...',
    type: 'textarea',
    required: true,
    minChars: 30,
    maxChars: 1000,
  },
  {
    id: 'q02',
    step: 1,
    section: 'İş ve Uzmanlık',
    title: 'Ana mesleğiniz veya faaliyet alanınız nedir?',
    helperText: 'E4N grup yapısında meslek tekilliği esastır. Birincil ana mesleğinizi seçin. Aradığınız meslek yoksa "Diğer" seçeneğini belirtin.',
    placeholder: 'Mesleğinizi arayın (örn. Yazılım Mimarı, Mali Müşavir, İç Mimar)...',
    type: 'select',
    required: true,
    taxonomyType: 'professions',
  },
  {
    id: 'q03',
    step: 1,
    section: 'İş ve Uzmanlık',
    title: 'Hangi ürün veya hizmetleri sunuyorsunuz?',
    helperText: 'Sunduğunuz en güçlü 1 ile 5 hizmeti seçin veya ekleyin.',
    type: 'multi-select',
    required: true,
    minItems: 1,
    maxItems: 5,
    taxonomyType: 'services',
  },
  {
    id: 'q04',
    step: 1,
    section: 'İş ve Uzmanlık',
    title: 'Bu hizmetleri nasıl sunuyorsunuz?',
    helperText: '3. soruda seçtiğiniz her bir hizmet için icra biçimini belirleyin.',
    type: 'services-matrix',
    required: true,
  },

  // SECTION B: MÜŞTERİ VE SEKTÖR
  {
    id: 'q05',
    step: 2,
    section: 'Müşteri ve Sektör',
    title: 'Kimlere hizmet veriyorsunuz?',
    helperText: 'Hizmet sunduğunuz iş modelini (B2B, B2C, B2G) ve hedef müşteri tiplerini seçin.',
    type: 'multi-select',
    required: true,
    minItems: 1,
    taxonomyType: 'customerTypes',
  },
  {
    id: 'q06',
    step: 2,
    section: 'Müşteri ve Sektör',
    title: 'Bugüne kadar hangi sektörlerde çalıştınız?',
    helperText: 'Geçmişte fiilen iş yaptığınız en fazla 5 sektörü seçin. Yeni kurulmuş bir işletmeyseniz deneyim yokluğunu belirtebilirsiniz.',
    type: 'multi-select',
    required: true,
    maxItems: 5,
    hasNoneOption: true,
    noneOptionLabel: 'Henüz sektör deneyimim yok (Yeni kurulan işletme)',
    taxonomyType: 'sectors',
  },
  {
    id: 'q07',
    step: 2,
    section: 'Müşteri ve Sektör',
    title: 'Önümüzdeki dönemde hangi sektörlerde iş yapmak istiyorsunuz?',
    helperText: 'Gelecekte odaklanmak istediğiniz en fazla 3 hedef sektörü seçin (Geçmiş deneyimlerinizden ayrı tutulur).',
    type: 'multi-select',
    required: true,
    maxItems: 3,
    hasNoneOption: true,
    noneOptionLabel: 'Henüz belirlemedim / Sektör bağımsız',
    taxonomyType: 'sectors',
  },
  {
    id: 'q08',
    step: 2,
    section: 'Müşteri ve Sektör',
    title: 'Müşterilerinizin hangi ihtiyaçlarını çözüyorsunuz?',
    helperText: 'En fazla 3 somut ihtiyacı yazın (Her biri en az 10, en fazla 250 karakter).',
    placeholder: 'Örn: Vergi risklerini minimize ederek yasal teşviklerden maksimum yararlanma',
    type: 'text-list',
    required: true,
    minItems: 1,
    maxItems: 3,
    minChars: 10,
    maxChars: 250,
  },

  // SECTION C: GERÇEK İŞ DENEYİMİ
  {
    id: 'q09',
    step: 3,
    section: 'Gerçek İş Deneyimi',
    title: 'Son dönemde gerçekleştirdiğiniz bir işi kısaca anlatır mısınız?',
    helperText: 'Hassas ticari bilgi veya müşteri ismi vermeden, sektör, ihtiyaç ve teslim ettiğiniz çıktıyı özetleyin.',
    type: 'structured-project',
    required: true,
    hasNoneOption: true,
    noneOptionLabel: 'Henüz tamamlanmış projem yok / Ürün geliştirme aşamasındayım',
  },
  {
    id: 'q10',
    step: 3,
    section: 'Gerçek İş Deneyimi',
    title: 'Hangi işleri veya hizmetleri sunmuyorsunuz?',
    helperText: 'Size yanlış iş yönlendirilmesini önlemek için kapsam dışı bıraktığınız veya yapmadığınız işleri yazın.',
    placeholder: 'Örn: Bireysel konut projeleri yapmıyoruz; sadece endüstriyel tesis ve fabrika taahhüdü alıyoruz...',
    type: 'textarea',
    required: false,
    maxChars: 600,
  },

  // SECTION D: NETWORK VE YÖNLENDİRME
  {
    id: 'q11',
    step: 4,
    section: 'Network ve Yönlendirme',
    title: 'Size nasıl bir müşteri yönlendirilmesini istersiniz?',
    helperText: 'İdeal müşterinizin profilini, ölçeğini ve size geldiğinde masada olan ihtiyacını somutlaştırın.',
    placeholder: 'Örn: Yurtdışına e-ihracat yapmak isteyen, yıllık 5M TL üzeri cirosu olan ve dijital altyapısını yenilemek isteyen markalar...',
    type: 'textarea',
    required: true,
    minChars: 30,
    maxChars: 800,
  },
  {
    id: 'q12',
    step: 4,
    section: 'Network ve Yönlendirme',
    title: 'Hangi meslek gruplarıyla iş birliği yapmak istersiniz?',
    helperText: 'Sizinle aynı müşteriye farklı açılardan dokunan ve birbirinize yönlendirme yapabileceğiniz en fazla 8 meslek seçin.',
    type: 'multi-select',
    required: true,
    maxItems: 8,
    hasNoneOption: true,
    noneOptionLabel: 'Henüz belirlemedim',
    taxonomyType: 'professions',
  },
  {
    id: 'q13',
    step: 4,
    section: 'Network ve Yönlendirme',
    title: 'Siz hangi ihtiyaçları olan müşterileri başka üyelere yönlendirebilirsiniz?',
    helperText: 'Müşterilerinizden veya çevrenizden sıkça aldığınız ancak sizin çözmediğiniz talepler nelerdir?',
    placeholder: 'Örn: Müşterilerim sıkça gümrükleme, depo kiralama ve marka tescili soruyor...',
    type: 'textarea',
    required: false,
    maxChars: 600,
  },

  // SECTION E: İLGİ ALANLARI VE BEKLENTİLER
  {
    id: 'q14',
    step: 5,
    section: 'İlgi Alanları ve Beklentiler',
    title: 'İş hayatınızda özellikle ilgilendiğiniz konular nelerdir?',
    helperText: 'İlgi duyduğunuz en fazla 10 konuyu seçin. (Not: Bu seçimler sunduğunuz hizmet veya yetkinlik yerine geçmez).',
    type: 'multi-select',
    required: true,
    maxItems: 10,
    taxonomyType: 'interests',
  },
  {
    id: 'q15',
    step: 5,
    section: 'İlgi Alanları ve Beklentiler',
    title: "E4N'ye katılmaktaki öncelikli amacınız nedir?",
    helperText: 'En fazla 2 temel amaç seçin.',
    type: 'multi-select',
    required: true,
    minItems: 1,
    maxItems: 2,
    taxonomyType: 'goals',
  },
  {
    id: 'q16',
    step: 5,
    section: 'İlgi Alanları ve Beklentiler',
    title: 'Diğer E4N üyelerine hangi konularda katkı sağlayabilirsiniz?',
    helperText: 'Kişisel uzmanlığınız, mentorluk veya sektör tecrübenizle topluluğa nasıl değer katabilirsiniz?',
    placeholder: 'Örn: İhracat teşvik mevzuatı ve hibe programları hakkında grup üyelerine ücretsiz deneyim aktarabilirim...',
    type: 'textarea',
    required: false,
    maxChars: 600,
  },
];

// Profile Structure in users.business_profile JSONB
export interface StructuredProjectAnswer {
  hasCompletedProject: boolean;
  sector?: string;
  customerType?: string;
  clientNeed?: string;
  workDone?: string;
  deliverable?: string;
  note?: string;
}

export interface BusinessDnaAnswers {
  q01?: string;
  q02?: { profession: string; customNote?: string };
  q03?: string[];
  q04?: Record<string, ServiceDeliveryMethod>;
  q05?: { businessModels: string[]; customerTypes: string[] };
  q06?: { noExperience: boolean; sectors: string[] };
  q07?: { notDetermined: boolean; sectors: string[] };
  q08?: string[];
  q09?: StructuredProjectAnswer;
  q10?: string;
  q11?: string;
  q12?: { notDetermined: boolean; professions: string[] };
  q13?: string;
  q14?: string[];
  q15?: string[];
  q16?: string;
}

export interface BusinessProfileRevision {
  revisionNumber: number;
  completedAt: string;
  answers: BusinessDnaAnswers;
}

export interface MemberBusinessProfile {
  status: 'not_started' | 'draft' | 'completed';
  schemaVersion: number;
  consentAccepted: boolean;
  consentAcceptedAt?: string;
  consentTextVersion?: string;
  isPublicToGroup: boolean;
  visibilityUpdatedAt?: string;
  answers: BusinessDnaAnswers;
  currentStep?: number;
  completedAt?: string;
  updatedAt?: string;
  revisions?: BusinessProfileRevision[];
}
