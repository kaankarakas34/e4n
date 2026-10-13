export const ORIGIN = 'https://www.event4network.com';
export const textContent = value => String(value || '').replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&#39;/gi, "'").replace(/\s+/g, ' ').trim();
export const isoDate = value => value && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : undefined;
export const safeUrl = value => { try { const url=new URL(value);return ['https:','http:'].includes(url.protocol) && !url.username && !url.password ? url.href : undefined; } catch { return undefined; } };
export function blogMetadata(blog) {
 const path='/blog/'+encodeURIComponent(blog.slug), fallback=ORIGIN+path;
 const canonical=safeUrl(blog.canonical_url)||fallback;
 const noindex=/\bnoindex\b/i.test(blog.robots || '');
 const title=blog.meta_title || `${blog.title} | Rehber | Event4Network`;
 const description=textContent(blog.meta_description || blog.excerpt || blog.title);
 const schema={ '@context':'https://schema.org','@type':['Article','BlogPosting','NewsArticle'].includes(blog.schema_type)?blog.schema_type:'BlogPosting',mainEntityOfPage:{'@type':'WebPage','@id':canonical},headline:blog.title,description,author:{'@type':blog.author?.name?'Person':'Organization',name:blog.author?.name||'Event4Network'},publisher:{'@type':'Organization',name:'Event4Network',logo:{'@type':'ImageObject',url:ORIGIN+'/e4n-logo.png'}},datePublished:isoDate(blog.published_at || blog.created_at),dateModified:isoDate(blog.updated_at)};
 const image=safeUrl(blog.featured_image);if(image)schema.image=[image];
 return {path,canonical,title,description,noindex,schema,image,ogType:'article'};
}
export function eventSchema(event) {
 if(!event.is_public || !['PUBLISHED','COMPLETED','CANCELLED'].includes(event.status) || !isoDate(event.start_at))return undefined;
 // Private meeting links and invented venues must never be published in markup.
 const online=event.is_online===true;
 const publicOnline=online && safeUrl(event.location);
 if(online ? !publicOnline : !textContent(event.location))return undefined;
 const schema={'@context':'https://schema.org','@type':'Event',name:event.title,description:textContent(event.description || event.title),url:ORIGIN+'/event/'+encodeURIComponent(event.id),startDate:isoDate(event.start_at),organizer:{'@type':'Organization',name:'Event4Network',url:ORIGIN},eventAttendanceMode:'https://schema.org/'+(online?'OnlineEventAttendanceMode':'OfflineEventAttendanceMode'),location:online?{'@type':'VirtualLocation',url:publicOnline}:{'@type':'Place',name:textContent(event.location),...(event.city?{address:{'@type':'PostalAddress',addressLocality:event.city,addressCountry:'TR'}}:{})}};
 if(isoDate(event.end_at))schema.endDate=isoDate(event.end_at);
 if(event.status==='CANCELLED')schema.eventStatus='https://schema.org/EventCancelled';
 else if(event.status==='PUBLISHED')schema.eventStatus='https://schema.org/EventScheduled';
 return schema;
}
export function eventMetadata(event) {return {path:'/event/'+encodeURIComponent(event.id),canonical:ORIGIN+'/event/'+encodeURIComponent(event.id),title:`${event.title} | Event4Network Etkinlik`,description:textContent(event.description || event.title).slice(0,160),noindex:!event.is_public,schema:eventSchema(event),ogType:'website'};}
export function breadcrumb(meta,title,kind){return {'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Event4Network',item:ORIGIN+'/'},{'@type':'ListItem',position:2,name:kind==='blog'?'Blog':'Etkinlikler',item:ORIGIN+(kind==='blog'?'/blog':'/etkinlikler')},{'@type':'ListItem',position:3,name:title,item:meta.canonical}]};}
