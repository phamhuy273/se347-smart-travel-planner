<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '@/stores/auth.store';
import {
  MapPin,
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
} from 'lucide-vue-next';

// ─── Clock & Date ────────────────────────────────────────────────
const now = ref(new Date());
let clockInterval: ReturnType<typeof setInterval>;
const authStore = useAuthStore();

onMounted(() => {
  clockInterval = setInterval(() => {
    now.value = new Date();
  }, 1000);
});

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

const monthName = computed(() => {
  const date = new Date(currentYear.value, currentMonth.value);
  return date.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
});

const capitalizedMonth = computed(() => {
  return monthName.value.charAt(0).toUpperCase() + monthName.value.slice(1);
});

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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

// ─── Mock Data: Upcoming Trip ────────────────────────────────────
const upcomingTrip = ref({
  title: 'Phú Quốc Luxury 5 sao',
  location: 'Phú Quốc, Việt Nam',
  duration: '5 ngày',
  dateRange: '29/10/2026 → 3/11/2026',
  daysLeft: 27,
  members: 4,
  coverImage: 'https://images.unsplash.com/photo-1558005137-d9619a5c539f?w=600&h=300&fit=crop',
});

// ─── Mock Data: Checklist ────────────────────────────────────────
const checklist = ref([
  { id: 1, text: 'Đặt vé máy bay', done: true },
  { id: 2, text: 'Đặt phòng khách sạn', done: true },
  { id: 3, text: 'Mua bảo hiểm du lịch', done: false },
  { id: 4, text: 'Đổi tiền mặt', done: false },
  { id: 5, text: 'Cài app bản đồ offline', done: false },
]);

const checklistDone = computed(() => checklist.value.filter((c) => c.done).length);

const toggleCheck = (id: number) => {
  const item = checklist.value.find((c) => c.id === id);
  if (item) item.done = !item.done;
};

