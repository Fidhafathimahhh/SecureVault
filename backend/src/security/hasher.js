const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12;

/**
 * Hash password using bcrypt with high salt rounds
 */
async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify plaintext password against hash
 */
async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

module.exports = {
  hashPassword,
  verifyPassword,
};
