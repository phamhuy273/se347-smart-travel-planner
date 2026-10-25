<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import CreateTripModal from '@/components/trips/CreateTripModal.vue';
import { useActivityStore } from '@/stores/activity.store';
import { getUpcomingTrip, uploadImage, updateTrip } from '@/services/trip.service';
import {
  Compass,
  Clock,
  CalendarDays,
  CheckCircle2,
  Circle,
  Plus,
  ChevronRight,
  ChevronLeft,
  Bookmark,
  Map,
  Star,
  Users,
  Heart,
  Edit3,
  Save,
  Eye,
  Send,
  X,
  Camera,
  Loader2,
  Trash2,
} from 'lucide-vue-next';
import phuQuocCover from '@/assets/trips/phu-quoc-cover.png';
import mekongDeltaImage from '@/assets/trips/mekong-delta.jpg';
import baliImage from '@/assets/trips/bali.jpg';
import coastalEscapeImage from '@/assets/trips/coastal-escape.jpg';
import haGiangImage from '@/assets/trips/ha-giang.jpg';
import hoiAnImage from '@/assets/trips/hoi-an.jpg';

const router = useRouter();
const activityStore = useActivityStore();
const createTripModalOpen = ref(false);

const openCreateTripModal = () => {
  createTripModalOpen.value = true;
};

const onTripCreated = async () => {
  createTripModalOpen.value = false;
  await fetchUpcomingTrip();
  await activityStore.loadActivities();
  router.push('/trips');
};

const bannerFileInput = ref<HTMLInputElement | null>(null);
const isUploadingBanner = ref(false);

const triggerBannerInput = () => {
  bannerFileInput.value?.click();
};

const onBannerFileSelected = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;

  try {
    isUploadingBanner.value = true;
    const url = await uploadImage(file);
    if (url) {
      upcomingTrip.value.coverImage = url;
      if (upcomingTrip.value.id) {
        await updateTrip(upcomingTrip.value.id, { cover_image_url: url });
      }
      activityStore.addActivity({
        type: 'UPDATE_COVER',
        text: `Bạn đã cập nhật ảnh bìa chuyến đi "${upcomingTrip.value.title}"`,
      });
    }
  } catch (err) {
    console.error('Lỗi tải ảnh bìa:', err);
  } finally {
    isUploadingBanner.value = false;
    if (bannerFileInput.value) bannerFileInput.value.value = '';
  }
};

// ─── Clock & Date ────────────────────────────────────────────────
const now = ref(new Date());
let clockInterval: ReturnType<typeof setInterval>;
const authStore = useAuthStore();

onMounted(async () => {
  clockInterval = setInterval(() => {
    now.value = new Date();
  }, 1000);
  loadChecklist();
  await fetchUpcomingTrip();
  await activityStore.loadActivities();
});

const fetchUpcomingTrip = async () => {
  try {
    const response: any = await getUpcomingTrip();
    const data = response?.data || response;
    if (data) {
      upcomingTrip.value = mapUpcomingTrip(data);
    }
  } catch (err) {
    // Giữ mock data nếu không có chuyến đi sắp tới
  } finally {
    loadChecklist();
  }
};

onUnmounted(() => {
  clearInterval(clockInterval);
});

const timeString = computed(() => {
  const h = now.value.getHours().toString().padStart(2, '0');
  const m = now.value.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
});

