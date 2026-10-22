import { useEffect, useRef, useState } from "react";
import { ComposableMap, Geographies, Geography, Line, Marker, ZoomableGroup } from "react-simple-maps";
import { MapView } from "@/components/Map";

const WORLD_GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const BRICS_HUB = { lat: 40, lng: 62 };

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

function MapLegend({ activeWindow, feedStatus, googleMode }: { activeWindow: string; feedStatus: string; googleMode: boolean }) {
  return <>
    <div className="absolute left-4 top-4 z-20 flex max-w-[calc(100%-2rem)] flex-wrap gap-2">
      <span className="map-chip"><span className="h-1.5 w-1.5 rounded-full bg-[#F2B84B]" /> {googleMode ? "Google Maps explorer" : "World fallback map"}</span>
      <span className="map-chip"><span className="h-1.5 w-1.5 rounded-full bg-[#78C7B2]" /> BRICS corridors</span>
      <span className="map-chip"><span className="h-1.5 w-1.5 rounded-full bg-[#A7C6BF]" /> {activeWindow} · {feedStatus}</span>
    </div>
    <div className="absolute bottom-4 right-4 z-20 flex items-center gap-3 rounded-xl border border-[#DDEAE1]/12 bg-[#08212E]/90 px-3 py-2.5 text-[10px] font-semibold text-[#BFD4CE] backdrop-blur-md">
      <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#F2B84B]" /> high</span>
      <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#DE7C51]" /> elevated</span>
      <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#78C7B2]" /> watch</span>
    </div>
  </>;
}

