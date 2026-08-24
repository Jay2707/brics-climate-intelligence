import { TRPCError } from "@trpc/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { alertSeverities, appRoles, type AppRole } from "../../drizzle/schema";
import { hasOperationalPermission, type OperationalPermission } from "../authorization";
import {
  createClimateAlert,
  createEvidenceReport,
  dispatchClimateAlert,
  getClimateAlert,
  getEvidenceReport,
  listClimateAlertsForReview,
  listEvidenceForReview,
  listEvidenceForUser,
  reviewEvidenceReport,
  updateUserRole,
} from "../db";
import { validateEvidenceAttachment } from "../evidenceValidation";
import { notifyOwner } from "../_core/notification";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";

const roleProcedure = (permission: OperationalPermission) => protectedProcedure.use(({ ctx, next }) => {
  if (!hasOperationalPermission(ctx.user.role as AppRole, permission)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "This operational role is required for the requested action." });
  }
  return next({ ctx });
});

const reviewerProcedure = roleProcedure("review_evidence");
const dispatcherProcedure = roleProcedure("dispatch_alert");

const attachmentSchema = z.object({
  fileName: z.string().min(1).max(120),
  mimeType: z.string().min(1).max(100),
  dataBase64: z.string().min(1).max(7_000_000),
}).optional();

export const evidenceRouter = router({
  submit: protectedProcedure.input(z.object({
    city: z.string().trim().min(2).max(120),
    countryCode: z.enum(["BR", "RU", "IN", "CN", "ZA"]),
    incidentType: z.enum(["smoke_haze", "industrial_emissions", "agricultural_burning", "sensor_reading"]),
    description: z.string().trim().min(10).max(3_000),
    observedAt: z.number().int().positive(),
    consentProvided: z.literal(true),
    attachment: attachmentSchema,
  })).mutation(async ({ ctx, input }) => {
    let attachmentKey: string | undefined;
    let attachmentUrl: string | undefined;
    let attachmentMimeType: string | undefined;
    if (input.attachment) {
      const validation = validateEvidenceAttachment(input.attachment);
      if (!validation.valid) throw new TRPCError({ code: "BAD_REQUEST", message: validation.reason });
      const stored = await storagePut(`evidence/${ctx.user.id}/${randomUUID()}-${validation.safeFileName}`, validation.bytes, input.attachment.mimeType);
      attachmentKey = stored.key;
      attachmentUrl = stored.url;
      attachmentMimeType = input.attachment.mimeType;
    }
    return createEvidenceReport({
      reporterId: ctx.user.id,
      city: input.city,
      countryCode: input.countryCode,
      incidentType: input.incidentType,
      description: input.description,
      observedAt: new Date(input.observedAt),
      consentProvided: 1,
      attachmentKey,
      attachmentUrl,
      attachmentMimeType,
      verificationStatus: "submitted",
    });
  }),
  mine: protectedProcedure.query(({ ctx }) => listEvidenceForUser(ctx.user.id)),
  reviewQueue: reviewerProcedure.query(() => listEvidenceForReview()),
  review: reviewerProcedure.input(z.object({
    reportId: z.number().int().positive(),
    verificationStatus: z.enum(["under_review", "corroborated", "rejected"]),
    reviewNote: z.string().trim().min(4).max(1_000),
  })).mutation(async ({ ctx, input }) => {
    const report = await reviewEvidenceReport(input.reportId, ctx.user.id, input.verificationStatus, input.reviewNote);
    if (!report) throw new TRPCError({ code: "NOT_FOUND", message: "Evidence report not found." });
    return report;
  }),
});

export const alertsRouter = router({
  reviewQueue: reviewerProcedure.query(() => listClimateAlertsForReview()),
  createFromEvidence: reviewerProcedure.input(z.object({
    evidenceReportId: z.number().int().positive(),
    severity: z.enum(alertSeverities),
    recipientDesks: z.array(z.string().trim().min(2).max(120)).min(1).max(12),
    title: z.string().trim().min(8).max(180).optional(),
    body: z.string().trim().min(10).max(3_000).optional(),
  })).mutation(async ({ ctx, input }) => {
    const report = await getEvidenceReport(input.evidenceReportId);
    if (!report) throw new TRPCError({ code: "NOT_FOUND", message: "Evidence report not found." });
    if (report.verificationStatus !== "corroborated") {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Only corroborated evidence can be formed into an alert briefing." });
    }
    return createClimateAlert({
      evidenceReportId: report.id,
      createdBy: ctx.user.id,
      city: report.city,
      countryCode: report.countryCode,
      title: input.title ?? `${report.city}: reviewed ${report.incidentType.replaceAll("_", " ")} signal`,
      body: input.body ?? report.description,
      severity: input.severity,
      status: "awaiting_approval",
      recipients: JSON.stringify(input.recipientDesks),
      deliveryChannel: "owner_notification",
    });
  }),
  dispatch: dispatcherProcedure.input(z.object({ alertId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const alert = await getClimateAlert(input.alertId);
    if (!alert) throw new TRPCError({ code: "NOT_FOUND", message: "Alert briefing not found." });
    if (alert.status !== "awaiting_approval") {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Only an approval-ready briefing can be dispatched." });
    }
    const dispatched = await dispatchClimateAlert(alert.id, ctx.user.id);
    const ownerNotified = await notifyOwner({
      title: `Climate alert dispatched: ${alert.city}`,
      content: `${alert.severity.toUpperCase()} · ${alert.title}. Human approval recorded; recipient desks: ${alert.recipients}.`,
    });
    return { alert: dispatched, ownerNotified };
  }),
});

export const accessRouter = router({
  assignRole: adminProcedure.input(z.object({ userId: z.number().int().positive(), role: z.enum(appRoles) })).mutation(async ({ input }) => {
    const user = await updateUserRole(input.userId, input.role);
    if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
    return user;
  }),
});
