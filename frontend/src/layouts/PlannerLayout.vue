<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  Home,
  Map,
  Compass,
  Bell,
  Moon,
  ChevronDown,
  LogOut,
} from 'lucide-vue-next';
import dashboardBg from '@/assets/backgrounds/dashboard-bg.png';

const router = useRouter();
const route = useRoute();

const showUserMenu = ref(false);

const user = ref({
  name: 'Pham Huy',
  email: 'phamhuy@example.com',
});

const navItems = [
  { name: 'Trang chủ', path: '/dashboard', icon: Home },
  { name: 'Lập lịch trình', path: '/planner', icon: Map },
  { name: 'Chuyến đi của tôi', path: '/trips', icon: Compass },
];

const handleLogout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user_info');
  router.push('/login');
};
</script>

<template>
  <div class="flex flex-col h-screen w-screen overflow-hidden font-sans select-none">
    <!-- Top Header: Logo + Navigation Tabs (No global search bar) + User Actions -->
    <header class="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between shadow-xs z-30 flex-shrink-0">
      <!-- Left: Brand Logo & Navigation Pill Tabs -->
      <div class="flex items-center gap-6">
        <div class="flex items-center gap-2 cursor-pointer" @click="router.push('/dashboard')">
          <span class="text-2xl font-black tracking-tight text-[#0F172A] hover:text-brand-blue transition">
            Trip<span class="text-brand-blue">Planner</span>
          </span>
        </div>

        <!-- Horizontal Navigation Tabs -->
        <nav class="hidden sm:flex items-center gap-1 bg-slate-100/80 p-1 rounded-full border border-slate-200/60">
          <button
            v-for="item in navItems"
            :key="item.path"
            :class="[
              'flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200',
              route.path.startsWith(item.path)
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50',
            ]"
            @click="router.push(item.path)"
          >
            <component
              :is="item.icon"
              :class="['w-4 h-4', route.path.startsWith(item.path) ? 'text-emerald-600' : 'text-slate-500']"
            />
            <span>{{ item.name }}</span>
          </button>
        </nav>
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

    <!-- Main Workspace Container (Extended to 100% full width, no left sidebar) -->
    <div
      class="flex-1 flex min-h-0 relative bg-cover bg-center overflow-hidden p-4"
      :style="{ backgroundImage: `url(${dashboardBg})` }"
    >
      <main
        class="flex-1 min-w-0 relative z-10 bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/60 overflow-hidden flex flex-col"
      >
        <router-view />
      </main>
    </div>
  </div>
</template>
