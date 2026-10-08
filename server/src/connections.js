const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value);
const fail = (status, message) => Object.assign(new Error(message), { status });
const pairSql = 'SELECT * FROM friend_requests WHERE (sender_id=$1 AND receiver_id=$2) OR (sender_id=$2 AND receiver_id=$1)';
function state(rows, owner, target) {
  if (owner === target) return 'SELF';
  if (rows.length > 1 || rows.some(r => !['PENDING', 'ACCEPTED', 'REJECTED'].includes(r.status))) throw fail(409, 'Bağlantı kayıtları tutarsız; yönetim incelemesi gerekiyor.');
  const r = rows[0];
  return !r ? 'NONE' : r.status === 'ACCEPTED' ? 'FRIEND' : r.status === 'REJECTED' ? 'REJECTED' : r.sender_id === owner ? 'PENDING_SENT' : 'PENDING_RECEIVED';
}

export function installConnections(app, { pool, authenticateToken }) {
  const route = handler => async (req, res) => {
    res.set('Cache-Control', 'private, no-store');
    let client;
    try {
      if (!uuid(req.user.id)) throw fail(401, 'Oturum doğrulanamadı.');
      client = await pool.connect();
      await client.query(req.method === 'GET' ? 'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY' : 'BEGIN');
      const { rows: [owner] } = await client.query('SELECT id, role FROM users WHERE id=$1', [req.user.id]);
      if (!owner) throw fail(401, 'Oturum doğrulanamadı.');
      req.user.id = owner.id;
      const result = await handler(req, client, owner);
      await client.query('COMMIT');
      res.json(result);
    } catch (error) {
      if (client) await client.query('ROLLBACK').catch(() => {});
      if (!error.status) console.error('Connection operation failed:', error.message);
      res.status(error.status || 500).json({ error: error.status ? error.message : 'Bağlantı işlemi tamamlanamadı. Tekrar deneyin.' });
    } finally { client?.release(); }
  };
  const target = async (req, client, id) => {
    if (!uuid(id)) throw fail(400, 'Geçersiz kullanıcı.');
    const { rows: [user] } = await client.query('SELECT to_jsonb(u) AS data FROM users u WHERE id=$1', [id]);
    if (!user) throw fail(404, 'Kullanıcı bulunamadı.');
    return user.data;
  };
  app.get('/api/user/connections', authenticateToken, route(async (req, client, owner) => {
    if (Object.keys(req.query).length) throw fail(400, 'Bu liste oturum sahibine aittir.');
    const bad = await client.query(`SELECT 1 FROM friend_requests WHERE sender_id=$1 OR receiver_id=$1
      GROUP BY CASE WHEN sender_id=$1 THEN receiver_id ELSE sender_id END
      HAVING count(*)<>1 OR bool_or(sender_id=receiver_id OR status IS NULL OR status NOT IN ('PENDING','ACCEPTED','REJECTED')) LIMIT 1`, [owner.id]);
    if (bad.rowCount) throw fail(409, 'Bağlantı kayıtları tutarsız; yönetim incelemesi gerekiyor.');
    const rows = (await client.query(`SELECT u.id,u.name,u.profession,u.company,u.city
      FROM friend_requests fr JOIN users u ON u.id=CASE WHEN fr.sender_id=$1 THEN fr.receiver_id ELSE fr.sender_id END
      WHERE (fr.sender_id=$1 OR fr.receiver_id=$1) AND fr.status='ACCEPTED' AND u.id<>$1
      ORDER BY u.name,u.id LIMIT 1001`, [owner.id])).rows;
    if (rows.length>1000) throw fail(503, 'Bağlantı listesi sınırı aşıldı.');
    return {version:1,ownerId:owner.id,connections:rows};
  }));
  app.get('/api/user/friends/check/:id', authenticateToken, route(async (req, client) => {
    const user = await target(req, client, req.params.id);
    return { ownerId: req.user.id, targetId: user.id, status: state((await client.query(pairSql, [req.user.id, user.id])).rows, req.user.id, user.id) };
  }));
  app.get('/api/user/profiles/:id', authenticateToken, route(async (req, client, owner) => {
    const u = await target(req, client, req.params.id);
    const status = state((await client.query(pairSql, [owner.id, u.id])).rows, owner.id, u.id);
    const contactVisible = ['SELF', 'FRIEND'].includes(status) || owner.role === 'ADMIN';
    const billingVisible = status === 'SELF' || owner.role === 'ADMIN';
    const profile = { id: u.id, name: u.name, profession: u.profession, company: u.company ?? null,
      bio: u.bio ?? null, profile_image: u.profile_image ?? u.avatar ?? null };
    if (contactVisible) for (const key of ['email', 'phone', 'city', 'website', 'linkedin_profile']) profile[key] = u[key] ?? null;
    if (billingVisible) for (const key of ['tax_number', 'tax_office', 'billing_address']) profile[key] = u[key] ?? null;
    const { rows: commonGroups } = await client.query(`SELECT DISTINCT g.id, g.name FROM groups g
      JOIN group_members mine ON mine.group_id=g.id AND mine.user_id=$1 AND mine.status='ACTIVE'
      JOIN group_members theirs ON theirs.group_id=g.id AND theirs.user_id=$2 AND theirs.status='ACTIVE'
      WHERE g.status='ACTIVE' ORDER BY g.name, g.id`, [owner.id, u.id]);
    return { version: 1, ownerId: owner.id, targetId: u.id, status, contactVisible, billingVisible, profile, commonGroups };
  }));
  app.get('/api/user/friends/requests', authenticateToken, route(async (req, client) => {
    const type = req.query.type ?? 'outgoing';
    if (!['incoming', 'outgoing'].includes(type) || Object.keys(req.query).some(k => k !== 'type')) throw fail(400, 'Geçersiz istek türü.');
    const incoming = type === 'incoming';
    return (await client.query(`SELECT fr.*, u.name AS ${incoming ? 'sender' : 'receiver'}_name,
      u.profession AS ${incoming ? 'sender' : 'receiver'}_profession
      FROM friend_requests fr JOIN users u ON u.id=fr.${incoming ? 'sender' : 'receiver'}_id
      WHERE fr.${incoming ? 'receiver' : 'sender'}_id=$1 ${incoming ? "AND fr.status='PENDING'" : ''}
      ORDER BY fr.created_at, fr.id`, [req.user.id])).rows;
  }));
  const mutate = action => route(async (req, client, owner) => {
    const raw = action === 'create' ? req.body.targetId : req.params.id;
    const other = typeof raw === 'string' ? raw.toLowerCase() : raw;
    if (!uuid(other) || other === owner.id) throw fail(400, 'Kendinize veya geçersiz kullanıcıya istek gönderemezsiniz.');
    // Both directions use the same transaction lock, including when no row exists yet.
    await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [`friend:${[owner.id.toLowerCase(), other.toLowerCase()].sort().join(':')}`]);
    await target(req, client, other);
    const { rows } = await client.query(`${pairSql} FOR UPDATE`, [owner.id, other]);
    state(rows, owner.id, other);
    let r = rows[0], replay = false;
    if (action === 'create') {
      if (r) {
        if (r.sender_id !== owner.id || r.status !== 'PENDING') throw fail(409, 'Bu kullanıcıyla zaten bir bağlantı kaydı var.');
        replay = true;
      } else {
        r = (await client.query('INSERT INTO friend_requests(sender_id,receiver_id) VALUES($1,$2) RETURNING *', [owner.id, other])).rows[0];
      }
    } else {
      if (!r || r.receiver_id !== owner.id || r.sender_id !== other) throw fail(404, 'Size gönderilmiş istek bulunamadı.');
      const next = action === 'accept' ? 'ACCEPTED' : 'REJECTED';
      if (r.status === next) replay = true;
      else if (r.status !== 'PENDING') throw fail(409, 'Bu istek daha önce sonuçlandırılmış.');
      else r = (await client.query("UPDATE friend_requests SET status=$2, updated_at=now() WHERE id=$1 AND status='PENDING' RETURNING *", [r.id, next])).rows[0];
    }
    if (!r) throw fail(409, 'İstek kaydı doğrulanamadı.');
    return { success: true, ownerId: owner.id, targetId: other, requestId: r.id, status: state([r], owner.id, other), replay };
  });
  app.post('/api/user/friends/request', authenticateToken, mutate('create'));
  app.post('/api/user/friends/request/:id/accept', authenticateToken, mutate('accept'));
  app.post('/api/user/friends/request/:id/reject', authenticateToken, mutate('reject'));
}
