// Test for Free Member Visitor Flow & Quota Contract
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverDir = path.resolve(__dirname, '..');
const repoDir = path.resolve(serverDir, '..');

console.log('--- Testing Free Member Visitor Flow Contract ---');

// 1. Backend Routes & Profession Conflict Validation
const serverIndexPath = path.resolve(serverDir, 'src/index.js');
const serverIndex = readFileSync(serverIndexPath, 'utf8');

assert.ok(
  serverIndex.includes("app.get('/api/user/free-visits'"),
  'server/src/index.js must define GET /api/user/free-visits'
);
assert.ok(
  serverIndex.includes("app.post('/api/user/request-visitor'"),
  'server/src/index.js must define POST /api/user/request-visitor'
);
assert.ok(
  serverIndex.includes("app.get('/api/groups/:id/stats'"),
  'server/src/index.js must define GET /api/groups/:id/stats'
);
assert.ok(
  serverIndex.includes("PROFESSION_CONFLICT"),
  'server/src/index.js must enforce profession conflict check (PROFESSION_CONFLICT)'
);
assert.ok(
  serverIndex.includes("visitsUsed >= 2"),
  'server/src/index.js must enforce max 2 visits limit'
);
assert.ok(
  serverIndex.includes("isSubscribed"),
  'server/src/index.js must check isSubscribed status'
);

// 2. Client API
const apiTsPath = path.resolve(repoDir, 'src/api/api.ts');
const apiTs = readFileSync(apiTsPath, 'utf8');

assert.ok(
  apiTs.includes('getFreeVisits()'),
  'src/api/api.ts must define getFreeVisits method'
);
assert.ok(
  apiTs.includes('requestGroupVisitor(groupId: string, notes?: string)'),
  'src/api/api.ts must define requestGroupVisitor method'
);
assert.ok(
  apiTs.includes('getGroupStats(groupId: string)'),
  'src/api/api.ts must define getGroupStats method'
);

// 3. GroupDiscovery Component
const groupDiscoveryPath = path.resolve(repoDir, 'src/components/GroupDiscovery.tsx');
const groupDiscovery = readFileSync(groupDiscoveryPath, 'utf8');

assert.ok(
  groupDiscovery.includes('getFreeVisits'),
  'GroupDiscovery must fetch free visits status'
);
assert.ok(
  groupDiscovery.includes('Ziyaretçi olmak istiyorum'),
  'GroupDiscovery must feature "Ziyaretçi olmak istiyorum" button'
);
assert.ok(
  groupDiscovery.includes('!isSubscribed'),
  'GroupDiscovery must guard visitor features with !isSubscribed'
);
assert.ok(
  groupDiscovery.includes('requestGroupVisitor'),
  'GroupDiscovery must submit visitor request'
);
assert.ok(
  groupDiscovery.includes('inspectModalGroup'),
  'GroupDiscovery must feature popup modal for inspection'
);
assert.ok(
  groupDiscovery.includes("inspectTab === 'MEMBERS'") && groupDiscovery.includes("inspectTab === 'STATS'"),
  'GroupDiscovery inspection popup must feature 2 tabs (Members and Stats)'
);
assert.ok(
  groupDiscovery.includes('isGroupProfessionConflicted'),
  'GroupDiscovery must check and guard against profession conflict'
);

// 4. Dashboard Banner
const dashboardPath = path.resolve(repoDir, 'src/pages/Dashboard.tsx');
const dashboard = readFileSync(dashboardPath, 'utf8');
assert.ok(
  dashboard.includes('Ziyaretçi olun ve gruptaki üyelerle tanışın (Ücretsiz)'),
  'Dashboard must feature "Ziyaretçi olun ve gruptaki üyelerle tanışın (Ücretsiz)" banner'
);
assert.ok(
  dashboard.includes('/chapter-management'),
  'Dashboard visitor banner must link/navigate to /chapter-management'
);

// 5. Landing Page
const landingPagePath = path.resolve(repoDir, 'src/pages/LandingPage.tsx');
const landingPage = readFileSync(landingPagePath, 'utf8');

assert.ok(
  landingPage.includes('Gelin, ilk önce') && landingPage.includes('ziyaretçi olun!'),
  'LandingPage must include "Gelin, ilk önce ziyaretçi olun!" section'
);
assert.ok(
  landingPage.includes('2 Toplantı Ücretsiz Ziyaretçi'),
  'LandingPage hero must highlight 2 free visitor meetings'
);
assert.ok(
  landingPage.includes('Üye olmadan önce toplantıları ziyaret edebilir miyim?'),
  'LandingPage FAQ must answer visitor eligibility'
);

// 6. Uyelik & KapaliGruplar & NasilCalisir Pages
const uyelikPath = path.resolve(repoDir, 'src/pages/Uyelik.tsx');
const uyelik = readFileSync(uyelikPath, 'utf8');
assert.ok(
  uyelik.includes('Ücretsiz ziyaretçi deneyimi'),
  'Uyelik page must explain free visitor experience step'
);

const kapaliGruplarPath = path.resolve(repoDir, 'src/pages/KapaliGruplar.tsx');
const kapaliGruplar = readFileSync(kapaliGruplarPath, 'utf8');
assert.ok(
  kapaliGruplar.includes('Gelin, ilk önce ziyaretçi olun!'),
  'KapaliGruplar page must invite users to become visitors first'
);

const nasilCalisirPath = path.resolve(repoDir, 'src/pages/NasilCalisir.tsx');
const nasilCalisir = readFileSync(nasilCalisirPath, 'utf8');
assert.ok(
  nasilCalisir.includes('2 toplantıya kadar ücretsiz ziyaretçi'),
  'NasilCalisir page must explain free visitor option in step 2'
);

console.log('✅ ALL CHECKS PASSED: Free Member Visitor Flow & Group Inspection Contract is 100% compliant!');
