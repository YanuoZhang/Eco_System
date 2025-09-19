import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

type PasswordRecord = {
  salt: string;
  hash: string;
  updatedAt: string;
};

const DATA_DIR = join(process.cwd(), "data");
const AUTH_FILE = join(DATA_DIR, "site-auth.json");
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24h

function ensureStorageInitialized(): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(AUTH_FILE)) {
    const pwd = process.env.SITE_PASSWORD || "Ecopath@123";
    const salt = randomBytes(16).toString("hex");
    const hash = scryptSync(pwd, salt, 64).toString("hex");
    const rec: PasswordRecord = { salt, hash, updatedAt: new Date().toISOString() };
    writeFileSync(AUTH_FILE, JSON.stringify(rec, null, 2), { encoding: "utf-8" });
  }
}

export function readPasswordRecord(): PasswordRecord {
  ensureStorageInitialized();
  const raw = readFileSync(AUTH_FILE, "utf-8");
  return JSON.parse(raw) as PasswordRecord;
}

export function verifyPassword(password: string): boolean {
  const rec = readPasswordRecord();
  const calc = scryptSync(password, rec.salt, 64).toString("hex");
  return timingSafeEqual(Buffer.from(calc, "hex"), Buffer.from(rec.hash, "hex"));
}

export function updatePassword(newPassword: string): void {
  ensureStorageInitialized();
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(newPassword, salt, 64).toString("hex");
  const rec: PasswordRecord = { salt, hash, updatedAt: new Date().toISOString() };
  writeFileSync(AUTH_FILE, JSON.stringify(rec, null, 2), { encoding: "utf-8" });
}

function getTokenSecret(): string {
  const secret =
    process.env.SITE_AUTH_SECRET || process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET;
  return secret || "dev-secret";
}

export function generateAuthToken(subject: string): string {
  const issuedAt = Date.now();
  const expiresAt = issuedAt + TOKEN_TTL_MS;
  const payload = `${subject}.${issuedAt}.${expiresAt}`;
  const sig = createHmac("sha256", getTokenSecret()).update(payload).digest("hex");
  const token = Buffer.from(`${payload}.${sig}`).toString("base64url");
  return token;
}

export function verifyAuthToken(token: string | undefined): boolean {
  if (!token) return false;
  try {
    const raw = Buffer.from(token, "base64url").toString("utf-8");
    const parts = raw.split(".");
    if (parts.length !== 4) return false;
    const [subject, issuedAtStr, expiresAtStr, sig] = parts;
    if (!subject || !issuedAtStr || !expiresAtStr || !sig) return false;
    const payload = `${subject}.${issuedAtStr}.${expiresAtStr}`;
    const calc = createHmac("sha256", getTokenSecret()).update(payload).digest("hex");
    if (!timingSafeEqual(Buffer.from(calc), Buffer.from(sig))) return false;
    const now = Date.now();
    const exp = Number(expiresAtStr);
    return Number.isFinite(exp) && now < exp;
  } catch {
    return false;
  }
}
