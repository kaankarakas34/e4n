import {randomUUID} from 'node:crypto';
const actions=new Set(['APPLICATION','MEMBER_STATUS','MEMBER_REMOVAL','MEMBER_TRANSFER','ROLE_ASSIGNMENT','SHUFFLE','GROUP_DELETION','USER_DELETION']);
const uuid=value=>typeof value==='string'&&/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value);

// Call only after BEGIN and current-DB authorization. No request-supplied actor/name/action.
export async function setMembershipOperationContext(client,actorId,action,operationId=randomUUID()){
 if(!uuid(actorId))throw Object.assign(Error('Oturum bulunamadı.'),{status:401,code:'UNAUTHENTICATED'});
 if(!actions.has(action)||!uuid(operationId))throw Error('Invalid membership operation context');
 const actor=(await client.query('SELECT name FROM users WHERE id=$1',[actorId])).rows[0];
 if(!actor)throw Object.assign(Error('Oturum bulunamadı.'),{status:401,code:'UNAUTHENTICATED'});
 const context={actorId,actorName:actor.name??null,action,operationId};
 await client.query("SELECT set_config('e4n.membership_context',$1,true)",[JSON.stringify(context)]);
 return context;
}