const dateString = computed(() => {
  return now.value.toLocaleDateString('vi-VN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
});

// Clock hands angles
const secondAngle = computed(() => now.value.getSeconds() * 6);
const minuteAngle = computed(() => now.value.getMinutes() * 6 + now.value.getSeconds() * 0.1);
const hourAngle = computed(() => (now.value.getHours() % 12) * 30 + now.value.getMinutes() * 0.5);

// ─── Calendar ────────────────────────────────────────────────────
const currentMonth = ref(now.value.getMonth());
const currentYear = ref(now.value.getFullYear());
const selectedDate = ref(
  new Date(now.value.getFullYear(), now.value.getMonth(), now.value.getDate()),
);

const monthName = computed(() => {
  const date = new Date(currentYear.value, currentMonth.value);
  return date.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
});

const capitalizedMonth = computed(() => {
  return monthName.value.charAt(0).toUpperCase() + monthName.value.slice(1);
});

const selectedDateLabel = computed(() => {
  const label = selectedDate.value.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
});

const weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

const calendarDays = computed(() => {
  const firstDay = new Date(currentYear.value, currentMonth.value, 1);
  const lastDay = new Date(currentYear.value, currentMonth.value + 1, 0);
  const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Monday = 0
  const totalDays = lastDay.getDate();
  const days: (number | null)[] = [];

  for (let i = 0; i < startDay; i++) days.push(null);
  for (let i = 1; i <= totalDays; i++) days.push(i);

  return days;
});

const isToday = (day: number | null) => {
  if (!day) return false;
  const today = new Date();
  return (
    day === today.getDate() &&
    currentMonth.value === today.getMonth() &&
    currentYear.value === today.getFullYear()
  );
};

const isSelectedDay = (day: number | null) =>
  Boolean(
    day &&
      day === selectedDate.value.getDate() &&
      currentMonth.value === selectedDate.value.getMonth() &&
      currentYear.value === selectedDate.value.getFullYear(),
  );

const selectCalendarDay = (day: number | null) => {
  if (!day) return;
  selectedDate.value = new Date(currentYear.value, currentMonth.value, day);
};

const changeMonth = (offset: number) => {
  const nextMonth = new Date(currentYear.value, currentMonth.value + offset, 1);
  const lastDayOfMonth = new Date(
    nextMonth.getFullYear(),
    nextMonth.getMonth() + 1,
    0,
  ).getDate();

  currentMonth.value = nextMonth.getMonth();
  currentYear.value = nextMonth.getFullYear();
  selectedDate.value = new Date(
    currentYear.value,
    currentMonth.value,
    Math.min(selectedDate.value.getDate(), lastDayOfMonth),
  );
};

// ─── Upcoming Trip (API) ────────────────────────────────────
const upcomingTrip = ref<any>({
  id: null,
  title: 'Phú Quốc Luxury 5 sao',
  location: 'Phú Quốc, Việt Nam',
  duration: '5 ngày',
  dateRange: '20/08/2025 → 24/08/2025',
  daysLeft: 27,
  members: 4,
  coverImage: phuQuocCover,
});

const mapUpcomingTrip = (trip: any) => {
  const start = trip.start_date ? new Date(trip.start_date) : null;
  const end = trip.end_date ? new Date(trip.end_date) : null;
  const formatDate = (d: Date) => {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };
  const dateRange = start && end ? `${formatDate(start)} → ${formatDate(end)}` : trip.dateRange || '';
  const daysCount = trip.days?.length || trip._count?.days || 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysLeft = start ? Math.max(0, Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))) : trip.daysLeft || 0;

  return {
    id: trip.id,
    title: trip.title,
    location: trip.destination || trip.location || '',
    duration: daysCount > 0 ? `${daysCount} ngày` : trip.duration || '',
    dateRange,
    daysLeft,
    members: trip.members_count || 1,
    coverImage: trip.cover_image_url || trip.coverImage || phuQuocCover,
  };
};

const openUpcomingTrip = () => {
  if (upcomingTrip.value.id) {
    router.push(`/planner/${upcomingTrip.value.id}`);
  }
};

// ─── Interactive & Persisted Checklist ───────────────────────────
interface ChecklistItem {
  id: string | number;
  text: string;
  done: boolean;
}

const checklist = ref<ChecklistItem[]>([
  { id: 1, text: 'Đặt vé máy bay', done: true },
  { id: 2, text: 'Đặt phòng khách sạn', done: true },
  { id: 3, text: 'Mua bảo hiểm du lịch', done: false },
  { id: 4, text: 'Đổi tiền mặt', done: false },
  { id: 5, text: 'Cài app bản đồ offline', done: false },
]);

