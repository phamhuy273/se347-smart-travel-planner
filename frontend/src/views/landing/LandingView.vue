<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  User,
  Compass,
  Calendar,
  Users,
  Star,
  ArrowRight,
  Sparkles,
  MapPin,
  ChevronRight,
  LogOut,
  LayoutDashboard,
} from 'lucide-vue-next';
import dashboardBg from '@/assets/backgrounds/dashboard-bg.png';
import { useAuthStore } from '@/stores/auth.store';

const router = useRouter();
const authStore = useAuthStore();
const activeNav = ref<'home' | 'explore' | 'features'>('home');
const isScrolled = ref(false);
let lastScrollY = 0;

const scrollToSection = (sectionId: 'home' | 'explore' | 'features') => {
  if (sectionId === 'home') {
    // Nếu đang ở top (< 30px) thì không có gì xảy ra
    if (window.scrollY <= 30) return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    activeNav.value = 'home';
    return;
  }

  const target = document.getElementById(sectionId);
  if (target) {
    const navbarOffset = 90;
    const elementPosition = target.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - navbarOffset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth',
    });
    activeNav.value = sectionId;
  }
};

const handleScroll = () => {
  const currentScrollY = window.scrollY;
  const delta = currentScrollY - lastScrollY;

  // Khi ở đỉnh trang (< 20px): luôn expand
  if (currentScrollY <= 20) {
    isScrolled.value = false;
  } 
  // Khi kéo xuống và đã qua 50px: thu nhỏ header
  else if (delta > 6 && currentScrollY > 50) {
    isScrolled.value = true;
  } 
  // Khi kéo lên: expand lại header
  else if (delta < -6) {
    isScrolled.value = false;
  }

  // Cập nhật lastScrollY khi có dịch chuyển đủ lớn
  if (Math.abs(delta) > 6 || currentScrollY <= 20) {
    lastScrollY = currentScrollY;
  }

  const scrollPos = currentScrollY + 130;
  const exploreEl = document.getElementById('explore');
  const featuresEl = document.getElementById('features');

  if (featuresEl && scrollPos >= featuresEl.offsetTop) {
    activeNav.value = 'features';
  } else if (exploreEl && scrollPos >= exploreEl.offsetTop) {
    activeNav.value = 'explore';
  } else {
    activeNav.value = 'home';
  }
};

