<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  Utensils,
  Camera,
  Hotel,
  Bus,
  MapPin,
  Clock,
  Trash2,
  Edit3,
  GripVertical,
  X,
  Check,
} from 'lucide-vue-next';
import type { PlaceItem, PlaceCategory } from '@/types/planner.type';
import { usePlannerStore } from '@/stores/plannerStore';

const props = defineProps<{
  place: PlaceItem;
  orderNumber?: number;
  dayColor?: string;
}>();

const plannerStore = usePlannerStore();
const isSelected = computed(() => plannerStore.activePlaceId === props.place.id);

// Edit Modal State
const showEditModal = ref(false);
const editStartTime = ref(props.place.startTime || '08:00');
const editDuration = ref(props.place.durationMinutes || 60);
const editCategory = ref<PlaceCategory>(props.place.category);
const editNotes = ref(props.place.notes || '');

// Category config: Colors & Icons
const categoryConfig: Record<string, { name: string; bgClass: string; textClass: string; borderClass: string; icon: any }> = {
  ATTRACTION: {
    name: 'Tham quan',
    bgClass: 'bg-blue-50 text-blue-700',
    textClass: 'text-blue-600',
    borderClass: 'border-blue-200/80',
    icon: Camera,
  },
  RESTAURANT: {
    name: 'Ăn uống',
    bgClass: 'bg-orange-50 text-orange-700',
    textClass: 'text-orange-600',
    borderClass: 'border-orange-200/80',
    icon: Utensils,
  },
  HOTEL: {
    name: 'Lưu trú',
    bgClass: 'bg-purple-50 text-purple-700',
    textClass: 'text-purple-600',
    borderClass: 'border-purple-200/80',
    icon: Hotel,
  },
  TRANSPORT: {
    name: 'Di chuyển',
    bgClass: 'bg-emerald-50 text-emerald-700',
    textClass: 'text-emerald-600',
    borderClass: 'border-emerald-200/80',
    icon: Bus,
  },
  OTHER: {
    name: 'Khác',
    bgClass: 'bg-slate-50 text-slate-700',
    textClass: 'text-slate-600',
    borderClass: 'border-slate-200/80',
    icon: MapPin,
  },
  // Backward compatibility
  FOOD: {
    name: 'Ăn uống',
    bgClass: 'bg-orange-50 text-orange-700',
    textClass: 'text-orange-600',
    borderClass: 'border-orange-200/80',
    icon: Utensils,
  },
  SIGHTSEEING: {
    name: 'Tham quan',
    bgClass: 'bg-blue-50 text-blue-700',
    textClass: 'text-blue-600',
    borderClass: 'border-blue-200/80',
    icon: Camera,
  },
};

const canonicalCategories: PlaceCategory[] = ['ATTRACTION', 'RESTAURANT', 'HOTEL', 'TRANSPORT', 'OTHER'];

const currentCat = computed(() => categoryConfig[props.place.category] || categoryConfig.OTHER);

const handleHover = () => {
  plannerStore.setActivePlace(props.place.id);
};

const handleDelete = () => {
  plannerStore.removePlace(props.place.id);
};

const openEditModal = () => {
  editStartTime.value = props.place.startTime || '08:00';
  editDuration.value = props.place.durationMinutes || 60;
  editCategory.value = props.place.category;
  editNotes.value = props.place.notes || '';
  showEditModal.value = true;
};

const handleSaveEdit = () => {
  plannerStore.updatePlace(props.place.id, {
    startTime: editStartTime.value,
    durationMinutes: Number(editDuration.value),
    category: editCategory.value,
    notes: editNotes.value,
  });
  showEditModal.value = false;
};
const handleCardClick = () => {
  plannerStore.openPlaceDetail(props.place);
};
</script>