const newItemText = ref('');

const loadChecklist = () => {
  const tripKey = upcomingTrip.value?.id
    ? `wanderflow_checklist_${upcomingTrip.value.id}`
    : 'wanderflow_checklist_default';
  const saved = localStorage.getItem(tripKey);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        checklist.value = parsed;
        return;
      }
    } catch (e) {
      console.error('Failed to parse checklist', e);
    }
  }
  checklist.value = [
    { id: 1, text: 'Đặt vé máy bay', done: true },
    { id: 2, text: 'Đặt phòng khách sạn', done: true },
    { id: 3, text: 'Mua bảo hiểm du lịch', done: false },
    { id: 4, text: 'Đổi tiền mặt', done: false },
    { id: 5, text: 'Cài app bản đồ offline', done: false },
  ];
};

const saveChecklist = () => {
  const tripKey = upcomingTrip.value?.id
    ? `wanderflow_checklist_${upcomingTrip.value.id}`
    : 'wanderflow_checklist_default';
  localStorage.setItem(tripKey, JSON.stringify(checklist.value));
};

const checklistDone = computed(() => checklist.value.filter((c) => c.done).length);

const toggleCheck = (id: string | number) => {
  const item = checklist.value.find((c) => c.id === id);
  if (item) {
    item.done = !item.done;
    saveChecklist();
    if (item.done) {
      activityStore.addActivity({
        type: 'CHECKLIST',
        text: `Bạn đã chuẩn bị xong: "${item.text}"`,
      });
    }
  }
};

const addChecklistItem = () => {
  const text = newItemText.value.trim();
  if (!text) return;
  checklist.value.push({
    id: Date.now().toString(),
    text,
    done: false,
  });
  newItemText.value = '';
  saveChecklist();
  activityStore.addActivity({
    type: 'CHECKLIST',
    text: `Bạn đã thêm mục chuẩn bị: "${text}"`,
  });
};

const removeChecklistItem = (id: string | number) => {
  checklist.value = checklist.value.filter((c) => c.id !== id);
  saveChecklist();
};

// ─── Real Activity Icon Resolver ────────────────────────────────
const handleClearActivities = () => {
  activityStore.clearActivities();
};

const getActivityIcon = (iconName?: string) => {
  switch (iconName) {
    case 'Plus':
      return Plus;
    case 'Trash2':
      return Trash2;
    case 'MapPin':
      return Map;
    case 'CheckCircle2':
      return CheckCircle2;
    case 'Camera':
      return Camera;
    default:
      return Edit3;
  }
};

// ─── Mock Data: Statistics ───────────────────────────────────────
const stats = ref([
  { label: 'chuyến sắp tới', value: 2, icon: CalendarDays, color: 'text-brand-blue' },
  { label: 'địa điểm đã lưu', value: 5, icon: Bookmark, color: 'text-brand-orange' },
  { label: 'lịch trình đã tạo', value: 12, icon: Map, color: 'text-emerald-500' },
]);

// ─── Mock Data: Featured Itineraries ─────────────────────────────
const featuredTrips = ref([
  {
    id: 1,
    title: 'Hương vị miền Tây',
    duration: '3 ngày',
    rating: 4.8,
    saves: 105,
    image: mekongDeltaImage,
  },
  {
    id: 2,
    title: 'Bali, chậm một nhịp',
    duration: '5 ngày',
    rating: 4.7,
    saves: 298,
    image: baliImage,
  },
  {
    id: 3,
    title: 'Lang thang phố biển',
    duration: '4 ngày',
    rating: 4.6,
    saves: 185,
    image: coastalEscapeImage,
  },
  {
    id: 4,
    title: 'Cao nguyên đá Hà Giang',
    duration: '4 ngày',
    rating: 4.9,
    saves: 142,
    image: haGiangImage,
  },
  {
    id: 5,
    title: 'Phố cổ Hội An',
    duration: '3 ngày',
    rating: 4.8,
    saves: 302,
    image: hoiAnImage,
  },
]);

