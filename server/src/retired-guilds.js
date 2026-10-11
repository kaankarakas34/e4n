// Internal guild membership and management have moved to public WhatsApp communities.
// Keep historic rows intact; reject old API clients before any database access.
export function retiredGuildRequest(req, res, next) {
  const path = req.path.replace(/\/+$/, '').toLowerCase();
  const guildEndpoint = /^\/api\/(?:power-teams(?:\/|$)|user\/power-team(?:s|-requests)$|admin\/power-team-settings$)/.test(path);
  const guildRole = path === '/api/admin/assign-role' && req.body?.type === 'POWER_TEAM';
  const guildContext = ['POST', 'PUT', 'PATCH'].includes(req.method) && (req.body?.power_team_id || req.body?.powerTeamId);
  if (!guildEndpoint && !guildRole && !guildContext) return next();
  return res.status(410).json({
    code: 'INTERNAL_GUILDS_RETIRED',
    error: 'Loncalar artık herkese açık WhatsApp topluluklarıdır. Uygulama içi lonca üyeliği ve yönetimi kaldırıldı.',
    communityUrl: '/topluluklarimiz',
  });
}
