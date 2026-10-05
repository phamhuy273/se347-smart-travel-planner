<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { usePlannerStore } from '@/stores/plannerStore';
import { Layers, Maximize2, MapPin } from 'lucide-vue-next';

interface MarkerRecord {
  marker: mapboxgl.Marker;
  badgeEl: HTMLElement;
  lngLat: [number, number];
}

const plannerStore = usePlannerStore();
const mapContainer = ref<HTMLElement | null>(null);
let map: mapboxgl.Map | null = null;
const markersMap = new Map<string, MarkerRecord>();
let resizeObserver: ResizeObserver | null = null;
let isInitialFitDone = false;

// Fallback high-definition Map Tile style (Free CartoDB Voyager style if Mapbox token is absent)
const freeCartoStyle: mapboxgl.Style = {
  version: 8,
  sources: {
    'carto-tiles': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
        'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
        'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
      ],
      tileSize: 256,
      attribution: '&copy; CARTO &copy; OpenStreetMap',
    },
  },
  layers: [
    {
      id: 'carto-tiles-layer',
      type: 'raster',
      source: 'carto-tiles',
      minzoom: 0,
      maxzoom: 22,
    },
  ],
};

const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

onMounted(() => {
  if (!mapContainer.value) return;

  const hasValidToken = mapboxToken && mapboxToken.startsWith('pk.');
  if (hasValidToken) {
    mapboxgl.accessToken = mapboxToken;
  }

  map = new mapboxgl.Map({
    container: mapContainer.value,
    style: hasValidToken ? 'mapbox://styles/mapbox/streets-v12' : freeCartoStyle,
    center: [108.22, 16.06], // Center on Da Nang
    zoom: 11.5,
  });

  map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');

  map.on('load', () => {
    reconcileMarkersAndRoutes(true); // First load fitBounds
  });

  // Watch for container resize (when panels toggle or user drags resize handle)
  resizeObserver = new ResizeObserver(() => {
    map?.resize();
  });
  resizeObserver.observe(mapContainer.value);
});

onUnmounted(() => {
  if (resizeObserver && mapContainer.value) {
    resizeObserver.unobserve(mapContainer.value);
    resizeObserver.disconnect();
  }
  // Clean up markers
  markersMap.forEach((rec) => rec.marker.remove());
  markersMap.clear();
  if (map) {
    map.remove();
    map = null;
  }
});

// ─── High Performance Marker Reconciliation (Diffing O(N)) ──────────────────
const reconcileMarkersAndRoutes = (shouldFitBounds = false) => {
  if (!map || !map.isStyleLoaded()) return;

  const places = plannerStore.allMapPlaces;
  const currentPlaceIds = new Set(places.map((p) => p.id));

  // 1. Remove obsolete markers (places deleted from store)
  for (const [id, rec] of markersMap.entries()) {
    if (!currentPlaceIds.has(id)) {
      rec.marker.remove();
      markersMap.delete(id);
    }
  }

  // 2. Add or Update markers
  const bounds = new mapboxgl.LngLatBounds();
  const dayCoordinates: Record<number, { coords: [number, number][]; color: string }> = {};

  places.forEach((place, index) => {
    const lngLat: [number, number] = [place.longitude, place.latitude];
    bounds.extend(lngLat);

    // Group coordinates for route lines
    if (place.dayNumber) {
      if (!dayCoordinates[place.dayNumber]) {
        dayCoordinates[place.dayNumber] = {
          coords: [],
          color: place.dayColor || '#3B82F6',
        };
      }
      dayCoordinates[place.dayNumber].coords.push(lngLat);
    }

    const isSelected = plannerStore.activePlaceId === place.id;
    const existing = markersMap.get(place.id);

    if (existing) {
      // Update existing marker position & badge without destroying DOM
      if (existing.lngLat[0] !== lngLat[0] || existing.lngLat[1] !== lngLat[1]) {
        existing.marker.setLngLat(lngLat);
        existing.lngLat = lngLat;
      }
      // Update badge style
      existing.badgeEl.style.backgroundColor = place.dayColor || '#3B82F6';
      existing.badgeEl.style.width = isSelected ? '34px' : '26px';
      existing.badgeEl.style.height = isSelected ? '34px' : '26px';
      existing.badgeEl.style.fontSize = isSelected ? '12px' : '10px';
      existing.badgeEl.textContent = `${index + 1}`;
    } else {
      // Create new marker DOM
      const el = document.createElement('div');
      el.className = 'custom-map-marker select-none';

      const badge = document.createElement('div');
      badge.style.cssText = `
        background-color: ${place.dayColor || '#3B82F6'};
        color: white;
        width: ${isSelected ? '34px' : '26px'};
        height: ${isSelected ? '34px' : '26px'};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: ${isSelected ? '12px' : '10px'};
        box-shadow: 0 4px 10px rgba(0,0,0,0.25);
        border: 2px solid white;
        cursor: pointer;
        transition: transform 0.15s ease, width 0.15s ease, height 0.15s ease;
      `;
      badge.textContent = `${index + 1}`;
      el.appendChild(badge);

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        plannerStore.setActivePlace(place.id);
      });

      const popup = new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML(`
        <div style="font-family: sans-serif; padding: 2px;">
          <h4 style="font-weight: 700; font-size: 12px; margin: 0 0 2px 0; color: #0F172A;">${place.placeName}</h4>
          <p style="font-size: 10px; color: #64748B; margin: 0;">${place.formattedAddress || ''}</p>
        </div>
      `);

      const marker = new mapboxgl.Marker(el)
        .setLngLat(lngLat)
        .setPopup(popup)
        .addTo(map!);

      markersMap.set(place.id, { marker, badgeEl: badge, lngLat });
    }
  });

  // 3. Update GeoJSON Route Polylines (Smooth lines connecting daily itinerary stops)
  updateRouteLayers(dayCoordinates);

  // 4. Fit bounds only on initial load or explicit request (prevents camera jumps)
  if (shouldFitBounds && places.length > 0 && !bounds.isEmpty()) {
    map.fitBounds(bounds, { padding: 60, maxZoom: 14, duration: 800 });
    isInitialFitDone = true;
  }
};

