# TKWedNC-CK

Nền tảng kết nối **trường đại học - sinh viên - doanh nghiệp** cho tuyển dụng,
thực tập và các chương trình định hướng nghề nghiệp.

## 1. Tổng quan

Đây là monorepo gồm:

- **Backend:** Node.js, Express 5, MySQL, session authentication.
- **Frontend:** React 19, Vite, React Router, Axios.
- **Database:** MySQL local hoặc Aiven MySQL qua SSL/TLS.

### Vai trò

| Vai trò | Chức năng chính |
|---|---|
| `Student` | Quản lý hồ sơ/CV, tìm việc, ứng tuyển, tham gia chương trình |
| `Employer` | Quản lý hồ sơ, đăng tin, xử lý ứng viên, tham gia chương trình |
| `SchoolStaff` | Quản lý doanh nghiệp của trường, xác minh, tạo chương trình, xem thống kê |
| `Admin` | Quản lý tài khoản, dữ liệu, báo cáo và thống kê toàn hệ thống |

`Student` và `Employer` được đăng ký công khai. `SchoolStaff` và `Admin` phải
được cấp bởi Admin.

## 2. Cấu trúc dự án

```text
TKWedNC-CK/
├── backend/
│   ├── server.js
│   ├── package.json
│   └── src/
│       ├── config/          # Kết nối MySQL
│       ├── controllers/     # HTTP routes
│       ├── services/        # Logic nghiệp vụ
│       ├── models/          # Truy vấn SQL
│       ├── validators/      # Kiểm tra dữ liệu
│       └── middleware/      # Authentication/RBAC
├── frontend/
│   ├── package.json
│   └── src/
│       ├── api/             # Axios client
│       ├── components/      # Thành phần dùng chung
│       ├── context/         # Auth state
│       └── pages/           # Các màn hình
├── .env.example
├── package.json
└── README.md
```

Các file `.env`, `backend/src/config/ca.pem`, `node_modules/` và `dist/` là
file cục bộ/được sinh tự động, không commit lên Git.

## 3. Chức năng hiện có

- Đăng ký, đăng nhập, đăng xuất bằng session cookie.
- Xác minh email và khôi phục mật khẩu bằng token dùng một lần.
- Phân quyền bốn role ở backend.
- Sinh viên tạo/cập nhật hồ sơ và quản lý CV PDF/DOC/DOCX tối đa 5 MB.
- Doanh nghiệp tạo hồ sơ, gửi yêu cầu xác minh và theo dõi kết quả.
- Doanh nghiệp đã xác minh được tạo và quản lý tin tuyển dụng.
- Sinh viên tìm kiếm, lọc, xem tin và ứng tuyển; hệ thống chống ứng tuyển trùng.
- Doanh nghiệp xử lý trạng thái hồ sơ ứng tuyển và gửi thông báo cho sinh viên.
- Nhà trường xác minh/thu hồi doanh nghiệp và quản lý chương trình kết nối.
- Sinh viên/doanh nghiệp đăng ký tham gia chương trình.
- Thông báo nội bộ, audit log và scheduler tự chuyển job quá hạn.
- Admin xử lý báo cáo tin tuyển dụng và xem thống kê tổng quan.

## 4. Chuẩn bị môi trường

Yêu cầu:

- Node.js 18+ và npm.
- MySQL 8+ hoặc Aiven MySQL.
- Git.

### Cài dependencies

Chạy tại thư mục gốc:

```bash
npm install
npm install --prefix backend
npm install --prefix frontend
```

### Cấu hình `.env`

```bash
cp .env.example .env
```

Điền các biến cần thiết trong `.env` tại thư mục gốc:

```env
SESSION_KEY=replace_with_a_long_random_value
COOKIE_SECRET=replace_with_another_long_random_value

FRONTEND_PORT=5173
BACKEND_PORT=3000
FRONTEND_URL=http://localhost:5173

DB_HOST=your-mysql-host
DB_PORT=3306
DB_USER=your-mysql-user
DB_NAME=JOBRECRUITMENT
DB_PASSWORD=your-mysql-password
DB_SSL=false
```

Với Aiven:

```env
DB_HOST=your-aiven-host
DB_PORT=your-aiven-port
DB_USER=avnadmin
DB_NAME=your-database-name
DB_PASSWORD=your-aiven-password
DB_SSL=true
```

Đặt CA certificate Aiven tại `backend/src/config/ca.pem`. Không đưa password,
`.env` hoặc `ca.pem` lên Git.

### SMTP Gmail (tùy chọn)

Muốn gửi email xác minh/khôi phục thật, hãy bật 2FA Gmail và tạo **App
Password**, sau đó thêm:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-address@gmail.com
SMTP_PASSWORD=your-gmail-app-password
SMTP_FROM=your-address@gmail.com
```

Nếu chưa cấu hình SMTP ở development, liên kết dùng một lần sẽ được in trong
log backend với tiền tố `[EMAIL DEV]`. Production bắt buộc phải cấu hình SMTP.

## 5. Database

### Cài mới hoặc reset dữ liệu mẫu

`backend/src/reset_and_create.sql` xóa schema và dữ liệu hiện tại rồi tạo lại
toàn bộ bảng cùng dữ liệu mẫu. Chỉ chạy khi đã sao lưu:

```bash
mysql -h <DB_HOST> -P <DB_PORT> -u <DB_USER> -p <DB_NAME> \
  < backend/src/reset_and_create.sql
