import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../api/supabase';
import { Button } from '../shared/Button';
import { ArrowLeft, Save, Globe, Settings, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';
import { BlogPost } from '../types';

export function AdminBlogEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [activeTab, setActiveTab] = useState<'general' | 'content' | 'seo' | 'og'>('general');
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState<Partial<BlogPost>>({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    featured_image: '',
    featured_image_alt: '',
    status: 'draft',
    meta_title: '',
    meta_description: '',
    focus_keyword: '',
    secondary_keywords: [],
    canonical_url: '',
    robots: 'index, follow',
    schema_type: 'BlogPosting',
    include_in_sitemap: true,
    sitemap_priority: 0.7,
    change_frequency: 'monthly',
    og_title: '',
    og_description: ''
  });

  const [secondaryKeysInput, setSecondaryKeysInput] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  useEffect(() => {
    if (!isNew && id) {
      fetchBlog();
    }
  }, [id]);

  const fetchBlog = async () => {
    try {
      const { data, error } = await supabase.from('blogs').select('*').eq('id', id).single();
      if (error) throw error;
      if (data) {
        setFormData(data);
        if (data.secondary_keywords) setSecondaryKeysInput(data.secondary_keywords.join(', '));
        if (data.tags) setTagsInput(data.tags.join(', '));
      }
    } catch (err) {
      console.error('Error fetching blog:', err);
      alert('Yazı yüklenirken hata oluştu.');
    }
  };

  const generateSlug = (text: string) => {
    const trMap: { [key: string]: string } = {
      'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
      'Ç': 'C', 'Ğ': 'G', 'İ': 'I', 'Ö': 'O', 'Ş': 'S', 'Ü': 'U'
    };
    return text
      .replace(/[çğıöşüÇĞİÖŞÜ]/g, match => trMap[match])
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    if (isNew || formData.slug === generateSlug(formData.title || '')) {
      // Auto update slug if it's new or user hasn't manually customized it
      setFormData({ ...formData, title, slug: generateSlug(title) });
    } else {
      setFormData({ ...formData, title });
    }
  };

  const handleRobotsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const isNoIndex = val.includes('noindex');
    setFormData({ 
      ...formData, 
      robots: val,
      include_in_sitemap: !isNoIndex // Auto set include_in_sitemap
    });
  };

  const handleSave = async () => {
    if (!formData.title || !formData.slug) {
      alert('Başlık ve URL adresi zorunludur.');
      return;
    }

    if (formData.featured_image && !formData.featured_image_alt) {
      alert('Kapak görseli eklediğinizde Alt Metin (Alt Text) girmek zorunludur.');
      setActiveTab('general');
      return;
    }

    try {
      setSaving(true);
      const { data: userData } = await supabase.auth.getUser();
      
      const payload = {
        ...formData,
        secondary_keywords: secondaryKeysInput.split(',').map(s => s.trim()).filter(Boolean),
        tags: tagsInput.split(',').map(s => s.trim()).filter(Boolean),
        updated_at: new Date().toISOString(),
      };

      if (isNew) {
        payload.author_id = userData.user?.id;
        if (payload.status === 'published') {
          payload.published_at = new Date().toISOString();
        }
        const { error } = await supabase.from('blogs').insert([payload]);
        if (error) throw error;
        alert('Yazı başarıyla oluşturuldu!');
        navigate('/admin/blogs');
      } else {
        if (payload.status === 'published' && !formData.published_at) {
          payload.published_at = new Date().toISOString();
        }
        const { error } = await supabase.from('blogs').update(payload).eq('id', id);
        if (error) throw error;
        alert('Yazı başarıyla güncellendi!');
      }
    } catch (err: any) {
      console.error('Error saving blog:', err);
      if (err.code === '23505') {
        alert('Bu URL (slug) zaten kullanılıyor. Lütfen benzersiz bir URL belirleyin.');
      } else {
        alert('Kaydedilirken hata oluştu.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto pb-24">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/blogs')} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{isNew ? 'Yeni Blog Yazısı' : 'Yazıyı Düzenle'}</h1>
            <p className="text-sm text-gray-500 mt-1">İçeriği ve SEO ayarlarını yönetin.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <select 
            value={formData.status}
            onChange={e => setFormData({ ...formData, status: e.target.value as any })}
            className="border-gray-300 rounded-lg shadow-sm focus:border-red-500 focus:ring-red-500 font-medium"
          >
            <option value="draft">Taslak</option>
            <option value="published">Yayınla</option>
            <option value="scheduled">Planlandı</option>
            <option value="archived">Arşivlendi</option>
          </select>
          <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6">
            <Save className="h-4 w-4" />
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('general')}
              className={`w-1/4 py-4 px-1 text-center border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'general' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Genel Bilgiler
            </button>
            <button
              onClick={() => setActiveTab('content')}
              className={`w-1/4 py-4 px-1 text-center border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'content' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              İçerik Editörü
            </button>
            <button
              onClick={() => setActiveTab('seo')}
              className={`w-1/4 py-4 px-1 text-center border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'seo' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              SEO Ayarları
            </button>
            <button
              onClick={() => setActiveTab('og')}
              className={`w-1/4 py-4 px-1 text-center border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'og' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Sosyal Medya (Open Graph)
            </button>
          </nav>
        </div>

        <div className="p-6 lg:p-8">
          {activeTab === 'general' && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Başlık <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={handleTitleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-lg"
                  placeholder="Harika bir başlık düşünün..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">URL (Slug) <span className="text-red-500">*</span></label>
                <div className="flex rounded-lg shadow-sm">
                  <span className="inline-flex items-center px-4 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                    event4network.com/blog/
                  </span>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={e => setFormData({ ...formData, slug: e.target.value })}
                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-lg border border-gray-300 focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  />
                </div>
                {!isNew && (
                  <p className="mt-2 text-sm text-amber-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" /> 
                    URL'yi değiştirirseniz 301 yönlendirmesi eklemeyi unutmayın!
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Özet (Excerpt)</label>
                <textarea
                  value={formData.excerpt}
                  onChange={e => setFormData({ ...formData, excerpt: e.target.value })}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                  placeholder="Blog listesinde görünecek kısa açıklama..."
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kapak Görseli URL</label>
                  <input
                    type="text"
                    value={formData.featured_image || ''}
                    onChange={e => setFormData({ ...formData, featured_image: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kapak Görseli Alt Metni 
                    {formData.featured_image && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <input
                    type="text"
                    value={formData.featured_image_alt || ''}
                    onChange={e => setFormData({ ...formData, featured_image_alt: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                    placeholder="Görseli anlatan SEO odaklı metin"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Etiketler (Virgülle ayırın)</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={e => setTagsInput(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                  placeholder="networking, iş geliştirme, b2b"
                />
              </div>
            </div>
          )}

          {activeTab === 'content' && (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">İçerik (HTML veya Markdown destekli metin alanı)</label>
              <textarea
                value={formData.content}
                onChange={e => setFormData({ ...formData, content: e.target.value })}
                className="w-full h-[500px] p-4 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 font-mono text-sm leading-relaxed"
                placeholder="Yazınızı buraya yazın..."
              />
              <p className="text-sm text-gray-500">Not: İlerleyen sürümlerde zengin metin editörü entegre edilebilir. Şu an için HTML veya metin desteklenmektedir.</p>
            </div>
          )}

          {activeTab === 'seo' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <label className="block text-sm font-medium text-gray-700">Meta Başlık (SEO Title)</label>
                    <span className={`text-xs font-medium ${(formData.meta_title?.length || 0) > 60 ? 'text-red-500' : 'text-gray-500'}`}>
                      {formData.meta_title?.length || 0}/60
                    </span>
                  </div>
                  <input
                    type="text"
                    value={formData.meta_title || ''}
                    onChange={e => setFormData({ ...formData, meta_title: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-end mb-2">
                    <label className="block text-sm font-medium text-gray-700">Meta Açıklama</label>
                    <span className={`text-xs font-medium ${(formData.meta_description?.length || 0) > 160 ? 'text-red-500' : 'text-gray-500'}`}>
                      {formData.meta_description?.length || 0}/160
                    </span>
                  </div>
                  <textarea
                    value={formData.meta_description || ''}
                    onChange={e => setFormData({ ...formData, meta_description: e.target.value })}
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Odak Anahtar Kelime</label>
                    <input
                      type="text"
                      value={formData.focus_keyword || ''}
                      onChange={e => setFormData({ ...formData, focus_keyword: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ek Anahtar Kelimeler</label>
                    <input
                      type="text"
                      value={secondaryKeysInput}
                      onChange={e => setSecondaryKeysInput(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                      placeholder="virgülle ayırın"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Canonical URL</label>
                  <input
                    type="text"
                    value={formData.canonical_url || ''}
                    onChange={e => setFormData({ ...formData, canonical_url: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                    placeholder={`Otomatik: https://www.event4network.com/blog/${formData.slug}`}
                  />
                  <p className="mt-1 text-xs text-gray-500">Boş bırakılırsa yazının kendi URL'si kullanılır.</p>
                </div>

                <div className="grid grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Robots Metası</label>
                    <select
                      value={formData.robots}
                      onChange={handleRobotsChange}
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 bg-white"
                    >
                      <option value="index, follow">Index, Follow</option>
                      <option value="noindex, follow">Noindex, Follow</option>
                      <option value="index, nofollow">Index, Nofollow</option>
                      <option value="noindex, nofollow">Noindex, Nofollow</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Schema Türü</label>
                    <select
                      value={formData.schema_type}
                      onChange={e => setFormData({ ...formData, schema_type: e.target.value })}
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 bg-white"
                    >
                      <option value="BlogPosting">BlogPosting</option>
                      <option value="Article">Article</option>
                      <option value="NewsArticle">NewsArticle</option>
                      <option value="FAQPage">FAQPage</option>
                    </select>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-gray-200 mt-2">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.include_in_sitemap}
                        disabled={formData.robots?.includes('noindex')}
                        onChange={e => setFormData({ ...formData, include_in_sitemap: e.target.checked })}
                        className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                      />
                      <div>
                        <span className="block text-sm font-medium text-gray-900">Sitemap'e Dahil Et</span>
                        <span className="block text-xs text-gray-500">Google'a bu URL'yi bildir (noindex ise otomatik kapanır).</span>
                      </div>
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sitemap Priority</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.0"
                      max="1.0"
                      value={formData.sitemap_priority}
                      onChange={e => setFormData({ ...formData, sitemap_priority: parseFloat(e.target.value) })}
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sitemap Freq</label>
                    <select
                      value={formData.change_frequency}
                      onChange={e => setFormData({ ...formData, change_frequency: e.target.value })}
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 bg-white"
                    >
                      <option value="always">Always</option>
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                      <option value="never">Never</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="sticky top-6">
                  <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Globe className="h-4 w-4" /> Google Arama Önizlemesi
                  </h3>
                  <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                        <Globe className="h-3 w-3 text-gray-500" />
                      </div>
                      <div>
                        <div className="text-[14px] text-[#202124] leading-tight">Event4Network</div>
                        <div className="text-[12px] text-[#4d5156] leading-tight">https://www.event4network.com › blog › {formData.slug}</div>
                      </div>
                    </div>
                    <h3 className="text-[20px] text-[#1a0dab] hover:underline cursor-pointer leading-tight mb-1">
                      {formData.meta_title || formData.title || 'Sayfa Başlığı Girilmedi'}
                    </h3>
                    <p className="text-[14px] text-[#4d5156] leading-snug line-clamp-2">
                      {formData.meta_description || formData.excerpt || 'Lütfen arama sonuçlarında görünecek bir açıklama metni girin. Bu alan CTR (tıklanma oranı) için çok önemlidir.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'og' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Open Graph Başlığı (og:title)</label>
                  <input
                    type="text"
                    value={formData.og_title || ''}
                    onChange={e => setFormData({ ...formData, og_title: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                    placeholder="Boş bırakırsanız Meta Title kullanılır"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Open Graph Açıklaması (og:description)</label>
                  <textarea
                    value={formData.og_description || ''}
                    onChange={e => setFormData({ ...formData, og_description: e.target.value })}
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                    placeholder="Boş bırakırsanız Meta Description kullanılır"
                  />
                </div>
                
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800">
                  <p><strong>Not:</strong> Open Graph görseli olarak yazının "Kapak Görseli (Featured Image)" otomatik olarak kullanılacaktır. Ayrı bir sosyal medya görseli eklemenize gerek yoktur.</p>
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="sticky top-6">
                  <h3 className="text-sm font-bold text-gray-900 mb-4">Sosyal Medya Önizlemesi (LinkedIn/Facebook)</h3>
                  <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                    <div className="aspect-video bg-gray-100 flex items-center justify-center border-b border-gray-200">
                      {formData.featured_image ? (
                        <img src={formData.featured_image} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="h-12 w-12 text-gray-300" />
                      )}
                    </div>
                    <div className="p-4 bg-[#f2f2f2]">
                      <div className="text-[12px] text-[#606770] uppercase tracking-wide mb-1">EVENT4NETWORK.COM</div>
                      <div className="font-bold text-[16px] text-[#1d2129] leading-tight mb-1 line-clamp-2">
                        {formData.og_title || formData.meta_title || formData.title || 'Başlık'}
                      </div>
                      <div className="text-[14px] text-[#606770] line-clamp-1">
                        {formData.og_description || formData.meta_description || formData.excerpt || 'Açıklama metni'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
