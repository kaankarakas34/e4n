import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

test('E4N Membership Legal Activation and Onboarding Contract', async (t) => {
  await t.test('1. Legal documents dataset has all 17 documents with official company info', () => {
    const dataPath = path.join(rootDir, 'src/data/legalDocumentsData.ts');
    assert.ok(fs.existsSync(dataPath), 'src/data/legalDocumentsData.ts must exist');
    const content = fs.readFileSync(dataPath, 'utf8');

    // Official company info verification
    assert.ok(content.includes('Pardus Ticaret Haydar Karakaş'), 'Must include official company title');
    assert.ok(content.includes('5130029725'), 'Must include tax number');
    assert.ok(content.includes('0513002972500001'), 'Must include MERSIS number');
    assert.ok(content.includes('Kağıthane Vergi Dairesi'), 'Must include tax office');
    assert.ok(content.includes('destek@event4network.com') || content.includes('info@event4network.com'), 'Must include email');
    assert.ok(content.includes('pardus.ticaret@hs01.kep.tr'), 'Must include KEP address');

    // Document keys check
    const expectedKeys = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', 'H'];
    expectedKeys.forEach(key => {
      assert.ok(content.includes(`"${key}":`), `LEGAL_DOCUMENTS must include key "${key}"`);
    });

    assert.ok(content.includes('REQUIRED_DOCUMENT_IDS'), 'Must export REQUIRED_DOCUMENT_IDS');
    assert.ok(content.includes('CONSUMER_EXTRA_ID'), 'Must export CONSUMER_EXTRA_ID');
    assert.ok(content.includes('NOTICE_DOCUMENT_ID'), 'Must export NOTICE_DOCUMENT_ID');
  });

  await t.test('2. MembershipActivationPage component exists with complete interactive UI and modal', () => {
    const pagePath = path.join(rootDir, 'src/pages/MembershipActivationPage.tsx');
    assert.ok(fs.existsSync(pagePath), 'src/pages/MembershipActivationPage.tsx must exist');
    const content = fs.readFileSync(pagePath, 'utf8');

    assert.ok(content.includes('export function MembershipActivationPage'), 'Must export MembershipActivationPage component');
    assert.ok(content.includes('openedDocs'), 'Must track opened documents to gate checkbox activation');
    assert.ok(content.includes('disabled={!isOpened}'), 'Checkboxes must remain disabled until document is opened');
    assert.ok(content.includes('activeModalDocId'), 'Must support modal reader');
    assert.ok(content.includes('stage === \'pre\''), 'Must support pre-payment stage');
    assert.ok(content.includes('stage === \'post\''), 'Must support post-payment stage');
    assert.ok(content.includes('transactionType'), 'Must support transaction type switcher');
    assert.ok(content.includes('consumer'), 'Must support consumer flow option with 07');
    assert.ok(content.includes('api.activateMembership'), 'Must call api.activateMembership for post activation');
    assert.ok(content.includes('Resmi Hizmet Sağlayıcı'), 'Must render official service provider credentials card');
  });

  await t.test('3. App.tsx registers /membership/activate and aliases', () => {
    const appPath = path.join(rootDir, 'src/App.tsx');
    const content = fs.readFileSync(appPath, 'utf8');

    assert.ok(content.includes('MembershipActivationPage'), 'App.tsx must import MembershipActivationPage');
    assert.ok(content.includes('path="/membership/activate"'), 'App.tsx must define /membership/activate route');
    assert.ok(content.includes('path="/sozlesmeler"'), 'App.tsx must define /sozlesmeler route');
    assert.ok(content.includes('path="/checkout/review"'), 'App.tsx must define /checkout/review route');
    assert.ok(content.includes('path="/sozlesme"'), 'App.tsx must define /sozlesme redirect');
    assert.ok(content.includes('path="/aktivasyon"'), 'App.tsx must define /aktivasyon redirect');
  });

  await t.test('4. Server src/index.js defines activation and legal routes', () => {
    const indexPath = path.join(rootDir, 'server/src/index.js');
    const content = fs.readFileSync(indexPath, 'utf8');

    assert.ok(content.includes("app.get('/api/membership/activation-status'"), 'Must declare GET /api/membership/activation-status');
    assert.ok(content.includes("app.post('/api/membership/activate'"), 'Must declare POST /api/membership/activate');
    assert.ok(content.includes("app.post('/api/legal/acceptances'"), 'Must declare POST /api/legal/acceptances');
    assert.ok(content.includes("explicit_consent, kvkk_consent"), 'Must select consent columns in /api/users/me');
  });

  await t.test('5. PaymentModal / Membership redirects to /membership/activate on success', () => {
    const membershipPath = path.join(rootDir, 'src/pages/Membership.tsx');
    const content = fs.readFileSync(membershipPath, 'utf8');

    assert.ok(content.includes("navigate('/membership/activate'"), 'Membership payment success must navigate to /membership/activate');
    assert.ok(content.includes("fromPayment: true"), 'Must pass fromPayment state flag');
  });

  await t.test('6. Dashboard renders activation notice banner for members awaiting consent', () => {
    const dashboardPath = path.join(rootDir, 'src/pages/Dashboard.tsx');
    const content = fs.readFileSync(dashboardPath, 'utf8');

    assert.ok(content.includes('!user.explicit_consent'), 'Dashboard must check !user.explicit_consent');
    assert.ok(content.includes('/membership/activate'), 'Dashboard activation notice banner must link to /membership/activate');
    assert.ok(content.includes('Sözleşme Onayı & Aktivasyon Bekleniyor'), 'Banner must indicate pending contract activation');
  });
});
