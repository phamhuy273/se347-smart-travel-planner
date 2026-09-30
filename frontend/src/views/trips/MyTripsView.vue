<script setup lang="ts">
// Màn 5: Quản lý Chuyến đi của tôi (Rendered bên trong MainLayout)
// Phụ trách: Cặp 2 (TV 4 BE & TV 5 FE)
</script>

<template>
  <div class="p-12 border-2 border-dashed border-slate-200 rounded-3xl text-center bg-white">
    <div class="w-16 h-16 bg-orange-50 text-brand-orange rounded-3xl flex items-center justify-center mx-auto text-2xl font-bold mb-4">
      🧳
    </div>
    <h1 class="text-2xl font-black text-slate-900 tracking-tight">Màn 5: Chuyến Đi Của Tôi (My Trips)</h1>
    <p class="text-sm text-slate-500 mt-2">
      Khu vực phát triển của: <span class="font-bold text-slate-700">Cặp 2 (TV 4 & TV 5)</span>
    </p>
    <p class="text-xs text-slate-400 mt-1 max-w-md mx-auto">
      Khu vực này nằm trọn trong <code class="text-brand-blue font-semibold">MainLayout</code> (đã có sẵn Sidebar Menu bên trái, Topbar tìm kiếm & Avatar).
    </p>
  </div>
</template>
