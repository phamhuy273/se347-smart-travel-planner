# 📚 TÀI LIỆU BÀN GIAO API — MODULE 3: PLANNER & MAP ENGINE
> **Dành cho:** Frontend Developer (Vue 3 + Pinia + Mapbox GL JS + vuedraggable)  
> **Người thực hiện Backend:** Module 3 Team  
> **Base URL:** `http://localhost:3000/api/v1`  
> **Phiên bản:** v1.0.0 (Cập nhật sau Giai đoạn 4)

---

## 🔐 1. Chuẩn Xác Thực (Authentication Header)
Mọi request (ngoại trừ các route công khai) **bắt buộc** phải đính kèm Header Authorization chứa JWT Access Token:

```http
Authorization: Bearer <access_token_của_user>
Content-Type: application/json
```

* Nếu thiếu header hoặc token hết hạn $\rightarrow$ Trả về mã lỗi `401 Unauthorized`.
* Nếu người dùng không có vai trò phù hợp trong chuyến đi $\rightarrow$ Trả về mã lỗi `403 Forbidden`.

---

## 📋 2. Bảng Tổng Hợp Danh Sách API Module 3

| STT | Phương thức | Endpoint | Phân quyền yêu cầu | Mô tả |
|:---:|:---:|:---|:---:|:---|
| 1 | `GET` | `/trips/:tripId/itinerary` | OWNER, EDITOR, VIEWER | Lấy toàn bộ cây dữ liệu lịch trình (các ngày + kho lưu tạm). |
| 2 | `POST` | `/trips/:tripId/places` | OWNER, EDITOR | Thêm địa điểm mới (vào ngày cụ thể hoặc kho lưu tạm). |
| 3 | `GET` | `/places/:id` | OWNER, EDITOR, VIEWER | Lấy thông tin chi tiết một điểm dừng. |
| 4 | `PATCH` | `/places/:id` | OWNER, EDITOR | Cập nhật thông tin chi tiết điểm dừng (giờ, ghi chú, danh mục...). |
| 5 | `DELETE` | `/places/:id` | OWNER, EDITOR | Xóa vĩnh viễn địa điểm khỏi lịch trình. |
| 6 | `PATCH` | `/places/:id/reorder` | OWNER, EDITOR | *(Giai đoạn 5)* Kéo thả đổi vị trí và ngày bằng Fractional Indexing. |

---

## 📖 3. Chi Tiết Từng Endpoint

### 3.1. Lấy Toàn Bộ Lịch Trình Chuyến Đi (Itinerary)
Endpoint này cung cấp toàn bộ dữ liệu cần thiết để Frontend dựng:
1. Các cột ngày trên Canvas (`days`).
2. Khay "Kho lưu tạm" (`unassigned_places`).
3. Toàn bộ Marker và đường Polyline trên Mapbox GL JS.

