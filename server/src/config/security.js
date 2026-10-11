import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';

export const DISALLOWED_JWT_SECRETS = new Set([
  '310acce7e62c4e9f16ce17a04d6cbdaf5a859926f896a8e85e1dcfa095378333b',
  'supersecretkey123',
  'secret',
  'secretkey',
  'jwt_secret',
  'default_secret',
  'changeme',
  'your-secret-key',
  'your_strong_random_jwt_secret_min_32_characters',
  'password',
  '12345678',
]);

const DEV_FALLBACK_SECRET = 'e4n_dev_ephemeral_fallback_secret_not_for_production_use_min_32_chars';

export class SecurityConfigurationError extends Error {
  constructor(message, code = 'SECURITY_CONFIG_ERROR') {
    super(message);
    this.name = 'SecurityConfigurationError';
    this.code = code;
  }
}

/**
 * Validates and retrieves the active primary JWT signing secret.
 * Enforces strict length and uniqueness in production; allows development fallback only outside production.
 */
export function getJwtSecret(env = process.env) {
  const secret = env.JWT_SECRET;
  const isProduction = env.NODE_ENV === 'production';

  if (!secret || typeof secret !== 'string' || !secret.trim()) {
    if (isProduction) {
      throw new SecurityConfigurationError(
        'Missing JWT_SECRET in production. A secure, random secret (at least 32 characters) must be configured.',
        'MISSING_JWT_SECRET'
      );
    }
    return DEV_FALLBACK_SECRET;
  }

  const trimmed = secret.trim();

  if (isProduction) {
    if (trimmed.length < 32) {
      throw new SecurityConfigurationError(
        `JWT_SECRET is too short (${trimmed.length} chars). Production secret must be at least 32 characters.`,
        'INSUFFICIENT_SECRET_LENGTH'
      );
    }
    if (DISALLOWED_JWT_SECRETS.has(trimmed)) {
      throw new SecurityConfigurationError(
        'Disallowed or default JWT_SECRET detected in production. You must configure an independently generated secret.',
        'DISALLOWED_DEFAULT_SECRET'
      );
    }
  }

  return trimmed;
}

/**
 * Retrieves the optional secondary secret used during secret rotation grace periods.
 */
export function getJwtSecretPrevious(env = process.env) {
  const previous = env.JWT_SECRET_PREVIOUS;
  if (typeof previous === 'string' && previous.trim().length >= 32 && !DISALLOWED_JWT_SECRETS.has(previous.trim())) {
    return previous.trim();
  }
  return null;
}

/**
 * Signs a JWT token with the current primary secret.
 */
export function signJwt(payload, options = {}, env = process.env) {
  const secret = getJwtSecret(env);
  return jwt.sign(payload, secret, options);
}

/**
 * Verifies a JWT token. If primary verification fails and a previous secret is configured
 * (during secret rotation), attempts verification against the previous secret.
 */
export function verifyJwt(token, options = {}, env = process.env) {
  const primarySecret = getJwtSecret(env);
  try {
    return jwt.verify(token, primarySecret, options);
  } catch (primaryError) {
    const previousSecret = getJwtSecretPrevious(env);
    if (previousSecret && (primaryError.name === 'JsonWebTokenError' || primaryError.message === 'invalid signature')) {
      try {
        return jwt.verify(token, previousSecret, options);
      } catch {
        throw primaryError;
      }
    }
    throw primaryError;
  }
}

/**
 * Validates the full server environment security configuration.
 * Performs fail-fast checks on Database connection, JWT secrets, and Cron secrets.
 */
export function validateSecurityConfig(env = process.env) {
  const isProduction = env.NODE_ENV === 'production';
  const warnings = [];

  // 1. Validate JWT Secret
  const jwtSecret = getJwtSecret(env);
  if (!isProduction && jwtSecret === DEV_FALLBACK_SECRET) {
    warnings.push('JWT_SECRET is unset; using local development fallback secret.');
  }

  // 2. Validate Database Configuration
  const connectionString = env.DATABASE_URL || env.POSTGRES_URL;
  if (isProduction) {
    if (!connectionString) {
      if (!env.DB_HOST || !env.DB_USER || !env.DB_PASSWORD || !env.DB_NAME) {
        throw new SecurityConfigurationError(
          'Missing database connection settings in production (neither DATABASE_URL nor full DB_* parameters set).',
          'MISSING_DB_CONFIG'
        );
      }
      if (env.DB_HOST === 'localhost' || env.DB_HOST === '127.0.0.1') {
        warnings.push('Production DB_HOST is set to loopback address.');
      }
    }
  }

  // 3. Validate Cron Secret if configured
  if (typeof env.CRON_SECRET === 'string' && env.CRON_SECRET.length > 0) {
    if (env.CRON_SECRET.length < 32) {
      if (isProduction) {
        throw new SecurityConfigurationError(
          'CRON_SECRET must be at least 32 characters in production.',
          'INSUFFICIENT_CRON_SECRET_LENGTH'
        );
      }
      warnings.push('CRON_SECRET is shorter than recommended 32 characters.');
    }
  }

  return {
    valid: true,
    isProduction,
    jwtConfigured: jwtSecret !== DEV_FALLBACK_SECRET,
    rotationEnabled: Boolean(getJwtSecretPrevious(env)),
    warnings,
  };
}
