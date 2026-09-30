# 🌍 TripPlanner (Wanderflow) — Nền Tảng Lập Lịch Trình Du Lịch Thông Minh

> **Môn học:** SE347 - Công nghệ Web và Ứng dụng  
> **Giảng viên hướng dẫn:** ThS. Trần Thị Hồng Yến  
> **Kiến trúc:** Monorepo (NestJS Backend + Vue 3 Frontend + PostgreSQL)

---

## 🏗️ 1. Kiến Trúc Công Nghệ (Tech Stack)

* **Backend:** [NestJS](https://nestjs.com/) (TypeScript), RESTful API, Global Exception Filters, Transform Interceptors.
* **Database & ORM:** [PostgreSQL 16](https://www.postgresql.org/) (Docker), [Prisma ORM](https://www.prisma.io/) (11 bảng CSDL chuẩn 3NF).
* **Authentication:** JWT (JSON Web Token), Passport-JWT, Bcrypt hashing.
* **Media & Cloud Storage:** [Cloudinary](https://cloudinary.com/) SDK cho tải ảnh Avatar và Cover.
* **Frontend:** [Vue 3](https://vuejs.org/) (Composition API, `<script setup lang="ts">`), [Vite](https://vitejs.dev/).
* **Styling:** [Tailwind CSS](https://tailwindcss.com/) (cấu hình chuẩn bảng màu Figma: Brand Orange `#F97316`, Ocean Blue `#0284C7`).
* **State & Routing:** [Pinia](https://pinia.vuejs.org/), [Vue Router 4](https://router.vuejs.org/) (hỗ trợ Navigation Guards, 2 Layout: `MainLayout` & `PlannerLayout`).
* **Bản đồ & Kéo thả (Module 3 & Seminar):** [Mapbox GL JS](https://www.mapbox.com/) (bản đồ, marker, polyline) & [vuedraggable](https://github.com/SortableJS/vue.draggable.next) (kéo thả với thuật toán Fractional Indexing).
* **CI/CD & DevOps:** Docker Compose, GitHub Actions CI Workflow (`.github/workflows/ci.yml`).

---

## 📁 2. Cấu Trúc Thư Mục Monorepo

```
se347-smart-travel-planner/
├── .github/
│   ├── workflows/
│   │   └── ci.yml               # GitHub Actions CI tự động kiểm tra build BE & FE
│   └── pull_request_template.md # Mẫu Pull Request chuẩn doanh nghiệp
├── backend/                     # Source code Backend (NestJS + Prisma)
│   ├── prisma/
│   │   └── schema.prisma        # Lược đồ CSDL chi tiết 11 bảng
│   └── src/
│       ├── common/              # Bộ lọc lỗi, interceptor, upload cloudinary
│       ├── modules/             # Các module nghiệp vụ (auth, trips, places)
│       ├── prisma/              # PrismaService kết nối database
│       └── main.ts              # Entrypoint (CORS, ValidationPipe, Prefix)
├── frontend/                    # Source code Frontend (Vue 3 + Vite + Tailwind)
│   └── src/
│       ├── components/common/   # BaseButton, BaseInput chuẩn Figma
│       ├── layouts/             # MainLayout (Màn 4 & 5) & PlannerLayout (Màn 6)
│       ├── router/              # Cấu hình định tuyến và phân quyền
│       ├── services/            # Axios API Client có Interceptor
│       └── views/               # Landing, Login, Register, Dashboard, Trips, Planner
├── docker-compose.yml           # Khởi chạy PostgreSQL 16
├── .env.example                 # File cấu hình mẫu biến môi trường
├── .gitignore                   # Cấu hình Git bỏ qua file rác
└── README.md                    # Tài liệu hướng dẫn dự án
```

---

## 👥 3. Phân Công Trách Nhiệm (Sprint 1: 28/09 – 24/10)

* **Tech Lead (TV 1):** Hạ tầng Docker, Prisma 11 bảng, Base NestJS, Base Vue 3, 2 Layout khung (`MainLayout`, `PlannerLayout`).
* **Cặp 1 (TV 2 BE + TV 3 FE):** Module 1 — Xác thực (JWT Auth), Landing Page (Màn 1), Login/Register (Màn 2 & 3), Dashboard-1 (Màn 4).
* **Cặp 2 (TV 4 BE + TV 5 FE):** Module 2 — Quản lý Chuyến đi (Trip CRUD), Trang "Chuyến đi của tôi" (Màn 5), Modal Tạo chuyến đi.
* **Cặp 3 (TV 6 BE + TV 7 FE):** Module 3 — Địa điểm & Màn hình Xếp lịch (Màn 6: Mapbox GL JS + vuedraggable + Fractional Indexing).

---

## 🚀 4. Hướng Dẫn Cài Đặt & Chạy Dự Án (Local Development)

### Bước 1: Chuẩn bị biến môi trường
Copy file `.env.example` thành file `.env` ở thư mục gốc:
```bash
cp .env.example .env
```

### Bước 2: Khởi chạy Database bằng Docker
Đảm bảo đã bật **Docker Desktop**, sau đó chạy lệnh:
```bash
docker compose up -d
```
> Database PostgreSQL sẽ chạy tại cổng `5432` với database name `wanderflow_db`.

### Bước 3: Cài đặt & Chạy Backend (NestJS)
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run start:dev
```
> Server API Backend sẽ chạy tại: `http://localhost:3000/api/v1`

### Bước 4: Cài đặt & Chạy Frontend (Vue 3)
Mở một cửa sổ Terminal mới:
```bash
cd frontend
npm install
npm run dev
```
> Ứng dụng Web sẽ chạy tại: `http://localhost:5173`

---

## 🐙 5. Quy Chuẩn Làm Việc Git & GitHub

1. **Quy tắc về Nhánh:**
   * `main`: Nhánh chỉ dùng để đóng gói nộp đồ án và demo cuối kỳ (CẤM PUSH TRỰC TIẾP).
   * `develop`: Nhánh tích hợp chung của toàn team.
   * Khi làm task, tạo nhánh từ `develop`:
     * Backend: `feat/be-auth-jwt`, `feat/be-trip-crud`, `feat/be-place-reorder`
     * Frontend: `feat/fe-login-register`, `feat/fe-my-trips`, `feat/fe-planner-map`
2. **Quy tắc Commit Message:**
   * `feat: ...` (tính năng mới)
   * `fix: ...` (sửa lỗi)
   * `style: ...` (căn chỉnh giao diện theo Figma)
   * `docs: ...` (cập nhật tài liệu)
3. **Quy tắc Pull Request:**
   * Mọi PR phải hướng về nhánh `develop`.
   * Bắt buộc bạn cùng cặp hoặc Tech Lead review và nhấn **Approve** mới được merge.