<template>
  <div
    :class="[
      'group relative bg-white rounded-2xl p-3 border transition-all duration-200 shadow-xs hover:shadow-md cursor-grab active:cursor-grabbing',
      isSelected
        ? 'border-brand-blue ring-2 ring-brand-blue/20 bg-blue-50/20'
        : 'border-slate-200/80 hover:border-slate-300',
    ]"
    @mouseenter="handleHover"
    @click="handleCardClick"
  >
    <!-- Top Row: Category Badge, Order Number & Actions -->
    <div class="flex items-center justify-between gap-1.5 pb-2 mb-2 border-b border-slate-100">
      <!-- Left: Drag Grip & Color-Coded Number Badge (Matching Mapbox Marker) -->
      <div class="flex items-center gap-1.5">
        <GripVertical class="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600" />
        <span
          v-if="orderNumber"
          class="w-5 h-5 rounded-full text-white font-extrabold text-[10px] flex items-center justify-center shadow-xs"
          :style="{ backgroundColor: dayColor || '#0F172A' }"
        >
          {{ orderNumber }}
        </span>
      </div>

      <!-- Center: Category Badge -->
      <span
        :class="[
          'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 border',
          currentCat.bgClass,
          currentCat.borderClass,
        ]"
      >
        <component :is="currentCat.icon" class="w-3 h-3" />
        <span>{{ currentCat.name }}</span>
      </span>

      <!-- Right: Action Icons (Edit & Delete) -->
      <div class="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition">
        <button
          class="p-1 text-slate-400 hover:text-brand-blue hover:bg-blue-50 rounded-lg transition"
          title="Chỉnh sửa chi tiết"
          @click.stop="openEditModal"
        >
          <Edit3 class="w-3.5 h-3.5" />
        </button>
        <button
          class="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
          title="Xóa địa điểm"
          @click.stop="handleDelete"
        >
          <Trash2 class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <!-- Main Content Layout (Thumbnail Image + Title & Address) -->
    <div class="flex items-start gap-2.5">
      <!-- Thumbnail Image -->
      <img
        v-if="place.thumbnailUrl"
        :src="place.thumbnailUrl"
        :alt="place.placeName"
        class="w-12 h-12 rounded-xl object-cover border border-slate-100 shadow-2xs flex-shrink-0"
      />

      <!-- Text Container (Takes 100% remaining width so Title doesn't truncate prematurely) -->
      <div class="flex-1 min-w-0">
        <!-- Title (Full Width) -->
        <h4 class="text-xs font-black text-slate-900 leading-snug group-hover:text-brand-blue transition line-clamp-2">
          {{ place.placeName }}
        </h4>

        <!-- Address -->
        <p v-if="place.formattedAddress" class="text-[11px] text-slate-500 truncate mt-1 flex items-center gap-1">
          <MapPin class="w-3 h-3 text-slate-400 flex-shrink-0" />
          <span class="truncate">{{ place.formattedAddress }}</span>
        </p>

        <!-- Time & Duration Pill -->
        <div class="flex items-center gap-2 mt-2 text-[11px] text-slate-600 font-medium">
          <span
            class="flex items-center gap-1 bg-blue-50/80 hover:bg-blue-100 text-brand-blue font-bold px-2 py-0.5 rounded-md border border-blue-200/60 transition"
            title="Bấm để chỉnh sửa giờ & thời lượng"
            @click.stop="openEditModal"
          >
            <Clock class="w-3 h-3 text-brand-blue" />
            <span>{{ place.startTime || 'Chưa hẹn giờ' }}</span>
          </span>
          <span v-if="place.durationMinutes" class="text-slate-400">
            {{ place.durationMinutes }} phút
          </span>
        </div>

        <!-- Notes Pill (Amber Pastel Box for Booking code / Notes) -->
        <p v-if="place.notes" class="text-[11px] text-amber-900 bg-amber-50/80 p-2 rounded-xl mt-2 border border-amber-200/60 italic leading-tight">
          "{{ place.notes }}"
        </p>
      </div>
    </div>

    <!-- Edit Place Item Modal / Popover -->
    <Teleport to="body">
      <div
        v-if="showEditModal"
        class="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 select-none"
        @click.self="showEditModal = false"
      >
        <div class="bg-white rounded-3xl shadow-2xl border border-slate-100 p-5 w-full max-w-sm animate-in fade-in zoom-in-95 duration-150" @click.stop>
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 class="text-xs font-bold text-slate-900 truncate">
              Chỉnh sửa: {{ place.placeName }}
            </h3>
            <button
              type="button"
              class="p-1 rounded-full text-slate-400 hover:bg-slate-100"
              @click.stop="showEditModal = false"
            >
              <X class="w-4 h-4" />
            </button>
          </div>

          <div class="space-y-3.5 pt-4">
            <!-- 1. Start Time & Duration -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-[11px] font-bold text-slate-700 mb-1">Giờ bắt đầu</label>
                <input
                  v-model="editStartTime"
                  type="time"
                  class="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                />
              </div>
              <div>
                <label class="block text-[11px] font-bold text-slate-700 mb-1">Thời lượng (phút)</label>
                <input
                  v-model.number="editDuration"
                  type="number"
                  step="15"
                  min="15"
                  class="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                />
              </div>
            </div>

            <!-- 2. Category Buttons -->
            <div>
              <label class="block text-[11px] font-bold text-slate-700 mb-1.5">Danh mục</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  v-for="key in canonicalCategories"
                  :key="key"
                  type="button"
                  :class="[
                    'px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 border transition',
                    editCategory === key || (key === 'ATTRACTION' && editCategory === 'SIGHTSEEING') || (key === 'RESTAURANT' && editCategory === 'FOOD')
                      ? 'border-brand-blue bg-blue-50 text-brand-blue ring-2 ring-brand-blue/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                  ]"
                  @click="editCategory = key"
                >
                  <component :is="categoryConfig[key].icon" class="w-3.5 h-3.5" />
                  <span>{{ categoryConfig[key].name }}</span>
                </button>
              </div>
            </div>

            <!-- 3. Notes Textarea -->
            <div>
              <label class="block text-[11px] font-bold text-slate-700 mb-1">Ghi chú riêng</label>
              <textarea
                v-model="editNotes"
                rows="2"
                placeholder="Mã đặt chỗ, link mua vé, lưu ý trang phục..."
                class="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              ></textarea>
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 mt-4">
            <button
              type="button"
              class="px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              @click.stop="showEditModal = false"
            >
              Hủy
            </button>
            <button
              type="button"
              class="px-4 py-1.5 rounded-full text-xs font-bold bg-brand-blue hover:bg-blue-600 text-white flex items-center gap-1.5 shadow-sm transition"
              @click.stop="handleSaveEdit"
            >
              <Check class="w-3.5 h-3.5" />
              <span>Lưu thay đổi</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
