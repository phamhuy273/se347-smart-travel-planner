<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import draggable from 'vuedraggable';
import {
  Search,
  Plus,
  Package,
  SlidersHorizontal,
  MapPin,
  Utensils,
  Camera,
  Hotel,
  Bus,
} from 'lucide-vue-next';
import { usePlannerStore } from '@/stores/plannerStore';
import { placeService } from '@/services/place.service';
import { useDebounce } from '@/composables/useDebounce';
import type { SearchPlaceResult, PlaceCategory, PlaceItem } from '@/types/planner.type';
import PlaceCard from './PlaceCard.vue';

const plannerStore = usePlannerStore();

const searchQuery = ref('');
const debouncedSearch = useDebounce(searchQuery, 300);
const searchResults = ref<SearchPlaceResult[]>([]);
const isSearching = ref(false);

// Client-side In-Memory Cache (0ms latency for repeated searches)
const searchCache = new Map<string, SearchPlaceResult[]>();
let currentAbortController: AbortController | null = null;

// Watch debounced query for autocomplete with race condition guard
watch(debouncedSearch, async (val) => {
  const query = val?.trim() || '';
  if (query.length < 2) {
    searchResults.value = [];
    return;
  }

  // 1. Check in-memory cache first
  const cacheKey = query.toLowerCase();
  if (searchCache.has(cacheKey)) {
    searchResults.value = searchCache.get(cacheKey)!;
    return;
  }

  // 2. Abort previous in-flight request if user kept typing
  if (currentAbortController) {
    currentAbortController.abort();
  }
  currentAbortController = new AbortController();

  isSearching.value = true;
  try {
    const results = await placeService.searchPlaces(query, currentAbortController.signal);
    // Cache result
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

const handleAddSearchPlace = (res: SearchPlaceResult) => {
  plannerStore.addPlaceToDay(
    {
      placeName: res.placeName,
      formattedAddress: res.formattedAddress,
      latitude: res.latitude,
      longitude: res.longitude,
      thumbnailUrl: res.thumbnailUrl,
      category: res.category,
      tripDayId: null,
    },
    null // Add to Unassigned Pool first
  );
  searchQuery.value = '';
  searchResults.value = [];
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
  <div class="w-80 flex-shrink-0 bg-white border-r border-slate-200/80 flex flex-col h-full overflow-hidden">
    <!-- Header: Search Title & Input -->
    <div class="p-4 border-b border-slate-100 flex-shrink-0">
      <h2 class="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
        <Search class="w-3.5 h-3.5 text-brand-blue" />
        Tìm kiếm & Thêm Địa điểm
      </h2>

      <!-- Search Input Box -->
      <div class="relative">
        <Search class="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Nhập tên địa điểm, nhà hàng..."
          class="w-full bg-slate-50 border border-slate-200 text-xs rounded-2xl pl-10 pr-9 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:bg-white transition placeholder:text-slate-400"
        />
        <SlidersHorizontal class="w-3.5 h-3.5 text-slate-400 absolute right-3.5 top-3.5 cursor-pointer hover:text-slate-600" />
      </div>

      <!-- Autocomplete Dropdown Results -->
      <div v-if="searchResults.length > 0" class="mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 space-y-1 max-h-60 overflow-y-auto">
        <div
          v-for="res in searchResults"
          :key="res.id"
          class="p-2 rounded-xl hover:bg-slate-50 flex items-center justify-between cursor-pointer group transition"
          @click="handleAddSearchPlace(res)"
        >
          <div class="flex items-center gap-2 min-w-0">
            <div class="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <MapPin class="w-4 h-4" />
            </div>
            <div class="min-w-0">
              <p class="text-xs font-bold text-slate-800 truncate group-hover:text-brand-blue">{{ res.placeName }}</p>
              <p class="text-[10px] text-slate-400 truncate">{{ res.formattedAddress }}</p>
            </div>
          </div>

          <button class="p-1 rounded-full bg-slate-100 group-hover:bg-brand-blue group-hover:text-white text-slate-600 transition flex-shrink-0">
            <Plus class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Unassigned Pool (Kho lưu tạm) Header & List -->
    <div class="flex-1 flex flex-col min-h-0 p-4 bg-slate-50/50">
      <div class="flex items-center justify-between mb-3 flex-shrink-0">
        <div class="flex items-center gap-2">
          <Package class="w-4 h-4 text-emerald-600" />
          <h3 class="text-xs font-bold text-slate-800">Kho lưu tạm</h3>
        </div>
        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
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
            class="h-32 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 p-4 text-center"
          >
            <Package class="w-6 h-6 mb-1 text-slate-300" />
            <p class="text-[11px] font-medium text-slate-500">Kho tạm trống</p>
            <p class="text-[10px] text-slate-400">Kéo địa điểm chưa xếp lịch vào đây để lưu trữ</p>
          </div>
        </template>
      </draggable>
    </div>
  </div>
</template>