function AtlasFallback({ signals, activeSignalId, onSelect, activeWindow, feedStatus }: WorldSignalMapProps) {
  const [position, setPosition] = useState({ coordinates: [62, 23] as [number, number], zoom: 1 });
  return <div className="absolute inset-0">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_44%,rgba(56,117,110,.18),transparent_38%),linear-gradient(140deg,rgba(4,22,33,.97),rgba(9,43,54,.8))]" />
    <div className="map-grain absolute inset-0 opacity-40" />
    <MapLegend activeWindow={activeWindow} feedStatus={feedStatus} googleMode={false} />
    <ComposableMap projection="geoEqualEarth" projectionConfig={{ scale: 145, center: [12, 8] }} className="relative z-10 h-full min-h-[430px] w-full" aria-label="Fallback interactive world map">
      <ZoomableGroup center={position.coordinates} zoom={position.zoom} minZoom={1} maxZoom={4} onMoveEnd={({ coordinates, zoom }: { coordinates: [number, number]; zoom: number }) => setPosition({ coordinates, zoom })}>
        <Geographies geography={WORLD_GEO_URL}>{({ geographies }: { geographies: any[] }) => geographies.map((geo: any) => <Geography key={geo.rsmKey} geography={geo} fill="#143C47" stroke="#6B9890" strokeWidth={0.35} style={{ default: { outline: "none", fill: "#143C47" }, hover: { outline: "none", fill: "#1D5154" }, pressed: { outline: "none", fill: "#246A65" } }} />)}</Geographies>
        {signals.map(signal => <Line key={`line-${signal.id}`} from={[BRICS_HUB.lng, BRICS_HUB.lat]} to={[signal.lng, signal.lat]} stroke={signal.color} strokeWidth={1} strokeOpacity={0.3} strokeDasharray="3 4" />)}
        {signals.map(signal => <Marker key={signal.id} coordinates={[signal.lng, signal.lat]}><g role="button" tabIndex={0} aria-label={`Open ${signal.city} climate signal`} onClick={() => onSelect(signal)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") onSelect(signal); }} className="cursor-pointer outline-none"><circle r={signal.id === activeSignalId ? 14 : 9} fill={signal.color} fillOpacity={0.2} stroke={signal.color} strokeWidth={1.3} /><circle r={5} fill={signal.color} stroke="#071E2C" strokeWidth={1.2} /><text y={-17} textAnchor="middle" className="fill-[#EDF6F0]" style={{ fontSize: 8, fontWeight: 700 }}>{signal.city}</text><text y={25} textAnchor="middle" className="fill-[#A9C9C1]" style={{ fontSize: 7, fontWeight: 700 }}>AQI {signal.aqi}</text></g></Marker>)}
      </ZoomableGroup>
    </ComposableMap>
    <div className="absolute bottom-4 left-4 z-20 rounded-xl border border-[#DDEAE1]/12 bg-[#08212E]/90 px-3 py-2.5 backdrop-blur-md"><p className="text-[9px] font-bold uppercase tracking-[.16em] text-[#96B3AD]">Fallback world view</p><p className="mt-1 text-xs text-[#D8E7E0]">Drag to explore · scroll to zoom · select a signal</p></div>
  </div>;
}

export function WorldSignalMap({ signals, activeSignalId, onSelect, feedStatus, activeWindow }: WorldSignalMapProps) {
  const [googleReady, setGoogleReady] = useState(false);
  const [googleFailed, setGoogleFailed] = useState(false);
  const [query, setQuery] = useState("");
  const mapRef = useRef<google.maps.Map | null>(null);
  const overlaysRef = useRef<Array<{ setMap: (map: google.maps.Map | null) => void }>>([]);
  const searchMarkerRef = useRef<google.maps.Marker | null>(null);

  useEffect(() => {
    if (!googleReady || !mapRef.current || !window.google?.maps) return;
    overlaysRef.current.forEach(overlay => overlay.setMap?.(null));
    overlaysRef.current = [];
    const map = mapRef.current;
    const markers = signals.map(signal => {
      const marker = new window.google.maps.Marker({
        map,
        position: { lat: signal.lat, lng: signal.lng },
        title: `${signal.city} · AQI ${signal.aqi}`,
        label: { text: signal.city, color: "#F3F7F1", fontSize: signal.id === activeSignalId ? "12px" : "10px", fontWeight: "700" },
        icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: signal.id === activeSignalId ? 10 : 7, fillColor: signal.color, fillOpacity: 0.96, strokeColor: "#082330", strokeWeight: 2 },
      });
      marker.addListener("click", () => onSelect(signal));
      return marker;
    });
    const corridorLines = signals.map(signal => new window.google.maps.Polyline({ map, path: [BRICS_HUB, { lat: signal.lat, lng: signal.lng }], geodesic: true, strokeColor: signal.color, strokeOpacity: 0.38, strokeWeight: signal.id === activeSignalId ? 2.5 : 1.3, icons: [{ icon: { path: "M 0,-1 0,1", strokeOpacity: 0.8, scale: 3 }, offset: "0", repeat: "14px" }] }));
    const hub = new window.google.maps.Marker({ map, position: BRICS_HUB, title: "BRICS corridor network", label: { text: "BRICS NETWORK", color: "#C6DED7", fontSize: "10px", fontWeight: "700" }, icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: "#A8E0CF", fillOpacity: 0.95, strokeColor: "#082330", strokeWeight: 2 } });
    overlaysRef.current = [...markers, ...corridorLines, hub];
    return () => { overlaysRef.current.forEach(overlay => overlay.setMap?.(null)); overlaysRef.current = []; };
  }, [activeSignalId, googleReady, onSelect, signals]);

  const searchPlace = () => {
    const text = query.trim();
    if (!text || !mapRef.current || !window.google?.maps) return;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: text }, (results, status) => {
      const result = results?.[0];
      if (status === "OK" && result) {
        mapRef.current?.panTo(result.geometry.location);
        mapRef.current?.setZoom(9);
        searchMarkerRef.current?.setMap(null);
        searchMarkerRef.current = new window.google.maps.Marker({ map: mapRef.current, position: result.geometry.location, title: result.formatted_address, animation: window.google.maps.Animation.DROP });
      }
    });
  };

  return <div className="world-map-shell relative min-h-[430px] overflow-hidden rounded-[30px] border border-[#DCEAE2]/12 bg-[#071E2C] shadow-[0_25px_60px_rgba(0,0,0,.24)]">
    {!googleFailed && <><MapView className={`absolute inset-0 h-full min-h-[430px] ${googleReady ? "opacity-100" : "opacity-0"}`} initialCenter={{ lat: 20, lng: 20 }} initialZoom={2} onMapReady={map => { mapRef.current = map; setGoogleReady(true); }} onMapError={() => setGoogleFailed(true)} /><div className={`absolute inset-0 transition-opacity ${googleReady ? "pointer-events-none opacity-100" : "opacity-0"}`}><MapLegend activeWindow={activeWindow} feedStatus={feedStatus} googleMode /></div></>}
    {(googleFailed || !googleReady) && <AtlasFallback signals={signals} activeSignalId={activeSignalId} onSelect={onSelect} feedStatus={feedStatus} activeWindow={activeWindow} />}
    {googleReady && <div className="absolute left-4 top-16 z-20 flex w-[min(310px,calc(100%-2rem))] gap-2 rounded-xl border border-white/20 bg-[#08212E]/90 p-2 shadow-lg backdrop-blur-md"><input value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => { if (event.key === "Enter") searchPlace(); }} placeholder="Search any city or place" aria-label="Search any city or place" className="min-w-0 flex-1 bg-transparent px-2 text-xs text-white outline-none placeholder:text-[#9FBAB3]" /><button onClick={searchPlace} className="rounded-lg bg-[#A8E0CF] px-3 py-2 text-[10px] font-extrabold uppercase tracking-[.08em] text-[#082330]">Go</button></div>}
    {googleReady && <div className="absolute bottom-4 left-4 z-20 rounded-xl border border-white/15 bg-[#08212E]/90 px-3 py-2.5 text-xs text-[#D8E7E0] backdrop-blur-md">Google Maps explorer · search, zoom, satellite, street view</div>}
  </div>;
}
