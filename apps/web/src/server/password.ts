import crypto from "node:crypto";

export async function verifyPassword(password: string, storedHash: string) {
  const [algorithm, cost, blockSize, parallelization, salt, expectedHex] = storedHash.split("$");
  if (algorithm !== "scrypt" || !cost || !blockSize || !parallelization || !salt || !expectedHex) return false;
  const actual = await new Promise<Buffer>((resolve, reject) => crypto.scrypt(password, salt, expectedHex.length / 2, {
    N: Number(cost),
    r: Number(blockSize),
    p: Number(parallelization),
  }, (error, derivedKey) => error ? reject(error) : resolve(derivedKey)));
  const expected = Buffer.from(expectedHex, "hex");
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}
