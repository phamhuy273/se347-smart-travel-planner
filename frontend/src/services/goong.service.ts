import axios from 'axios';
import type { SearchPlaceResult, PlaceCategory, PlaceItem } from '@/types/planner.type';

// Goong API Key (Lấy miễn phí tại account.goong.io)
const GOONG_API_KEY = import.meta.env.VITE_GOONG_API_KEY || '';
const FSQ_API_KEY = import.meta.env.VITE_FOURSQUARE_API_KEY || '';

// Accent-insensitive Vietnamese Normalizer
export function removeVietnameseTones(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

// Category-based Photography Collections (Unsplash High-Res)
export const CATEGORY_STOCK_PHOTOS: Record<PlaceCategory, string[]> = {
  ATTRACTION: [
    'https://images.unsplash.com/photo-1528127269322-539801943592?w=800',
    'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
  ],
  RESTAURANT: [
    'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
  ],
  HOTEL: [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
    'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800',
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
  ],
  TRANSPORT: [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Da_Nang_International_Airport%2C_Vietnam.jpg/1280px-Da_Nang_International_Airport%2C_Vietnam.jpg',
    'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800',
  ],
  FOOD: [
    'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
  ],
  SIGHTSEEING: [
    'https://images.unsplash.com/photo-1528127269322-539801943592?w=800',
  ],
  OTHER: [
    'https://images.unsplash.com/photo-1528127269322-539801943592?w=800',
  ],
};

// Curated high-res destinations for Da Nang & Central VN (Wanderlog Quality)
export const DA_NANG_CURATED_PLACES: (Partial<PlaceItem> & { keywords: string[] })[] = [
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
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a5/The_Golden_Bridge%2C_Ba_Na_Hills%2C_Vietnam.jpg/1280px-The_Golden_Bridge%2C_Ba_Na_Hills%2C_Vietnam.jpg',
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/28/Panoramic_View.jpg/1280px-Panoramic_View.jpg',
    ],
    tips: [
      'Nên đặt vé cáp treo online trước để không phải xếp hàng ở quầy vé.',
      'Lên Cầu Vàng vào sáng sớm (trước 8:30) hoặc sau 16:30 để chụp ảnh vắng người và ngắm sương mù tuyệt đẹp.',
      'Khí hậu trên đỉnh se lạnh quanh năm, nhớ mang theo áo khoác mỏng.',
    ],
    phoneNumber: '+84 236 3791 999',
    website: 'https://banahills.sunworld.vn',
    keywords: ['bà nà', 'ba na', 'cầu vàng', 'golden bridge', 'hills', 'sun world'],
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
      'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Dragon_Bridge%2C_Da_Nang_during_day_-_20230819_%28cropped%29.jpg/1280px-Dragon_Bridge%2C_Da_Nang_during_day_-_20230819_%28cropped%29.jpg',
      'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800',
    ],
    tips: [
      'Màn phun lửa và phun nước diễn ra vào đúng 21:00 mỗi tối Thứ 7 và Chủ Nhật.',
      'Đứng ở phía đầu rồng (đường Trần Hưng Đạo) hoặc ngồi du thuyền trên sông Hàn sẽ có góc nhìn đẹp nhất.',
      'Tránh đứng quá sát đầu rồng lúc phun nước vì có thể bị ướt áo.',
    ],
    website: 'https://danangfantasticity.com',
    keywords: ['cầu rồng', 'dragon bridge', 'rồng', 'sông hàn', 'phun lửa'],
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
      'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800',
    ],
    tips: [
      'Thời điểm tắm biển lý tưởng nhất là từ 05:30 - 07:30 sáng ngắm bình minh và 16:30 - 18:00 chiều.',
      'Dọc đường Võ Nguyên Giáp có rất nhiều quán nước dừa tươi và nhà hàng hải sản tươi sống.',
      'Có dịch vụ lướt sóng, dù lượn và motor nước tại khu vực bãi tắm số 1-2-3.',
    ],
    keywords: ['mỹ khê', 'my khe', 'biển', 'beach', 'tắm biển', 'bãi tắm'],
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
      'https://images.unsplash.com/photo-1528127269322-539801943592?w=800',
      'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800',
    ],
    tips: [
      'Trải nghiệm không thể bỏ qua: Đi thuyền thả hoa đăng trên sông Hoài lúc chạng vạng tối.',
      'Thưởng thức đặc sản: Cao lầu Bá Lễ, Cơm gà Bà Buội, Bánh mì Phượng hoặc Madam Khánh.',
      'Thuê xe đạp hoặc đi bộ thong thả trong phố cổ rất yên bình.',
    ],
    keywords: ['hội an', 'hoi an', 'phố cổ', 'ancient town', 'đèn lồng', 'chùa cầu'],
  },
  {
    placeName: 'Sân Bay Quốc Tế Đà Nẵng',
    formattedAddress: 'Hòa Thuận Tây, Hải Châu, Đà Nẵng',
    latitude: 16.0439,
    longitude: 108.1994,
    category: 'TRANSPORT',
    rating: 4.6,
    reviewCount: 3100,
    openNow: true,
    hoursDescription: 'Hoạt động 24/7',
    description: 'Cảng hàng không quốc tế lớn nhất miền Trung - Tây Nguyên và lớn thứ 3 Việt Nam. Sân bay hiện đại, sạch sẽ và nằm chỉ cách trung tâm thành phố Đà Nẵng khoảng 3km rất thuận tiện cho du khách.',
    photos: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Da_Nang_International_Airport%2C_Vietnam.jpg/1280px-Da_Nang_International_Airport%2C_Vietnam.jpg',
      'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800',
    ],
    tips: [
      'Có làn đón xe taxi và xe công nghệ (Grab, Xanh SM) ngay tại sảnh ra rất tiện.',
      'Ga quốc nội T1 và ga quốc tế T2 kết nối với nhau bằng lối đi bộ có mái che.',
    ],
    keywords: ['sân bay', 'airport', 'đà nẵng', 'danang airport', 'cảng hàng không'],
  },
  {
    placeName: 'Bán Đảo Sơn Trà & Chùa Linh Ứng',
    formattedAddress: 'Bãi Bụt, Thọ Quang, Sơn Trà, Đà Nẵng',
    latitude: 16.1011,
    longitude: 108.2778,
    category: 'ATTRACTION',
    rating: 4.9,
    reviewCount: 4500,
    openNow: true,
    hoursDescription: '06:00 - 21:00 hàng ngày',
    description: 'Ngôi chùa linh thiêng lớn nhất Đà Nẵng tọa lạc trên lưng chừng bán đảo Sơn Trà. Nổi tiếng với tượng Phật Bà Quan Thế Âm cao 67m hướng mắt ra biển đông và khuôn viên thanh tịnh ngắm trọn toàn cảnh vịnh Đà Nẵng.',
    photos: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Son-Tra-Peninsula_Da-Nang_Vietnam_Linh-Ung-Pagoda-01.jpg/1280px-Son-Tra-Peninsula_Da-Nang_Vietnam_Linh-Ung-Pagoda-01.jpg',
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/28/Panoramic_View.jpg/1280px-Panoramic_View.jpg',
    ],
    tips: [
      'Trang phục lịch sự, kín đáo khi vào chiêm bái chánh điện.',
      'Đường lên bán đảo có nhiều đoạn ngắm cảnh vịnh biển tuyệt đẹp, nên đi xe số hoặc thuê taxi nếu tay lái chưa vững.',
    ],
    keywords: ['chùa linh ứng', 'linh ứng', 'sơn trà', 'bán đảo', 'phật bà'],
  },
  {
    placeName: 'Mì Quảng Bà Mua',
    formattedAddress: '19 Trần Bình Trọng, Hải Châu, Đà Nẵng',
    latitude: 16.0658,
    longitude: 108.2195,
    category: 'RESTAURANT',
    rating: 4.6,
    reviewCount: 1980,
    openNow: true,
    hoursDescription: '06:30 - 22:00 hàng ngày',
    description: 'Hệ thống mì Quảng trứ danh hàng đầu xứ Quảng - Đà Thành. Sợi mì dai mềm vàng ươm nghệ, nước lèo đậm đà nấu từ xương, tôm, thịt hoặc gà ta, ăn kèm rau sống hoa chuối tươi non và bánh tráng mè nướng giòn rụm.',
    photos: [
      'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
    ],
    tips: [
      'Món nổi bật: Mì Quảng gà, mì Quảng tôm thịt hoặc mì lươn đặc biệt.',
      'Nhớ bẻ nhỏ bánh tráng nướng vào tô rồi trộn đều với ớt xanh và chanh.',
    ],
    keywords: ['mì quảng', 'bà mua', 'mi quang', 'đặc sản đà nẵng'],
  },
  {
    placeName: 'Bánh Xèo Bà Dưỡng',
    formattedAddress: 'K280/23 Hoàng Diệu, Bình Hiên, Hải Châu, Đà Nẵng',
    latitude: 16.0588,
    longitude: 108.216,
    category: 'RESTAURANT',
    rating: 4.7,
    reviewCount: 2950,
    openNow: true,
    hoursDescription: '09:00 - 21:30 hàng ngày',
    description: 'Thương hiệu bánh xèo trứ danh hơn 30 năm tuổi của Đà Nẵng. Bánh được đổ giòn rụm bên ngoài, béo ngọt nhân tôm thịt tươi ngon bên trong, ăn kèm nem lụi nướng sả và nước chấm gan heo đậu phộng đặc chế gia truyền.',
    photos: [
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
      'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800',
    ],
    tips: [
      'Nước chấm gan bùi béo là linh hồn của quán, nhớ gọi thêm nem lụi để cuốn chung.',
      'Quán nằm trong kiệt 280 Hoàng Diệu nhưng có bảng chỉ dẫn rõ ràng.',
    ],
    phoneNumber: '+84 236 3873 168',
    keywords: ['bánh xèo', 'bà dưỡng', 'banh xeo', 'ba duong', 'nem lụi', 'đặc sản'],
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
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
    ],
    tips: [
      'Nên thử: Tôm hùm baby nướng phô mai, mực một nắng, bánh tráng nướng và kem dừa Mã Lai.',
      'Nên ghé ăn uống lúc 19:30 rồi đi bộ sang Cầu Rồng xem phun lửa lúc 21:00 rất tiện lộ trình.',
    ],
    keywords: ['chợ đêm', 'son tra', 'night market', 'hải sản', 'ăn đêm'],
  },
  {
    placeName: 'Novotel Danang Premier Han River',
    formattedAddress: '36 Bạch Đằng, Thạch Thang, Hải Châu, Đà Nẵng',
    latitude: 16.0774,
    longitude: 108.2235,
    category: 'HOTEL',
    rating: 4.8,
    reviewCount: 1680,
    openNow: true,
    hoursDescription: 'Lễ tân phục vụ 24/24',
    description: 'Khách sạn đẳng cấp 5 sao quốc tế tọa lạc bên bờ tây sông Hàn thơ mộng. Sở hữu SKY36 - quán bar rooftop cao nhất miền Trung với góc nhìn panorama toàn cảnh thành phố.',
    photos: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800',
    ],
    tips: [
      'Nên đặt phòng tầng cao hướng sông để ngắm cầu quay Sông Hàn và pháo hoa rực rỡ.',
      'Ghé SKY36 sau 21:00 để thưởng thức cocktail và âm nhạc sôi động.',
    ],
    phoneNumber: '+84 236 3929 999',
    website: 'https://novotel-danang-premier.com',
    keywords: ['novotel', 'khách sạn', 'hotel', 'sky36', 'bạch đằng', '5 sao'],
  },
  {
    placeName: 'Bánh Mì Phượng Hội An',
    formattedAddress: '2B Phan Chu Trinh, Cẩm Châu, Hội An, Quảng Nam',
    latitude: 15.8795,
    longitude: 108.332,
    category: 'RESTAURANT',
    rating: 4.8,
    reviewCount: 5420,
    openNow: true,
    hoursDescription: '06:30 - 21:30 hàng ngày',
    description: 'Tiệm bánh mì trứ danh từng được đầu bếp huyền thoại Anthony Bourdain ca ngợi là "bản hòa tấu hương vị trong một ổ bánh mì". Vỏ bánh giòn xốp kết hợp patê thơm lừng, thịt nướng, jambon và nước sốt độc quyền.',
    photos: [
      'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=800',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
    ],
    tips: [
      'Nên gọi ổ "Thập cẩm đặc biệt" để nếm đủ các loại nhân.',
      'Quán khá đông khách vào giờ trưa và 17:00, bạn có thể mua mang về ra bờ sông Hoài thưởng thức.',
    ],
    phoneNumber: '+84 905 904 859',
    keywords: ['bánh mì phượng', 'banh mi phuong', 'hội an', 'bánh mì', 'đặc sản'],
  },
];

