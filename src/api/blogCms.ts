import type {BlogPost} from '../types';
export type CmsBlog = BlogPost & {revision:string;pillar_slug?:string|null;related_slugs?:string[];editorial_brief?:string;image_rights_source?:string;reviewed_at?:string|null;reviewed_by?:string|null};
export type CmsOptions = {authors:{id:string;name:string}[];posts:{id:string;slug:string;title:string;cluster_key:string|null}[]};
export function cmsError(error:unknown){const e=error instanceof Error?error:new Error('Yazı işlemi tamamlanamadı.');try{const body=JSON.parse(e.message);if(typeof body.error==='string')e.message=body.error;}catch{/* Transport errors already have a readable message. */}return e;}
const fields=['title','slug','content','excerpt','featured_image','featured_image_alt','category_id','tags','status','meta_title','meta_description','focus_keyword','secondary_keywords','canonical_url','robots','schema_type','include_in_sitemap','sitemap_priority','change_frequency','og_title','og_description','cluster_key','pillar_slug','related_slugs','editorial_brief','image_rights_source','author_id'];
export function cmsPayload(data:Partial<CmsBlog>,reviewConfirmed=false){return {...Object.fromEntries(fields.filter(k=>data[k]!==undefined).map(k=>[k,data[k]])),...(data.revision?{revision:data.revision}:{}),reviewConfirmed};}
export function cmsResult(value:unknown,owner:string,list=false):{blogs?:CmsBlog[];blog?:CmsBlog}{
 const v=value as {version?:number;ownerId?:string;blogs?:CmsBlog[];blog?:CmsBlog};
 const valid=(b:CmsBlog)=>b && /^[0-9a-f-]{36}$/i.test(b.id) && typeof b.title==='string' && typeof b.slug==='string' && /^[0-9a-f]{32}$/i.test(b.revision) && ['draft','published','scheduled','archived'].includes(b.status);
 if(v?.version!==1||v.ownerId!==owner||(list?(!Array.isArray(v.blogs)||v.blogs.some(b=>!valid(b))):!valid(v.blog)))throw new Error('Yazı yanıtı doğrulanamadı. Güncel kaydı kontrol edin.');
 return v;
}
