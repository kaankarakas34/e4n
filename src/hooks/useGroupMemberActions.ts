import {useEffect,useRef,useState} from 'react';
import {api} from '../api/api';

type Action='approve'|'remove';
type GroupMemberRow=Record<string,unknown>&{id:string;status:'ACTIVE'|'REQUESTED'|'INACTIVE'|'PENDING'};
type Options={scope:string;kind?:'group'|'power-team';groupId?:string;onMembers:(members:GroupMemberRow[])=>void;onRefresh?:()=>void};
const uuid=(value:unknown)=>typeof value==='string'&&/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value);

// Mutation acknowledgement and canonical list read have separate outcomes.
export function useGroupMemberActions({scope,kind='group',groupId,onMembers,onRefresh}:Options){
  const current=useRef({scope});if(current.current.scope!==scope)current.current={scope};
  const lock=useRef<object|null>(null);
  const [state,setState]=useState({scope,busy:false,error:'',needsReview:false});
  const review=useRef(false);
  useEffect(()=>{current.current={scope:current.current.scope};return()=>{current.current={scope:''};};},[]);
  useEffect(()=>{lock.current=null;review.current=false;setState({scope,busy:false,error:'',needsReview:false});},[scope]);
  const visible=state.scope===scope?state:{scope,busy:false,error:'',needsReview:false};
  async function readMembers(){
    const rows=await (kind==='power-team'?api.getPowerTeamMembers(groupId!):api.getGroupMembers(groupId!));
    const statuses=kind==='power-team'?['ACTIVE','REQUESTED','INACTIVE','PENDING']:['ACTIVE','REQUESTED','INACTIVE'];
    if(!Array.isArray(rows)||rows.some(row=>!row||!uuid(row.id)||!statuses.includes(row.status))
        ||new Set(rows.map(row=>row.id)).size!==rows.length)throw Error('Üye listesi doğrulanamadı.');
    return rows as GroupMemberRow[];
  }
  async function run(action:Action,userId:string,reason?:{category?:string;note?:string}){
    if(lock.current||review.current||!uuid(groupId)||!uuid(userId))return;
    const context=current.current,operation={};lock.current=operation;setState({scope,busy:true,error:'',needsReview:false});
    let acknowledged=false;
    try{
      if(action==='approve')await (kind==='power-team'?api.updatePowerTeamMemberStatus(groupId!,userId,'ACTIVE'):api.updateGroupMemberStatus(groupId!,userId,'ACTIVE'));
      else await (kind==='power-team'?api.deletePowerTeamMember(groupId!,userId):api.deleteGroupMember(groupId!,userId,reason));
      acknowledged=true;
      if(current.current!==context)return;
      const rows=await readMembers();if(current.current!==context)return;
      onMembers(rows);onRefresh?.();
    }catch(error:unknown){
      if(current.current!==context)return;
      let message=acknowledged?'İşlem kaydedildi; güncel üye listesi yüklenemedi. Listeyi kontrol edin.':'İşlem sonucu doğrulanamadı. Tekrar işlem yapmadan önce listeyi kontrol edin.';
      try{if(error&&typeof error==='object'&&'responseBody' in error&&typeof error.responseBody==='string'){const body=JSON.parse(error.responseBody);if(['GROUP_CAPACITY_FULL','GROUP_ROLE_AMBIGUOUS','GROUP_BUSY','FORBIDDEN','MEMBERSHIP_NOT_FOUND'].includes(body.code)&&typeof body.error==='string')message=body.error+' Listeyi kontrol edin.';}}catch{}
      review.current=true;setState({scope,busy:false,error:message,needsReview:true});
    }finally{if(lock.current===operation){lock.current=null;if(current.current===context)setState(previous=>({...previous,busy:false}));}}
  }
  async function refresh(){
    if(lock.current||!uuid(groupId))return;
    const context=current.current,operation={};lock.current=operation;setState(previous=>({...previous,scope,busy:true}));
    try{const rows=await readMembers();if(current.current!==context)return;onMembers(rows);review.current=false;setState({scope,busy:false,error:'',needsReview:false});onRefresh?.();}
    catch{if(current.current===context)setState({scope,busy:false,error:'Güncel üye listesi yüklenemedi. Listeyi kontrol etmeyi tekrar deneyin.',needsReview:true});}
    finally{if(lock.current===operation){lock.current=null;if(current.current===context)setState(previous=>({...previous,busy:false}));}}
  }
  return {run,refresh,...visible,blocked:visible.busy||visible.needsReview};
}
