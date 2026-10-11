import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import jwt from 'jsonwebtoken';
import {
  getJwtSecret,
  getJwtSecretPrevious,
  signJwt,
  verifyJwt,
  validateSecurityConfig,
  SecurityConfigurationError,
  DISALLOWED_JWT_SECRETS,
} from '../src/config/security.js';

const serverDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function main() {
  console.log('--- Testing SEC-02: JWT & Database Configuration Security ---');

  // 1. Fail-fast validation in Production
  // 1.1 Missing JWT_SECRET in production
  assert.throws(
    () => getJwtSecret({ NODE_ENV: 'production', JWT_SECRET: '' }),
    err => err instanceof SecurityConfigurationError && err.code === 'MISSING_JWT_SECRET',
    'Production must reject missing JWT_SECRET'
  );

  assert.throws(
    () => getJwtSecret({ NODE_ENV: 'production' }),
    err => err instanceof SecurityConfigurationError && err.code === 'MISSING_JWT_SECRET',
    'Production must reject undefined JWT_SECRET'
  );

  // 1.2 Insecure short JWT_SECRET in production (<32 chars)
  assert.throws(
    () => getJwtSecret({ NODE_ENV: 'production', JWT_SECRET: 'short_secret_under_32_chars' }),
    err => err instanceof SecurityConfigurationError && err.code === 'INSUFFICIENT_SECRET_LENGTH',
    'Production must reject JWT_SECRET shorter than 32 characters'
  );

  // 1.3 Disallowed repository default secrets
  for (const weakSecret of DISALLOWED_JWT_SECRETS) {
    assert.throws(
      () => getJwtSecret({ NODE_ENV: 'production', JWT_SECRET: weakSecret }),
      err => err instanceof SecurityConfigurationError,
      `Production must reject known weak secret: ${weakSecret}`
    );
  }

  // 1.4 Valid 32+ char production secret succeeds
  const validProductionSecret = 'e4n_prod_secure_random_key_9f8b7c6d5e4a3b2c1d0e_2026';
  assert.equal(
    getJwtSecret({ NODE_ENV: 'production', JWT_SECRET: validProductionSecret }),
    validProductionSecret,
    'Valid production secret must be accepted'
  );

  // 2. Development / Test environment fallbacks
  // Unset JWT_SECRET in non-production returns fallback without throwing
  const devFallback = getJwtSecret({ NODE_ENV: 'development' });
  assert.equal(typeof devFallback, 'string');
  assert(devFallback.length >= 32, 'Dev fallback must be at least 32 characters');

  // Explicit test secret in test environment
  const testFixtureSecret = 'test_isolated_secret_key_1234567890';
  assert.equal(
    getJwtSecret({ NODE_ENV: 'test', JWT_SECRET: testFixtureSecret }),
    testFixtureSecret,
    'Test environment must honor provided JWT_SECRET'
  );

  // 3. JWT Signing, Verification, and Tamper Resistance
  const testEnv = { NODE_ENV: 'test', JWT_SECRET: 'isolated_secret_fixture_for_jwt_verification_tests_32c' };
  const payload = { id: '00000000-0000-4000-8000-000000000001', role: 'MEMBER', email: 'user@example.invalid' };
  const token = signJwt(payload, { expiresIn: '1h' }, testEnv);
  assert.equal(typeof token, 'string');

  const verified = verifyJwt(token, {}, testEnv);
  assert.equal(verified.id, payload.id);
  assert.equal(verified.role, payload.role);

  // Token forged with wrong key fails
  assert.throws(
    () => verifyJwt(token, {}, { ...testEnv, JWT_SECRET: 'wrong_secret_key_for_tampering_test_32chars_long' }),
    err => err.name === 'JsonWebTokenError',
    'Token verified with wrong secret must throw JsonWebTokenError'
  );

  // Tampered payload fails
  const [headerB64, payloadB64, signatureB64] = token.split('.');
  const tamperedPayload = Buffer.from(JSON.stringify({ ...payload, role: 'ADMIN' })).toString('base64url');
  const tamperedToken = `${headerB64}.${tamperedPayload}.${signatureB64}`;
  assert.throws(
    () => verifyJwt(tamperedToken, {}, testEnv),
    err => err.name === 'JsonWebTokenError',
    'Tampered token must fail signature verification'
  );

  // 4. Zero-Downtime Secret Rotation Support
  const oldSecret = 'old_secret_fixture_key_during_rotation_period_32c';
  const newSecret = 'new_secret_fixture_key_after_rotation_period_32c';

  // Issue a token under the old secret
  const legacyActiveToken = jwt.sign(payload, oldSecret, { expiresIn: '1h' });

  // Rotate to new secret, with oldSecret in JWT_SECRET_PREVIOUS
  const rotationEnv = {
    NODE_ENV: 'test',
    JWT_SECRET: newSecret,
    JWT_SECRET_PREVIOUS: oldSecret,
  };

  // Old token MUST verify successfully via rotation fallback
  const verifiedLegacy = verifyJwt(legacyActiveToken, {}, rotationEnv);
  assert.equal(verifiedLegacy.id, payload.id, 'Token signed under previous secret must verify during rotation grace period');

  // New tokens are signed with new secret
  const freshToken = signJwt(payload, { expiresIn: '1h' }, rotationEnv);
  const verifiedFresh = verifyJwt(freshToken, {}, rotationEnv);
  assert.equal(verifiedFresh.id, payload.id);
  // Verify fresh token is signed with newSecret, NOT oldSecret
  assert.throws(
    () => jwt.verify(freshToken, oldSecret),
    err => err.name === 'JsonWebTokenError',
    'Fresh tokens must be signed with the primary secret only'
  );

  // Once grace period ends and JWT_SECRET_PREVIOUS is removed, old tokens are rejected
  const postRotationEnv = {
    NODE_ENV: 'test',
    JWT_SECRET: newSecret,
  };
  assert.throws(
    () => verifyJwt(legacyActiveToken, {}, postRotationEnv),
    err => err.name === 'JsonWebTokenError',
    'Old token must be rejected after rotation grace period ends'
  );

  // 5. Full Security Configuration Validation
  // 5.1 Production failure on missing DB config
  assert.throws(
    () => validateSecurityConfig({ NODE_ENV: 'production', JWT_SECRET: validProductionSecret }),
    err => err instanceof SecurityConfigurationError && err.code === 'MISSING_DB_CONFIG',
    'validateSecurityConfig must reject production when DB config is missing'
  );

  // 5.2 Production pass with DATABASE_URL
  const fullProdConfig = {
    NODE_ENV: 'production',
    JWT_SECRET: validProductionSecret,
    DATABASE_URL: 'postgresql://postgres:secret_pass@db.example.invalid:5432/postgres?sslmode=require',
    CRON_SECRET: 'isolated_cron_secret_with_at_least_32_characters_here',
  };
  const prodCheck = validateSecurityConfig(fullProdConfig);
  assert.equal(prodCheck.valid, true);
  assert.equal(prodCheck.isProduction, true);
  assert.equal(prodCheck.jwtConfigured, true);

  // 6. Static Repository Scan: Banning Hardcoded Secrets in Source Code
  const srcFiles = getAllFiles(path.join(serverDir, 'src'));
  const compromisedStrings = [
    '310acce7e62c4e9f16ce17a04d6cbdaf5a859926f896a8e85e1dcfa095378333b',
    'supersecretkey123',
  ];

  for (const file of srcFiles) {
    if (!file.endsWith('.js') && !file.endsWith('.ts')) continue;
    // Skip security.js where disallowed secrets are deliberately cataloged in the blacklist
    if (file.endsWith('security.js')) continue;

    const content = readFileSync(file, 'utf8');
    for (const badString of compromisedStrings) {
      assert(
        !content.includes(badString),
        `Source file ${path.relative(serverDir, file)} contains hardcoded secret: ${badString}`
      );
    }

    // Ensure no fallback assignments like "process.env.JWT_SECRET || 'hardcoded'"
    const fallbackMatch = content.match(/process\.env\.JWT_SECRET\s*\|\|\s*['"`]([^'"`]+)['"`]/);
    assert(
      !fallbackMatch,
      `Source file ${path.relative(serverDir, file)} has hardcoded fallback on JWT_SECRET: ${fallbackMatch?.[0]}`
    );
  }

  // 7. Example Config Sanitization Scan: Ensure .env.example contains no real credentials
  const exampleFiles = [
    path.join(serverDir, '.env.example'),
    path.join(serverDir, '../deploy/api/.env.example'),
  ];
  for (const exFile of exampleFiles) {
    const exContent = readFileSync(exFile, 'utf8');
    assert(!exContent.includes('supersecretkey123'), `${exFile} must not contain supersecretkey123`);
    assert(!exContent.includes('6d4a7e9374a76c15260fcc75e315b0b9'), `${exFile} must not contain real Sipay app id`);
    assert(!exContent.includes('b46a67571aa1e7ef5641dc3fa6f1712a'), `${exFile} must not contain real Sipay app secret`);
    assert(!exContent.includes('$2y$10$HmRgYosneqcwHj'), `${exFile} must not contain real Sipay merchant key hash`);
  }

  console.log('SEC-02 PASS: All checks completed successfully.');
  console.log('  - Production fail-fast on missing/short/default JWT_SECRET verified.');
  console.log('  - Zero-downtime rotation with JWT_SECRET_PREVIOUS verified.');
  console.log('  - Database connection validation verified.');
  console.log('  - Static source scan (0 hardcoded secrets) verified.');
  console.log('  - .env.example template sanitization verified.');
}

function getAllFiles(dir) {
  let results = [];
  const list = readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFiles(fullPath));
    } else {
      results.push(fullPath);
    }
  }
  return results;
}

main().catch(error => {
  console.error('SEC-02 Contract Failed:', error);
  process.exitCode = 1;
});
