const { send } = require('micro');
const { promisify } = require('util');
const { randomBytes, randomInt } = require('crypto');

const randomBytesAsync = promisify(randomBytes);
const randomIntAsync = promisify(randomInt);

const MAX_LENGTH = 1024; // Maximum allowed length
const DEFAULT_LENGTH = 32; // Default length if not specified
const MIN_LENGTH = 8; // Minimum allowed length for security

module.exports = async (req, res) => {
  let length = parseInt(req.query && req.query.length);

  // Validate and sanitize input
  if (isNaN(length) || length < MIN_LENGTH) {
    length = DEFAULT_LENGTH;
  } else if (length > MAX_LENGTH) {
    length = MAX_LENGTH;
  }

  try {
    const randomString = await generateSecureRandomString(length);
    send(res, 200, randomString);
  } catch (error) {
    console.error('Error generating random string:', error);
    send(res, 500, 'Internal Server Error');
  }
};

async function generateSecureRandomString(length) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  const randomValues = await randomBytesAsync(length);

  for (let i = 0; i < length; i++) {
    result += charset[randomValues[i] % charset.length];
  }

  // Ensure at least one lowercase, one uppercase, and one digit
  const categories = [
    { regex: /[a-z]/, chars: 'abcdefghijklmnopqrstuvwxyz' },
    { regex: /[A-Z]/, chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' },
    { regex: /[0-9]/, chars: '0123456789' }
  ];

  for (const category of categories) {
    if (!category.regex.test(result)) {
      const pos = await randomIntAsync(0, length);
      const randomChar = category.chars[await randomIntAsync(0, category.chars.length)];
      result = result.substring(0, pos) + randomChar + result.substring(pos + 1);
    }
  }

  return result;
}