<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  Home,
  Briefcase,
  Compass,
  Globe,
  Search,
  Bell,
  Moon,
  LogOut,
  ChevronDown,
  Sparkles,
} from 'lucide-vue-next';

const router = useRouter();
const route = useRoute();

const showUserMenu = ref(false);
const searchQuery = ref('');

// User profile mockup / state
const user = ref({
  name: 'Pham Huy',
  email: 'phamhuy@example.com',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
});

const menuItems = [
  { name: 'Trang chủ', path: '/dashboard', icon: Home },
  { name: 'Chuyến đi của tôi', path: '/trips', icon: Briefcase },
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
  <div class="flex h-screen w-screen overflow-hidden bg-brand-bg font-sans">
    <!-- 1. LEFT SIDEBAR (Full width from Figma) -->
    <aside class="w-64 flex-shrink-0 bg-gradient-to-b from-[#0284C7] to-[#0369A1] text-white flex flex-col justify-between shadow-xl z-20">
      <div>
        <!-- Logo Header -->
        <div class="h-20 flex items-center px-6 gap-3 border-b border-white/10">
          <div class="w-10 h-10 rounded-xl bg-brand-orange flex items-center justify-center shadow-lg">
            <Sparkles class="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 class="font-extrabold text-xl tracking-tight text-white">TripPlanner</h1>
            <p class="text-[10px] text-white/70 uppercase tracking-widest font-semibold">Travel Assistant</p>
          </div>
        </div>

        <!-- Navigation Menu -->
        <nav class="p-4 space-y-1.5 mt-2">
          <router-link
            v-for="item in menuItems"
            :key="item.path"
            :to="item.path"
            :class="[
              'flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
              route.path === item.path
                ? 'bg-white text-brand-blue shadow-md font-semibold'
                : 'text-white/80 hover:bg-white/10 hover:text-white',
            ]"
          >
            <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
            <span>{{ item.name }}</span>
          </router-link>
        </nav>
      </div>

      <!-- Bottom Card in Sidebar -->
      <div class="p-4">
        <div class="rounded-2xl bg-white/10 backdrop-blur-md p-4 border border-white/15 text-xs text-white">
          <p class="font-bold text-sm mb-1">Kế hoạch thông minh</p>
          <p class="text-white/80 leading-relaxed text-[11px] mb-3">Tự động tối ưu lịch trình và gợi ý điểm đến du lịch tuyệt vời.</p>
          <button
            class="w-full py-2 px-3 bg-brand-orange hover:bg-brand-orange-hover text-white rounded-lg font-medium transition-colors text-center text-xs shadow"
            @click="router.push('/trips')"
          >
            + Chuyến đi mới
          </button>
        </div>
      </div>
    </aside>

    <!-- 2. MAIN CONTENT AREA -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- Top Header -->
      <header class="h-20 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between shadow-xs z-10">
        <!-- Search bar -->
        <div class="relative w-96">
          <Search class="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Tìm kiếm địa điểm, thành phố, lịch trình..."
            class="w-full bg-slate-100/80 hover:bg-slate-100 text-slate-800 text-sm rounded-full pl-11 pr-4 py-2.5 transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/30 border border-transparent focus:border-brand-blue"
          />
        </div>

        <!-- Right actions -->
        <div class="flex items-center gap-4">
          <!-- Darkmode toggle -->
          <button class="w-10 h-10 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center transition">
            <Moon class="w-5 h-5" />
          </button>

          <!-- Notification Bell -->
          <button class="relative w-10 h-10 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center transition">
            <Bell class="w-5 h-5" />
            <span class="absolute top-2 right-2 w-2 h-2 bg-brand-orange rounded-full ring-2 ring-white"></span>
          </button>

          <!-- User Menu Dropdown -->
          <div class="relative">
            <button
              class="flex items-center gap-3 p-1.5 rounded-full hover:bg-slate-100 transition focus:outline-none"
              @click="showUserMenu = !showUserMenu"
            >
              <img
                :src="user.avatar"
                :alt="user.name"
                class="w-9 h-9 rounded-full object-cover ring-2 ring-brand-blue/30"
              />
              <span class="text-sm font-semibold text-slate-800 hidden md:inline">{{ user.name }}</span>
              <ChevronDown class="w-4 h-4 text-slate-400" />
            </button>

            <!-- Dropdown Content -->
            <div
              v-if="showUserMenu"
              class="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
            >
              <div class="px-4 py-2 border-b border-slate-100">
                <p class="text-xs text-slate-500">Đăng nhập với</p>
                <p class="text-sm font-semibold text-slate-900 truncate">{{ user.email }}</p>
              </div>
              <button
                class="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition"
                @click="handleLogout"
              >
                <LogOut class="w-4 h-4" />
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- Page Content Slot -->
      <main class="flex-1 overflow-y-auto p-8">
        <router-view />
      </main>
    </div>
  </div>
</template>
