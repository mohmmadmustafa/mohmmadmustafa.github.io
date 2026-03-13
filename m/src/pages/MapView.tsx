import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import { ArrowLeft, MapPin } from "lucide-react";
import { RoutingResult } from "@/types";

interface MapState {
  incidentLat: number;
  incidentLon: number;
  results: RoutingResult[];
  selectedId: string;
}

declare global {
  interface Window {
    L: typeof import("leaflet");
  }
}

const rankColors = ["#F59E0B", "#3B82F6", "#6B7280"];

const MapView = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);

  const state = location.state as MapState | null;

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    if (!state) return;

    // Dynamically load Leaflet CSS + JS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => {
      const L = window.L;
      if (!mapRef.current || mapInstanceRef.current) return;

      const map = L.map(mapRef.current).setView(
        [state.incidentLat, state.incidentLon],
        11
      );
      mapInstanceRef.current = map;
      

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      // Incident Marker
      const incidentIcon = L.divIcon({
        html: `<div style="background:#EF4444;width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.6)"></div>`,
        className: "",
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      L.marker([state.incidentLat, state.incidentLon], { icon: incidentIcon })
        .addTo(map)
        .bindPopup("<b>🚨 Incident Location</b>")
        .openPopup();

      // For each hospital result: draw route + marker
      state.results.forEach((result, index) => {
        const isSelected = result.hospital.Hospital_ID === state.selectedId;
        const color = rankColors[index] || "#6B7280";
        const size = isSelected ? 22 : 15;

        // Hospital marker
        const hospitalIcon = L.divIcon({
          html: `<div style="background:${color};width:${size}px;height:${size}px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;color:black;font-size:10px;font-weight:bold;">${index + 1}</div>`,
          className: "",
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });

        const label = index === 0 ? "Primary" : `Backup ${index}`;
        const durationText = result.duration > 0
          ? `${result.duration} min${result.isFallback ? " (est.)" : ""}`
          : "";

        L.marker([result.hospital.Latitude, result.hospital.Longitude], {
          icon: hospitalIcon,
        })
          .addTo(map)
          .bindPopup(
            `<div style="min-width:190px;font-family:system-ui,sans-serif">
              <div style="font-weight:700;font-size:13px;margin-bottom:4px">${result.hospital.Hospital_Name}</div>
              <div style="color:#6B7280;font-size:12px;margin-bottom:2px">${label} · ${result.distance.toFixed(1)} km</div>
              ${durationText ? `<div style="font-size:12px;color:#374151">🕒 ${durationText}</div>` : ""}
              <div style="font-size:12px;margin-top:4px">Status: <b>${result.hospital.Status}</b></div>
              <div style="font-size:12px">Diversion: <b>${result.hospital.Diversion_Status}</b></div>
            </div>`
          );

        // Draw route geometry if available (real road path), otherwise fallback polyline
        if (result.routeGeometry && result.routeGeometry.length > 1) {
          L.polyline(result.routeGeometry, {
            color,
            weight: isSelected ? 5 : 3,
            opacity: isSelected ? 0.9 : 0.5,
          }).addTo(map);
        } else {
          // Fallback: straight dashed line
          L.polyline(
            [
              [state.incidentLat, state.incidentLon],
              [result.hospital.Latitude, result.hospital.Longitude],
            ],
            {
              color,
              weight: isSelected ? 3 : 1.5,
              opacity: isSelected ? 0.8 : 0.4,
              dashArray: "8 5",
            }
          ).addTo(map);
        }
      });

      // Fit map to all points
      const allPoints: [number, number][] = [
        [state.incidentLat, state.incidentLon],
        ...state.results.map((r) => [r.hospital.Latitude, r.hospital.Longitude] as [number, number]),
      ];
      map.fitBounds(allPoints, { padding: [50, 50] });
    };
    document.head.appendChild(script);

    return () => {
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
        mapInstanceRef.current = null;
      }
    };
  }, [state]);

  if (!state) {
    return (
      <div className="min-h-screen bg-[hsl(var(--bg))] flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-10 h-10 text-[hsl(var(--text-muted))] mx-auto mb-3" />
          <p className="text-[hsl(var(--text-muted))]">No routing data available.</p>
          <button
            onClick={() => navigate("/routing")}
            className="mt-4 text-[hsl(var(--brand))] text-sm hover:underline"
          >
            Start a new routing decision
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--bg))] flex flex-col">
      {/* Top Bar */}
      <div className="bg-[hsl(var(--surface-dark))] border-b border-[hsl(var(--border-strong))] px-4 py-3 flex items-center gap-3 flex-wrap">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-[hsl(var(--text-muted))] hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="h-4 w-px bg-[hsl(var(--border-strong))]" />
        <h1 className="text-white font-bold text-sm">Road Route Map</h1>
        <div className="ml-auto flex items-center gap-3 flex-wrap">
          <LegendItem color="#EF4444" label="Incident" />
          {state.results.map((r, i) => (
            <LegendItem
              key={r.hospital.Hospital_ID}
              color={rankColors[i]}
              label={i === 0 ? "Primary" : `Backup ${i}`}
            />
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative" style={{ minHeight: "calc(100vh - 160px)" }}>
        <div ref={mapRef} className="absolute inset-0" />
      </div>

      {/* Hospital Summary Footer */}
      <div className="bg-[hsl(var(--surface-dark))] border-t border-[hsl(var(--border-strong))] p-3">
        <div className="max-w-4xl mx-auto flex gap-3 overflow-x-auto pb-1">
          {state.results.map((result, i) => (
            <div
              key={result.hospital.Hospital_ID}
              className="flex-shrink-0 bg-[hsl(var(--surface))] border border-[hsl(var(--border-strong))] rounded-lg px-4 py-2.5 min-w-[210px]"
            >
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-black flex-shrink-0"
                  style={{ background: rankColors[i] }}
                >
                  {i + 1}
                </div>
                <span className="text-white font-medium text-xs truncate">
                  {result.hospital.Hospital_Name}
                </span>
              </div>
              <div className="text-[hsl(var(--text-muted))] text-xs flex items-center gap-2">
                <span>{result.distance.toFixed(1)} km</span>
                {result.duration > 0 && (
                  <>
                    <span>·</span>
                    <span className="text-[hsl(var(--brand))]">
                      {result.duration} min{result.isFallback ? " est." : ""}
                    </span>
                  </>
                )}
                <span>·</span>
                <span>{result.hospital.Emirate}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const LegendItem = ({ color, label }: { color: string; label: string }) => (
  <div className="flex items-center gap-1.5">
    <div className="w-3 h-3 rounded-full border border-white/30" style={{ background: color }} />
    <span className="text-[hsl(var(--text-muted))] text-xs">{label}</span>
  </div>
);

export default MapView;
