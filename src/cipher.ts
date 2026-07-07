import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";

const KEY_LENGTH = 32; // 256 bits
const ITERATIONS = 65536;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const TAG_LENGTH = 16; // 128 bits

function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(
    password,
    salt,
    ITERATIONS,
    KEY_LENGTH,
    "sha256"
  );
}

export function encrypt(
  plainText: string,
  password: string
): string {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);

  const key = deriveKey(password, salt);

  const cipher = crypto.createCipheriv(
    ALGORITHM,
    key,
    iv
  );

  const encrypted = Buffer.concat([
    cipher.update(
      Buffer.from(plainText, "utf8")
    ),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  /**
   * Formato:
   * [salt][iv][authTag][encryptedData]
   */
  const result = Buffer.concat([
    salt,
    iv,
    authTag,
    encrypted,
  ]);

  return result.toString("base64");
}


export function decrypt(
  encryptedText: string,
  password: string
): string {
  const data = Buffer.from(
    encryptedText,
    "base64"
  );

  let offset = 0;

  const salt = data.subarray(
    offset,
    offset + SALT_LENGTH
  );

  offset += SALT_LENGTH;

  const iv = data.subarray(
    offset,
    offset + IV_LENGTH
  );

  offset += IV_LENGTH;

  const authTag = data.subarray(
    offset,
    offset + TAG_LENGTH
  );

  offset += TAG_LENGTH;

  const encrypted = data.subarray(offset);

  const key = deriveKey(password, salt);

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    iv
  );

  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
