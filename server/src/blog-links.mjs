// Optional columns are read through to_jsonb for compatibility before migration.
// Keep private editorial notes and review provenance out of anonymous responses.
export const publicBlogColumns = ['id','title','slug','content','excerpt','featured_image','featured_image_alt','category_id','tags','author_id','status','published_at','created_at','updated_at','meta_title','meta_description','focus_keyword','secondary_keywords','canonical_url','robots','schema_type','include_in_sitemap','sitemap_priority','change_frequency','og_title','og_description'].map(k=>'b.'+k).join(',')+",to_jsonb(b)->>'cluster_key' AS cluster_key";

export async function blogLinks(query, id) {
 const rows=(await query(`SELECT linked.slug,linked.title,CASE WHEN linked.slug=to_jsonb(b)->>'pillar_slug' THEN 'pillar' ELSE 'related' END AS kind
 FROM blogs b JOIN blogs linked ON linked.slug=to_jsonb(b)->>'pillar_slug' OR linked.slug IN (SELECT jsonb_array_elements_text(COALESCE(to_jsonb(b)->'related_slugs','[]'::jsonb)))
 WHERE b.id=$1 AND linked.id<>b.id AND linked.status='published'
 ORDER BY CASE WHEN linked.slug=to_jsonb(b)->>'pillar_slug' THEN 0 ELSE 1 END,linked.title,linked.slug LIMIT 7`,[id])).rows;
 return rows;
}
