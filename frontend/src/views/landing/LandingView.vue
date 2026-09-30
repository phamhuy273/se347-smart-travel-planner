<script setup lang="ts">
// Màn 1: Trang chủ / Landing Page
// Phụ trách: Cặp 1 (TV 2 BE & TV 3 FE)
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-slate-800">
    <div class="max-w-md w-full bg-white p-8 rounded-3xl shadow-sm border border-slate-200 text-center space-y-4">
      <div class="w-12 h-12 bg-sky-100 text-brand-blue rounded-2xl flex items-center justify-center mx-auto text-xl font-bold">
        🌍
      </div>
      <h1 class="text-2xl font-black text-slate-900 tracking-tight">Màn 1: Landing Page</h1>
      <p class="text-sm text-slate-500">
        Khu vực phát triển của: <span class="font-bold text-slate-700">Cặp 1 (TV 2 & TV 3)</span>
      </p>

      <div class="pt-4 flex flex-col sm:flex-row justify-center gap-3">
        <router-link
          to="/login"
          class="px-5 py-2.5 bg-brand-blue hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
        >
          Sang Màn Đăng Nhập ->
        </router-link>
        <router-link
          to="/dashboard"
          class="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
        >
          Xem MainLayout (Dashboard)
        </router-link>
      </div>
    </div>
  </div>
</template>
