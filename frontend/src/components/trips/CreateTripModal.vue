<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useAuthStore } from '@/stores/auth.store';
import { useActivityStore } from '@/stores/activity.store';
import { createTrip, uploadImage } from '@/services/trip.service';
import { goongService } from '@/services/goong.service';
import { useDebounce } from '@/composables/useDebounce';
import { formatTripDate, getTripDays } from '@/utils/trip-date';
import type { Trip } from '@/types/trip';

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'created', trip: Trip): void;
}>();

const authStore = useAuthStore();
const activityStore = useActivityStore();
const img = (name: string) => new URL(`../../assets/my_planner/${name}`, import.meta.url).href;

let keepPreview = false;
const title = ref('');
const destination = ref('');
const description = ref('');
const startDate = ref('');
const endDate = ref('');
const coverFile = ref<File | null>(null);
const coverPreview = ref('');
const isUploadingCover = ref(false);
const submitting = ref(false);
const formError = ref('');
const titleInput = ref<HTMLInputElement | null>(null);

// Destination Autocomplete
const destinationSuggestions = ref<Array<{ id: string; name: string; description: string; placeId?: string; lat?: number; lng?: number }>>([]);
const isSearchingDestination = ref(false);
const showDestinationDropdown = ref(false);
const debouncedDestination = useDebounce(destination, 250);

watch(debouncedDestination, async (val) => {
  const query = val?.trim() || '';
  if (query.length < 2) {
    destinationSuggestions.value = [];
    showDestinationDropdown.value = false;
    return;
  }
  isSearchingDestination.value = true;
  try {
    const results = await goongService.searchDestinations(query);
    destinationSuggestions.value = results;
    showDestinationDropdown.value = results.length > 0;
  } catch {
    destinationSuggestions.value = [];
  } finally {
    isSearchingDestination.value = false;
  }
});

const selectDestination = (item: { name: string; description: string }) => {
  destination.value = item.name;
  showDestinationDropdown.value = false;
};

const hideDropdown = () => {
  setTimeout(() => {
    showDestinationDropdown.value = false;
  }, 200);
};

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

const onFileChange = async (event: Event) => {
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

  // Tự động tải ảnh lên Cloudinary
  isUploadingCover.value = true;
  try {
    const url = await uploadImage(file);
    if (url) {
      revokePreview();
      coverPreview.value = url;
    }
  } catch (err: any) {
    console.error('Lỗi khi tải ảnh:', err);
    formError.value = 'Không thể tải ảnh lên: ' + errorMessage(err, 'Lỗi kết nối máy chủ');
  } finally {
    isUploadingCover.value = false;
  }
};

const errorMessage = (error: unknown, fallback: string) => {
  const e = error as any;
  if (e?.message) {
    if (Array.isArray(e.message)) return e.message[0];
    return e.message;
  }
  if (e?.error) return e.error;
  return fallback;
};

