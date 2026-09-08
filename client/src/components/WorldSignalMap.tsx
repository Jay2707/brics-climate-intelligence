import { useMemo, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Line,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";

const WORLD_GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

type WorldSignal = {
  id: number;
  city: string;
  country: string;
  risk: string;
  confidence: number;
  aqi: number;
  color: string;
  lat: number;
  lng: number;
};

type WorldSignalMapProps = {
  signals: WorldSignal[];
  activeSignalId: number;
  onSelect: (signal: WorldSignal) => void;
  feedStatus: string;
  activeWindow: string;
};

const BRICS_HUB = { city: "BRICS corridor network", coordinates: [62, 23] as [number, number] };

export function WorldSignalMap({
  signals,
  activeSignalId,
  onSelect,
  feedStatus,
  activeWindow,
}: WorldSignalMapProps) {
  const [position, setPosition] = useState({ coordinates: [62, 23] as [number, number], zoom: 1 });
  const orderedSignals = useMemo(() => [...signals].sort((a, b) => b.confidence - a.confidence), [signals]);

  return (
    <div className="world-map-shell relative min-h-[430px] overflow-hidden rounded-[30px] border border-[#DCEAE2]/12 bg-[#071E2C] shadow-[0_25px_60px_rgba(0,0,0,.24)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_44%,rgba(56,117,110,.18),transparent_38%),linear-gradient(140deg,rgba(4,22,33,.97),rgba(9,43,54,.8))]" />
      <div className="map-grain absolute inset-0 opacity-40" />
      <div className="absolute left-5 top-5 z-20 flex max-w-[calc(100%-2.5rem)] flex-wrap gap-2">
        <span className="map-chip"><span className="h-1.5 w-1.5 rounded-full bg-[#F2B84B]" /> Global signal atlas</span>
        <span className="map-chip"><span className="h-1.5 w-1.5 rounded-full bg-[#78C7B2]" /> BRICS corridors</span>
        <span className="map-chip"><span className="h-1.5 w-1.5 rounded-full bg-[#A7C6BF]" /> {activeWindow} · {feedStatus}</span>
        <span className="map-chip"><span className="h-1.5 w-1.5 rounded-full bg-[#F0C55B]" /> AeroSentinel schema · hotspot → forecast → alert</span>
      </div>

      <ComposableMap
        projection="geoEqualEarth"
        projectionConfig={{ scale: 145, center: [12, 8] }}
        className="relative z-10 h-full min-h-[430px] w-full"
        aria-label="Interactive world map of BRICS climate signals and cross-border pollution corridors"
      >
        <ZoomableGroup
          center={position.coordinates}
          zoom={position.zoom}
          minZoom={1}
          maxZoom={4}
          onMoveEnd={({ coordinates, zoom }: { coordinates: [number, number]; zoom: number }) => setPosition({ coordinates, zoom })}
        >
          <Geographies geography={WORLD_GEO_URL}>
            {({ geographies }: { geographies: any[] }) => geographies.map((geo: any) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="#143C47"
                stroke="#6B9890"
                strokeWidth={0.35}
                style={{
                  default: { outline: "none", fill: "#143C47" },
                  hover: { outline: "none", fill: "#1D5154" },
                  pressed: { outline: "none", fill: "#246A65" },
                }}
              />
            ))}
          </Geographies>

          {orderedSignals.map((signal) => (
            <Line
              key={`line-${signal.id}`}
              from={BRICS_HUB.coordinates}
              to={[signal.lng, signal.lat]}
              stroke={signal.color}
              strokeWidth={Math.max(0.5, signal.confidence / 100 * 1.2)}
              strokeOpacity={0.24}
              strokeDasharray="3 4"
            />
          ))}

          <Marker coordinates={BRICS_HUB.coordinates}>
            <circle r={7} fill="#A8E0CF" fillOpacity={0.12} stroke="#A8E0CF" strokeOpacity={0.5} />
            <circle r={2.5} fill="#A8E0CF" />
            <text y={-12} textAnchor="middle" className="fill-[#C6DED7]" style={{ fontSize: 7, fontWeight: 700, letterSpacing: "0.12em" }}>
              BRICS NETWORK
            </text>
          </Marker>

          {signals.map((signal) => {
            const isActive = signal.id === activeSignalId;
            return (
              <Marker key={signal.id} coordinates={[signal.lng, signal.lat]}>
                <g
                  role="button"
                  tabIndex={0}
                  aria-label={`Open ${signal.city} climate signal`}
                  onClick={() => onSelect(signal)}
                  onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onSelect(signal); }}
                  className="cursor-pointer outline-none"
                >
                  <circle r={isActive ? 15 : 10} fill={signal.color} fillOpacity={isActive ? 0.24 : 0.15} stroke={isActive ? signal.color : "#071E2C"} strokeWidth={isActive ? 1.5 : 1} />
                  <circle r={isActive ? 6 : 4.5} fill={signal.color} stroke="#071E2C" strokeWidth={1.2} />
                  <text y={-18} textAnchor="middle" className="fill-[#EDF6F0]" style={{ fontSize: isActive ? 10 : 8.5, fontWeight: isActive ? 800 : 700 }}>
                    {signal.city}
                  </text>
                  <text y={isActive ? 29 : 25} textAnchor="middle" className="fill-[#A9C9C1]" style={{ fontSize: 7, fontWeight: 700 }}>
                    AQI {signal.aqi}
                  </text>
                </g>
              </Marker>
            );
          })}
        </ZoomableGroup>
      </ComposableMap>

      <div className="absolute bottom-5 left-5 z-20 rounded-xl border border-[#DDEAE1]/12 bg-[#08212E]/90 px-3 py-2.5 backdrop-blur-md">
        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#96B3AD]">World view</p>
        <p className="mt-1 text-xs text-[#D8E7E0]">Drag to explore · scroll to zoom · select a signal</p>
        <p className="mt-1 text-[9px] leading-4 text-[#9EBDB5]">Map geometry is context; values come from the live dossier.</p>
      </div>
      <div className="absolute bottom-5 right-5 z-20 flex items-center gap-3 rounded-xl border border-[#DDEAE1]/12 bg-[#08212E]/90 px-3 py-2.5 text-[10px] font-semibold text-[#BFD4CE] backdrop-blur-md">
        <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#F2B84B]" /> high</span>
        <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#DE7C51]" /> elevated</span>
        <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#78C7B2]" /> watch</span>
      </div>
    </div>
  );
}
