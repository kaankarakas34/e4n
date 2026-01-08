export const mockGroups = [
    { id: 'g1', name: 'Liderler Global' },
    { id: 'g2', name: 'Vizyonerler' },
    { id: 'g3', name: 'Girişimciler' },
    { id: 'g4', name: 'Anadolu Kaplanları' },
    { id: 'g5', name: 'Avrasya' },
    { id: 'g6', name: 'Boğaziçi' },
    { id: 'g7', name: 'Marmara' },
    { id: 'g8', name: 'Ege İncisi' },
    { id: 'g9', name: 'Başkent' },
    { id: 'g10', name: 'Akdeniz' },
];

export const mockPowerTeams = [
    { id: 'pt1', name: 'İnşaat Loncası' },
    { id: 'pt2', name: 'Sağlık Loncası' },
    { id: 'pt3', name: 'Bilişim Loncası' },
    { id: 'pt4', name: 'Hukuk Loncası' },
    { id: 'pt5', name: 'Finans Loncası' },
    { id: 'pt6', name: 'Eğitim Loncası' },
    { id: 'pt7', name: 'Gayrimenkul Loncası' },
    { id: 'pt8', name: 'Otomotiv Loncası' },
    { id: 'pt9', name: 'Tekstil Loncası' },
    { id: 'pt10', name: 'Turizm Loncası' },
    { id: 'pt11', name: 'Reklam & Medya Loncası' },
    { id: 'pt12', name: 'Lojistik Loncası' },
    { id: 'pt13', name: 'Enerji Loncası' },
    { id: 'pt14', name: 'Gıda Loncası' },
    { id: 'pt15', name: 'Kozmetik Loncası' },
    { id: 'pt16', name: 'Danışmanlık Loncası' },
    { id: 'pt17', name: 'Mobilya Loncası' },
    { id: 'pt18', name: 'Sigorta Loncası' },
    { id: 'pt19', name: 'Organizasyon Loncası' },
    { id: 'pt20', name: 'Sanayi Loncası' },
];

const firstNames = ['Ahmet', 'Mehmet', 'Ayşe', 'Fatma', 'Mustafa', 'Zeynep', 'Ali', 'Emre', 'Can', 'Burak', 'Elif', 'Selin', 'Cem', 'Deniz', 'Hakan', 'Serkan', 'Gökhan', 'Esra', 'Gamze', 'Derya', 'Okan', 'Pelin', 'Sinem', 'Kaan', 'Mert'];
const lastNames = ['Yılmaz', 'Kaya', 'Demir', 'Çelik', 'Şahin', 'Öz', 'Arslan', 'Doğan', 'Kılıç', 'Aslan', 'Çetin', 'Kara', 'Koç', 'Kurt', 'Özkan', 'Şimşek', 'Polat', 'Erdoğan', 'Yıldız', 'Aydın', 'Bulut', 'Keskin', 'Yanal', 'Ekinci'];
const professions = ['Mimar', 'Mühendis', 'Doktor', 'Avukat', 'Mali Müşavir', 'Yazılımcı', 'Diş Hekimi', 'Eczacı', 'Grafik Tasarımcı', 'Sigortacı', 'Emlakçı', 'Diyetisyen', 'Psikolog', 'Veteriner', 'Fotoğrafçı', 'İç Mimar', 'Reklamcı', 'Yönetmen', 'Yazar', 'Çevirmen', 'Bankacı', 'Lojistik', 'Gümrükçü', 'Turizmci', 'Otelci'];

// Generate members ensuring NO DUPLICATE PROFESSION in the SAME GROUP
const generatedMembers: any[] = [];
let memberIdCounter = 1;

mockGroups.forEach(group => {
    // Determine how many members this group will have (e.g. 20)
    // We use the professions list to loop, ensuring uniqueness
    const groupProfessions = [...professions].slice(0, 20); // Pick 20 professions

    groupProfessions.forEach(profession => {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

        // Randomly assign to a Power Team (20% chance)
        const powerTeamId = Math.random() > 0.8 ? mockPowerTeams[Math.floor(Math.random() * mockPowerTeams.length)].id : null;

        generatedMembers.push({
            id: (memberIdCounter++).toString(),
            name: `${firstName} ${lastName}`,
            email: `member${memberIdCounter}@example.com`,
            role: 'MEMBER',
            full_name: `${firstName} ${lastName}`,
            profession: profession,
            status: 'ACTIVE',
            created_at: new Date(Date.now() - Math.floor(Math.random() * 31536000000)).toISOString(),
            performance_score: Math.floor(Math.random() * 100),
            performance_color: ['GREEN', 'YELLOW', 'RED', 'GREY'][Math.floor(Math.random() * 4)],
            subscription_start_date: new Date().toISOString(),
            subscription_end_date: new Date(Date.now() + 86400000 * 365).toISOString(),
            friends: [],
            company: `${firstName} ${profession} Hizmetleri`,
            tax_id: Math.floor(Math.random() * 10000000000).toString(),
            billing_address: 'İstanbul, Türkiye',
            groupId: group.id,
            powerTeamId: powerTeamId
        });
    });
});

export const mockMembers = generatedMembers;
