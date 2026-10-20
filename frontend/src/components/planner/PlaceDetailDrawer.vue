<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  X,
  Star,
  MapPin,
  Clock,
  Phone,
  Globe,
  Navigation,
  Lightbulb,
  Plus,
  Trash2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Check,
} from 'lucide-vue-next';
import type { PlaceItem, PlaceCategory } from '@/types/planner.type';
import { usePlannerStore } from '@/stores/plannerStore';
import { goongService } from '@/services/goong.service';

const props = defineProps<{
  place: PlaceItem | null;
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const plannerStore = usePlannerStore();
const activePhotoIndex = ref(0);
const richData = ref<Partial<PlaceItem>>({});
const isLoading = ref(false);
const isCopied = ref(false);

// Load rich details when place changes
watch(
  () => props.place,
  async (newPlace) => {
    activePhotoIndex.value = 0;
    if (!newPlace) {
      richData.value = {};
      return;
    }

    isLoading.value = true;
    try {
      richData.value = await goongService.getPlaceDetails(newPlace);
    } finally {
      isLoading.value = false;
    }
  },
  { immediate: true }
);

const allPhotos = computed(() => {
  if (richData.value.photos && richData.value.photos.length > 0) {
    return richData.value.photos;
  }
  if (props.place?.thumbnailUrl) {
    return [props.place.thumbnailUrl];
  }
  return ['https://images.unsplash.com/photo-1528127269322-539801943592?w=800'];
});

const nextPhoto = () => {
  if (allPhotos.value.length <= 1) return;
  activePhotoIndex.value = (activePhotoIndex.value + 1) % allPhotos.value.length;
};

const prevPhoto = () => {
  if (allPhotos.value.length <= 1) return;
  activePhotoIndex.value = (activePhotoIndex.value - 1 + allPhotos.value.length) % allPhotos.value.length;
};

const openGoogleMaps = () => {
  if (!props.place) return;
  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    props.place.placeName + ' ' + (props.place.formattedAddress || '')
  )}`;
  window.open(url, '_blank');
};

const copyAddress = async () => {
  if (!props.place?.formattedAddress) return;
  await navigator.clipboard.writeText(props.place.formattedAddress);
  isCopied.value = true;
  setTimeout(() => (isCopied.value = false), 2000);
};

const handleRemove = () => {
  if (!props.place) return;
  plannerStore.removePlace(props.place.id);
  emit('close');
};
</script>

<template>
  <!-- Wanderlog Place Detail Flyout Drawer -->
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="translate-x-full opacity-0"
    enter-to-class="translate-x-0 opacity-100"
    leave-active-class="transition-all duration-250 ease-in"
    leave-from-class="translate-x-0 opacity-100"
    leave-to-class="translate-x-full opacity-0"
  >
    <div
      v-if="isOpen && place"
      class="fixed right-0 top-0 bottom-0 z-40 w-full sm:w-96 bg-white shadow-2xl border-l border-slate-200 flex flex-col overflow-hidden"
    >
      <!-- Top Image Carousel -->
      <div class="relative h-56 bg-slate-900 flex-shrink-0 group">
        <img
          :src="allPhotos[activePhotoIndex]"
          :alt="place.placeName"
          class="w-full h-full object-cover transition-opacity duration-300"
        />

        <!-- Gradient Overlay -->
        <div class="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30 pointer-events-none"></div>

        <!-- Close Button (X) -->
        <button
          type="button"
          class="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white flex items-center justify-center transition shadow-md"
          @click="emit('close')"
        >
          <X class="w-4 h-4" />
        </button>

        <!-- Carousel Navigation Arrows -->
        <button
          v-if="allPhotos.length > 1"
          type="button"
          class="absolute left-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-sm"
          @click.stop="prevPhoto"
        >
          <ChevronLeft class="w-4 h-4" />
        </button>
        <button
          v-if="allPhotos.length > 1"
          type="button"
          class="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-sm"
          @click.stop="nextPhoto"
        >
          <ChevronRight class="w-4 h-4" />
        </button>

        <!-- Carousel Photo Dots -->
        <div v-if="allPhotos.length > 1" class="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
          <span
            v-for="(_, idx) in allPhotos"
            :key="idx"
            :class="[
              'h-1.5 rounded-full transition-all duration-200',
              idx === activePhotoIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80 cursor-pointer',
            ]"
            @click.stop="activePhotoIndex = idx"
          ></span>
        </div>

        <!-- Top Left: Rating Badge -->
        <div class="absolute bottom-3 left-4 flex items-center gap-2 z-10">
          <span class="px-2.5 py-1 rounded-xl bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1 shadow-md">
            <Star class="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
            <span>{{ richData.rating || 4.8 }}</span>
          </span>
          <span class="text-xs font-semibold text-white/90 drop-shadow-sm">
            ({{ (richData.reviewCount || 2400).toLocaleString() }} đánh giá)
          </span>
        </div>
      </div>

      <!-- Scrollable Place Details Content -->
      <div class="flex-1 overflow-y-auto p-5 space-y-4">
        <!-- Title & Category -->
        <div>
          <h2 class="text-base font-black text-slate-900 leading-snug">
            {{ place.placeName }}
          </h2>
          <p class="text-xs text-brand-blue font-bold mt-1 flex items-center gap-1">
            <span class="inline-block w-2 h-2 rounded-full bg-brand-blue"></span>
            <span>{{ place.category || 'Địa điểm du lịch' }}</span>
          </p>
        </div>

        <!-- Open Hours Status -->
        <div class="flex items-center gap-2 p-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
          <Clock class="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <div class="min-w-0">
            <p class="font-bold text-slate-800">
              <span class="text-emerald-600 font-black">Đang mở cửa</span> • {{ richData.hoursDescription || '07:30 - 21:30' }}
            </p>
          </div>
        </div>

        <!-- Address -->
        <div class="flex items-start gap-2.5 text-xs text-slate-600">
          <MapPin class="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
          <div class="flex-1 min-w-0">
            <p class="leading-relaxed">{{ place.formattedAddress || 'Đà Nẵng, Việt Nam' }}</p>
            <button
              type="button"
              class="text-[11px] text-brand-blue font-bold hover:underline mt-0.5 flex items-center gap-1"
              @click="copyAddress"
            >
              <Check v-if="isCopied" class="w-3 h-3 text-emerald-600" />
              <span>{{ isCopied ? 'Đã sao chép địa chỉ!' : 'Sao chép địa chỉ' }}</span>
            </button>
          </div>
        </div>

        <!-- Phone & Website if available -->
        <div v-if="richData.phoneNumber || richData.website" class="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
          <div v-if="richData.phoneNumber" class="flex items-center gap-2 text-slate-600">
            <Phone class="w-3.5 h-3.5 text-slate-400" />
            <a :href="`tel:${richData.phoneNumber}`" class="text-brand-blue hover:underline">{{ richData.phoneNumber }}</a>
          </div>
          <div v-if="richData.website" class="flex items-center gap-2 text-slate-600 truncate">
            <Globe class="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <a :href="richData.website" target="_blank" class="text-brand-blue hover:underline truncate flex items-center gap-1">
              <span>{{ richData.website.includes('wikipedia') ? 'Xem bài viết Wikipedia' : 'Trang web chính thức' }}</span>
              <ExternalLink class="w-3 h-3" />
            </a>
          </div>
        </div>

        <!-- Highlights & Description -->
        <div class="pt-2 border-t border-slate-100">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Giới thiệu & Điểm nổi bật
            </h3>
            <span
              v-if="richData.website?.includes('wikipedia.org')"
              class="text-[9px] font-semibold text-sky-700 bg-sky-50 border border-sky-200/60 px-1.5 py-0.5 rounded flex items-center gap-1"
            >
              <span>Nguồn: Wikipedia</span>
            </span>
          </div>
          <p class="text-xs text-slate-600 leading-relaxed">
            {{ richData.description }}
          </p>
        </div>

        <!-- Wanderlog Style: Visitor Tips / Lời khuyên du lịch -->
        <div v-if="richData.tips && richData.tips.length > 0" class="pt-2 border-t border-slate-100">
          <h3 class="text-xs font-bold text-amber-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Lightbulb class="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            Mẹo từ khách du lịch
          </h3>
          <div class="space-y-2">
            <div
              v-for="(tip, idx) in richData.tips"
              :key="idx"
              class="p-2.5 rounded-2xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-950 leading-relaxed italic"
            >
              "{{ tip }}"
            </div>
          </div>
        </div>

        <!-- Personal Notes on Card -->
        <div v-if="place.notes" class="pt-2 border-t border-slate-100">
          <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
            Ghi chú chuyến đi
          </h3>
          <p class="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            {{ place.notes }}
          </p>
        </div>
      </div>

      <!-- Bottom Sticky Actions -->
      <div class="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center gap-2 flex-shrink-0">
        <button
          type="button"
          class="flex-1 py-2.5 px-3 rounded-2xl bg-brand-blue hover:bg-blue-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
          @click="openGoogleMaps"
        >
          <Navigation class="w-3.5 h-3.5" />
          <span>Chỉ đường Maps</span>
        </button>

        <button
          type="button"
          class="p-2.5 rounded-2xl bg-white hover:bg-red-50 text-slate-500 hover:text-red-600 border border-slate-200 transition shadow-2xs"
          title="Xóa địa điểm khỏi lịch trình"
          @click="handleRemove"
        >
          <Trash2 class="w-4 h-4" />
        </button>
      </div>
    </div>
  </Transition>
</template>
