import {createHash} from 'node:crypto';
// Current records only: this snapshot does not infer period history or payment eligibility.
export async function readShuffleWorkspace(client,{lock=false}={}){
  const groups=(await client.query('SELECT id,name,status FROM groups ORDER BY lower(name),id LIMIT 5001'+(lock?' FOR UPDATE':''))).rows;
  const members=(await client.query('SELECT id,name AS full_name,profession,role,account_status FROM users ORDER BY lower(name),id LIMIT 10001'+(lock?' FOR UPDATE':''))).rows;
  const memberships=(await client.query(`SELECT gm.group_id,gm.user_id,gm.role,gm.joined_at FROM group_members gm JOIN users u ON u.id=gm.user_id JOIN groups g ON g.id=gm.group_id WHERE gm.status='ACTIVE' ORDER BY gm.group_id,gm.user_id LIMIT 20001`+(lock?' FOR UPDATE OF gm':''))).rows;
  if(groups.length>5000||members.length>10000||memberships.length>20000)throw Object.assign(Error('Workspace exceeds supported size'),{code:'WORKSPACE_SIZE',status:503});
  const data={groups,members,memberships};
  return {...data,revision:createHash('sha256').update(JSON.stringify(data)).digest('hex')};
}
export function installShuffleWorkspace(app,{pool,authenticateToken}) {
  app.get('/api/admin/shuffle-workspace',authenticateToken,async(req,res)=>{
    res.set('Cache-Control','private, no-store');
    if(Object.keys(req.query).length)return res.status(400).json({error:'Invalid workspace query'});
    if(typeof req.user.id!=='string'||!/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(req.user.id))return res.sendStatus(401);
    let client;
    try {
      client=await pool.connect();
      await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
      const actor=(await client.query('SELECT role,now() AS as_of FROM users WHERE id=$1',[req.user.id])).rows[0];
      if(!actor){await client.query('ROLLBACK');return res.sendStatus(401);}
      if(actor.role!=='ADMIN'){await client.query('ROLLBACK');return res.sendStatus(403);}
      const data=await readShuffleWorkspace(client);
      await client.query('COMMIT');
      res.json({version:1,ownerId:req.user.id,asOf:actor.as_of,historyAvailable:false,...data});
    }catch(error){if(client)await client.query('ROLLBACK').catch(()=>{});console.error('Shuffle workspace failed:',error.code||'UNKNOWN');res.status(error.status||500).json({error:'Shuffle workspace unavailable'});}
    finally{client?.release();}
  });
}
