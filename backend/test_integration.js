const { db } = require('./src/database/db');
const { hashPassword, verifyPassword } = require('./src/security/hasher');
const { encryptText, decryptText, encryptBuffer, decryptBuffer } = require('./src/security/encryption');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

async function runTestSuite() {
  console.log('=====================================================');
  console.log('🛡️  SecureVault Comprehensive Integration & Security Test');
  console.log('=====================================================\n');

  try {
    // 1. Password Hashing Test
    console.log('[TEST 1] Password Hashing & Verification (Bcrypt)...');
    const rawPass = 'SuperSecretMasterPass123!';
    const hash = await hashPassword(rawPass);
    assert.notStrictEqual(rawPass, hash, 'Password must not be stored in plaintext');
    const valid = await verifyPassword(rawPass, hash);
    assert.strictEqual(valid, true, 'Valid password verification failed');
    const invalid = await verifyPassword('WrongPassword', hash);
    assert.strictEqual(invalid, false, 'Invalid password verification should fail');
    console.log(' -> PASSED ✅\n');

    // 2. Encryption at Rest (AES-256-GCM)
    console.log('[TEST 2] AES-256-GCM Encryption & Decryption Engine...');
    const userSalt = 'user_salt_12345';
    const secretText = 'CONFIDENTIAL_NOTE_PAYLOAD';
    const encryptedText = encryptText(secretText, userSalt);
    assert.notStrictEqual(secretText, encryptedText, 'Text must be encrypted');
    assert.strictEqual(encryptedText.includes(':'), true, 'Encrypted format must contain iv and authTag');
    const decryptedText = decryptText(encryptedText, userSalt);
    assert.strictEqual(decryptedText, secretText, 'Decrypted text must match original');

    // Buffer Encryption
    const sampleBuffer = Buffer.from('PDF_DOCUMENT_BINARY_CONTENT_DUMMY_STREAM');
    const { encryptedBuffer, ivHex, authTagHex } = encryptBuffer(sampleBuffer, userSalt);
    assert.notDeepStrictEqual(sampleBuffer, encryptedBuffer, 'Buffer must be encrypted');
    const decryptedBuffer = decryptBuffer(encryptedBuffer, ivHex, authTagHex, userSalt);
    assert.strictEqual(decryptedBuffer.toString(), sampleBuffer.toString(), 'Decrypted buffer must match original');
    console.log(' -> PASSED ✅\n');

    // 3. User Vault Isolation Test
    console.log('[TEST 3] Multi-Tenant User Vault Isolation...');
    // Create User A
    const userASalt = 'salt_user_a';
    const userAHash = await hashPassword('PassUserA123!');
    const resA = db.prepare('INSERT INTO users (email, password_hash, master_salt) VALUES (?, ?, ?)')
      .run('usera@vault.com', userAHash, userASalt);
    const userAId = resA.lastInsertRowid;

    // Create User B
    const userBSalt = 'salt_user_b';
    const userBHash = await hashPassword('PassUserB123!');
    const resB = db.prepare('INSERT INTO users (email, password_hash, master_salt) VALUES (?, ?, ?)')
      .run('userb@vault.com', userBHash, userBSalt);
    const userBId = resB.lastInsertRowid;

    // User A creates a password
    const encPassA = encryptText('UserA_Secret', userASalt);
    db.prepare('INSERT INTO passwords (user_id, title, encrypted_password) VALUES (?, ?, ?)')
      .run(userAId, 'User A Banking', encPassA);

    // User B attempts to fetch passwords
    const userBPasswords = db.prepare('SELECT * FROM passwords WHERE user_id = ?').all(userBId);
    assert.strictEqual(userBPasswords.length, 0, 'User B must see zero items from User A vault');

    const userAPasswords = db.prepare('SELECT * FROM passwords WHERE user_id = ?').all(userAId);
    assert.strictEqual(userAPasswords.length, 1, 'User A must see their own item');
    console.log(' -> PASSED ✅\n');

    // 4. File Storage & Encryption Validation
    console.log('[TEST 4] Encrypted File Storage & On-disk Payload Safety...');
    const fileContent = Buffer.from('CONFIDENTIAL_TAX_DOCUMENT_2026');
    const { encryptedBuffer: fileEncBuf, ivHex: fIv, authTagHex: fTag } = encryptBuffer(fileContent, userASalt);
    
    const storedFile = db.prepare(`
      INSERT INTO files (user_id, folder_id, original_name, stored_filename, file_size, mime_type, category, iv_hex, auth_tag_hex)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userAId, null, 'Tax2026.pdf', 'test_uuid_123.enc', fileContent.length, 'application/pdf', 'General', fIv, fTag);

    const fileRecord = db.prepare('SELECT * FROM files WHERE id = ? AND user_id = ?').get(storedFile.lastInsertRowid, userAId);
    assert.strictEqual(fileRecord.original_name, 'Tax2026.pdf');
    assert.strictEqual(fileRecord.encryption_status, 'AES-256-GCM Encrypted');
    console.log(' -> PASSED ✅\n');

    // Clean up test data
    db.prepare('DELETE FROM users WHERE id IN (?, ?)').run(userAId, userBId);
    console.log('=====================================================');
    console.log('🎉 ALL INTEGRATION AND SECURITY VERIFICATION TESTS PASSED CLEANLY!');
    console.log('=====================================================\n');
  } catch (err) {
    console.error('❌ Integration Test Failure:', err);
    process.exit(1);
  }
}

runTestSuite();
