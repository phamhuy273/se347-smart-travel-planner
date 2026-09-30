<script setup lang="ts">
import { useRouter } from 'vue-router';
import { Sparkles, ArrowRight, ShieldCheck, Map, Users } from 'lucide-vue-next';
import BaseButton from '@/components/common/BaseButton.vue';

const router = useRouter();
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-sky-50 via-white to-white font-sans text-slate-800">
    <!-- Landing Header -->
    <header class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-brand-orange flex items-center justify-center shadow-md">
          <Sparkles class="w-6 h-6 text-white" />
        </div>
        <span class="font-extrabold text-2xl tracking-tight text-brand-blue">TripPlanner</span>
      </div>

      <nav class="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
        <a href="#features" class="hover:text-brand-orange transition">Tính năng</a>
        <a href="#explore" class="hover:text-brand-orange transition">Khám phá</a>
        <a href="#about" class="hover:text-brand-orange transition">Về chúng tôi</a>
      </nav>

      <div class="flex items-center gap-3">
        <button
          class="px-5 py-2.5 text-sm font-semibold text-slate-700 hover:text-slate-900 transition"
          @click="router.push('/login')"
        >
          Đăng nhập
        </button>
        <BaseButton size="md" @click="router.push('/register')">
          Bắt đầu miễn phí
          <ArrowRight class="w-4 h-4 ml-1.5" />
        </BaseButton>
      </div>
    </header>

    <!-- Hero Section (Màn 1) -->
    <section class="max-w-7xl mx-auto px-6 pt-16 pb-24 text-center">
      <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 text-brand-orange text-xs font-bold uppercase tracking-wider mb-6">
        <Sparkles class="w-4 h-4" /> Nền tảng lập lịch trình du lịch thông minh
      </div>
      <h1 class="text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto">
        Lên kế hoạch cho chuyến đi đáng nhớ cùng <span class="text-brand-orange">TripPlanner</span>
      </h1>
      <p class="mt-6 text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
        Sắp xếp các điểm đến bằng bản đồ trực quan, tối ưu hóa lộ trình từng ngày và cộng tác cùng bạn bè trong thời gian thực.
      </p>

      <div class="mt-8 flex items-center justify-center gap-4">
        <BaseButton size="lg" @click="router.push('/register')">
          + Tạo chuyến đi miễn phí ->
        </BaseButton>
        <button
          class="px-6 py-3.5 rounded-full text-slate-700 font-semibold bg-white border border-slate-200 hover:bg-slate-50 transition shadow-sm"
          @click="router.push('/dashboard')"
        >
          Khám phá Dashboard
        </button>
      </div>

      <!-- Mockup Showcase Image -->
      <div class="mt-16 relative max-w-5xl mx-auto rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-100">
        <img
          src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1600&auto=format&fit=crop&q=80"
          alt="Dashboard Showcase"
          class="w-full h-[450px] object-cover"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent flex items-end p-8 text-left">
          <div class="text-white">
            <span class="px-3 py-1 bg-brand-orange rounded-full text-xs font-bold uppercase">Trải nghiệm du lịch mới</span>
            <h3 class="text-2xl font-bold mt-2">Đà Lạt - Phú Quốc - Sapa - Ninh Bình</h3>
            <p class="text-white/80 text-sm mt-1">Đã có hơn 10,000 lịch trình được tạo bởi cộng đồng</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
