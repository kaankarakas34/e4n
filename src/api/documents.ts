import {documentTransport} from './api';
export const documentCategories={GENERAL:'Genel',EDUCATION:'Eğitim',LEGAL:'Hukuki',MARKETING:'Pazarlama'};
export const documentRoles=['ADMIN','PRESIDENT','VICE_PRESIDENT','MEMBER','SECRETARY_TREASURER','COMMUNITY_MEMBER'];
export interface LibraryDocument {id:string;title:string;description:string;category:keyof typeof documentCategories;filename:string;mime_type:string;size_bytes:number;uploaded_by:string;allowed_roles:string[];created_at:string;canArchive:boolean}
export interface DocumentLibrary {ownerId:string;canUpload:boolean;documents:LibraryDocument[]}
const uuid=(v:unknown):v is string=>typeof v==='string'&&/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(v);
const bad=()=>new Error('Belge yanıtı doğrulanamadı. Yeniden okuyun.');
const row=(d:any):d is LibraryDocument=>d&&uuid(d.id)&&uuid(d.uploaded_by)&&typeof d.title==='string'&&!!d.title.trim()&&typeof d.description==='string'&&Object.prototype.hasOwnProperty.call(documentCategories,d.category)&&typeof d.filename==='string'&&!!d.filename&&['application/pdf','image/png','image/jpeg'].includes(d.mime_type)&&Number.isInteger(d.size_bytes)&&d.size_bytes>0&&d.size_bytes<=3145728&&Array.isArray(d.allowed_roles)&&d.allowed_roles.every((r:unknown)=>typeof r==='string'&&documentRoles.includes(r))&&typeof d.created_at==='string'&&Number.isFinite(Date.parse(d.created_at))&&typeof d.canArchive==='boolean';
export const documentsApi={
 async list(owner:string):Promise<DocumentLibrary>{const r=await documentTransport.get('/documents');if(!r||r.ownerId!==owner||typeof r.canUpload!=='boolean'||!Array.isArray(r.documents)||!r.documents.every(row)||new Set(r.documents.map((d:LibraryDocument)=>d.id)).size!==r.documents.length)throw bad();return r;},
 async upload(owner:string,body:FormData):Promise<LibraryDocument>{const r=await documentTransport.upload(body);if(!r||r.ownerId!==owner||!row(r.document)||r.document.uploaded_by!==owner||typeof r.replay!=='boolean')throw bad();return r.document;},
 async archive(owner:string,id:string){const r=await documentTransport.archive(id);if(!r||r.ownerId!==owner||r.id!==id||r.archived!==true||typeof r.replay!=='boolean')throw bad();},
 async download(d:LibraryDocument){const blob=await documentTransport.download(d.id);if(blob.size!==d.size_bytes||blob.type!==d.mime_type)throw bad();return blob;},
};
