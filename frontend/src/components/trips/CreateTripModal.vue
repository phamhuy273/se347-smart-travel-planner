<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useAuthStore } from '@/stores/auth.store';
import { createTrip } from '@/services/trip.service';
import { formatTripDate, getTripDays } from '@/utils/trip-date';
import type { Trip } from '@/types/trip';

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'created', trip: Trip): void;
}>();

const authStore = useAuthStore();
const img = (name: string) => new URL(`../../assets/my_planner/${name}`, import.meta.url).href;

let keepPreview = false;
const title = ref('');
const destination = ref('');
const description = ref('');
const startDate = ref('');
const endDate = ref('');
const coverFile = ref<File | null>(null);
const coverPreview = ref('');
const submitting = ref(false);
const formError = ref('');
const titleInput = ref<HTMLInputElement | null>(null);

const days = computed(() => getTripDays(startDate.value, endDate.value));
const canSubmit = computed(() => Boolean(title.value.trim() && destination.value.trim() && days.value.length > 0));

const dayLabel = (day: Date) =>
  new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(day);

// Nếu ngày bắt đầu lùi qua ngày kết thúc thì xoá ngày kết thúc
watch(startDate, (value) => {
  if (endDate.value && endDate.value < value) endDate.value = '';
});

const revokePreview = () => {
  if (coverPreview.value.startsWith('blob:')) URL.revokeObjectURL(coverPreview.value);
};

const handleEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape') emit('close');
};

onMounted(() => {
  document.body.style.overflow = 'hidden';
  window.addEventListener('keydown', handleEscape);
  titleInput.value?.focus();
});

onBeforeUnmount(() => {
  document.body.style.overflow = '';
  window.removeEventListener('keydown', handleEscape);
  if (!keepPreview) revokePreview();
});

const onFileChange = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  if (file.size > 10 * 1024 * 1024) {
    formError.value = 'Ảnh phải nhỏ hơn 10MB.';
    return;
  }
  revokePreview();
  coverFile.value = file;
  coverPreview.value = URL.createObjectURL(file);
  formError.value = '';
};

const errorMessage = (error: unknown, fallback: string) => {
  const e = error as { message?: string; error?: string };
  return e?.message || e?.error || fallback;
};

const submitTrip = async () => {
  if (!canSubmit.value || submitting.value) return;
  submitting.value = true;
  formError.value = '';

  const formData = new FormData();
  formData.set('title', title.value);
  formData.set('destination', destination.value);
  formData.set('description', description.value);
  formData.set('startDate', startDate.value);
  formData.set('endDate', endDate.value);
  if (coverFile.value) formData.set('coverFile', coverFile.value);

  try {
    // Dữ liệu giả, xoá khi có API thật
    const { trip } = {
      trip: {
        title: title.value,
        destination: destination.value,
        startDate: startDate.value,
        endDate: endDate.value,
        dayCount: days.value.length,
        coverURL: coverPreview.value,
      },
    };

    const start = formatTripDate(trip.startDate.slice(0, 10)).slice(0, 5);
    const end = formatTripDate(trip.endDate.slice(0, 10)).slice(0, 5);

    keepPreview = Boolean(trip.coverURL); // giữ link blob cho thẻ mới
    emit('created', {
      title: trip.title,
      dates: `${start} - ${end}`,
      duration: `${trip.dayCount} ngày`,
      members: 1,
      location: trip.destination,
      author: authStore.displayName,
      image: trip.coverURL || 'DaLat.png',
      status: 'Đang lên kế hoạch',
      secondary: 'Của tôi',
    });
    emit('close');
  } catch (error) {
    formError.value = errorMessage(error, 'Không thể tạo chuyến đi.');
  } finally {
    submitting.value = false;
  }
};
</script>

