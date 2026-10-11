// Test for Free Member Visitor Flow & Quota Contract
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverDir = path.resolve(__dirname, '..');
const repoDir = path.resolve(serverDir, '..');

console.log('--- Testing Free Member Visitor Flow Contract ---');

// 1. Backend Routes
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
  serverIndex.includes("source = 'free_member_visitor'"),
  'server/src/index.js must tag free member visitor requests with source free_member_visitor'
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

// 4. Landing Page
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

// 5. Uyelik & KapaliGruplar & NasilCalisir Pages
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

console.log('✅ ALL CHECKS PASSED: Free Member Visitor Flow Contract is 100% compliant!');
