# Hackathon Demo Sequence

## Recommended 90-Second Flow

### 1. Frame the problem — 0:00–0:12

Open on the hero and say: “Major cities measure air quality at a macro level, but the event that harms a neighbourhood can begin as a local photo, a low-cost sensor reading, or a cross-border plume. This platform connects those signals before the impact reaches the next city.”

Point to the visible status row. Explain that the product separates **live public data**, **illustrative interface content**, and **human-reviewed evidence** rather than presenting every signal as equally certain.

### 2. Start with the signal field — 0:12–0:30

Click **Explore live signal field**, then select **New Delhi** or another visible city pin. Switch between **Now**, **+6h**, and **+24h** to show that the dashboard is not only displaying a map; it is exposing a time-aware corridor forecast. Point out the source label, confidence, AQI, and arrival window in the focus panel.

Use the country filter once to demonstrate that a geographic selection changes the active city context rather than acting as a decorative control.

### 3. Open the live dossier — 0:30–0:48

Click **Open city dossier**. Show the current PM2.5, PM10, NO₂, wind, cloud cover, timestamp, and operational readout. Switch between the **NO₂** and **Aerosol** Sentinel-5P layers. Say: “Provider credentials stay on the server; the browser receives only the protected rendered layer and its timestamp.”

If the satellite provider is temporarily unavailable, use the visible fallback text and explain that weather and monitoring data remain separate from the satellite layer rather than silently appearing fresh.

### 4. Show the evidence bridge — 0:48–1:02

Close the dossier and click **Contribute local evidence**. Explain that a citizen report is consented and stored as evidence, not published as a fact. Show the city, incident type, description, observation time, and optional attachment fields. Do not submit fabricated evidence during the demo.

### 5. Explain federation — 1:02–1:14

Use the **90-second proof** rail. Click **Observe**, **Detect**, **Forecast**, and **Coordinate** in order. The rail communicates the product’s differentiator: raw sensitive evidence can stay with the originating partner while models exchange predictions, confidence, and response needs.

### 6. Show human review and alert governance — 1:14–1:30

If an authorised reviewer account is available, sign in and click **Open review workflow**. Corroborate a real permitted report, prepare an alert brief, and show that dispatch remains approval-gated for a national desk or administrator. If no reviewer account is available, use the visible “Human review required” state and explain why automatic escalation is intentionally not enabled.

## Closing Line

“BRICS Climate Intelligence turns fragmented local observations into a shared, explainable, and human-governed early-warning loop: observe locally, detect regionally, forecast across corridors, and coordinate before the smoke arrives.”

## Demo Safety Notes

Use only live provider responses, pre-approved test accounts, and consented evidence. Do not create fake citizen reports, fake endorsements, or fabricated performance claims. If a live provider is degraded, say so explicitly and continue with the stored product workflow rather than calling the fallback data live.

## Judge Signals to Emphasise

The strongest differentiators are the **evidence-to-action loop**, **server-protected satellite integration**, **time-horizon interaction**, **role-gated human review**, and **federation-ready separation of raw evidence from shared model outputs**.

## Suggested Backup Path

If authentication or an external provider fails during the presentation, use the public signal field, open a city dossier, show the fallback state, open the consented evidence form without submitting, and walk through the four-step proof rail. This still demonstrates the architecture without pretending a degraded provider is live.

## Project References

The live integration requirements and provider credentials are documented in `docs/PRODUCTION_INTEGRATION_PLAYBOOK.md` and `INTEGRATION_GUIDE.md`.

The existing visual reference package remains separate at `/home/ubuntu/farminerals-prompt/Farm minerals` and is not merged into the production BRICS source tree.

The current dashboard refresh metric is five minutes, matching the server-side public-feed cache and the visible source notes.

## Completion Criteria

The team should be able to complete this path in under ninety seconds, explain each live state, identify which screens require authentication, and state exactly where the prototype ends and the partner-governed production integration begins.

## Final Reminder

This sequence is a presentation aid, not an automated script. The presenter should prioritize clarity, data provenance, and honest fallback behavior over clicking every available control.

## Version

Prepared for the competition-ready BRICS Climate Intelligence build before the September 30 submission deadline.

## Owner

Hackathon team.

## Status

Ready for rehearsal.

## Notes

Keep the browser zoom at 100% on desktop and use the mobile layout only if the judges request a responsive view. Use the same city throughout the narrative so the evidence, satellite, and forecast views feel like one connected incident rather than unrelated samples.

## End

The final message should point reviewers to the live checkpoint and this sequence for rehearsal.
