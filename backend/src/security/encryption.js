const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV recommended for GCM
const AUTH_TAG_LENGTH = 16; // 128-bit authentication tag

/**
 * Derive a 256-bit key using HKDF-SHA256 from master key and salt/user Context
 */
function deriveUserKey(userSalt = '') {
  const masterKey = process.env.MASTER_ENCRYPTION_KEY || 'default_master_vault_key_fallback_32bytes_long!';
  return crypto.pbkdf2Sync(masterKey, userSalt, 100000, 32, 'sha256');
}

/**
 * Encrypt a text string using AES-256-GCM
 * @returns {string} ivHex:authTagHex:encryptedHex
 */
function encryptText(text, userSalt = '') {
  if (!text) return '';
  const key = deriveUserKey(userSalt);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt an encrypted text string using AES-256-GCM
 */
function decryptText(encryptedString, userSalt = '') {
  if (!encryptedString) return '';
  const parts = encryptedString.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted payload format');
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const key = deriveUserKey(userSalt);
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Encrypt a binary Buffer (for file storage) using AES-256-GCM
 * @returns {{ encryptedBuffer: Buffer, ivHex: string, authTagHex: string }}
 */
function encryptBuffer(buffer, userSalt = '') {
  const key = deriveUserKey(userSalt);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encryptedBuffer = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    encryptedBuffer,
    ivHex: iv.toString('hex'),
    authTagHex: authTag.toString('hex'),
  };
}

/**
 * Decrypt a binary Buffer using AES-256-GCM
 */
function decryptBuffer(encryptedBuffer, ivHex, authTagHex, userSalt = '') {
  const key = deriveUserKey(userSalt);
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
}

/**
 * Generate cryptographically strong random salt or strings
 */
function generateSalt(bytes = 16) {
  return crypto.randomBytes(bytes).toString('hex');
}

module.exports = {
  encryptText,
  decryptText,
  encryptBuffer,
  decryptBuffer,
  generateSalt,
  deriveUserKey,
};