onMounted(() => {
  if (authStore.token && !authStore.user) {
    authStore.fetchProfile();
  }
  window.addEventListener('scroll', handleScroll, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});

const destinations = [
  {
    name: 'Đà Nẵng',
    image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=600&q=80',
    rating: 4.8,
    reviews: '320+ lượt khám phá',
    tags: ['Biển đẹp', 'Ẩm thực', 'Check-in'],
  },
  {
    name: 'Phú Quốc',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
    rating: 4.9,
    reviews: '450+ lượt khám phá',
    tags: ['Biển xanh', 'Resort', 'Lặn biển'],
  },
  {
    name: 'Đà Lạt',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
    rating: 4.7,
    reviews: '360+ lượt khám phá',
    tags: ['Thơ mộng', 'Thiên nhiên', 'Ẩm thực'],
  },
  {
    name: 'Hội An',
    image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=600&q=80',
    rating: 4.8,
    reviews: '410+ lượt khám phá',
    tags: ['Cổ kính', 'Ẩm thực', 'Văn hóa'],
  },
  {
    name: 'Hạ Long',
    image: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=600&q=80',
    rating: 4.9,
    reviews: '520+ lượt khám phá',
    tags: ['Kỳ quan', 'Du thuyền', 'Check-in'],
  },
];

const handleGetStarted = () => {
  if (authStore.isLoggedIn) {
    router.push('/dashboard');
  } else {
    router.push('/register');
  }
};
</script>

<template>
  <div class="min-h-screen w-full bg-white text-slate-800 font-sans select-none overflow-x-hidden">
    
    <!-- FIXED FLOATING NAVBAR (Thu nhỏ mượt mà khi cuộn xuống, mở rộng khi cuộn lên) -->
    <header class="fixed top-3 sm:top-4 left-0 right-0 z-50 px-4 sm:px-8 pointer-events-none transition-all duration-500 ease-out">
      <div
        :class="[
          'mx-auto flex items-center justify-between rounded-full backdrop-blur-md border border-white/80 pointer-events-auto transition-all duration-500 ease-out will-change-[max-width,padding,box-shadow]',
          isScrolled
            ? 'max-w-5xl py-2 px-5 sm:px-6 bg-white/95 shadow-xl border-slate-200/60'
            : 'max-w-7xl py-3 sm:py-3.5 px-6 sm:px-8 bg-white/90 shadow-md'
        ]"
      >
        <!-- Logo -->
        <router-link to="/" class="flex items-center gap-1 group" @click="scrollToSection('home')">
          <span
            :class="[
              'font-black tracking-tight text-slate-900 group-hover:text-brand-orange transition-all duration-500 ease-out',
              isScrolled ? 'text-xl' : 'text-2xl'
            ]"
          >
            Trip<span class="text-brand-blue">Planner</span>
          </span>
        </router-link>

        <!-- Nav Menu -->
        <nav
          :class="[
            'hidden md:flex items-center text-xs font-bold text-slate-600 transition-all duration-500 ease-out',
            isScrolled ? 'gap-6' : 'gap-8'
          ]"
        >
          <button
            type="button"
            class="transition pb-0.5 cursor-pointer outline-none"
            :class="activeNav === 'home' ? 'text-teal-600 font-extrabold border-b-2 border-teal-600' : 'hover:text-slate-900'"
            @click="scrollToSection('home')"
          >
            Trang chủ
          </button>
          <button
            type="button"
            class="transition pb-0.5 cursor-pointer outline-none"
            :class="activeNav === 'explore' ? 'text-teal-600 font-extrabold border-b-2 border-teal-600' : 'hover:text-slate-900'"
            @click="scrollToSection('explore')"
          >
            Khám phá
          </button>
          <button
            type="button"
            class="transition pb-0.5 cursor-pointer outline-none"
            :class="activeNav === 'features' ? 'text-teal-600 font-extrabold border-b-2 border-teal-600' : 'hover:text-slate-900'"
            @click="scrollToSection('features')"
          >
            Tính năng
          </button>
        </nav>

        <!-- Auth Actions -->
        <div class="flex items-center gap-2.5 sm:gap-3">
          <template v-if="!authStore.isLoggedIn">
            <!-- Login Pill Button -->
            <router-link
              to="/login"
              :class="[
                'hidden sm:flex items-center gap-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-all duration-500 ease-out shadow-2xs',
                isScrolled ? 'px-3 py-1.5 text-[11px]' : 'px-4 py-2 text-xs'
              ]"
            >
              <User class="w-3.5 h-3.5 text-slate-400" />
              <span>Đăng nhập</span>
            </router-link>

            <!-- Get Started Orange Button -->
            <router-link
              to="/register"
              :class="[
                'flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#F97316] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] text-white font-bold shadow-md shadow-orange-500/20 active:scale-95 transition-all duration-500 ease-out',
                isScrolled ? 'px-3.5 sm:px-4 py-1.5 sm:py-2 text-[11px]' : 'px-4 sm:px-5 py-2 sm:py-2.5 text-xs'
              ]"
            >
              <span>Bắt đầu lên kế hoạch</span>
              <ArrowRight class="w-3.5 h-3.5" />
            </router-link>
          </template>

          <!-- When Logged In: Show Profile & Dashboard Link -->
          <template v-else>
            <router-link
              to="/dashboard"
              :class="[
                'flex items-center gap-2 rounded-full bg-teal-50 border border-teal-200 text-teal-800 font-bold hover:bg-teal-100 transition-all duration-500 ease-out shadow-2xs',
                isScrolled ? 'px-3 py-1.5 text-[11px]' : 'px-4 py-2 text-xs'
              ]"
            >
              <LayoutDashboard class="w-3.5 h-3.5 text-teal-600" />
              <span>{{ authStore.displayName }}</span>
            </router-link>
            <button
              :class="[
                'rounded-full border border-slate-200 bg-white hover:bg-red-50 text-slate-500 hover:text-red-600 transition-all duration-500 ease-out',
                isScrolled ? 'p-1.5' : 'p-2'
              ]"
              title="Đăng xuất"
              @click="authStore.logout()"
            >
              <LogOut class="w-3.5 h-3.5" />
            </button>
          </template>
        </div>
      </div>
    </header>

    <!-- 1. HERO SECTION WITH SCENIC BACKGROUND -->
    <section
      class="relative w-full bg-cover bg-center bg-no-repeat pt-24 sm:pt-28 pb-20 sm:pb-32 overflow-hidden"
      :style="{ backgroundImage: `url(${dashboardBg})` }"
    >
      <!-- Subtle Overlay -->
      <div class="absolute inset-0 bg-sky-900/10 pointer-events-none"></div>


      <!-- HERO CONTENT (Split: Text CTA bên trái & Mockup UI bên phải) -->
      <div id="home" class="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-2 pb-8">
        
        <!-- LEFT COLUMN: Heading, CTA & Social proof -->
        <div class="lg:col-span-6 flex flex-col items-start text-left">
          <!-- Handwriting Badge -->
          <div class="font-handwriting text-2xl sm:text-3xl font-bold text-teal-800 tracking-wide mb-2 -rotate-1">
            Cùng bạn khám phá thế giới
          </div>

          <!-- Main Heading -->
          <h1 class="text-3xl sm:text-4xl xl:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
            Lên kế hoạch cho<br />
            chuyến đi <span class="relative inline-block whitespace-nowrap">
              <span class="font-handwriting font-bold text-[#0D9488] text-4xl sm:text-5xl xl:text-6xl px-1">đáng nhớ</span>
              <svg class="absolute -bottom-1 sm:-bottom-2 left-0 w-full h-3 text-[#0D9488]" viewBox="0 0 100 12" preserveAspectRatio="none">
                <path d="M 2 10 Q 50 6 98 2" stroke="currentColor" stroke-width="4" stroke-linecap="round" fill="none" />
              </svg>
            </span>
          </h1>

          <!-- Description -->
          <p class="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-lg mb-6">
            TripPlanner giúp bạn dễ dàng lên lịch trình, khám phá những điểm đến tuyệt vời và tận hưởng hành trình cùng những người thân yêu.
          </p>

          <!-- Buttons Row -->
          <div class="flex flex-wrap items-center gap-3.5 mb-8">
            <button
              class="px-5 sm:px-6 py-3 rounded-full bg-gradient-to-r from-[#F97316] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] text-white text-xs font-bold shadow-lg shadow-orange-500/25 active:scale-95 transition flex items-center gap-2 cursor-pointer"
              @click="handleGetStarted"
            >
              <span>+ Tạo chuyến đi miễn phí</span>
              <ArrowRight class="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              class="px-4 sm:px-5 py-3 rounded-full bg-white/90 hover:bg-white border border-teal-500/50 text-teal-700 text-xs font-bold shadow-xs active:scale-95 transition flex items-center gap-2 cursor-pointer"
              @click="scrollToSection('explore')"
            >
              <Compass class="w-3.5 h-3.5 text-teal-600" />
              <span>Khám phá điểm đến</span>
            </button>
          </div>

          <!-- Social Proof Avatars -->
          <div class="flex items-center gap-3 pt-2">
            <div class="flex -space-x-2">
              <div class="w-8 h-8 rounded-full bg-teal-500 text-white font-bold text-[10px] flex items-center justify-center ring-2 ring-white shadow-xs">
                TN
              </div>
              <div class="w-8 h-8 rounded-full bg-orange-500 text-white font-bold text-[10px] flex items-center justify-center ring-2 ring-white shadow-xs">
                QA
              </div>
              <div class="w-8 h-8 rounded-full bg-blue-500 text-white font-bold text-[10px] flex items-center justify-center ring-2 ring-white shadow-xs">
                HA
              </div>
            </div>
            <div class="text-[11px] font-semibold text-slate-700 leading-tight">
              Hơn <span class="font-bold text-slate-900">10.000+ người dùng</span><br />
              đã lên kế hoạch chuyến đi cùng TripPlanner
            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN: 3D App UI Mockup (Chuẩn Figma 100%) -->
        <div class="lg:col-span-6 relative flex justify-center lg:justify-end">
          <div
            class="relative w-full max-w-[500px] xl:max-w-[550px] bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/90 p-4 transition-transform duration-500 hover:scale-[1.02] -rotate-1"
          >
            <!-- Browser Header bar -->
            <div class="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
              <div class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-full bg-red-400"></span>
                <span class="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              </div>
              <div class="text-[10px] text-slate-400 font-medium bg-slate-50 px-3 py-0.5 rounded-full">
                tripplanner.app/planner
              </div>
              <div class="w-8"></div>
            </div>

            <!-- Inner Dashboard Screen Simulation -->
            <div class="grid grid-cols-12 gap-2 text-left">
              <!-- Left Mini Sidebar -->
              <div class="col-span-3 bg-slate-50/80 rounded-xl p-2 flex flex-col gap-1.5 border border-slate-100">
                <div class="text-[9px] font-bold text-slate-700 pb-1 border-b border-slate-200">
                  Chuyến đi Đà Nẵng
                </div>
                <div class="text-[8px] bg-teal-50 text-teal-700 p-1 rounded font-medium">
                  ✓ Ngày 1: Bán đảo Sơn Trà
                </div>
                <div class="text-[8px] text-slate-500 p-1">
                  • Ngày 2: Bà Nà Hills
                </div>
                <div class="text-[8px] text-slate-500 p-1">
                  • Ngày 3: Phố cổ Hội An
                </div>
              </div>

              <!-- Center & Right Screen Content -->
              <div class="col-span-9 space-y-2">
                <!-- Cover Banner -->
                <div class="relative h-28 rounded-xl overflow-hidden shadow-inner">
                  <img
                    src="https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=600&q=80"
                    alt="Cover"
                    class="w-full h-full object-cover"
                  />
                  <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2.5">
                    <div>
                      <div class="text-white text-[11px] font-bold">Khám phá Đà Nẵng 3N2Đ</div>
                      <div class="text-slate-200 text-[8px]">15/10/2026 - 18/10/2026 • 4 thành viên</div>
                    </div>
                  </div>
                </div>

                <!-- Mini Cards Row -->
                <div class="grid grid-cols-3 gap-1.5">
                  <div class="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                    <div class="text-[8px] text-slate-400">Thời tiết</div>
                    <div class="text-[10px] font-bold text-slate-800">28°C ☀️ Nắng đẹp</div>
                  </div>
                  <div class="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                    <div class="text-[8px] text-slate-400">Ngân sách</div>
                    <div class="text-[10px] font-bold text-teal-600">3.500.000đ</div>
                  </div>
                  <div class="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                    <div class="text-[8px] text-slate-400">Địa điểm</div>
                    <div class="text-[10px] font-bold text-orange-600">12 điểm đến</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- WAVY BOTTOM CURVE (Chuẩn Figma) -->
      <div class="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none pointer-events-none">
        <svg
          class="relative block w-full h-10 sm:h-16 text-white fill-current"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path d="M0,0 C150,90 350,-40 500,45 C650,130 900,10 1200,50 L1200,120 L0,120 Z"></path>
        </svg>
      </div>
    </section>

    <!-- 2. SECTION: KHÁM PHÁ THEO CẢM HỨNG (Chuẩn Figma 100%) -->
    <section id="explore" class="max-w-7xl mx-auto px-4 sm:px-8 py-12 sm:py-16">
      <!-- Section Title & Link -->
      <div class="flex items-end justify-between mb-8">
        <div>
          <h2 class="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Khám phá theo cảm hứng
          </h2>
          <p class="text-xs text-slate-500 mt-1 font-medium">
            Những điểm đến hot nhất, được yêu thích bởi cộng đồng TripPlanner
          </p>
        </div>
        <button
          type="button"
          class="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 hover:underline transition cursor-pointer"
          @click="scrollToSection('explore')"
        >
          <span>Xem tất cả</span>
          <ArrowRight class="w-3.5 h-3.5" />
        </button>
      </div>

      <!-- Destination Cards Grid (5 Cards) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
        <div
          v-for="(item, idx) in destinations"
          :key="idx"
          class="group bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col cursor-pointer"
          @click="handleGetStarted"
        >
          <!-- Card Image with Location Badge & Action Pill -->
          <div class="relative h-36 w-full overflow-hidden">
            <img
              :src="item.image"
              :alt="item.name"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10"></div>
            
            <!-- Location Badge -->
            <div class="absolute bottom-2.5 left-2.5 flex items-center gap-1 text-white text-xs font-bold drop-shadow-sm">
              <MapPin class="w-3.5 h-3.5 text-teal-400" />
              <span>{{ item.name }}</span>
            </div>

            <!-- Arrow Action Button -->
            <div
              class="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-white/90 text-teal-700 flex items-center justify-center shadow-xs group-hover:bg-teal-600 group-hover:text-white transition"
            >
              <ChevronRight class="w-3.5 h-3.5" />
            </div>
          </div>

          <!-- Card Body -->
          <div class="p-3 flex-1 flex flex-col justify-between">
            <!-- Rating & Reviews -->
            <div class="flex items-center gap-1.5 mb-2.5">
              <div class="flex items-center text-amber-400">
                <Star class="w-3.5 h-3.5 fill-current" />
              </div>
              <span class="text-xs font-bold text-slate-800">{{ item.rating }}</span>
              <span class="text-[10px] text-slate-400">• {{ item.reviews }}</span>
            </div>

            <!-- Tags -->
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="(tag, tIdx) in item.tags"
                :key="tIdx"
                class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium"
              >
                {{ tag }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 3. SECTION: VÌ SAO CHỌN TRIPPLANNER? (Chuẩn Figma 100%) -->
    <section id="features" class="relative w-full bg-[#E0F2FE]/40 py-16 sm:py-20 border-y border-sky-100">
      <div class="max-w-7xl mx-auto px-4 sm:px-8 text-center">
        
        <!-- Header Badge -->
        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-bold mb-3 shadow-2xs">
          <Sparkles class="w-3.5 h-3.5 text-teal-500" />
          <span>Vì sao chọn TripPlanner?</span>
        </div>

        <p class="text-xs sm:text-sm text-slate-600 font-medium max-w-lg mx-auto mb-14">
          Không chỉ là một công cụ, mà là người bạn đồng hành trong mọi hành trình.
        </p>

        <!-- 3 Feature Pillars -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12 relative z-10">
          
          <!-- Pillar 1 -->
          <div class="flex flex-col items-center text-center px-4">
            <div class="w-14 h-14 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-lg shadow-teal-600/30 mb-5 transition-transform hover:scale-110">
              <Calendar class="w-6 h-6" />
            </div>
            <h3 class="text-base font-bold text-slate-900 mb-2">
              Lập lịch trình dễ dàng
            </h3>
            <p class="text-xs text-slate-500 leading-relaxed max-w-xs">
              Tùy chỉnh lịch trình theo sở thích, thời gian và ngân sách của bạn. Mọi thứ đều trong tầm tay!
            </p>
          </div>

          <!-- Pillar 2 -->
          <div class="flex flex-col items-center text-center px-4">
            <div class="w-14 h-14 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-lg shadow-teal-600/30 mb-5 transition-transform hover:scale-110">
              <Compass class="w-6 h-6" />
            </div>
            <h3 class="text-base font-bold text-slate-900 mb-2">
              Khám phá điểm đến
            </h3>
            <p class="text-xs text-slate-500 leading-relaxed max-w-xs">
              Tìm kiếm và khám phá hàng nghìn địa điểm hấp dẫn, từ những nơi nổi tiếng đến các địa điểm ẩn mình.
            </p>
          </div>

          <!-- Pillar 3 -->
          <div class="flex flex-col items-center text-center px-4">
            <div class="w-14 h-14 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-lg shadow-teal-600/30 mb-5 transition-transform hover:scale-110">
              <Users class="w-6 h-6" />
            </div>
            <h3 class="text-base font-bold text-slate-900 mb-2">
              Đồng hành cùng nhóm
            </h3>
            <p class="text-xs text-slate-500 leading-relaxed max-w-xs">
              Lên kế hoạch chung, chia sẻ lịch trình, phân công công việc và lưu giữ những kỷ niệm đẹp cùng nhau.
            </p>
          </div>

        </div>

      </div>
    </section>

    <!-- 4. BOTTOM BANNER CTA (Chuẩn Figma 100%) -->
    <section class="max-w-7xl mx-auto px-4 sm:px-8 py-10">
      <div
        class="relative w-full rounded-3xl overflow-hidden bg-cover bg-center bg-no-repeat p-8 sm:p-12 shadow-xl border border-slate-200"
        :style="{ backgroundImage: `url(${dashboardBg})` }"
      >
        <div class="absolute inset-0 bg-sky-950/20"></div>

        <div class="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <!-- Text left -->
          <div class="text-left max-w-xl">
            <div class="font-handwriting text-3xl sm:text-4xl font-bold text-white tracking-wide mb-1 drop-shadow-sm">
              Sẵn sàng cho chuyến đi tiếp theo?
            </div>
            <p class="text-xs sm:text-sm text-sky-100 font-medium leading-relaxed drop-shadow-xs">
              Khám phá thế giới, tạo nên những kỷ niệm tuyệt vời cùng TripPlanner ngay hôm nay!
            </p>
          </div>

          <!-- Right Badge & Action -->
          <div class="flex items-center gap-4">
            <!-- Stamp Badge -->
            <div class="bg-white/95 px-3 py-2 rounded-xl shadow-md border border-white flex items-center gap-2 -rotate-3">
              <div class="w-6 h-6 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
                <MapPin class="w-3.5 h-3.5 fill-current" />
              </div>
              <div class="text-left">
                <div class="text-[9px] font-extrabold uppercase text-slate-700 leading-tight">Good Trips</div>
                <div class="text-[8px] text-slate-500 leading-tight">Better Memories ♥</div>
              </div>
            </div>

            <!-- CTA Button -->
            <button
              class="px-6 py-3 rounded-full bg-gradient-to-r from-[#F97316] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] text-white text-xs font-bold shadow-lg shadow-orange-500/30 active:scale-95 transition flex items-center gap-2 cursor-pointer"
              @click="handleGetStarted"
            >
              <span>Tham gia ngay</span>
              <ArrowRight class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- 5. FOOTER -->
    <footer class="w-full border-t border-slate-100 py-6 text-center text-xs text-slate-500">
      <div class="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div class="font-black text-slate-800">
          Trip<span class="text-brand-blue">Planner</span>
        </div>
        <div>
          © 2026 TripPlanner (Wanderflow). Nền tảng lập lịch trình du lịch thông minh.
        </div>
        <div class="flex gap-4 text-xs text-slate-400">
          <a href="#" class="hover:text-slate-600">Điều khoản</a>
          <a href="#" class="hover:text-slate-600">Bảo mật</a>
          <a href="#" class="hover:text-slate-600">Liên hệ</a>
        </div>
      </div>
    </footer>

  </div>
</template>
