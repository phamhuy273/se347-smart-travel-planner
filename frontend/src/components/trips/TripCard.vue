<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Trip } from '@/types/trip';

const props = defineProps<{ trip: Trip }>();

const menuOpen = ref(false);
const img = (name: string) => new URL(`../../assets/my_planner/${name}`, import.meta.url).href;

// URL đầy đủ (http, blob, /...) dùng thẳng; tên file thì lấy từ assets
const cover = computed(() =>
  /^(https?:|blob:|\/)/.test(props.trip.image) ? props.trip.image : img(props.trip.image),
);
</script>

<template>
  <article class="trip-card">
    <div class="trip-image-wrap">
    <img class="trip-image" :src="cover" :alt="trip.title" />
      <button class="more-button" type="button" :aria-expanded="menuOpen" @click="menuOpen = !menuOpen">
        ...
      </button>
      <div v-if="menuOpen" class="card-menu">
        <button type="button">Chỉnh sửa</button>
        <button type="button">Chia sẻ</button>
      </div>
    </div>

    <div class="trip-content">
      <h2>{{ trip.title }}</h2>
      <div class="trip-facts">
        <span><img :src="img('icon_calendar.png')" alt="" />{{ trip.dates }} ({{ trip.duration }})</span>
        <span><img :src="img('icon_members.png')" alt="" />{{ trip.members }} Thành viên</span>
        <span class="location"><img :src="img('icon_location.svg')" alt="" />{{ trip.location }}</span>
      </div>

      <p class="author">Bởi {{ trip.author }}</p>
      <div class="tags">
        <span class="tag blue">{{ trip.status }}</span>
        <span v-if="trip.secondary" class="tag" :class="trip.secondary === 'Đã lưu' ? 'saved' : 'owned'">
          {{ trip.secondary }}
        </span>
      </div>
      <button class="detail-button" type="button">Xem chi tiết</button>
    </div>
  </article>
</template>

<style scoped>
.trip-card { min-width: 0; border-radius: 18px; background: rgb(255 255 255 / 85%); box-shadow: 0 0 5px rgb(0 0 0 / 25%); font-family: 'Be Vietnam Pro', sans-serif; }
.trip-image-wrap { position: relative; height: 162px; margin: 13px 12px 0; }
.trip-image { display: block; width: 100%; height: 100%; border-radius: 10px; object-fit: cover; }
.more-button { position: absolute; top: 6px; right: 6px; display: grid; width: 35px; height: 35px; place-items: center; border: 0; border-radius: 8px; background: #fff; font-size: 18px; font-weight: 900; letter-spacing: 1px; line-height: 1; cursor: pointer; }
.card-menu { position: absolute; z-index: 8; top: 45px; right: 6px; width: 118px; overflow: hidden; border: 1px solid rgb(0 0 0 / 10%); border-radius: 10px; background: #fff; box-shadow: 0 5px 18px rgb(0 0 0 / 16%); font-size: 13px; font-weight: 500; }
.card-menu button { display: block; width: 100%; border: 0; padding: 10px 14px; background: #fff; text-align: left; cursor: pointer; }
.card-menu button:hover { background: #eef8fd; }
.trip-content { padding: 12px 13px; }
.trip-content h2 { margin: 0 0 4px; font-size: 20px; font-weight: 700; }
.trip-facts { display: grid; grid-template-columns: 1fr 0.72fr; row-gap: 4px; color: #757d6f; font-size: 12px; }
.trip-facts span { display: flex; align-items: center; min-width: 0; white-space: nowrap; }
.trip-facts img { width: 20px; height: 20px; margin-right: 6px; object-fit: contain; }
.trip-facts .location { grid-column: 1 / -1; }
.author { margin: 16px 3px 8px; font-size: 14px; font-weight: 500; }
.tags { display: flex; gap: 7px; margin: 0 2px 9px; }
.tag { display: inline-flex; align-items: center; height: 29px; padding: 0 14px; border-radius: 20px; font-size: 13px; font-weight: 500; white-space: nowrap; }
.tag.blue { background: rgb(107 195 242 / 36%); }
.tag.owned { background: rgb(255 145 0 / 55%); }
.tag.saved { background: rgb(244 65 96 / 33%); }
.detail-button { width: 100%; height: 35px; border: 0; border-radius: 10px; background: rgb(107 195 242 / 36%); color: rgb(0 0 0 / 67%); font-size: 14px; font-weight: 600; cursor: pointer; }
</style>