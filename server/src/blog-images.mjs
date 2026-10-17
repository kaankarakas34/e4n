import {randomUUID} from 'node:crypto';
import sharp from 'sharp';
import multer from 'multer';

export const parseBlogImage=multer({storage:multer.memoryStorage(),limits:{fileSize:4*1024*1024,files:1,fields:0,parts:2}}).single('image');
const problem=(message,status=400)=>Object.assign(new Error(message),{status});

export async function prepareBlogImage(file){
 if(!file||!['image/jpeg','image/png','image/webp'].includes(file.mimetype))throw problem('PNG, JPG veya WebP görseli seçin.');
 try{
  const image=sharp(file.buffer,{limitInputPixels:24000000,failOn:'warning'});
  const meta=await image.metadata();
  if(!['jpeg','png','webp'].includes(meta.format)||meta.pages>1)throw new Error('format');
  if(meta.width<600||meta.height<315)throw problem('Kapak en az 600 × 315 piksel olmalı.');
  const {data,info}=await image.rotate().resize({width:1600,height:1600,fit:'inside',withoutEnlargement:true}).webp({quality:82}).toBuffer({resolveWithObject:true});
  if(data.length>2*1024*1024)throw problem('Dönüştürülmüş kapak 2 MB sınırını aşıyor.');
  return {buffer:data,width:info.width,height:info.height};
 }catch(error){if(error.status)throw error;throw problem('Görsel okunamadı. Geçerli, hareketsiz PNG, JPG veya WebP seçin.');}
}

// Credentials are read only on the server and never returned to clients.
export async function storeBlogImage(image,{env=process.env,fetcher=fetch}={}){
 const origin=env.SUPABASE_URL,key=env.SUPABASE_SERVICE_ROLE_KEY;
 if(!origin||!key)throw problem('Kapak depolaması yapılandırılmamış.',503);
 const base=new URL(origin);if(base.protocol!=='https:')throw problem('Kapak depolaması yapılandırılmamış.',503);
 const name='covers/'+randomUUID()+'.webp';
 let response;
 try{response=await fetcher(new URL('/storage/v1/object/blog-images/'+name,base),{method:'POST',headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'image/webp','Cache-Control':'max-age=31536000','x-upsert':'false'},body:image.buffer,signal:AbortSignal.timeout(15000)});}catch{throw problem('Kapak depolamasına ulaşılamadı.',503);}
 if(!response.ok)throw problem('Kapak depolanamadı. Tekrar deneyin.',503);
 return {url:new URL('/storage/v1/object/public/blog-images/'+name,base).href,width:image.width,height:image.height};
}
