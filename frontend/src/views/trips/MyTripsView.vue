<script setup lang="ts">
import { computed, ref } from 'vue';
import TripCard from '@/components/TripCard.vue';
import type { Trip } from '@/types/trip';

const img = (name: string) => new URL(`../../assets/my_planner/${name}`, import.meta.url).href;

const tabs = ['Tất cả (8)', 'Của tôi (3)', 'Đã lưu (5)'];
const activeTab = ref('Của tôi (3)');
const query = ref('');

// MOCKUP DATA
const trips: Trip[] = [
  { title: 'Đà Lạt chill', dates: '10/06 - 13/06', duration: '4 ngày', members: 3, location: 'Đà Lạt, Lâm Đồng', author: 'Pham Huy', image: 'DaLat.png', status: 'Đang lên kế hoạch', secondary: 'Của tôi' },
  { title: 'Sapa mờ sương', dates: '10/10 - 25/10', duration: '16 ngày', members: 5, location: 'Sapa', author: 'Bich Ngoc', image: 'Sapa.png', status: 'Sắp tới', secondary: 'Đã lưu' },
  { title: 'Khám phá Ninh Bình', dates: '15/03 - 18/03', duration: '4 ngày', members: 2, location: 'Ninh Bình', author: 'Pham Huy', image: 'NinhBinh.png', status: 'Đang lên kế hoạch', secondary: 'Của tôi' },
];

const visibleTrips = computed(() => {
  const q = query.value.trim().toLocaleLowerCase('vi');
  return trips.filter((t) => t.title.toLocaleLowerCase('vi').includes(q));
});
</script>

<template>
  <section class="content-panel">
    <div class="content-heading">
      <h1>Chuyến đi của tôi</h1>
      <label class="trip-search">
        <img :src="img('icon_search.svg')" alt="" />
        <input v-model="query" placeholder="Tìm tên chuyến đi" aria-label="Tìm tên chuyến đi" />
      </label>
    </div>

    <div class="tabs" role="tablist">
      <button
        v-for="tab in tabs"
        :key="tab"
        type="button"
        role="tab"
        :class="{ active: activeTab === tab }"
        :aria-selected="activeTab === tab"
        @click="activeTab = tab"
      >
        {{ tab }}
      </button>
    </div>
    <div class="tab-lines" aria-hidden="true">
      <img class="base-line" :src="img('line1.svg')" alt="" />
      <!-- <img class="active-line" :src="img('409b2.svg')" alt="" /> -->
    </div>

    <div class="trip-grid">
      <TripCard v-for="trip in visibleTrips" :key="trip.title" :trip="trip" />
      <p v-if="visibleTrips.length === 0" class="empty-state">Không tìm thấy chuyến đi phù hợp.</p>
    </div>
  </section>
</template>

<style scoped>
.content-panel { border-radius: 20px; background: rgb(255 255 255 / 85%); padding: 21px 31px 46px 30px; font-family: 'Be Vietnam Pro', sans-serif; }
.content-heading { display: flex; align-items: center; justify-content: space-between; }
.content-heading h1 { margin: 0; font-size: 22px; font-weight: 900; }
.trip-search { display: flex; align-items: center; width: 280px; height: 36px; padding: 0 8px; border: 0.2px solid #333; border-radius: 20px; background: #fffef6; box-shadow: 0 1px 4px rgb(0 0 0 / 25%); }
.trip-search img { width: 24px; height: 22px; }
.trip-search input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; padding-left: 5px; color: #757d6f; font-size: 14px; }
.tabs { display: flex; align-items: center; gap: 2px; height: 49px; padding-left: 2px; font-weight: 500; }
.tabs button { min-width: 145px; height: 29px; border: 0; border-radius: 20px; background: transparent; font-size: 16px; cursor: pointer; }
.tabs button.active { background: rgb(107 195 242 / 51%); }
.tab-lines { position: relative; height: 1px; }
.tab-lines img { position: absolute; top: 0; display: block; }
.tab-lines .base-line { left: 0; width: 100%; height: 1px; }
.tab-lines .active-line { left: 145px; width: 149px; height: 3px; transform: translateY(-1px); }
.trip-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 17px 19px; padding-top: 16px; align-items: start; }
.empty-state { grid-column: 1 / -1; margin: 55px 0; color: #757d6f; text-align: center; font-weight: 500; }

@media (max-width: 1100px) { .trip-grid { grid-template-columns: minmax(0, 1fr); } }
@media (max-width: 760px) {
  .content-heading { flex-direction: column; align-items: stretch; gap: 15px; }
  .trip-search { width: 100%; }
  .tabs { overflow-x: auto; }
  .tab-lines { display: none; }
}
</style>