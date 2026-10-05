const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(v);
export function installAdminGroupCatalog(app,{pool,authenticateToken}) {
  app.get('/api/admin/group-catalog',authenticateToken,async(req,res)=>{
    res.set('Cache-Control','private, no-store');
    if(Object.keys(req.query).length)return res.status(400).json({error:'Invalid catalog query'});
    if(!uuid(req.user.id))return res.sendStatus(401);
    let client;
    try {
      client=await pool.connect();await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
      const owner=(await client.query('SELECT role,now() AS as_of FROM users WHERE id=$1',[req.user.id])).rows[0];
      if(!owner){await client.query('ROLLBACK');return res.sendStatus(401);}
      if(owner.role!=='ADMIN'){await client.query('ROLLBACK');return res.sendStatus(403);}
      const groups=(await client.query(`SELECT g.id,g.name,g.status,
        count(m.user_id)::int AS total_records,
        count(m.user_id) FILTER(WHERE m.status='ACTIVE')::int AS active_records,
        count(m.user_id) FILTER(WHERE m.status='REQUESTED')::int AS requested_records,
        count(m.user_id) FILTER(WHERE m.status IS NOT NULL AND m.status NOT IN('ACTIVE','REQUESTED'))::int AS other_records,
        count(m.user_id) FILTER(WHERE m.status IS NULL)::int AS unknown_records
        FROM groups g LEFT JOIN (SELECT gm.group_id,gm.user_id,gm.status FROM group_members gm
          JOIN users u ON u.id=gm.user_id) m ON m.group_id=g.id
        GROUP BY g.id ORDER BY lower(g.name),g.id LIMIT 5001`)).rows;
      if(groups.length>5000){await client.query('ROLLBACK');return res.status(503).json({error:'Catalog exceeds supported size'});}
      await client.query('COMMIT');res.json({version:1,ownerId:req.user.id,asOf:owner.as_of,groups});
    }catch(error){if(client)await client.query('ROLLBACK').catch(()=>{});console.error('Group catalog failed:',error.message);res.status(500).json({error:'Group catalog unavailable'});}
    finally{client?.release();}
  });
}
