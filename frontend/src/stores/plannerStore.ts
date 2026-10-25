import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { TripDay, PlaceItem, PlaceCategory } from '@/types/planner.type';
import { placeService } from '@/services/place.service';

export const usePlannerStore = defineStore('planner', () => {
  const tripId = ref<string>('demo-trip-1');
  const tripTitle = ref<string>('Khám Phá Đà Nẵng - Hội An 4 Ngày 3 Đêm');
  const activePlaceId = ref<string | null>(null);
  const selectedDayNumber = ref<number | null>(1); // Default to Day 1

  // Mock initial days & places for testing UI & Map
  const days = ref<TripDay[]>([
    {
      id: 'day-1',
      tripId: 'demo-trip-1',
      dayNumber: 1,
      date: '2026-10-10',
      places: [
        {
          id: 'place-1',
          tripId: 'demo-trip-1',
          tripDayId: 'day-1',
          placeName: 'Sân Bay Quốc Tế Đà Nẵng',
          formattedAddress: 'Hòa Thuận Tây, Hải Châu, Đà Nẵng',
          latitude: 16.0439,
          longitude: 108.1994,
          thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Da_Nang_International_Airport%2C_Vietnam.jpg/1280px-Da_Nang_International_Airport%2C_Vietnam.jpg',
          category: 'TRANSPORT',
          startTime: '08:00',
          durationMinutes: 60,
          notes: 'Mã vé VN123 - Đón taxi về khách sạn',
          orderIndex: 1000,
        },
        {
          id: 'place-2',
          tripId: 'demo-trip-1',
          tripDayId: 'day-1',
          placeName: 'Cầu Rồng Đà Nẵng',
          formattedAddress: 'An Hải Tây, Sơn Trà, Đà Nẵng',
          latitude: 16.061,
          longitude: 108.2274,
          thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Dragon_Bridge%2C_Da_Nang_during_day_-_20230819_%28cropped%29.jpg/1280px-Dragon_Bridge%2C_Da_Nang_during_day_-_20230819_%28cropped%29.jpg',
          category: 'ATTRACTION',
          startTime: '10:00',
          durationMinutes: 90,
          notes: 'Check-in cầu rồng và chụp ảnh kỷ niệm',
          orderIndex: 2000,
        },
        {
          id: 'place-3',
          tripId: 'demo-trip-1',
          tripDayId: 'day-1',
          placeName: 'Mì Quảng Bà Mua',
          formattedAddress: '19 Trần Bình Trọng, Hải Châu, Đà Nẵng',
          latitude: 16.0658,
          longitude: 108.2195,
          thumbnailUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800',
          category: 'RESTAURANT',
          startTime: '12:00',
          durationMinutes: 60,
          notes: 'Thử mì quảng tôm thịt đặc sản',
          orderIndex: 3000,
        },
      ],
    },
    {
      id: 'day-2',
      tripId: 'demo-trip-1',
      dayNumber: 2,
      date: '2026-10-11',
      places: [
        {
          id: 'place-4',
          tripId: 'demo-trip-1',
          tripDayId: 'day-2',
          placeName: 'Bà Nà Hills - Cầu Vàng',
          formattedAddress: 'Hòa Ninh, Hòa Vang, Đà Nẵng',
          latitude: 15.9984,
          longitude: 107.988,
          thumbnailUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a5/The_Golden_Bridge%2C_Ba_Na_Hills%2C_Vietnam.jpg/1280px-The_Golden_Bridge%2C_Ba_Na_Hills%2C_Vietnam.jpg',
          category: 'ATTRACTION',
          startTime: '08:30',
          durationMinutes: 240,
          notes: 'Đặt mua vé cáp treo trước qua Klook',
          orderIndex: 1000,
        },
        {
          id: 'place-5',
          tripId: 'demo-trip-1',
          tripDayId: 'day-2',
          placeName: 'Biển Mỹ Khê',
          formattedAddress: 'Võ Nguyên Giáp, Phước Mỹ, Sơn Trà, Đà Nẵng',
          latitude: 16.0597,
          longitude: 108.2468,
          thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
          category: 'ATTRACTION',
          startTime: '16:00',
          durationMinutes: 120,
          notes: 'Tắm biển & ngắm hoàng hôn',
          orderIndex: 2000,
        },
      ],
    },
    {
      id: 'day-3',
      tripId: 'demo-trip-1',
      dayNumber: 3,
      date: '2026-10-12',
      places: [
        {
          id: 'place-6',
          tripId: 'demo-trip-1',
          tripDayId: 'day-3',
          placeName: 'Phố Cổ Hội An',
          formattedAddress: 'Minh An, Hội An, Quảng Nam',
          latitude: 15.8801,
          longitude: 108.338,
          thumbnailUrl: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800',
          category: 'ATTRACTION',
          startTime: '15:00',
          durationMinutes: 180,
          notes: 'Thả hoa đăng trên sông Hoài và đi dạo phố đèn lồng',
          orderIndex: 1000,
        },
      ],
    },
  ]);

  // Unassigned pool (Kho lưu tạm)
  const unassignedPlaces = ref<PlaceItem[]>([
    {
      id: 'place-un-1',
      tripId: 'demo-trip-1',
      tripDayId: null,
      placeName: 'Bán Đảo Sơn Trà & Chùa Linh Ứng',
      formattedAddress: 'Thọ Quang, Sơn Trà, Đà Nẵng',
      latitude: 16.1011,
      longitude: 108.2778,
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Son-Tra-Peninsula_Da-Nang_Vietnam_Linh-Ung-Pagoda-01.jpg/1280px-Son-Tra-Peninsula_Da-Nang_Vietnam_Linh-Ung-Pagoda-01.jpg',
      category: 'ATTRACTION',
      durationMinutes: 90,
      notes: 'Ghé ngắm tượng Phật Bà Chùa Linh Ứng',
      orderIndex: 1000,
    },
    {
      id: 'place-un-2',
      tripId: 'demo-trip-1',
      tripDayId: null,
      placeName: 'Chợ Đêm Sơn Trà',
      formattedAddress: 'Mai Hắc Đế, An Hải Trung, Sơn Trà, Đà Nẵng',
      latitude: 16.0622,
      longitude: 108.2295,
      thumbnailUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
      category: 'RESTAURANT',
      durationMinutes: 90,
      notes: 'Thưởng thức hải sản nướng chợ đêm',
      orderIndex: 2000,
    },
  ]);

  // Computed: Map markers list (Chỉ hiển thị địa điểm của Ngày được chọn)
  const allMapPlaces = computed(() => {
    const list: (PlaceItem & { dayNumber?: number; dayColor?: string })[] = [];
    const dayColors = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899'];

    const targetDays = selectedDayNumber.value !== null
      ? days.value.filter((d) => d.dayNumber === selectedDayNumber.value)
      : days.value;

    targetDays.forEach((day) => {
      const color = dayColors[(day.dayNumber - 1) % dayColors.length];
      day.places.forEach((place) => {
        list.push({
          ...place,
          dayNumber: day.dayNumber,
          dayColor: color,
        });
      });
    });

    return list;
  });

  // Calculate Fractional Index (A + B) / 2
  const calculateFractionalIndex = (prevIndex?: number, nextIndex?: number): number => {
    if (prevIndex !== undefined && nextIndex !== undefined) {
      return (prevIndex + nextIndex) / 2;
    }
    if (prevIndex !== undefined) {
      return prevIndex + 1000;
    }
    if (nextIndex !== undefined) {
      return nextIndex / 2;
    }
    return 1000;
  };

  // Actions
  const setActivePlace = (id: string | null) => {
    activePlaceId.value = id;
  };

  const addPlaceToDay = async (placeData: Omit<PlaceItem, 'id' | 'tripId' | 'orderIndex'>, dayId: string | null) => {
    const newId = `place-${Date.now()}`;

    if (dayId === null) {
      const prevOrder = unassignedPlaces.value.length > 0
        ? unassignedPlaces.value[unassignedPlaces.value.length - 1].orderIndex
        : 0;

      const newPlace: PlaceItem = {
        ...placeData,
        id: newId,
        tripId: tripId.value,
        tripDayId: null,
        orderIndex: prevOrder + 1000,
      };

      unassignedPlaces.value.push(newPlace);
    } else {
      const targetDay = days.value.find((d) => d.id === dayId);
      if (targetDay) {
        const prevOrder = targetDay.places.length > 0
          ? targetDay.places[targetDay.places.length - 1].orderIndex
          : 0;

        const newPlace: PlaceItem = {
          ...placeData,
          id: newId,
          tripId: tripId.value,
          tripDayId: dayId,
          orderIndex: prevOrder + 1000,
        };

        targetDay.places.push(newPlace);
      }
    }

    // Call API in background
    try {
      await placeService.addPlace(tripId.value, {
        ...placeData,
        tripDayId: dayId,
      });
    } catch {
      // Mock mode fallback
    }
  };

  const removePlace = async (id: string) => {
    days.value.forEach((day) => {
      day.places = day.places.filter((p) => p.id !== id);
    });
    unassignedPlaces.value = unassignedPlaces.value.filter((p) => p.id !== id);
    if (activePlaceId.value === id) {
      activePlaceId.value = null;
    }
    try {
      await placeService.deletePlace(id);
    } catch {
      // Mock mode fallback
    }
  };

  const updatePlace = async (placeId: string, updates: Partial<PlaceItem>) => {
    for (const day of days.value) {
      const item = day.places.find((p) => p.id === placeId);
      if (item) {
        Object.assign(item, updates);
        break;
      }
    }
    const unassignedItem = unassignedPlaces.value.find((p) => p.id === placeId);
    if (unassignedItem) {
      Object.assign(unassignedItem, updates);
    }

    try {
      await placeService.updatePlace(placeId, updates);
    } catch {
      // Mock mode fallback
    }
  };

  // Reorder single item with O(1) Fractional Indexing
  const reorderPlaceItem = async (
    item: PlaceItem,
    targetDayId: string | null,
    prevOrder: number | null,
    nextOrder: number | null
  ) => {
    // 1. Optimistic UI update
    const newOrderIndex = calculateFractionalIndex(
      prevOrder !== null ? prevOrder : undefined,
      nextOrder !== null ? nextOrder : undefined
    );
    item.orderIndex = newOrderIndex;
    item.tripDayId = targetDayId;

    // 2. Call backend in background
    try {
      await placeService.reorderPlace(item.id, {
        target_day_id: targetDayId,
        prev_order_index: prevOrder,
        next_order_index: nextOrder,
      });
    } catch {
      // Mock mode fallback
    }
  };

  // ─── Wanderlog Place Detail Flyout Drawer State ─────────────────────────────
  const selectedDetailPlace = ref<PlaceItem | null>(null);
  const isDetailDrawerOpen = ref(false);

  const openPlaceDetail = (place: PlaceItem) => {
    selectedDetailPlace.value = place;
    isDetailDrawerOpen.value = true;
    setActivePlace(place.id);

    // Tự động chuyển ngày trên bản đồ nếu địa điểm thuộc một ngày cụ thể
    if (place.tripDayId) {
      const targetDay = days.value.find((d) => d.id === place.tripDayId);
      if (targetDay) {
        selectedDayNumber.value = targetDay.dayNumber;
      }
    }
  };

  const closePlaceDetail = () => {
    isDetailDrawerOpen.value = false;
  };

  const selectDay = (dayNum: number | null) => {
    selectedDayNumber.value = dayNum;
  };

  return {
    tripId,
    tripTitle,
    days,
    unassignedPlaces,
    activePlaceId,
    selectedDayNumber,
    allMapPlaces,
    selectedDetailPlace,
    isDetailDrawerOpen,
    setActivePlace,
    selectDay,
    openPlaceDetail,
    closePlaceDetail,
    addPlaceToDay,
    updatePlace,
    removePlace,
    reorderPlaceItem,
    calculateFractionalIndex,
  };
});
