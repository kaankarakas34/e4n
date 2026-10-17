import type {CmsBlog,CmsOptions} from '../api/blogCms';
import clusters from '../seo/blogClusters.json';

const inputClass='w-full min-h-11 rounded-lg border border-gray-300 p-3 text-gray-900 focus:border-red-500 focus:ring-red-500';
export function BlogEditorialFields({value,options,onChange}:{value:Partial<CmsBlog>;options:CmsOptions;onChange:(patch:Partial<CmsBlog>)=>void}){
 const posts=options.posts.filter(p=>p.id!==value.id&&p.slug!==value.slug);
 const selected=value.related_slugs||[];
 return <fieldset className="space-y-5 border-t border-gray-200 pt-6">
  <legend className="text-lg font-semibold text-gray-900">İçerik planı ve inceleme</legend>
  <div className="grid gap-5 sm:grid-cols-2">
   <label className="block text-sm font-medium text-gray-700">İçerik kümesi
    <select className={inputClass} value={value.cluster_key||''} onChange={e=>onChange({cluster_key:e.target.value||null})}>
     <option value="">Küme seçin</option>{clusters.map(c=><option key={c.key} value={c.key}>{c.name}</option>)}
    </select>
   </label>
   <label className="block text-sm font-medium text-gray-700">Yazar
    <select className={inputClass} value={value.author_id||''} onChange={e=>onChange({author_id:e.target.value||null})}>
     <option value="">Event4Network (kurumsal)</option>{options.authors.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
    </select>
   </label>
  </div>
  <label className="block text-sm font-medium text-gray-700">İçerik briefi ve kaynak kontrolü
   <textarea className={inputClass} rows={4} maxLength={5000} value={value.editorial_brief||''} onChange={e=>onChange({editorial_brief:e.target.value})} aria-describedby="brief-help"/>
  </label>
  <p id="brief-help" className="text-sm text-gray-500">Arama niyetini, özgün katkıyı, doğrulanan kaynakları ve dönüşüm yolunu yazın. Bu not yalnız yöneticilere görünür. Yayın için küme ve brief gereklidir.</p>
  <label className="block text-sm font-medium text-gray-700">Ana rehber (pillar)
   <select className={inputClass} value={value.pillar_slug||''} onChange={e=>onChange({pillar_slug:e.target.value||null,related_slugs:selected.filter(s=>s!==e.target.value)})}>
    <option value="">Ana rehber yok / bu yazı ana rehber</option>{posts.map(p=><option key={p.id} value={p.slug}>{p.title}</option>)}
   </select>
  </label>
  <fieldset className="space-y-2"><legend className="text-sm font-medium text-gray-700">İlgili yazılar ({selected.length}/6)</legend>
   {posts.filter(p=>p.slug!==value.pillar_slug).map(p=><label key={p.id} className="flex min-h-11 items-center gap-3 text-sm text-gray-700">
    <input type="checkbox" checked={selected.includes(p.slug)} disabled={!selected.includes(p.slug)&&selected.length>=6} onChange={e=>onChange({related_slugs:e.target.checked?[...selected,p.slug]:selected.filter(s=>s!==p.slug)})}/>{p.title}
   </label>)}
   {!posts.length&&<p className="text-sm text-gray-500">Bağlanabilecek başka yayımlanmış yazı yok. Taslaklar okuyuculara gösterilmez.</p>}
  </fieldset>
  <p className="text-sm text-gray-500">{value.reviewed_at?'Son uzman onayı: '+new Date(value.reviewed_at).toLocaleString('tr-TR',{timeZone:'Europe/Istanbul'}):'Henüz kaydedilmiş uzman onayı yok.'} Yayında yapılan her değişiklik yeniden onay gerektirir.</p>
  {value.status==='scheduled'&&<p className="text-sm text-amber-700">Planlandı durumu otomatik yayın yapmaz. Hazır olduğunda Yayınla seçip inceleme onayıyla kaydedin.</p>}
 </fieldset>;
}
