import axios from 'axios';
import type { SearchPlaceResult, PlaceCategory, PlaceItem } from '@/types/planner.type';

const FSQ_API_KEY = import.meta.env.VITE_FOURSQUARE_API_KEY || '';

// Curated high-res destinations for Da Nang & Hoi An (Wanderlog Quality)
const DA_NANG_CURATED_PLACES: (Partial<PlaceItem> & { keywords: string[] })[] = [
  {
    placeName: 'Bà Nà Hills - Cầu Vàng',
    formattedAddress: 'Hòa Ninh, Hòa Vang, Đà Nẵng',
    latitude: 15.9984,
    longitude: 107.988,
    category: 'ATTRACTION',
    rating: 4.8,
    reviewCount: 3820,
    openNow: true,
    hoursDescription: '07:30 - 21:00 hàng ngày',
    description: 'Quần thể du lịch nghỉ dưỡng trên đỉnh núi Chúa ở độ cao 1.487m. Điểm nhấn nổi tiếng toàn cầu là Cầu Vàng (Golden Bridge) được nâng đỡ bởi hai bàn tay khổng lồ phủ rêu phong giữa mây ngàn.',
    photos: [
      'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800',
      'https://images.unsplash.com/photo-1528127269322-539801943592?w=800',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    ],
    tips: [
      'Nên đặt vé cáp treo online trước qua Klook để không phải xếp hàng ở quầy vé.',
      'Lên Cầu Vàng vào sáng sớm (trước 8:30) hoặc sau 16:30 để chụp ảnh vắng người và ngắm sương mù tuyệt đẹp.',
      'Khí hậu trên đỉnh se lạnh quanh năm, nhớ mang theo áo khoác mỏng.',
    ],
    phoneNumber: '+84 236 3791 999',
    website: 'https://banahills.sunworld.vn',
    keywords: ['bà nà', 'ba na', 'cầu vàng', 'golden bridge', 'hills'],
  },
  {
    placeName: 'Cầu Rồng Đà Nẵng',
    formattedAddress: 'Đường Nguyễn Văn Linh, Phước Ninh, Hải Châu, Đà Nẵng',
    latitude: 16.061,
    longitude: 108.2274,
    category: 'ATTRACTION',
    rating: 4.7,
    reviewCount: 2940,
    openNow: true,
    hoursDescription: 'Mở cửa cả ngày (Phun lửa 21:00 Thứ 7 & CN)',
    description: 'Biểu tượng hiện đại của thành phố Đà Nẵng mô phỏng con rồng thời Lý vươn mình ra biển lớn. Cây cầu dài 666m bắc qua sông Hàn, có khả năng phun lửa và phun nước đặc sắc vào tối cuối tuần.',
    photos: [
      'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800',
      'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800',
    ],
    tips: [
      'Màn phun lửa và phun nước diễn ra vào đúng 21:00 mỗi tối Thứ 7 và Chủ Nhật.',
      'Đứng ở phía đầu rồng (đường Trần Hưng Đạo) hoặc ngồi du thuyền trên sông Hàn sẽ có góc nhìn đẹp nhất.',
      'Tránh đứng quá sát đầu rồng lúc phun nước vì có thể bị ướt áo.',
    ],
    website: 'https://danangfantasticity.com',
    keywords: ['cầu rồng', 'dragon bridge', 'rồng', 'sông hàn'],
  },
  {
    placeName: 'Biển Mỹ Khê',
    formattedAddress: 'Võ Nguyên Giáp, Phước Mỹ, Sơn Trà, Đà Nẵng',
    latitude: 16.0597,
    longitude: 108.2468,
    category: 'ATTRACTION',
    rating: 4.9,
    reviewCount: 5210,
    openNow: true,
    hoursDescription: 'Mở cửa tự do 24/7 (Cứu hộ trực 05:00 - 18:30)',
    description: 'Một trong sáu bãi biển quyến rũ nhất hành tinh do tạp chí Forbes bình chọn. Bờ cát trắng mịn trải dài gần 10km, sóng biển êm ả, nước trong xanh và hàng dừa thơ mộng.',
    photos: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
      'https://images.unsplash.com/photo-1542296332-2e4473faf563?w=800',
    ],
    tips: [
      'Thời điểm tắm biển lý tưởng nhất là từ 05:30 - 07:30 sáng ngắm bình minh và 16:30 - 18:00 chiều.',
      'Dọc đường Võ Nguyên Giáp có rất nhiều quán nước dừa tươi và nhà hàng hải sản tươi sống.',
      'Có dịch vụ lướt sóng, dù lượn và motor nước tại khu vực bãi tắm số 1-2-3.',
    ],
    keywords: ['mỹ khê', 'my khe', 'biển', 'beach', 'tắm biển'],
  },
  {
    placeName: 'Chợ Đêm Sơn Trà',
    formattedAddress: 'Mai Hắc Đế, An Hải Trung, Sơn Trà, Đà Nẵng',
    latitude: 16.0622,
    longitude: 108.2295,
    category: 'RESTAURANT',
    rating: 4.5,
    reviewCount: 1830,
    openNow: true,
    hoursDescription: '17:30 - 24:00 hàng ngày',
    description: 'Khu chợ đêm sầm uất ngay sát chân Cầu Rồng, quy tụ hơn 150 gian hàng ẩm thực đường phố, hải sản nướng mỡ hành, đồ lưu niệm và các hoạt động biểu diễn nghệ thuật.',
    photos: [
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
      'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800',
    ],
    tips: [
      'Nên thử: Tôm hùm baby nướng phô mai, mực một nắng, bánh tráng nướng và kem dừa Mã Lai.',
      'Nên ghé ăn uống lúc 19:30 rồi đi bộ sang Cầu Rồng xem phun lửa lúc 21:00 rất tiện lộ trình.',
    ],
    keywords: ['chợ đêm', 'son tra', 'night market', 'hải sản', 'ăn đêm'],
  },
  {
    placeName: 'Phố Cổ Hội An',
    formattedAddress: 'Minh An, TP. Hội An, Quảng Nam',
    latitude: 15.8801,
    longitude: 108.338,
    category: 'ATTRACTION',
    rating: 4.9,
    reviewCount: 6890,
    openNow: true,
    hoursDescription: 'Phố đi bộ bật đèn lồng: 17:00 - 22:00',
    description: 'Di sản Văn hóa Thế giới UNESCO với nét kiến trúc cổ kính giao thoa giữa Việt Nam, Nhật Bản và Trung Hoa. Nổi bật với những ngôi nhà sơn vàng cổ kính, giàn hoa giấy rực rỡ và lung linh đèn lồng bên sông Hoài.',
    photos: [
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
      'https://images.unsplash.com/photo-1528127269322-539801943592?w=800',
    ],
    tips: [
      'Trải nghiệm không thể bỏ qua: Đi thuyền thả hoa đăng trên sông Hoài lúc chạng vạng tối.',
      'Thưởng thức đặc sản: Cao lầu Bà Bé, Cơm gà Bà Buội, Bánh mì Phượng hoặc Bánh mì Madam Khánh.',
      'Thuê xe đạp hoặc đi bộ thong thả trong phố cổ rất yên bình.',
    ],
    keywords: ['hội an', 'hoi an', 'phố cổ', 'ancient town', 'đèn lồng'],
  },
  {
    placeName: 'Bán Đảo Sơn Trà & Chùa Linh Ứng',
    formattedAddress: 'Hoàng Sa, Thọ Quang, Sơn Trà, Đà Nẵng',
    latitude: 16.1011,
    longitude: 108.2778,
    category: 'ATTRACTION',
    rating: 4.8,
    reviewCount: 3100,
    openNow: true,
    hoursDescription: '06:00 - 20:00 (Vào cửa miễn phí)',
    description: '"Lá phổi xanh" của Đà Nẵng sở hữu bức tượng Phật Bà Quan Âm cao 67m hướng mắt ra biển Đông. Nơi đây có hệ sinh thái đa dạng, là nơi cư trú của loài Voọc chà và chân nâu quý hiếm.',
    photos: [
      'https://images.unsplash.com/photo-1528127269322-539801943592?w=800',
      'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800',
    ],
    tips: [
      'Trang phục cần kín đáo lịch sự khi vào chánh điện Chùa Linh Ứng.',
      'Đường lên bán đảo có những khúc cua tuyệt đẹp nhưng dốc, nên đi xe số hoặc thuê taxi nếu tay lái yếu.',
      'Buổi chiều khoảng 16:00 dễ bắt gặp các đàn Voọc chà vá chuyền cành kiếm ăn.',
    ],
    keywords: ['sơn trà', 'chùa linh ứng', 'son tra', 'linh ung', 'phật bà'],
  },
  {
    placeName: 'Mì Quảng Bà Mua',
    formattedAddress: '19 Trần Bình Trọng, Hải Châu, Đà Nẵng',
    latitude: 16.0658,
    longitude: 108.2195,
    category: 'RESTAURANT',
    rating: 4.6,
    reviewCount: 1450,
    openNow: true,
    hoursDescription: '06:30 - 22:00',
    description: 'Thương hiệu ẩm thực truyền thống nức tiếng miền Trung. Sợi mì dẻo dai làm từ bột gạo, nước dùng đậm đà nấu từ xương, tôm, thịt heo và ăn kèm bánh tráng nướng giòn rụm cùng rau sống 9 vị.',
    photos: [
      'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800',
    ],
    tips: [
      'Gọi tô thập cẩm (tôm, thịt, gà, trứng cút) để nếm trọn hương vị đặc sắc nhất.',
      'Ăn kèm ớt xanh cay nồng và vắt chút chanh tươi theo đúng điệu người bản địa.',
    ],
    phoneNumber: '+84 985 000 075',
    keywords: ['mì quảng', 'bà mua', 'mi quang', 'quán ăn', 'đặc sản'],
  },
];

