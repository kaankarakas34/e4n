import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {BlogEditorialFields} from '../components/BlogEditorialFields';
import {api} from '../api/api';
import {useAuthStore} from '../stores/authStore';
import type {CmsBlog,CmsOptions} from '../api/blogCms';
import { Button } from '../shared/Button';
import { ArrowLeft, Save, Globe, Image as ImageIcon, AlertCircle } from 'lucide-react';

const initialForm:Partial<CmsBlog> = {
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
  };

export function AdminBlogEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const {user,token}=useAuthStore();
  const [reviewConfirmed,setReviewConfirmed]=useState(false);
  const [loadedFor,setLoadedFor]=useState('');
  const [readError,setReadError]=useState('');
  const [saveError,setSaveError]=useState('');
  const [saveStatus,setSaveStatus]=useState('');
  const saveErrorRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{if(saveError)saveErrorRef.current?.focus();},[saveError]);
  const savePending=useRef(false);
  const contextKey=id+':'+user?.id+':'+token;

  const [activeTab, setActiveTab] = useState<'general' | 'content' | 'seo' | 'og'>('general');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const uploadPending=useRef(false);
  const [uploadError,setUploadError]=useState('');
  const [uploadStatus,setUploadStatus]=useState('');
  const [options,setOptions]=useState<CmsOptions>({authors:[],posts:[]});
  const [optionsError,setOptionsError]=useState('');

  const [formData,setFormData]=useState<Partial<CmsBlog>>({...initialForm});

  const [secondaryKeysInput, setSecondaryKeysInput] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file=e.target.files?.[0];e.target.value='';
    if(!file||uploadPending.current||!user||user.role!=='ADMIN')return;
    setUploadError('');setUploadStatus('');
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>4*1024*1024){setUploadError('PNG, JPG veya WebP seçin. Dosya en fazla 4 MB olabilir.');return;}
    const owner=user.id,context=token,editor=contextKey;
    uploadPending.current=true;setUploading(true);
    try{
      const image=await api.uploadBlogImage(file,owner);
      if(useAuthStore.getState().user?.id!==owner||useAuthStore.getState().token!==context||currentContext.current!==editor)return;
      setFormData(prev=>({...prev,featured_image:image.url}));setReviewConfirmed(false);
      setUploadStatus(`Kapak yüklendi (${image.width} × ${image.height} px). Alt metni ve kullanım iznini ekleyin.`);
    }catch(error){if(currentContext.current===editor)setUploadError(error instanceof Error?error.message:'Görsel yüklenemedi.');}
    finally{uploadPending.current=false;setUploading(false);}
  };
  const currentContext=useRef(contextKey);currentContext.current=contextKey;
  useEffect(()=>{let active=true;setOptionsError('');setOptions({authors:[],posts:[]});if(user?.role==='ADMIN')api.getBlogOptions(user.id).then(data=>{if(active)setOptions(data);}).catch(error=>{if(active)setOptionsError(error.message);});return()=>{active=false;};},[contextKey,user?.role,user?.id]);
  useEffect(()=>{setReviewConfirmed(false);},[formData,secondaryKeysInput,tagsInput]);

  useEffect(()=>{let active=true;setLoadedFor('');setReadError('');setReviewConfirmed(false);if(isNew){setFormData({...initialForm});setSecondaryKeysInput('');setTagsInput('');setLoadedFor(contextKey);}else if(id && user?.role==='ADMIN'){api.getAdminBlog(id,user.id).then(data=>{if(active){setFormData(data);setSecondaryKeysInput((data.secondary_keywords||[]).join(', '));setTagsInput((data.tags||[]).join(', '));setLoadedFor(contextKey);}}).catch(e=>{if(active)setReadError(e.message);});}return()=>{active=false;};},[id,isNew,user?.id,user?.role,token,contextKey]);

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
    if(savePending.current||uploadPending.current)return;
    setSaveError('');setSaveStatus('');
    if (!formData.title || !formData.slug) {
      setSaveError('Başlık ve URL adresi zorunludur.');setActiveTab('general');
      return;
    }

    if (formData.featured_image && !formData.featured_image_alt) {
      setSaveError('Kapak görseli eklediğinizde Alt Metin (Alt Text) girmek zorunludur.');
      setActiveTab('general');
      return;
    }

    try {
      savePending.current=true;setSaving(true);
      if(!user || user.role!=='ADMIN')throw new Error('Yönetici oturumu gerekli.');
      const owner=user.id,context=token;
      const saved=await api.saveAdminBlog(isNew?null:id,{...formData,secondary_keywords:secondaryKeysInput.split(',').map(s=>s.trim()).filter(Boolean),tags:tagsInput.split(',').map(s=>s.trim()).filter(Boolean)},owner,reviewConfirmed);
      if(useAuthStore.getState().user?.id!==owner || useAuthStore.getState().token!==context || currentContext.current!==contextKey)return;
      setFormData(saved);setReviewConfirmed(false);setSaveStatus('Yazı kaydedildi.');if(isNew)navigate('/admin/blogs/'+saved.id);
    } catch (err: unknown) {
      console.error('Error saving blog:', err);
      if ((err as {code?:string}).code === '23505') {
        setSaveError('Bu URL (slug) zaten kullanılıyor. Lütfen benzersiz bir URL belirleyin.');
      } else {
        setSaveError(err instanceof Error ? err.message : 'Kaydetme sonucu doğrulanamadı. Yazı listesindeki güncel kaydı kontrol edin.');
      }
    } finally {
      savePending.current=false;setSaving(false);
    }
  };

  if(loadedFor!==contextKey)return <main className="p-6"><p role={readError?'alert':'status'}>{readError||'Yazı yükleniyor…'}</p><Button onClick={()=>navigate('/admin/blogs')}>Yazı listesi</Button></main>;
  return (
    <div className="p-6 max-w-6xl mx-auto pb-24">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-6">
        <div className="flex items-center gap-4">
          <button aria-label="Yazı listesine dön" onClick={() => navigate('/admin/blogs')} className="min-h-11 min-w-11 p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{isNew ? 'Yeni Blog Yazısı' : 'Yazıyı Düzenle'}</h1>
            <p className="text-sm text-gray-500 mt-1">İçeriği ve SEO ayarlarını yönetin.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            aria-label="Yayın durumu"
            value={formData.status}
            onChange={e => setFormData({ ...formData, status: e.target.value as CmsBlog['status'] })}
            className="min-h-11 border-gray-300 rounded-lg shadow-sm focus:border-red-500 focus:ring-red-500 font-medium"
          >
            <option value="draft">Taslak</option>
            <option value="published">Yayınla</option>
            <option value="scheduled">Planlandı</option>
            <option value="archived">Arşivlendi</option>
          </select>
          {formData.status==='published' && <label className="text-sm min-h-11 flex items-center gap-2"><input type="checkbox" checked={reviewConfirmed} onChange={e=>setReviewConfirmed(e.target.checked)}/>İçerik ve uzman incelemesi tamamlandı</label>}
          <Button onClick={handleSave} disabled={saving || uploading || !!optionsError || (formData.status==='published' && !reviewConfirmed)} className="min-h-11 flex items-center gap-2 px-6">
            <Save className="h-4 w-4" />
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </div>
      </div>

      {saveError&&<div ref={saveErrorRef} tabIndex={-1} role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">{saveError}</div>}
      <p role="status" className="mb-4 text-sm text-gray-700">{saveStatus}</p>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px overflow-x-auto">
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
                <label htmlFor="cms-title" className="block text-sm font-medium text-gray-700 mb-2">Başlık <span className="text-red-500">*</span></label>
                <input id="cms-title"
                  type="text"
                  value={formData.title}
                  onChange={handleTitleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-lg"
                  placeholder="Harika bir başlık düşünün..."
                />
              </div>

              <div>
                <label htmlFor="cms-slug" className="block text-sm font-medium text-gray-700 mb-2">URL (Slug) <span className="text-red-500">*</span></label>
                <div className="flex rounded-lg shadow-sm">
                  <span className="inline-flex items-center px-4 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                    event4network.com/blog/
                  </span>
                  <input id="cms-slug"
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
                <label htmlFor="cms-excerpt" className="block text-sm font-medium text-gray-700 mb-2">Özet (Excerpt)</label>
                <textarea id="cms-excerpt"
                  value={formData.excerpt}
                  onChange={e => setFormData({ ...formData, excerpt: e.target.value })}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                  placeholder="Blog listesinde görünecek kısa açıklama..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kapak Görseli (WebP Yükleme)</label>
                  {formData.featured_image ? (
                    <div className="relative border border-gray-300 rounded-lg p-2 bg-gray-50 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={formData.featured_image}
                          alt="Thumbnail"
                          className="w-12 h-12 rounded object-cover border border-gray-200 flex-shrink-0"
                        />
                        <span className="text-xs text-gray-500 truncate">{formData.featured_image.split('/').pop()}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, featured_image: '' })}
                        className="text-xs text-red-600 hover:text-red-800 font-medium min-h-11 px-2 py-1 bg-red-50 hover:bg-red-100 rounded"
                      >
                        Kaldır
                      </button>
                    </div>
                  ) : (
                    <div className="relative border-2 border-dashed border-gray-300 hover:border-red-500 rounded-lg p-6 text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group">
                      <input
                        type="file"
                        aria-label="Kapak görseli yükle"
                        aria-describedby="cover-help cover-error"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleImageUpload}
                        disabled={uploading || saving}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="space-y-1 text-center">
                        <ImageIcon className="mx-auto h-8 w-8 text-gray-400 group-hover:text-red-500 transition-colors" />
                        <div className="flex text-sm text-gray-600 justify-center">
                          <span className="relative rounded-md font-medium text-red-600 hover:text-red-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-red-500">
                            {uploading ? 'Yükleniyor...' : 'Görsel Yükle'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, WebP · en fazla 4 MB · en az 600 × 315 px</p>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label htmlFor="cms-featured_image_alt" className="block text-sm font-medium text-gray-700 mb-2">
                    Kapak Görseli Alt Metni
                    {formData.featured_image && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <input id="cms-featured_image_alt"
                    type="text"
                    value={formData.featured_image_alt || ''}
                    onChange={e => setFormData({ ...formData, featured_image_alt: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                    placeholder="Görseli anlatan SEO odaklı metin"
                  />
                </div>
              </div>

              <p id="cover-help" className="text-sm text-gray-500">Kapak sunucuda doğrulanır ve en fazla 1600 px WebP olarak kaydedilir.</p>
              <p id="cover-error" role="alert" className="text-sm text-red-600">{uploadError}</p>
              <p role="status" className="text-sm text-gray-600">{uploadStatus}</p>
              <label htmlFor="cms-image_rights_source" className="block text-sm font-medium text-gray-700">Görsel kullanım izni ve kaynağı
                <textarea id="cms-image_rights_source" className="mt-2 w-full p-3 border border-gray-300 rounded-lg" rows={2} maxLength={2048} value={formData.image_rights_source||''} onChange={e=>setFormData({...formData,image_rights_source:e.target.value})} aria-describedby="rights-help"/>
              </label>
              <p id="rights-help" className="text-sm text-gray-500">Hak sahibi, izin veya lisans kaynağını belirtin. Görsel varsa zorunludur; bu not kamuya gösterilmez.</p>
              {optionsError?<p role="alert" className="text-red-600">{optionsError} Seçenekleri yüklemek için sayfayı yenileyin.</p>:<BlogEditorialFields value={formData} options={options} onChange={patch=>setFormData(prev=>({...prev,...patch}))}/>}

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
              <label htmlFor="cms-content" className="block text-sm font-medium text-gray-700">İçerik (HTML veya Markdown destekli metin alanı)</label>
              <textarea id="cms-content"
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
                    <label htmlFor="cms-meta_title" className="block text-sm font-medium text-gray-700">Meta Başlık (SEO Title)</label>
                    <span className={`text-xs font-medium ${(formData.meta_title?.length || 0) > 60 ? 'text-red-500' : 'text-gray-500'}`}>
                      {formData.meta_title?.length || 0}/60
                    </span>
                  </div>
                  <input id="cms-meta_title"
                    type="text"
                    value={formData.meta_title || ''}
                    onChange={e => setFormData({ ...formData, meta_title: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-end mb-2">
                    <label htmlFor="cms-meta_description" className="block text-sm font-medium text-gray-700">Meta Açıklama</label>
                    <span className={`text-xs font-medium ${(formData.meta_description?.length || 0) > 160 ? 'text-red-500' : 'text-gray-500'}`}>
                      {formData.meta_description?.length || 0}/160
                    </span>
                  </div>
                  <textarea id="cms-meta_description"
                    value={formData.meta_description || ''}
                    onChange={e => setFormData({ ...formData, meta_description: e.target.value })}
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="cms-focus_keyword" className="block text-sm font-medium text-gray-700 mb-2">Odak Anahtar Kelime</label>
                    <input id="cms-focus_keyword"
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
                  <label htmlFor="cms-canonical_url" className="block text-sm font-medium text-gray-700 mb-2">Canonical URL</label>
                  <input id="cms-canonical_url"
                    type="text"
                    value={formData.canonical_url || ''}
                    onChange={e => setFormData({ ...formData, canonical_url: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                    placeholder={`Otomatik: https://www.event4network.com/blog/${formData.slug}`}
                  />
                  <p className="mt-1 text-xs text-gray-500">Boş bırakılırsa yazının kendi URL'si kullanılır.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <label htmlFor="cms-robots" className="block text-sm font-medium text-gray-700 mb-2">Robots Metası</label>
                    <select id="cms-robots"
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
                    <label htmlFor="cms-schema_type" className="block text-sm font-medium text-gray-700 mb-2">Schema Türü</label>
                    <select id="cms-schema_type"
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
                    <label htmlFor="cms-sitemap_priority" className="block text-sm font-medium text-gray-700 mb-2">Sitemap Priority</label>
                    <input id="cms-sitemap_priority"
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
                    <label htmlFor="cms-change_frequency" className="block text-sm font-medium text-gray-700 mb-2">Sitemap Freq</label>
                    <select id="cms-change_frequency"
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
                  <label htmlFor="cms-og_title" className="block text-sm font-medium text-gray-700 mb-2">Open Graph Başlığı (og:title)</label>
                  <input id="cms-og_title"
                    type="text"
                    value={formData.og_title || ''}
                    onChange={e => setFormData({ ...formData, og_title: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                    placeholder="Boş bırakırsanız Meta Title kullanılır"
                  />
                </div>

                <div>
                  <label htmlFor="cms-og_description" className="block text-sm font-medium text-gray-700 mb-2">Open Graph Açıklaması (og:description)</label>
                  <textarea id="cms-og_description"
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
