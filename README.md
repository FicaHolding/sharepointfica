# 🏢 Fica Holding - SharePoint Document Hub

Hệ thống WebApp Quản trị Tài liệu dạng **Microsoft SharePoint** thông minh dành riêng cho Công ty Tư vấn Tài chính **Fica Holding**, xây dựng trên nền tảng **Next.js (App Router, TypeScript)**, **Tailwind CSS**, và **Supabase (Auth, PostgreSQL, Storage, Realtime)**.

---

## 🌟 Tính Năng Nổi Bật (Key Features)

### 1. 🎨 Giao Diện chuẩn Microsoft SharePoint:
- **Navy Blue Theme**: Hệ màu đặc trưng của các giải pháp doanh nghiệp Microsoft.
- **Topbar Hub**: App Launcher 9 chấm (Waffle icon), Global Search bar thông minh (`Ctrl+K`), chuyển đổi nhanh vai trò phân quyền **RBAC** (`Admin`, `Manager`, `Staff`, `Client`).
- **Sidebar**: Điều hướng phân khu (Trang chủ, Khách hàng Active, Kho Lưu trữ Archived, Báo cáo, Cài đặt) & đồng hồ dung lượng lưu trữ Supabase.
- **View Switcher**: Chuyển đổi linh hoạt giữa **List View** (Bảng chi tiết) & **Grid View** (Thẻ card trực quan).

### 2. 📁 Quản Lý Khách Hàng & Cấu Trúc 4 Thư Mục Tự Động:
- Khởi tạo thư mục cha dạng `[Mã KH] - [Tên KH]` (Ví dụ: `[KH001] - Tập đoàn SunGroup`).
- Engine tự động sinh 4 thư mục con phân loại chuẩn:
  1. `01_Pháp lý & Hợp đồng`
  2. `02_Chứng từ & Báo cáo Tài chính`
  3. `03_Dự án Tư vấn & Kiểm toán`
  4. `04_Báo cáo Nghiệm thu`

### 3. 📦 Chức Năng Archive & Khóa Chỉnh Sửa Read-Only:
- **Archive Hồ sơ**: Chuyển khách hàng hoàn tất dự án sang *"Kho Lưu trữ (Archived Clients)"*.
- **Read-Only Lock**: Tự động kích hoạt banner cảnh báo và khóa toàn bộ quyền tải lên/chỉnh sửa/xóa tài liệu đối với thư mục thuộc khách hàng Archived.
- **Restore Hồ sơ**: Khôi phục lại trạng thái Active nhanh chóng.

### 4. 🧠 Bộ Lọc Metadata Đa Chiều & Version History:
- Lọc đa chiều theo: **Năm tài chính** (2025, 2024, 2023), **Loại dịch vụ** (Kiểm toán, CFO, Tư vấn, Pháp lý, Thuế), **Trạng thái duyệt** (Approved, Pending, Draft), và **Thẻ Tag**.
- **Version History Drawer**: Quản lý lịch sử các phiên bản file (`v1`, `v2`, `v3`), xem ghi chú thay đổi và khôi phục bản cũ.
- **Supabase Realtime**: Tự động đồng bộ trạng thái file & folder theo thời gian thực.

---

## 🚀 Hướng Dẫn Cài Đặt & Vận Hành (Getting Started)

### 1. Yêu cầu hệ thống:
- **Node.js**: v18.x trở lên (khuyên dùng Node v20.x).
- **npm** hoặc **yarn** / **pnpm**.

### 2. Cài đặt các gói phụ thuộc:
```bash
npm install
```

### 3. Cấu hình Biến Môi Trường (`.env.local`):
Tạo file `.env.local` tại thư mục gốc với các thông số Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=https://flcteenudjlmosooxtzh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1...
```

### 4. Khởi tạo Cơ Sở Dữ Liệu trên Supabase:
Mở **Supabase Console -> SQL Editor** và chạy toàn bộ mã SQL trong file:
[`supabase/schema.sql`](file:///e:/WebAPP/SharepointFica/supabase/schema.sql)

Mã SQL này sẽ tự động khởi tạo:
- Các bảng: `profiles`, `clients`, `folders`, `files`, `file_versions`.
- PostgreSQL Trigger tự động tạo 4 subfolders khi thêm Khách hàng mới.
- RLS Security Policies & Supabase Storage Bucket `documents`.
- Kích hoạt Supabase Realtime Engine.

### 5. Khởi chạy ở môi trường Local Development:
```bash
npm run dev
```
Truy cập ứng dụng tại địa chỉ: [http://localhost:3000](http://localhost:3000)

---

## 🌐 Hướng Dẫn Deploy Lên Vercel

1. Push mã nguồn lên **GitHub Repository**.
2. Đăng nhập Vercel -> Bấm **Add New Project** -> Chọn Repository vừa push.
3. Trong phần **Environment Variables**, thêm 2 biến:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Bấm **Deploy**.

---
*© 2026 Fica Holding - Financial Consulting Document Hub.*
