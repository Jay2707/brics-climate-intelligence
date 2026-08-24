/**
 * Monsoon Signal Room — primary briefing interface.
 * Design reminder: atmospheric cartographic editorial style; use Monsoon Ink, paper-like panels,
 * contour lines, and precise civic language. Does this reinforce or dilute the field-atlas philosophy?
 */
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { ReviewDesk } from "@/components/ReviewDesk";
import {
  Activity,
  ArrowRight,
  BellRing,
  Camera,
  ChevronRight,
  CircleAlert,
  CloudSun,
  Crosshair,
  FileCheck2,
  Globe2,
  Layers3,
  Menu,
  Mic,
  MoveUpRight,
  Radio,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TimerReset,
  UsersRound,
  Waves,
  Wind,
  X,
  type LucideIcon,
} from "lucide-react";

type Country = "All" | "Brazil" | "Russia" | "India" | "China" | "South Africa";

type Signal = {
  id: number;
  city: string;
  country: Exclude<Country, "All">;
  source: string;
  risk: "Elevated" | "High" | "Watch";
  title: string;
  summary: string;
  confidence: number;
  eta: string;
  aqi: number;
  position: { left: string; top: string };
  color: string;
};

const countries: Country[] = ["All", "Brazil", "Russia", "India", "China", "South Africa"];
const forecastWindows = ["Now", "+6h", "+12h", "+24h"];

const signals: Signal[] = [
  {
    id: 1,
    city: "New Delhi",
    country: "India",
    source: "Satellite + 28 local reports",
    risk: "High",
    title: "Northwest smoke corridor",
    summary: "A dense particulate stream is moving southeast across the Delhi–NCR economic belt.",
    confidence: 92,
    eta: "3h 40m",
    aqi: 184,
    position: { left: "53%", top: "54%" },
    color: "#F2B84B",
  },
  {
    id: 2,
    city: "Beijing",
    country: "China",
    source: "Satellite + wind model",
    risk: "Elevated",
    title: "Industrial plume inversion",
    summary: "An overnight inversion may hold emissions close to the urban surface layer.",
    confidence: 84,
    eta: "6h 15m",
    aqi: 126,
    position: { left: "73%", top: "37%" },
    color: "#DE7C51",
  },
  {
    id: 3,
    city: "São Paulo",
    country: "Brazil",
    source: "Citizen photo cluster",
    risk: "Watch",
    title: "Urban basin haze signal",
    summary: "Community imagery suggests a localized early-morning haze over the western basin.",
    confidence: 71,
    eta: "Monitoring",
    aqi: 74,
    position: { left: "25%", top: "73%" },
    color: "#78C7B2",
  },
  {
    id: 4,
    city: "Johannesburg",
    country: "South Africa",
    source: "Sensor mesh + satellite",
    risk: "Elevated",
    title: "Highveld transport pulse",
    summary: "A shallow plume is tracking toward commuter districts under stable morning air.",
    confidence: 86,
    eta: "5h 05m",
    aqi: 118,
    position: { left: "49%", top: "81%" },
    color: "#DE7C51",
  },
  {
    id: 5,
    city: "Moscow",
    country: "Russia",
    source: "Meteorology model",
    risk: "Watch",
    title: "Boundary-layer stagnation",
    summary: "Low surface winds may prevent normal dispersion through the next briefing window.",
    confidence: 67,
    eta: "12h 20m",
    aqi: 61,
    position: { left: "46%", top: "21%" },
    color: "#78C7B2",
  },
];

const riskStyles: Record<Signal["risk"], string> = {
  High: "bg-[#F2B84B]/15 text-[#FFD67A] border-[#F2B84B]/35",
  Elevated: "bg-[#DE7C51]/15 text-[#F6AB8B] border-[#DE7C51]/35",
  Watch: "bg-[#78C7B2]/15 text-[#A8E0CF] border-[#78C7B2]/35",
};

const processSteps: [LucideIcon, string, string, string, string][] = [
  [Camera, "01", "Observe", "Photos, low-cost sensors, and structured local notes establish a ground truth.", "Source stamp · field evidence"],
  [Wind, "02", "Forecast", "Meteorology and satellite layers identify movement, spread, and confidence.", "Model trace · dispersion v0.8"],
  [ShieldCheck, "03", "Coordinate", "Verified signals travel to the right civic desk with clear evidence.", "Protocol · partner escalation"],
];

const navigationItems: [LucideIcon, string, boolean][] = [
  [Layers3, "Signal field", true],
  [BellRing, "Active alerts", false],
  [UsersRound, "Partner desk", false],
  [FileCheck2, "Evidence log", false],
];

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <img
        src="/manus-storage/brics-river-knot-logo_60164169.png"
        alt="BRICS Climate Intelligence mark"
        className="h-10 w-10 rounded-[13px] bg-[#E7F2EC] p-1.5 shadow-[0_8px_24px_rgba(0,0,0,.22)]"
      />
      <div className="leading-none">
        <p className="font-serif text-[17px] tracking-[-0.04em] text-[#F4F7F1]">BRICS Climate</p>
        <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.21em] text-[#8DA8A5]">Signal Room</p>
      </div>
    </div>
  );
}

