<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import draggable from 'vuedraggable';
import { Calendar, Plus, Search, X, Loader2, MapPin, Check, Sparkles } from 'lucide-vue-next';
import type { TripDay, SearchPlaceResult } from '@/types/planner.type';
import PlaceCard from './PlaceCard.vue';
import { usePlannerStore } from '@/stores/plannerStore';
import { useDebounce } from '@/composables/useDebounce';
import { goongService } from '@/services/goong.service';
import { calculateDistance } from '@/utils/distance.util';

const props = defineProps<{
  day: TripDay;
  colorClass?: string;
}>();

const plannerStore = usePlannerStore();

// Check if this day is currently selected on the map
const isDayActive = computed(() => plannerStore.selectedDayNumber === props.day.dayNumber);

// Assign distinct matching color per Day to sync with Mapbox markers
const dayColors = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899'];
const dayColor = computed(() => dayColors[(props.day.dayNumber - 1) % dayColors.length]);

// Distance calculations
const getDistanceToNext = (index: number) => {
  const places = props.day.places;
  if (index >= places.length - 1) return null;
  const cur = places[index];
  const next = places[index + 1];
  if (!cur.latitude || !cur.longitude || !next.latitude || !next.longitude) return null;
  return calculateDistance(cur.latitude, cur.longitude, next.latitude, next.longitude);
};

const totalDayDistance = computed(() => {
  const places = props.day.places;
  if (places.length < 2) return null;
  let km = 0;
  for (let i = 0; i < places.length - 1; i++) {
    const cur = places[i];
    const next = places[i + 1];
    if (cur.latitude && cur.longitude && next.latitude && next.longitude) {
      km += calculateDistance(cur.latitude, cur.longitude, next.latitude, next.longitude).km;
    }
  }
  return km >= 1 ? `${km.toFixed(1)} km` : `${Math.round(km * 1000)} m`;
});

// Inline Search State inside Day Column
const isSearchingOpen = ref(false);
const searchQuery = ref('');
const searchInputRef = ref<HTMLInputElement | null>(null);
const debouncedQuery = useDebounce(searchQuery, 250);
const searchResults = ref<SearchPlaceResult[]>([]);
const isSearching = ref(false);
const addingPlaceId = ref<string | null>(null);
const recentlyAddedId = ref<string | null>(null);

const openInlineSearch = () => {
  isSearchingOpen.value = true;
  nextTick(() => {
    searchInputRef.value?.focus();
  });
};

const closeInlineSearch = () => {
  isSearchingOpen.value = false;
  searchQuery.value = '';
  searchResults.value = [];
};

// Autocomplete search via Goong
watch(debouncedQuery, async (val) => {
  const query = val?.trim() || '';
  if (query.length < 2) {
    searchResults.value = [];
    return;
  }
  isSearching.value = true;
  try {
    const results = await goongService.searchPlaces(query);
    searchResults.value = results;
  } catch {
    searchResults.value = [];
  } finally {
    isSearching.value = false;
  }
});

const handleAddPlaceDirectly = async (res: SearchPlaceResult) => {
  addingPlaceId.value = res.id;
  try {
    let lat = res.latitude;
    let lng = res.longitude;
    let formattedAddress = res.formattedAddress;
    let photos = res.photos;
    let tips = res.tips;

    // Lấy toạ độ GPS chuẩn từ Goong Detail nếu chưa có
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

    await plannerStore.addPlaceToDay(
      {
        placeName: res.placeName,
        formattedAddress,
        latitude: lat,
        longitude: lng,
        thumbnailUrl: res.thumbnailUrl,
        category: res.category,
        tripDayId: props.day.id,
        photos,
        tips,
        rating: res.rating,
        fsqId: res.fsqId,
      },
      props.day.id
    );

    // Feedback đã thêm
    recentlyAddedId.value = res.id;
    setTimeout(() => {
      if (recentlyAddedId.value === res.id) {
        recentlyAddedId.value = null;
      }
    }, 1500);

    // Xoá search sau khi thêm
    searchQuery.value = '';
    searchResults.value = [];
  } finally {
    addingPlaceId.value = null;
  }
};

const onDragChange = (evt: any) => {
  const target = evt.moved || evt.added;
  if (!target) return;

  const { element, newIndex } = target;
  const places = props.day.places;
  const prevOrder = newIndex > 0 ? places[newIndex - 1].orderIndex : null;
  const nextOrder = newIndex < places.length - 1 ? places[newIndex + 1].orderIndex : null;

  plannerStore.reorderPlaceItem(element, props.day.id, prevOrder, nextOrder);
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
};
</script>

