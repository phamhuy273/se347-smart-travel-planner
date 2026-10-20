<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import draggable from 'vuedraggable';
import {
  Search,
  Plus,
  Package,
  MapPin,
  Utensils,
  Camera,
  Hotel,
  X,
  Loader2,
  Sparkles,
  Check,
  ChevronDown,
  Info,
} from 'lucide-vue-next';
import { usePlannerStore } from '@/stores/plannerStore';
import { useDebounce } from '@/composables/useDebounce';
import type { SearchPlaceResult, PlaceCategory } from '@/types/planner.type';
import PlaceCard from './PlaceCard.vue';
import { goongService } from '@/services/goong.service';

const plannerStore = usePlannerStore();

const searchQuery = ref('');
const debouncedSearch = useDebounce(searchQuery, 250);
const searchResults = ref<SearchPlaceResult[]>([]);
const isSearching = ref(false);
const isFocused = ref(false);
const activeCategoryFilter = ref<PlaceCategory | 'ALL'>('ALL');
const recentlyAddedId = ref<string | null>(null);

// In-Memory Search Cache for instantaneous response
const searchCache = new Map<string, SearchPlaceResult[]>();
let currentAbortController: AbortController | null = null;

const isGoongConnected = computed(() => {
  const k = import.meta.env.VITE_GOONG_API_KEY;
  return Boolean(k && k.trim().length > 5 && !k.includes('your_'));
});

// Watch debounced query for autocomplete with race condition guard
watch(debouncedSearch, async (val) => {
  const query = val?.trim() || '';
  if (query.length < 2) {
    searchResults.value = [];
    return;
  }

  const cacheKey = query.toLowerCase();
  if (searchCache.has(cacheKey)) {
    searchResults.value = searchCache.get(cacheKey)!;
    return;
  }

  if (currentAbortController) {
    currentAbortController.abort();
  }
  currentAbortController = new AbortController();

  isSearching.value = true;
  try {
    const results = await goongService.searchPlaces(query, currentAbortController.signal);
    searchCache.set(cacheKey, results);
    searchResults.value = results;
  } catch (err: any) {
    if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
      searchResults.value = [];
    }
  } finally {
    isSearching.value = false;
  }
});

// Category Filtered Results
const filteredSearchResults = computed(() => {
  if (activeCategoryFilter.value === 'ALL') return searchResults.value;
  return searchResults.value.filter((r) => r.category === activeCategoryFilter.value);
});

const clearSearch = () => {
  searchQuery.value = '';
  searchResults.value = [];
};

const handlePreviewPlace = (res: SearchPlaceResult) => {
  plannerStore.openPlaceDetail({
    id: res.id,
    tripId: plannerStore.tripId || '',
    tripDayId: null,
    placeName: res.placeName,
    formattedAddress: res.formattedAddress,
    latitude: res.latitude,
    longitude: res.longitude,
    thumbnailUrl: res.thumbnailUrl,
    category: res.category,
    orderIndex: 0,
    rating: res.rating,
    description: res.description,
    photos: res.photos,
    tips: res.tips,
    fsqId: res.fsqId,
  });
};

const handleAddSearchPlace = async (res: SearchPlaceResult, targetDayId: string | null = null) => {
  let lat = res.latitude;
  let lng = res.longitude;
  let formattedAddress = res.formattedAddress;
  let photos = res.photos;
  let tips = res.tips;

  // Nếu là địa điểm từ Goong mà chưa có toạ độ thực tế (đang là 16.06 / 108.22), lấy chi tiết toạ độ
  if (res.fsqId && lat === 16.06 && lng === 108.22) {
    try {
      const details = await goongService.getPlaceDetails(res);
      if (details.latitude && details.longitude) {
        lat = details.latitude;
        lng = details.longitude;
      }
      if (details.formattedAddress) formattedAddress = details.formattedAddress;
      if (details.photos) photos = details.photos;
      if (details.tips) tips = details.tips;
    } catch {
      // ignore fallback
    }
  }

  plannerStore.addPlaceToDay(
    {
      placeName: res.placeName,
      formattedAddress,
      latitude: lat,
      longitude: lng,
      thumbnailUrl: res.thumbnailUrl,
      category: res.category,
      tripDayId: targetDayId,
      photos,
      tips,
      rating: res.rating,
      fsqId: res.fsqId,
    },
    targetDayId
  );

  // Flash added feedback
  recentlyAddedId.value = res.id;
  setTimeout(() => {
    if (recentlyAddedId.value === res.id) {
      recentlyAddedId.value = null;
    }
  }, 1800);
};

