<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { usePlannerStore } from '@/stores/plannerStore';
import { calculateDistance } from '@/utils/distance.util';
import { Maximize2, ExternalLink, Check, AlertCircle, Settings, X, Layers, Route } from 'lucide-vue-next';

interface MarkerRecord {
  marker: maplibregl.Marker;
  badgeEl: HTMLElement;
  lngLat: [number, number];
}

const plannerStore = usePlannerStore();
const mapContainer = ref<HTMLElement | null>(null);
let map: maplibregl.Map | null = null;
const markersMap = new Map<string, MarkerRecord>();
let distanceMarkers: maplibregl.Marker[] = [];
let resizeObserver: ResizeObserver | null = null;
let isInitialFitDone = false;

// OpenStreetMap High-Res Basemap (100% Free, Open, No API Key Required)
const FREE_MAP_STYLE: any = {
  version: 8,
  sources: {
    'osm-tiles': {
      type: 'raster',
      tiles: [
        'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: 'osm-tiles-layer',
      type: 'raster',
      source: 'osm-tiles',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

// Token state & Live preview input
const envToken = import.meta.env.VITE_MAPBOX_TOKEN || '';
const isDummyToken = !envToken || envToken.includes('wanderflow_dev_token') || envToken.includes('dev-user');
const currentToken = ref(isDummyToken ? '' : envToken);
const showTokenModal = ref(false);
const isUsingCustomMapbox = ref(false);
const inputToken = ref(currentToken.value);

const initMap = (tokenToUse: string) => {
  if (!mapContainer.value) return;

  // Clean up existing map instance if reloading
  if (map) {
    markersMap.forEach((rec) => rec.marker.remove());
    markersMap.clear();
    map.remove();
    map = null;
  }

  const hasValidMapboxToken = Boolean(tokenToUse && tokenToUse.startsWith('pk.') && !isDummyToken);
  isUsingCustomMapbox.value = hasValidMapboxToken;

  const styleToUse = hasValidMapboxToken
    ? `https://api.mapbox.com/styles/v1/mapbox/streets-v12?access_token=${tokenToUse}`
    : FREE_MAP_STYLE;

  try {
    map = new maplibregl.Map({
      container: mapContainer.value,
      style: styleToUse,
      center: [108.22, 16.06], // Center on Da Nang
      zoom: 11.5,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

    (window as any).__map = map;

    map.on('style.load', () => {
      console.log('[Map] Style loaded successfully');
    });

    map.on('load', () => {
      console.log('[Map] Map load event fired');
      reconcileMarkersAndRoutes(true);
    });

    map.on('error', (e: any) => {
      console.error('[Map Error]', e?.error?.message || e?.message || e);
      // If Mapbox custom style fails due to 401 unauthorized, fallback to Free Carto
      if (
        isUsingCustomMapbox.value &&
        (e?.error?.status === 401 || e?.status === 401 || (typeof e?.error?.message === 'string' && e.error.message.includes('token')))
      ) {
        console.warn('Mapbox token error, falling back to OpenStreetMap style');
        isUsingCustomMapbox.value = false;
        map?.setStyle(FREE_MAP_STYLE);
      }
    });
  } catch (err) {
    console.error('Map init error:', err);
  }
};

const applyLiveToken = () => {
  const token = inputToken.value.trim();
  if (token && !token.startsWith('pk.')) {
    alert('Token Mapbox phải bắt đầu bằng "pk."');
    return;
  }
  currentToken.value = token;
  showTokenModal.value = false;
  initMap(token);
};

const switchToFreeMap = () => {
  currentToken.value = '';
  inputToken.value = '';
  showTokenModal.value = false;
  initMap('');
};

onMounted(() => {
  initMap(currentToken.value);

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
  distanceMarkers.forEach((m) => m.remove());
  distanceMarkers = [];
  markersMap.forEach((rec) => rec.marker.remove());
  markersMap.clear();
  if (map) {
    map.remove();
    map = null;
  }
});

// Computed: Total route distance for currently shown day
const totalDayDistance = computed(() => {
  const places = plannerStore.allMapPlaces;
  if (places.length < 2) return null;
  let totalKm = 0;
  for (let i = 0; i < places.length - 1; i++) {
    const p1 = places[i];
    const p2 = places[i + 1];
    if (p1.dayNumber && p2.dayNumber && p1.dayNumber === p2.dayNumber) {
      const d = calculateDistance(p1.latitude, p1.longitude, p2.latitude, p2.longitude);
      totalKm += d.km;
    }
  }
  return totalKm > 0 ? `${totalKm.toFixed(1)} km` : null;
});

// ─── High Performance Marker Reconciliation (Diffing O(N)) ──────────────────
const reconcileMarkersAndRoutes = (shouldFitBounds = false) => {
  if (!map) return;

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
  const dayCoordinates: Record<number, { coords: [number, number][]; color: string }> = {};

  places.forEach((place, index) => {
    const lngLat: [number, number] = [place.longitude, place.latitude];

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
        plannerStore.openPlaceDetail(place);
      });

      const popup = new maplibregl.Popup({ offset: 25, closeButton: false }).setHTML(`
        <div style="font-family: sans-serif; padding: 2px;">
          <h4 style="font-weight: 700; font-size: 12px; margin: 0 0 2px 0; color: #0F172A;">${place.placeName}</h4>
          <p style="font-size: 10px; color: #64748B; margin: 0;">${place.formattedAddress || ''}</p>
        </div>
      `);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat(lngLat)
        .setPopup(popup)
        .addTo(map!);

      markersMap.set(place.id, { marker, badgeEl: badge, lngLat });
    }
  });

  // 3. Update GeoJSON Route Polylines (if style is ready)
  try {
    if (map.isStyleLoaded()) {
      updateRouteLayers(dayCoordinates);
    }
  } catch (err) {
    console.warn('[Map Route Polylines Error]', err);
  }

  // 4. Update Distance Badges on Map along consecutive points
  distanceMarkers.forEach((m) => m.remove());
  distanceMarkers = [];

  if (places.length >= 2) {
    for (let i = 0; i < places.length - 1; i++) {
      const p1 = places[i];
      const p2 = places[i + 1];

      // Chỉ nối khoảng cách nếu 2 điểm cùng 1 ngày
      if (p1.dayNumber && p2.dayNumber && p1.dayNumber === p2.dayNumber) {
        const dist = calculateDistance(p1.latitude, p1.longitude, p2.latitude, p2.longitude);
        const midLng = (p1.longitude + p2.longitude) / 2;
        const midLat = (p1.latitude + p2.latitude) / 2;

        const badgeEl = document.createElement('div');
        badgeEl.className = 'distance-map-badge select-none pointer-events-none';
        badgeEl.style.cssText = `
          background-color: rgba(255, 255, 255, 0.95);
          border: 1.5px solid #CBD5E1;
          border-radius: 9999px;
          padding: 2px 8px;
          font-size: 10px;
          font-weight: 800;
          color: #0F172A;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          display: flex;
          align-items: center;
          gap: 3px;
          white-space: nowrap;
          backdrop-filter: blur(4px);
        `;
        badgeEl.innerHTML = `<span>${dist.isWalking ? '🚶' : '🚗'}</span><span>${dist.text}</span>`;

        const distMarker = new maplibregl.Marker({ element: badgeEl })
          .setLngLat([midLng, midLat])
          .addTo(map!);

        distanceMarkers.push(distMarker);
      }
    }
  }

  // 5. Fit bounds or fly to place on initial load or day switch
  if (shouldFitBounds && places.length > 0) {
    if (places.length === 1) {
      map.flyTo({
        center: [places[0].longitude, places[0].latitude],
        zoom: 14,
        duration: 700,
      });
    } else {
      const bounds = new maplibregl.LngLatBounds();
      places.forEach((p) => bounds.extend([p.longitude, p.latitude]));
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 70, maxZoom: 14, duration: 700 });
      }
    }
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

    const existingSource = map.getSource(sourceId) as maplibregl.GeoJSONSource | undefined;
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
  if (places.length === 1) {
    map.flyTo({ center: [places[0].longitude, places[0].latitude], zoom: 14, duration: 700 });
    return;
  }
  const bounds = new maplibregl.LngLatBounds();
  places.forEach((p) => bounds.extend([p.longitude, p.latitude]));
  map.fitBounds(bounds, { padding: 70, maxZoom: 14, duration: 700 });
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

// Consolidated reactivity: update markers and fit camera smoothly whenever day or places change
watch(
  () => [plannerStore.selectedDayNumber, plannerStore.allMapPlaces] as const,
  ([newDay], [oldDay]) => {
    const isDayChanged = newDay !== oldDay;
    reconcileMarkersAndRoutes(isDayChanged || !isInitialFitDone);
  },
  { deep: true }
);
</script>

<template>
  <div class="relative w-full h-full overflow-hidden bg-slate-100 flex flex-col">
    <!-- Map Canvas -->
    <div ref="mapContainer" class="w-full h-full"></div>

    <!-- Top Overlay Badge: Indicator + Engine Switcher -->
    <div class="absolute top-4 left-4 z-10 flex items-center gap-2">
      <div class="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-md border border-slate-200/80 flex items-center gap-2">
        <div class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
        <span class="text-xs font-bold text-slate-800">
          {{ isUsingCustomMapbox ? 'Mapbox Streets Engine' : 'Bản đồ Tương tác (Du lịch)' }}
        </span>
      </div>

      <button
        type="button"
        class="bg-white/95 hover:bg-white text-slate-600 hover:text-brand-blue backdrop-blur-md px-2.5 py-1.5 rounded-2xl shadow-md border border-slate-200/80 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
        title="Cấu hình Mapbox Token"
        @click="showTokenModal = true"
      >
        <Settings class="w-3.5 h-3.5 text-slate-500" />
        <span class="hidden sm:inline">Nguồn bản đồ</span>
      </button>
    </div>

    <!-- Day Filter Pills & Total Distance on Map -->
    <div class="absolute top-15 left-4 z-10 flex items-center gap-1 bg-white/95 backdrop-blur-md p-1 rounded-2xl shadow-md border border-slate-200/80 max-w-[calc(100%-8rem)] overflow-x-auto no-scrollbar">
      <button
        type="button"
        class="px-2.5 py-1 rounded-xl text-[11px] font-bold transition flex items-center gap-1 cursor-pointer whitespace-nowrap"
        :class="plannerStore.selectedDayNumber === null
          ? 'bg-slate-900 text-white shadow-2xs'
          : 'text-slate-600 hover:bg-slate-100'"
        @click="plannerStore.selectDay(null)"
      >
        Tất cả ngày
      </button>

      <button
        v-for="d in plannerStore.days"
        :key="d.id"
        type="button"
        class="px-2.5 py-1 rounded-xl text-[11px] font-bold transition flex items-center gap-1 cursor-pointer whitespace-nowrap"
        :class="plannerStore.selectedDayNumber === d.dayNumber
          ? 'bg-brand-blue text-white shadow-2xs'
          : 'text-slate-600 hover:bg-slate-100'"
        @click="plannerStore.selectDay(d.dayNumber)"
      >
        <span>Ngày {{ d.dayNumber }}</span>
        <span class="text-[9px] opacity-80">({{ d.places.length }})</span>
      </button>

      <!-- Total Distance indicator if available -->
      <div
        v-if="totalDayDistance"
        class="ml-1 pl-2 border-l border-slate-200 flex items-center gap-1 text-[11px] font-black text-brand-blue whitespace-nowrap pr-1.5"
      >
        <Route class="w-3.5 h-3.5 text-brand-blue" />
        <span>{{ totalDayDistance }}</span>
      </div>
    </div>

    <!-- Floating Fit Bounds Button -->
    <button
      class="absolute top-4 right-4 z-10 bg-white/95 hover:bg-white hover:text-brand-blue backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-md border border-slate-200/80 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition cursor-pointer"
      title="Căn chỉnh toàn cảnh lịch trình"
      @click="fitAllMarkers"
    >
      <Maximize2 class="w-3.5 h-3.5 text-slate-500" />
      <span>Toàn cảnh</span>
    </button>

    <!-- Optional Token / Basemap Settings Modal -->
    <div
      v-if="showTokenModal"
      class="absolute inset-0 z-30 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-6 animate-in fade-in duration-150"
    >
      <div class="bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 max-w-md w-full animate-in zoom-in-95 duration-200 relative">
        <button
          type="button"
          class="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
          @click="showTokenModal = false"
        >
          <X class="w-4 h-4" />
        </button>

        <div class="w-12 h-12 rounded-2xl bg-blue-50 text-brand-blue flex items-center justify-center mx-auto mb-3.5 shadow-xs">
          <Layers class="w-6 h-6" />
        </div>

        <h3 class="text-sm font-black text-slate-900 text-center mb-1.5">
          Tùy chọn Nguồn Bản Đồ
        </h3>
        <p class="text-xs text-slate-500 text-center leading-relaxed mb-4">
          Bản đồ hiện đang hoạt động mượt mà với CARTO Voyager & OpenStreetMap. Bạn có thể tiếp tục sử dụng miễn phí hoặc kết nối Mapbox Token cá nhân.
        </p>

        <!-- Current Status -->
        <div class="mb-4 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div :class="['w-2 h-2 rounded-full', isUsingCustomMapbox ? 'bg-blue-500' : 'bg-emerald-500']"></div>
            <span class="text-xs font-semibold text-slate-700">
              {{ isUsingCustomMapbox ? 'Đang dùng: Mapbox Streets v12' : 'Đang dùng: CARTO Voyager (Miễn phí)' }}
            </span>
          </div>
          <button
            v-if="isUsingCustomMapbox"
            type="button"
            class="text-[11px] text-rose-500 hover:underline font-bold cursor-pointer"
            @click="switchToFreeMap"
          >
            Về bản đồ miễn phí
          </button>
        </div>

        <!-- Direct Live Paste Input -->
        <div class="space-y-2 mb-4 text-left">
          <label class="block text-[11px] font-bold text-slate-700">Dán Token Mapbox của bạn (tùy chọn):</label>
          <div class="flex gap-2">
            <input
              v-model="inputToken"
              type="text"
              placeholder="pk.eyJ1..."
              class="flex-1 bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/30 font-mono"
            />
            <button
              type="button"
              class="px-4 py-2 rounded-xl text-xs font-bold bg-brand-blue hover:bg-blue-600 text-white flex items-center gap-1 shadow-sm transition cursor-pointer"
              @click="applyLiveToken"
            >
              <Check class="w-3.5 h-3.5" />
              <span>Lưu</span>
            </button>
          </div>
        </div>

        <div class="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 text-left text-[11px] text-slate-600 space-y-1.5">
          <p class="font-bold text-slate-800 flex items-center gap-1">
            <AlertCircle class="w-3.5 h-3.5 text-blue-600" />
            Lấy token Mapbox miễn phí:
          </p>
          <p class="text-slate-500">
            Đăng ký tài khoản miễn phí tại <a href="https://account.mapbox.com" target="_blank" class="text-brand-blue font-bold hover:underline inline-flex items-center gap-0.5">account.mapbox.com <ExternalLink class="w-2.5 h-2.5" /></a> để lấy token bắt đầu bằng <code class="text-blue-700">pk.</code>.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.maplibregl-popup-content {
  border-radius: 16px !important;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1) !important;
  border: 1px solid rgba(226, 232, 240, 0.8) !important;
}
</style>
