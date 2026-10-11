// Contract test for PAR-01 / E4N-115: Web and Mobile Capability, Navigation & Role Matrix Audit
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverDir = path.resolve(__dirname, '..');
const repoDir = path.resolve(serverDir, '..');

console.log('--- Testing PAR-01 / E4N-115: Capability, Navigation and Role Matrix ---');

// 1. Verify existence and content of PAR-01 Matrix Specification
const matrixDocPath = path.resolve(serverDir, 'docs/par-01-web-mobile-capability-and-role-matrix.md');
assert.ok(existsSync(matrixDocPath), 'PAR-01 Matrix doc must exist');

const matrixDoc = readFileSync(matrixDocPath, 'utf8');

// 1.1 Verify all 4 User Roles are defined
for (const role of ['ANONYMOUS', 'MEMBER', 'PRESIDENT', 'ADMIN']) {
  assert.ok(matrixDoc.includes(role), `Role ${role} must be defined in matrix doc`);
}
console.log('✅ All 4 user roles defined in matrix specification.');

// 1.2 Verify 20 Capability IDs (PAR-01 to PAR-20)
for (let i = 1; i <= 20; i++) {
  const capId = `PAR-${String(i).padStart(2, '0')}`;
  assert.ok(matrixDoc.includes(capId), `Capability ${capId} must be documented`);
}
console.log('✅ All 20 capability areas documented.');

// 1.3 Verify parity classification states
for (const state of ['PARITY_FULL', 'PARITY_PARTIAL', 'WEB_ONLY_INTENTIONAL', 'GAP_TO_CLOSE']) {
  assert.ok(matrixDoc.includes(state), `State ${state} must be used in classification`);
}
console.log('✅ All parity classification categories verified.');

// 2. Mobile Navigation & Auth Architecture Verification
const authHookPath = path.resolve(repoDir, 'mobile/hooks/use-auth.tsx');
const tabsLayoutPath = path.resolve(repoDir, 'mobile/app/(tabs)/_layout.tsx');
const menuPath = path.resolve(repoDir, 'mobile/app/(tabs)/menu.tsx');
const adminIndexPath = path.resolve(repoDir, 'mobile/app/admin/index.tsx');

assert.ok(existsSync(authHookPath), 'mobile use-auth.tsx must exist');
assert.ok(existsSync(tabsLayoutPath), 'mobile (tabs)/_layout.tsx must exist');
assert.ok(existsSync(menuPath), 'mobile (tabs)/menu.tsx must exist');
assert.ok(existsSync(adminIndexPath), 'mobile admin/index.tsx must exist');

const authContent = readFileSync(authHookPath, 'utf8');
const tabsLayoutContent = readFileSync(tabsLayoutPath, 'utf8');
const menuContent = readFileSync(menuPath, 'utf8');
const adminIndexContent = readFileSync(adminIndexPath, 'utf8');

// 2.1 Auth hook role enforcement
assert.ok(authContent.includes("user.role === 'ADMIN'"), 'Auth hook must check ADMIN role');
assert.ok(authContent.includes("router.replace('/admin')"), 'ADMIN must route to /admin');
assert.ok(authContent.includes("router.replace('/login')"), 'Unauthenticated must route to /login');

// 2.2 Tabs layout structure (5 main member tabs)
for (const tab of ['index', 'network', 'events', 'profile', 'menu']) {
  assert.ok(tabsLayoutContent.includes(`name="${tab}"`), `Tab ${tab} must be registered`);
}
console.log('✅ Mobile 5-tab navigation structure verified.');

// 2.3 Menu items registry (10 member features)
for (const item of ['meeting-requests', 'referrals', 'activities', 'lms', 'messages', 'reports', 'payment', 'store', 'support', 'settings']) {
  assert.ok(menuContent.includes(`id: '${item}'`), `Menu item ${item} must be registered`);
}
console.log('✅ Mobile 10-feature menu registry verified.');

// 2.4 Admin dashboard features and role gate
assert.ok(adminIndexContent.includes("user?.role !== 'ADMIN'"), 'Admin dashboard must enforce ADMIN role');
assert.ok(adminIndexContent.includes('yönetici yetkisi gerekiyor') || adminIndexContent.includes('Yönetici yetkisi gerekiyor'), 'Admin dashboard must have role barrier text');
for (const feat of ['events', 'groups', 'applications', 'users', 'subscriptions', 'timer', 'shuffle', 'lms', 'reports', 'email', 'tickets', 'professions']) {
  assert.ok(adminIndexContent.includes(`id: '${feat}'`), `Admin feature ${feat} must be defined`);
}
console.log('✅ Mobile admin dashboard 12-feature structure and role gate verified.');

// 3. MOB-01 Personal Reports Parity Verification
const reportsScreenPath = path.resolve(repoDir, 'mobile/app/features/reports.tsx');
const reportsContent = readFileSync(reportsScreenPath, 'utf8');
assert.ok(reportsContent.includes('API_CONFIG.ENDPOINTS.REPORTS.ME'), 'ReportsScreen must use verified REPORTS.ME');
assert.ok(matrixDoc.includes('MOB-01 / E4N-134'), 'Matrix doc must cite MOB-01 completion');

console.log('🎉 PAR-01 / E4N-115 PASS: Web and Mobile Capability, Navigation & Role Matrix audit completed successfully.');
