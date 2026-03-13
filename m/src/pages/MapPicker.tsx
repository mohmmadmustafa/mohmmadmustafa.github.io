import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, CheckCircle } from "lucide-react";

declare global {
  interface Window {
    L: typeof import("leaflet");
  }
}

const MapPicker = () => {
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const markerRef = useRef<unknown>(null);
  const [picked, setPicked] = useState<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Load Leaflet CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    // Load Leaflet JS
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => {
      const L = window.L;
      if (!mapRef.current || mapInstanceRef.current) return;

      const map = L.map(mapRef.current).setView([25.3463, 55.4209], 10);
      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      const incidentIcon = L.divIcon({
        html: `<div style="background:#EF4444;width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.7)"></div>`,
        className: "",
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      map.on("click", (e: { latlng: { lat: number; lng: number } }) => {
        const { lat, lng } = e.latlng;

        // Remove existing marker
        if (markerRef.current) {
          (markerRef.current as { remove: () => void }).remove();
          markerRef.current = null;
        }

        // Place new marker
        const marker = L.marker([lat, lng], { icon: incidentIcon })
          .addTo(map)
          .bindPopup(
            `<div style="font-family:system-ui,sans-serif;font-size:13px;">
              <b>🚨 Incident Location</b><br/>
              <span style="color:#6B7280;">Lat: ${lat.toFixed(6)}</span><br/>
              <span style="color:#6B7280;">Lon: ${lng.toFixed(6)}</span>
            </div>`
          )
          .openPopup();

        markerRef.current = marker;
        setPicked({ lat: parseFloat(lat.toFixed(6)), lon: parseFloat(lng.toFixed(6)) });
      });
    };
    document.head.appendChild(script);

    return () => {
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const handleConfirm = () => {
    if (!picked) return;
    navigate("/routing", {
      state: {
        pickedLat: picked.lat,
        pickedLon: picked.lon,
      },
    });
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--bg))] flex flex-col">
      {/* Top Bar */}
      <div className="bg-[hsl(var(--surface-dark))] border-b border-[hsl(var(--border-strong))] px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-[hsl(var(--text-muted))] hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="h-4 w-px bg-[hsl(var(--border-strong))]" />
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[hsl(var(--brand))]" />
          <h1 className="text-white font-bold text-sm">Pick Incident Location</h1>
        </div>
      </div>

      {/* Instruction Banner */}
      <div className="bg-[hsl(var(--surface))] border-b border-[hsl(var(--border-strong))] px-4 py-2.5 flex items-center justify-between gap-4 flex-shrink-0">
        <p className="text-[hsl(var(--text-muted))] text-sm flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[hsl(var(--brand))] flex-shrink-0" />
          Click anywhere on the map to select the incident location.
        </p>
        {picked && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-[hsl(var(--text-muted))] font-mono hidden sm:block">
              {picked.lat}, {picked.lon}
            </span>
            <button
              onClick={handleConfirm}
              className="flex items-center gap-1.5 bg-[hsl(var(--brand))] text-black font-bold text-sm px-4 py-2 rounded-lg hover:bg-[hsl(var(--brand-hover))] transition-colors whitespace-nowrap"
            >
              <CheckCircle className="w-4 h-4" />
              Confirm Location
            </button>
          </div>
        )}
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="absolute inset-0" />

        {/* Coordinate readout overlay (shown after pick) */}
        {picked && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[hsl(var(--surface-dark))]/95 border border-[hsl(var(--brand))]/50 rounded-xl px-5 py-3 shadow-xl z-[1000] flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0" />
            <div>
              <div className="text-white font-bold text-sm">Incident Location Selected</div>
              <div className="text-[hsl(var(--text-muted))] text-xs font-mono mt-0.5">
                Lat: {picked.lat} · Lon: {picked.lon}
              </div>
            </div>
            <button
              onClick={handleConfirm}
              className="ml-2 bg-[hsl(var(--brand))] text-black font-bold text-xs px-3 py-1.5 rounded-lg hover:bg-[hsl(var(--brand-hover))] transition-colors flex items-center gap-1"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Use This
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapPicker;