```

Nếu script có dòng `USE JOBRECRUITMENT;`, hãy đổi cho khớp với `DB_NAME` hoặc
chọn đúng database trước khi chạy.

### Nâng cấp database đang có dữ liệu

Không chạy reset script. Chạy các migration theo thứ tự:

```bash
mysql -h <DB_HOST> -P <DB_PORT> -u <DB_USER> -p <DB_NAME> \
  < backend/src/migration_auth.sql
mysql -h <DB_HOST> -P <DB_PORT> -u <DB_USER> -p <DB_NAME> \
  < backend/src/migration_school_employers.sql
mysql -h <DB_HOST> -P <DB_PORT> -u <DB_USER> -p <DB_NAME> \
  < backend/src/migration_moderation.sql
```

Các migration dùng để bổ sung xác minh email/đặt lại mật khẩu, liên kết
trường-doanh nghiệp và báo cáo nội dung. Mỗi migration chỉ chạy một lần trên
mỗi database.

## 6. Chạy server

### Chạy cả backend và frontend (khuyến nghị)

```bash
npm run dev
```

Địa chỉ truy cập:

- Frontend: <http://localhost:5173>
- Backend API: <http://localhost:3000>

### Chạy riêng

```bash
# Backend
npm run dev --prefix backend

# Frontend
npm run dev --prefix frontend
```

### Build frontend

```bash
npm run build
```

Kiểm tra nhanh:

```bash
curl -I http://localhost:5173/
curl -i http://localhost:3000/auth/me
```

Frontend trả `200`. Backend trả `401` khi chưa đăng nhập là đúng hành vi.

## 7. Tài khoản dữ liệu mẫu

Các tài khoản này chỉ dành cho development và được tạo bởi
`reset_and_create.sql`:

| Username | Role | Mục đích |
|---|---|---|
| `admin` | `Admin` | Quản trị hệ thống |
| `school.staff.01` | `SchoolStaff` | Quản lý trường/xác minh |
| `employer.acme` | `Employer` | Quản lý doanh nghiệp |
| `student.an` | `Student` | Hồ sơ và ứng tuyển |

Mật khẩu mẫu: `ChangeMe123!`. Hãy đổi ngay khi triển khai thật.

## 8. Frontend routes chính

| Route | Vai trò |
|---|---|
| `/login`, `/register` | Public |
| `/dashboard`, `/profile`, `/security` | Tất cả role |
| `/jobs`, `/jobs/new`, `/jobs/:id/edit` | Employer, Admin |
| `/jobs/browse`, `/candidate/applications` | Student |
| `/employer/company`, `/employer/applications` | Employer |
| `/programs` | Tất cả role đã đăng nhập |
| `/verification-requests` | SchoolStaff, Admin |
| `/applications`, `/employers`, `/candidates`, `/users` | Admin |
| `/notifications` | Tất cả role đã đăng nhập |

## 9. API chính

Các route nghiệp vụ yêu cầu session cookie, ngoại trừ các route auth công khai
như đăng ký, đăng nhập, xác minh email và khôi phục mật khẩu:

| Nhóm | Endpoint chính |
|---|---|
| Auth | `/auth/register`, `/auth/login`, `/auth/logout`, `/auth/me`, `/auth/verify-email`, `/auth/forgot-password` |
| Employer | `/employers`, `/verification-requests` |
| Job | `/jobs`, `/jobs/:id` |
| Application | `/applications`, `/applications/:id` |
| Student/CV | `/candidates`, `/cvs` |
| Programs | `/programs`, `/programs/:id/register`, `/programs/:id/join` |
| Notifications | `/notifications`, `/notifications/read-all` |
| Admin | `/users`, `/audit-logs`, `/content-reports` |
| Statistics | `/statistics/system`, `/statistics/school`, `/programs/statistics` |

Ví dụ đăng ký:

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"student.test","email":"student.test@example.com","password":"ChangeMe123!","role":"Student"}'
```

Ví dụ đăng nhập và giữ session:

```bash
curl -c cookies.txt -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"student.an","password":"ChangeMe123!"}'

curl -b cookies.txt http://localhost:3000/auth/me
```

## 10. Phần đang hoàn thiện

- Form giao diện Admin tạo/sửa tài khoản `Admin` và `SchoolStaff`.
- Giao diện đầy đủ để sửa, đóng và quản lý chương trình kết nối.
- Màn hình quản lý liên kết doanh nghiệp theo từng trường.
- Trang chi tiết doanh nghiệp công khai cho sinh viên.
- Phân trang/lọc đồng bộ trên mọi màn hình.
- Bộ lọc thời gian và biểu đồ thống kê nâng cao.
- Báo cáo nội dung ngoài tin tuyển dụng.
- RBAC động thay cho bốn role cố định.

## 11. Lưu ý bảo mật

- Không commit `.env`, mật khẩu database, Gmail App Password hoặc `ca.pem`.
- Đổi toàn bộ mật khẩu mẫu trước khi triển khai.
- Dùng `SESSION_KEY` và `COOKIE_SECRET` ngẫu nhiên, đủ dài.
- Sao lưu database trước khi chạy `reset_and_create.sql` hoặc migration.
- Production phải dùng HTTPS và SMTP thật.
