import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";
import { RescheduleUserPledgeRequest, SaveUserPledgesRequest, UserPledge } from "../types";

// Simple in-memory store: userId -> list
const userIdToPledges = new Map<string, UserPledge[]>();

// File persistence
const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "user-pledges.json");

async function ensureDataFile(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(DATA_FILE).catch(async () => {
      await fs.writeFile(DATA_FILE, JSON.stringify({}), "utf-8");
    });
  } catch {}
}

async function loadFromFile(): Promise<void> {
  try {
    await ensureDataFile();
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    const json = raw ? (JSON.parse(raw) as Record<string, UserPledge[]>) : {};
    userIdToPledges.clear();
    Object.keys(json).forEach((userId) => {
      userIdToPledges.set(userId, json[userId] || []);
    });
  } catch {
    // ignore malformed file
  }
}

async function saveToFile(): Promise<void> {
  try {
    await ensureDataFile();
    const obj: Record<string, UserPledge[]> = {};
    for (const [userId, list] of userIdToPledges.entries()) {
      obj[userId] = list;
    }
    await fs.writeFile(DATA_FILE, JSON.stringify(obj, null, 2), "utf-8");
  } catch {
    // ignore write errors in this simple implementation
  }
}

// Initialize from file on module load
void loadFromFile();

export class UserPledgesService {
  static list(userId: string): UserPledge[] {
    return userIdToPledges.get(userId) ?? [];
  }

  static save(batch: SaveUserPledgesRequest): UserPledge[] {
    const current = userIdToPledges.get(batch.userId) ?? [];
    const existingIds = new Set(current.map((p) => p.pledgeId));
    const now = new Date().toISOString();
    const added: UserPledge[] = batch.pledges
      .filter((p) => !existingIds.has(p.pledgeId))
      .map((p) => ({
        id: randomUUID(),
        userId: batch.userId,
        pledgeId: p.pledgeId,
        reminderType: p.reminderType,
        customDate: p.customDate,
        dateAdded: now,
      }));
    const updated = [...current, ...added];
    userIdToPledges.set(batch.userId, updated);
    void saveToFile();
    return added;
  }

  static reschedule(
    userId: string,
    recordId: string,
    body: RescheduleUserPledgeRequest,
  ): UserPledge | null {
    const current = userIdToPledges.get(userId) ?? [];
    const idx = current.findIndex((p) => p.id === recordId);
    if (idx === -1) return null;
    const next: UserPledge = {
      ...current[idx],
      reminderType: body.reminderType ?? current[idx].reminderType,
      customDate: body.customDate ?? current[idx].customDate,
    };
    current[idx] = next;
    userIdToPledges.set(userId, current);
    void saveToFile();
    return next;
  }

  static remove(userId: string, recordId: string): boolean {
    const current = userIdToPledges.get(userId) ?? [];
    const next = current.filter((p) => p.id !== recordId);
    userIdToPledges.set(userId, next);
    void saveToFile();
    return next.length !== current.length;
  }
}
