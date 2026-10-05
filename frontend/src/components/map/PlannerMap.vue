<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { usePlannerStore } from '@/stores/plannerStore';
import { Maximize2, Key, ExternalLink, Check, AlertCircle } from 'lucide-vue-next';

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

// Token state & Live preview input
const envToken = import.meta.env.VITE_MAPBOX_TOKEN || '';
const isDummyToken = !envToken || envToken.includes('wanderflow_dev_token') || envToken.includes('dev-user');
const currentToken = ref(isDummyToken ? '' : envToken);
const showTokenBanner = ref(isDummyToken);
const inputToken = ref('');

const initMap = (tokenToUse: string) => {
  if (!mapContainer.value) return;

  // Clean up existing map instance if reloading
  if (map) {
    markersMap.forEach((rec) => rec.marker.remove());
    markersMap.clear();
    map.remove();
    map = null;
  }

  if (tokenToUse && tokenToUse.startsWith('pk.')) {
    mapboxgl.accessToken = tokenToUse;
    showTokenBanner.value = false;
  } else {
    showTokenBanner.value = true;
    return;
  }

  try {
    map = new mapboxgl.Map({
      container: mapContainer.value,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [108.22, 16.06], // Center on Da Nang
      zoom: 11.5,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');

    map.on('load', () => {
      showTokenBanner.value = false;
      reconcileMarkersAndRoutes(true);
    });

    map.on('error', (e: any) => {
      // Catch 401 unauthorized or invalid token error
      if (e?.error?.status === 401 || e?.status === 401 || (typeof e?.error?.message === 'string' && e.error.message.includes('token'))) {
        showTokenBanner.value = true;
      }
    });
  } catch {
    showTokenBanner.value = true;
  }
};

const applyLiveToken = () => {
  const token = inputToken.value.trim();
  if (!token.startsWith('pk.')) {
    alert('Token Mapbox phải bắt đầu bằng "pk."');
    return;
  }
  currentToken.value = token;
  initMap(token);
};

onMounted(() => {
  if (currentToken.value && !isDummyToken) {
    initMap(currentToken.value);
  } else {
    showTokenBanner.value = true;
  }

  if (mapContainer.value) {
    resizeObserver = new ResizeObserver(() => {
      map?.resize();
    });
    resizeObserver.observe(mapContainer.value);
  }
});

onUnmounted(() => {
  if (resizeObserver && mapContainer.value) {
    resizeObserver.unobserve(mapContainer.value);
    resizeObserver.disconnect();
  }
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

  // 1. Remove obsolete markers
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
      if (existing.lngLat[0] !== lngLat[0] || existing.lngLat[1] !== lngLat[1]) {
        existing.marker.setLngLat(lngLat);
        existing.lngLat = lngLat;
      }
      existing.badgeEl.style.backgroundColor = place.dayColor || '#3B82F6';
      existing.badgeEl.style.width = isSelected ? '34px' : '26px';
      existing.badgeEl.style.height = isSelected ? '34px' : '26px';
      existing.badgeEl.style.fontSize = isSelected ? '12px' : '10px';
      existing.badgeEl.textContent = `${index + 1}`;
    } else {
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

  // 3. Update GeoJSON Route Polylines
  updateRouteLayers(dayCoordinates);

  // 4. Fit bounds on initial load
  if (shouldFitBounds && places.length > 0 && !bounds.isEmpty()) {
    map.fitBounds(bounds, { padding: 60, maxZoom: 14, duration: 800 });
    isInitialFitDone = true;
  }
};

const updateRouteLayers = (dayCoordinates: Record<number, { coords: [number, number][]; color: string }>) => {
  if (!map) return;

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
          'line-opacity': 0.85,
          'line-dasharray': [2, 1.5],
        },
      });
    }
  }
};

const fitAllMarkers = () => {
  if (!map) return;
  const places = plannerStore.allMapPlaces;
  if (places.length === 0) return;
  const bounds = new mapboxgl.LngLatBounds();
  places.forEach((p) => bounds.extend([p.longitude, p.latitude]));
  map.fitBounds(bounds, { padding: 60, maxZoom: 14.5, duration: 800 });
};

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
      <div :class="['w-2.5 h-2.5 rounded-full', showTokenBanner ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse']"></div>
      <span class="text-xs font-bold text-slate-800">Mapbox GL JS Engine</span>
    </div>

    <!-- Floating Fit Bounds Button -->
    <button
      v-if="!showTokenBanner"
      class="absolute top-4 right-4 z-10 bg-white/90 hover:bg-white hover:text-brand-blue backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-md border border-slate-200/80 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition"
      title="Căn chỉnh toàn cảnh lịch trình"
      @click="fitAllMarkers"
    >
      <Maximize2 class="w-3.5 h-3.5 text-slate-500" />
      <span>Toàn cảnh</span>
    </button>

    <!-- Mapbox Token Setup Banner (Overlay when token is missing/invalid) -->
    <div
      v-if="showTokenBanner"
      class="absolute inset-0 z-20 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-6"
    >
      <div class="bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 max-w-md w-full text-center animate-in fade-in zoom-in-95 duration-200">
        <div class="w-12 h-12 rounded-2xl bg-blue-50 text-brand-blue flex items-center justify-center mx-auto mb-3.5 shadow-xs">
          <Key class="w-6 h-6" />
        </div>

        <h3 class="text-sm font-black text-slate-900 mb-1.5">
          Kết nối Mapbox Access Token
        </h3>
        <p class="text-xs text-slate-500 leading-relaxed mb-4">
          Bản đồ tương tác và lộ trình di chuyển cần có Public Access Token từ Mapbox (hoàn toàn miễn phí).
        </p>

        <!-- Direct Live Paste Input -->
        <div class="space-y-2 mb-4 text-left">
          <label class="block text-[11px] font-bold text-slate-700">Dán Token của bạn vào đây để xem ngay:</label>
          <div class="flex gap-2">
            <input
              v-model="inputToken"
              type="text"
              placeholder="pk.eyJ1..."
              class="flex-1 bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/30 font-mono"
            />
            <button
              type="button"
              class="px-4 py-2 rounded-xl text-xs font-bold bg-brand-blue hover:bg-blue-600 text-white flex items-center gap-1 shadow-sm transition"
              @click="applyLiveToken"
            >
              <Check class="w-3.5 h-3.5" />
              <span>Áp dụng</span>
            </button>
          </div>
        </div>

        <div class="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 text-left text-[11px] text-slate-600 space-y-1.5">
          <p class="font-bold text-slate-800 flex items-center gap-1">
            <AlertCircle class="w-3.5 h-3.5 text-blue-600" />
            Cách lưu vĩnh viễn vào dự án:
          </p>
          <ol class="list-decimal list-inside space-y-1 text-slate-500 pl-1">
            <li>Lấy token miễn phí tại <a href="https://account.mapbox.com" target="_blank" class="text-brand-blue font-bold hover:underline inline-flex items-center gap-0.5">account.mapbox.com <ExternalLink class="w-2.5 h-2.5" /></a></li>
            <li>Dán vào file <code class="bg-slate-200 px-1 py-0.5 rounded text-[10px] text-slate-800">.env</code> dòng: <code class="text-blue-700">VITE_MAPBOX_TOKEN=pk.xxx</code></li>
          </ol>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.mapboxgl-popup-content {
  border-radius: 16px !important;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1) !important;
  border: 1px solid rgba(226, 232, 240, 0.8) !important;
}
</style>
