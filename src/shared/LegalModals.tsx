
import { X } from 'lucide-react';

interface LegalModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    content: React.ReactNode;
}

export function LegalModal({ isOpen, onClose, title, content }: LegalModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto text-sm text-gray-700 leading-relaxed">
                    {content}
                </div>
                <div className="p-4 border-t bg-gray-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium"
                    >
                        Okudum, Anladım
                    </button>
                </div>
            </div>
        </div>
    );
}

export const LegalTexts = {
    MEMBERSHIP_AGREEMENT: (
        <div className="space-y-4">
            <p><strong>1. TARAFLAR</strong></p>
            <p>İşbu Üyelik Sözleşmesi ("Sözleşme"), Event4Network ("Şirket") ile www.event4network.com ("Site") üyesi ("Üye") arasında akdedilmiştir.</p>

            <p><strong>2. KONU</strong></p>
            <p>İşbu Sözleşme'nin konusu, Üye'nin Site'ye üye olması ve Site'de sunulan hizmetlerden yararlanmasına ilişkin şartların belirlenmesidir.</p>

            <p><strong>3. ÜYENİN HAK VE YÜKÜMLÜLÜKLERİ</strong></p>
            <ul className="list-disc pl-5">
                <li>Üye, üyelik işlemlerini gerçekleştirirken verdiği bilgilerin doğru ve güncel olduğunu beyan eder.</li>
                <li>Üye, şifresini korumakla yükümlüdür. Şifrenin 3. kişilerle paylaşılmasından doğacak sorumluluk Üye'ye aittir.</li>
                <li>Üye, Site'yi kullanırken yasalara ve genel ahlak kurallarına uymayı taahhüt eder.</li>
            </ul>

            <p><strong>4. GİZLİLİK</strong></p>
            <p>Şirket, Üye'nin kişisel verilerini KVKK kapsamında ve Gizlilik Politikası'na uygun olarak işleyecektir.</p>
        </div>
    ),

    CLARIFICATION_TEXT: ( // Aydınlatma Metni
        <div className="space-y-4">
            <p><strong>KİŞİSEL VERİLERİN KORUNMASI VE İŞLENMESİ HAKKINDA AYDINLATMA METNİ</strong></p>
            <p>Event4Network olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, "Veri Sorumlusu" sıfatıyla, kişisel verilerinizi aşağıda açıklanan amaçlar ve yöntemlerle işlemekteyiz.</p>

            <p><strong>1. Kişisel Verilerin Toplanma Yöntemi ve Hukuki Sebebi</strong></p>
            <p>Kişisel verileriniz, web sitemizdeki üyelik formu, iletişim formları, etkinlik kayıtları ve çerezler aracılığıyla elektronik ortamda toplanmaktadır. Bu veriler, "sözleşmenin kurulması veya ifası" ve "ilgili kişinin temel hak ve özgürlüklerine zarar vermemek kaydıyla veri sorumlusunun meşru menfaatleri" hukuki sebeplerine dayalı olarak işlenmektedir.</p>

            <p><strong>2. İşlenen Kişisel Veriler</strong></p>
            <ul className="list-disc pl-5">
                <li>Kimlik Bilgileri (Ad, Soyad)</li>
                <li>İletişim Bilgileri (E-posta, Telefon, Adres)</li>
                <li>Mesleki Bilgiler (Şirket Adı, Unvan, Vergi No)</li>
                <li>İşlem Güvenliği Bilgileri (IP adresi, Log kayıtları)</li>
            </ul>

            <p><strong>3. Kişisel Verilerin İşlenme Amaçları</strong></p>
            <p>Toplanan kişisel verileriniz; üyelik işlemlerinin gerçekleştirilmesi, hizmetlerimizin sunulması, iletişim faaliyetlerinin yürütülmesi ve yasal yükümlülüklerin yerine getirilmesi amaçlarıyla işlenmektedir.</p>

            <p><strong>4. Kişisel Verilerin Kimlere ve Hangi Amaçla Aktarılabileceği</strong></p>
            <p>Kişisel verileriniz, yasal düzenlemelerin öngördüğü durumlarda yetkili kamu kurum ve kuruluşlarına ve iş ortaklarımıza (etkinlik organizasyonu vb. amaçlarla sınırlı olmak üzere) aktarılabilecektir.</p>

            <p><strong>5. KVKK'nın 11. Maddesi Kapsamındaki Haklarınız</strong></p>
            <p>Veri sahibi olarak; kişisel verilerinizin işlenip işlenmediğini öğrenme, işlenmişse buna ilişkin bilgi talep etme, silinmesini veya yok edilmesini isteme gibi haklara sahipsiniz.</p>
        </div>
    ),

    EXPLICIT_CONSENT: ( // Açık Rıza Metni
        <div className="space-y-4">
            <p><strong>AÇIK RIZA METNİ</strong></p>
            <p>6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında, Aydınlatma Metni'nde detayları belirtilen kişisel verilerimin;</p>
            <ul className="list-disc pl-5">
                <li>Bana özel ürün ve hizmetlerin önerilmesi,</li>
                <li>Mesleki eşleştirme algoritmalarında kullanılması ve potansiyel iş ortaklarına profilimin önerilmesi,</li>
                <li>Yurt içi veya yurt dışındaki güvenli sunucularda saklanması,</li>
            </ul>
            <p>hususlarına özgür irademle, hiçbir baskı altında kalmadan <strong>açık rıza</strong> veriyorum.</p>
        </div>
    )
};
