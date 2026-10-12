// Express Router & Service for E4N Member Business DNA (Level 1)
// Stored in users.business_profile JSONB to maintain 50-table invariant

import { isUuid } from './group-capacity.js';

let columnEnsured = false;
export async function ensureBusinessProfileColumn(pool) {
  if (columnEnsured) return;
  try {
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS business_profile JSONB DEFAULT NULL');
    columnEnsured = true;
  } catch (err) {
    console.warn('Failed to ensure business_profile column:', err.message);
  }
}

export function installBusinessProfile(app, { pool, authenticateToken }) {
  // GET /api/business-profile/me
  // Returns current user's business profile status, consent, visibility and answers
  app.get('/api/business-profile/me', authenticateToken, async (req, res) => {
    try {
      await ensureBusinessProfileColumn(pool);
      let user;
      try {
        const { rows } = await pool.query(
          `SELECT id, name, email, company, profession, role, account_status, subscription_plan, subscription_end_date, business_profile
           FROM users WHERE id = $1`,
          [req.user.id]
        );
        user = rows[0];
      } catch (colErr) {
        if (colErr.message.includes('business_profile')) {
          await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS business_profile JSONB DEFAULT NULL').catch(() => {});
          const { rows } = await pool.query(
            `SELECT id, name, email, company, profession, role, account_status, subscription_plan, subscription_end_date
             FROM users WHERE id = $1`,
            [req.user.id]
          );
          user = rows[0];
        } else {
          throw colErr;
        }
      }
      if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });

      const profile = user.business_profile || {
        status: 'not_started',
        schemaVersion: 1,
        consentAccepted: false,
        isPublicToGroup: false,
        answers: {},
        currentStep: 1,
      };

      res.json({
        userId: user.id,
        name: user.name,
        company: user.company || '',
        profession: user.profession || '',
        profile,
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // POST /api/business-profile/consent
  // Records user consent to begin Business DNA (Required before drafting/completing)
  app.post('/api/business-profile/consent', authenticateToken, async (req, res) => {
    try {
      const { consentAccepted, consentTextVersion = '1.0' } = req.body || {};
      if (!consentAccepted) {
        return res.status(400).json({ error: 'Bilgilendirme ve gizlilik şartları onaylanmalıdır.' });
      }

      await ensureBusinessProfileColumn(pool);
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const userRes = await client.query('SELECT business_profile FROM users WHERE id = $1 FOR UPDATE', [req.user.id]);
        if (userRes.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
        }

        const existing = userRes.rows[0].business_profile || {
          status: 'not_started',
          schemaVersion: 1,
          answers: {},
          isPublicToGroup: false,
        };

        const updatedProfile = {
          ...existing,
          consentAccepted: true,
          consentAcceptedAt: new Date().toISOString(),
          consentTextVersion,
          status: existing.status === 'completed' ? 'completed' : 'draft',
          updatedAt: new Date().toISOString(),
        };

        await client.query(
          'UPDATE users SET business_profile = $1 WHERE id = $2',
          [JSON.stringify(updatedProfile), req.user.id]
        );

        await client.query('COMMIT');
        res.json({ success: true, profile: updatedProfile });
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // PUT /api/business-profile/draft
  // Autosaves progress step-by-step
  app.put('/api/business-profile/draft', authenticateToken, async (req, res) => {
    try {
      const { answers = {}, currentStep = 1 } = req.body || {};

      await ensureBusinessProfileColumn(pool);
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const userRes = await client.query('SELECT business_profile FROM users WHERE id = $1 FOR UPDATE', [req.user.id]);
        if (userRes.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
        }

        const existing = userRes.rows[0].business_profile || {
          status: 'draft',
          schemaVersion: 1,
          consentAccepted: true,
          isPublicToGroup: false,
        };

        const mergedAnswers = {
          ...(existing.answers || {}),
          ...answers,
        };

        // If q03 services changed, clean up removed services from q04
        if (Array.isArray(mergedAnswers.q03) && mergedAnswers.q04) {
          const currentServices = new Set(mergedAnswers.q03);
          const cleanedQ04 = {};
          for (const [svc, method] of Object.entries(mergedAnswers.q04)) {
            if (currentServices.has(svc)) {
              cleanedQ04[svc] = method;
            }
          }
          mergedAnswers.q04 = cleanedQ04;
        }

        const updatedProfile = {
          ...existing,
          status: existing.status === 'completed' ? 'completed' : 'draft',
          answers: mergedAnswers,
          currentStep: Number(currentStep) || 1,
          updatedAt: new Date().toISOString(),
        };

        await client.query(
          'UPDATE users SET business_profile = $1 WHERE id = $2',
          [JSON.stringify(updatedProfile), req.user.id]
        );

        await client.query('COMMIT');
        res.json({ success: true, profile: updatedProfile });
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // POST /api/business-profile/complete
  // Validates all 16 questions, saves revision and marks as completed
  app.post('/api/business-profile/complete', authenticateToken, async (req, res) => {
    try {
      const { answers = {} } = req.body || {};

      // Server-side validation of mandatory Level 1 answers
      const errors = [];
      if (!answers.q01 || typeof answers.q01 !== 'string' || answers.q01.trim().length < 30) {
        errors.push('Q01: Şirket faaliyet tanımı en az 30 karakter olmalıdır.');
      }
      if (!answers.q02 || !answers.q02.profession) {
        errors.push('Q02: Ana meslek seçilmelidir.');
      }
      if (!Array.isArray(answers.q03) || answers.q03.length < 1 || answers.q03.length > 5) {
        errors.push('Q03: En az 1, en fazla 5 hizmet seçilmelidir.');
      }
      if (answers.q03 && Array.isArray(answers.q03)) {
        for (const svc of answers.q03) {
          if (!answers.q04 || !answers.q04[svc]) {
            errors.push(`Q04: '${svc}' hizmeti için sunum yöntemi belirtilmelidir.`);
          }
        }
      }
      if (!answers.q05 || !Array.isArray(answers.q05.businessModels) || answers.q05.businessModels.length === 0) {
        errors.push('Q05: En az bir iş modeli seçilmelidir.');
      }
      if (!answers.q06 || (!answers.q06.noExperience && (!Array.isArray(answers.q06.sectors) || answers.q06.sectors.length === 0))) {
        errors.push('Q06: Geçmiş sektör deneyimi veya deneyim yokluğu belirtilmelidir.');
      }
      if (!answers.q07 || (!answers.q07.notDetermined && (!Array.isArray(answers.q07.sectors) || answers.q07.sectors.length === 0))) {
        errors.push('Q07: Hedef sektörler veya "Henüz belirlemedim" seçeneği belirtilmelidir.');
      }
      if (!Array.isArray(answers.q08) || answers.q08.length < 1 || answers.q08.length > 3) {
        errors.push('Q08: Çözülen en az 1, en fazla 3 müşteri ihtiyacı belirtilmelidir.');
      }
      if (!answers.q09 || (!answers.q09.hasCompletedProject && !answers.q09.note && !answers.q09.workDone)) {
        errors.push('Q09: Gerçekleştirilen bir proje örneği veya proje yokluğu belirtilmelidir.');
      }
      if (!answers.q11 || typeof answers.q11 !== 'string' || answers.q11.trim().length < 30) {
        errors.push('Q11: İdeal müşteri tanımı en az 30 karakter olmalıdır.');
      }
      if (!answers.q12 || (!answers.q12.notDetermined && (!Array.isArray(answers.q12.professions) || answers.q12.professions.length === 0))) {
        errors.push('Q12: İş birliği meslekleri seçilmelidir.');
      }
      if (!Array.isArray(answers.q14) || answers.q14.length < 1 || answers.q14.length > 10) {
        errors.push('Q14: İlgi alanları seçilmelidir (en fazla 10).');
      }
      if (!Array.isArray(answers.q15) || answers.q15.length < 1 || answers.q15.length > 2) {
        errors.push('Q15: E4N katılım amacı seçilmelidir (1-2 seçim).');
      }

      if (errors.length > 0) {
        return res.status(400).json({ error: 'Formda eksik veya geçersiz alanlar bulunmaktadır.', details: errors });
      }

      await ensureBusinessProfileColumn(pool);
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const userRes = await client.query('SELECT business_profile FROM users WHERE id = $1 FOR UPDATE', [req.user.id]);
        if (userRes.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
        }

        const existing = userRes.rows[0].business_profile || {
          status: 'draft',
          schemaVersion: 1,
          consentAccepted: true,
          isPublicToGroup: false,
          revisions: [],
        };

        const revisions = Array.isArray(existing.revisions) ? [...existing.revisions] : [];
        const nextRevNumber = revisions.length + 1;
        revisions.push({
          revisionNumber: nextRevNumber,
          completedAt: new Date().toISOString(),
          answers,
        });

        const completedProfile = {
          ...existing,
          status: 'completed',
          consentAccepted: true,
          completedAt: existing.completedAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          answers,
          revisions,
        };

        await client.query(
          'UPDATE users SET business_profile = $1 WHERE id = $2',
          [JSON.stringify(completedProfile), req.user.id]
        );

        await client.query('COMMIT');
        res.json({ success: true, message: 'İş profiliniz başarıyla tamamlandı.', profile: completedProfile });
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // PUT /api/business-profile/visibility
  // Toggles visibility to group members ("Grup arkadaşlarına aç / kapat")
  app.put('/api/business-profile/visibility', authenticateToken, async (req, res) => {
    try {
      const { isPublicToGroup } = req.body || {};
      if (typeof isPublicToGroup !== 'boolean') {
        return res.status(400).json({ error: 'isPublicToGroup değeri boolean olmalıdır.' });
      }

      await ensureBusinessProfileColumn(pool);
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const userRes = await client.query('SELECT business_profile FROM users WHERE id = $1 FOR UPDATE', [req.user.id]);
        if (userRes.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
        }

        const existing = userRes.rows[0].business_profile || {
          status: 'not_started',
          schemaVersion: 1,
          answers: {},
        };

        const updatedProfile = {
          ...existing,
          isPublicToGroup,
          visibilityUpdatedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await client.query(
          'UPDATE users SET business_profile = $1 WHERE id = $2',
          [JSON.stringify(updatedProfile), req.user.id]
        );

        await client.query('COMMIT');
        res.json({ success: true, isPublicToGroup, profile: updatedProfile });
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // GET /api/business-profile/:userId
  // RBAC Profile View:
  // Allowed if:
  // 1) Actor is viewing their own profile
  // 2) Actor is ADMIN
  // 3) Actor is PRESIDENT of a group where the target user is an applicant or member
  // 4) Target user's isPublicToGroup is TRUE and Actor is in the same group
  app.get('/api/business-profile/:userId', authenticateToken, async (req, res) => {
    try {
      const targetId = req.params.userId;
      if (!isUuid(targetId)) return res.status(400).json({ error: 'Geçersiz kullanıcı ID.' });

      const actorId = req.user.id;
      const isAdmin = req.user.role === 'ADMIN';

      await ensureBusinessProfileColumn(pool);
      const targetRes = await pool.query(
        `SELECT id, name, company, profession, role, business_profile
         FROM users WHERE id = $1`,
        [targetId]
      );
      if (targetRes.rows.length === 0) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
      const targetUser = targetRes.rows[0];
      const profile = targetUser.business_profile;

      if (!profile || profile.status === 'not_started') {
        return res.status(404).json({ error: 'Kullanıcının iş profili bulunmamaktadır.' });
      }

      // Check self or admin
      if (actorId === targetId || isAdmin) {
        return res.json({
          userId: targetUser.id,
          name: targetUser.name,
          company: targetUser.company,
          profession: targetUser.profession,
          profile,
        });
      }

      // Check President authority
      const presidentRes = await pool.query(
        `SELECT 1 FROM group_members gm
         WHERE gm.user_id = $1 AND gm.status = 'ACTIVE' AND (gm.role = 'PRESIDENT' OR gm.role = 'VICE_PRESIDENT')
           AND gm.group_id IN (
             SELECT group_id FROM group_members WHERE user_id = $2
             UNION
             SELECT group_id FROM group_applications WHERE user_id = $2
           )
         LIMIT 1`,
        [actorId, targetId]
      );
      const isPresident = presidentRes.rows.length > 0;

      if (isPresident) {
        return res.json({
          userId: targetUser.id,
          name: targetUser.name,
          company: targetUser.company,
          profession: targetUser.profession,
          profile,
        });
      }

      // Check Peer group member authority if public
      if (profile.isPublicToGroup) {
        const peerRes = await pool.query(
          `SELECT 1 FROM group_members gm1
           JOIN group_members gm2 ON gm1.group_id = gm2.group_id
           WHERE gm1.user_id = $1 AND gm2.user_id = $2
             AND gm1.status = 'ACTIVE' AND gm2.status = 'ACTIVE'
           LIMIT 1`,
          [actorId, targetId]
        );
        if (peerRes.rows.length > 0) {
          return res.json({
            userId: targetUser.id,
            name: targetUser.name,
            company: targetUser.company,
            profession: targetUser.profession,
            profile,
          });
        }
      }

      // Access denied
      return res.status(403).json({
        error: 'Bu iş profiline erişim yetkiniz bulunmamaktadır. Profil dışarıya kapalıdır.',
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
}