* **Method:** `GET`
* **URL:** `/trips/:tripId/itinerary`
* **Params:** `tripId` (UUID của chuyến đi)
* **Response Thành công (`200 OK`):**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "trip": {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "title": "Chuyến đi Đà Lạt 3N2Đ",
      "description": "Lịch trình nghỉ dưỡng cuối tuần",
      "destination": "Đà Lạt, Lâm Đồng",
      "start_date": "2026-10-10",
      "end_date": "2026-10-12",
      "cover_image_url": "https://images.unsplash.com/photo-dalat.jpg",
      "visibility": "PUBLIC",
      "owner_id": "8bb1b827-c104-453b-a9b8-07e32d56c2d1"
    },
    "days": [
      {
        "id": "d1a85f64-5717-4562-b3fc-2c963f66af01",
        "day_number": 1,
        "date": "2026-10-10",
        "place_items": [
          {
            "id": "p1a85f64-5717-4562-b3fc-2c963f66af11",
            "trip_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "trip_day_id": "d1a85f64-5717-4562-b3fc-2c963f66af01",
            "place_name": "Quảng trường Lâm Viên",
            "formatted_address": "Đường Trần Quốc Toản, Phường 10, Đà Lạt",
            "latitude": 11.9366,
            "longitude": 108.4452,
            "thumbnail_url": "https://example.com/lam-vien.jpg",
            "category": "ATTRACTION",
            "start_time": "08:30",
            "duration_minutes": 60,
            "notes": "Chụp hình hoa dã quỳ và nụ Atiso",
            "order_index": 1000.0,
            "created_at": "2026-10-05T10:00:00.000Z",
            "updated_at": "2026-10-05T10:00:00.000Z"
          },
          {
            "id": "p2a85f64-5717-4562-b3fc-2c963f66af12",
            "trip_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "trip_day_id": "d1a85f64-5717-4562-b3fc-2c963f66af01",
            "place_name": "Tiệm Cà phê Túi Mơ To",
            "formatted_address": "Hẻm 31 Sào Nam, Phường 11, Đà Lạt",
            "latitude": 11.9542,
            "longitude": 108.4821,
            "thumbnail_url": null,
            "category": "RESTAURANT",
            "start_time": "10:00",
            "duration_minutes": 90,
            "notes": "Ngắm view thung lũng",
            "order_index": 2000.0,
            "created_at": "2026-10-05T10:05:00.000Z",
            "updated_at": "2026-10-05T10:05:00.000Z"
          }
        ]
      }
    ],
    "unassigned_places": [
      {
        "id": "p3a85f64-5717-4562-b3fc-2c963f66af13",
        "trip_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "trip_day_id": null,
        "place_name": "Chợ Đêm Đà Lạt",
        "formatted_address": "Đường Nguyễn Thị Minh Khai, Phường 1, Đà Lạt",
        "latitude": 11.9422,
        "longitude": 108.4371,
        "thumbnail_url": null,
        "category": "ATTRACTION",
        "start_time": null,
        "duration_minutes": null,
        "notes": "Ăn bánh tráng nướng, sữa đậu nành",
        "order_index": 1000.0,
        "created_at": "2026-10-05T10:10:00.000Z",
        "updated_at": "2026-10-05T10:10:00.000Z"
      }
    ],
    "total_places": 3
  }
}
```

---

### 3.2. Thêm Địa Điểm Mới Vào Chuyến Đi (Create Place)
Frontend gọi Mapbox Autocomplete API bóc tách thông tin rồi POST về endpoint này.

* **Method:** `POST`
* **URL:** `/trips/:tripId/places`
* **Request Body:**
```json
{
  "trip_day_id": "d1a85f64-5717-4562-b3fc-2c963f66af01", // Tùy chọn. Bỏ trống hoặc null nếu muốn lưu vào Kho lưu tạm
  "place_name": "Hồ Tuyền Lâm",                           // Bắt buộc (tối đa 255 ký tự)
  "formatted_address": "Phường 4, TP. Đà Lạt",             // Tùy chọn
  "latitude": 11.8988,                                    // Bắt buộc (-90 <= lat <= 90)
  "longitude": 108.4287,                                  // Bắt buộc (-180 <= lng <= 180)
  "thumbnail_url": "https://example.com/tuyen-lam.jpg",   // Tùy chọn (URL hợp lệ)
  "category": "ATTRACTION",                               // Tùy chọn: ATTRACTION | RESTAURANT | HOTEL | TRANSPORT | OTHER
  "start_time": "14:00",                                  // Tùy chọn (định dạng HH:mm)
  "duration_minutes": 120,                                // Tùy chọn (số nguyên >= 1)
  "notes": "Thuê thuyền chèo kayak"                       // Tùy chọn
}
```
* **Response Thành công (`201 Created`):**
```json
{
  "statusCode": 201,
  "message": "Success",
  "data": {
    "id": "p4a85f64-5717-4562-b3fc-2c963f66af14",
    "trip_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "trip_day_id": "d1a85f64-5717-4562-b3fc-2c963f66af01",
    "place_name": "Hồ Tuyền Lâm",
    "order_index": 3000.0,
    "created_at": "2026-10-05T10:15:00.000Z",
    "updated_at": "2026-10-05T10:15:00.000Z"
  }
}
```

---

### 3.3. Lấy Chi Tiết Điểm Dừng (Get Place By ID)
* **Method:** `GET`
* **URL:** `/places/:id`
* **Params:** `id` (UUID của địa điểm)
* **Response Thành công (`200 OK`):**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "id": "p1a85f64-5717-4562-b3fc-2c963f66af11",
    "place_name": "Quảng trường Lâm Viên",
    "formatted_address": "Đường Trần Quốc Toản, Phường 10, Đà Lạt",
    "latitude": 11.9366,
    "longitude": 108.4452,
    "category": "ATTRACTION",
    "start_time": "08:30",
    "duration_minutes": 60,
    "notes": "Chụp hình hoa dã quỳ và nụ Atiso",
    "order_index": 1000.0,
    "trip_day": {
      "id": "d1a85f64-5717-4562-b3fc-2c963f66af01",
      "day_number": 1,
      "date": "2026-10-10"
    }
  }
}
```

---

