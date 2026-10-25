import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useAuthStore } from './auth.store';
import { getTrips } from '@/services/trip.service';

export interface ActivityItem {
  id: string;
  type: 'CREATE_TRIP' | 'DELETE_TRIP' | 'UPDATE_TRIP' | 'ADD_PLACE' | 'CHECKLIST' | 'UPDATE_COVER';
  text: string;
  time: string;
  timestamp: number;
  color: string;
  iconName: 'Plus' | 'Trash2' | 'Edit3' | 'MapPin' | 'CheckCircle2' | 'Camera';
}

export const useActivityStore = defineStore('activity', () => {
  const authStore = useAuthStore();
  const activities = ref<ActivityItem[]>([]);
  const loading = ref(false);

  const getStorageKey = () => {
    const userId = authStore.user?.id || 'guest';
    return `wanderflow_activities_${userId}`;
  };

  const formatRelativeTime = (timestamp: number) => {
    const diffMs = Date.now() - timestamp;
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Vừa xong';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} giờ trước`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 30) return `${diffDay} ngày trước`;
    return new Date(timestamp).toLocaleDateString('vi-VN');
  };

  const loadActivities = async () => {
    const key = getStorageKey();

    // 1. Nếu người dùng đã từng bấm "Xóa lịch sử", giữ nguyên danh sách rỗng, KHÔNG nạp lại
    const isCleared = localStorage.getItem(`${key}_cleared`) === 'true';
    if (isCleared) {
      activities.value = [];
      return;
    }

    const raw = localStorage.getItem(key);
    let items: ActivityItem[] = [];

    // 2. Nếu đã có dữ liệu lưu trong localStorage (kể cả mảng rỗng)
    if (raw !== null) {
      try {
        items = JSON.parse(raw);
        if (Array.isArray(items)) {
          items.forEach((it) => {
            if (it.timestamp) {
              it.time = formatRelativeTime(it.timestamp);
            }
          });
          activities.value = items;
          return;
        }
      } catch (e) {
        items = [];
      }
    }

    // 3. Chỉ khi LẦN ĐẦU TIÊN (chưa từng có cache và chưa từng xóa), nạp từ các chuyến đi thật trong CSDL
    loading.value = true;
    try {
      const res: any = await getTrips({ tab: 'mine' });
      const rawData = res?.data || res;
      const trips = Array.isArray(rawData) ? rawData : (rawData?.items || []);
      if (Array.isArray(trips) && trips.length > 0) {
        items = trips.slice(0, 5).map((t: any) => {
          const timeMs = t.created_at ? new Date(t.created_at).getTime() : Date.now();
          return {
            id: `init-trip-${t.id}`,
            type: 'CREATE_TRIP',
            text: `Bạn đã tạo chuyến đi "${t.title}"`,
            time: formatRelativeTime(timeMs),
            timestamp: timeMs,
            color: '#22C55E',
            iconName: 'Plus',
          };
        });
        items.sort((a, b) => b.timestamp - a.timestamp);
        localStorage.setItem(key, JSON.stringify(items));
      } else {
        localStorage.setItem(key, JSON.stringify([]));
      }
    } catch (err) {
      console.error('Lỗi khi nạp hoạt động:', err);
    } finally {
      loading.value = false;
    }

    activities.value = items;
  };

  const addActivity = (item: {
    type: ActivityItem['type'];
    text: string;
    color?: string;
    iconName?: ActivityItem['iconName'];
  }) => {
    const now = Date.now();
    let color = item.color || '#0284C7';
    let iconName = item.iconName || 'Edit3';

    if (item.type === 'CREATE_TRIP') {
      color = '#22C55E';
      iconName = 'Plus';
    } else if (item.type === 'DELETE_TRIP') {
      color = '#EF4444';
      iconName = 'Trash2';
    } else if (item.type === 'UPDATE_COVER') {
      color = '#F97316';
      iconName = 'Camera';
    } else if (item.type === 'CHECKLIST') {
      color = '#10B981';
      iconName = 'CheckCircle2';
    } else if (item.type === 'ADD_PLACE') {
      color = '#3B82F6';
      iconName = 'MapPin';
    }

    const newActivity: ActivityItem = {
      id: `act-${now}-${Math.random().toString(36).slice(2, 7)}`,
      type: item.type,
      text: item.text,
      time: 'Vừa xong',
      timestamp: now,
      color,
      iconName,
    };

    activities.value.unshift(newActivity);
    if (activities.value.length > 20) {
      activities.value = activities.value.slice(0, 20);
    }
    const key = getStorageKey();
    localStorage.removeItem(`${key}_cleared`);
    localStorage.setItem(key, JSON.stringify(activities.value));
  };

  const clearActivities = () => {
    activities.value = [];
    const key = getStorageKey();
    localStorage.setItem(key, JSON.stringify([]));
    localStorage.setItem(`${key}_cleared`, 'true');
  };

  return {
    activities,
    loading,
    loadActivities,
    addActivity,
    clearActivities,
  };
});