// Helper to determine category from Goong/OSM types or place name
export function inferCategory(types?: string[], name?: string, address?: string): PlaceCategory {
  const t = (types || []).map((x) => x.toLowerCase());
  const text = `${name || ''} ${address || ''}`.toLowerCase();

  if (t.some((x) => ['lodging', 'hotel', 'resort', 'motel', 'guest_house', 'hostel'].includes(x))) return 'HOTEL';
  if (t.some((x) => ['restaurant', 'cafe', 'bar', 'food', 'bakery', 'meal_takeaway'].includes(x))) return 'RESTAURANT';
  if (t.some((x) => ['tourist_attraction', 'museum', 'point_of_interest', 'park', 'amusement_park', 'historic'].includes(x))) return 'ATTRACTION';
  if (t.some((x) => ['transit_station', 'airport', 'bus_station', 'subway_station'].includes(x))) return 'TRANSPORT';

  if (text.includes('hotel') || text.includes('khách sạn') || text.includes('resort') || text.includes('homestay') || text.includes('villa')) return 'HOTEL';
  if (text.includes('quán') || text.includes('cà phê') || text.includes('cafe') || text.includes('coffee') || text.includes('nhà hàng') || text.includes('ăn') || text.includes('bánh') || text.includes('phở') || text.includes('bún') || text.includes('cơm') || text.includes('hải sản') || text.includes('lẩu') || text.includes('nướng')) return 'RESTAURANT';
  if (text.includes('chùa') || text.includes('cầu') || text.includes('biển') || text.includes('bãi') || text.includes('núi') || text.includes('bảo tàng') || text.includes('công viên') || text.includes('đảo') || text.includes('chợ') || text.includes('di tích') || text.includes('thác') || text.includes('đồi')) return 'ATTRACTION';

  return 'OTHER';
}