// Featured trips scroll
const featuredScroller = ref<HTMLElement | null>(null);

const scrollFeatured = (direction: 'left' | 'right') => {
  if (featuredScroller.value) {
    const scrollAmount = 280;
    featuredScroller.value.scrollBy({
      left: direction === 'right' ? scrollAmount : -scrollAmount,
      behavior: 'smooth',
    });
  }
};
</script>

<template>
  <div class="flex flex-col gap-4 pb-4">
    <!-- Greeting -->
    <h2 class="text-xl font-bold text-slate-800">Chào, {{ authStore.displayName }}! 👋</h2>
    <!-- ═══════════════════════════════════════════════════════════
         1. BANNER — Khám phá điểm đến mới
         ═══════════════════════════════════════════════════════════ -->
    <div
      class="relative -mr-5 min-h-[60px] overflow-hidden rounded-2xl bg-gradient-to-r from-[#159e9b] to-[#31c6c1] px-3 py-2.5 flex items-center justify-between shadow-sm"
    >
      <div class="flex items-center gap-2.5 z-10">
        <div class="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center shadow-sm">
          <Compass class="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 class="text-white font-bold text-xs">Khám phá điểm đến mới</h2>
          <p class="text-white/80 text-[10px] mt-0.5">Tìm cảm hứng cho chuyến đi tiếp theo của bạn</p>
        </div>
      </div>
      <button
        class="z-10 px-3 py-1.5 bg-white hover:bg-teal-50 text-teal-700 text-[10px] font-bold rounded-full transition-all duration-200 shadow-sm"
      >
        Khám phá ngay <span aria-hidden="true">→</span>
      </button>
      <div class="absolute right-1/4 -top-5 w-16 h-16 bg-white/10 rounded-full"></div>
      <div class="absolute right-[28%] top-2 text-white/30 -rotate-12">
        <Send class="w-5 h-5" />
      </div>
      <div class="absolute -right-5 -bottom-8 w-20 h-20 bg-white/10 rounded-full"></div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════
         2. MAIN CONTENT GRID — 2 columns
         ═══════════════════════════════════════════════════════════ -->
    <div class="grid grid-cols-5 gap-4">
      <!-- ─── LEFT COLUMN (3/5) ─────────────────────────────── -->
      <div class="col-span-3 flex flex-col gap-4">
        <!-- 2a. UNIFIED UPCOMING TRIP & CHECKLIST CARD -->
        <div class="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <!-- Top: Upcoming Trip Banner -->
          <div class="relative overflow-hidden cursor-pointer group" @click="openUpcomingTrip">
            <img
              :src="upcomingTrip.coverImage"
              :alt="upcomingTrip.title"
              class="w-full h-56 sm:h-60 object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <!-- Dark gradient overlay covering bottom half -->
            <div class="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/45 to-transparent"></div>

            <!-- UPCOMING TRIP badge -->
            <span
              class="absolute top-4 left-4 px-3 py-1 bg-[#ff5b19] text-white text-[10px] font-extrabold rounded-full tracking-wider uppercase shadow-sm"
            >
              Upcoming Trip
            </span>

            <!-- Change banner image button -->
            <button
              type="button"
              class="absolute top-4 right-28 bg-black/60 hover:bg-black/80 text-white/90 hover:text-white px-2.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1.5 backdrop-blur-md border border-white/20 transition-all z-10 shadow-sm"
              :disabled="isUploadingBanner"
              title="Đổi ảnh bìa chuyến đi"
              @click.stop="triggerBannerInput"
            >
              <Loader2 v-if="isUploadingBanner" class="w-3 h-3 animate-spin" />
              <Camera v-else class="w-3 h-3" />
              <span>{{ isUploadingBanner ? 'Đang tải...' : 'Đổi ảnh' }}</span>
            </button>
            <input
              ref="bannerFileInput"
              type="file"
              accept="image/*"
              class="hidden"
              @change="onBannerFileSelected"
            />

            <!-- Days left badge -->
            <div
              v-if="upcomingTrip.daysLeft !== undefined && upcomingTrip.daysLeft !== null"
              class="absolute top-3.5 right-4 bg-slate-900/80 backdrop-blur-md rounded-xl px-3 py-1.5 text-center shadow-lg border border-white/10"
            >
              <span class="text-amber-300 font-black text-lg leading-none block">{{ upcomingTrip.daysLeft }}</span>
              <span class="text-white/80 text-[9px] font-medium tracking-tight">ngày nữa</span>
            </div>

            <!-- Banner info overlay -->
            <div class="absolute bottom-3.5 left-4 right-4 flex flex-col gap-2.5">
              <div>
                <h3 class="font-extrabold text-white text-base sm:text-lg drop-shadow-md leading-tight">
                  {{ upcomingTrip.title }}
                </h3>
                <p class="text-white/90 text-[11px] mt-1 drop-shadow flex items-center gap-1 font-medium">
                  <span>📍</span>
                  <span>{{ upcomingTrip.location }} · {{ upcomingTrip.duration }} · {{ upcomingTrip.dateRange }}</span>
                </p>
              </div>

              <!-- Members & Open Itinerary Button -->
              <div class="flex items-center justify-between pt-1">
                <div class="flex items-center gap-2">
                  <!-- Member avatars -->
                  <div class="flex -space-x-2">
                    <div
                      v-for="i in Math.min(upcomingTrip.members || 1, 4)"
                      :key="i"
                      class="w-7 h-7 rounded-full border-2 border-white/80 bg-white/20 backdrop-blur-xs flex items-center justify-center text-[9px] font-bold text-white shadow-sm"
                    >
                      {{ ['PH', 'MT', 'TA', 'VN'][i - 1] || 'U' + i }}
                    </div>
                  </div>
                  <span class="text-white/90 text-xs font-medium">{{ upcomingTrip.members || 1 }} thành viên</span>
                </div>

                <button
                  class="px-3.5 py-1.5 bg-[#d2f8e8] hover:bg-[#bbf3dd] text-[#0f766e] text-xs font-bold rounded-full transition-all duration-200 shadow-sm active:scale-95 flex items-center gap-1"
                  @click.stop="openUpcomingTrip"
                >
                  Mở lịch trình →
                </button>
              </div>
            </div>
          </div>

          <!-- Bottom: Checklist & Action -->
          <div class="p-6 flex flex-col">
            <!-- Header -->
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-extrabold text-slate-800 text-base">Chuẩn bị hành lý</h3>
              <span class="text-xs font-bold text-[#0d9488]">{{ checklistDone }}/{{ checklist.length }}</span>
            </div>

            <!-- Progress bar -->
            <div class="w-full h-1.5 bg-[#e2f2ef] rounded-full mb-4 overflow-hidden">
              <div
                class="h-full bg-[#0d9488] rounded-full transition-all duration-300"
                :style="{ width: `${checklist.length > 0 ? (checklistDone / checklist.length) * 100 : 0}%` }"
              ></div>
            </div>

            <!-- Checklist items -->
            <div class="space-y-3">
              <div
                v-for="item in checklist"
                :key="item.id"
                class="flex items-center justify-between group cursor-pointer select-none py-0.5"
                @click="toggleCheck(item.id)"
              >
                <div class="flex items-center gap-3">
                  <!-- Custom Checkbox -->
                  <div
                    class="w-5 h-5 rounded-md flex items-center justify-center transition-all duration-200"
                    :class="item.done ? 'bg-[#0d9488] text-white shadow-xs' : 'border border-slate-300 hover:border-slate-400 bg-white'"
                  >
                    <svg
                      v-if="item.done"
                      class="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      stroke-width="3"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>

                  <!-- Text -->
                  <span
                    :class="[
                      'text-xs font-medium transition-all duration-200',
                      item.done ? 'text-slate-400 line-through' : 'text-slate-700',
                    ]"
                  >
                    {{ item.text }}
                  </span>
                </div>

                <!-- Delete item on hover -->
                <button
                  v-if="checklist.length > 1"
                  class="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-opacity p-1 text-xs"
                  title="Xóa mục này"
                  @click.stop="removeChecklistItem(item.id)"
                >
                  <X class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <!-- Add new item quick input -->
            <div class="mt-3.5 pt-2 flex items-center gap-2">
              <input
                v-model="newItemText"
                type="text"
                placeholder="+ Thêm đồ dùng cần chuẩn bị..."
                class="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#0d9488] focus:bg-white transition-all text-slate-700 placeholder:text-slate-400"
                @keyup.enter="addChecklistItem"
              />
              <button
                v-if="newItemText.trim()"
                class="px-3 py-1.5 bg-[#0d9488] hover:bg-[#0b7a6f] text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                @click="addChecklistItem"
              >
                Thêm
              </button>
            </div>

            <!-- Create new trip button -->
            <button
              class="mt-6 w-full flex items-center justify-center gap-2 py-3 bg-[#ff5b19] hover:bg-[#ea4e0f] text-white text-sm font-bold rounded-2xl transition-all duration-200 shadow-md shadow-orange-500/20 active:scale-[0.99]"
              @click="openCreateTripModal"
            >
              <Plus class="w-4 h-4 stroke-[2.5]" />
              Tạo chuyến đi mới
            </button>
          </div>
        </div>

        <!-- 2c. STATISTICS — Kế hoạch chuyến đi -->
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <Map class="w-4 h-4 text-brand-blue" />
              <h3 class="font-bold text-slate-900 text-sm">Kế hoạch chuyến đi</h3>
            </div>
            <button class="text-brand-blue text-xs font-semibold hover:underline">
              Xem chi tiết →
            </button>
          </div>
          <div class="grid grid-cols-3 gap-3">
            <div
              v-for="stat in stats"
              :key="stat.label"
              class="bg-slate-50 rounded-xl p-4 flex flex-col items-center gap-2 hover:bg-slate-100 transition-colors duration-150"
            >
              <div
                class="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center"
              >
                <component :is="stat.icon" class="w-4 h-4" :class="stat.color" />
              </div>
              <span class="text-xl font-extrabold text-slate-900">{{ stat.value }}</span>
              <span class="text-[10px] text-slate-400 font-medium text-center leading-tight">{{ stat.label }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ─── RIGHT COLUMN (2/5) ────────────────────────────── -->
      <div class="col-span-2 flex flex-col gap-4">
        <!-- 2d. CLOCK & CALENDAR -->
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <!-- Clock -->
          <div class="flex items-center gap-4 mb-5">
            <!-- Analog clock -->
            <div class="relative w-16 h-16 flex-shrink-0">
              <svg viewBox="0 0 100 100" class="w-full h-full">
                <!-- Clock face -->
                <circle cx="50" cy="50" r="48" fill="none" stroke="#E2E8F0" stroke-width="2" />
                <circle cx="50" cy="50" r="44" fill="#F8FAFC" />
                <!-- Hour markers -->
                <line
                  v-for="i in 12"
                  :key="'h' + i"
                  :x1="50 + 38 * Math.cos(((i * 30 - 90) * Math.PI) / 180)"
                  :y1="50 + 38 * Math.sin(((i * 30 - 90) * Math.PI) / 180)"
                  :x2="50 + 42 * Math.cos(((i * 30 - 90) * Math.PI) / 180)"
                  :y2="50 + 42 * Math.sin(((i * 30 - 90) * Math.PI) / 180)"
                  stroke="#94A3B8"
                  stroke-width="2"
                  stroke-linecap="round"
                />
                <!-- Hour hand -->
                <line
                  x1="50"
                  y1="50"
                  :x2="50 + 24 * Math.cos(((hourAngle - 90) * Math.PI) / 180)"
                  :y2="50 + 24 * Math.sin(((hourAngle - 90) * Math.PI) / 180)"
                  stroke="#0F172A"
                  stroke-width="3"
                  stroke-linecap="round"
                />
                <!-- Minute hand -->
                <line
                  x1="50"
                  y1="50"
                  :x2="50 + 32 * Math.cos(((minuteAngle - 90) * Math.PI) / 180)"
                  :y2="50 + 32 * Math.sin(((minuteAngle - 90) * Math.PI) / 180)"
                  stroke="#0284C7"
                  stroke-width="2"
                  stroke-linecap="round"
                />
                <!-- Second hand -->
                <line
                  x1="50"
                  y1="50"
                  :x2="50 + 34 * Math.cos(((secondAngle - 90) * Math.PI) / 180)"
                  :y2="50 + 34 * Math.sin(((secondAngle - 90) * Math.PI) / 180)"
                  stroke="#F97316"
                  stroke-width="1"
                  stroke-linecap="round"
                />
                <!-- Center dot -->
                <circle cx="50" cy="50" r="3" fill="#0F172A" />
              </svg>
            </div>
            <div>
              <p class="text-2xl font-extrabold text-slate-900 tracking-tight">{{ timeString }}</p>
              <p class="text-xs text-slate-400 mt-0.5">{{ dateString }}</p>
            </div>
          </div>

          <!-- Calendar -->
          <div>
            <div class="flex items-center justify-between mb-3">
              <h4 class="text-xs font-bold text-slate-700">{{ capitalizedMonth }}</h4>
              <div class="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Tháng trước"
                  class="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                  @click="changeMonth(-1)"
                >
                  <ChevronLeft class="w-4 h-4" />
                </button>
                <button
                  type="button"
                  aria-label="Tháng sau"
                  class="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                  @click="changeMonth(1)"
                >
                  <ChevronRight class="w-4 h-4" />
                </button>
              </div>
            </div>
            <!-- Weekday headers -->
            <div class="grid grid-cols-7 gap-1 mb-1">
              <div
                v-for="day in weekDays"
                :key="day"
                class="text-center text-[10px] font-semibold text-slate-400 py-1"
              >
                {{ day }}
              </div>
            </div>
            <!-- Days -->
            <div class="grid grid-cols-7 gap-1">
              <button
                v-for="(day, index) in calendarDays"
                :key="'d' + index"
                type="button"
                :disabled="!day"
                :aria-label="day ? `${day} ${capitalizedMonth}` : undefined"
                class="text-center py-1.5 text-xs rounded-full transition-colors duration-150 disabled:cursor-default"
                :class="[
                  day && !isSelectedDay(day) ? 'cursor-pointer hover:bg-slate-100' : '',
                  isSelectedDay(day)
                    ? 'bg-brand-blue text-white font-bold'
                    : isToday(day)
                      ? 'text-brand-blue font-bold ring-1 ring-brand-blue/40'
                      : 'text-slate-600',
                ]"
                @click="selectCalendarDay(day)"
              >
                {{ day || '' }}
              </button>
            </div>
            <p class="mt-3 text-[10px] text-slate-400">
              Đã chọn: <span class="font-semibold text-slate-600">{{ selectedDateLabel }}</span>
            </p>
          </div>
        </div>

        <!-- 2e. ACTIVITY FEED — Hoạt động gần đây -->
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex-1 flex flex-col">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-bold text-slate-900 text-sm">Hoạt động gần đây</h3>
            <button
              v-if="activityStore.activities.length > 0"
              type="button"
              class="text-slate-400 hover:text-rose-500 text-xs font-semibold hover:underline cursor-pointer transition-colors"
              @click="handleClearActivities"
            >
              Xóa lịch sử
            </button>
          </div>
          <div v-if="activityStore.activities.length > 0" class="space-y-3">
            <div
              v-for="activity in activityStore.activities"
              :key="activity.id"
              class="flex items-start gap-3 py-2 px-2 rounded-xl hover:bg-slate-50 transition-colors duration-150"
            >
              <div
                class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                :style="{ backgroundColor: activity.color + '15' }"
              >
                <component
                  :is="getActivityIcon(activity.iconName)"
                  class="w-3.5 h-3.5"
                  :style="{ color: activity.color }"
                />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-xs text-slate-700 leading-relaxed font-medium">{{ activity.text }}</p>
                <p class="text-[10px] text-slate-400 mt-0.5">{{ activity.time }}</p>
              </div>
            </div>
          </div>
          <!-- Empty State khi chưa có hoạt động nào -->
          <div v-else class="py-8 flex flex-col items-center justify-center text-center flex-1">
            <div class="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-2">
              <Clock class="w-5 h-5 stroke-[1.5]" />
            </div>
            <p class="text-xs font-semibold text-slate-600">Chưa có hoạt động nào</p>
            <p class="text-[10px] text-slate-400 mt-0.5 max-w-[200px]">Các hoạt động tạo chuyến đi, thêm địa điểm hoặc chuẩn bị hành lý sẽ được lưu tại đây</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════
         3. FEATURED ITINERARIES — Lịch trình nổi bật
         ═══════════════════════════════════════════════════════════ -->
    <div class="rounded-2xl border border-slate-100 bg-white/95 shadow-sm p-4 sm:p-5">
      <div class="flex items-center justify-between mb-3">
        <div>
          <span class="text-[10px] font-bold text-brand-orange tracking-widest uppercase">Gợi ý cho bạn</span>
          <h3 class="font-bold text-slate-900 text-sm mt-0.5">Lịch trình nổi bật</h3>
        </div>
        <button class="text-brand-blue text-xs font-semibold hover:underline">
          Khám phá
        </button>
      </div>
      <div class="relative">
        <!-- Scroll buttons -->
        <button
          class="absolute -left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white shadow-lg border border-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-700 hover:shadow-xl transition-all duration-200"
          @click="scrollFeatured('left')"
        >
          <ChevronLeft class="w-4 h-4" />
        </button>
        <button
          class="absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white shadow-lg border border-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-700 hover:shadow-xl transition-all duration-200"
          @click="scrollFeatured('right')"
        >
          <ChevronRight class="w-4 h-4" />
        </button>
        <!-- Cards scroller -->
        <div
          ref="featuredScroller"
          class="flex gap-4 overflow-x-auto scrollbar-hide pb-2 px-1"
          style="scroll-snap-type: x mandatory"
        >
          <div
            v-for="trip in featuredTrips"
            :key="trip.id"
            class="flex-shrink-0 w-52 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer group"
            style="scroll-snap-align: start"
          >
            <div class="relative h-28 overflow-hidden">
              <img
                :src="trip.image"
                :alt="trip.title"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <span
                class="absolute top-2 right-2 px-2 py-0.5 bg-white/90 backdrop-blur-sm text-[10px] font-bold text-brand-orange rounded-full"
              >
                {{ trip.duration }}
              </span>
            </div>
            <div class="p-3">
              <h4 class="text-xs font-bold text-slate-900 truncate">{{ trip.title }}</h4>
              <div class="flex items-center justify-between mt-2">
                <div class="flex items-center gap-1">
                  <Star class="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span class="text-[10px] font-semibold text-slate-700">{{ trip.rating }}</span>
                </div>
                <div class="flex items-center gap-1 text-slate-400">
                  <Eye class="w-3 h-3" />
                  <span class="text-[10px]">{{ trip.saves }} lượt lưu</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <CreateTripModal v-if="createTripModalOpen" @close="createTripModalOpen = false" @created="onTripCreated" />
</template>

<style scoped>
/* Hide scrollbar for featured trips */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
