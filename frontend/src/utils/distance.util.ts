/**
 * Tính khoảng cách đường bộ ước tính (Haversine * hệ số uốn lượn đường sá đô thị VN ~1.25)
 */
export interface DistanceInfo {
  km: number;
  text: string;
  durationText: string;
  isWalking: boolean;
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): DistanceInfo {
  if (!lat1 || !lon1 || !lat2 || !lon2) {
    return { km: 0, text: '0 km', durationText: '~0 phút', isWalking: false };
  }

  const R = 6371; // Bán kính Trái Đất (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightDistance = R * c;

  // Hệ số uốn lượn thực tế đường phố đô thị Việt Nam (1.25x)
  const roadDistance = straightDistance * 1.25;

  const isWalking = roadDistance < 1.2;
  const kmFormatted =
    roadDistance < 1
      ? `${Math.round(roadDistance * 1000)} m`
      : `${roadDistance.toFixed(1)} km`;

  // Ước lượng thời gian di chuyển: Đi bộ ~4.5 km/h, xe máy/ô tô ~30 km/h trong phố
  let minutes = 0;
  if (isWalking) {
    minutes = Math.max(2, Math.round((roadDistance / 4.5) * 60));
  } else {
    minutes = Math.max(3, Math.round((roadDistance / 30) * 60));
  }

  return {
    km: Number(roadDistance.toFixed(1)),
    text: kmFormatted,
    durationText: `~${minutes} phút`,
    isWalking,
  };
}