function RiverMark() {
  return (
    <span className="river-mark" aria-hidden="true">
      <i /><i /><i /><i /><i />
    </span>
  );
}

async function encodeAttachment(file: File) {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("The selected evidence file could not be read."));
    reader.readAsDataURL(file);
  });
  const [, dataBase64 = ""] = dataUrl.split(",", 2);
  return { fileName: file.name, mimeType: file.type, dataBase64 };
}

export default function Home() {
  const [activeCountry, setActiveCountry] = useState<Country>("All");
  const [activeWindow, setActiveWindow] = useState("Now");
  const [activeSignalId, setActiveSignalId] = useState(1);
  const [isSignalDossierOpen, setIsSignalDossierOpen] = useState(false);
  const [satelliteLayer, setSatelliteLayer] = useState<"no2" | "aerosol">("no2");
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const liveClimateQuery = trpc.climate.liveSignals.useQuery(undefined, { refetchInterval: 300_000, retry: 1, refetchOnWindowFocus: false });
  const climateRefreshMutation = trpc.climate.refresh.useMutation();
  const evidenceMutation = trpc.evidence.submit.useMutation();
  const isReviewer = Boolean(user && ["verifier", "city_desk", "national_desk", "admin"].includes(user.role));
  const reviewQueue = trpc.evidence.reviewQueue.useQuery(undefined, { enabled: isReviewer, refetchOnWindowFocus: false });

  const activeHorizon: "now" | "6h" | "12h" | "24h" = activeWindow === "Now" ? "now" : activeWindow === "+6h" ? "6h" : activeWindow === "+12h" ? "12h" : "24h";
  const dashboardSignals = useMemo(() => signals.map(signal => {
    const live = liveClimateQuery.data?.signals.find(candidate => candidate.city === signal.city);
    if (!live) return signal;
    const horizonAqi = live.forecastAqi[activeHorizon] ?? live.aqi;
    const risk: Signal["risk"] = horizonAqi >= 151 ? "High" : horizonAqi >= 101 ? "Elevated" : "Watch";
    const eta = activeHorizon === "now" ? "Live now" : live.forecastAqi[activeHorizon] === null ? "Forecast pending" : live.trend === "rising" ? `Rising +${activeHorizon}` : live.trend === "improving" ? `Improving +${activeHorizon}` : `Stable +${activeHorizon}`;
    return {
      ...signal,
      aqi: Math.round(horizonAqi),
      risk,
      eta,
      confidence: liveClimateQuery.data?.status === "live" ? 86 : 68,
      source: `Live public forecast · ${activeWindow} AQI ${Math.round(horizonAqi)} · PM2.5 ${live.pm25.toFixed(1)} µg/m³`,
      summary: `${activeWindow} AQI is ${Math.round(horizonAqi)}. Current PM2.5 is ${live.pm25.toFixed(1)} µg/m³ with ${live.windSpeed.toFixed(1)} km/h winds at ${live.windDirection.toFixed(0)}°.`,
    };
  }), [activeHorizon, activeWindow, liveClimateQuery.data]);

  const visibleSignals = useMemo(
    () => dashboardSignals.filter(signal => activeCountry === "All" || signal.country === activeCountry),
    [activeCountry, dashboardSignals],
  );
  const activeSignal = dashboardSignals.find(signal => signal.id === activeSignalId) ?? dashboardSignals[0];
  const activeLiveSignal = liveClimateQuery.data?.signals.find(signal => signal.city === activeSignal.city);
  const satelliteLayerQuery = trpc.satellite.getLayer.useQuery(
    { city: activeSignal.city as "New Delhi" | "Beijing" | "São Paulo" | "Johannesburg" | "Moscow", layer: satelliteLayer },
    { enabled: isSignalDossierOpen, staleTime: 15 * 60 * 1000, retry: 1, refetchOnWindowFocus: false },
  );
  const feedStatus = liveClimateQuery.data?.status ?? (liveClimateQuery.isLoading ? "loading" : "unavailable");
  const liveSignalCount = liveClimateQuery.data?.signals.length ?? 0;

  const selectSignal = (signal: Signal) => {
    setActiveSignalId(signal.id);
    setIsSignalDossierOpen(true);
    toast(`${signal.city} dossier opened`, { description: `${signal.risk} risk · ${activeWindow} horizon · ${signal.confidence}% source confidence` });
  };

  const scrollToField = () => document.getElementById("signal-field")?.scrollIntoView({ behavior: "smooth" });

  const applyCountryFilter = (country: Country) => {
    setActiveCountry(country);
    const nextSignal = dashboardSignals.find(signal => country === "All" || signal.country === country);
    if (nextSignal) {
      setActiveSignalId(nextSignal.id);
      setIsSignalDossierOpen(true);
    }
  };

  const refreshLiveSignals = async () => {
    try {
      const snapshot = await climateRefreshMutation.mutateAsync();
      await liveClimateQuery.refetch();
      toast("Live field refreshed", { description: `${snapshot.signals.length} city snapshots received at ${new Date(snapshot.updatedAt).toLocaleTimeString()}.` });
    } catch (error) {
      toast("Live refresh unavailable", { description: error instanceof Error ? error.message : "The public source could not be reached. The prior snapshot remains visible." });
    }
  };

  const submitEvidence = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isAuthenticated) {
      toast("Sign in required", { description: "A verified account is required to protect the evidence and its review trail." });
      startLogin();
      return;
    }
    const form = new FormData(event.currentTarget);
    const selectedFile = form.get("attachment");
    try {
      const attachment = selectedFile instanceof File && selectedFile.size > 0 ? await encodeAttachment(selectedFile) : undefined;
      await evidenceMutation.mutateAsync({
        city: String(form.get("city") ?? ""),
        countryCode: String(form.get("countryCode") ?? "IN") as "BR" | "RU" | "IN" | "CN" | "ZA",
        incidentType: String(form.get("incidentType") ?? "smoke_haze") as "smoke_haze" | "industrial_emissions" | "agricultural_burning" | "sensor_reading",
        description: String(form.get("description") ?? ""),
        observedAt: form.get("observedAt") ? new Date(String(form.get("observedAt"))).getTime() : Date.now(),
        consentProvided: true,
        attachment,
      });
      event.currentTarget.reset();
      setIsReportOpen(false);
      toast("Evidence received for verification", { description: "Your report is stored securely and begins in the submitted state." });
    } catch (error) {
      toast("Evidence could not be submitted", { description: error instanceof Error ? error.message : "Please verify the report details and try again." });
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#061C29] text-[#EFF7F1]">
      <div className="app-shell relative min-h-screen">
        <aside className="sidebar-shell hidden lg:flex">
          <Logo />

          <div className="mt-12">
            <p className="sidebar-label">Operations</p>
            <nav className="mt-3 space-y-1.5" aria-label="Primary navigation">
              {navigationItems.map(([Icon, label, isActive]) => (
                <button
                  key={String(label)}
                  className={`sidebar-link ${isActive ? "sidebar-link-active" : ""}`}
                  onClick={label === "Signal field" ? scrollToField : () => toast("Briefing module", { description: "This hackathon prototype focuses on the live signal field." })}
                >
                  <Icon className="h-4 w-4" />
                  <span>{String(label)}</span>
                  {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#A6E0CF]" />}
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-auto rounded-[22px] border border-[#CDE1DA]/10 bg-[#0A2937] p-4 shadow-[0_12px_34px_rgba(0,0,0,.15)]">
            <div className="flex items-center gap-2 text-[#A8E0CF]">
              <Radio className="h-3.5 w-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-[0.17em]">{feedStatus === "live" ? "Live field online" : feedStatus === "degraded" ? "Partial live field" : "Field standby"}</span>
            </div>
            <p className="mt-3 text-sm leading-5 text-[#BCD0CB]">{liveClimateQuery.data?.message ?? "Connecting to the public atmospheric source."}</p>
            <button onClick={() => toast("Live source notes", { description: "The prototype uses the public Open-Meteo air-quality and weather endpoints with a five-minute server cache." })} className="mt-4 flex items-center gap-1 text-xs font-semibold text-[#F2D47A] transition hover:gap-2">
              Source notes <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </aside>

        <main className="main-stage">
          <header className="flex min-h-20 items-center justify-between border-b border-[#D8E8E1]/10 px-5 md:px-8 lg:px-10">
            <div className="flex items-center gap-3 lg:hidden">
              <button className="icon-button" aria-label="Open menu" onClick={() => setIsMobileMenuOpen(true)}>
                <Menu className="h-5 w-5" />
              </button>
              <Logo />
            </div>
            <div className="hidden items-center gap-2 md:flex">
              <span className="eyebrow">Regional briefing</span>
              <span className="h-1 w-1 rounded-full bg-[#526E73]" />
              <span className="text-xs text-[#9BB2AE]">24 Aug 2026 · 09:30 IST</span>
            </div>
            <div className="ml-auto flex items-center gap-2.5">
              <div className="hidden items-center gap-2 rounded-full border border-[#CDE1DA]/12 bg-[#0A2634] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#AAD9CC] sm:flex">
                <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#78C7B2] opacity-45" /><span className="relative inline-flex h-2 w-2 rounded-full bg-[#78C7B2]" /></span>
                {feedStatus === "live" ? "Live public data" : "Operational preview"}
              </div>
              {!authLoading && !isAuthenticated && <button onClick={startLogin} className="quiet-button hidden !px-3 !py-2 !text-xs md:inline-flex">Sign in</button>}
              {isAuthenticated && <span className="hidden rounded-full border border-[#CDE1DA]/12 px-3 py-2 text-[10px] font-bold uppercase tracking-[.12em] text-[#F2D47A] md:inline-flex">{user?.role.replaceAll("_", " ")}</span>}
              <button onClick={() => setIsReportOpen(true)} className="action-button text-xs sm:text-sm">
                <Camera className="h-4 w-4" />
                <span className="hidden sm:inline">Report a signal</span>
                <span className="sm:hidden">Report</span>
              </button>
            </div>
          </header>

          <section className="hero-section relative px-5 py-8 md:px-8 md:py-11 lg:px-10">
            <img src="/manus-storage/brics-hero-atmosphere_aeefe29a.png" alt="Abstract satellite visualization of transboundary pollution flows" className="absolute inset-0 h-full w-full object-cover object-center opacity-65" />
            <div className="hero-veil absolute inset-0" />
            <div className="relative z-10 max-w-4xl">
              <div className="flex items-center gap-2 text-[#C2DDD4]">
                <Waves className="h-4 w-4 text-[#A8E0CF]" />
                <span className="eyebrow">Shared air, earlier action</span>
              </div>
              <h1 className="mt-5 max-w-3xl font-serif text-[clamp(2.5rem,5vw,5.15rem)] leading-[0.91] tracking-[-0.06em] text-[#F6F7F0]">
                See the smoke corridor <span className="text-[#F0C55B]">before</span> it arrives.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-[#CDDED8] md:text-lg">A federated intelligence layer for BRICS cities to combine local evidence, satellite observations, and weather signals into coordinated climate action.</p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button className="action-button" onClick={scrollToField}>
                  Explore live signal field <ArrowRight className="h-4 w-4" />
                </button>
                <button onClick={() => setIsReportOpen(true)} className="quiet-button">
                  <Mic className="h-4 w-4" /> Contribute local evidence
                </button>
              </div>
              <div className="mt-10 grid max-w-xl grid-cols-3 gap-5 border-t border-[#E9F0E9]/15 pt-5">
                {[[String(liveSignalCount || 5), 'cities in view'], [feedStatus === "live" ? 'Live' : 'Safe', 'feed state'], ['5m', 'server refresh']].map(([value, label]) => (
                  <div key={label}>
                    <p className="font-serif text-2xl tracking-[-.04em] text-[#F7F8F3]">{value}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.13em] text-[#AABFBA]">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="signal-field" className="px-5 pb-10 pt-8 md:px-8 lg:px-10">
            <div className="mb-5 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
              <div>
                <div className="flex items-center gap-2 text-[#A8E0CF]"><Activity className="h-4 w-4" /><span className="eyebrow">Signal field</span></div>
                <h2 className="mt-2 font-serif text-3xl tracking-[-.05em] text-[#F4F7F1] md:text-4xl">The next 24 hours, mapped as one air system.</h2>
              </div>
              <div className="flex max-w-full flex-wrap gap-1.5 pb-1">
                {forecastWindows.map(window => (
                  <button key={window} onClick={() => setActiveWindow(window)} className={`forecast-pill ${activeWindow === window ? "forecast-pill-active" : ""}`}>{window}</button>
                ))}
                <button onClick={() => void refreshLiveSignals()} disabled={climateRefreshMutation.isPending} className="forecast-pill inline-flex items-center gap-1.5 disabled:opacity-60"><RefreshCw className={`h-3.5 w-3.5 ${climateRefreshMutation.isPending ? "animate-spin" : ""}`} />Refresh</button>
              </div>
            </div>

            <div className="signal-layout">
              <div className="map-card relative overflow-hidden rounded-[30px] border border-[#DCEAE2]/12 bg-[#0A2635] shadow-[0_25px_60px_rgba(0,0,0,.24)]">
                <img src="/manus-storage/brics-contour-field_611814d0.png" alt="" className="absolute inset-0 h-full w-full object-cover opacity-65" />
                <div className="map-grain absolute inset-0" />
                <div className="absolute left-5 top-5 z-20 flex flex-wrap gap-2">
                  <span className="map-chip"><span className="h-1.5 w-1.5 rounded-full bg-[#F2B84B]" /> PM2.5 plume</span>
                  <span className="map-chip"><span className="h-1.5 w-1.5 rounded-full bg-[#78C7B2]" /> Verified local report</span>
                  <span className="map-chip"><CloudSun className="h-3.5 w-3.5" /> {activeWindow} forecast · {feedStatus}</span>
                </div>
                <article className="evidence-slip absolute left-5 top-[84px] z-20 max-w-[235px]" aria-label="Corroborated citizen evidence note">
                  <div className="flex items-center gap-2"><RiverMark /><span className="text-[9px] font-extrabold uppercase tracking-[.17em]">Field note B-014</span><span className="ml-auto rounded-full bg-[#2F776B]/12 px-2 py-1 text-[8px] font-extrabold uppercase tracking-[.1em] text-[#216257]">Corroborated</span></div>
                  <p className="mt-2 font-serif text-[15px] leading-[1.08] tracking-[-.025em]">“Visible haze and ash fall reported west of the Delhi–NCR corridor.”</p>
                  <p className="mt-2 text-[10px] leading-4 text-[#5E7772]">07:42 IST · privacy-preserved photo · paired with 3 nearby sensor readings</p>
                </article>

                <svg viewBox="0 0 1000 650" aria-hidden="true" className="absolute inset-0 h-full w-full overflow-visible">
                  <defs>
                    <filter id="softGlow"><feGaussianBlur stdDeviation="8" /></filter>
                    <linearGradient id="plumeGradient" x1="0" x2="1"><stop offset="0%" stopColor="#F2B84B" stopOpacity="0" /><stop offset="34%" stopColor="#F2B84B" stopOpacity=".58" /><stop offset="72%" stopColor="#DE7C51" stopOpacity=".36" /><stop offset="100%" stopColor="#DE7C51" stopOpacity="0" /></linearGradient>
                  </defs>
                  <path d="M102 440 C262 320 344 495 492 392 S708 186 918 238" stroke="#F2B84B" strokeWidth="48" strokeLinecap="round" opacity=".10" filter="url(#softGlow)" />
                  <path d="M102 440 C262 320 344 495 492 392 S708 186 918 238" stroke="url(#plumeGradient)" strokeWidth="11" strokeLinecap="round" className="plume-path" />
                  <path d="M94 448 C240 350 334 522 486 412 S690 210 910 250" fill="none" stroke="#EBD383" strokeOpacity=".58" strokeWidth="1.3" strokeDasharray="7 10" />
                  <path d="M172 144 C341 78 445 202 579 139 S806 133 941 77" fill="none" stroke="#94D1C0" strokeOpacity=".32" strokeWidth="2" strokeDasharray="3 9" />
                  <path d="M180 556 C338 482 476 594 607 504 S765 405 930 460" fill="none" stroke="#B3D5CA" strokeOpacity=".18" strokeWidth="1" />
                </svg>

                <div className="absolute inset-0 z-10">
                  {visibleSignals.map(signal => (
                    <button
                      key={signal.id}
                      onClick={() => selectSignal(signal)}
                      title={`${signal.city}: ${signal.risk} pollution signal`}
                      className={`signal-pin ${signal.id === activeSignalId ? "signal-pin-active" : ""}`}
                      style={{ left: signal.position.left, top: signal.position.top, "--pin-color": signal.color } as React.CSSProperties}
                    >
                      <span className="signal-pin-core"><span /></span>
                      <span className="signal-pin-label">{signal.city}</span>
                    </button>
                  ))}
                </div>

                <div className="absolute bottom-5 left-5 z-20 rounded-xl border border-[#DDEAE1]/12 bg-[#08212E]/85 px-3 py-2.5 backdrop-blur-md">
                  <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#96B3AD]">Data blend</p>
                  <p className="mt-1 text-xs text-[#D8E7E0]">Satellite · weather · citizen evidence</p>
                </div>
                <div className="absolute bottom-5 right-5 z-20 flex items-center gap-2 rounded-xl border border-[#DDEAE1]/12 bg-[#08212E]/85 px-3 py-2.5 backdrop-blur-md"><Crosshair className="h-4 w-4 text-[#A8E0CF]" /><span className="text-xs text-[#D8E7E0]">Regional alignment</span></div>
              </div>

              <aside className="field-panel">
                <div className="rounded-[26px] border border-[#DCEAE2]/12 bg-[#0A2937] p-5 shadow-[0_18px_40px_rgba(0,0,0,.16)]">
                  <div className="flex items-center justify-between"><span className="eyebrow">Focus signal</span><span className={`risk-badge ${riskStyles[activeSignal.risk]}`}>{activeSignal.risk}</span></div>
                  <h3 className="mt-4 font-serif text-[30px] leading-8 tracking-[-.05em] text-[#F3F7F1]">{activeSignal.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#BCD0CB]">{activeSignal.summary}</p>
                  <div className="mt-5 grid grid-cols-3 divide-x divide-[#DDEAE1]/10 border-y border-[#DDEAE1]/10 py-4">
                    {[['AQI', String(activeSignal.aqi)], ['Confidence', `${activeSignal.confidence}%`], ['Arrival', activeSignal.eta]].map(([label, value]) => <div key={label} className="px-2 first:pl-0 last:pr-0"><p className="text-[9px] uppercase tracking-[.14em] text-[#83A19D]">{label}</p><p className="mt-1 text-sm font-semibold text-[#F1F6F1]">{value}</p></div>)}
                  </div>
                  <div className="mt-5 flex items-start gap-2 text-xs leading-5 text-[#A9C0BA]"><Radio className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#A8E0CF]" />{activeSignal.source}</div>
                  <button onClick={() => setIsSignalDossierOpen(true)} className="country-filter mt-5 w-full border-[#CDE1DA]/25 py-2.5 text-[#C7E6DC]">Open city dossier <ArrowRight className="ml-1 inline h-3.5 w-3.5" /></button>
                  <button onClick={() => isReviewer ? document.getElementById("review-desk")?.scrollIntoView({ behavior: "smooth" }) : toast("Human review required", { description: "A verifier or authorised desk must corroborate evidence before an alert briefing can be prepared." })} className="panel-action mt-2">{isReviewer ? "Open review workflow" : "Review before briefing"} <ArrowRight className="h-4 w-4" /></button>
                </div>

                <div className="rounded-[26px] border border-[#DCEAE2]/12 bg-[#0A2937] p-5">
                  <div className="flex items-center justify-between"><span className="eyebrow">Filter by country</span><Globe2 className="h-4 w-4 text-[#90AAA4]" /></div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {countries.map(country => <button key={country} onClick={() => applyCountryFilter(country)} className={`country-filter ${activeCountry === country ? "country-filter-active" : ""}`}>{country}</button>)}
                  </div>
                </div>
              </aside>
            </div>
          </section>

          <section className="border-y border-[#DCEAE2]/10 bg-[#082330] px-5 py-9 md:px-8 lg:px-10">
            <div className="grid gap-7 xl:grid-cols-[.9fr_1.1fr] xl:items-center">
              <div>
                <div className="flex items-center gap-2 text-[#F2C85A]"><Sparkles className="h-4 w-4" /><span className="eyebrow">Why federation matters</span></div>
                <h2 className="mt-3 max-w-md font-serif text-4xl leading-[.96] tracking-[-.055em] text-[#F4F7F1]">One local photo can shift a regional forecast.</h2>
                <p className="mt-4 max-w-lg text-sm leading-6 text-[#B8CDC7]">The platform turns evidence into a shared model without moving raw sensitive data across borders. Partners exchange forecasts, confidence, and response needs—so intervention reaches the plume, not just the city line.</p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <button onClick={() => setIsReportOpen(true)} className="quiet-button border-[#CDE1DA]/18"><Camera className="h-4 w-4" /> Submit a field report</button>
                  <button onClick={() => toast("Model-exchange preview", { description: "A future backend can connect federated model APIs here." })} className="text-link">Explore model exchange <MoveUpRight className="h-3.5 w-3.5" /></button>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {processSteps.map(([Icon, number, title, body, stamp]) => {
                  const FeatureIcon = Icon;
                  return <article key={String(title)} className="process-card"><div className="flex items-center justify-between"><FeatureIcon className="h-5 w-5 text-[#A8E0CF]" /><span className="process-number font-serif text-2xl">{number}</span></div><h3 className="process-title mt-7">{title}</h3><p className="process-body mt-3">{body}</p><p className="process-stamp mt-5">{stamp}</p></article>;
                })}
              </div>
            </div>
          </section>

          <section className="grid gap-7 px-5 py-10 md:px-8 lg:grid-cols-[.94fr_1.06fr] lg:px-10 lg:py-14">
            <div className="citizen-card overflow-hidden rounded-[28px] border border-[#DCEAE2]/12">
              <img src="/manus-storage/brics-citizen-signal_05eb448e.png" alt="Community scientist documenting local air conditions near an industrial skyline" className="h-64 w-full object-cover sm:h-72" />
              <div className="p-6"><div className="citizen-eyebrow flex items-center gap-2"><RiverMark /><UsersRound className="h-4 w-4" /><span className="eyebrow">Citizen sensing</span></div><h2 className="citizen-title mt-3">Give local evidence the weight it deserves.</h2><p className="citizen-body mt-3">A simple evidence flow can capture location, image, sensor reading, and on-the-ground observation—then route it through verification before it shapes an alert.</p><div className="citizen-stamp mt-5"><span>Report B-014</span><span>image + sensor witness</span><span>review queue</span></div><button onClick={() => setIsReportOpen(true)} className="citizen-action mt-6">Open report flow <ChevronRight className="h-4 w-4" /></button></div>
            </div>
            <div className="overflow-hidden rounded-[28px] border border-[#DCEAE2]/12 bg-[#0A2937]">
              <div className="relative h-64 sm:h-72"><img src="/manus-storage/brics-hotspot-thermal_3008b470.png" alt="Conceptual thermal satellite visualization of a pollution hotspot" className="h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-[#0A2937] via-transparent to-transparent" /><div className="absolute bottom-5 left-5 rounded-xl border border-[#F2B84B]/30 bg-[#1E2830]/85 px-3 py-2 text-xs text-[#FFE1A0] backdrop-blur-md"><CircleAlert className="mr-1.5 inline h-3.5 w-3.5" />Adaptive hotspot detection</div></div>
              <div className="p-6"><div className="flex items-center gap-2 text-[#F2C85A]"><TimerReset className="h-4 w-4" /><span className="eyebrow">Response-ready alerts</span></div><h2 className="mt-3 font-serif text-3xl tracking-[-.05em] text-[#F4F7F1]">Move from pattern to intervention.</h2><p className="mt-3 text-sm leading-6 text-[#B7CBC6]">Use the alert queue to compare evidence, check predicted exposure, and send a concise operational brief to the agencies that can intervene.</p><button onClick={() => toast("Alert brief opened", { description: "A real deployment would generate a structured alert using your connected data services." })} className="panel-action mt-6">View alert anatomy <ChevronRight className="h-4 w-4" /></button></div>
            </div>
          </section>

          {isReviewer && <ReviewDesk role={user?.role ?? "reporter"} />}
          <footer className="flex flex-col gap-4 border-t border-[#DCEAE2]/10 px-5 py-7 text-xs text-[#91AAA5] md:flex-row md:items-center md:justify-between md:px-8 lg:px-10"><p>BRICS Climate Intelligence · Hackathon prototype · <span className="text-[#C8DAD4]">Illustrative data only</span></p><div className="flex gap-5"><button onClick={() => toast("Prototype note", { description: "Production deployments require authenticated data providers, policies, and human review." })} className="transition hover:text-[#E8F3EE]">Data responsibility</button><button onClick={() => setIsReportOpen(true)} className="transition hover:text-[#E8F3EE]">Share evidence</button></div></footer>
        </main>

        {isMobileMenuOpen && <div className="fixed inset-0 z-50 bg-[#04151F]/85 p-5 backdrop-blur-sm lg:hidden"><div className="h-full rounded-[28px] border border-[#DCEAE2]/12 bg-[#0A2937] p-6"><div className="flex items-center justify-between"><Logo /><button className="icon-button" onClick={() => setIsMobileMenuOpen(false)} aria-label="Close menu"><X className="h-5 w-5" /></button></div><div className="mt-10 space-y-3">{['Signal field', 'Active alerts', 'Partner desk', 'Evidence log'].map((label, index) => <button key={label} onClick={() => {setIsMobileMenuOpen(false); if (index === 0) scrollToField(); else toast("Briefing module", { description: "This hackathon prototype focuses on the live signal field." });}} className={`sidebar-link w-full ${index === 0 ? "sidebar-link-active" : ""}`}><span>{label}</span><ArrowRight className="ml-auto h-4 w-4" /></button>)}</div></div></div>}

        {isSignalDossierOpen && <div className="fixed inset-0 z-[58] flex items-end justify-end bg-[#04151F]/70 p-0 backdrop-blur-sm sm:p-5"><section role="dialog" aria-modal="true" aria-label={`${activeSignal.city} live city dossier`} className="report-drawer w-full overflow-y-auto rounded-t-[28px] border border-[#DCEAE2]/14 bg-[#F1F5EE] p-6 text-[#0B2535] shadow-2xl sm:max-h-[90vh] sm:max-w-xl sm:rounded-[28px] md:p-8"><div className="flex items-start justify-between"><div><p className="eyebrow text-[#53726D]">Live city dossier · {activeWindow}</p><h2 className="mt-2 font-serif text-4xl leading-none tracking-[-.06em]">{activeSignal.city}</h2><p className="mt-2 text-sm text-[#55706A]">{activeSignal.country} · source checked {liveClimateQuery.data?.updatedAt ? new Date(liveClimateQuery.data.updatedAt).toLocaleTimeString() : "pending"}</p></div><button onClick={() => setIsSignalDossierOpen(false)} className="light-icon-button" aria-label="Close city dossier"><X className="h-5 w-5" /></button></div><div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">{[["AQI", String(activeSignal.aqi)], ["PM2.5", activeLiveSignal?.pm25.toFixed(1) ?? "—"], ["PM10", activeLiveSignal?.pm10.toFixed(1) ?? "—"], ["NO₂", activeLiveSignal?.nitrogenDioxide.toFixed(1) ?? "—"], ["Wind", `${activeLiveSignal?.windSpeed.toFixed(1) ?? "—"} km/h`], ["Cloud cover", `${activeLiveSignal?.cloudCover.toFixed(0) ?? "—"}%`]].map(([label, value]) => <div key={label} className="rounded-2xl border border-[#B7CDC3] bg-white p-3"><p className="text-[9px] font-bold uppercase tracking-[.13em] text-[#59756E]">{label}</p><p className="mt-1 font-serif text-2xl tracking-[-.04em] text-[#153E3A]">{value}</p></div>)}</div><div className="mt-6 overflow-hidden rounded-2xl border border-[#B7CDC3] bg-[#123A3B]"><div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/15 px-4 py-3 text-white"><div><p className="text-[10px] font-bold uppercase tracking-[.13em] text-[#B6E1D6]">Live Copernicus Sentinel-5P L2</p><p className="mt-1 text-xs text-[#D1E5DC]">Server-rendered atmospheric layer · credentials remain protected</p></div><div className="flex gap-1"><button onClick={() => setSatelliteLayer("no2")} className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${satelliteLayer === "no2" ? "bg-[#E5F2EC] text-[#173C38]" : "border border-white/25 text-white"}`}>NO₂</button><button onClick={() => setSatelliteLayer("aerosol")} className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${satelliteLayer === "aerosol" ? "bg-[#E5F2EC] text-[#173C38]" : "border border-white/25 text-white"}`}>Aerosol</button></div></div>{satelliteLayerQuery.isLoading ? <div className="flex h-48 items-center justify-center text-sm text-[#D7E8E1]"><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Requesting latest satellite scene…</div> : satelliteLayerQuery.data ? <div className="relative"><img src={`data:image/png;base64,${satelliteLayerQuery.data.imageBase64}`} alt={`${satelliteLayer === "no2" ? "Nitrogen dioxide" : "Aerosol index"} satellite layer over ${activeSignal.city}`} className="h-52 w-full object-cover" /><div className="absolute bottom-3 left-3 rounded-full bg-[#0A252B]/85 px-2.5 py-1 text-[10px] font-bold text-[#E9F4EF]">{satelliteLayerQuery.data.cacheStatus === "fresh" ? "Fresh Copernicus render" : "Cached <15 min"}</div></div> : <div className="p-4 text-sm leading-6 text-[#D7E8E1]">Satellite imagery is temporarily unavailable. The air-quality dossier remains current from the live weather and monitoring feeds.</div>}</div><div className="mt-6 rounded-2xl bg-[#DCEAE1] p-4"><p className="text-[10px] font-bold uppercase tracking-[.13em] text-[#47726A]">Operational readout</p><p className="mt-2 text-sm leading-6 text-[#315A55]">{activeSignal.summary} This view stays tied to the selected map pin and current forecast horizon.</p></div><div className="mt-6 flex flex-wrap gap-3"><button onClick={() => void refreshLiveSignals()} disabled={climateRefreshMutation.isPending} className="submit-button w-auto">{climateRefreshMutation.isPending ? "Refreshing…" : "Refresh live snapshot"} <RefreshCw className={`h-4 w-4 ${climateRefreshMutation.isPending ? "animate-spin" : ""}`} /></button><button onClick={() => { setIsSignalDossierOpen(false); setIsReportOpen(true); }} className="light-icon-button h-auto w-auto px-4 text-sm font-bold">Add local evidence</button></div><p className="mt-5 text-xs leading-5 text-[#5B756F]">Weather, ground measurements, and Copernicus satellite imagery now feed this dossier. Authority delivery remains an approval-gated partner integration.</p></section></div>}

        {isReportOpen && <div className="fixed inset-0 z-[60] flex items-end justify-end bg-[#04151F]/70 p-0 backdrop-blur-sm sm:p-5"><section role="dialog" aria-modal="true" aria-label="Submit a local signal" className="report-drawer w-full overflow-y-auto rounded-t-[28px] border border-[#DCEAE2]/14 bg-[#F1F5EE] p-6 text-[#0B2535] shadow-2xl sm:max-h-[90vh] sm:max-w-xl sm:rounded-[28px] md:p-8"><div className="flex items-start justify-between"><div><p className="eyebrow text-[#53726D]">Secure citizen evidence</p><h2 className="mt-2 font-serif text-4xl leading-none tracking-[-.06em]">Add a local signal.</h2></div><button onClick={() => setIsReportOpen(false)} className="light-icon-button" aria-label="Close report form"><X className="h-5 w-5" /></button></div><p className="mt-4 max-w-md text-sm leading-6 text-[#536D69]">Reports are stored as submitted evidence, not public claims. A permitted verifier must corroborate a report before it can become an alert briefing.</p>{!isAuthenticated && <button onClick={startLogin} className="mt-4 rounded-lg bg-[#1B5E55] px-3 py-2 text-sm font-bold text-white">Sign in to submit securely</button>}<form onSubmit={submitEvidence} className="mt-7 space-y-4"><label className="field-label">Signal type<select name="incidentType" defaultValue="smoke_haze" className="field-input"><option value="smoke_haze">Smoke or haze</option><option value="industrial_emissions">Industrial emissions</option><option value="agricultural_burning">Agricultural burning</option><option value="sensor_reading">Low-cost sensor reading</option></select></label><div className="grid gap-4 sm:grid-cols-2"><label className="field-label">City / locality<input name="city" required minLength={2} placeholder="e.g. New Delhi" className="field-input" /></label><label className="field-label">Country<select name="countryCode" defaultValue="IN" className="field-input"><option value="BR">Brazil</option><option value="RU">Russia</option><option value="IN">India</option><option value="CN">China</option><option value="ZA">South Africa</option></select></label></div><label className="field-label">Observed time<input name="observedAt" type="datetime-local" className="field-input" /></label><label className="field-label">What are you seeing?<textarea name="description" required minLength={10} maxLength={3000} rows={4} placeholder="Describe the colour, direction, odour, duration, or visible source." className="field-input resize-none" /></label><label className="upload-box"><Camera className="h-5 w-5 text-[#2F776B]" /><span><strong>Add a photo or sensor file</strong><small>JPEG, PNG, WebP, CSV, text, or JSON; maximum 5 MB.</small></span><input name="attachment" type="file" accept="image/jpeg,image/png,image/webp,text/csv,text/plain,application/json" className="sr-only" /></label><label className="flex items-start gap-2 text-xs leading-5 text-[#4B6963]"><input name="consent" required type="checkbox" className="mt-1" />I confirm I may share this evidence for verification and understand that it will not be treated as a public claim until reviewed.</label><button disabled={evidenceMutation.isPending} type="submit" className="submit-button disabled:cursor-not-allowed disabled:opacity-60">{evidenceMutation.isPending ? "Sending securely…" : isAuthenticated ? "Send for verification" : "Sign in to send"} <ArrowRight className="h-4 w-4" /></button></form></section></div>}
      </div>
    </div>
  );
}
