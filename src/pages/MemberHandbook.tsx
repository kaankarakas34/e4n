import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { useAuthStore } from '../stores/authStore';
import { HANDBOOK_META, HANDBOOK_TABS, HandbookTab } from '../data/handbookData';
import { Button } from '../shared/Button';
import {
  Compass,
  Briefcase,
  Calendar,
  Handshake,
  RefreshCw,
  Shield,
  Scale,
  CreditCard,
  HelpCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Search,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Sparkles,
  Info,
  CheckSquare,
  Square,
  UserCheck,
  Share2,
  Lock
} from 'lucide-react';

const TAB_ICONS: Record<string, React.ElementType> = {
  'hos-geldiniz': Compass,
  'uyelik-meslek': Briefcase,
  'gruplar-toplantilar': Calendar,
  'isbirligi': Handshake,
  'shuffle-puan': RefreshCw,
  'loncalar-yonetim': Shield,
  'etik-gizlilik': Scale,
  'finans-disiplin': CreditCard,
  'ilk-adimlar': HelpCircle,
};

// Helper to format inline bold, italic, code, links
function formatInlineText(text: string): React.ReactNode {
  // Split by bold (**text**)
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
        <code key={index} className="bg-gray-100 text-red-600 px-1.5 py-0.5 rounded text-xs font-mono">
          {part.slice(1, -1)}
        </code>
      );
    }
    const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
    if (linkMatch) {
      const isAnchor = linkMatch[2].startsWith('#');
      if (isAnchor) {
        return (
          <a
            key={index}
            href={linkMatch[2]}
            className="text-red-600 hover:text-red-700 underline font-medium"
          >
            {linkMatch[1]}
          </a>
        );
      }
      return (
        <a
          key={index}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-red-600 hover:text-red-700 underline font-medium"
        >
          {linkMatch[1]}
        </a>
      );
    }
    return part;
  });
}

interface ParsedBlock {
  type: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'quote' | 'table' | 'ul' | 'ol' | 'checklist' | 'faq';
  text?: string;
  items?: string[];
  checkItems?: { checked: boolean; text: string }[];
  headers?: string[];
  rows?: string[][];
  faqQuestion?: string;
  faqAnswer?: string;
}

function parseMarkdownToBlocks(md: string): ParsedBlock[] {
  const lines = md.split('\n');
  const blocks: ParsedBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === '' || line.trim().startsWith('<a id=') || line.trim().startsWith('<!--')) {
      i++;
      continue;
    }

    // Headers
    if (line.startsWith('#### ')) {
      blocks.push({ type: 'h4', text: line.replace('#### ', '').trim() });
      i++;
      continue;
    }
    if (line.startsWith('### ')) {
      blocks.push({ type: 'h3', text: line.replace('### ', '').trim() });
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      blocks.push({ type: 'h2', text: line.replace('## ', '').trim() });
      i++;
      continue;
    }
    if (line.startsWith('# ')) {
      blocks.push({ type: 'h1', text: line.replace('# ', '').trim() });
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      blocks.push({ type: 'quote', text: quoteLines.join('\n') });
      continue;
    }

    // Table
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      if (tableLines.length >= 2) {
        const headerRow = tableLines[0].split('|').slice(1, -1).map(c => c.trim());
        // Skip separator line (|---|---|)
        const rows = tableLines.slice(2).map(r => r.split('|').slice(1, -1).map(c => c.trim()));
        blocks.push({ type: 'table', headers: headerRow, rows });
        continue;
      }
    }

    // Checklist (- [ ] or - [x])
    if (line.trim().startsWith('- [ ]') || line.trim().startsWith('- [x]')) {
      const checkItems: { checked: boolean; text: string }[] = [];
      while (i < lines.length && (lines[i].trim().startsWith('- [ ]') || lines[i].trim().startsWith('- [x]'))) {
        const checked = lines[i].trim().startsWith('- [x]');
        const text = lines[i].trim().replace(/^- \[[ x]\]\s*/, '');
        checkItems.push({ checked, text });
        i++;
      }
      blocks.push({ type: 'checklist', checkItems });
      continue;
    }

    // Unordered List
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      const items: string[] = [];
      while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ''));
        i++;
      }
      blocks.push({ type: 'ul', items });
      continue;
    }

    // Ordered List
    if (/^\d+\.\s+/.test(line.trim())) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
        i++;
      }
      blocks.push({ type: 'ol', items });
      continue;
    }

    // Detect FAQ item: **Question?** \n Answer
    if (line.trim().startsWith('**') && line.trim().endsWith('?**')) {
      const question = line.trim().slice(2, -3);
      i++;
      const ansLines: string[] = [];
      while (
        i < lines.length &&
        lines[i].trim() !== '' &&
        !lines[i].startsWith('#') &&
        !(lines[i].trim().startsWith('**') && lines[i].trim().endsWith('?**'))
      ) {
        ansLines.push(lines[i].trim());
        i++;
      }
      blocks.push({
        type: 'faq',
        faqQuestion: question,
        faqAnswer: ansLines.join(' ')
      });
      continue;
    }

    // Normal Paragraph
    const pLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].startsWith('#') &&
      !lines[i].startsWith('> ') &&
      !(lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) &&
      !lines[i].trim().startsWith('- ') &&
      !/^\d+\.\s+/.test(lines[i].trim()) &&
      !(lines[i].trim().startsWith('**') && lines[i].trim().endsWith('?**')) &&
      !lines[i].trim().startsWith('<a id=') &&
      !lines[i].trim().startsWith('<!--')
    ) {
      pLines.push(lines[i].trim());
      i++;
    }
    if (pLines.length > 0) {
      blocks.push({ type: 'p', text: pLines.join(' ') });
    }
  }

  return blocks;
}