const submitTrip = async () => {
  if (!canSubmit.value || submitting.value || isUploadingCover.value) return;
  submitting.value = true;
  formError.value = '';

  try {
    let finalCoverUrl = '';

    // Nếu ảnh vẫn là blob (chưa upload xong) và có file, thực hiện upload trước
    if (coverPreview.value.startsWith('blob:') && coverFile.value) {
      try {
        finalCoverUrl = await uploadImage(coverFile.value);
      } catch (err) {
        console.warn('Lỗi tải ảnh:', err);
      }
    } else if (coverPreview.value && !coverPreview.value.startsWith('blob:')) {
      finalCoverUrl = coverPreview.value;
    }

    const payload: any = {
      title: title.value.trim(),
      destination: destination.value.trim(),
      start_date: startDate.value,
      end_date: endDate.value,
    };

    if (description.value.trim()) payload.description = description.value.trim();
    if (finalCoverUrl) {
      payload.cover_image_url = finalCoverUrl;
    }

    const response: any = await createTrip(payload);
    const created = response?.data || response;

    const start = formatTripDate(startDate.value).slice(0, 5);
    const end = formatTripDate(endDate.value).slice(0, 5);

    keepPreview = Boolean(finalCoverUrl);
    activityStore.addActivity({
      type: 'CREATE_TRIP',
      text: `Bạn vừa tạo chuyến đi "${created?.title || title.value}"`,
    });
    emit('created', {
      id: created?.id,
      title: created?.title || title.value,
      dates: `${start} - ${end}`,
      duration: `${days.value.length} ngày`,
      members: 1,
      location: created?.destination || destination.value,
      destination: created?.destination || destination.value,
      author: authStore.displayName,
      owner: authStore.user ? { id: authStore.user.id, full_name: authStore.displayName } : undefined,
      image: created?.cover_image_url || finalCoverUrl || 'DaLat.png',
      cover_image_url: created?.cover_image_url || finalCoverUrl || undefined,
      status: 'Đang lên kế hoạch',
      secondary: 'Của tôi',
      start_date: created?.start_date || startDate.value,
      end_date: created?.end_date || endDate.value,
      days: created?.days || [],
      _count: created?._count,
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

          <div class="form-field">
            <span>Điểm đến chính <b>*</b></span>
            <div class="destination-container">
              <div class="input-with-icon">
                <img :src="img('icon_location.svg')" alt="" />
                <input
                  v-model="destination"
                  placeholder="Tìm thành phố hoặc quốc gia..."
                  required
                  autocomplete="off"
                  @focus="showDestinationDropdown = destinationSuggestions.length > 0"
                  @blur="hideDropdown"
                />
              </div>

              <!-- Autocomplete Dropdown List -->
              <div
                v-if="showDestinationDropdown && destinationSuggestions.length > 0"
                class="autocomplete-dropdown"
              >
                <div
                  v-for="item in destinationSuggestions"
                  :key="item.id"
                  class="autocomplete-item"
                  @mousedown.prevent="selectDestination(item)"
                >
                  <img :src="img('icon_location.svg')" class="autocomplete-icon" alt="" />
                  <div class="autocomplete-text">
                    <div class="autocomplete-name">{{ item.name }}</div>
                    <div class="autocomplete-desc">{{ item.description }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

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
            <label class="cover-dropzone" :class="{ 'has-preview': coverPreview, 'is-uploading': isUploadingCover }">
              <template v-if="coverPreview">
                <img :src="coverPreview" alt="Ảnh bìa xem trước" />
                <span class="cover-overlay">
                  {{ isUploadingCover ? 'Đang tải lên...' : 'Đổi ảnh bìa' }}
                </span>
              </template>
              <div v-else>
                <span class="upload-symbol" aria-hidden="true">{{ isUploadingCover ? '⏳' : '↑' }}</span>
                <strong>{{ isUploadingCover ? 'Đang tải ảnh lên Cloudinary...' : 'Kéo thả hoặc chọn ảnh từ thiết bị' }}</strong>
                <small>JPG, PNG hoặc WEBP · Tối đa 10MB</small>
              </div>
              <input type="file" accept="image/jpeg,image/png,image/webp" :disabled="isUploadingCover" @change="onFileChange" />
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
                  Chuyến đi kéo dài {{ days.length }} ngày. Hệ thống sẽ tạo sẵn {{ days.length }} ngày trong lịch trình.
                </p>
              </div>
            </div>
            <div class="day-chips">
              <span v-for="(day, index) in days.slice(0, 5)" :key="day.toISOString()">
                Ngày {{ index + 1 }} · {{ dayLabel(day) }}
              </span>
              <span v-if="days.length > 5" class="more-days">+{{ days.length - 5 }} ngày nữa</span>
            </div>
          </div>

          <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>

          <footer class="modal-footer">
            <button class="cancel-button" type="button" @click="emit('close')">Hủy</button>
            <button class="create-button" type="submit" :disabled="!canSubmit || submitting || isUploadingCover">
              {{ submitting ? 'Đang tạo...' : isUploadingCover ? 'Đang tải ảnh...' : 'Tạo chuyến đi' }}
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

.destination-container { position: relative; width: 100%; }
.input-with-icon { display: flex; align-items: center; padding: 0 14px; }
.input-with-icon img { width: 21px; height: 21px; margin-right: 8px; flex-shrink: 0; }
.input-with-icon input { min-width: 0; flex: 1; border: 0; outline: 0; background: transparent; height: 100%; font-size: 14px; color: #152d3a; }

.autocomplete-dropdown {
  position: absolute;
  top: calc(100% + 5px);
  left: 0;
  right: 0;
  background: white;
  border: 1px solid rgb(107 195 242 / 45%);
  border-radius: 14px;
  box-shadow: 0 12px 30px rgba(4, 59, 92, 0.16);
  max-height: 220px;
  overflow-y: auto;
  z-index: 60;
  padding: 6px;
}
.autocomplete-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 120ms ease;
}
.autocomplete-item:hover {
  background: rgb(107 195 242 / 14%);
}
.autocomplete-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  opacity: 0.7;
}
.autocomplete-text {
  min-width: 0;
  flex: 1;
}
.autocomplete-name {
  font-size: 13px;
  font-weight: 700;
  color: #043b5c;
}
.autocomplete-desc {
  font-size: 11px;
  color: #757d6f;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.trip-description { width: 100%; min-height: 82px; resize: vertical; border: 1px solid rgb(117 125 111 / 32%); border-radius: 13px; background: white; color: #152d3a; padding: 12px 15px 25px; font-size: 14px; outline: 0; }
.description-count { position: absolute; right: 13px; bottom: 9px; color: #90978c; font-size: 11px; }

.cover-fieldset, .date-fieldset { min-width: 0; margin: 0 0 20px; border: 0; padding: 0; }
.cover-dropzone { position: relative; display: grid; width: 100%; height: 170px; margin-top: 10px; overflow: hidden; place-items: center; border: 1.5px dashed rgb(18 128 120 / 52%); border-radius: 15px; background: rgb(107 195 242 / 8%); cursor: pointer; transition: opacity 150ms ease; }
.cover-dropzone.is-uploading { opacity: 0.7; cursor: wait; }
.cover-dropzone > div { display: flex; align-items: center; flex-direction: column; gap: 5px; color: #245766; text-align: center; }
.cover-dropzone strong { font-size: 13px; font-weight: 600; }
.cover-dropzone small { color: #75847d; font-size: 11px; }
.upload-symbol { display: grid; width: 38px; height: 38px; margin-bottom: 3px; place-items: center; border-radius: 50%; background: #128078; color: white; font-size: 22px; }
.cover-dropzone input { position: absolute; width: 1px; height: 1px; opacity: 0; }
.cover-dropzone.has-preview { border-style: solid; }
.cover-dropzone > img { width: 100%; height: 100%; object-fit: cover; }
.cover-overlay { position: absolute; right: 12px; bottom: 12px; border-radius: 9px; background: rgb(255 255 255 / 92%); color: #0a5954; padding: 7px 11px; font-size: 11px; font-weight: 600; box-shadow: 0 2px 8px rgb(0 0 0 / 18%); }

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
}
</style>
