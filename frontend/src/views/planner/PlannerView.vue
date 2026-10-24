<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getTripById } from '@/services/trip.service';

const route = useRoute();
const router = useRouter();
const trip = ref<any>(null);
const loading = ref(true);
const error = ref('');

const formatDate = (d?: string) => {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('vi-VN');
  } catch {
    return d;
  }
};

onMounted(async () => {
  const id = route.params.id as string;
  if (!id) {
    error.value = 'Không tìm thấy chuyến đi';
    loading.value = false;
    return;
  }
  try {
    const response: any = await getTripById(id);
    trip.value = response?.data || response;
  } catch (err: any) {
    error.value = err?.message || 'Không thể tải thông tin chuyến đi';
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="planner-page">
    <header class="planner-header">
      <button class="back-btn" type="button" @click="router.push('/trips')">← Quay lại danh sách</button>
      <div v-if="trip" class="trip-info">
        <h1>{{ trip.title }}</h1>
        <p>{{ trip.destination }} · {{ formatDate(trip.start_date) }} - {{ formatDate(trip.end_date) }}</p>
      </div>
    </header>

    <div v-if="loading" class="state">Đang tải lịch trình...</div>
    <div v-else-if="error" class="state error">{{ error }}</div>
    <div v-else class="planner-content">
      <div class="days-panel">
        <h2>Các ngày trong chuyến đi</h2>
        <div v-if="trip?.days?.length" class="days-list">
          <div v-for="day in trip.days" :key="day.id" class="day-item">
            <div class="day-number">Ngày {{ day.day_number }}</div>
            <div class="day-date">{{ formatDate(day.date) }}</div>
          </div>
        </div>
        <p v-else class="empty">Chưa có ngày nào được tạo.</p>
      </div>
      <div class="schedule-panel">
        <h2>Xếp lịch</h2>
        <p class="hint">Trang xếp lịch đang được phát triển. Các địa điểm sẽ được thêm vào đây.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.planner-page { display: flex; flex-direction: column; height: 100%; font-family: 'Be Vietnam Pro', sans-serif; }
.planner-header { display: flex; align-items: center; gap: 16px; padding: 16px 24px; border-bottom: 1px solid rgb(226 232 240); }
.back-btn { border: 1px solid rgb(203 213 225); background: white; border-radius: 999px; padding: 6px 14px; font-size: 13px; cursor: pointer; }
.trip-info h1 { margin: 0; font-size: 20px; font-weight: 700; }
.trip-info p { margin: 2px 0 0; color: rgb(100 116 139); font-size: 13px; }
.state { flex: 1; display: grid; place-items: center; color: rgb(100 116 139); }
.state.error { color: rgb(220 38 38); }
.planner-content { flex: 1; display: grid; grid-template-columns: 320px 1fr; min-height: 0; }
.days-panel { border-right: 1px solid rgb(226 232 240); padding: 16px; overflow-y: auto; }
.days-panel h2 { margin: 0 0 12px; font-size: 16px; font-weight: 600; }
.days-list { display: flex; flex-direction: column; gap: 8px; }
.day-item { border: 1px solid rgb(226 232 240); border-radius: 12px; padding: 10px 12px; background: white; }
.day-number { font-weight: 600; }
.day-date { color: rgb(100 116 139); font-size: 13px; }
.empty { color: rgb(148 163 184); font-size: 13px; }
.schedule-panel { padding: 20px; }
.schedule-panel h2 { margin: 0 0 8px; font-size: 18px; font-weight: 600; }
.hint { color: rgb(100 116 139); }
@media (max-width: 900px) {
  .planner-content { grid-template-columns: 1fr; }
  .days-panel { border-right: none; border-bottom: 1px solid rgb(226 232 240); }
}
</style>
