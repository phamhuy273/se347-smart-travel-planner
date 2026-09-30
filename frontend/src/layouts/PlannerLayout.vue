<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  Home,
  Map,
  Compass,
  Search,
  SlidersHorizontal,
  Bell,
  Moon,
  ChevronDown,
  LogOut,
  MapPin,
  Send,
} from 'lucide-vue-next';
import bgImage from '@/assets/maya-bay.jpg';

const router = useRouter();

const showUserMenu = ref(false);
const searchQuery = ref('');

const user = ref({
  name: 'Pham Huy',
  email: 'phamhuy@example.com',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
});

const handleLogout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user_info');
  router.push('/login');
};
</script>

<template>
  <div class="flex flex-col h-screen w-screen overflow-hidden font-sans select-none">
    <!-- 1. TOPBAR (Đồng bộ chuẩn 100% với MainLayout và Figma) -->
    <header class="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-6 flex items-center justify-between shadow-xs z-30 flex-shrink-0">
      <!-- Brand Logo -->
      <div class="flex items-center gap-2 cursor-pointer" @click="router.push('/dashboard')">
        <span class="text-2xl font-black tracking-tight text-[#0F172A] hover:text-brand-blue transition">
          Trip<span class="text-brand-blue">Planner</span>
        </span>
      </div>

      <!-- Center: Pill Search Bar with Filter icon -->
      <div class="relative w-full max-w-md mx-6">
        <div class="relative flex items-center">
          <Search class="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Tìm kiếm địa điểm, thành phố, ..."
            class="w-full bg-slate-100 hover:bg-slate-100/90 text-slate-800 text-xs rounded-full pl-11 pr-11 py-2.5 transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/30 border border-slate-200 focus:border-brand-blue placeholder:text-slate-400"
          />
          <button
            class="absolute right-3.5 p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
            title="Bộ lọc tìm kiếm"
          >
            <SlidersHorizontal class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <!-- Right Actions: Darkmode, Bell, Profile Badge -->
      <div class="flex items-center gap-3">
        <button
          class="w-9 h-9 rounded-full border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition"
          title="Chế độ tối"
        >
          <Moon class="w-4 h-4" />
        </button>

        <button
          class="relative w-9 h-9 rounded-full border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition"
          title="Thông báo"
        >
          <Bell class="w-4 h-4" />
          <span class="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-orange rounded-full ring-2 ring-white"></span>
        </button>

        <div class="relative">
          <button
            class="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 transition focus:outline-none"
            @click="showUserMenu = !showUserMenu"
          >
            <div class="w-7 h-7 rounded-full bg-[#0D9488] text-white flex items-center justify-center font-bold text-xs ring-2 ring-emerald-500/20">
              PH
            </div>
            <span class="text-xs font-bold text-slate-800 hidden sm:inline">{{ user.name }}</span>
            <ChevronDown class="w-3.5 h-3.5 text-slate-400" />
          </button>

          <div
            v-if="showUserMenu"
            class="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
          >
            <div class="px-4 py-2 border-b border-slate-100">
              <p class="text-[11px] text-slate-400">Đăng nhập với</p>
              <p class="text-xs font-bold text-slate-900 truncate">{{ user.email }}</p>
            </div>
            <button
              class="w-full px-4 py-2 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 transition"
              @click="handleLogout"
            >
              <LogOut class="w-3.5 h-3.5" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- 2. BODY: NỀN BIỂN NHIỆT ĐỚI + MINI FLOATING SIDEBAR + PLANNER CONTAINER -->
    <div
      class="flex-1 flex min-h-0 relative bg-cover bg-center overflow-hidden p-4 gap-4"
      :style="{ backgroundImage: `url(${bgImage})` }"
    >
      <div class="absolute inset-0 bg-sky-900/15 backdrop-blur-[1px] pointer-events-none"></div>

      <!-- 🌟 MINI FLOATING SIDEBAR (Chuẩn Figma Màn 6: Sky Blue, Dotted line, Mini icons) -->
      <aside
        class="w-16 flex-shrink-0 relative rounded-3xl bg-[#38BDF8]/90 backdrop-blur-md shadow-2xl border border-white/40 flex flex-col items-center py-6 justify-between text-white z-20 overflow-hidden"
      >
        <!-- Dotted Flight Trail Graphic -->
        <svg
          class="absolute inset-0 w-full h-full pointer-events-none opacity-40"
          viewBox="0 0 64 600"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M 32 40 C 10 160, 54 280, 20 420 C 10 490, 45 520, 32 550"
            stroke="white"
            stroke-width="1.8"
            stroke-dasharray="4 4"
          />
        </svg>

        <!-- Paper Airplane -->
        <div class="absolute top-[200px] left-[18px] text-white/90 rotate-[15deg] pointer-events-none">
          <Send class="w-4 h-4 -rotate-45 drop-shadow" />
        </div>

        <!-- Navigation Icon Buttons -->
        <nav class="relative z-10 flex flex-col items-center gap-4">
          <button
            class="w-10 h-10 rounded-full flex items-center justify-center text-white/90 hover:bg-white/20 hover:text-white transition"
            title="Trang chủ (Dashboard)"
            @click="router.push('/dashboard')"
          >
            <Home class="w-5 h-5" />
          </button>

          <button
            class="w-10 h-10 rounded-full flex items-center justify-center bg-white text-slate-800 shadow-md font-bold"
            title="Lập lịch trình (Planner)"
          >
            <Map class="w-5 h-5 text-brand-blue" />
          </button>

          <button
            class="w-10 h-10 rounded-full flex items-center justify-center text-white/90 hover:bg-white/20 hover:text-white transition"
            title="Chuyến đi của tôi"
            @click="router.push('/trips')"
          >
            <Compass class="w-5 h-5" />
          </button>
        </nav>

        <!-- Bottom Pin Icon -->
        <div class="relative z-10">
          <div class="w-9 h-9 rounded-full border border-white/50 flex items-center justify-center bg-white/10 backdrop-blur-sm shadow-inner">
            <MapPin class="w-4 h-4 text-white drop-shadow" />
          </div>
        </div>
      </aside>

      <!-- 🌟 PLANNER CONTENT CONTAINER (Khung bo tròn trắng lớn chứa bản đồ & các cột ngày) -->
      <main
        class="flex-1 min-w-0 relative z-10 bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/60 overflow-hidden flex flex-col"
      >
        <router-view />
      </main>
    </div>
  </div>
</template>
