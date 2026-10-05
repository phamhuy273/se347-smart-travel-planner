<script setup lang="ts">
import { ref } from 'vue';
import { usePlannerStore } from '@/stores/plannerStore';
import PlaceSearchPanel from '@/components/planner/PlaceSearchPanel.vue';
import DayColumn from '@/components/planner/DayColumn.vue';
import PlannerMap from '@/components/map/PlannerMap.vue';
import {
  CalendarDays,
  MapPin,
  Plus,
  FileText,
  UserPlus,
  Search,
  Map as MapIcon,
  ChevronRight,
  ChevronLeft,
} from 'lucide-vue-next';

const plannerStore = usePlannerStore();
const workspaceRef = ref<HTMLElement | null>(null);

// Panel Collapsible States
const isSearchPanelOpen = ref(true);
const isMapPanelOpen = ref(true);

// Dynamic Width Percentage for Right Map Panel
const mapPanelWidthPercent = ref(45); // in %

// Dragging State for Map Panel
const isDraggingRight = ref(false);

const toggleSearchPanel = () => {
  isSearchPanelOpen.value = !isSearchPanelOpen.value;
};

const toggleMapPanel = () => {
  isMapPanelOpen.value = !isMapPanelOpen.value;
};

const handleAddDay = () => {
  const nextDayNum = plannerStore.days.length + 1;
  const newDayId = `day-${nextDayNum}`;
  plannerStore.days.push({
    id: newDayId,
    tripId: plannerStore.tripId,
    dayNumber: nextDayNum,
    date: `2026-10-${10 + nextDayNum}`,
    places: [],
  });
};

// ─── Mapbox Map Resizable Handle Dragging Logic ─────────────────────────────
const startDragRight = (e: MouseEvent) => {
  e.preventDefault();
  isDraggingRight.value = true;
  document.addEventListener('mousemove', onDragRight);
  document.addEventListener('mouseup', stopDragRight);
};

const onDragRight = (e: MouseEvent) => {
  if (!isDraggingRight.value || !workspaceRef.value) return;
  const containerRect = workspaceRef.value.getBoundingClientRect();
  const rightEdge = containerRect.right;
  const newWidthPx = rightEdge - e.clientX;
  const newPercent = (newWidthPx / containerRect.width) * 100;
  // Bound map width between 20% and 70%
  mapPanelWidthPercent.value = Math.max(20, Math.min(70, newPercent));
};

const stopDragRight = () => {
  isDraggingRight.value = false;
  document.removeEventListener('mousemove', onDragRight);
  document.removeEventListener('mouseup', stopDragRight);
};
</script>

