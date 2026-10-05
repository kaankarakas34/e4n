import {useEffect,useRef,useState} from 'react';
import {useAuthStore} from '../stores/authStore';
import {documentsApi,documentCategories,documentRoles,type DocumentLibrary,type LibraryDocument} from '../api/documents';
import {Button} from '../shared/Button';
const blank=()=>({title:'',description:'',category:'GENERAL',allowed_roles:[] as string[]});
export function DocumentsPage({embedded=false}:{embedded?:boolean}){
 const {user,token}=useAuthStore();const scope=`${user?.id||''}:${user?.role||''}:${token||''}`;
 const active=useRef(scope);active.current=scope;const mounted=useRef(true);const epoch=useRef(0);const lock=useRef(false);const read=useRef(0);
 const [data,setData]=useState<{scope:string;library:DocumentLibrary}|null>(null);
 const [status,setStatus]=useState<{scope:string;loading:boolean;error:string}>({scope,loading:true,error:''});
 const [formState,setFormState]=useState<{scope:string;form:ReturnType<typeof blank>;file:File|null;key:string|null;open:boolean;busy:boolean;error:string}>({scope,form:blank(),file:null,key:null,open:false,busy:false,error:''});
 const [query,setQuery]=useState('');const [category,setCategory]=useState('ALL');
 const current=(s:string,g=epoch.current)=>mounted.current&&active.current===s&&epoch.current===g;
 const form=formState.scope===scope?formState:{scope,form:blank(),file:null,key:null,open:false,busy:false,error:''};
 const library=data?.scope===scope?data.library:null;
 const state=status.scope===scope?status:{scope,loading:true,error:''};
 const setForm=(patch:Partial<typeof form>)=>setFormState(v=>({...((v.scope===scope)?v:form),...patch,scope}));
 const load=async(s=scope)=>{
   if(!user)return;const seq=++read.current;setStatus({scope:s,loading:true,error:''});
   try{const library=await documentsApi.list(user.id);if(current(s)&&seq===read.current){setData({scope:s,library});setStatus({scope:s,loading:false,error:''});}}
   catch{if(current(s)&&seq===read.current){setData(null);setStatus({scope:s,loading:false,error:'Belgeler okunamadı. Yeniden deneyin.'});}}
 };
 useEffect(()=>{epoch.current++;mounted.current=true;lock.current=false;setData(null);setFormState({scope,form:blank(),file:null,key:null,open:false,busy:false,error:''});void load(scope);return()=>{mounted.current=false;read.current++;};},[scope]);
 const upload=async(e:React.FormEvent)=>{
   e.preventDefault();if(!user||!form.file||lock.current||!library?.canUpload)return;
   if(!form.form.title.trim()){setForm({error:'Başlık boş olamaz.'});return;}
   const s=scope,g=epoch.current;lock.current=true;const key=form.key||crypto.randomUUID();setForm({key,busy:true,error:''});
   const body=new FormData();body.append('file',form.file);body.append('title',form.form.title);body.append('description',form.form.description);body.append('category',form.form.category);body.append('allowed_roles',JSON.stringify(form.form.allowed_roles));body.append('requestKey',key);
   try{await documentsApi.upload(user.id,body);if(current(s,g)){setFormState({scope:s,form:blank(),file:null,key:null,open:false,busy:false,error:''});await load(s);}}
   catch(e){const definitive=!!e&&typeof e==='object'&&'status' in e&&Number(e.status)>=400&&Number(e.status)<500;if(current(s,g))setForm({key:definitive?null:key,busy:false,error:definitive?'Belge alanları veya yetkiniz doğrulanamadı. Alanları kontrol edip listeyi yenileyin.':'Yükleme doğrulanamadı. Aynı dosyayı yeniden göndererek sonucu doğrulayın. Alanlar bu sırada korunur.'});}
   finally{if(current(s,g)){lock.current=false;setForm({busy:false});}}
 };
 const action=async(d:LibraryDocument,archive:boolean)=>{
   if(!user||lock.current)return;if(archive&&!confirm('Belgeyi listeden kaldırmak istiyor musunuz?'))return;
   const s=scope,g=epoch.current;lock.current=true;setForm({busy:true,error:''});
   try{if(archive){await documentsApi.archive(user.id,d.id);if(current(s,g))await load(s);}else{const blob=await documentsApi.download(d);if(current(s,g)){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=d.filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}}}
   catch{if(current(s,g))setForm({error:archive?'Kaldırma doğrulanamadı. Listeyi yenileyin veya tekrar deneyin.':'Dosya indirilemedi. Yeniden deneyin.'});}
   finally{if(current(s,g)){lock.current=false;setForm({busy:false});}}
 };
 const filtered=(library?.documents||[]).filter(d=>(category==='ALL'||d.category===category)&&d.title.toLocaleLowerCase('tr').includes(query.toLocaleLowerCase('tr')));
 if(!user)return <p>Belgeleri görmek için oturum açın.</p>;
 return <section className={embedded?'space-y-4':'p-6 max-w-7xl mx-auto space-y-6'}>
  <header className="flex justify-between gap-4"><div><h1 className="text-2xl font-bold">Doküman Merkezi</h1><p>Eğitim materyalleri, sözleşmeler ve rehberler.</p></div>{library?.canUpload&&<Button disabled={form.busy} onClick={()=>setForm({open:true,error:''})}>Doküman Yükle</Button>}</header>
  <div className="flex flex-wrap gap-3"><label>Belge ara<input aria-label="Belge ara" className="border rounded p-2 ml-2" value={query} onChange={e=>setQuery(e.target.value)}/></label><label>Kategori<select aria-label="Kategori filtresi" className="border rounded p-2 ml-2" value={category} onChange={e=>setCategory(e.target.value)}><option value="ALL">Tümü</option>{Object.entries(documentCategories).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label><Button disabled={form.busy||state.loading} onClick={()=>void load()}>Yenile</Button></div>
  {state.loading&&<p role="status">Belgeler yükleniyor…</p>}
  {state.error&&<p role="alert" className="text-red-700">{state.error}</p>}
  {form.error&&<p role="alert" className="text-red-700">{form.error}</p>}
  {!state.loading&&!state.error&&filtered.length===0&&<p>Doküman bulunamadı.</p>}
  {!state.loading&&!state.error&&<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">{filtered.map(d=><article className="bg-white rounded border p-5 space-y-3" key={d.id}><h2 className="font-semibold break-words">{d.title}</h2><p>{documentCategories[d.category]}</p><p className="break-words">{d.description||'Açıklama yok.'}</p><p className="text-sm text-gray-500">{d.filename} · {(d.size_bytes/1024).toFixed(1)} KB · {new Date(d.created_at).toLocaleDateString('tr-TR')}</p><div className="flex gap-2"><Button disabled={form.busy} onClick={()=>void action(d,false)}>İndir</Button>{d.canArchive&&<Button disabled={form.busy} variant="outline" onClick={()=>void action(d,true)}>Kaldır</Button>}</div></article>)}</div>}
  {form.open&&library?.canUpload&&<div role="dialog" aria-modal="true" aria-label="Yeni doküman" className="fixed inset-0 bg-black/50 flex justify-center items-center p-4 z-50"><form onSubmit={upload} className="bg-white rounded p-6 max-w-lg w-full max-h-[90vh] overflow-auto space-y-4"><h2 className="text-xl font-bold">Yeni Doküman Yükle</h2><fieldset disabled={form.busy||!!form.key} className="space-y-3"><label className="block">Başlık<input required maxLength={200} className="block border rounded p-2 w-full" value={form.form.title} onChange={e=>setForm({form:{...form.form,title:e.target.value}})}/></label><label className="block">Açıklama<textarea maxLength={2000} className="block border rounded p-2 w-full" value={form.form.description} onChange={e=>setForm({form:{...form.form,description:e.target.value}})}/></label><label className="block">Kategori<select className="block border rounded p-2 w-full" value={form.form.category} onChange={e=>setForm({form:{...form.form,category:e.target.value}})}>{Object.entries(documentCategories).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label><label className="block">Dosya (PDF, PNG, JPEG; en fazla 3 MB)<input required type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={e=>{const f=e.target.files?.[0]||null;if(f&&(!f.size||f.size>3145728)){e.target.value='';setForm({file:null,error:'Dosya boyutu 1 bayt ile 3 MB arasında olmalıdır.'});}else setForm({file:f,error:''});}}/></label><p>Görünürlük: rol seçmezseniz oturum açmış tüm kullanıcılar görebilir.</p>{documentRoles.map(role=><label className="inline-flex gap-1 mr-3" key={role}><input type="checkbox" checked={form.form.allowed_roles.includes(role)} onChange={e=>setForm({form:{...form.form,allowed_roles:e.target.checked?[...form.form.allowed_roles,role]:form.form.allowed_roles.filter(r=>r!==role)}})}/>{role}</label>)}</fieldset><div className="flex gap-2"><Button type="submit" disabled={form.busy||!form.file}>{form.busy?'Gönderiliyor…':form.key?'Aynı gönderimi doğrula':'Yükle'}</Button><Button type="button" variant="outline" disabled={form.busy} onClick={()=>setForm({open:false})}>Kapat</Button></div></form></div>}
 </section>;
}