function getRandomCategoryPhoto(category: PlaceCategory, seed: number): string {
  const pool = CATEGORY_STOCK_PHOTOS[category] || CATEGORY_STOCK_PHOTOS.OTHER;
  return pool[seed % pool.length];
}

// Memory cache for Goong Place Details to avoid repeat API hits
const placeDetailCache = new Map<string, Partial<PlaceItem>>();

/**
 * Lấy mô tả chi tiết bài viết và hình ảnh từ Wikipedia tiếng Việt (Miễn phí, chuẩn 100%)
 */
async function fetchWikipediaSummary(placeName: string): Promise<{
  extract?: string;
  photoUrl?: string;
  pageUrl?: string;
} | null> {
  if (!placeName || placeName.trim().length < 2) return null;

  try {
    // 1. Tinh chỉnh từ khoá tìm kiếm: bỏ các tiền tố hành chính và hậu tố để tăng độ chính xác
    const cleanName = placeName
      .replace(/\s*-\s*.*$/, '')
      .replace(/\s*\(.*\)$/, '')
      .replace(/^(khu du lịch|quần thể|kdl|thành phố|tp\.|tỉnh|chùa|bãi biển|cầu|chợ|bảo tàng|di tích|núi|bán đảo|sân bay)\s+/i, '')
      .trim();

    let searchUrl = `https://vi.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
      cleanName || placeName
    )}&utf8=&format=json&origin=*`;

    let searchRes = await axios.get(searchUrl, { timeout: 3500 });
    let hits = searchRes.data?.query?.search || [];

    if (hits.length === 0 && cleanName !== placeName) {
      searchUrl = `https://vi.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
        placeName
      )}&utf8=&format=json&origin=*`;
      searchRes = await axios.get(searchUrl, { timeout: 3500 });
      hits = searchRes.data?.query?.search || [];
    }

    if (hits.length === 0) return null;

    const bestTitle = hits[0].title;

    // 2. Lấy tóm tắt chính thức từ Wikipedia REST API
    const summaryUrl = `https://vi.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
      bestTitle.replace(/\s+/g, '_')
    )}`;
    const summaryRes = await axios.get(summaryUrl, { timeout: 3500 });
    const data = summaryRes.data;

    if (data && (data.extract || data.thumbnail?.source || data.originalimage?.source)) {
      let photo = data.originalimage?.source || data.thumbnail?.source;
      if (photo && photo.toLowerCase().endsWith('.svg')) {
        photo = data.thumbnail?.source;
      }
      return {
        extract: data.extract,
        photoUrl: photo,
        pageUrl: data.content_urls?.desktop?.page,
      };
    }
  } catch (err: any) {
    // Không làm gián đoạn nếu lỗi mạng wikipedia
  }
  return null;
}