<template>
  <Teleport to="body">
    <div class="modal-backdrop" role="presentation" @mousedown.self="emit('close')">
      <section class="create-trip-modal" role="dialog" aria-modal="true" aria-labelledby="create-trip-title">
        <header class="modal-header">
          <div>
            <h2 id="create-trip-title">Tạo chuyến đi mới</h2>
            <p>Bắt đầu hành trình mới của bạn</p>
          </div>
          <button class="modal-close" type="button" aria-label="Đóng modal" @click="emit('close')">×</button>
        </header>

        <form class="create-trip-form" @submit.prevent="submitTrip">
          <label class="form-field">
            <span>Tên chuyến đi <b>*</b></span>
            <input ref="titleInput" v-model="title" placeholder="Ví dụ: Khám phá Đà Lạt" maxlength="80" required />
            <small class="character-count">{{ title.length }}/80</small>
          </label>

          <label class="form-field">
            <span>Điểm đến chính <b>*</b></span>
            <div class="input-with-icon">
              <img :src="img('icon_location.svg')" alt="" />
              <input v-model="destination" placeholder="Tìm thành phố hoặc quốc gia..." required />
            </div>
          </label>

          <label class="form-field">
            <span>Mô tả ngắn</span>
            <textarea
              v-model="description"
              class="trip-description"
              placeholder="Bạn mong chờ điều gì trong chuyến đi này?"
              maxlength="300"
              rows="3"
            />
            <small class="description-count">{{ description.length }}/300</small>
          </label>

          <fieldset class="cover-fieldset">
            <legend>Ảnh bìa</legend>
            <label class="cover-dropzone" :class="{ 'has-preview': coverPreview }">
                <template v-if="coverPreview">
                <img :src="coverPreview" alt="Ảnh bìa xem trước" />
                <span class="cover-overlay">Đổi ảnh bìa</span>
                </template>
                <div v-else>
                <span class="upload-symbol" aria-hidden="true">↑</span>
                <strong>Kéo thả hoặc chọn ảnh từ thiết bị</strong>
                <small>JPG, PNG hoặc WEBP · Tối đa 10MB</small>
                </div>
                <input type="file" accept="image/jpeg,image/png,image/webp" @change="onFileChange" />
            </label>
          </fieldset>

          <fieldset class="date-fieldset">
            <legend>Thời gian chuyến đi <b>*</b></legend>
            <div class="date-range">
              <label>
                <span>Ngày bắt đầu</span>
                <input v-model="startDate" type="date" required />
              </label>
              <span class="date-arrow" aria-hidden="true">→</span>
              <label>
                <span>Ngày kết thúc</span>
                <input v-model="endDate" type="date" :min="startDate" required />
              </label>
            </div>
          </fieldset>

          <div v-if="days.length > 0" class="days-preview">
            <div class="days-preview-heading">
              <img :src="img('icon_calendar.png')" alt="" />
              <div>
                <strong>{{ formatTripDate(startDate) }} – {{ formatTripDate(endDate) }}</strong>
                <p>
                  Chuyến đi kéo dài {{ days.length }} ngày. Hệ thống sẽ tạo sẵn {{ days.length }} ngày trong lịch
                  trình.
                </p>
              </div>
            </div>
            <div class="day-chips">
              <span v-for="(day, index) in days.slice(0, 5)" :key="day.toISOString()">
                Ngày {{ index + 1 }} · {{ dayLabel(day) }}
              </span>
              <span v-if="days.length > 5" class="more-days">+ {{ days.length - 5 }} ngày khác</span>
            </div>
          </div>

          <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>

          <footer class="modal-footer">
            <button class="cancel-button" type="button" @click="emit('close')">Hủy</button>
            <button class="create-button" type="submit" :disabled="!canSubmit || submitting">
              {{ submitting ? 'Đang tạo...' : 'Tạo chuyến đi' }}
            </button>
          </footer>
        </form>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-backdrop { position: fixed; z-index: 100; inset: 0; display: grid; overflow-y: auto; place-items: center; padding: 28px; background: rgb(4 59 92 / 38%); backdrop-filter: blur(6px); font-family: 'Be Vietnam Pro', sans-serif; animation: modal-fade-in 160ms ease-out; }
