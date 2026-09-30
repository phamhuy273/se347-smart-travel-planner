<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  Plus,
  ArrowRight,
  TrendingUp,
  MapPin,
  Users,
} from 'lucide-vue-next';

const router = useRouter();

// Checklist Hành Lý Mock
const checklist = ref([
  { id: 1, text: 'Đặt vé máy bay khứ hồi Phú Quốc', done: true },
  { id: 2, text: 'Đặt phòng resort Vinpearl 3 đêm', done: true },
  { id: 3, text: 'Chuẩn bị kem chống nắng & kính bơi', done: false },
  { id: 4, text: 'Đổi tiền mặt và kiểm tra CCCD', done: false },
]);

const toggleCheck = (item: any) => {
  item.done = !item.done;
};
</script>

<template>
  <div class="space-y-8 max-w-7xl mx-auto">
    <!-- Top Row: Welcome Banner + Clock/Calendar Widget -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 1. Discovery Banner -->
      <div class="lg:col-span-2 rounded-3xl p-8 bg-gradient-to-r from-brand-blue to-sky-600 text-white relative overflow-hidden shadow-lg flex flex-col justify-between min-h-[220px]">
        <div class="relative z-10 max-w-md">
          <span class="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider">Mùa du lịch 2026</span>
          <h2 class="text-3xl font-extrabold mt-3 leading-tight">Khám phá điểm đến mới cùng bạn bè!</h2>
          <p class="text-white/80 text-sm mt-2">Hàng trăm địa điểm tuyệt đẹp tại Đà Lạt, Phú Quốc và Sapa đang chờ bạn lên lịch trình.</p>
        </div>
        <div class="relative z-10 mt-6 flex items-center gap-3">
          <button
            class="px-5 py-2.5 bg-brand-orange hover:bg-brand-orange-hover text-white rounded-full font-bold text-xs shadow-md transition flex items-center gap-2"
            @click="router.push('/trips')"
          >
            Khám phá ngay <ArrowRight class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- 2. Clock & Calendar Widget -->
      <div class="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
        <div class="flex items-center justify-between border-b border-slate-100 pb-4">
          <div class="flex items-center gap-2.5 text-slate-800">
            <Clock class="w-5 h-5 text-brand-orange" />
            <span class="font-bold text-sm">Thời gian biểu</span>
          </div>
          <span class="text-xs font-semibold px-2.5 py-1 bg-sky-50 text-brand-blue rounded-full">Hôm nay</span>
        </div>

        <div class="my-4 text-center">
          <div class="text-4xl font-black text-slate-900 tracking-tight">10:45 <span class="text-base font-semibold text-slate-400">AM</span></div>
          <p class="text-xs text-slate-500 mt-1 flex items-center justify-center gap-1.5">
            <Calendar class="w-3.5 h-3.5" /> Thứ Ba, 30 Tháng 09, 2026
          </p>
        </div>

        <div class="bg-slate-50 rounded-2xl p-3 text-center text-xs text-slate-600 font-medium">
          Thời tiết tại Đà Lạt hôm nay: <span class="font-bold text-brand-blue">21°C Nắng nhẹ</span>
        </div>
      </div>
    </div>

    <!-- Middle Row: Upcoming Trip Card (Slot for Cặp 2) + Checklist Hành Lý -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- UPCOMING TRIP CARD (Màn 4 Phú Quốc 5 sao) -->
      <div class="lg:col-span-2 bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-2">
        <div class="relative h-64 md:h-auto bg-cover bg-center" style="background-image: url('https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop&q=80')">
          <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
          <span class="absolute top-4 left-4 bg-brand-orange text-white text-[11px] font-extrabold uppercase px-3 py-1 rounded-full shadow">
            27 ngày nữa
          </span>
          <div class="absolute bottom-4 left-4 text-white">
            <p class="text-xs font-medium text-white/80">Chuyến đi sắp tới</p>
            <h3 class="text-xl font-black">Phú Quốc Luxury 5 sao</h3>
          </div>
        </div>

        <div class="p-6 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between text-xs text-slate-500 mb-3">
              <span>Khởi hành: 27/10/2026</span>
              <span class="font-bold text-emerald-600">Đã chốt lịch</span>
            </div>
            <p class="text-xs text-slate-600 leading-relaxed">
              Nghỉ dưỡng tại Vinpearl Resort & Spa Phú Quốc, thưởng thức hải sản Hàm Ninh và lặn ngắm san hô tại Hòn Móng Tay.
            </p>

            <div class="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span class="text-xs text-slate-500">Thành viên:</span>
              <div class="flex items-center -space-x-2">
                <img class="w-7 h-7 rounded-full ring-2 ring-white" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100" />
                <img class="w-7 h-7 rounded-full ring-2 ring-white" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100" />
                <span class="w-7 h-7 rounded-full bg-slate-100 ring-2 ring-white text-[10px] font-bold text-slate-600 flex items-center justify-center">+2</span>
              </div>
            </div>
          </div>

          <button
            class="mt-6 w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
            @click="router.push('/planner/phu-quoc')"
          >
            Mở lịch trình chi tiết ->
          </button>
        </div>
      </div>

      <!-- Chuẩn Bị Hành Lý (Checklist Widget) -->
      <div class="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-bold text-slate-900 text-sm">Chuẩn bị hành lý</h3>
            <span class="text-xs text-slate-400 font-medium">2/4 xong</span>
          </div>

          <ul class="space-y-2.5">
            <li
              v-for="item in checklist"
              :key="item.id"
              class="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition text-xs"
              @click="toggleCheck(item)"
            >
              <CheckCircle2 v-if="item.done" class="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <Circle v-else class="w-4 h-4 text-slate-300 flex-shrink-0" />
              <span :class="item.done ? 'line-through text-slate-400' : 'text-slate-700 font-medium'">
                {{ item.text }}
              </span>
            </li>
          </ul>
        </div>

        <button class="mt-4 w-full py-2 border border-dashed border-slate-300 hover:border-brand-orange text-slate-500 hover:text-brand-orange text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition">
          <Plus class="w-3.5 h-3.5" /> Thêm đồ dùng mới
        </button>
      </div>
    </div>
  </div>
</template>