<template>
  <div
    class="w-80 flex-shrink-0 bg-slate-100/70 rounded-3xl p-3.5 flex flex-col border shadow-xs max-h-full overflow-hidden transition-all duration-200"
    :class="isDayActive ? 'ring-2 ring-brand-blue/80 border-brand-blue/30 bg-blue-50/15 shadow-md' : 'border-slate-200/80 hover:border-slate-300'"
  >
    <!-- Header: Day Number & Date & Actions -->
    <div
      class="flex items-center justify-between pb-3 px-1 border-b border-slate-200/60 mb-3 flex-shrink-0 cursor-pointer select-none group"
      :title="isDayActive ? 'Đang hiển thị trên bản đồ' : 'Bấm để xem địa điểm Ngày ' + day.dayNumber + ' trên bản đồ'"
      @click="plannerStore.selectDay(day.dayNumber)"
    >
      <div class="flex items-center gap-2">
        <div
          class="w-8 h-8 rounded-2xl text-white font-black text-xs flex items-center justify-center shadow-sm transition-transform group-hover:scale-105"
          :style="{ backgroundColor: dayColor }"
        >
          N{{ day.dayNumber }}
        </div>
        <div>
          <div class="flex items-center gap-1.5">
            <h3 class="text-xs font-bold text-slate-900 group-hover:text-brand-blue transition-colors">
              Ngày {{ day.dayNumber }}
            </h3>
            <span
              v-if="isDayActive"
              class="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-blue-100 text-brand-blue"
            >
              Đang xem
            </span>
          </div>
          <div class="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
            <span class="flex items-center gap-1">
              <Calendar class="w-3 h-3 text-slate-400" />
              {{ formatDate(day.date) }}
            </span>
            <span v-if="totalDayDistance" class="font-bold text-slate-600 bg-slate-200/60 px-1.5 py-0.2 rounded-md">
              🚗 {{ totalDayDistance }}
            </span>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-1.5" @click.stop>
        <span
          class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border shadow-xs"
          :style="{ color: dayColor, backgroundColor: `${dayColor}15`, borderColor: `${dayColor}40` }"
        >
          {{ day.places.length }} điểm
        </span>

        <!-- Quick inline search trigger button in header -->
        <button
          type="button"
          class="w-6 h-6 rounded-full bg-white hover:bg-brand-blue hover:text-white text-slate-600 border border-slate-200 shadow-2xs flex items-center justify-center transition cursor-pointer"
          :title="isSearchingOpen ? 'Đóng tìm kiếm' : 'Tìm & thêm địa điểm vào Ngày ' + day.dayNumber"
          @click="isSearchingOpen ? closeInlineSearch() : openInlineSearch()"
        >
          <X v-if="isSearchingOpen" class="w-3 h-3" />
          <Search v-else class="w-3 h-3" />
        </button>
      </div>
    </div>

    <!-- Scrollable Area for Places and Inline Search -->
    <div class="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[120px] relative">
      <!-- Draggable Places Area -->
      <draggable
        :list="day.places"
        group="places"
        item-key="id"
        class="space-y-2"
        ghost-class="drop-ghost"
        chosen-class="sortable-chosen"
        drag-class="sortable-drag"
        animation="250"
        @change="onDragChange"
      >
        <template #item="{ element, index }">
          <div class="space-y-2">
            <PlaceCard
              :key="element.id"
              :place="element"
              :order-number="index + 1"
              :day-color="dayColor"
            />

            <!-- Distance Connector between this place and the next place -->
            <div
              v-if="index < day.places.length - 1 && getDistanceToNext(index)"
              class="flex items-center justify-center py-0.5 relative my-1"
            >
              <div class="absolute inset-x-6 top-1/2 -translate-y-1/2 border-t border-dashed border-slate-300"></div>
              <div
                class="relative z-10 px-2 py-0.5 bg-white/95 backdrop-blur-xs rounded-full border border-slate-200/90 shadow-2xs text-[10px] text-slate-600 font-semibold flex items-center gap-1.5 hover:border-brand-blue/50 transition cursor-default"
                :title="'Khoảng cách đường đi: ' + getDistanceToNext(index)?.text + ' (' + getDistanceToNext(index)?.durationText + ')'"
              >
                <span>{{ getDistanceToNext(index)?.isWalking ? '🚶' : '🚗' }}</span>
                <span class="font-bold text-slate-800">{{ getDistanceToNext(index)?.text }}</span>
                <span class="text-slate-300">·</span>
                <span class="text-slate-500 text-[9px]">{{ getDistanceToNext(index)?.durationText }}</span>
              </div>
            </div>
          </div>
        </template>
      </draggable>

      <!-- Empty state when no places yet -->
      <div
        v-if="day.places.length === 0 && !isSearchingOpen"
        class="h-28 border-2 border-dashed border-slate-300/80 rounded-2xl flex flex-col items-center justify-center text-slate-400 p-4 text-center group hover:border-brand-blue hover:text-brand-blue transition cursor-pointer bg-white/40"
        @click="openInlineSearch"
      >
        <Search class="w-5 h-5 mb-1 group-hover:scale-110 text-brand-blue transition" />
        <span class="text-[11px] font-bold text-slate-700 group-hover:text-brand-blue">Tìm & thêm địa điểm vào Ngày {{ day.dayNumber }}</span>
        <span class="text-[9px] text-slate-400 mt-0.5">hoặc kéo từ kho lưu tạm bên trái</span>
      </div>

      <!-- Inline Search Panel inside Day Column -->
      <div
        v-if="isSearchingOpen"
        class="bg-white rounded-2xl p-2.5 border border-brand-blue/40 shadow-md transition-all space-y-2"
      >
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-extrabold text-slate-700 flex items-center gap-1">
            <Sparkles class="w-3 h-3 text-brand-blue" />
            <span>Thêm vào Ngày {{ day.dayNumber }} (Goong)</span>
          </span>
          <button
            type="button"
            class="text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100 transition cursor-pointer"
            @click="closeInlineSearch"
          >
            <X class="w-3.5 h-3.5" />
          </button>
        </div>

        <!-- Search Input -->
        <div class="relative">
          <Search class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            placeholder="Gõ tên quán ăn, điểm tham quan..."
            class="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl pl-8 pr-7 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:bg-white transition placeholder:text-slate-400 text-slate-800"
            @keydown.esc="closeInlineSearch"
          />
          <div class="absolute right-2 top-2 flex items-center">
            <Loader2 v-if="isSearching" class="w-3.5 h-3.5 text-brand-blue animate-spin" />
            <button
              v-else-if="searchQuery"
              type="button"
              class="text-slate-400 hover:text-slate-600"
              @click="searchQuery = ''"
            >
              <X class="w-3 h-3" />
            </button>
          </div>
        </div>

        <!-- Autocomplete Suggestions Dropdown List -->
        <div
          v-if="searchResults.length > 0"
          class="max-h-56 overflow-y-auto space-y-1 pt-1 divide-y divide-slate-100"
        >
          <div
            v-for="res in searchResults"
            :key="res.id"
            class="pt-1.5 pb-1 px-1.5 rounded-xl hover:bg-blue-50/60 flex items-center justify-between cursor-pointer group transition gap-2"
            @click="handleAddPlaceDirectly(res)"
          >
            <div class="flex items-center gap-2 min-w-0 flex-1">
              <img
                v-if="res.thumbnailUrl"
                :src="res.thumbnailUrl"
                :alt="res.placeName"
                class="w-8 h-8 rounded-lg object-cover flex-shrink-0 border border-slate-100"
              />
              <div v-else class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                <MapPin class="w-4 h-4" />
              </div>

              <div class="min-w-0 flex-1">
                <p class="text-[11px] font-bold text-slate-800 truncate group-hover:text-brand-blue">
                  {{ res.placeName }}
                </p>
                <p class="text-[9px] text-slate-400 truncate">
                  {{ res.formattedAddress }}
                </p>
              </div>
            </div>

            <button
              type="button"
              class="px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition shadow-2xs flex-shrink-0"
              :class="recentlyAddedId === res.id
                ? 'bg-emerald-500 text-white'
                : addingPlaceId === res.id
                ? 'bg-blue-100 text-blue-700'
                : 'bg-brand-blue text-white hover:bg-blue-600'"
              :disabled="addingPlaceId === res.id"
            >
              <Loader2 v-if="addingPlaceId === res.id" class="w-3 h-3 animate-spin" />
              <Check v-else-if="recentlyAddedId === res.id" class="w-3 h-3" />
              <Plus v-else class="w-3 h-3" />
              <span>{{ recentlyAddedId === res.id ? 'Đã thêm' : 'Thêm' }}</span>
            </button>
          </div>
        </div>

        <p v-else-if="searchQuery && !isSearching" class="text-[10px] text-slate-400 text-center py-2">
          Không tìm thấy địa điểm phù hợp
        </p>
      </div>

      <!-- Add Place Button at Bottom of Column when Search is Closed -->
      <button
        v-if="!isSearchingOpen && day.places.length > 0"
        type="button"
        class="w-full mt-1 py-2 px-3 rounded-2xl border border-dashed border-slate-300/80 hover:border-brand-blue bg-white/70 hover:bg-white text-slate-500 hover:text-brand-blue text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer group"
        @click="openInlineSearch"
      >
        <Plus class="w-3.5 h-3.5 group-hover:scale-110 transition" />
        <span>Thêm địa điểm vào Ngày {{ day.dayNumber }}</span>
      </button>
    </div>
  </div>
</template>
