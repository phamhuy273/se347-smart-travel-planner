<script setup lang="ts">
import { computed } from 'vue';
import draggable from 'vuedraggable';
import { Calendar, Plus } from 'lucide-vue-next';
import type { TripDay } from '@/types/planner.type';
import PlaceCard from './PlaceCard.vue';
import { usePlannerStore } from '@/stores/plannerStore';

const props = defineProps<{
  day: TripDay;
  colorClass?: string;
}>();

const plannerStore = usePlannerStore();

// Assign distinct matching color per Day to sync with Mapbox markers
const dayColors = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899'];
const dayColor = computed(() => dayColors[(props.day.dayNumber - 1) % dayColors.length]);

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
  <div class="w-80 flex-shrink-0 bg-slate-100/70 rounded-3xl p-3.5 flex flex-col border border-slate-200/80 shadow-xs max-h-full">
    <!-- Header: Day Number & Date -->
    <div class="flex items-center justify-between pb-3 px-1 border-b border-slate-200/60 mb-3 flex-shrink-0">
      <div class="flex items-center gap-2">
        <div
          class="w-8 h-8 rounded-2xl text-white font-black text-xs flex items-center justify-center shadow-sm"
          :style="{ backgroundColor: dayColor }"
        >
          N{{ day.dayNumber }}
        </div>
        <div>
          <h3 class="text-xs font-bold text-slate-900">Ngày {{ day.dayNumber }}</h3>
          <p class="text-[10px] text-slate-400 font-medium flex items-center gap-1">
            <Calendar class="w-3 h-3 text-slate-400" />
            {{ formatDate(day.date) }}
          </p>
        </div>
      </div>

      <span
        class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border shadow-xs"
        :style="{ color: dayColor, backgroundColor: `${dayColor}15`, borderColor: `${dayColor}40` }"
      >
        {{ day.places.length }} điểm
      </span>
    </div>

    <!-- Draggable Places Area -->
    <draggable
      :list="day.places"
      group="places"
      item-key="id"
      class="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[120px] relative"
      ghost-class="drop-ghost"
      chosen-class="sortable-chosen"
      drag-class="sortable-drag"
      animation="250"
      @change="onDragChange"
    >
      <template #item="{ element, index }">
        <PlaceCard
          :key="element.id"
          :place="element"
          :order-number="index + 1"
          :day-color="dayColor"
        />
      </template>

      <!-- Empty state inside column -->
      <template #footer>
        <div
          v-if="day.places.length === 0"
          class="h-28 border-2 border-dashed border-slate-300/80 rounded-2xl flex flex-col items-center justify-center text-slate-400 p-4 text-center group hover:border-brand-blue hover:text-brand-blue transition cursor-pointer"
        >
          <Plus class="w-5 h-5 mb-1 group-hover:scale-110 transition" />
          <span class="text-[11px] font-medium">Kéo địa điểm vào đây</span>
        </div>
      </template>
    </draggable>
  </div>
</template>