.create-trip-modal { width: min(790px, 100%); max-height: calc(100dvh - 56px); overflow-y: auto; border: 1px solid rgb(10 78 72 / 24%); border-radius: 24px; background: rgb(255 254 246 / 98%); box-shadow: 0 24px 70px rgb(4 59 92 / 30%); animation: modal-rise 220ms ease-out; }
.modal-header { display: flex; align-items: flex-start; justify-content: space-between; padding: 28px 30px 20px; border-bottom: 1px solid rgb(117 125 111 / 20%); }
.modal-header h2 { margin: 0; color: #043b5c; font-size: 26px; font-weight: 900; line-height: 1.25; }
.modal-header p { margin: 5px 0 0; color: #757d6f; font-size: 14px; font-weight: 400; }
.modal-close { display: grid; width: 38px; height: 38px; place-items: center; border: 0; border-radius: 12px; background: rgb(107 195 242 / 18%); color: #043b5c; font-size: 29px; font-weight: 500; line-height: 1; cursor: pointer; }
.modal-close:hover { background: rgb(107 195 242 / 34%); }
.create-trip-form { padding: 24px 30px 28px; }

.form-field { position: relative; display: block; margin-bottom: 20px; }
.form-field > span, .date-fieldset legend, .cover-fieldset > legend { display: block; margin-bottom: 8px; padding: 0; color: #173f54; font-size: 14px; font-weight: 600; }
.form-field b, .date-fieldset b { color: #df4d64; }
.form-field > input, .input-with-icon, .date-range input { width: 100%; height: 48px; border: 1px solid rgb(117 125 111 / 32%); border-radius: 13px; background: white; color: #152d3a; font-size: 14px; font-weight: 400; outline: 0; transition: border-color 150ms ease, box-shadow 150ms ease; }
.form-field > input { padding: 0 54px 0 15px; }
.form-field > input:focus, .input-with-icon:focus-within, .date-range input:focus, .trip-description:focus { border-color: #128078; box-shadow: 0 0 0 3px rgb(107 195 242 / 24%); }
.form-field input::placeholder, .form-field textarea::placeholder { color: #90978c; }
.character-count { position: absolute; right: 13px; bottom: 15px; color: #90978c; font-size: 11px; }
.input-with-icon { display: flex; align-items: center; padding: 0 14px; }
.input-with-icon img { width: 21px; height: 21px; margin-right: 8px; }
.input-with-icon input { min-width: 0; flex: 1; border: 0; outline: 0; background: transparent; }

.trip-description { width: 100%; min-height: 82px; resize: vertical; border: 1px solid rgb(117 125 111 / 32%); border-radius: 13px; background: white; color: #152d3a; padding: 12px 15px 25px; font-size: 14px; outline: 0; }
.description-count { position: absolute; right: 13px; bottom: 9px; color: #90978c; font-size: 11px; }

.cover-fieldset, .date-fieldset { min-width: 0; margin: 0 0 20px; border: 0; padding: 0; }
.cover-tabs { display: inline-flex; gap: 4px; padding: 4px; border-radius: 12px; background: rgb(107 195 242 / 14%); }
.cover-tabs button { height: 34px; border: 0; border-radius: 9px; padding: 0 14px; background: transparent; color: #62746d; font-size: 12px; font-weight: 500; cursor: pointer; }
.cover-tabs button.active { background: white; color: #0a5954; box-shadow: 0 2px 6px rgb(4 59 92 / 12%); }
.cover-dropzone { position: relative; display: grid; width: 100%; height: 170px; margin-top: 10px; overflow: hidden; place-items: center; border: 1.5px dashed rgb(18 128 120 / 52%); border-radius: 15px; background: rgb(107 195 242 / 8%); cursor: pointer; }
.cover-dropzone > div { display: flex; align-items: center; flex-direction: column; gap: 5px; color: #245766; text-align: center; }
.cover-dropzone strong { font-size: 13px; font-weight: 600; }
.cover-dropzone small { color: #75847d; font-size: 11px; }
.upload-symbol { display: grid; width: 38px; height: 38px; margin-bottom: 3px; place-items: center; border-radius: 50%; background: #128078; color: white; font-size: 22px; }
.cover-dropzone input { position: absolute; width: 1px; height: 1px; opacity: 0; }
.cover-dropzone.has-preview { border-style: solid; }
.cover-dropzone > img { width: 100%; height: 100%; object-fit: cover; }
.cover-overlay { position: absolute; right: 12px; bottom: 12px; border-radius: 9px; background: rgb(255 255 255 / 92%); color: #0a5954; padding: 7px 11px; font-size: 11px; font-weight: 600; box-shadow: 0 2px 8px rgb(0 0 0 / 18%); }

.unsplash-picker { margin-top: 10px; }
.unsplash-search { display: flex; height: 43px; overflow: hidden; border: 1px solid rgb(117 125 111 / 32%); border-radius: 12px; background: white; }
.unsplash-search input { min-width: 0; flex: 1; border: 0; outline: 0; padding: 0 13px; font-size: 13px; }
.unsplash-search button { border: 0; background: #128078; color: white; padding: 0 17px; font-size: 12px; font-weight: 600; cursor: pointer; }
.unsplash-search button:disabled { background: #88aaa6; }
.unsplash-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-top: 10px; }
.unsplash-grid button { position: relative; height: 105px; overflow: hidden; border: 2px solid transparent; border-radius: 11px; padding: 0; background: #dce9e9; cursor: pointer; }
.unsplash-grid button.selected { border-color: #128078; box-shadow: 0 0 0 2px rgb(107 195 242 / 38%); }
.unsplash-grid img { width: 100%; height: 100%; object-fit: cover; }
.unsplash-grid span { position: absolute; right: 0; bottom: 0; left: 0; overflow: hidden; background: linear-gradient(transparent, rgb(0 0 0 / 72%)); color: white; padding: 19px 5px 5px; font-size: 9px; text-overflow: ellipsis; white-space: nowrap; }
.unsplash-hint { margin: 14px 0 2px; color: #75847d; font-size: 12px; text-align: center; }

.date-range { display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); align-items: end; gap: 13px; }
.date-range label > span { display: block; margin-bottom: 7px; color: #757d6f; font-size: 12px; }
.date-range input { padding: 0 13px; font-weight: 500; color-scheme: light; }
.date-arrow { display: grid; width: 30px; height: 48px; place-items: center; color: #128078; font-size: 20px; }

.days-preview { margin-top: 3px; padding: 16px; border: 1px solid rgb(107 195 242 / 42%); border-radius: 15px; background: rgb(107 195 242 / 13%); }
.days-preview-heading { display: flex; align-items: flex-start; }
.days-preview-heading img { width: 25px; height: 25px; margin: 1px 10px 0 0; opacity: 0.68; }
.days-preview-heading strong { color: #0a5954; font-size: 14px; font-weight: 600; }
.days-preview-heading p { margin: 3px 0 0; color: #5f6f68; font-size: 12px; line-height: 1.6; }
.day-chips { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 12px; }
.day-chips span { display: inline-flex; align-items: center; height: 28px; padding: 0 10px; border-radius: 14px; background: white; color: #175d70; font-size: 11px; font-weight: 500; box-shadow: 0 1px 3px rgb(0 0 0 / 8%); }
.day-chips .more-days { background: #128078; color: white; }

.form-error { margin: 14px 0 0; border-radius: 10px; background: rgb(244 65 96 / 10%); color: #a62f45; padding: 10px 12px; font-size: 12px; font-weight: 500; }

.modal-footer { display: flex; justify-content: flex-end; gap: 11px; margin-top: 25px; padding-top: 20px; border-top: 1px solid rgb(117 125 111 / 20%); }
.modal-footer button { height: 43px; border-radius: 12px; padding: 0 22px; font-size: 14px; font-weight: 600; cursor: pointer; }
.cancel-button { border: 1px solid rgb(117 125 111 / 34%); background: white; color: #5b6862; }
.create-button { min-width: 148px; border: 0; background: #128078; box-shadow: 0 4px 10px rgb(18 128 120 / 22%); color: white; }
.create-button:not(:disabled):hover { background: #0d716a; }
.create-button:disabled { cursor: not-allowed; background: #b9ceca; box-shadow: none; }

@keyframes modal-fade-in { from { opacity: 0; } }
@keyframes modal-rise { from { transform: translateY(14px) scale(0.985); opacity: 0; } }

@media (max-width: 760px) {
  .modal-backdrop { align-items: end; padding: 12px; }
  .create-trip-modal { max-height: calc(100dvh - 24px); border-radius: 22px; }
  .modal-header { padding: 22px 19px 17px; }
  .modal-header h2 { font-size: 22px; }
  .create-trip-form { padding: 20px 19px 22px; }
  .date-range { grid-template-columns: 1fr; gap: 10px; }
  .date-arrow { display: none; }
  .modal-footer { position: sticky; bottom: -22px; margin-inline: -19px; padding: 16px 19px 22px; background: #fffef6; }
  .modal-footer button { flex: 1; padding-inline: 12px; }
}
@media (max-width: 600px) {
  .cover-dropzone { height: 145px; }
  .unsplash-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>