function generateSmartTips(category: PlaceCategory, _name: string): string[] {
  switch (category) {
    case 'RESTAURANT':
      return [
        'Nên ghé vào khung giờ 11:00 - 12:30 hoặc 18:00 - 19:30 để có bàn đẹp và đồ ăn nóng hổi.',
        'Đừng quên hỏi thử các món đặc sản hoặc best-seller được gợi ý tại quán.',
      ];
    case 'HOTEL':
      return [
        'Giờ nhận phòng tiêu chuẩn thường từ 14:00 và trả phòng trước 12:00 trưa hôm sau.',
        'Hỏi lễ tân về dịch vụ thuê xe máy hoặc các tour tham quan liên kết trong ngày.',
      ];
    case 'ATTRACTION':
    default:
      return [
        'Nên đến vào sáng sớm hoặc xế chiều (15:30 - 17:30) để chụp ảnh đẹp và tránh nắng gắt.',
        'Khu vực xung quanh có bãi đỗ xe và nhiều điểm ăn uống, giải khát tiện lợi.',
      ];
  }
}

export const goongService = {
  /**
   * 1. Smart Place Search (Goong.io Autocomplete + Curated Matches + Fallbacks)
   */
  async searchPlaces(query: string, signal?: AbortSignal): Promise<SearchPlaceResult[]> {
    const rawQuery = query.trim();
    if (!rawQuery) return [];

    const normQuery = removeVietnameseTones(rawQuery);
    const results: SearchPlaceResult[] = [];
    const seenNames = new Set<string>();

    // Step 1: Ưu tiên Curated Places phù hợp trước
    const curatedMatches = DA_NANG_CURATED_PLACES.filter((p) => {
      const normName = removeVietnameseTones(p.placeName || '');
      const normAddr = removeVietnameseTones(p.formattedAddress || '');
      const hasKw = p.keywords.some((kw) => {
        const nKw = removeVietnameseTones(kw);
        return nKw.includes(normQuery) || normQuery.includes(nKw);
      });
      return normName.includes(normQuery) || normAddr.includes(normQuery) || hasKw;
    });

    curatedMatches.forEach((item, idx) => {
      seenNames.add(item.placeName!.toLowerCase());
      results.push({
        id: `curated-${idx}-${Date.now()}`,
        placeName: item.placeName || '',
        formattedAddress: item.formattedAddress || '',
        latitude: item.latitude || 16.06,
        longitude: item.longitude || 108.22,
        thumbnailUrl: item.photos?.[0] || getRandomCategoryPhoto(item.category || 'ATTRACTION', idx),
        category: item.category || 'ATTRACTION',
        rating: item.rating || 4.8,
        description: item.description,
        photos: item.photos,
        tips: item.tips,
      });
    });

    // Step 2: Tìm kiếm qua Goong.io Autocomplete API
    const isGoongKeyValid = GOONG_API_KEY && GOONG_API_KEY.trim().length > 5 && !GOONG_API_KEY.includes('your_');
    if (isGoongKeyValid) {
      try {
        const goongRes = await axios.get('https://rsapi.goong.io/Place/AutoComplete', {
          params: {
            api_key: GOONG_API_KEY,
            input: rawQuery,
            limit: 10,
            more_compound: true,
          },
          signal,
        });

        const predictions = goongRes.data?.predictions || [];
        predictions.forEach((pred: any, idx: number) => {
          const mainText = pred.structured_formatting?.main_text || pred.description;
          const secondaryText = pred.structured_formatting?.secondary_text || pred.description;

          if (seenNames.has(mainText.toLowerCase())) return;
          seenNames.add(mainText.toLowerCase());

          const category = inferCategory(pred.types, mainText, secondaryText);
          results.push({
            id: pred.place_id,
            fsqId: pred.place_id, // Lưu Goong place_id để lấy Detail
            placeName: mainText,
            formattedAddress: secondaryText,
            latitude: 16.06, // Tạm thời, sẽ cập nhật toạ độ chuẩn khi lấy detail
            longitude: 108.22,
            thumbnailUrl: getRandomCategoryPhoto(category, idx),
            category,
            rating: Number((4.5 + (idx % 5) * 0.1).toFixed(1)),
            description: `${mainText} - Địa điểm được đề xuất từ bản đồ Goong.io tại ${pred.compound?.province || 'Việt Nam'}.`,
          });
        });
      } catch (err: any) {
        if (axios.isCancel(err) || err.name === 'CanceledError') throw err;
        console.warn('Goong Autocomplete error, falling back...', err?.message);
      }
    }

    // Step 3: Fallback qua Foursquare v3 nếu có key Foursquare
    if (results.length < 5 && FSQ_API_KEY && FSQ_API_KEY.trim().length > 10 && !FSQ_API_KEY.includes('your_')) {
      try {
        const fsqRes = await axios.get('https://api.foursquare.com/v3/places/search', {
          params: {
            query: rawQuery,
            near: 'Da Nang, Vietnam',
            radius: 30000,
            limit: 5,
            fields: 'fsq_id,name,location,categories,geocodes,rating,photos,description',
          },
          headers: {
            Authorization: FSQ_API_KEY,
            Accept: 'application/json',
          },
          signal,
        });

        const fsqItems = fsqRes.data?.results || [];
        fsqItems.forEach((item: any, idx: number) => {
          const name = item.name;
          if (seenNames.has(name.toLowerCase())) return;
          seenNames.add(name.toLowerCase());

          let photoUrl = '';
          if (item.photos && item.photos.length > 0) {
            const p = item.photos[0];
            photoUrl = `${p.prefix}400x300${p.suffix}`;
          }

          const catName = item.categories?.[0]?.name?.toLowerCase() || '';
          let cat: PlaceCategory = 'OTHER';
          if (catName.includes('restaurant') || catName.includes('food') || catName.includes('cafe')) cat = 'RESTAURANT';
          else if (catName.includes('hotel') || catName.includes('resort')) cat = 'HOTEL';
          else if (catName.includes('attraction') || catName.includes('park') || catName.includes('historic')) cat = 'ATTRACTION';

          results.push({
            id: `fsq-${item.fsq_id}`,
            fsqId: item.fsq_id,
            placeName: name,
            formattedAddress: item.location?.formatted_address || item.location?.address || 'Đà Nẵng, Việt Nam',
            latitude: item.geocodes?.main?.latitude || 16.06,
            longitude: item.geocodes?.main?.longitude || 108.22,
            thumbnailUrl: photoUrl || getRandomCategoryPhoto(cat, idx),
            category: cat,
            rating: item.rating ? Number((item.rating / 2).toFixed(1)) : 4.5,
            description: item.description,
          });
        });
      } catch (err: any) {
        if (axios.isCancel(err) || err.name === 'CanceledError') throw err;
      }
    }

    // Step 4: Fallback qua Photon OpenStreetMap (miễn phí 100%) nếu chưa đủ kết quả
    if (results.length < 3) {
      try {
        const photonRes = await axios.get('https://photon.komoot.io/api/', {
          params: {
            q: rawQuery,
            lat: 16.06,
            lon: 108.22,
            limit: 6,
          },
          signal,
        });

        const features = photonRes.data?.features || [];
        features.forEach((feat: any, idx: number) => {
          const prop = feat.properties;
          const name = prop.name;
          if (!name || seenNames.has(name.toLowerCase())) return;

          const coords = feat.geometry?.coordinates;
          if (!coords || coords.length < 2) return;
          const [lon, lat] = coords;

          const addrParts = [prop.housenumber, prop.street, prop.district, prop.city || 'Đà Nẵng', prop.country]
            .filter(Boolean)
            .join(', ');

          const cat = inferCategory([], name, addrParts);
          seenNames.add(name.toLowerCase());

          results.push({
            id: `osm-${prop.osm_id || idx}-${Date.now()}`,
            placeName: name,
            formattedAddress: addrParts || 'Đà Nẵng, Việt Nam',
            latitude: lat,
            longitude: lon,
            thumbnailUrl: getRandomCategoryPhoto(cat, idx),
            category: cat,
            rating: Number((4.3 + (idx % 6) * 0.1).toFixed(1)),
            description: `${name} được ghi nhận tại ${prop.city || 'Việt Nam'}.`,
          });
        });
      } catch (err: any) {
        if (axios.isCancel(err) || err.name === 'CanceledError') throw err;
      }
    }

    return results;
  },

  /**
   * 2. Lấy thông tin chi tiết đầy đủ (Goong.io Place Detail API)
   */
  async getPlaceDetails(place: PlaceItem | SearchPlaceResult): Promise<Partial<PlaceItem>> {
    const placeId = place.fsqId || place.id;

    // Check memory cache
    if (placeDetailCache.has(placeId)) {
      return placeDetailCache.get(placeId)!;
    }

    // 1. Khớp với Curated Database nếu có tên tương đồng (Đà Nẵng & Hội An)
    const normPlaceName = removeVietnameseTones(place.placeName);
    const matched = DA_NANG_CURATED_PLACES.find((c) => {
      const normCurated = removeVietnameseTones(c.placeName || '');
      return normCurated.includes(normPlaceName) || normPlaceName.includes(normCurated);
    });

    if (matched) {
      const res: Partial<PlaceItem> = {
        rating: matched.rating,
        reviewCount: matched.reviewCount,
        openNow: matched.openNow,
        hoursDescription: matched.hoursDescription,
        description: matched.description,
        photos: matched.photos,
        tips: matched.tips,
        phoneNumber: matched.phoneNumber,
        website: matched.website,
        latitude: matched.latitude || place.latitude,
        longitude: matched.longitude || place.longitude,
      };
      placeDetailCache.set(placeId, res);
      return res;
    }

    const isGoongKeyValid = GOONG_API_KEY && GOONG_API_KEY.trim().length > 5 && !GOONG_API_KEY.includes('your_');

    // 2. Lấy toạ độ và thông tin chuẩn từ Goong.io Place Detail API
    let goongLat = place.latitude || 16.06;
    let goongLng = place.longitude || 108.22;
    let goongAddress = place.formattedAddress || '';
    let goongName = place.placeName || '';
    let goongCategory = place.category || 'ATTRACTION';
    const goongPhotos: string[] = [];

    if (isGoongKeyValid && placeId && !placeId.startsWith('curated-') && !placeId.startsWith('osm-') && !placeId.startsWith('fsq-')) {
      try {
        const res = await axios.get('https://rsapi.goong.io/Place/Detail', {
          params: {
            api_key: GOONG_API_KEY,
            place_id: placeId,
          },
        });

        const detail = res.data?.result;
        if (detail) {
          goongLat = detail.geometry?.location?.lat || goongLat;
          goongLng = detail.geometry?.location?.lng || goongLng;
          goongAddress = detail.formatted_address || goongAddress;
          goongName = detail.name || goongName;
          goongCategory = inferCategory(detail.types, goongName, goongAddress);

          if (Array.isArray(detail.photos) && detail.photos.length > 0) {
            detail.photos.forEach((p: any) => {
              if (typeof p === 'string') goongPhotos.push(p);
              else if (p?.photo_reference) goongPhotos.push(p.photo_reference);
            });
          }
        }
      } catch (err: any) {
        console.warn('Lỗi khi gọi Goong Place Detail:', err?.message);
      }
    }

    // 3. Tự động lấy bài viết giới thiệu & hình ảnh thực tế từ Wikipedia tiếng Việt
    const wikiData = await fetchWikipediaSummary(goongName);

    // Xử lý ảnh: ưu tiên ảnh Wikipedia thực tế + ảnh Goong + stock photo dự phòng
    const stockPhotos = CATEGORY_STOCK_PHOTOS[goongCategory] || CATEGORY_STOCK_PHOTOS.OTHER;
    const finalPhotos: string[] = [];
    if (wikiData?.photoUrl) finalPhotos.push(wikiData.photoUrl);
    if (goongPhotos.length > 0) finalPhotos.push(...goongPhotos);
    if (place.thumbnailUrl) finalPhotos.push(place.thumbnailUrl);
    stockPhotos.forEach((p) => finalPhotos.push(p));
    const uniquePhotos = Array.from(new Set(finalPhotos.filter(Boolean))).slice(0, 5);

    // Mô tả: Ưu tiên trích dẫn bách khoa toàn thư Wikipedia, nếu không có thì tự sinh câu tự nhiên
    const description = wikiData?.extract || (
      goongCategory === 'RESTAURANT'
        ? `${goongName} là địa điểm ẩm thực nổi bật tại ${goongAddress || 'Việt Nam'}. Quán phục vụ nhiều món ăn thơm ngon, thu hút đông đảo thực khách và khách du lịch ghé thưởng thức.`
        : goongCategory === 'HOTEL'
        ? `${goongName} tọa lạc tại ${goongAddress || 'Việt Nam'}, sở hữu vị trí thuận tiện để di chuyển đến các điểm tham quan cùng dịch vụ lưu trú tiện nghi, thoải mái.`
        : `${goongName} là điểm tham quan hấp dẫn tọa lạc tại ${goongAddress || 'Việt Nam'}. Đây là tọa độ check-in yêu thích của nhiều du khách khi khám phá thành phố.`
    );

    const parsedData: Partial<PlaceItem> = {
      placeName: goongName,
      formattedAddress: goongAddress,
      latitude: goongLat,
      longitude: goongLng,
      category: goongCategory,
      rating: place.rating || 4.7,
      reviewCount: 280,
      openNow: true,
      hoursDescription: goongCategory === 'RESTAURANT' ? '08:00 - 22:30 hàng ngày' : '07:30 - 21:00 hàng ngày',
      description,
      photos: uniquePhotos,
      tips: generateSmartTips(goongCategory, goongName),
      website: wikiData?.pageUrl || undefined,
    };

    placeDetailCache.set(placeId, parsedData);
    return parsedData;
  },

  /**
   * 3. Tìm kiếm gợi ý Điểm đến / Thành phố (Goong AutoComplete + Photon fallback)
   */
  async searchDestinations(query: string, signal?: AbortSignal): Promise<Array<{ id: string; name: string; description: string; placeId?: string; lat?: number; lng?: number }>> {
    const raw = query.trim();
    if (!raw) return [];

    const isGoongKeyValid = GOONG_API_KEY && GOONG_API_KEY.trim().length > 5 && !GOONG_API_KEY.includes('your_');
    if (isGoongKeyValid) {
      try {
        const res = await axios.get('https://rsapi.goong.io/Place/AutoComplete', {
          params: {
            api_key: GOONG_API_KEY,
            input: raw,
            limit: 6,
          },
          signal,
        });

        const predictions = res.data?.predictions || [];
        if (predictions.length > 0) {
          return predictions.map((pred: any) => ({
            id: pred.place_id,
            name: pred.structured_formatting?.main_text || pred.description.split(',')[0],
            description: pred.description,
            placeId: pred.place_id,
          }));
        }
      } catch (err: any) {
        if (axios.isCancel(err) || err.name === 'CanceledError') throw err;
      }
    }

    // Photon OSM fallback
    try {
      const photonRes = await axios.get('https://photon.komoot.io/api/', {
        params: { q: raw, limit: 6 },
        signal,
      });
      const features = photonRes.data?.features || [];
      return features.map((f: any, idx: number) => {
        const prop = f.properties;
        const name = prop.name || prop.city || prop.country;
        const descParts = [prop.district, prop.city, prop.state, prop.country].filter(Boolean);
        return {
          id: `dest-${prop.osm_id || idx}`,
          name,
          description: descParts.join(', ') || name,
          lat: f.geometry?.coordinates?.[1],
          lng: f.geometry?.coordinates?.[0],
        };
      });
    } catch {
      return [];
    }
  },

  /**
   * 4. Geocode tọa độ của điểm đến / thành phố
   */
  async geocodeDestination(destinationName: string): Promise<{ lat: number; lng: number }> {
    if (!destinationName?.trim()) return { lat: 16.0544, lng: 108.2022 };

    const POPULAR_COORDS: Record<string, { lat: number; lng: number }> = {
      'da nang': { lat: 16.0544, lng: 108.2022 },
      'hoi an': { lat: 15.8801, lng: 108.3380 },
      'da lat': { lat: 11.9404, lng: 108.4583 },
      'ha noi': { lat: 21.0285, lng: 105.8542 },
      'ho chi minh': { lat: 10.7769, lng: 106.7009 },
      'sai gon': { lat: 10.7769, lng: 106.7009 },
      'phu quoc': { lat: 10.2289, lng: 103.9572 },
      'nha trang': { lat: 12.2388, lng: 109.1967 },
      'hue': { lat: 16.4637, lng: 107.5909 },
      'sapa': { lat: 22.3364, lng: 103.8438 },
      'sa pa': { lat: 22.3364, lng: 103.8438 },
      'vung tau': { lat: 10.3460, lng: 107.0843 },
      'quy nhon': { lat: 13.7830, lng: 109.2197 },
      'ha long': { lat: 20.9505, lng: 107.0734 },
      'can tho': { lat: 10.0452, lng: 105.7469 },
      'phan thiet': { lat: 10.9289, lng: 108.1021 },
      'mui ne': { lat: 10.9333, lng: 108.2833 },
      'ninh binh': { lat: 20.2506, lng: 105.9745 },
      'tam dao': { lat: 21.4583, lng: 105.6444 },
      'moc chau': { lat: 20.8447, lng: 104.6469 },
      'ha giang': { lat: 22.8233, lng: 104.9839 },
      'phu yen': { lat: 13.0882, lng: 109.0926 },
      'buon ma thuot': { lat: 12.6667, lng: 108.0383 },
    };

    const norm = removeVietnameseTones(destinationName);
    for (const [key, coords] of Object.entries(POPULAR_COORDS)) {
      if (norm.includes(key) || key.includes(norm)) {
        return coords;
      }
    }

    const isGoongKeyValid = GOONG_API_KEY && GOONG_API_KEY.trim().length > 5 && !GOONG_API_KEY.includes('your_');
    if (isGoongKeyValid) {
      try {
        const res = await axios.get('https://rsapi.goong.io/Geocode', {
          params: {
            api_key: GOONG_API_KEY,
            address: destinationName,
          },
        });
        const loc = res.data?.results?.[0]?.geometry?.location;
        if (loc?.lat && loc?.lng) {
          return { lat: Number(loc.lat), lng: Number(loc.lng) };
        }
      } catch {
        // Fallback
      }
    }

    try {
      const photonRes = await axios.get('https://photon.komoot.io/api/', {
        params: { q: destinationName, limit: 1 },
      });
      const coords = photonRes.data?.features?.[0]?.geometry?.coordinates;
      if (coords && coords.length >= 2) {
        return { lat: Number(coords[1]), lng: Number(coords[0]) };
      }
    } catch {
      // Fallback
    }

    return { lat: 16.0544, lng: 108.2022 };
  },

  /**
   * 5. Lấy tọa độ từ Goong Place ID (Detail API)
   */
  async getPlaceCoordinates(placeId: string): Promise<{ lat: number; lng: number } | null> {
    const isGoongKeyValid = GOONG_API_KEY && GOONG_API_KEY.trim().length > 5 && !GOONG_API_KEY.includes('your_');
    if (isGoongKeyValid && placeId) {
      try {
        const res = await axios.get('https://rsapi.goong.io/Place/Detail', {
          params: {
            api_key: GOONG_API_KEY,
            place_id: placeId,
          },
        });
        const loc = res.data?.result?.geometry?.location;
        if (loc?.lat && loc?.lng) {
          return { lat: Number(loc.lat), lng: Number(loc.lng) };
        }
      } catch {
        // Fallback
      }
    }
    return null;
  },
};
