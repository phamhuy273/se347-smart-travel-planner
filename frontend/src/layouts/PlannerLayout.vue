<script setup lang="ts">
import { useRouter } from 'vue-router';
import {
  Home,
  MapPin,
  Share2,
  CheckSquare,
  ArrowLeft,
  Users,
} from 'lucide-vue-next';

const router = useRouter();
</script>

<template>
  <div class="flex h-screen w-screen overflow-hidden bg-slate-100 font-sans">
    <!-- MINI ICON SIDEBAR (From Figma Màn 6) -->
    <aside class="w-16 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col items-center py-6 justify-between z-20 shadow-sm">
      <div class="flex flex-col items-center gap-6">
        <!-- Brand logo icon -->
        <button
          class="w-10 h-10 rounded-xl bg-brand-orange text-white flex items-center justify-center font-bold shadow-md hover:scale-105 transition"
          @click="router.push('/dashboard')"
        >
          TP
        </button>

        <!-- Vertical Navigation Icons -->
        <nav class="flex flex-col gap-3">
          <button
            class="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:text-brand-blue hover:bg-sky-50 transition"
            title="Trang chủ"
            @click="router.push('/dashboard')"
          >
            <Home class="w-5 h-5" />
          </button>

          <button
            class="w-10 h-10 rounded-xl flex items-center justify-center bg-brand-blue text-white shadow-sm"
            title="Bản đồ lịch trình"
          >
            <MapPin class="w-5 h-5" />
          </button>

          <button
            class="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:text-brand-blue hover:bg-sky-50 transition"
            title="Chia sẻ chuyến đi"
          >
            <Share2 class="w-5 h-5" />
          </button>

          <button
            class="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:text-brand-blue hover:bg-sky-50 transition"
            title="Checklist hành lý"
          >
            <CheckSquare class="w-5 h-5" />
          </button>
        </nav>
      </div>

      <!-- Bottom user avatar -->
      <div>
        <img
          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
          alt="User"
          class="w-8 h-8 rounded-full object-cover ring-2 ring-slate-200"
        />
      </div>
    </aside>

    <!-- CONTENT WITH COMPACT HEADER -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- Compact Header for Planner -->
      <header class="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-10">
        <div class="flex items-center gap-3">
          <button
            class="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
            @click="router.push('/trips')"
          >
            <ArrowLeft class="w-5 h-5" />
          </button>
          <div>
            <h2 class="font-bold text-slate-900 text-sm flex items-center gap-2">
              Đà Lạt chill 4 ngày 3 đêm
              <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">Công khai</span>
            </h2>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <div class="flex items-center -space-x-2">
            <img class="w-7 h-7 rounded-full ring-2 ring-white" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100" />
            <img class="w-7 h-7 rounded-full ring-2 ring-white" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100" />
            <span class="w-7 h-7 rounded-full bg-slate-100 ring-2 ring-white text-[10px] font-bold text-slate-600 flex items-center justify-center">+2</span>
          </div>

          <button class="px-3.5 py-1.5 bg-brand-orange text-white text-xs font-semibold rounded-lg hover:bg-brand-orange-hover transition shadow-sm">
            Chia sẻ
          </button>
        </div>
      </header>

      <!-- Planner Canvas View -->
      <main class="flex-1 overflow-hidden relative">
        <router-view />
      </main>
    </div>
  </div>
</template>
