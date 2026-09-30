<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Plus, Search, Calendar, Users, MapPin, MoreHorizontal } from 'lucide-vue-next';
import BaseButton from '@/components/common/BaseButton.vue';

const router = useRouter();

const activeTab = ref('all');
const searchFilter = ref('');

const tabs = [
  { id: 'all', name: 'Tất cả', count: 8 },
  { id: 'mine', name: 'Của tôi', count: 3 },
  { id: 'saved', name: 'Đã lưu', count: 5 },
];

const mockTrips = [
  {
    id: 'da-lat',
    title: 'Đà Lạt chill 4 ngày',
    destination: 'Đà Lạt, Lâm Đồng',
    dates: '01/10 - 04/10/2026 (4 ngày)',
    cover: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80',
    status: 'Sắp diễn ra',
    membersCount: 3,
  },
  {
    id: 'sapa',
    title: 'Sapa mờ sương',
    destination: 'Sapa, Lào Cai',
    dates: '15/11 - 18/11/2026 (4 ngày)',
    cover: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=600&auto=format&fit=crop&q=80',
    status: 'Đã lưu',
    membersCount: 2,
  },
  {
    id: 'ninh-binh',
    title: 'Khám phá Tràng An Ninh Bình',
    destination: 'Ninh Bình',
    dates: '05/12 - 07/12/2026 (3 ngày)',
    cover: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&auto=format&fit=crop&q=80',
    status: 'Đã hoàn thành',
    membersCount: 4,
  },
];
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto">
    <!-- Header row: Title + Create Button -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Chuyến đi của tôi</h1>
        <p class="text-xs text-slate-500 mt-1">Quản lý và theo dõi toàn bộ các kế hoạch du lịch của bạn.</p>
      </div>

      <BaseButton size="md" @click="router.push('/planner/new')">
        <Plus class="w-4 h-4 mr-1.5" /> + Tạo chuyến đi mới
      </BaseButton>
    </div>

    <!-- Filter row: 3 Tabs + Search box (From Figma Màn 5) -->
    <div class="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-3">
      <!-- 3 Tabs -->
      <div class="flex items-center gap-2">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="[
            'px-4 py-2 rounded-xl text-xs font-semibold transition-all',
            activeTab === tab.id
              ? 'bg-brand-blue text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100',
          ]"
          @click="activeTab = tab.id"
        >
          {{ tab.name }} ({{ tab.count }})
        </button>
      </div>

      <!-- Search box -->
      <div class="relative w-full sm:w-72">
        <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          v-model="searchFilter"
          type="text"
          placeholder="Tìm tên chuyến đi..."
          class="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
        />
      </div>
    </div>

    <!-- Card Grid (From Figma Màn 5) -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="trip in mockTrips"
        :key="trip.id"
        class="bg-white rounded-3xl overflow-hidden shadow-xs border border-slate-100 hover:shadow-md transition flex flex-col justify-between group"
      >
        <div>
          <!-- Card Image & Status -->
          <div class="h-44 relative bg-cover bg-center overflow-hidden" :style="{ backgroundImage: `url(${trip.cover})` }">
            <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
            <span class="absolute top-3 left-3 bg-white/90 backdrop-blur-xs text-brand-blue text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs">
              {{ trip.status }}
            </span>
            <button class="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition">
              <MoreHorizontal class="w-4 h-4" />
            </button>
          </div>

          <!-- Card Content -->
          <div class="p-5 text-left">
            <h3 class="font-bold text-slate-900 text-base group-hover:text-brand-orange transition">
              {{ trip.title }}
            </h3>
            <div class="space-y-1 mt-2 text-xs text-slate-500">
              <p class="flex items-center gap-1.5">
                <MapPin class="w-3.5 h-3.5 text-brand-orange" /> {{ trip.destination }}
              </p>
              <p class="flex items-center gap-1.5">
                <Calendar class="w-3.5 h-3.5 text-slate-400" /> {{ trip.dates }}
              </p>
            </div>
          </div>
        </div>

        <!-- Card Footer -->
        <div class="px-5 pb-5 pt-3 border-t border-slate-100 flex items-center justify-between">
          <div class="flex items-center gap-1 text-xs text-slate-500 font-medium">
            <Users class="w-3.5 h-3.5 text-slate-400" /> {{ trip.membersCount }} thành viên
          </div>
          <button
            class="px-4 py-1.5 bg-slate-100 hover:bg-brand-orange hover:text-white text-slate-700 text-xs font-semibold rounded-lg transition"
            @click="router.push(`/planner/${trip.id}`)"
          >
            Xem chi tiết
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