// ─── Mock Data: Activities ───────────────────────────────────────
const activities = ref([
  {
    id: 1,
    text: 'Bạn vừa tạo chuyến đi "Đà Nẵng & Hội An"',
    color: '#22C55E',
    icon: Plus,
    time: '2 giờ trước',
  },
  {
    id: 2,
    text: 'Minh Tú đã tham gia chuyến đi "Phú Quốc Luxury"',
    color: '#0284C7',
    icon: Users,
    time: '5 giờ trước',
  },
  {
    id: 3,
    text: 'Lịch trình "Kyoto mùa lá đỏ" nhận được 12 lượt thích mới',
    color: '#EAB308',
    icon: Heart,
    time: '1 ngày trước',
  },
  {
    id: 4,
    text: 'Tuấn Anh đã chỉnh sửa lịch trình "Hà Giang" của bạn',
    color: '#F97316',
    icon: Edit3,
    time: '2 ngày trước',
  },
  {
    id: 5,
    text: 'Bạn đã lưu lịch trình "Bali — Đảo của các vị thần"',
    color: '#0284C7',
    icon: Save,
    time: '3 ngày trước',
  },
]);

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
    image: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=300&h=200&fit=crop',
  },
  {
    id: 2,
    title: 'Bali, chậm một nhịp',
    duration: '5 ngày',
    rating: 4.7,
    saves: 298,
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=300&h=200&fit=crop',
  },
  {
    id: 3,
    title: 'Lang thang phố biển',
    duration: '4 ngày',
    rating: 4.6,
    saves: 185,
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300&h=200&fit=crop',
  },
  {
    id: 4,
    title: 'Cao nguyên đá Hà Giang',
    duration: '4 ngày',
    rating: 4.9,
    saves: 142,
    image: 'https://images.unsplash.com/photo-1570366583862-f91883984fde?w=300&h=200&fit=crop',
  },
  {
    id: 5,
    title: 'Phố cổ Hội An',
    duration: '3 ngày',
    rating: 4.8,
    saves: 302,
    image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=300&h=200&fit=crop',
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
  <div class="flex flex-col gap-5 pb-4">
    <!-- Greeting -->
    <h2 class="text-xl font-bold text-slate-800">Chào, {{ authStore.displayName }}! 👋</h2>

    <!-- ═══════════════════════════════════════════════════════════
         1. BANNER — Khám phá điểm đến mới
         ═══════════════════════════════════════════════════════════ -->
    <div
      class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-orange to-orange-400 px-6 py-5 flex items-center justify-between"
    >
      <div class="flex items-center gap-4 z-10">
        <div class="w-11 h-11 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <MapPin class="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 class="text-white font-bold text-base">Khám phá điểm đến mới</h2>
          <p class="text-white/80 text-xs mt-0.5">Tìm cảm hứng cho chuyến đi tiếp theo của bạn</p>
        </div>
      </div>
      <button
        class="z-10 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-xs font-semibold rounded-full transition-all duration-200 border border-white/30"
      >
        Khám phá ngay →
      </button>
      <!-- Decorative circles -->
      <div class="absolute -right-6 -top-6 w-28 h-28 bg-white/10 rounded-full"></div>
      <div class="absolute -right-2 -bottom-8 w-20 h-20 bg-white/5 rounded-full"></div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════
         2. MAIN CONTENT GRID — 2 columns
         ═══════════════════════════════════════════════════════════ -->
    <div class="grid grid-cols-5 gap-5">
      <!-- ─── LEFT COLUMN (3/5) ─────────────────────────────── -->
      <div class="col-span-3 flex flex-col gap-5">
        <!-- 2a. UPCOMING TRIP CARD -->
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div class="relative h-40 overflow-hidden">
            <img
              :src="upcomingTrip.coverImage"
              :alt="upcomingTrip.title"
              class="w-full h-full object-cover"
            />
            <!-- UPCOMING TRIP badge -->
            <span
              class="absolute top-3 left-3 px-2.5 py-1 bg-emerald-500 text-white text-[10px] font-bold rounded-full tracking-wider uppercase"
            >
              Upcoming Trip
            </span>
            <!-- Days left badge -->
            <div
              class="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-1.5 text-center shadow-sm"
            >
              <span class="text-brand-orange font-extrabold text-lg leading-none block">{{ upcomingTrip.daysLeft }}</span>
              <span class="text-slate-500 text-[9px] font-medium">ngày nữa</span>
            </div>
          </div>
          <div class="p-4">
            <h3 class="font-bold text-slate-900 text-sm">{{ upcomingTrip.title }}</h3>
            <p class="text-slate-400 text-xs mt-1">
              {{ upcomingTrip.location }} · {{ upcomingTrip.duration }} · {{ upcomingTrip.dateRange }}
            </p>
            <div class="flex items-center justify-between mt-3">
              <div class="flex items-center gap-2">
                <!-- Member avatars -->
                <div class="flex -space-x-2">
                  <div
                    v-for="i in Math.min(upcomingTrip.members, 4)"
                    :key="i"
                    class="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold text-white"
                    :class="[
                      i === 1 ? 'bg-slate-700' : '',
                      i === 2 ? 'bg-slate-600' : '',
                      i === 3 ? 'bg-slate-500' : '',
                      i === 4 ? 'bg-slate-400' : '',
                    ]"
                  >
                    {{ ['PH', 'MT', 'TA', 'VN'][i - 1] }}
                  </div>
                </div>
                <span class="text-slate-500 text-xs">{{ upcomingTrip.members }} thành viên</span>
              </div>
              <button
                class="px-4 py-1.5 border border-slate-200 text-slate-600 text-xs font-semibold rounded-full hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
              >
                Mở lịch trình →
              </button>
            </div>
          </div>
        </div>

        <!-- 2b. CHECKLIST — Chuẩn bị hành lý -->
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <CheckCircle2 class="w-4 h-4 text-brand-blue" />
              <h3 class="font-bold text-slate-900 text-sm">Chuẩn bị hành lý</h3>
            </div>
            <span class="text-xs font-semibold text-slate-400">{{ checklistDone }}/{{ checklist.length }}</span>
          </div>
          <!-- Progress bar -->
          <div class="w-full h-1.5 bg-slate-100 rounded-full mb-4 overflow-hidden">
            <div
              class="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
              :style="{ width: `${(checklistDone / checklist.length) * 100}%` }"
            ></div>
          </div>
          <div class="space-y-2.5">
            <label
              v-for="item in checklist"
              :key="item.id"
              class="flex items-center gap-3 py-1.5 px-2 rounded-xl cursor-pointer transition-colors duration-150 hover:bg-slate-50 group"
              @click="toggleCheck(item.id)"
            >
              <CheckCircle2
                v-if="item.done"
                class="w-4.5 h-4.5 text-emerald-500 flex-shrink-0"
              />
              <Circle
                v-else
                class="w-4.5 h-4.5 text-slate-300 group-hover:text-slate-400 flex-shrink-0"
              />
              <span
                :class="[
                  'text-xs transition-all duration-150',
                  item.done ? 'text-slate-400 line-through' : 'text-slate-700',
                ]"
              >
                {{ item.text }}
              </span>
            </label>
          </div>
          <!-- Create new trip button -->
          <button
            class="mt-5 w-full flex items-center justify-center gap-2 py-2.5 bg-brand-orange hover:bg-brand-orange-hover text-white text-xs font-bold rounded-full transition-all duration-200 shadow-sm active:scale-[0.98]"
          >
            <Plus class="w-3.5 h-3.5" />
            Tạo chuyến đi mới
          </button>
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
      <div class="col-span-2 flex flex-col gap-5">
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
            <h4 class="text-xs font-bold text-slate-700 mb-3">{{ capitalizedMonth }}</h4>
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
              <div
                v-for="(day, index) in calendarDays"
                :key="'d' + index"
                class="text-center py-1.5 text-xs rounded-lg transition-colors duration-150"
                :class="[
                  day ? 'cursor-pointer hover:bg-slate-100' : '',
                  isToday(day)
                    ? 'bg-brand-blue text-white font-bold rounded-full'
                    : 'text-slate-600',
                ]"
              >
                {{ day || '' }}
              </div>
            </div>
          </div>
        </div>

        <!-- 2e. ACTIVITY FEED — Hoạt động gần đây -->
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex-1">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-bold text-slate-900 text-sm">Hoạt động gần đây</h3>
            <button class="text-brand-blue text-xs font-semibold hover:underline">
              Xem tất cả
            </button>
          </div>
          <div class="space-y-3">
            <div
              v-for="activity in activities"
              :key="activity.id"
              class="flex items-start gap-3 py-2 px-2 rounded-xl hover:bg-slate-50 transition-colors duration-150"
            >
              <div
                class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                :style="{ backgroundColor: activity.color + '15' }"
              >
                <component
                  :is="activity.icon"
                  class="w-3.5 h-3.5"
                  :style="{ color: activity.color }"
                />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-xs text-slate-700 leading-relaxed">{{ activity.text }}</p>
                <p class="text-[10px] text-slate-400 mt-0.5">{{ activity.time }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════
         3. FEATURED ITINERARIES — Lịch trình nổi bật
         ═══════════════════════════════════════════════════════════ -->
    <div>
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
