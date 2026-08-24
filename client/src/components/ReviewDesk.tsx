/**
 * Operational reviewer desk — only rendered for roles permitted by the server-side tRPC gates.
 * Maintains the Monsoon Signal Room field-atlas language while exposing human approval states.
 */
import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight, BellRing, FileCheck2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

type ReviewDeskProps = { role: string };

const readable = (value: string) => value.replaceAll("_", " ");

function recipients(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.join(" · ") : value;
  } catch {
    return value;
  }
}

export function ReviewDesk({ role }: ReviewDeskProps) {
  const utils = trpc.useUtils();
  const [reviewNote, setReviewNote] = useState("Corroborated by an authorised review desk using available evidence.");
  const canDispatch = ["national_desk", "admin"].includes(role);
  const evidenceQuery = trpc.evidence.reviewQueue.useQuery(undefined, { refetchOnWindowFocus: false });
  const alertsQuery = trpc.alerts.reviewQueue.useQuery(undefined, { refetchOnWindowFocus: false });
  const reviewEvidence = trpc.evidence.review.useMutation({
    onSuccess: () => void utils.evidence.reviewQueue.invalidate(),
  });
  const createAlert = trpc.alerts.createFromEvidence.useMutation({
    onSuccess: () => { void utils.evidence.reviewQueue.invalidate(); void utils.alerts.reviewQueue.invalidate(); },
  });
  const dispatchAlert = trpc.alerts.dispatch.useMutation({
    onSuccess: () => void utils.alerts.reviewQueue.invalidate(),
  });

  const corroborate = async (reportId: number) => {
    try {
      await reviewEvidence.mutateAsync({ reportId, verificationStatus: "corroborated", reviewNote });
      toast("Evidence corroborated", { description: "It can now be formed into an approval-ready alert briefing." });
    } catch (error) {
      toast("Review action could not be completed", { description: error instanceof Error ? error.message : "Please try again." });
    }
  };

  const prepareAlert = async (reportId: number, city: string) => {
    try {
      await createAlert.mutateAsync({ evidenceReportId: reportId, severity: "elevated", recipientDesks: [`${city} city desk`, "National coordination desk"] });
      toast("Alert briefing drafted", { description: "The briefing is awaiting final authorised dispatch." });
    } catch (error) {
      toast("Alert draft could not be created", { description: error instanceof Error ? error.message : "Please try again." });
    }
  };

  const dispatch = async (alertId: number) => {
    try {
      const result = await dispatchAlert.mutateAsync({ alertId });
      toast("Alert dispatched", { description: result.ownerNotified ? "The project-owner notification was delivered." : "The alert was recorded; the owner notification is temporarily unavailable." });
    } catch (error) {
      toast("Dispatch could not be completed", { description: error instanceof Error ? error.message : "Please try again." });
    }
  };

  return (
    <section id="review-desk" className="border-t border-[#DCEAE2]/10 bg-[#092633] px-5 py-10 md:px-8 lg:px-10">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="flex items-center gap-2 text-[#A8E0CF]"><FileCheck2 className="h-4 w-4" /><span className="eyebrow">Protected review desk</span></div>
          <h2 className="mt-3 font-serif text-4xl tracking-[-.055em] text-[#F4F7F1]">Corroborate evidence before the corridor hears it.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#ADC2BD]">You are signed in as <span className="font-bold text-[#F2D47A]">{readable(role)}</span>. Every action below is role-gated and retained in the evidence or alert record.</p>
        </div>
        <div className="rounded-full border border-[#CDE1DA]/15 bg-[#0A2A38] px-4 py-2 text-xs text-[#B9D0C9]">{evidenceQuery.data?.length ?? 0} evidence items · {alertsQuery.data?.length ?? 0} alert briefs</div>
      </div>

      <label className="mt-6 block max-w-2xl"><span className="mb-2 block text-[10px] font-bold uppercase tracking-[.14em] text-[#8FAAA4]">Review note</span><textarea value={reviewNote} onChange={event => setReviewNote(event.target.value)} rows={2} className="field-input bg-[#F1F5EE]" /></label>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <div className="rounded-[24px] border border-[#DCEAE2]/12 bg-[#0A2937] p-5">
          <div className="flex items-center justify-between"><span className="eyebrow">Evidence queue</span><span className="text-xs text-[#9CB6B0]">Submitted → corroborated</span></div>
          <div className="mt-4 space-y-3">
            {evidenceQuery.isLoading ? <p className="text-sm text-[#AFC4BE]">Loading protected evidence…</p> : evidenceQuery.data?.length ? evidenceQuery.data.slice(0, 4).map(report => (
              <article key={report.id} className="rounded-2xl border border-[#DCEAE2]/10 bg-[#0C2E3C] p-4">
                <div className="flex items-start justify-between gap-3"><div><p className="font-serif text-xl tracking-[-.04em] text-[#F3F7F1]">{report.city}</p><p className="mt-1 text-xs text-[#9FB9B2]">{readable(report.incidentType)} · {new Date(report.observedAt).toLocaleString()}</p></div><span className="risk-badge border-[#A8E0CF]/30 bg-[#A8E0CF]/10 text-[#BCEADB]">{readable(report.verificationStatus)}</span></div>
                <p className="mt-3 text-sm leading-5 text-[#B6CBC5]">{report.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">{report.verificationStatus !== "corroborated" && <button disabled={reviewEvidence.isPending} onClick={() => void corroborate(report.id)} className="country-filter country-filter-active">Corroborate</button>}{report.verificationStatus === "corroborated" && <button disabled={createAlert.isPending} onClick={() => void prepareAlert(report.id, report.city)} className="country-filter country-filter-active">Prepare alert</button>}{report.attachmentUrl && <a href={report.attachmentUrl} target="_blank" rel="noreferrer" className="country-filter">Open evidence</a>}</div>
              </article>
            )) : <p className="text-sm text-[#AFC4BE]">No reports require review.</p>}
          </div>
        </div>

        <div className="rounded-[24px] border border-[#DCEAE2]/12 bg-[#0A2937] p-5">
          <div className="flex items-center justify-between"><span className="eyebrow">Alert approval</span><span className="text-xs text-[#9CB6B0]">Draft → dispatch</span></div>
          <div className="mt-4 space-y-3">
            {alertsQuery.isLoading ? <p className="text-sm text-[#AFC4BE]">Loading alert briefs…</p> : alertsQuery.data?.length ? alertsQuery.data.slice(0, 4).map(alert => (
              <article key={alert.id} className="rounded-2xl border border-[#DCEAE2]/10 bg-[#0C2E3C] p-4">
                <div className="flex items-start justify-between gap-3"><div><p className="font-serif text-xl tracking-[-.04em] text-[#F3F7F1]">{alert.title}</p><p className="mt-1 text-xs text-[#9FB9B2]">{alert.city} · {alert.severity} · {readable(alert.status)}</p></div><BellRing className="h-4 w-4 text-[#F2C85A]" /></div>
                <p className="mt-3 text-sm leading-5 text-[#B6CBC5]">{alert.body}</p><p className="mt-3 text-[10px] uppercase tracking-[.12em] text-[#8FAAA4]">Recipients: {recipients(alert.recipients)}</p>
                {canDispatch && alert.status === "awaiting_approval" && <button disabled={dispatchAlert.isPending} onClick={() => void dispatch(alert.id)} className="panel-action mt-4">Approve & dispatch <ArrowRight className="h-4 w-4" /></button>}
              </article>
            )) : <p className="text-sm text-[#AFC4BE]">No alert briefings are awaiting action.</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
