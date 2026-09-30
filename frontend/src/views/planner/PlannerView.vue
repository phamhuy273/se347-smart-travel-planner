<script setup lang="ts">
import { ref } from 'vue';
import {
  Search,
  Plus,
  Clock,
  MapPin,
  Sparkles,
  Utensils,
  Hotel,
  Compass,
} from 'lucide-vue-next';

// 1. Cột bên trái: Danh sách tìm kiếm & Kho tạm
const placesPool = ref([
  { id: '1', name: 'Crazy House Đà Lạt', category: 'Tham quan', rating: '4.8' },
  { id: '2', name: 'Làng Cù Lần', category: 'Sinh thái', rating: '4.6' },
  { id: '3', name: 'Núi Langbiang', category: 'Thiên nhiên', rating: '4.7' },
  { id: '4', name: 'Chợ đêm Đà Lạt', category: 'Ăn uống', rating: '4.9' },
]);

// 2. Cột ngày ở giữa (Ngày 1, 2, 3)
const day1Activities = ref([
  { id: '101', name: 'Sân bay Liên Khương', time: '08:00', type: 'transport' },
  { id: '102', name: 'Nhận phòng Colline Hotel', time: '11:00', type: 'hotel' },
  { id: '103', name: 'Hồ Tuyền Lâm & Chèo thuyền', time: '14:30', type: 'attraction' },
  { id: '104', name: 'Ăn tối Lẩu gà lá é Tao Ngộ', time: '18:30', type: 'food' },
]);

const day2Activities = ref([
  { id: '201', name: 'Thung Lũng Tình Yêu', time: '08:30', type: 'attraction' },
  { id: '202', name: 'Đồi chè Cầu Đất săn mây', time: '14:00', type: 'attraction' },
  { id: '203', name: 'Cà phê Túi Mơ To', time: '17:30', type: 'food' },
]);

const day3Activities = ref([
  { id: '301', name: 'Thác Datanla trượt máng', time: '09:00', type: 'attraction' },
  { id: '302', name: 'Dinh 3 Bảo Đại', time: '14:00', type: 'attraction' },
]);
</script>