### 3.4. Cập Nhật Thông Tin Chi Tiết Điểm Dừng (Update Place)
Dùng khi người dùng mở Modal chỉnh sửa giờ bắt đầu, thời lượng, ghi chú, đổi danh mục thẻ...

* **Method:** `PATCH`
* **URL:** `/places/:id`
* **Request Body (Gửi trường nào cập nhật trường đó):**
```json
{
  "start_time": "09:00",
  "duration_minutes": 90,
  "notes": "Đã đặt bàn trước, mã booking #DL12345",
  "category": "RESTAURANT"
}
```
* **Response Thành công (`200 OK`):**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "id": "p1a85f64-5717-4562-b3fc-2c963f66af11",
    "start_time": "09:00",
    "duration_minutes": 90,
    "notes": "Đã đặt bàn trước, mã booking #DL12345",
    "category": "RESTAURANT",
    "updated_at": "2026-10-05T10:20:00.000Z"
  }
}
```

---

### 3.5. Xóa Vĩnh Viễn Điểm Dừng (Delete Place)
* **Method:** `DELETE`
* **URL:** `/places/:id`
* **Response Thành công (`200 OK`):**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "id": "p1a85f64-5717-4562-b3fc-2c963f66af11",
    "deleted": true,
    "message": "Đã xóa địa điểm \"Quảng trường Lâm Viên\" thành công"
  }
}
```

---

### 3.6. Kéo Thả Đổi Thứ Tự & Chuyển Ngày (Reorder / Move Place)
Endpoint phục vụ cho thư viện `vuedraggable` trên Vue 3. Khi người dùng thả chuột (sự kiện `@end` hoặc `change`), Frontend gửi ID ngày đích và `order_index` của 2 phần tử liền trước/sau.

* **Method:** `PATCH`
* **URL:** `/places/:id/reorder`
* **Params:** `id` (UUID của địa điểm đang được kéo thả)
* **Request Body:**
```json
{
  "target_day_id": "d2a85f64-5717-4562-b3fc-2c963f66af02", // ID ngày đích (nếu chuyển ngày), null nếu kéo vào Kho lưu tạm, hoặc bỏ trống nếu giữ nguyên ngày
  "prev_order_index": 1000.0,                              // order_index của item đứng trước (null nếu chèn lên đầu)
  "next_order_index": 2000.0                               // order_index của item đứng sau (null nếu chèn xuống cuối)
}
```
* **Response Thành công (`200 OK`):**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "id": "p1a85f64-5717-4562-b3fc-2c963f66af11",
    "trip_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "trip_day_id": "d2a85f64-5717-4562-b3fc-2c963f66af02",
    "place_name": "Quảng trường Lâm Viên",
    "order_index": 1500.0,
    "updated_at": "2026-10-05T10:25:00.000Z"
  }
}
```

> **Lưu ý kỹ thuật cho Frontend:**
> * Backend sử dụng thuật toán **Fractional Indexing** kết hợp **Prisma Interactive Transaction**, chỉ thực thi đúng **1 câu lệnh `UPDATE`**, đảm bảo phản hồi tức thì cho cơ chế **Optimistic UI**.
> * Nếu khoảng cách giữa 2 index $< 10^{-5}$, Backend sẽ tự động chạy cơ chế **Auto Re-balancing** để dàn đều lại các index (1000, 2000, 3000...) mà Frontend không cần làm thêm thao tác nào.

---

## 💡 4. Gợi Ý Tích Hợp Frontend (Vue 3 + Pinia)


### 4.1. Mã Màu Danh Mục Thống Nhất (Figma Design Token)
Frontend nên bind màu sắc badge và marker theo danh mục (`category`) như sau:
* `ATTRACTION` (Tham quan / Check-in): Xanh dương (`#0284C7` - Ocean Blue)
* `RESTAURANT` (Ăn uống): Cam (`#F97316` - Brand Orange)
* `HOTEL` (Lưu trú / Khách sạn): Tím (`#8B5CF6` - Purple)
* `TRANSPORT` (Di chuyển): Xanh lá (`#10B981` - Emerald Green)
* `OTHER`: Xám (`#64748B` - Slate)

### 4.2. Vẽ Tuyến Đường Trên Mapbox GL JS
Mỗi ngày trong `days` đã có danh sách `place_items` được Backend xếp sẵn thứ tự 1-2-3 (`order_index` tăng dần).  
Frontend chỉ cần map tọa độ thành mảng GeoJSON Coordinates để vẽ đường Polyline:
```javascript
const routeCoordinates = day.place_items.map(place => [place.longitude, place.latitude]);
```
