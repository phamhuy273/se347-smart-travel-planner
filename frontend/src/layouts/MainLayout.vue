<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  Home,
  Map,
  Compass,
  Globe,
  Search,
  SlidersHorizontal,
  Bell,
  Moon,
  LogOut,
  ChevronDown,
} from 'lucide-vue-next';
import dashboardBg from '@/assets/dashboard-bg.png';
import sidebarBg from '@/assets/sidebar-bg.png';

const router = useRouter();
const route = useRoute();

const showUserMenu = ref(false);
const searchQuery = ref('');

// User profile state matching Figma
const user = ref({
  name: 'Pham Huy',
  email: 'phamhuy@example.com',
});

const menuItems = [
  { name: 'Trang chủ', path: '/dashboard', icon: Home },
  { name: 'Chuyến đi của tôi', path: '/trips', icon: Map },
  { name: 'Khám phá', path: '/explore', icon: Compass },
  { name: 'Bản đồ thế giới', path: '/map', icon: Globe },
];

const handleLogout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user_info');
  router.push('/login');
};
</script>

<template>
  <div class="flex flex-col h-screen w-screen overflow-hidden font-sans select-none">
    <!-- 1. TOPBAR (Chuẩn 100% Figma: Logo TripPlanner, Search Pill with Filter icon, Moon, Bell, Pham Huy) -->
    <header class="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between shadow-xs z-30 flex-shrink-0">
      <!-- Brand Logo -->
      <div class="flex items-center gap-2 cursor-pointer" @click="router.push('/dashboard')">
        <span class="text-2xl font-black tracking-tight text-[#0F172A] hover:text-brand-blue transition">
          Trip<span class="text-brand-blue">Planner</span>
        </span>
      </div>

      <!-- Center: Pill Search Bar with Sliders/Filter icon -->
      <div class="relative w-full max-w-md mx-6">
        <div class="relative flex items-center">
          <Search class="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Tìm kiếm địa điểm, thành phố, ..."
            class="w-full bg-slate-50 hover:bg-slate-100/80 text-slate-800 text-xs rounded-full pl-11 pr-11 py-2.5 transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/30 border border-slate-200 focus:border-brand-blue placeholder:text-slate-400"
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
        <!-- Moon (Darkmode Toggle) -->
        <button
          class="w-9 h-9 rounded-full border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition"
          title="Chế độ tối"
        >
          <Moon class="w-4 h-4" />
        </button>

        <!-- Bell (Notification) -->
        <button
          class="relative w-9 h-9 rounded-full border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition"
          title="Thông báo"
        >
          <Bell class="w-4 h-4" />
          <span class="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-orange rounded-full ring-2 ring-white"></span>
        </button>

        <!-- User Profile Pill Button (Figma Pham Huy) -->
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

          <!-- Dropdown Menu -->
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

    <!-- 2. BODY -->
    <div
      class="flex-1 flex min-h-0 relative bg-cover bg-center overflow-hidden p-4 gap-4"
      :style="{ backgroundImage: `url(${dashboardBg})` }"
    >
    
      <aside
        class="w-56 flex-shrink-0 relative rounded-3xl shadow-2xl border border-white/40 flex flex-col justify-between p-4 text-white z-20 overflow-hidden bg-cover bg-center"
        :style="{ backgroundImage: `url(${sidebarBg})` }"
      >
        <!-- Navigation Menu -->
        <div class="relative z-10 space-y-3 pt-2">
          <nav class="space-y-2">
            <router-link
              v-for="item in menuItems"
              :key="item.path"
              :to="item.path"
              :class="[
                'flex items-center gap-3 px-4 py-2.5 rounded-full text-xs font-bold transition-all duration-200',
                route.path === item.path
                  ? 'bg-white text-slate-800 shadow-lg'
                  : 'text-white hover:bg-white/20 hover:text-white drop-shadow-sm',
              ]"
            >
              <component
                :is="item.icon"
                :class="['w-4 h-4 flex-shrink-0', route.path === item.path ? 'text-emerald-600' : 'text-white']"
              />
              <span class="truncate">{{ item.name }}</span>
            </router-link>
          </nav>
        </div>
        <div class="h-28 pointer-events-none"></div>
      </aside>

   
      <main
        class="flex-1 min-w-0 relative z-10 bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/60 overflow-y-auto p-6 flex flex-col"
      >
        <router-view />
      </main>
    </div>
  </div>
</template>
