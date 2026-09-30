# 🌍 TripPlanner (Wanderflow) — Nền Tảng Lập Lịch Trình Du Lịch Thông Minh

> **Môn học:** SE347 - Công nghệ Web và Ứng dụng  
> **Giảng viên hướng dẫn:** ThS. Trần Thị Hồng Yến  
> **Kiến trúc:** Monorepo (NestJS Backend + Vue 3 Frontend + PostgreSQL 16)

---

## 🏗️ 1. Kiến Trúc Công Nghệ (Tech Stack)

* **Backend:** [NestJS](https://nestjs.com/) (TypeScript), RESTful API, Global Exception Filters, Transform Interceptors.
* **Database & ORM:** [PostgreSQL 16](https://www.postgresql.org/) (Docker), [Prisma ORM](https://www.prisma.io/) (11 bảng CSDL chuẩn 3NF).
* **Authentication:** JWT (JSON Web Token), Passport-JWT, Bcrypt hashing.
* **Media & Cloud Storage:** [Cloudinary](https://cloudinary.com/) SDK cho tải ảnh Avatar và Cover chuyến đi.
* **Frontend:** [Vue 3](https://vuejs.org/) (Composition API, `<script setup lang="ts">`), [Vite](https://vitejs.dev/).
* **Styling:** [Tailwind CSS](https://tailwindcss.com/) (chuẩn màu Figma: Brand Orange `#F97316`, Ocean Blue `#0284C7`, Slate `#F8FAFC`).
* **State & Routing:** [Pinia](https://pinia.vuejs.org/), [Vue Router 4](https://router.vuejs.org/) (2 Layouts: `MainLayout` & `PlannerLayout`).
* **Bản đồ & Kéo thả (Module 3):** [Mapbox GL JS](https://www.mapbox.com/) & [vuedraggable](https://github.com/SortableJS/vue.draggable.next) (kéo thả với thuật toán Fractional Indexing).
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
│       └── main.ts              # Entrypoint (CORS, ValidationPipe, Prefix api/v1)
├── frontend/                    # Source code Frontend (Vue 3 + Vite + Tailwind)
│   └── src/
│       ├── components/common/   # BaseButton, BaseInput chuẩn Figma
│       ├── layouts/             # MainLayout (Màn 4 & 5) & PlannerLayout (Màn 6)
│       ├── router/              # Cấu hình định tuyến và phân quyền
│       ├── services/            # Axios API Client có Interceptor
│       └── views/               # Landing, Login, Register, Dashboard, Trips, Planner
├── docker-compose.yml           # Khởi chạy PostgreSQL 16 (Port 5434)
├── .env.example                 # File cấu hình mẫu biến môi trường
├── .gitignore                   # Cấu hình Git bỏ qua file rác
└── README.md                    # Tài liệu hướng dẫn & quy chuẩn dự án
```

---

## 🚀 3. Hướng Dẫn Cài Đặt & Chạy Dự Án (Local Development)

### Bước 1: Chuẩn bị biến môi trường
Copy file cấu hình mẫu `.env.example` thành file `.env` ở cả thư mục gốc và thư mục `backend/`:
```bash
cp .env.example .env
cp .env.example backend/.env
```

### Bước 2: Khởi chạy Database bằng Docker
Đảm bảo đã bật **Docker Desktop**, sau đó chạy lệnh tại thư mục gốc:
```bash
docker compose up -d
```
> Database PostgreSQL sẽ chạy tại cổng `5434` (để tránh xung đột với các service Postgres mặc định cổng 5432 trên máy).

### Bước 3: Cài đặt & Chạy Backend (NestJS)
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
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

## 🛡️ 4. Quy Chuẩn Làm Việc Git & GitHub (Tránh Conflict & Chuẩn Doanh Nghiệp)

Để tránh tình trạng đè code, conflict và làm hỏng nhánh chung, toàn bộ thành viên **bắt buộc tuân thủ 100%** quy trình dưới đây:

### ⚠️ 4.1. Ba Điều "Cấm Kỵ" (Tuyệt Đối Không Làm)
1. ❌ **KHÔNG** bao giờ được `git push` trực tiếp lên nhánh `main` hoặc `develop`. Mọi code mới phải đi qua Pull Request.
2. ❌ **KHÔNG** commit các file cấu hình môi trường cá nhân (`.env`), file rác hệ điều hành, hay thư mục thư viện (`node_modules/`, `dist/`).
3. ❌ **KHÔNG** tự ý sửa code của module khác nếu chưa trao đổi trước với người phụ trách module đó.

---

### 🌿 4.2. Quy Tắc Đặt Tên Nhánh (Branch Naming)
Mọi nhánh tính năng phải được tách ra từ nhánh **`develop`** mới nhất:
- Tính năng Backend: `feat/be-<tên-chức-năng>` (VD: `feat/be-auth-jwt`, `feat/be-trips-crud`)
- Tính năng Frontend: `feat/fe-<tên-chức-năng>` (VD: `feat/fe-login-page`, `feat/fe-my-trips`)
- Sửa lỗi: `fix/be-<tên-lỗi>` hoặc `fix/fe-<tên-lỗi>` (VD: `fix/fe-navbar-avatar`)
- Cấu hình / Tối ưu: `chore/<nội-dung>` hoặc `refactor/<nội-dung>`

---

### 📝 4.3. Quy Tắc Viết Commit Message (Conventional Commits)
Thông điệp commit phải rõ ràng, giải thích mình đã làm gì:
- `feat(scope): ...` — Thêm tính năng mới (VD: `feat(auth): thêm api đăng nhập bằng jwt`)
- `fix(scope): ...` — Sửa lỗi (VD: `fix(planner): sửa lỗi kéo thả địa điểm không lưu order`)
- `style(scope): ...` — Căn chỉnh CSS, giao diện Figma, không đổi logic code
- `refactor(scope): ...` — Tái cấu trúc code, dọn dẹp logic
- `docs(scope): ...` — Viết thêm hoặc sửa tài liệu README, swagger

---

### 🔄 4.4. Quy Trình 6 Bước Làm Việc Chuẩn (Daily Workflow)

Mỗi khi bắt đầu làm một tính năng mới hoặc bắt đầu một buổi code, hãy thực hiện theo đúng thứ tự:

#### 🔹 Bước 1: Luôn cập nhật `develop` mới nhất về máy
```bash
git checkout develop
git pull origin develop
```

#### 🔹 Bước 2: Tạo nhánh mới từ `develop` sạch
```bash
git checkout -b feat/fe-my-trips
```

#### 🔹 Bước 3: Code và Commit từng phần nhỏ (Atomic Commits)
- Không gom toàn bộ việc của cả tuần vào 1 commit lớn.
- Làm xong một component, một hàm -> Kiểm tra chạy được -> Commit ngay:
```bash
git status
git add src/views/MyTripsView.vue
git commit -m "feat(trips): hoàn thiện giao diện grid danh sách chuyến đi"
```

#### 🔹 Bước 4: Đồng bộ `develop` về nhánh trước khi tạo PR (BƯỚC QUAN TRỌNG NHẤT ĐỂ TRÁNH CONFLICT)
Trước khi đẩy code lên GitHub, hãy kéo những thay đổi mới nhất mà các bạn khác vừa merge vào `develop`:
```bash
git checkout develop
git pull origin develop
git checkout feat/fe-my-trips
git merge develop
```
- **Nếu không có conflict:** Git sẽ tự merge êm đẹp.
- **Nếu có conflict:** Xem ngay mục **4.5** bên dưới để xử lý tại máy cá nhân.

#### 🔹 Bước 5: Đẩy nhánh lên GitHub và Tạo Pull Request (PR)
```bash
git push -u origin feat/fe-my-trips
```
1. Truy cập vào GitHub Repository: [phamhuy273/se347-smart-travel-planner](https://github.com/phamhuy273/se347-smart-travel-planner).
2. Nhấn nút **Compare & pull request**.
3. **CHÚ Ý:** Chọn `base: develop` ⬅️ `compare: feat/fe-my-trips`.
4. Điền tiêu đề và nội dung theo form **Pull Request Template** có sẵn (nêu rõ các màn hình đã làm, ảnh chụp demo nếu là FE).

#### 🔹 Bước 6: Review & Merge
1. Chờ GitHub Actions CI chạy tự động: Đảm bảo cả Backend và Frontend đều xanh tick (**All checks have passed**).
2. Báo Tech Lead hoặc bạn phản biện trong cặp review code.
3. Khi nhận được **Approve**, Tech Lead hoặc tác giả sẽ bấm **Squash and merge** để gộp commit gọn gàng vào `develop`.
4. Xóa nhánh tính năng cũ trên GitHub và ở máy local để tránh rác nhánh:
```bash
git branch -d feat/fe-my-trips
```

---

### ⚔️ 4.5. Hướng Dẫn Xử Lý Khi Gặp Conflict (Xung Đột Code)

Khi chạy `git merge develop` mà màn hình hiện chữ đỏ `CONFLICT (content): Merge conflict in ...`:

1. **Đừng hoảng loạn!** Mở VS Code lên, các file bị conflict sẽ có màu cam/đỏ.
2. Mở file đó ra, VS Code sẽ highlight rõ ràng:
   - **Current Change (Code nhánh của bạn đang làm)**
   - **Incoming Change (Code từ develop do bạn khác vừa push lên)**
3. VS Code cung cấp 4 nút bấm tiện lợi ngay phía trên đoạn code xung đột:
   - `Accept Current Change`: Giữ code của bạn.
   - `Accept Incoming Change`: Lấy code mới của bạn khác.
   - `Accept Both Changes`: Giữ cả hai đoạn code.
4. **Nguyên tắc vàng:** Nếu xung đột với code người khác, hãy nhắn tin thoại/hỏi trực tiếp người đó để thống nhất chọn đoạn code nào, **tuyệt đối không tự ý xóa code của đồng đội**.
5. Sau khi chỉnh sửa xong nội dung chuẩn:
   - Chạy thử kiểm tra lại: `npm run build` (hoặc `npm test`) xem còn lỗi cú pháp không.
   - Lưu file lại, gõ lệnh hoàn tất merge:
   ```bash
   git add .
   git commit -m "merge: giải quyết conflict với nhánh develop"
   git push origin feat/fe-my-trips
   ```

---

### 📦 4.6. Phân Vùng Làm Việc Trong Monorepo
Dự án dùng cấu trúc Monorepo (Frontend và Backend nằm chung 1 Repository), do đó:
- Thành viên làm **Backend**: Chỉ thao tác và chỉnh sửa trong thư mục `backend/`.
- Thành viên làm **Frontend**: Chỉ thao tác và chỉnh sửa trong thư mục `frontend/`.
- **Package Lock**: Khi cài thêm bất kỳ thư viện NPM nào (`package.json`), cần thông báo lên nhóm chat để các thành viên khác chạy lại `npm install` khi pull code về.
- Mọi chỉnh sửa ở thư mục gốc (`docker-compose.yml`, `.github/`, root `.env`) phải do **Tech Lead** quyết định.