<template>
  <div class="h-full w-full flex overflow-hidden">
    <!-- LEFT PANEL: TÌM KIẾM & KHO LƯU TẠM (From Figma Màn 6) -->
    <div class="w-80 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col justify-between overflow-hidden">
      <!-- Search Panel -->
      <div class="p-4 border-b border-slate-100">
        <h3 class="font-bold text-slate-900 text-sm mb-2.5">Tìm kiếm địa điểm</h3>
        <div class="relative">
          <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm ở Đà Lạt..."
            class="w-full bg-slate-100 pl-9 pr-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
          />
        </div>
        <!-- Filter tags -->
        <div class="flex items-center gap-1.5 mt-2.5 text-[10px] font-semibold text-slate-500 overflow-x-auto pb-1">
          <span class="px-2 py-0.5 rounded-full bg-brand-blue text-white">Tất cả</span>
          <span class="px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 cursor-pointer">Địa điểm</span>
          <span class="px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 cursor-pointer">Ăn uống</span>
        </div>
      </div>

      <!-- Kho Lưu Tạm (Unassigned Pool) -->
      <div class="flex-1 overflow-y-auto p-4">
        <div class="flex items-center justify-between mb-3">
          <span class="font-bold text-xs text-slate-700 uppercase tracking-wider">Địa điểm chờ xếp lịch ({{ placesPool.length }})</span>
        </div>
        <div class="space-y-2">
          <div
            v-for="item in placesPool"
            :key="item.id"
            class="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/60 flex items-center justify-between cursor-grab transition text-left group"
          >
            <div>
              <p class="font-semibold text-xs text-slate-800">{{ item.name }}</p>
              <p class="text-[10px] text-slate-400 mt-0.5">{{ item.category }} • ★ {{ item.rating }}</p>
            </div>
            <button class="w-6 h-6 rounded-lg bg-white group-hover:bg-brand-orange group-hover:text-white text-slate-400 flex items-center justify-center shadow-xs transition">
              <Plus class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- CENTER AREA: MAP (TOP 40%) + DAY COLUMNS (BOTTOM 60%) -->
    <div class="flex-1 flex flex-col min-w-0 bg-slate-100 overflow-hidden">
      <!-- 1. Mapbox Area (Top) -->
      <div class="h-64 bg-slate-200 border-b border-slate-200 relative overflow-hidden flex items-center justify-center">
        <!-- Map placeholder mockup -->
        <img
          src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1200&auto=format&fit=crop&q=80"
          alt="Map mockup"
          class="w-full h-full object-cover"
        />
        <div class="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md text-xs font-semibold flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Bản đồ lộ trình Đà Lạt
        </div>
        <div class="absolute bottom-4 left-4 flex items-center gap-2 text-[10px] font-bold">
          <span class="px-2.5 py-1 bg-white rounded-lg shadow-xs text-emerald-600 border border-emerald-200">● Ngày 1</span>
          <span class="px-2.5 py-1 bg-white rounded-lg shadow-xs text-purple-600 border border-purple-200">● Ngày 2</span>
          <span class="px-2.5 py-1 bg-white rounded-lg shadow-xs text-rose-600 border border-rose-200">● Ngày 3</span>
        </div>
      </div>

      <!-- 2. Day Columns (Bottom) -->
      <div class="flex-1 overflow-x-auto p-4 flex gap-4">
        <!-- Day 1 Column -->
        <div class="w-72 flex-shrink-0 bg-white rounded-2xl p-3 shadow-xs border-t-4 border-t-emerald-500 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
              <h4 class="font-bold text-xs text-slate-800">Ngày 1 - 01/10</h4>
              <span class="text-[10px] text-slate-400 font-semibold">{{ day1Activities.length }} địa điểm</span>
            </div>
            <div class="space-y-2">
              <div
                v-for="act in day1Activities"
                :key="act.id"
                class="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-left hover:border-emerald-300 transition"
              >
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-slate-800">{{ act.name }}</span>
                  <span class="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                    <Clock class="w-3 h-3" /> {{ act.time }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <button class="mt-3 w-full py-1.5 border border-dashed border-slate-200 hover:border-emerald-500 text-slate-500 hover:text-emerald-600 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition">
            <Plus class="w-3 h-3" /> Thêm hoạt động
          </button>
        </div>

        <!-- Day 2 Column -->
        <div class="w-72 flex-shrink-0 bg-white rounded-2xl p-3 shadow-xs border-t-4 border-t-purple-500 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
              <h4 class="font-bold text-xs text-slate-800">Ngày 2 - 02/10</h4>
              <span class="text-[10px] text-slate-400 font-semibold">{{ day2Activities.length }} địa điểm</span>
            </div>
            <div class="space-y-2">
              <div
                v-for="act in day2Activities"
                :key="act.id"
                class="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-left hover:border-purple-300 transition"
              >
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-slate-800">{{ act.name }}</span>
                  <span class="text-[10px] font-semibold text-purple-600 flex items-center gap-1">
                    <Clock class="w-3 h-3" /> {{ act.time }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <button class="mt-3 w-full py-1.5 border border-dashed border-slate-200 hover:border-purple-500 text-slate-500 hover:text-purple-600 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition">
            <Plus class="w-3 h-3" /> Thêm hoạt động
          </button>
        </div>

        <!-- Day 3 Column -->
        <div class="w-72 flex-shrink-0 bg-white rounded-2xl p-3 shadow-xs border-t-4 border-t-rose-500 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
              <h4 class="font-bold text-xs text-slate-800">Ngày 3 - 03/10</h4>
              <span class="text-[10px] text-slate-400 font-semibold">{{ day3Activities.length }} địa điểm</span>
            </div>
            <div class="space-y-2">
              <div
                v-for="act in day3Activities"
                :key="act.id"
                class="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-left hover:border-rose-300 transition"
              >
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-slate-800">{{ act.name }}</span>
                  <span class="text-[10px] font-semibold text-rose-600 flex items-center gap-1">
                    <Clock class="w-3 h-3" /> {{ act.time }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <button class="mt-3 w-full py-1.5 border border-dashed border-slate-200 hover:border-rose-500 text-slate-500 hover:text-rose-600 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition">
            <Plus class="w-3 h-3" /> Thêm hoạt động
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
