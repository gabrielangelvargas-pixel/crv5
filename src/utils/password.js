import crypto from 'node:crypto';

const KEY_LENGTH = 64;
const SCRYPT_COST = 16384;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELIZATION = 1;

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = await new Promise((resolve, reject) => crypto.scrypt(password, salt, KEY_LENGTH, {
    N: SCRYPT_COST,
    r: SCRYPT_BLOCK_SIZE,
    p: SCRYPT_PARALLELIZATION,
  }, (error, derivedKey) => error ? reject(error) : resolve(derivedKey))).then((derivedKey) => derivedKey.toString('hex'));

  return `scrypt$${SCRYPT_COST}$${SCRYPT_BLOCK_SIZE}$${SCRYPT_PARALLELIZATION}$${salt}$${hash}`;
}

export async function verifyPassword(password, storedHash) {
  const [algorithm, cost, blockSize, parallelization, salt, expectedHex] = storedHash.split('$');
  if (algorithm !== 'scrypt' || !cost || !blockSize || !parallelization || !salt || !expectedHex) return false;

  const actual = await new Promise((resolve, reject) => crypto.scrypt(password, salt, expectedHex.length / 2, {
    N: Number(cost),
    r: Number(blockSize),
    p: Number(parallelization),
  }, (error, derivedKey) => error ? reject(error) : resolve(derivedKey)));
  const expected = Buffer.from(expectedHex, 'hex');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}
