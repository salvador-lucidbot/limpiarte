"use client";

import type { Map as LeafletMap, Marker } from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import { IconMapPin, IconSearch } from "../icons";

const BOGOTA: [number, number] = [4.6533, -74.0836];
const NOMINATIM = "https://nominatim.openstreetmap.org";

export interface PickedLocation {
  latitude: number;
  longitude: number;
  line1: string;
  city: string;
  state: string;
}

interface LocationPickerProps {
  value: PickedLocation | null;
  onChange: (location: PickedLocation) => void;
}

interface NominatimAddress {
  road?: string;
  house_number?: string;
  neighbourhood?: string;
  suburb?: string;
  city?: string;
  town?: string;
  municipality?: string;
  state?: string;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  address?: NominatimAddress;
}

function toLocation(result: NominatimResult): PickedLocation {
  const address = result.address ?? {};
  const street = [address.road, address.house_number].filter(Boolean).join(" ");
  const area = address.neighbourhood ?? address.suburb ?? "";
  return {
    latitude: Number(result.lat),
    longitude: Number(result.lon),
    line1: [street, area].filter(Boolean).join(", ") || result.display_name.split(",").slice(0, 2).join(", "),
    city: address.city ?? address.town ?? address.municipality ?? "",
    state: address.state ?? ""
  };
}

export function LocationPicker({ value, onChange }: LocationPickerProps): React.ReactNode {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init(): Promise<void> {
      const leaflet = await import("leaflet");
      if (cancelled || !containerRef.current || mapRef.current) return;

      const start: [number, number] = value ? [value.latitude, value.longitude] : BOGOTA;
      const map = leaflet.map(containerRef.current).setView(start, value ? 17 : 12);
      leaflet
        .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19
        })
        .addTo(map);

      const icon = leaflet.divIcon({
        className: "",
        html: '<span style="display:block;width:22px;height:22px;border-radius:9999px;background:#29abe2;border:3px solid #fff;box-shadow:0 4px 12px rgba(14,47,70,0.45)"></span>',
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });

      const marker = leaflet.marker(start, { draggable: true, icon }).addTo(map);
      mapRef.current = map;
      markerRef.current = marker;

      marker.on("dragend", () => {
        const position = marker.getLatLng();
        void reverseGeocode(position.lat, position.lng);
      });

      map.on("click", (event: { latlng: { lat: number; lng: number } }) => {
        marker.setLatLng(event.latlng);
        void reverseGeocode(event.latlng.lat, event.latlng.lng);
      });

      setTimeout(() => map.invalidateSize(), 200);
    }

    void init();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  async function reverseGeocode(latitude: number, longitude: number): Promise<void> {
    setNotice(null);
    try {
      const response = await fetch(`${NOMINATIM}/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&accept-language=es`);
      const result = (await response.json()) as NominatimResult;
      onChange({ ...toLocation(result), latitude, longitude });
    } catch {
      onChange({ latitude, longitude, line1: "", city: "", state: "" });
      setNotice("No pudimos leer la dirección automáticamente. Completa los campos a mano.");
    }
  }

  async function search(): Promise<void> {
    if (!query.trim()) return;
    setSearching(true);
    setNotice(null);
    try {
      const response = await fetch(
        `${NOMINATIM}/search?format=jsonv2&addressdetails=1&countrycodes=co&limit=1&accept-language=es&q=${encodeURIComponent(query)}`
      );
      const results = (await response.json()) as NominatimResult[];
      const first = results[0];
      if (!first) {
        setNotice("No encontramos esa dirección. Ubica el punto manualmente en el mapa.");
        return;
      }

      const location = toLocation(first);
      onChange(location);
      mapRef.current?.setView([location.latitude, location.longitude], 17);
      markerRef.current?.setLatLng([location.latitude, location.longitude]);
    } catch {
      setNotice("No pudimos buscar la dirección. Ubica el punto manualmente en el mapa.");
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            void search();
          }}
          placeholder="Busca tu dirección: Carrera 64 #40-51, Medellín"
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        />
        <button
          type="button"
          onClick={() => void search()}
          disabled={searching}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
        >
          <IconSearch size={16} />
          {searching ? "Buscando…" : "Buscar"}
        </button>
      </div>

      <div ref={containerRef} className="h-72 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100" />

      <p className="flex items-start gap-1.5 text-xs text-slate-500">
        <IconMapPin size={14} className="mt-0.5 shrink-0 text-brand-500" />
        Arrastra el punto o toca el mapa para ajustar la ubicación exacta de la entrega.
      </p>
      {notice && <p className="text-xs text-amber-700">{notice}</p>}
    </div>
  );
}
