import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { useAuthStore } from '../stores/authStore';
import { api } from '../api/api';
import {
  LEGAL_DOCUMENTS,
  E4N_COMPANY_INFO,
  REQUIRED_DOCUMENT_IDS,
  CONSUMER_EXTRA_ID,
  NOTICE_DOCUMENT_ID,
  OPTIONAL_DOCUMENT_IDS,
  LegalDocument
} from '../data/legalDocumentsData';
import {
  ShieldCheck,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  ExternalLink,
  Lock,
  ArrowRight,
  X,
  FileCheck,
  Check,
  Info,
  Calendar,
  Users,
  CreditCard,
  BookOpen
} from 'lucide-react';

interface MembershipActivationPageProps {
  defaultTab?: 'pre' | 'post';
}

// Markdown parser helper for modal document reader
function formatInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`|\[.*?\]\(.*?\))/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-semibold text-gray-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
      return (
        <em key={index} className="italic text-gray-800">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={index} className="bg-gray-100 text-blue-600 px-1.5 py-0.5 rounded text-xs font-mono">
          {part.slice(1, -1)}
        </code>
      );
    }
    const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
    if (linkMatch) {
      return (
        <a
          key={index}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline font-medium inline-flex items-center gap-1"
        >
          {linkMatch[1]}
        </a>
      );
    }
    return part;
  });
}

function renderMarkdownDoc(content: string) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let tableRows: string[][] = [];
  let inTable = false;

  const flushTable = (key: number) => {
    if (tableRows.length > 0) {
      const headerRow = tableRows[0];
      const bodyRows = tableRows.slice(1);
      elements.push(
        <div key={`table-${key}`} className="my-4 overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {headerRow.map((cell, cIdx) => (
                  <th key={cIdx} className="p-2.5 font-bold text-gray-800 border-r last:border-r-0 border-gray-200">
                    {formatInline(cell.trim())}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bodyRows.map((row, rIdx) => (
                <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="p-2.5 text-gray-700 border-r last:border-r-0 border-gray-100">
                      {formatInline(cell.trim())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
      inTable = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Table detection
    if (line.startsWith('|') && line.endsWith('|')) {
      if (line.includes('---')) {
        // separator row, skip
        continue;
      }
      inTable = true;
      const cells = line.split('|').slice(1, -1);
      tableRows.push(cells);
      continue;
    } else if (inTable) {
      flushTable(i);
    }

    if (!line) {
      continue;
    }

    if (line.startsWith('<!--') && line.endsWith('-->')) {
      continue; // Skip html comments
    }

    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={i} className="text-xl md:text-2xl font-extrabold text-[#0e1b2d] mt-6 mb-3 border-b pb-2">
          {formatInline(line.slice(2))}
        </h1>
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} className="text-lg md:text-xl font-bold text-[#0e1b2d] mt-5 mb-2">
          {formatInline(line.slice(3))}
        </h2>
      );
    } else if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} className="text-base font-bold text-gray-900 mt-4 mb-2">
          {formatInline(line.slice(4))}
        </h3>
      );
    } else if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={i} className="border-l-4 border-blue-500 bg-blue-50/60 text-blue-950 p-3 my-3 text-xs md:text-sm rounded-r-lg italic">
          {formatInline(line.slice(2))}
        </blockquote>
      );
    } else if (line.startsWith('- [ ] ') || line.startsWith('- [x] ')) {
      const isChecked = line.startsWith('- [x] ');
      const text = line.slice(6);
      elements.push(
        <div key={i} className="flex items-start gap-2.5 my-1.5 text-xs md:text-sm text-gray-700 pl-2">
          <input type="checkbox" checked={isChecked} readOnly className="mt-0.5 rounded text-emerald-600 focus:ring-0 cursor-default" />
          <span>{formatInline(text)}</span>
        </div>
      );
    } else if (line.startsWith('- ')) {
      elements.push(
        <li key={i} className="ml-5 list-disc text-xs md:text-sm text-gray-700 my-1 leading-relaxed">
          {formatInline(line.slice(2))}
        </li>
      );
    } else if (/^\d+\.\s/.test(line)) {
      const match = line.match(/^(\d+)\.\s(.*)/);
      if (match) {
        elements.push(
          <div key={i} className="flex items-start gap-2 text-xs md:text-sm text-gray-700 my-1 leading-relaxed ml-2">
            <span className="font-bold text-gray-900">{match[1]}.</span>
            <span>{formatInline(match[2])}</span>
          </div>
        );
      }
    } else {
      elements.push(
        <p key={i} className="text-xs md:text-sm text-gray-700 my-2 leading-relaxed">
          {formatInline(line)}
        </p>
      );
    }
  }

  if (inTable) {
    flushTable(lines.length);
  }

  return elements;
}

export function MembershipActivationPage({ defaultTab }: MembershipActivationPageProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();

  const queryParams = new URLSearchParams(location.search);
  const locationState = (location.state as any) || {};

  // Tab State: 'pre' or 'post'
  const initialStage = useMemo<'pre' | 'post'>(() => {
    if (defaultTab) return defaultTab;
    if (queryParams.get('tab') === 'pre') return 'pre';
    if (queryParams.get('tab') === 'post') return 'post';
    if (locationState.fromPayment) return 'post';
    if (user?.subscription_plan && !user?.explicit_consent) return 'post';
    return 'pre';
  }, [defaultTab, location.search, locationState, user]);

  const [stage, setStage] = useState<'pre' | 'post'>(initialStage);
  const [transactionType, setTransactionType] = useState<'business' | 'consumer'>('business');

  // Opened documents set (must open document to enable checkbox)
  const [openedDocs, setOpenedDocs] = useState<Set<string>>(new Set());
  // Checked documents set
  const [checkedDocs, setCheckedDocs] = useState<Set<string>>(new Set());

  // Post-stage handbook checkbox
  const [handbookReviewed, setHandbookReviewed] = useState(false);

  // Optional consents
  const [marketingConsent, setMarketingConsent] = useState(user?.marketing_consent || false);
  const [mediaConsent, setMediaConsent] = useState(false);

  // Modal Reader state
  const [activeModalDocId, setActiveModalDocId] = useState<string | null>(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);

  // Sync stage if query changes
  useEffect(() => {
    if (locationState.fromPayment) {
      setStage('post');
    }
  }, [locationState]);

  // List of required document IDs based on transaction type
  const requiredList = useMemo(() => {
    const list = [...REQUIRED_DOCUMENT_IDS];
    if (transactionType === 'consumer') {
      list.push(CONSUMER_EXTRA_ID);
    }
    return list;
  }, [transactionType]);

  // Total required count: required documents + KVKK notice
  const totalRequiredCount = requiredList.length + 1; // +1 for KVKK (05)

  // Current checked count among required + KVKK
  const completedRequiredCount = useMemo(() => {
    let count = 0;
    for (const id of requiredList) {
      if (checkedDocs.has(id)) count++;
    }
    if (checkedDocs.has(NOTICE_DOCUMENT_ID)) count++;
    return count;
  }, [requiredList, checkedDocs]);

  const allMandatoryChecked = completedRequiredCount === totalRequiredCount;

  // For post stage: requires all mandatory documents + handbook reviewed
  const canActivate = allMandatoryChecked && (stage === 'post' ? handbookReviewed : true);

  // Progress percentage
  const progressPercent = useMemo(() => {
    if (stage === 'pre') {
      return Math.round((completedRequiredCount / totalRequiredCount) * 100);
    } else {
      const totalSteps = totalRequiredCount + 1; // including handbook
      const currentSteps = completedRequiredCount + (handbookReviewed ? 1 : 0);
      return Math.round((currentSteps / totalSteps) * 100);
    }
  }, [stage, completedRequiredCount, totalRequiredCount, handbookReviewed]);

  // Open Document Modal
  const openDoc = (docId: string) => {
    setActiveModalDocId(docId);
    setOpenedDocs(prev => new Set(prev).add(docId));
    // Log read receipt if authenticated
    if (user) {
      void api.recordLegalAcceptance({
        documentId: docId,
        version: '0.9',
        action: 'read'
      }).catch(() => {});
    }
  };

  const closeDoc = () => {
    setActiveModalDocId(null);
  };

  // Toggle Checkbox
  const toggleDocCheck = (id: string) => {
    if (!openedDocs.has(id)) return; // Guard: Cannot check if not opened
    setCheckedDocs(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Pre-button submit
  const handlePreSubmit = () => {
    if (!allMandatoryChecked) return;
    setFeedback({
      type: 'info',
      message: 'Sözleşme ön incelemeniz tamamlandı. Şimdi üyeliğinizi başlatmak için ödeme adımına ilerleyebilirsiniz.'
    });
    // Navigate to membership checkout
    setTimeout(() => {
      navigate('/membership');
    }, 1200);
  };

  // Post-button submit (Activation)
  const handlePostActivate = async () => {
    if (!canActivate) return;
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const acceptedList = Array.from(checkedDocs);
      const res = await api.activateMembership({
        acceptedDocumentIds: acceptedList,
        acknowledgedNoticeId: NOTICE_DOCUMENT_ID,
        consumerFlow: transactionType === 'consumer',
        marketingConsent,
        mediaConsent
      });

      if (res && res.success) {
        updateUser({
          explicit_consent: true,
          kvkk_consent: true,
          marketing_consent: marketingConsent,
          account_status: 'ACTIVE'
        });

        setFeedback({
          type: 'success',
          message: 'Tebrikler! Üyelik sözleşmeleriniz ve grup katılım onayınız başarıyla sisteme kaydedildi. Hesabınız aktif hale getirildi.'
        });

        setTimeout(() => {
          navigate('/dashboard');
        }, 2200);
      } else {
        throw new Error(res?.error || 'Aktivasyon işlemi tamamlanamadı.');
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Aktivasyon sırasında bir hata oluştu. Lütfen tekrar deneyin.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Active modal document
  const activeDoc: LegalDocument | null = activeModalDocId ? (LEGAL_DOCUMENTS[activeModalDocId] || null) : null;

  return (
    <div className="min-h-screen bg-[#f5f6f9] text-[#192638] flex flex-col font-sans">
      <SEO
        title="E4N | Sözleşmeler ve Üyelik Aktivasyonu"
        description="Event for Network üyelik sözleşmeleri, grup protokolü, KVKK aydınlatma metni ve üyelik aktivasyon onay ekranı."
      />

      {/* Top Navigation Bar */}
      <header className="bg-[#0e1b2d] text-white px-4 md:px-8 py-3.5 border-b border-slate-800">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-[#61e3b9] text-[#0e1b2d] font-black text-lg flex items-center justify-center tracking-tight shadow-sm">
              e4n
            </span>
            <div>
              <span className="font-extrabold text-base tracking-tight block text-white">Event for Network</span>
              <small className="text-[10px] tracking-wider text-slate-400 uppercase font-semibold block -mt-0.5">
                Network. Trust. Growth.
              </small>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-block border border-slate-700 bg-slate-800/80 text-slate-300 rounded-full px-3 py-1 text-xs font-medium">
              Resmi Üyelik Onay & Aktivasyon Masası
            </span>
            {user ? (
              <span className="text-xs text-slate-400 bg-slate-800/50 px-2.5 py-1 rounded-md border border-slate-700">
                {user.name} ({user.company || 'Üye'})
              </span>
            ) : (
              <Link to="/login" className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold underline">
                Giriş Yap
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl w-full mx-auto px-4 py-8 md:py-12 flex-1">
        {/* Breadcrumb / Kicker */}
        <div className="text-blue-600 font-extrabold text-xs tracking-wider uppercase mb-1">
          E4N Hukuki Onboarding & Aktivasyon
        </div>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-[#0e1b2d] tracking-tight mb-3">
          Üyeliğinizi güvenle <br className="hidden sm:inline" /> başlatın.
        </h1>
        <p className="text-gray-600 text-sm md:text-base max-w-2xl leading-relaxed mb-6">
          Yıllık üyeliğinize ilişkin sözleşmeleri, grup çalışma kurallarını ve veri bilgilendirmesini tek bir yerde okuyun.
          Her belgenin içeriğini açabilir, tercihlerinizi şeffaf biçimde yönetebilirsiniz.
        </p>

        {/* 3-Step Flow Indicator */}
        <div className="flex items-center gap-2 sm:gap-4 my-6 py-2 overflow-x-auto text-xs md:text-sm font-bold">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${stage === 'pre' ? 'bg-[#0e1b2d] text-white shadow-sm' : 'text-gray-500 bg-gray-100'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${stage === 'pre' ? 'bg-[#61e3b9] text-[#0e1b2d]' : 'bg-gray-300 text-gray-700'}`}>
              1
            </span>
            Belgeleri İncele
          </div>
          <div className="w-6 sm:w-10 h-0.5 bg-gray-300" />
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${user?.subscription_plan ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' : 'text-gray-500 bg-gray-100'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${user?.subscription_plan ? 'bg-emerald-600 text-white' : 'bg-gray-300 text-gray-700'}`}>
              2
            </span>
            Ödemeyi Tamamla
          </div>
          <div className="w-6 sm:w-10 h-0.5 bg-gray-300" />
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${stage === 'post' ? 'bg-[#0e1b2d] text-white shadow-sm' : 'text-gray-500 bg-gray-100'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${stage === 'post' ? 'bg-[#61e3b9] text-[#0e1b2d]' : 'bg-gray-300 text-gray-700'}`}>
              3
            </span>
            Üyeliğini Etkinleştir
          </div>
        </div>

        {/* Two Columns Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-6">
          {/* Left Column: Interactive Acceptance Forms */}
          <section className="lg:col-span-8 bg-white border border-[#e3e8ee] rounded-2xl p-5 md:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
              <div>
                <h2 className="text-xl font-extrabold text-[#0e1b2d]">Sözleşmeler ve Onaylar</h2>
                <p className="text-gray-500 text-xs md:text-sm mt-0.5">
                  Bu ekranda hangi işlemin zorunlu, hangisinin isteğe bağlı olduğu açıkça belirtilir.
                </p>
              </div>

              {/* Stage Tabs */}
              <div className="inline-flex bg-[#edf1f7] p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setStage('pre')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${stage === 'pre' ? 'bg-white text-[#0e1b2d] shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Ödeme öncesi
                </button>
                <button
                  type="button"
                  onClick={() => setStage('post')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${stage === 'post' ? 'bg-white text-[#0e1b2d] shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Ödeme sonrası aktivasyon
                </button>
              </div>
            </div>

            {/* Transaction Type Switcher */}
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-3 my-4 text-xs">
              <label htmlFor="transactionTypeSelect" className="font-bold text-gray-700">
                İşlem türü sözleşme çerçevesi:
              </label>
              <select
                id="transactionTypeSelect"
                value={transactionType}
                onChange={e => setTransactionType(e.target.value as any)}
                className="bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-xs text-gray-800 font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="business">Ticari / mesleki üyelik (B2B)</option>
                <option value="consumer">Tüketici koşullu akış (6502 Tüketici Kanunu)</option>
              </select>
            </div>

            {/* Tab 1: PRE-CHECKOUT */}
            {stage === 'pre' && (
              <div>
                <div className="border-l-4 border-blue-500 bg-blue-50/70 p-3.5 rounded-r-lg text-xs md:text-sm text-blue-900 mb-6 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>Önemli:</strong> Ücret ve sözleşmenin temel yükümlülükleri ödemeden <em>önce</em> sunulur.
                    Tüketici niteliğindeki işlemlerde ön bilgilendirme ve cayma koşulları ayrıca gösterilir.
                  </div>
                </div>

                {/* Section 01: Mandatory */}
                <div className="mb-6">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5">
                    <span>01</span> / Bağlayıcı Üyelik Koşulları
                  </h3>

                  <div className="space-y-3">
                    {requiredList.map(docId => {
                      const doc = LEGAL_DOCUMENTS[docId];
                      if (!doc) return null;
                      const isOpened = openedDocs.has(docId);
                      const isChecked = checkedDocs.has(docId);

                      return (
                        <div
                          key={docId}
                          className={`border rounded-xl p-4 transition-all ${isChecked ? 'bg-emerald-50/40 border-emerald-200' : isOpened ? 'bg-white border-blue-200' : 'bg-gray-50/60 border-gray-200'}`}
                        >
                          <div className="flex items-start gap-3.5">
                            <input
                              type="checkbox"
                              id={`check_${docId}`}
                              checked={isChecked}
                              disabled={!isOpened}
                              onChange={() => toggleDocCheck(docId)}
                              className="w-5 h-5 mt-0.5 rounded text-emerald-600 focus:ring-0 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <label
                                  htmlFor={`check_${docId}`}
                                  className={`text-sm font-extrabold block ${isOpened ? 'cursor-pointer text-gray-900' : 'cursor-not-allowed text-gray-700'}`}
                                >
                                  {doc.title}
                                </label>
                                <span className="bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                                  Zorunlu
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 mt-1 mb-2">
                                {doc.shortDescription}
                              </p>
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => openDoc(docId)}
                                  className="text-xs font-bold text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1"
                                >
                                  Belgenin tamamını oku ↗
                                </button>
                                {isOpened ? (
                                  <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                                    <Check className="w-3.5 h-3.5" /> İncelendi
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                    Önce belgeyi açın
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Section 02: Notice / KVKK */}
                <div className="mb-6">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5">
                    <span>02</span> / Kişisel Veri Bilgilendirmesi
                  </h3>
                  {(() => {
                    const doc = LEGAL_DOCUMENTS[NOTICE_DOCUMENT_ID];
                    const isOpened = openedDocs.has(NOTICE_DOCUMENT_ID);
                    const isChecked = checkedDocs.has(NOTICE_DOCUMENT_ID);

                    return (
                      <div className={`border rounded-xl p-4 transition-all ${isChecked ? 'bg-emerald-50/40 border-emerald-200' : 'bg-gray-50/60 border-gray-200'}`}>
                        <div className="flex items-start gap-3.5">
                          <input
                            type="checkbox"
                            id={`check_${NOTICE_DOCUMENT_ID}`}
                            checked={isChecked}
                            disabled={!isOpened}
                            onChange={() => toggleDocCheck(NOTICE_DOCUMENT_ID)}
                            className="w-5 h-5 mt-0.5 rounded text-emerald-600 focus:ring-0 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <label
                                htmlFor={`check_${NOTICE_DOCUMENT_ID}`}
                                className={`text-sm font-extrabold block ${isOpened ? 'cursor-pointer text-gray-900' : 'cursor-not-allowed text-gray-700'}`}
                              >
                                {doc.title}
                              </label>
                              <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                                Bilgilendirme
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1 mb-2">
                              KVKK Aydınlatma Metni tarafıma sunuldu; kişisel verilerimin işlenmesine ilişkin bilgilendirmeyi aldım. (Bu bir açık rıza veya pazarlama izni değildir.)
                            </p>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => openDoc(NOTICE_DOCUMENT_ID)}
                                className="text-xs font-bold text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1"
                              >
                                Aydınlatma metnini oku ↗
                              </button>
                              {isOpened ? (
                                <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                                  <Check className="w-3.5 h-3.5" /> İncelendi
                                </span>
                              ) : (
                                <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                  Önce metni açın
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Section 03: Optional choices */}
                <div className="mb-6 p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                  <h3 className="text-sm font-extrabold text-[#0e1b2d] mb-1">
                    03 / İsteğe Bağlı Tercihler (Pazarlama ve Görsel İzinleri)
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed mb-3">
                    Bu izinler üyelik için zorunlu değildir. Gerçek veri akışı ve belirli görsel kullanımı tanımlandığında ayrıca istenir.
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => openDoc('08')}
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      08 — İletişim Tercihleri Metni ↗
                    </button>
                    <span className="text-gray-300">·</span>
                    <button
                      type="button"
                      onClick={() => openDoc('13')}
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      13 — Görsel İzin Örneği ↗
                    </button>
                  </div>
                </div>

                {/* Pre action button */}
                <button
                  type="button"
                  disabled={!allMandatoryChecked}
                  onClick={handlePreSubmit}
                  className="w-full py-3.5 px-4 rounded-xl font-extrabold text-sm transition-all bg-[#0e1b2d] text-white hover:bg-slate-800 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed shadow-md"
                >
                  {allMandatoryChecked
                    ? 'Sözleşmeleri Onayladım — Ödeme Adımına Geç ↗'
                    : `Belgeleri tamamlayınca devam edebilirsiniz (${completedRequiredCount} / ${totalRequiredCount})`}
                </button>
              </div>
            )}

            {/* Tab 2: POST-CHECKOUT ACTIVATION */}
            {stage === 'post' && (
              <div>
                <div className="border-l-4 border-emerald-500 bg-emerald-50/70 p-3.5 rounded-r-lg text-xs md:text-sm text-emerald-950 mb-6 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>Ödeme Sonrası Aktivasyon:</strong> Bu sayfa, üyelik satın alımı sonrası gereken son onayları ve grup kurallarını sunar.
                    Aşağıdaki belgeleri onaylayarak ana grup yerleşiminizi ve panel yetkilerinizi anında başlatabilirsiniz.
                  </div>
                </div>

                {/* Purchased Plan Summary Card */}
                <div className="mb-6 p-4 rounded-xl border border-gray-200 bg-white shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Satın Alma ve Hesap Durumu</span>
                    <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                      {user?.subscription_plan || 'Yıllık Üyelik'}
                    </span>
                  </div>
                  <div className="text-sm font-extrabold text-[#0e1b2d]">
                    {user?.name || 'Üye Adayı'} — {user?.company || E4N_COMPANY_INFO.brand}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Ödeme kaydınız sisteme ulaştı. Üyeliğinizin etkinleştirilmesi için bağlayıcı sözleşme onayları beklenmektedir.
                  </div>
                </div>

                {/* Step 1: Mandatory Agreements */}
                <div className="mb-6">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5">
                    <span>01</span> / Zorunlu Üyelik ve Grup Protokolü Onayı
                  </h3>

                  <div className="space-y-3">
                    {requiredList.map(docId => {
                      const doc = LEGAL_DOCUMENTS[docId];
                      if (!doc) return null;
                      const isOpened = openedDocs.has(docId);
                      const isChecked = checkedDocs.has(docId);

                      return (
                        <div
                          key={docId}
                          className={`border rounded-xl p-4 transition-all ${isChecked ? 'bg-emerald-50/40 border-emerald-200' : isOpened ? 'bg-white border-blue-200' : 'bg-gray-50/60 border-gray-200'}`}
                        >
                          <div className="flex items-start gap-3.5">
                            <input
                              type="checkbox"
                              id={`post_check_${docId}`}
                              checked={isChecked}
                              disabled={!isOpened}
                              onChange={() => toggleDocCheck(docId)}
                              className="w-5 h-5 mt-0.5 rounded text-emerald-600 focus:ring-0 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <label
                                  htmlFor={`post_check_${docId}`}
                                  className={`text-sm font-extrabold block ${isOpened ? 'cursor-pointer text-gray-900' : 'cursor-not-allowed text-gray-700'}`}
                                >
                                  {doc.title}
                                </label>
                                <span className="bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                                  Zorunlu
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 mt-1 mb-2">
                                {doc.shortDescription}
                              </p>
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => openDoc(docId)}
                                  className="text-xs font-bold text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1"
                                >
                                  Belgenin tamamını oku ↗
                                </button>
                                {isOpened ? (
                                  <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                                    <Check className="w-3.5 h-3.5" /> İncelendi
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                    Önce belgeyi açın
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* KVKK in Post stage */}
                    {(() => {
                      const doc = LEGAL_DOCUMENTS[NOTICE_DOCUMENT_ID];
                      const isOpened = openedDocs.has(NOTICE_DOCUMENT_ID);
                      const isChecked = checkedDocs.has(NOTICE_DOCUMENT_ID);

                      return (
                        <div className={`border rounded-xl p-4 transition-all ${isChecked ? 'bg-emerald-50/40 border-emerald-200' : 'bg-gray-50/60 border-gray-200'}`}>
                          <div className="flex items-start gap-3.5">
                            <input
                              type="checkbox"
                              id={`post_check_${NOTICE_DOCUMENT_ID}`}
                              checked={isChecked}
                              disabled={!isOpened}
                              onChange={() => toggleDocCheck(NOTICE_DOCUMENT_ID)}
                              className="w-5 h-5 mt-0.5 rounded text-emerald-600 focus:ring-0 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <label
                                  htmlFor={`post_check_${NOTICE_DOCUMENT_ID}`}
                                  className={`text-sm font-extrabold block ${isOpened ? 'cursor-pointer text-gray-900' : 'cursor-not-allowed text-gray-700'}`}
                                >
                                  {doc.title}
                                </label>
                                <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                                  Bilgilendirme
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 mt-1 mb-2">
                                KVKK Aydınlatma Metni tarafıma sunuldu; haklarımı ve veri işleme ilkelerini okudum.
                              </p>
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => openDoc(NOTICE_DOCUMENT_ID)}
                                  className="text-xs font-bold text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1"
                                >
                                  Aydınlatma metnini oku ↗
                                </button>
                                {isOpened ? (
                                  <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                                    <Check className="w-3.5 h-3.5" /> İncelendi
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                    Önce metni açın
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Step 2: Member Handbook & Rules acknowledgment */}
                <div className="mb-6">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5">
                    <span>02</span> / İlk Üyelik Adımları ve Çalışma Rehberi
                  </h3>
                  <div className="border rounded-xl p-4 bg-white border-gray-200">
                    <div className="flex items-start gap-3.5">
                      <input
                        type="checkbox"
                        id="handbookCheck"
                        checked={handbookReviewed}
                        onChange={e => setHandbookReviewed(e.target.checked)}
                        className="w-5 h-5 mt-0.5 rounded text-emerald-600 focus:ring-0 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <label htmlFor="handbookCheck" className="text-sm font-extrabold text-gray-900 cursor-pointer block">
                          Grup kurallarını, toplantı düzenini ve ilk adımları gözden geçirdim.
                        </label>
                        <p className="text-xs text-gray-600 mt-1 mb-2">
                          35 kişilik tavan kapasite · İki haftada bir online toplantı (20.00) · Dört ayda bir shuffle · 15 dk tolerans · 2 vekil hakkı · Sürüm 1.1 resmi rehber.
                        </p>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => openDoc('H')}
                            className="text-xs font-bold text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1"
                          >
                            9 sekmelik üye rehberini incele ↗
                          </button>
                          <Link
                            to="/rehber"
                            target="_blank"
                            className="text-xs font-semibold text-gray-500 hover:text-gray-800 inline-flex items-center gap-1"
                          >
                            Rehber sayfasına git <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 3: Optional consents */}
                <div className="mb-6 p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                  <h3 className="text-sm font-extrabold text-[#0e1b2d] mb-1">
                    03 / İsteğe Bağlı Tercihler
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed mb-3">
                    Aşağıdaki izinler üyeliğiniz için zorunlu değildir; dilediğiniz zaman profil ayarlarınızdan değiştirebilirsiniz.
                  </p>

                  <div className="space-y-2.5 text-xs text-gray-800">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={marketingConsent}
                        onChange={e => setMarketingConsent(e.target.checked)}
                        className="w-4 h-4 mt-0.5 rounded text-emerald-600 focus:ring-0"
                      />
                      <span>E4N yeni etkinlikleri, eğitim duyuruları ve özel içerikleri hakkında ticari elektronik ileti (e-posta/SMS) almayı kabul ediyorum.</span>
                    </label>

                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={mediaConsent}
                        onChange={e => setMediaConsent(e.target.checked)}
                        className="w-4 h-4 mt-0.5 rounded text-emerald-600 focus:ring-0"
                      />
                      <span>Katıldığım fiziksel veya çevrim içi etkinliklerde topluluk tanıtımı amaçlı fotoğraf/video kayıtlarımın sınırlı kullanımına izin veriyorum.</span>
                    </label>
                  </div>
                </div>

                {/* Post action button */}
                <button
                  type="button"
                  disabled={!canActivate || isSubmitting}
                  onClick={handlePostActivate}
                  className="w-full py-4 px-4 rounded-xl font-extrabold text-sm transition-all bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    'Üyelik Etkinleştiriliyor...'
                  ) : canActivate ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Sözleşmeleri Kabul Ediyorum — Üyeliğimi Etkinleştir
                    </>
                  ) : (
                    `Gerekli onayları tamamlayın (${completedRequiredCount} / ${totalRequiredCount})`
                  )}
                </button>
              </div>
            )}

            {/* Inline Feedback Banner */}
            {feedback && (
              <div
                className={`mt-4 p-4 rounded-xl border text-xs md:text-sm flex items-start gap-2.5 ${
                  feedback.type === 'success'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : feedback.type === 'error'
                    ? 'bg-red-50 border-red-300 text-red-900'
                    : 'bg-blue-50 border-blue-300 text-blue-900'
                }`}
              >
                {feedback.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />}
                {feedback.type === 'error' && <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />}
                {feedback.type === 'info' && <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />}
                <div className="flex-1 font-semibold">{feedback.message}</div>
              </div>
            )}
          </section>

          {/* Right Column: Sticky Membership Summary & Official Company Info */}
          <aside className="lg:col-span-4 sticky top-6 space-y-5">
            {/* Membership Summary Card */}
            <div className="bg-white border border-[#e3e8ee] rounded-2xl p-5 shadow-sm">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 block">
                Üyelik Özeti
              </span>
              <div className="text-xl font-extrabold text-[#0e1b2d] mt-1 mb-4">
                E4N Yıllık Üyelik
              </div>

              <div className="divide-y divide-gray-100 text-xs">
                <div className="py-2.5 flex justify-between gap-4">
                  <span className="text-gray-500 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Süre</span>
                  <b className="text-gray-900">12 ay (Yıllık)</b>
                </div>
                <div className="py-2.5 flex justify-between gap-4">
                  <span className="text-gray-500 flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5" /> Ödeme</span>
                  <b className="text-gray-900">Yıllık peşin</b>
                </div>
                <div className="py-2.5 flex justify-between gap-4">
                  <span className="text-gray-500 flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Ana Grup</span>
                  <b className="text-gray-900">Maksimum 35 kişi</b>
                </div>
                <div className="py-2.5 flex justify-between gap-4">
                  <span className="text-gray-500">Toplantı</span>
                  <b className="text-gray-900">2 haftada bir (online 20.00)</b>
                </div>
                <div className="py-2.5 flex justify-between gap-4">
                  <span className="text-gray-500">Shuffle</span>
                  <b className="text-gray-900">4 ayda bir rotasyon</b>
                </div>
                <div className="py-2.5 flex justify-between gap-4">
                  <span className="text-gray-500">Fiyat</span>
                  <b className="text-[#0e1b2d] font-black">32.400 TL + %20 KDV</b>
                </div>
              </div>

              {/* Progress Meter */}
              <div className="mt-5 pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                  <span className="text-gray-600">Onay Durumunuz</span>
                  <span className="text-[#0e1b2d] font-black">
                    {stage === 'pre'
                      ? `${completedRequiredCount} / ${totalRequiredCount}`
                      : `${completedRequiredCount + (handbookReviewed ? 1 : 0)} / ${totalRequiredCount + 1}`}
                  </span>
                </div>
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500 font-medium">
                <span>Ayrı veri izinleri zorunlu değildir</span>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
            </div>

            {/* Official Company Credentials Card */}
            <div className="bg-white border border-[#e3e8ee] rounded-2xl p-5 shadow-sm">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 block mb-1">
                Resmi Hizmet Sağlayıcı
              </span>
              <h4 className="text-sm font-black text-[#0e1b2d] leading-snug">
                {E4N_COMPANY_INFO.title}
              </h4>

              <div className="mt-3 space-y-2 text-[11px] text-gray-600 divide-y divide-gray-50">
                <div className="pt-2 flex items-start gap-2">
                  <Building2 className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-gray-800">Vergi Dairesi / No:</span>
                    <div>{E4N_COMPANY_INFO.taxOffice} — {E4N_COMPANY_INFO.taxNumber}</div>
                  </div>
                </div>

                <div className="pt-2 flex items-start gap-2">
                  <Lock className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-gray-800">MERSİS No:</span>
                    <div className="font-mono text-[10px] text-gray-700">{E4N_COMPANY_INFO.mersis}</div>
                  </div>
                </div>

                <div className="pt-2 flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-gray-800">Merkez Adres:</span>
                    <div>{E4N_COMPANY_INFO.address}</div>
                  </div>
                </div>

                <div className="pt-2 flex items-start gap-2">
                  <Mail className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-gray-800">İletişim & KEP:</span>
                    <div>{E4N_COMPANY_INFO.supportEmail}</div>
                    <div className="text-gray-500 text-[10px]">{E4N_COMPANY_INFO.kep}</div>
                  </div>
                </div>

                <div className="pt-2 flex items-start gap-2">
                  <Phone className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-gray-800">Telefon:</span>
                    <div>{E4N_COMPANY_INFO.phone}</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 text-[10px] text-gray-500 leading-relaxed">
                Tüm sözleşmeler ve onay kayıtları 6563 sayılı ETK ve 6698 sayılı KVKK kapsamında elektronik ortamda zaman damgasıyla saklanmaktadır.
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Modal Document Viewer */}
      {activeDoc && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 bg-[#0c1727cc] backdrop-blur-xs z-50 flex items-center justify-center p-3 md:p-6"
          onClick={e => {
            if (e.target === e.currentTarget) closeDoc();
          }}
        >
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-700">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between gap-4 bg-gray-50/80">
              <div className="min-w-0">
                <h3 className="font-extrabold text-base md:text-lg text-[#0e1b2d] truncate">
                  {activeDoc.title}
                </h3>
                <span className="text-[11px] text-gray-500 font-semibold">
                  E4N Hukuki Belge Kütüphanesi · Sürüm 0.9 / 1.1 Taslak
                </span>
              </div>
              <button
                type="button"
                onClick={closeDoc}
                className="w-9 h-9 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-black flex items-center justify-center transition-all cursor-pointer"
                aria-label="Kapat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 md:p-8 overflow-y-auto flex-1 font-sans text-gray-800">
              {renderMarkdownDoc(activeDoc.content)}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-xs text-gray-600">
              <span className="hidden sm:inline">
                Pardus Ticaret Haydar Karakaş (Event4Network) · Resmi Belge
              </span>
              <button
                type="button"
                onClick={closeDoc}
                className="ml-auto bg-[#0e1b2d] hover:bg-slate-800 text-white font-extrabold px-4 py-2 rounded-xl transition-all"
              >
                Okudum ve Anladım ×
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MembershipActivationPage;