// ─── GeoJSON Route Polylines by Day ──────────────────────────────────────────
const updateRouteLayers = (dayCoordinates: Record<number, { coords: [number, number][]; color: string }>) => {
  if (!map) return;

  // Max 10 days supported for route overlays
  for (let dayNum = 1; dayNum <= 10; dayNum++) {
    const sourceId = `route-source-day-${dayNum}`;
    const layerId = `route-layer-day-${dayNum}`;
    const dayData = dayCoordinates[dayNum];

    const geojsonData: any = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: dayData && dayData.coords.length >= 2 ? dayData.coords : [],
      },
    };

    const existingSource = map.getSource(sourceId) as mapboxgl.GeoJSONSource | undefined;
    if (existingSource) {
      existingSource.setData(geojsonData);
    } else if (dayData && dayData.coords.length >= 2) {
      map.addSource(sourceId, {
        type: 'geojson',
        data: geojsonData,
      });

      map.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': dayData.color,
          'line-width': 3.5,
          'line-opacity': 0.8,
          'line-dasharray': [2, 1.5],
        },
      });
    }
  }
};

// Explicit Zoom to Fit all markers
const fitAllMarkers = () => {
  if (!map) return;
  const places = plannerStore.allMapPlaces;
  if (places.length === 0) return;
  const bounds = new mapboxgl.LngLatBounds();
  places.forEach((p) => bounds.extend([p.longitude, p.latitude]));
  map.fitBounds(bounds, { padding: 60, maxZoom: 14.5, duration: 800 });
};

// Watch active place selection -> smoothly fly to marker
watch(
  () => plannerStore.activePlaceId,
  (newId) => {
    if (!newId || !map) return;
    const place = plannerStore.allMapPlaces.find((p) => p.id === newId);
    if (place) {
      map.flyTo({ center: [place.longitude, place.latitude], zoom: 14.5, duration: 600 });
      const rec = markersMap.get(newId);
      if (rec) {
        rec.marker.togglePopup();
      }
    }
  }
);

// Watch places changes -> reconcile markers without jumping camera
watch(
  () => plannerStore.allMapPlaces,
  () => {
    reconcileMarkersAndRoutes(!isInitialFitDone);
  },
  { deep: true }
);
</script>

<template>
  <div class="relative w-full h-full overflow-hidden bg-slate-100 flex flex-col">
    <!-- Map Canvas -->
    <div ref="mapContainer" class="w-full h-full"></div>

    <!-- Top Overlay Badge -->
    <div class="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-md border border-white/60 flex items-center gap-2">
      <div class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
      <span class="text-xs font-bold text-slate-800">Mapbox GL JS Engine</span>
    </div>

    <!-- Floating Fit Bounds Button -->
    <button
      class="absolute top-4 right-4 z-10 bg-white/90 hover:bg-white hover:text-brand-blue backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-md border border-slate-200/80 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition"
      title="Căn chỉnh toàn cảnh lịch trình"
      @click="fitAllMarkers"
    >
      <Maximize2 class="w-3.5 h-3.5 text-slate-500" />
      <span>Toàn cảnh</span>
    </button>
  </div>
</template>

<style>
.mapboxgl-popup-content {
  border-radius: 16px !important;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1) !important;
  border: 1px solid rgba(226, 232, 240, 0.8) !important;
}
</style>