export const foursquareService = {
  // 1. Smart Search (Foursquare API with Fallback)
  async searchPlaces(query: string, signal?: AbortSignal): Promise<SearchPlaceResult[]> {
    if (!query.trim()) return [];

    // If Foursquare API Key is present, call real Foursquare v3 API
    if (FSQ_API_KEY && FSQ_API_KEY.startsWith('fsq3')) {
      try {
        const response = await axios.get('https://api.foursquare.com/v3/places/search', {
          params: {
            query: query.trim(),
            near: 'Da Nang, Vietnam',
            radius: 30000,
            limit: 8,
            fields: 'fsq_id,name,location,categories,geocodes,rating,photos,description',
          },
          headers: {
            Authorization: FSQ_API_KEY,
            Accept: 'application/json',
          },
          signal,
        });

        const results = response.data?.results || [];
        return results.map((item: any) => {
          let photoUrl = 'https://images.unsplash.com/photo-1528127269322-539801943592?w=400';
          if (item.photos && item.photos.length > 0) {
            const p = item.photos[0];
            photoUrl = `${p.prefix}400x300${p.suffix}`;
          }

          let cat: PlaceCategory = 'OTHER';
          const catName = item.categories?.[0]?.name?.toLowerCase() || '';
          if (catName.includes('restaurant') || catName.includes('food') || catName.includes('cafe')) {
            cat = 'RESTAURANT';
          } else if (catName.includes('hotel') || catName.includes('resort')) {
            cat = 'HOTEL';
          } else if (catName.includes('attraction') || catName.includes('park') || catName.includes('historic')) {
            cat = 'ATTRACTION';
          }

          return {
            id: `fsq-${item.fsq_id}`,
            fsqId: item.fsq_id,
            placeName: item.name,
            formattedAddress: item.location?.formatted_address || item.location?.address || 'Đà Nẵng, Việt Nam',
            latitude: item.geocodes?.main?.latitude || 16.06,
            longitude: item.geocodes?.main?.longitude || 108.22,
            thumbnailUrl: photoUrl,
            category: cat,
            rating: item.rating ? Number((item.rating / 2).toFixed(1)) : 4.5,
            description: item.description,
          };
        });
      } catch (err: any) {
        if (axios.isCancel(err) || err.name === 'CanceledError') throw err;
        console.warn('Foursquare live search failed, falling back to curated POI database');
      }
    }

    // High quality Curated Fallback Search
    const qLower = query.toLowerCase();
    const matched = DA_NANG_CURATED_PLACES.filter((p) => {
      return (
        p.placeName?.toLowerCase().includes(qLower) ||
        p.formattedAddress?.toLowerCase().includes(qLower) ||
        p.keywords.some((kw) => kw.includes(qLower) || qLower.includes(kw))
      );
    });

    if (matched.length > 0) {
      return matched.map((item, idx) => ({
        id: `curated-${idx}-${Date.now()}`,
        placeName: item.placeName || '',
        formattedAddress: item.formattedAddress || '',
        latitude: item.latitude || 16.06,
        longitude: item.longitude || 108.22,
        thumbnailUrl: item.photos?.[0] || 'https://images.unsplash.com/photo-1528127269322-539801943592?w=400',
        category: item.category || 'ATTRACTION',
        rating: item.rating || 4.7,
        description: item.description,
      }));
    }

    // Default dynamic result if nothing matches
    return [
      {
        id: `search-dyn-${Date.now()}-1`,
        placeName: `${query} - Đà Nẵng`,
        formattedAddress: 'Hải Châu, TP. Đà Nẵng',
        latitude: 16.06,
        longitude: 108.22,
        thumbnailUrl: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=400',
        category: 'ATTRACTION',
        rating: 4.6,
        description: `Điểm đến nổi tiếng tại Đà Nẵng phù hợp cho lịch trình du lịch.`,
      },
      {
        id: `search-dyn-${Date.now()}-2`,
        placeName: `Ẩm Thực Đặc Sản (${query})`,
        formattedAddress: 'Sơn Trà, TP. Đà Nẵng',
        latitude: 16.065,
        longitude: 108.235,
        thumbnailUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400',
        category: 'RESTAURANT',
        rating: 4.5,
        description: `Quán ăn phục vụ đặc sản miền Trung được du khách yêu thích.`,
      },
    ];
  },

  // 2. Fetch Place Rich Details (Photos, Reviews, Tips, Hours)
  async getPlaceDetails(place: PlaceItem): Promise<Partial<PlaceItem>> {
    // If fsqId exists and API key is valid, fetch live photos and tips
    if (FSQ_API_KEY && FSQ_API_KEY.startsWith('fsq3') && place.fsqId) {
      try {
        const [detailsRes, photosRes, tipsRes] = await Promise.allSettled([
          axios.get(`https://api.foursquare.com/v3/places/${place.fsqId}`, {
            headers: { Authorization: FSQ_API_KEY, Accept: 'application/json' },
            params: { fields: 'rating,hours,description,tel,website,price' },
          }),
          axios.get(`https://api.foursquare.com/v3/places/${place.fsqId}/photos`, {
            headers: { Authorization: FSQ_API_KEY, Accept: 'application/json' },
            params: { limit: 6 },
          }),
          axios.get(`https://api.foursquare.com/v3/places/${place.fsqId}/tips`, {
            headers: { Authorization: FSQ_API_KEY, Accept: 'application/json' },
            params: { limit: 4 },
          }),
        ]);

        const details = detailsRes.status === 'fulfilled' ? detailsRes.value.data : {};
        const photosData = photosRes.status === 'fulfilled' ? photosRes.value.data : [];
        const tipsData = tipsRes.status === 'fulfilled' ? tipsRes.value.data : [];

        const photos: string[] = photosData.map((p: any) => `${p.prefix}original${p.suffix}`);
        const tips: string[] = tipsData.map((t: any) => t.text);

        return {
          rating: details.rating ? Number((details.rating / 2).toFixed(1)) : place.rating || 4.7,
          openNow: details.hours?.open_now,
          hoursDescription: details.hours?.display || '08:00 - 22:00 hàng ngày',
          description: details.description || place.description,
          phoneNumber: details.tel,
          website: details.website,
          photos: photos.length > 0 ? photos : place.photos,
          tips: tips.length > 0 ? tips : place.tips,
        };
      } catch (err) {
        console.warn('Error fetching Foursquare details:', err);
      }
    }

    // Match with curated database
    const matched = DA_NANG_CURATED_PLACES.find(
      (c) =>
        c.placeName?.toLowerCase().includes(place.placeName.toLowerCase()) ||
        place.placeName.toLowerCase().includes(c.placeName?.toLowerCase() || '')
    );

    if (matched) {
      return {
        rating: matched.rating,
        reviewCount: matched.reviewCount,
        openNow: matched.openNow,
        hoursDescription: matched.hoursDescription,
        description: matched.description,
        photos: matched.photos,
        tips: matched.tips,
        phoneNumber: matched.phoneNumber,
        website: matched.website,
      };
    }

    // Fallback default rich metadata
    return {
      rating: place.rating || 4.7,
      reviewCount: place.reviewCount || 1280,
      openNow: true,
      hoursDescription: '07:30 - 21:30 hàng ngày',
      description: place.description || `${place.placeName} là địa điểm tham quan trải nghiệm nổi bật được nhiều du khách lựa chọn trong hành trình khám phá Đà Nẵng - Hội An.`,
      photos: place.photos || [
        place.thumbnailUrl || 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800',
        'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800',
      ],
      tips: [
        'Nên đi vào buổi sáng hoặc lúc hoàng hôn để có những bức hình check-in đẹp nhất.',
        'Gần khu vực này có nhiều bãi đỗ xe và trạm đón trả khách du lịch thuận tiện.',
      ],
    };
  },
};
