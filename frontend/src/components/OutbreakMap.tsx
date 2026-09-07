import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import { AlertOctagon, ShieldAlert, Layers, Filter, CheckCircle2, Crosshair } from "lucide-react";
import { Language, translations } from "../locales/i18n";
import { api } from "../services/api";

const createPulsingMarkerIcon = (urgency: string) => {
  let className = "custom-pin-normal";
  let size = 12;
  if (urgency === "CRITICAL") {
    className = "custom-pin-critical";
    size = 16;
  } else if (urgency === "HIGH") {
    className = "custom-pin-high";
    size = 14;
  }

  return L.divIcon({
    className: "",
    html: `<div class="${className}"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
};

interface OutbreakMapProps {
  lang?: Language;
}

export const OutbreakMap: React.FC<OutbreakMapProps> = ({ lang = "en" }) => {
  const t = translations[lang];
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDisease, setSelectedDisease] = useState<string>("");

  useEffect(() => {
    loadOutbreaks();
  }, [selectedDisease]);

  const loadOutbreaks = async () => {
    setLoading(true);
    try {
      const res = await api.fetchOutbreaks(30, selectedDisease || undefined);
      setData(res);
    } catch (e) {
      console.error("Outbreak map fetch failed", e);
    } finally {
      setLoading(false);
    }
  };

  const center: [number, number] = [22.5645, 72.9289];

  return (
    <div className="bg-[#09110d]/85 backdrop-blur-md border border-[#1b2b20] rounded-[2px] p-5 space-y-4 font-sans shadow-lg">
      {/* GIS Console Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1b2b20]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-[2px] bg-[#14080a] text-[#b5555f] border border-[#b5555f]/40 flex items-center justify-center font-bold">
              <Crosshair size={13} />
            </div>
            <h3 className="font-mono text-xs font-semibold text-[#84ba90] uppercase tracking-wider">
              {t.spatialTelemetryTitle || "GIS_EPIDEMIOLOGICAL_SURVEILLANCE // SPATIAL_TELEMETRY"}
            </h3>
          </div>
          <p className="text-xs text-[#8a9990]">
            {t.spatialTelemetryDesc || "Anand district livestock cluster tracking with active transmission vectors (30-day temporal window)."}
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <Filter size={12} className="text-[#8a9990]" />
          <select
            value={selectedDisease}
            onChange={(e) => setSelectedDisease(e.target.value)}
            className="text-xs border border-[#1b2b20] rounded-[2px] px-3 py-1.5 text-[#e8e6df] focus:outline-none focus:border-[#5a8f66] bg-[#050a07] cursor-pointer"
          >
            <option value="">{t.allNotifiableDiseases || "ALL NOTIFIABLE DISEASES"}</option>
            <option value="LUMPY_SKIN_DISEASE">LUMPY SKIN DISEASE (LSD)</option>
            <option value="FOOT_AND_MOUTH_DISEASE">FOOT & MOUTH DISEASE (FMD)</option>
            <option value="BLACKLEG">BLACKLEG (BQ)</option>
            <option value="BOVINE_MASTITIS">CLINICAL MASTITIS</option>
          </select>
        </div>
      </div>

      {/* Outbreak Alert Banners */}
      <AnimatePresence>
        {data?.outbreak_alerts && data.outbreak_alerts.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {data.outbreak_alerts.map((alert: any, idx: number) => (
              <div key={idx} className="bg-[#14080a] border-l-2 border-[#b5555f] p-3.5 rounded-[2px] flex items-start gap-3 text-xs font-mono">
                <ShieldAlert className="text-[#b5555f] shrink-0 mt-0.5" size={15} />
                <div className="space-y-0.5">
                  <p className="font-bold text-[#b5555f] uppercase tracking-wider text-[11px]">
                    {alert.alert_level} // {alert.district} ({alert.state}) · {alert.case_count} CONFIRMED CASES
                  </p>
                  <p className="text-[#e8e6df] text-xs leading-relaxed">{alert.recommended_action}</p>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leaflet Map Canvas */}
      <div className="h-[440px] w-full rounded-[2px] overflow-hidden border border-[#1b2b20] relative bg-[#050a07]">
        {loading && (
          <div className="absolute inset-0 bg-[#050806]/80 z-20 flex items-center justify-center text-xs font-mono text-[#84ba90] backdrop-blur-xs">
            INGESTING_GIS_COORDINATES_AND_CLUSTERS...
          </div>
        )}

        <MapContainer center={center} zoom={10} scrollWheelZoom={false} style={{ height: "100%", width: "100%", background: "#050a07" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Buffer ring around district center */}
          <Circle
            center={center}
            radius={8500}
            pathOptions={{ color: "#b5555f", fillColor: "#b5555f", fillOpacity: 0.08, weight: 1, dashArray: "4, 4" }}
          />

          {data?.features?.map((f: any, idx: number) => {
            const coords = f.geometry.coordinates;
            const props = f.properties;

            return (
              <Marker
                key={idx}
                position={[coords[1], coords[0]]}
                icon={createPulsingMarkerIcon(props.urgency_level)}
              >
                <Popup>
                  <div className="text-xs space-y-1 p-1 font-mono text-[#e8e6df]">
                    <strong className="block text-[#84ba90] font-semibold">{props.disease_code}</strong>
                    <span className="text-[10px] bg-[#050a07] text-[#c5d2ca] px-1.5 py-0.5 rounded-[2px] block border border-[#1b2b20]">
                      URGENCY: {props.urgency_level}
                    </span>
                    <span className="text-[10px] text-[#8a9990] block">
                      VILLAGE: {props.village || "RURAL"} | STATUS: {props.status}
                    </span>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Map Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] font-mono text-[#8a9990] pt-2 border-t border-[#1b2b20] gap-2">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5 text-[#e8e6df]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#b5555f] inline-block shadow-[0_0_6px_#b5555f]"></span>
            {t.criticalCluster || "CRITICAL_CLUSTER (EPIDEMIC)"}
          </span>
          <span className="flex items-center gap-1.5 text-[#e8e6df]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#c17a35] inline-block"></span>
            {t.highUrgencyLegend || "HIGH_URGENCY (LSD)"}
          </span>
          <span className="flex items-center gap-1.5 text-[#e8e6df]">
            <span className="w-2 h-2 rounded-full bg-[#5a8f66] inline-block shadow-[0_0_6px_rgba(90,143,102,0.4)]"></span>
            {t.routineMonitoring || "ROUTINE_MONITORING"}
          </span>
        </div>
        <span className="text-[#c5d2ca]">
          {t.analyzedCases || "ANALYZED_CASES:"} {data?.total_cases_analyzed || 0}
        </span>
      </div>
    </div>
  );
};