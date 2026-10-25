<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import TripCard from '@/components/trips/TripCard.vue';
import CreateTripModal from '@/components/trips/CreateTripModal.vue';
import type { Trip } from '@/types/trip';
import { getTrips } from '@/services/trip.service';
import { useAuthStore } from '@/stores/auth.store';

const img = (name: string) => new URL(`../../assets/my_planner/${name}`, import.meta.url).href;

const authStore = useAuthStore();

const tabs = ['Tất cả', 'Của tôi', 'Đã lưu'];
const activeTab = ref('Của tôi');
const query = ref('');
const createModalOpen = ref(false);
const tripList = ref<Trip[]>([]);
const loading = ref(false);
const error = ref('');

const mapTripFromApi = (t: any): Trip => {
  const ownerName = t.owner?.full_name || authStore.displayName;
  const start = t.start_date ? new Date(t.start_date) : null;
  const end = t.end_date ? new Date(t.end_date) : null;
  const formatDate = (d: Date) => d.toLocaleDateString('vi-VN');
  const dates = start && end ? `${formatDate(start)} - ${formatDate(end)}` : t.dates || '';
  const daysCount = t._count?.days || t.days?.length || 0;
  const isOwner = authStore.user?.id && t.owner_id === authStore.user.id;

  return {
    id: t.id,
    title: t.title,
    dates,
    duration: daysCount > 0 ? `${daysCount} ngày` : t.duration,
    members: t.members_count || 1,
    location: t.destination || t.location,
    destination: t.destination,
    author: ownerName,
    owner: t.owner,
    image: t.cover_image_url || t.image || 'DaLat.png',
    cover_image_url: t.cover_image_url,
    status: 'Đang lên kế hoạch',
    secondary: isOwner ? 'Của tôi' : t.bookmarked || t.is_bookmarked ? 'Đã lưu' : undefined,
    start_date: t.start_date,
    end_date: t.end_date,
    days: t.days,
    _count: t._count,
  };
};

const fetchTrips = async () => {
  loading.value = true;
  error.value = '';
  try {
    const tabMap: Record<string, string> = {
      'Tất cả': 'all',
      'Của tôi': 'mine',
      'Đã lưu': 'saved',
    };
    const response: any = await getTrips({ tab: tabMap[activeTab.value] });
    const data = response?.data || response;
    const list = Array.isArray(data) ? data : data?.trips || [];
    tripList.value = list.map((t: any) => mapTripFromApi(t));
  } catch (err: any) {
    error.value = err?.message || 'Không thể tải danh sách chuyến đi';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchTrips();
});

const visibleTrips = computed(() => {
  const q = query.value.trim().toLocaleLowerCase('vi');
  if (!q) return tripList.value;
  return tripList.value.filter((t) => t.title.toLocaleLowerCase('vi').includes(q));
});

const onTripCreated = (trip: Trip) => {
  tripList.value.unshift(trip);
  fetchTrips().catch(() => {});
};
</script>

<template>
  <section class="content-panel">
    <div class="content-heading">
      <h1>Chuyến đi của tôi</h1>
      <label class="trip-search">
        <img :src="img('icon_search.svg')" alt="" />
        <input v-model="query" placeholder="Tìm tên chuyến đi" aria-label="Tìm tên chuyến đi" />
      </label>

    <CreateTripModal v-if="createModalOpen" @close="createModalOpen = false" @created="onTripCreated" />
    </div>

    <div class="tabs" role="tablist">
      <button
        v-for="tab in tabs"
        :key="tab"
        type="button"
        role="tab"
        :class="{ active: activeTab === tab }"
        :aria-selected="activeTab === tab"
        @click="activeTab = tab; fetchTrips()"
      >
        {{ tab }}
      </button>
    </div>
    <div class="tab-lines" aria-hidden="true">
      <img class="base-line" :src="img('line1.svg')" alt="" />
      <!-- <img class="active-line" :src="img('409b2.svg')" alt="" /> -->
    </div>

    <div class="trip-grid">
      <TripCard v-for="trip in visibleTrips" :key="trip.id || trip.title" :trip="trip" />
      <p v-if="loading" class="empty-state">Đang tải...</p>
      <p v-else-if="error" class="empty-state">{{ error }}</p>
      <p v-else-if="visibleTrips.length === 0" class="empty-state">Không tìm thấy chuyến đi phù hợp.</p>
    </div>
    
    <button
        class="create-trip-fab"
        type="button"
        aria-label="Tạo chuyến đi mới"
        :aria-expanded="createModalOpen"
        @click="createModalOpen = true"
      >
        <span aria-hidden="true">+</span>
    </button>
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
.create-trip-fab { position: fixed; z-index: 30; right: 34px; bottom: 30px; display: grid; width: 66px; height: 66px; place-items: center; border: 4px solid rgb(255 255 255 / 88%); border-radius: 50%; background: #128078; box-shadow: 0 8px 22px rgb(4 59 92 / 34%), 0 0 0 4px rgb(107 195 242 / 38%); color: white; cursor: pointer; transition: transform 160ms ease, box-shadow 160ms ease, background 160ms ease; }
.create-trip-fab span { transform: translateY(-2px); font-size: 42px; font-weight: 400; line-height: 1; }
.create-trip-fab:hover { transform: translateY(-3px) scale(1.03); background: #0d716a; box-shadow: 0 12px 26px rgb(4 59 92 / 38%), 0 0 0 5px rgb(107 195 242 / 45%); }
.create-trip-fab:focus-visible { outline: 3px solid #043b5c; outline-offset: 5px; }

@media (max-width: 760px) {
  .create-trip-fab { right: 21px; bottom: 22px; width: 58px; height: 58px; }
  .create-trip-fab span { font-size: 37px; }
}
@media (max-width: 1100px) { .trip-grid { grid-template-columns: minmax(0, 1fr); } }
@media (max-width: 760px) {
  .content-heading { flex-direction: column; align-items: stretch; gap: 15px; }
  .trip-search { width: 100%; }
  .tabs { overflow-x: auto; }
  .tab-lines { display: none; }
}
</style>