const onUnassignedDragChange = (evt: any) => {
  const target = evt.moved || evt.added;
  if (!target) return;

  const { element, newIndex } = target;
  const places = plannerStore.unassignedPlaces;
  const prevOrder = newIndex > 0 ? places[newIndex - 1].orderIndex : null;
  const nextOrder = newIndex < places.length - 1 ? places[newIndex + 1].orderIndex : null;

  plannerStore.reorderPlaceItem(element, null, prevOrder, nextOrder);
};
</script>

<template>
  <div class="w-full bg-white flex flex-col h-full overflow-hidden select-none">
    <!-- Header: Smart Search Section -->
    <div class="p-3.5 border-b border-slate-100 flex-shrink-0 bg-white">
      <div class="flex items-center justify-between mb-2">
        <h2 class="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles class="w-3.5 h-3.5 text-brand-blue" />
          <span>Tìm kiếm Địa điểm</span>
        </h2>
        <span
          class="text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 transition-all"
          :class="isGoongConnected ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-slate-400 bg-slate-50 border-slate-100'"
        >
          <span v-if="isGoongConnected" class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          {{ isGoongConnected ? 'Goong.io' : 'OSM' }}
        </span>
      </div>

      <!-- Search Input Box -->
      <div class="relative">
        <Search class="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Tìm quán ăn, điểm ngắm cảnh, khách sạn..."
          class="w-full bg-slate-50 border border-slate-200 text-xs rounded-2xl pl-9 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:bg-white transition placeholder:text-slate-400 text-slate-800"
          @focus="isFocused = true"
        />

        <!-- Loading spinner or Clear Button -->
        <div class="absolute right-2.5 top-2.5 flex items-center">
          <Loader2 v-if="isSearching" class="w-4 h-4 text-brand-blue animate-spin" />
          <button
            v-else-if="searchQuery"
            type="button"
            class="text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200/60 transition cursor-pointer"
            @click="clearSearch"
          >
            <X class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <!-- Quick Filter Chips (Wanderlog Quality) -->
      <div class="flex items-center gap-1 mt-2.5 overflow-x-auto no-scrollbar pb-0.5">
        <button
          type="button"
          :class="[
            'px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1',
            activeCategoryFilter === 'ALL'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70',
          ]"
          @click="activeCategoryFilter = 'ALL'"
        >
          Tất cả
        </button>
        <button
          type="button"
          :class="[
            'px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1',
            activeCategoryFilter === 'ATTRACTION'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'bg-blue-50 text-blue-700 hover:bg-blue-100',
          ]"
          @click="activeCategoryFilter = 'ATTRACTION'"
        >
          <Camera class="w-3 h-3" />
          <span>Tham quan</span>
        </button>
        <button
          type="button"
          :class="[
            'px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1',
            activeCategoryFilter === 'RESTAURANT'
              ? 'bg-amber-600 text-white shadow-2xs'
              : 'bg-amber-50 text-amber-700 hover:bg-amber-100',
          ]"
          @click="activeCategoryFilter = 'RESTAURANT'"
        >
          <Utensils class="w-3 h-3" />
          <span>Ăn uống</span>
        </button>
        <button
          type="button"
          :class="[
            'px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1',
            activeCategoryFilter === 'HOTEL'
              ? 'bg-purple-600 text-white shadow-2xs'
              : 'bg-purple-50 text-purple-700 hover:bg-purple-100',
          ]"
          @click="activeCategoryFilter = 'HOTEL'"
        >
          <Hotel class="w-3 h-3" />
          <span>Khách sạn</span>
        </button>
      </div>

      <!-- Autocomplete Dropdown Results -->
      <div
        v-if="searchQuery && filteredSearchResults.length > 0"
        class="mt-2.5 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 space-y-1.5 max-h-72 overflow-y-auto"
      >
        <div
          v-for="res in filteredSearchResults"
          :key="res.id"
          class="p-2 rounded-xl hover:bg-slate-50 flex items-center justify-between cursor-pointer group transition gap-2 border border-transparent hover:border-slate-200/60"
          @click="handlePreviewPlace(res)"
        >
          <!-- Thumbnail & Info -->
          <div class="flex items-center gap-2.5 min-w-0 flex-1">
            <img
              v-if="res.thumbnailUrl"
              :src="res.thumbnailUrl"
              :alt="res.placeName"
              class="w-10 h-10 rounded-xl object-cover border border-slate-100 flex-shrink-0 shadow-2xs"
            />
            <div v-else class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <MapPin class="w-5 h-5" />
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-1.5">
                <p class="text-xs font-bold text-slate-900 truncate group-hover:text-brand-blue">
                  {{ res.placeName }}
                </p>
                <span
                  v-if="res.rating"
                  class="px-1.5 py-0.2 rounded-md bg-amber-50 text-amber-800 border border-amber-200/60 font-black text-[9px] flex items-center gap-0.5 flex-shrink-0"
                >
                  ★ {{ res.rating }}
                </span>
                <span
                  v-if="res.description?.includes('Goong.io') || (!res.id.startsWith('curated-') && !res.id.startsWith('osm-'))"
                  class="px-1.5 py-0.2 rounded bg-blue-50 text-blue-600 border border-blue-200/60 font-bold text-[8px] flex-shrink-0"
                >
                  Goong
                </span>
              </div>
              <p class="text-[10px] text-slate-400 truncate mt-0.5">
                {{ res.formattedAddress }}
              </p>
            </div>
          </div>

          <!-- Add Button with Success State -->
          <div class="flex items-center gap-1 flex-shrink-0">
            <button
              v-if="recentlyAddedId === res.id"
              type="button"
              class="px-2 py-1 rounded-xl bg-emerald-500 text-white text-[10px] font-bold flex items-center gap-1 shadow-2xs"
            >
              <Check class="w-3 h-3" />
              <span>Đã thêm</span>
            </button>
            <button
              v-else
              type="button"
              class="p-1.5 rounded-xl bg-slate-100 group-hover:bg-brand-blue group-hover:text-white text-slate-600 transition shadow-2xs cursor-pointer"
              title="Thêm vào kho lưu tạm"
              @click.stop="handleAddSearchPlace(res, null)"
            >
              <Plus class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <!-- No Results State -->
      <div
        v-else-if="searchQuery && !isSearching && filteredSearchResults.length === 0"
        class="mt-2.5 p-3 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center"
      >
        <p class="text-xs font-bold text-slate-700">Không tìm thấy địa điểm</p>
        <p class="text-[10px] text-slate-400 mt-0.5 mb-2">Thử tìm theo từ khoá khác hoặc thêm tuỳ chỉnh:</p>
        <button
          type="button"
          class="px-3 py-1.5 bg-white border border-slate-200 hover:border-brand-blue text-brand-blue rounded-xl text-xs font-bold shadow-2xs transition cursor-pointer"
          @click="
            handleAddSearchPlace({
              id: `custom-${Date.now()}`,
              placeName: searchQuery,
              formattedAddress: 'Đà Nẵng, Việt Nam',
              latitude: 16.06,
              longitude: 108.22,
              category: 'OTHER',
            })
          "
        >
          + Thêm "{{ searchQuery }}" vào kho tạm
        </button>
      </div>
    </div>

    <!-- Unassigned Pool (Kho lưu tạm) Header & List -->
    <div class="flex-1 flex flex-col min-h-0 p-3.5 bg-slate-50/60">
      <div class="flex items-center justify-between mb-2.5 flex-shrink-0">
        <div class="flex items-center gap-2">
          <Package class="w-4 h-4 text-emerald-600" />
          <h3 class="text-xs font-bold text-slate-800">Kho lưu tạm</h3>
        </div>
        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200/60">
          {{ plannerStore.unassignedPlaces.length }} địa điểm
        </span>
      </div>

      <!-- Draggable Unassigned List -->
      <draggable
        :list="plannerStore.unassignedPlaces"
        group="places"
        item-key="id"
        class="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[100px]"
        ghost-class="drop-ghost"
        chosen-class="sortable-chosen"
        drag-class="sortable-drag"
        animation="250"
        @change="onUnassignedDragChange"
      >
        <template #item="{ element }">
          <PlaceCard :key="element.id" :place="element" />
        </template>

        <!-- Empty State -->
        <template #footer>
          <div
            v-if="plannerStore.unassignedPlaces.length === 0"
            class="h-32 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 p-4 text-center bg-white/50"
          >
            <Package class="w-6 h-6 mb-1 text-slate-300" />
            <p class="text-[11px] font-bold text-slate-600">Kho tạm đang trống</p>
            <p class="text-[10px] text-slate-400 mt-0.5">Tìm kiếm ở trên hoặc kéo thả địa điểm vào đây</p>
          </div>
        </template>
      </draggable>
    </div>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
