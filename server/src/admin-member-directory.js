const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(v);
export function installAdminMemberDirectory(app,{pool,authenticateToken}) {
  app.get('/api/admin/member-directory',authenticateToken,async(req,res)=>{
    res.set('Cache-Control','private, no-store');
    if(Object.keys(req.query).length)return res.status(400).json({error:'Invalid directory query'});
    if(!uuid(req.user.id))return res.sendStatus(401);
    let client;
    try {
      client=await pool.connect();await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
      const owner=(await client.query('SELECT role,now() AS as_of FROM users WHERE id=$1',[req.user.id])).rows[0];
      if(!owner){await client.query('ROLLBACK');return res.sendStatus(401);}
      if(owner.role!=='ADMIN'){await client.query('ROLLBACK');return res.sendStatus(403);}
      const users=(await client.query(`SELECT id,name,email,phone,city,profession,company,role,account_status,created_at,
        position,linkedin_profile FROM users ORDER BY lower(name),id LIMIT 5001`)).rows;
      if(users.length>5000){await client.query('ROLLBACK');return res.status(503).json({error:'Directory exceeds supported size'});}
      const memberships=users.length?(await client.query(`SELECT gm.user_id,g.id,g.name,g.status AS group_status,
        gm.status AS membership_status,gm.joined_at FROM group_members gm JOIN groups g ON g.id=gm.group_id
        WHERE gm.user_id=ANY($1::uuid[]) ORDER BY g.name,g.id,gm.user_id LIMIT 50001`,[users.map(u=>u.id)])).rows:[];
      if(memberships.length>50000){await client.query('ROLLBACK');return res.status(503).json({error:'Membership directory exceeds supported size'});}
      const byOwner=new Map();
      for(const {user_id,...group} of memberships){if(!byOwner.has(user_id))byOwner.set(user_id,[]);byOwner.get(user_id).push(group);}
      await client.query('COMMIT');res.json({version:1,ownerId:req.user.id,asOf:owner.as_of,
        members:users.map(u=>({...u,groups:byOwner.get(u.id)??[]}))});
    }catch(error){if(client)await client.query('ROLLBACK').catch(()=>{});console.error('Member directory failed:',error.message);res.status(500).json({error:'Member directory unavailable'});}
    finally{client?.release();}
  });
}
