# Competition Readiness Audit

## Farminerals Comparison

The delivered Farminerals package was reviewed as a separate static reference at `/home/ubuntu/farminerals-prompt/Farm minerals`. Its strongest cues are editorial product storytelling, restrained green/cream contrast, large display typography, product-as-object imagery, progressive disclosure, and a calm sustainability tone. The BRICS implementation adopts those cues selectively in the 90-second proof rail and paper-like evidence surfaces while preserving its darker operational map, live status language, and civic-control model. The result is intentionally not a visual clone: Farminerals supplies the sustainability/editorial register; Monsoon Signal Room remains the operational identity.

| Dimension | Farminerals reference | BRICS implementation | Decision |
|---|---|---|---|
| Typography | Large editorial display headlines and short narrative blocks | DM Serif-style display hierarchy with compact operational labels | Keep the editorial headline contrast; retain dense operational metadata where needed |
| Motion | Scroll-led reveals and product-as-object transitions | Short transitions, map plume motion, dossier/drawer states, and a step-by-step proof rail | Keep motion purposeful and under the project animation guidance |
| Layout | Full-bleed visual storytelling with alternating editorial sections | Persistent operations rail, hero evidence, live signal field, dossier, review desk | Preserve the dashboard shell; add editorial blocks only where they clarify the story |
| Palette | Botanical green, mineral cream, muted neutrals | Monsoon ink, mint verification, mineral cream research slips, yellow risk accents | Use cream/mint for evidence and workflow surfaces, not as a replacement for map contrast |
| Interaction | Product navigation and progressive story sections | Pins, forecast horizons, country filters, live refresh, evidence intake, human review | Keep every interaction tied to a real product state or explicit explanatory feedback |

## Local Farminerals Preview Restart Path

The package is static and contains no `package.json`. Restart it from a shell with:

```bash
cd "/home/ubuntu/farminerals-prompt/Farm minerals"
python3 -m http.server 4173 --bind 127.0.0.1
```

Review it at `http://127.0.0.1:4173/`. The extracted package remains outside the BRICS production source tree and can be stopped or restarted without affecting the BRICS dev server.

## Asset-Location Audit

The BRICS UI references small approved configuration files and platform-managed `/manus-storage/` asset URLs. Large visual assets are not stored in `client/public/` or `client/src/assets/`. The Farminerals extraction remains in its own local review directory; it was not copied into the production project. No new untracked media asset was introduced by the competition pass.

## Recovery and Rollback

The previous stable production checkpoint remains available in project version history. The competition-ready checkpoint is `6228a1c0`. If a later visual experiment harms clarity, restore the previous stable version from project version history rather than using a destructive Git reset. The Farminerals reference is independently restartable and can be removed from local review without changing the BRICS application.

## Focus and Accessibility Audit

Interactive controls use semantic `<button>` elements, labeled close controls, modal `role="dialog"` and `aria-modal="true"` attributes, visible text labels, keyboard-reachable country filters, forecast buttons, dossier controls, and evidence actions. The existing global style system supplies visible focus treatment and the competition pass did not remove it. Touch targets were checked on the 390px mobile viewport; the hero, proof rail, forecast controls, and primary action remain reachable without horizontal overflow.

## Provider Attribution Audit

The dashboard labels its live state, source notes, Open-Meteo public-feed behavior, and the protected Copernicus Sentinel-5P layer in the live dossier. The production playbook documents Open-Meteo, Copernicus, NASA FIRMS, OpenAQ, and ECMWF source boundaries, credential requirements, and data-governance expectations. Satellite failures surface a visible unavailable state rather than being represented as current imagery.

## Evidence Standard

The competition experience does not introduce fabricated testimonials, ratings, reviews, or user-generated endorsements. Citizen reports are described as evidence pending verification. Illustrative interface notes remain clearly framed as prototype content, while live provider values carry timestamps and source context.

## Validation Record

The final competition pass was validated with `pnpm check`, `pnpm test`, and `pnpm build`. Six test files passed with eleven tests. Desktop and mobile screenshots were captured after the hero/proof-rail changes, and the final checkpoint was saved as `6228a1c0`.

## Handoff Status

The project is ready for hackathon rehearsal. The recommended presentation path is documented in `docs/HACKATHON_DEMO_SEQUENCE.md`. The September 30 deadline should be used for rehearsal, partner-feed hardening, role assignment, and presentation refinement rather than a broad visual rewrite.
