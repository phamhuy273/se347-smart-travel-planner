<script setup lang="ts">
// Màn 2: Đăng nhập
// Phụ trách: Cặp 1 (TV 2 BE & TV 3 FE)
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-slate-800">
    <div class="max-w-md w-full bg-white p-8 rounded-3xl shadow-sm border border-slate-200 text-center space-y-4">
      <div class="w-12 h-12 bg-sky-100 text-brand-blue rounded-2xl flex items-center justify-center mx-auto text-xl font-bold">
        🔑
      </div>
      <h1 class="text-2xl font-black text-slate-900 tracking-tight">Màn 2: Đăng Nhập</h1>
      <p class="text-sm text-slate-500">
        Khu vực phát triển của: <span class="font-bold text-slate-700">Cặp 1 (TV 2 & TV 3)</span>
      </p>

      <div class="pt-4 flex flex-col gap-3">
        <router-link
          to="/register"
          class="text-xs font-semibold text-brand-blue hover:underline"
        >
          Chưa có tài khoản? Chuyển sang Đăng ký ->
        </router-link>
        <router-link
          to="/dashboard"
          class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
        >
          Vào Dashboard (Xem Layout)
        </router-link>
      </div>
    </div>
  </div>
</template>
