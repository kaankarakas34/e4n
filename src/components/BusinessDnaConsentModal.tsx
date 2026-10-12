import React from 'react';
import { ShieldCheck, Sparkles, AlertTriangle, ArrowRight, X, Lock, CheckCircle2 } from 'lucide-react';
import { Button } from '../shared/Button';

interface BusinessDnaConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  isLoading?: boolean;
}

export const BusinessDnaConsentModal: React.FC<BusinessDnaConsentModalProps> = ({
  isOpen,
  onClose,
  onAccept,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 bg-[#0c1727cc] backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
    >
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-950 via-slate-900 to-[#0e1b2d] text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-600/20 border border-red-500/30 text-red-400 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-red-400 block">
                E4N • Seviye 1 İş DNA'sı Bilgilendirmesi
              </span>
              <h3 className="text-lg font-black text-white leading-tight">
                İş Profilinizi Tanımlamadan Önce Bilgilendirme
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm text-slate-700 leading-relaxed">
          {/* AI Matching & Smart Referrals */}
          <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200/80 flex items-start gap-3.5">
            <div className="p-2 bg-blue-600 text-white rounded-xl shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-extrabold text-blue-950 text-sm">
                Nitelikli İş ve Otomatik Toplantı Yönlendirmeleri
              </h4>
              <p className="text-xs sm:text-sm text-blue-900/90 mt-1 leading-relaxed">
                Bu verilerin sizlerden alınmasının temel amacı, yapay zekâ destekli sistemimizin sizler hakkında
                en doğru kararları verebilmesini sağlamaktır. Faaliyetleriniz, hedef sektörleriniz ve ideal müşteri
                profiliniz analiz edilerek size en uygun iş yönlendirmeleri ve otomatik toplantı eşleştirmeleri gerçekleştirilir.
              </p>
            </div>
          </div>

          {/* Privacy & Visibility */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-3.5">
            <div className="p-2 bg-amber-600 text-white rounded-xl shrink-0 mt-0.5">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-extrabold text-amber-950 text-sm">
                Gizlilik Standartları ve İsteğe Bağlı Grup Paylaşımı
              </h4>
              <p className="text-xs sm:text-sm text-amber-900/90 mt-1 leading-relaxed">
                Bu bilgiler varsayılan olarak tamamen <strong>dışarıya kapalıdır</strong>. Yalnızca sistem yöneticileri
                (Admin) ve başvurduğunuz kapalı grubun başkanı tarafından değerlendirme amacıyla görüntülenebilir.
              </p>
              <p className="text-xs sm:text-sm text-amber-900/90 mt-2 font-medium bg-amber-100/60 p-2.5 rounded-lg border border-amber-200">
                💡 <strong>Önemli Tavsiye:</strong> İsterseniz profil ayarlarınızdan bu bilgilerin özetini grup arkadaşlarınıza açabilirsiniz.
                Bilgilerinizi paylaştığınızda, grup arkadaşlarınız sizi ve işinizi çok daha yakından tanıyıp size çok daha doğru
                ve nitelikli iş yönlendirmeleri yapabilecektir; bunu unutmayın!
              </p>
            </div>
          </div>

          {/* Shuffle & Group Participation Precondition */}
          <div className="p-4 rounded-2xl bg-red-50/80 border border-red-200/80 flex items-start gap-3.5">
            <div className="p-2 bg-red-600 text-white rounded-xl shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-extrabold text-red-950 text-sm">
                Shuffle Rotasyonu ve Grup Başvurusu Ön Şartı
              </h4>
              <p className="text-xs sm:text-sm text-red-900/90 mt-1 leading-relaxed">
                Bu bilgilendirmeyi kabul etmeden ve Seviye 1 İş DNA'nızı tamamlamadan <strong>4 aylık Shuffle rotasyonuna katılamaz</strong> ve
                <strong> kapalı gruplara üyelik başvurusu yapamazsınız</strong>. Reddetmeniz durumunda ana kontrol panelinize dönebilirsiniz.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Verileriniz 6698 sayılı KVKK ilkelerine uygun olarak korunur ve 3. şahıslarla asla paylaşılmaz.</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold px-5 py-2.5 rounded-xl text-sm"
          >
            Reddet ve Dashboard'a Dön
          </Button>

          <Button
            type="button"
            onClick={onAccept}
            disabled={isLoading}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-500 text-white font-extrabold px-6 py-2.5 rounded-xl text-sm shadow-md shadow-red-900/20 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span>Kaydediliyor...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Kabul Ediyorum, Profilime Başla</span>
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