export function MemberHandbook() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Active tab state from URL hash or query param or default
  const [activeTabId, setActiveTabId] = useState<string>(() => {
    const hash = location.hash.replace('#', '');
    if (hash && HANDBOOK_TABS.some(t => t.id === hash)) return hash;
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam && HANDBOOK_TABS.some(t => t.id === tabParam)) return tabParam;
    return HANDBOOK_TABS[0].id;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [openFaqIndices, setOpenFaqIndices] = useState<Record<number, boolean>>({});
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // Sync tab change with hash
  const handleSelectTab = (tabId: string) => {
    setActiveTabId(tabId);
    window.location.hash = tabId;
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  const currentTab = useMemo(() => {
    return HANDBOOK_TABS.find(t => t.id === activeTabId) || HANDBOOK_TABS[0];
  }, [activeTabId]);

  const currentIndex = useMemo(() => {
    return HANDBOOK_TABS.findIndex(t => t.id === currentTab.id);
  }, [currentTab]);

  const prevTab = currentIndex > 0 ? HANDBOOK_TABS[currentIndex - 1] : null;
  const nextTab = currentIndex < HANDBOOK_TABS.length - 1 ? HANDBOOK_TABS[currentIndex + 1] : null;

  // Parsed blocks for current tab
  const blocks = useMemo(() => {
    return parseMarkdownToBlocks(currentTab.markdown);
  }, [currentTab]);

  // Search filter across all tabs
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return null;
    const q = searchQuery.toLowerCase();
    const results: { tab: HandbookTab; snippets: string[] }[] = [];

    HANDBOOK_TABS.forEach(t => {
      const lines = t.markdown.split('\n');
      const matched = lines.filter(l => l.toLowerCase().includes(q) && !l.startsWith('<!--'));
      if (matched.length > 0 || t.title.toLowerCase().includes(q)) {
        results.push({
          tab: t,
          snippets: matched.slice(0, 3).map(m => m.replace(/^[#|>\-*]+\s*/, '').trim())
        });
      }
    });
    return results;
  }, [searchQuery]);

  const toggleFaq = (index: number) => {
    setOpenFaqIndices(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const toggleCheckItem = (id: string) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 pt-20">
      <SEO
        title="E4N Üyelik ve Çalışma Rehberi | Topluluk ve Katılım Esasları"
        description="E4N kapalı grupları, iki haftalık toplantı adabı, meslek tekilliği, devamsızlık ve vekil kuralları, shuffle ve lonca esaslarını içeren resmi 9 sekmeli başvuru kaynağı."
        canonical="https://www.event4network.com/rehber"
      />

      {/* Top Breadcrumb & User Context */}
      <div className="bg-slate-900 border-b border-slate-800 text-slate-300 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center space-x-2">
            <Link to="/" className="text-slate-400 hover:text-white transition-colors">Ana Sayfa</Link>
            <span className="text-slate-600">/</span>
            <span className="text-red-400 font-semibold">Üyelik ve Çalışma Rehberi</span>
          </div>
          {user && (
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold bg-red-600/20 text-red-300 hover:bg-red-600/30 px-3 py-1 rounded-full border border-red-500/30 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Kontrol Paneline Dön
            </Link>
          )}
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white py-14 sm:py-20 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-red-900/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-1/3 w-[450px] h-[450px] bg-indigo-900/10 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-600 text-white shadow-sm">
              <BookOpen className="w-3.5 h-3.5" /> Üyelik ve Çalışma Rehberi
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
              Sürüm: {HANDBOOK_META.version}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {HANDBOOK_META.updated_at} Güncellemesi
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-4 leading-tight">
            E4N Üyelik ve Çalışma Rehberi
          </h1>
          <p className="text-base sm:text-xl text-slate-300 max-w-3xl leading-relaxed mb-8">
            Event for Network topluluğunun tüm üyeleri, adayları ve ziyaretçileri için hazırlanmış temel başvuru kaynağı.
            Toplantı adabı, vekil prosedürü, shuffle dönemi, puanlama mantığı ve haklar tek çatı altında.
          </p>

          {/* Quick Notice Boxes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4.5 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 shrink-0 mt-0.5">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white mb-1">Bu Belge Ne İşe Yarar?</h4>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {HANDBOOK_META.introPurpose}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/80 border border-amber-500/30 rounded-2xl p-4.5 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 shrink-0 mt-0.5">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-300 mb-1">11 Ekim 2026 Karar Güncellemesi</h4>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {HANDBOOK_META.decisionUpdate}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rehber içinde ara (örn: vekil, dondurma, 15 dakika, devamsızlık)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 bg-gray-100 px-2 py-1 rounded"
              >
                Temizle
              </button>
            )}
          </div>

          {/* Search Results Dropdown/Box */}
          {searchResults && (
            <div className="mt-3 bg-white border border-gray-200 rounded-2xl p-4 shadow-lg max-w-2xl">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Arama Sonuçları ({searchResults.length} Sekmede Bulundu)
              </p>
              {searchResults.length === 0 ? (
                <p className="text-sm text-gray-500 py-2">Eşleşen kural veya başlık bulunamadı.</p>
              ) : (
                <div className="space-y-3">
                  {searchResults.map((res) => (
                    <div
                      key={res.tab.id}
                      onClick={() => {
                        handleSelectTab(res.tab.id);
                        setSearchQuery('');
                      }}
                      className="p-3 rounded-xl bg-gray-50 hover:bg-red-50 border border-gray-100 hover:border-red-200 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-red-600">Sekme 0{res.tab.order}</span>
                        <span className="text-xs text-gray-400">Görüntüle →</span>
                      </div>
                      <h4 className="text-sm font-bold text-gray-900 mt-0.5">{res.tab.title}</h4>
                      {res.snippets.length > 0 && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          ...{res.snippets[0]}...
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 9 Tabs Horizontal Selector */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Rehber Bölümleri (9 Sekme)
            </h3>
            <span className="text-xs text-gray-400">
              Sekme {currentTab.order} / 9
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2">
            {HANDBOOK_TABS.map((tab) => {
              const Icon = TAB_ICONS[tab.id] || FileText;
              const isActive = tab.id === activeTabId;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleSelectTab(tab.id)}
                  className={`flex flex-col items-center text-center p-3 rounded-2xl border transition-all ${
                    isActive
                      ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-600/20 scale-[1.02]'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-red-200 hover:bg-red-50/40'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 transition-colors ${
                      isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${
                      isActive ? 'text-red-200' : 'text-gray-400'
                    }`}
                  >
                    Sekme 0{tab.order}
                  </span>
                  <span className="text-xs font-semibold leading-tight line-clamp-2">
                    {tab.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Tab Main Content Card */}
        <div className="bg-white rounded-3xl border border-gray-200/90 shadow-sm overflow-hidden mb-10">
          {/* Tab Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-900/40 shrink-0">
                {React.createElement(TAB_ICONS[currentTab.id] || FileText, { className: 'w-7 h-7' })}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-red-400 bg-red-500/10 px-2.5 py-0.5 rounded-full border border-red-500/20">
                    Sekme 0{currentTab.order}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">id: {currentTab.id}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {currentTab.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
                  {currentTab.summary}
                </p>
              </div>
            </div>

            {/* Quick Share / Tab Counter */}
            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Sekme bağlantısı kopyalandı!');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-colors"
                title="Sekme linkini kopyala"
              >
                <Share2 className="w-3.5 h-3.5" />
                Paylaş
              </button>
            </div>
          </div>

          {/* Tab Body: Render Blocks */}
          <div className="p-6 sm:p-10 space-y-6">
            {blocks.map((block, idx) => {
              switch (block.type) {
                case 'h1':
                  return (
                    <h1 key={idx} className="text-2xl sm:text-3xl font-black text-gray-900 pt-4 border-b pb-3">
                      {formatInlineText(block.text || '')}
                    </h1>
                  );

                case 'h2':
                  return (
                    <div key={idx} className="pt-2">
                      <div className="inline-block px-3 py-1 rounded-lg bg-red-50 text-red-700 text-xs font-bold uppercase tracking-wider mb-2">
                        {block.text?.split('—')[0]?.trim()}
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                        {formatInlineText(block.text || '')}
                      </h2>
                    </div>
                  );

                case 'h3':
                  return (
                    <h3
                      key={idx}
                      className="text-lg sm:text-xl font-bold text-gray-900 pt-4 flex items-center gap-2 border-l-4 border-red-600 pl-3 -ml-3"
                    >
                      {formatInlineText(block.text || '')}
                    </h3>
                  );

                case 'h4':
                  return (
                    <h4 key={idx} className="text-base font-bold text-gray-800 pt-2">
                      {formatInlineText(block.text || '')}
                    </h4>
                  );

                case 'p':
                  return (
                    <p key={idx} className="text-sm sm:text-base text-gray-700 leading-relaxed">
                      {formatInlineText(block.text || '')}
                    </p>
                  );

                case 'quote':
                  return (
                    <div
                      key={idx}
                      className="bg-red-50/70 border-l-4 border-red-600 p-4 rounded-r-2xl my-4 text-sm text-gray-800 leading-relaxed flex items-start gap-3"
                    >
                      <Info className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                      <div>{formatInlineText(block.text || '')}</div>
                    </div>
                  );

                case 'table':
                  return (
                    <div key={idx} className="overflow-x-auto my-6 rounded-2xl border border-gray-200 shadow-sm">
                      <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                        <thead className="bg-gray-100/80">
                          <tr>
                            {block.headers?.map((h, hIdx) => (
                              <th
                                key={hIdx}
                                className="px-4 py-3.5 text-xs font-bold text-gray-700 uppercase tracking-wider"
                              >
                                {formatInlineText(h)}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                          {block.rows?.map((row, rIdx) => (
                            <tr
                              key={rIdx}
                              className={rIdx % 2 === 0 ? 'bg-white hover:bg-gray-50/80' : 'bg-gray-50/50 hover:bg-gray-100/60'}
                            >
                              {row.map((cell, cIdx) => (
                                <td key={cIdx} className="px-4 py-3 text-gray-700 text-sm leading-relaxed">
                                  {formatInlineText(cell)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );

                case 'ul':
                  return (
                    <ul key={idx} className="space-y-2 my-4 pl-4 text-sm sm:text-base text-gray-700">
                      {block.items?.map((item, iIdx) => (
                        <li key={iIdx} className="flex items-start gap-2.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-600 mt-2 shrink-0"></span>
                          <span>{formatInlineText(item)}</span>
                        </li>
                      ))}
                    </ul>
                  );

                case 'ol':
                  return (
                    <ol key={idx} className="space-y-2.5 my-4 pl-2 text-sm sm:text-base text-gray-700 list-none">
                      {block.items?.map((item, iIdx) => (
                        <li key={iIdx} className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-lg bg-gray-100 text-red-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-gray-200">
                            {iIdx + 1}
                          </span>
                          <span>{formatInlineText(item)}</span>
                        </li>
                      ))}
                    </ol>
                  );

                case 'checklist':
                  return (
                    <div key={idx} className="bg-gray-50 border border-gray-200 rounded-2xl p-5 my-6 space-y-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                          <CheckSquare className="w-4 h-4 text-red-600" /> Başlangıç Kontrol Listesi
                        </span>
                        <span className="text-xs text-gray-500">İlerlemek için kutucuklara tıklayabilirsiniz</span>
                      </div>
                      {block.checkItems?.map((cItem, cIdx) => {
                        const itemId = `check-${currentTab.id}-${cIdx}`;
                        const isChecked = checkedItems[itemId] ?? cItem.checked;
                        return (
                          <div
                            key={cIdx}
                            onClick={() => toggleCheckItem(itemId)}
                            className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                              isChecked
                                ? 'bg-green-50/70 border-green-200 text-gray-800'
                                : 'bg-white border-gray-200 text-gray-700 hover:border-red-200'
                            }`}
                          >
                            <div className="mt-0.5 shrink-0">
                              {isChecked ? (
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                              ) : (
                                <Square className="w-5 h-5 text-gray-300" />
                              )}
                            </div>
                            <span className={`text-sm ${isChecked ? 'line-through text-gray-500' : ''}`}>
                              {formatInlineText(cItem.text)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );

                case 'faq':
                  const isOpen = openFaqIndices[idx] ?? false;
                  return (
                    <div
                      key={idx}
                      className="border border-gray-200 rounded-2xl overflow-hidden my-3 bg-white shadow-sm transition-all"
                    >
                      <button
                        onClick={() => toggleFaq(idx)}
                        className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
                          <HelpCircle className="w-4 h-4 text-red-600 shrink-0" />
                          {block.faqQuestion}
                        </span>
                        <div className="p-1 rounded-lg bg-gray-100 text-gray-600 shrink-0">
                          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-5 pt-1 text-sm text-gray-700 border-t border-gray-100 bg-slate-50/60 leading-relaxed">
                          {formatInlineText(block.faqAnswer || '')}
                        </div>
                      )}
                    </div>
                  );

                default:
                  return null;
              }
            })}
          </div>

          {/* Previous & Next Tab Navigation Footer */}
          <div className="bg-gray-50 border-t border-gray-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            {prevTab ? (
              <Button
                variant="outline"
                onClick={() => handleSelectTab(prevTab.id)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 border-gray-300 text-gray-700 hover:bg-white"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Önceki: <strong>{prevTab.title}</strong></span>
              </Button>
            ) : (
              <div></div>
            )}

            {nextTab ? (
              <Button
                variant="primary"
                onClick={() => handleSelectTab(nextTab.id)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold"
              >
                <span>Sonraki: <strong>{nextTab.title}</strong></span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={() => navigate(user ? '/dashboard' : '/auth/register')}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Rehberi Tamamladınız</span>
              </Button>
            )}
          </div>
        </div>

        {/* Bottom Call to Action for Visitors and Members */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-8 sm:p-12 shadow-xl border border-slate-700 relative overflow-hidden">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-600/30 text-red-300 border border-red-500/40 mb-3">
              Toplantıya Katılın
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-white mb-3">
              Kuralları İncelediniz, Şimdi Deneyimleyin
            </h3>
            <p className="text-sm sm:text-base text-slate-300 mb-6 leading-relaxed">
              E4N gruplarında iki toplantıya kadar ücretsiz ziyaretçi olarak katılabilir, meslektaşlarınız ve iş ortaklarınızla tanışabilirsiniz.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="primary"
                onClick={() => navigate('/chapter-management')}
                className="bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-red-900/40"
              >
                Grupları Keşfet & Ziyaretçi Ol
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/uyelik')}
                className="border-slate-600 text-slate-200 hover:bg-slate-800 hover:text-white font-semibold px-6 py-3 rounded-xl"
              >
                Üyelik Paketleri
              </Button>
              {user && (
                <Button
                  variant="ghost"
                  onClick={() => navigate('/dashboard')}
                  className="text-slate-400 hover:text-white"
                >
                  Kontrol Paneline Git
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MemberHandbook;
