import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

test('E4N Member Handbook & Unsubscribed Dashboard Rules Contract', async (t) => {
  await t.test('1. Handbook data contains 9 canonical tabs and 11 Ekim 2026 updates', () => {
    const handbookDataPath = path.join(rootDir, 'src/data/handbookData.ts');
    assert.ok(fs.existsSync(handbookDataPath), 'src/data/handbookData.ts must exist');
    const content = fs.readFileSync(handbookDataPath, 'utf8');

    // Tab count & IDs
    const expectedTabs = [
      'hos-geldiniz',
      'uyelik-meslek',
      'gruplar-toplantilar',
      'isbirligi',
      'shuffle-puan',
      'loncalar-yonetim',
      'etik-gizlilik',
      'finans-disiplin',
      'ilk-adimlar'
    ];

    expectedTabs.forEach(tabId => {
      assert.ok(content.includes(`"id": "${tabId}"`) || content.includes(`id: "${tabId}"`), `Handbook must include tab ${tabId}`);
    });

    // 11 Ekim 2026 decisions
    assert.ok(content.includes('15 dakikadır') || content.includes('15 dakika'), 'Must include 15-minute tolerance rule');
    assert.ok(content.includes('2 vekil'), 'Must include 2 substitute rule');
    assert.ok(content.includes('en fazla bir ay dondurulabilir') || content.includes('1 ay dondurma'), 'Must include 1 month freezing rule');
    assert.ok(content.includes('Yıllık üyelik bedeli peşin'), 'Must include annual advance payment rule');

    // Verification: NO EDITOR_ONLY content in member view
    assert.ok(!content.includes('EDITOR_ONLY_START'), 'Must NOT contain EDITOR_ONLY_START');
    assert.ok(!content.includes('EDITOR_ONLY_END'), 'Must NOT contain EDITOR_ONLY_END');
  });

  await t.test('2. MemberHandbook component is created and exports page', () => {
    const handbookPagePath = path.join(rootDir, 'src/pages/MemberHandbook.tsx');
    assert.ok(fs.existsSync(handbookPagePath), 'src/pages/MemberHandbook.tsx must exist');
    const content = fs.readFileSync(handbookPagePath, 'utf8');

    assert.ok(content.includes('export function MemberHandbook'), 'Must export MemberHandbook component');
    assert.ok(content.includes('handleSelectTab'), 'Must support tab switching');
    assert.ok(content.includes('searchQuery'), 'Must support handbook search');
    assert.ok(content.includes('parseMarkdownToBlocks'), 'Must parse markdown blocks');
  });

  await t.test('3. App.tsx registers /rehber and redirects /kurallar', () => {
    const appPath = path.join(rootDir, 'src/App.tsx');
    const content = fs.readFileSync(appPath, 'utf8');

    assert.ok(content.includes('MemberHandbook'), 'App.tsx must import MemberHandbook');
    assert.ok(content.includes('path="/rehber"'), 'App.tsx must have /rehber route');
    assert.ok(content.includes('path="/kurallar" element={<Navigate to="/rehber" replace />}'), '/kurallar must redirect to /rehber');
  });

  await t.test('4. Dashboard.tsx conditionally renders handbook card instead of ScoreCard for unsubscribed users', () => {
    const dashboardPath = path.join(rootDir, 'src/pages/Dashboard.tsx');
    const content = fs.readFileSync(dashboardPath, 'utf8');

    assert.ok(content.includes('isSubscribed'), 'Dashboard must compute isSubscribed boolean');
    assert.ok(content.includes('!isSubscribed ?'), 'Dashboard must conditionally check !isSubscribed');
    assert.ok(content.includes('E4N Üyelik ve Çalışma Rehberi'), 'Dashboard must render E4N Üyelik ve Çalışma Rehberi card for unsubscribed members');
    assert.ok(content.includes("navigate('/rehber')"), 'Handbook card must navigate to /rehber');
    assert.ok(content.includes('15 Dk Geç Kalma Toleransı'), 'Handbook card must highlight 15 min tolerance');
    assert.ok(content.includes('2 Vekil & 3 Devamsızlık'), 'Handbook card must highlight 2 substitutes & 3 absences');
  });
});