<template>
  <div class="flex-1 flex flex-col h-full w-full overflow-hidden bg-slate-50/50">
    <!-- Top Bar: Trip Info & Action Controls -->
    <div class="h-14 bg-white border-b border-slate-200/80 px-5 flex items-center justify-between shadow-2xs z-20 flex-shrink-0">
      <!-- Left: Trip Title, Date Badges & Toggle Buttons -->
      <div class="flex items-center gap-3">
        <!-- Toggle Search Panel Button -->
        <button
          :class="[
            'p-1.5 px-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition shadow-2xs',
            isSearchPanelOpen
              ? 'bg-blue-50 text-brand-blue border-blue-200 ring-2 ring-brand-blue/20'
              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200',
          ]"
          :title="isSearchPanelOpen ? 'Ẩn tìm kiếm & kho tạm' : 'Hiện tìm kiếm & kho tạm'"
          @click="toggleSearchPanel"
        >
          <Search class="w-3.5 h-3.5" />
          <span class="hidden md:inline">{{ isSearchPanelOpen ? 'Ẩn Tìm Kiếm' : 'Hiện Tìm Kiếm' }}</span>
        </button>

        <h1 class="text-sm font-black text-slate-900 truncate max-w-xs sm:max-w-md">
          {{ plannerStore.tripTitle }}
        </h1>

        <div class="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-semibold text-[11px] border border-slate-200">
          <CalendarDays class="w-3.5 h-3.5 text-brand-blue" />
          <span>10/10 - 13/10/2026 ({{ plannerStore.days.length }} ngày)</span>
        </div>

        <div class="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[11px] border border-emerald-200">
          <MapPin class="w-3.5 h-3.5 text-emerald-600" />
          <span>Đà Nẵng & Hội An</span>
        </div>
      </div>

      <!-- Right: Map Toggle & Action Buttons -->
      <div class="flex items-center gap-2">
        <!-- Toggle Map Panel Button -->
        <button
          :class="[
            'p-1.5 px-2.5 rounded-full border text-xs font-bold flex items-center gap-1.5 transition shadow-2xs',
            isMapPanelOpen
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-2 ring-emerald-500/20'
              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200',
          ]"
          :title="isMapPanelOpen ? 'Ẩn bản đồ Mapbox' : 'Hiện bản đồ Mapbox'"
          @click="toggleMapPanel"
        >
          <MapIcon class="w-3.5 h-3.5 text-emerald-600" />
          <span class="hidden sm:inline">{{ isMapPanelOpen ? 'Ẩn Bản Đồ' : 'Hiện Bản Đồ' }}</span>
        </button>

        <button
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
          title="Mời bạn bè cùng chỉnh sửa"
        >
          <UserPlus class="w-3.5 h-3.5" />
          <span class="hidden sm:inline">Mời nhóm</span>
        </button>

        <button
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
          title="Xuất cẩm nang PDF A4"
        >
          <FileText class="w-3.5 h-3.5" />
          <span class="hidden sm:inline">Xuất PDF</span>
        </button>

        <button
          class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-brand-blue hover:bg-blue-600 text-white font-bold text-xs shadow-sm transition"
          @click="handleAddDay"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>Thêm Ngày</span>
        </button>
      </div>
    </div>

    <!-- Main Workspace Layout -->
    <div
      ref="workspaceRef"
      :class="[
        'flex-1 flex min-h-0 w-full overflow-hidden relative',
        isDraggingRight ? 'cursor-col-resize select-none' : '',
      ]"
    >
      <!-- 1. Left Fixed Column: Search & Unassigned Pool (w-80 = 320px) -->
      <div
        v-if="isSearchPanelOpen"
        class="w-80 h-full flex-shrink-0 relative overflow-hidden border-r border-slate-200/80 transition-all duration-300 ease-in-out"
      >
        <PlaceSearchPanel />
      </div>

      <!-- Floating Expand Button for Left Panel when closed -->
      <button
        v-if="!isSearchPanelOpen"
        class="absolute left-2 top-4 z-30 w-8 h-8 rounded-full bg-white shadow-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:text-brand-blue transition"
        title="Mở bảng tìm kiếm"
        @click="toggleSearchPanel"
      >
        <ChevronRight class="w-4 h-4" />
      </button>

      <!-- 2. Center Column: Horizontal Scrollable Days Canvas -->
      <div class="flex-1 min-w-0 bg-slate-100/40 overflow-x-auto overflow-y-hidden p-4 flex gap-4">
        <DayColumn
          v-for="day in plannerStore.days"
          :key="day.id"
          :day="day"
        />

        <!-- Button: Add Day Column -->
        <div
          class="w-72 flex-shrink-0 border-2 border-dashed border-slate-300 rounded-3xl h-full flex flex-col items-center justify-center text-slate-400 hover:border-brand-blue hover:text-brand-blue transition cursor-pointer p-6 bg-white/40 group"
          @click="handleAddDay"
        >
          <div class="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center mb-2 group-hover:scale-110 transition">
            <Plus class="w-6 h-6 text-brand-blue" />
          </div>
          <span class="text-xs font-bold text-slate-700 group-hover:text-brand-blue">Thêm Ngày {{ plannerStore.days.length + 1 }}</span>
          <p class="text-[10px] text-slate-400 mt-1">Mở rộng thêm ngày cho lịch trình của bạn</p>
        </div>
      </div>

      <!-- Right Resizable Handle Bar for Mapbox Map -->
      <div
        v-if="isMapPanelOpen"
        class="w-1.5 h-full cursor-col-resize bg-slate-200/60 hover:bg-emerald-500 active:bg-emerald-600 transition-colors flex items-center justify-center group z-30 flex-shrink-0"
        title="Kéo sang trái / phải để điều chỉnh độ rộng bản đồ Mapbox"
        @mousedown="startDragRight"
      >
        <div class="w-0.5 h-8 bg-slate-400 group-hover:bg-white rounded-full"></div>
      </div>

      <!-- Floating Expand Button for Right Map Panel when closed -->
      <button
        v-if="!isMapPanelOpen"
        class="absolute right-2 top-4 z-30 w-8 h-8 rounded-full bg-white shadow-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:text-emerald-600 transition"
        title="Mở bản đồ Mapbox"
        @click="toggleMapPanel"
      >
        <ChevronLeft class="w-4 h-4" />
      </button>

      <!-- 3. Right Resizable Column: Sticky Mapbox Map -->
      <div
        v-if="isMapPanelOpen"
        class="h-full flex-shrink-0 relative overflow-hidden"
        :style="{ width: `${mapPanelWidthPercent}%` }"
      >
        <PlannerMap />
      </div>
    </div>
  </div>
</template>
