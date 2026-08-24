import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  climateAlerts,
  evidenceReports,
  InsertClimateAlert,
  InsertEvidenceReport,
  InsertUser,
  type AppRole,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let database: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!database && process.env.DATABASE_URL) {
    try {
      database = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      database = null;
    }
  }
  return database;
}

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("The operational database is not available.");
  return db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId, lastSignedIn: user.lastSignedIn ?? new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: values.lastSignedIn };
  (["name", "email", "loginMethod"] as const).forEach(field => {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  });
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function updateUserRole(userId: number, role: AppRole) {
  const db = await requireDb();
  await db.update(users).set({ role }).where(eq(users.id, userId));
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result[0];
}

export async function createEvidenceReport(input: InsertEvidenceReport) {
  const db = await requireDb();
  const result = await db.insert(evidenceReports).values(input);
  const id = Number((result as unknown as Array<{ insertId: number }>)[0]?.insertId);
  const report = await getEvidenceReport(id);
  if (!report) throw new Error("Evidence report was not found after creation.");
  return report;
}

export async function getEvidenceReport(id: number) {
  const db = await requireDb();
  const result = await db.select().from(evidenceReports).where(eq(evidenceReports.id, id)).limit(1);
  return result[0];
}

export async function listEvidenceForUser(reporterId: number) {
  const db = await requireDb();
  return db.select().from(evidenceReports).where(eq(evidenceReports.reporterId, reporterId)).orderBy(desc(evidenceReports.createdAt));
}

export async function listEvidenceForReview() {
  const db = await requireDb();
  return db.select().from(evidenceReports).orderBy(desc(evidenceReports.createdAt));
}

export async function reviewEvidenceReport(id: number, reviewerId: number, verificationStatus: "under_review" | "corroborated" | "rejected", reviewNote: string) {
  const db = await requireDb();
  await db.update(evidenceReports).set({ verificationStatus, reviewNote, reviewedBy: reviewerId, reviewedAt: new Date() }).where(eq(evidenceReports.id, id));
  return getEvidenceReport(id);
}

export async function createClimateAlert(input: InsertClimateAlert) {
  const db = await requireDb();
  const result = await db.insert(climateAlerts).values(input);
  const id = Number((result as unknown as Array<{ insertId: number }>)[0]?.insertId);
  const alert = await getClimateAlert(id);
  if (!alert) throw new Error("Climate alert was not found after creation.");
  return alert;
}

export async function getClimateAlert(id: number) {
  const db = await requireDb();
  const result = await db.select().from(climateAlerts).where(eq(climateAlerts.id, id)).limit(1);
  return result[0];
}

export async function listClimateAlertsForReview() {
  const db = await requireDb();
  return db.select().from(climateAlerts).orderBy(desc(climateAlerts.createdAt));
}

export async function dispatchClimateAlert(id: number, approverId: number) {
  const db = await requireDb();
  await db.update(climateAlerts).set({ status: "dispatched", approvedBy: approverId, approvedAt: new Date(), dispatchedAt: new Date() }).where(eq(climateAlerts.id, id));
  return getClimateAlert(id);
}
