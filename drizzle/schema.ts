import { index, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const appRoles = ["user", "reporter", "verifier", "city_desk", "national_desk", "admin"] as const;
export const reportStatuses = ["submitted", "under_review", "corroborated", "rejected", "escalated"] as const;
export const incidentTypes = ["smoke_haze", "industrial_emissions", "agricultural_burning", "sensor_reading"] as const;
export const alertStatuses = ["draft", "awaiting_approval", "dispatched", "closed"] as const;
export const alertSeverities = ["watch", "elevated", "high", "critical"] as const;

export type AppRole = (typeof appRoles)[number];

/** Manus OAuth identities with the minimum role needed for protected operational actions. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", appRoles).default("reporter").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/** Privacy-aware citizen or field-worker evidence; binary attachment data remains in object storage. */
export const evidenceReports = mysqlTable("evidence_reports", {
  id: int("id").autoincrement().primaryKey(),
  reporterId: int("reporterId").notNull().references(() => users.id),
  city: varchar("city", { length: 120 }).notNull(),
  countryCode: varchar("countryCode", { length: 2 }).notNull(),
  incidentType: mysqlEnum("incidentType", incidentTypes).notNull(),
  description: text("description").notNull(),
  observedAt: timestamp("observedAt").notNull(),
  consentProvided: int("consentProvided").notNull().default(0),
  attachmentKey: text("attachmentKey"),
  attachmentUrl: text("attachmentUrl"),
  attachmentMimeType: varchar("attachmentMimeType", { length: 100 }),
  verificationStatus: mysqlEnum("verificationStatus", reportStatuses).default("submitted").notNull(),
  reviewNote: text("reviewNote"),
  reviewedBy: int("reviewedBy").references(() => users.id),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  index("evidence_reporter_idx").on(table.reporterId),
  index("evidence_status_idx").on(table.verificationStatus),
  index("evidence_city_idx").on(table.city),
]);

/** A reviewable authority briefing that can only be dispatched after an explicit approval action. */
export const climateAlerts = mysqlTable("climate_alerts", {
  id: int("id").autoincrement().primaryKey(),
  evidenceReportId: int("evidenceReportId").references(() => evidenceReports.id),
  createdBy: int("createdBy").notNull().references(() => users.id),
  city: varchar("city", { length: 120 }).notNull(),
  countryCode: varchar("countryCode", { length: 2 }).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  body: text("body").notNull(),
  severity: mysqlEnum("severity", alertSeverities).notNull(),
  status: mysqlEnum("status", alertStatuses).default("draft").notNull(),
  recipients: text("recipients").notNull(),
  deliveryChannel: mysqlEnum("deliveryChannel", ["owner_notification", "webhook_pending", "manual"]).default("owner_notification").notNull(),
  approvedBy: int("approvedBy").references(() => users.id),
  approvedAt: timestamp("approvedAt"),
  dispatchedAt: timestamp("dispatchedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  index("alert_status_idx").on(table.status),
  index("alert_city_idx").on(table.city),
]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type EvidenceReport = typeof evidenceReports.$inferSelect;
export type InsertEvidenceReport = typeof evidenceReports.$inferInsert;
export type ClimateAlert = typeof climateAlerts.$inferSelect;
export type InsertClimateAlert = typeof climateAlerts.$inferInsert;
