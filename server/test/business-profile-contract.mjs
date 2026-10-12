import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

test('E4N Level 1 Member Business DNA (İş Profili) Contract', async (t) => {
  await t.test('1. Taxonomy & 16 questions definition contract in src/data/businessDnaData.ts', () => {
    const dataFilePath = path.join(rootDir, 'src/data/businessDnaData.ts');
    assert.ok(fs.existsSync(dataFilePath), 'src/data/businessDnaData.ts must exist');
    const content = fs.readFileSync(dataFilePath, 'utf8');

    // 16 Questions IDs (q01 - q16)
    for (let i = 1; i <= 16; i++) {
      const qId = `q${String(i).padStart(2, '0')}`;
      assert.ok(content.includes(`id: '${qId}'`), `Must contain question ${qId}`);
    }

    // 5 Canonical Sections
    assert.ok(content.includes('İş ve Uzmanlık'), 'Must include Section A: İş ve Uzmanlık');
    assert.ok(content.includes('Müşteri ve Sektör'), 'Must include Section B: Müşteri ve Sektör');
    assert.ok(content.includes('Gerçek İş Deneyimi'), 'Must include Section C: Gerçek İş Deneyimi');
    assert.ok(content.includes('Network ve Yönlendirme'), 'Must include Section D: Network ve Yönlendirme');
    assert.ok(content.includes('İlgi Alanları ve Beklentiler'), 'Must include Section E: İlgi Alanları ve Beklentiler');

    // Delivery methods for Q04
    assert.ok(content.includes("'self'"), 'Must include self delivery method');
    assert.ok(content.includes("'internal_team'"), 'Must include internal_team delivery method');
    assert.ok(content.includes("'partner'"), 'Must include partner delivery method');
  });

  await t.test('2. Business DNA Consent Modal and Dashboard placement', () => {
    const modalPath = path.join(rootDir, 'src/components/BusinessDnaConsentModal.tsx');
    assert.ok(fs.existsSync(modalPath), 'BusinessDnaConsentModal.tsx must exist');
    const modalContent = fs.readFileSync(modalPath, 'utf8');

    // Key clauses requested by user
    assert.ok(modalContent.includes('yapay zekâ') || modalContent.includes('yapay zeka'), 'Modal must explain AI decision support');
    assert.ok(modalContent.includes('dışarıya kapalı') || modalContent.includes('Gizli'), 'Modal must explain default privacy');
    assert.ok(modalContent.includes('Shuffle rotasyonu') || modalContent.includes('Shuffle'), 'Modal must mention Shuffle prerequisite');
    assert.ok(modalContent.includes('grup arkadaşlarınız') || modalContent.includes('grup'), 'Modal must explain benefit of sharing with peers');

    // Dashboard placement
    const dashboardPath = path.join(rootDir, 'src/pages/Dashboard.tsx');
    const dashContent = fs.readFileSync(dashboardPath, 'utf8');
    assert.ok(dashContent.includes('BusinessDnaConsentModal'), 'Dashboard must import and render BusinessDnaConsentModal');
    assert.ok(dashContent.includes('Seviye 1'), 'Dashboard must present Level 1 Business DNA status card');
    assert.ok(dashContent.includes('handleStartBusinessDna'), 'Dashboard must initiate consent flow before opening DNA form');
  });

  await t.test('3. Server API endpoints and group application barrier', () => {
    const serverIndexPath = path.join(rootDir, 'server/src/index.js');
    const serverContent = fs.readFileSync(serverIndexPath, 'utf8');

    assert.ok(serverContent.includes('installBusinessProfile'), 'Server index.js must mount installBusinessProfile');

    const businessProfileModule = path.join(rootDir, 'server/src/business-profile.js');
    assert.ok(fs.existsSync(businessProfileModule), 'server/src/business-profile.js must exist');
    const bpContent = fs.readFileSync(businessProfileModule, 'utf8');

    assert.ok(bpContent.includes('/api/business-profile/me'), 'Must have GET /api/business-profile/me');
    assert.ok(bpContent.includes('/api/business-profile/consent'), 'Must have POST /api/business-profile/consent');
    assert.ok(bpContent.includes('/api/business-profile/draft'), 'Must have PUT /api/business-profile/draft');
    assert.ok(bpContent.includes('/api/business-profile/complete'), 'Must have POST /api/business-profile/complete');
    assert.ok(bpContent.includes('/api/business-profile/visibility'), 'Must have PUT /api/business-profile/visibility');
    assert.ok(bpContent.includes('/api/business-profile/:userId'), 'Must have GET /api/business-profile/:userId');

    // Group application barrier check in group-applications.js
    const groupAppsPath = path.join(rootDir, 'server/src/group-applications.js');
    const gaContent = fs.readFileSync(groupAppsPath, 'utf8');
    assert.ok(gaContent.includes('BUSINESS_PROFILE_REQUIRED'), 'Must block group application if Business DNA is incomplete');

    // Shuffle eligibility barrier in canonical-period.js
    const canonicalPath = path.join(rootDir, 'server/src/canonical-period.js');
    const cpContent = fs.readFileSync(canonicalPath, 'utf8');
    assert.ok(cpContent.includes('INELIGIBLE_BUSINESS_PROFILE_INCOMPLETE'), 'Must enforce Business Profile completion for Shuffle');
  });

  await t.test('4. Route registration in App.tsx and API client in src/api/api.ts', () => {
    const appPath = path.join(rootDir, 'src/App.tsx');
    const appContent = fs.readFileSync(appPath, 'utf8');
    assert.ok(appContent.includes('/is-dna'), 'App.tsx must register /is-dna route');
    assert.ok(appContent.includes('/is-profili'), 'App.tsx must register /is-profili route');
    assert.ok(appContent.includes('BusinessDnaPage'), 'App.tsx must import BusinessDnaPage');

    const apiPath = path.join(rootDir, 'src/api/api.ts');
    const apiContent = fs.readFileSync(apiPath, 'utf8');
    assert.ok(apiContent.includes('getMyBusinessProfile'), 'api.ts must export getMyBusinessProfile');
    assert.ok(apiContent.includes('saveBusinessProfileConsent'), 'api.ts must export saveBusinessProfileConsent');
    assert.ok(apiContent.includes('saveBusinessProfileDraft'), 'api.ts must export saveBusinessProfileDraft');
    assert.ok(apiContent.includes('completeBusinessProfile'), 'api.ts must export completeBusinessProfile');
    assert.ok(apiContent.includes('updateBusinessProfileVisibility'), 'api.ts must export updateBusinessProfileVisibility');
  });
});
