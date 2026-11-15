# 🛸 Drone API Server (SPANNER)

RESTful API Server สำหรับเป็นตัวกลางเชื่อมต่อข้อมูลจำเพาะ สถานะ และบันทึกอุณหภูมิของโดรน (Drone ID: `67010177`) ระหว่าง Drone Config / Log Server กลาง กับหน้าเว็บ Client

- **Live API Server (Render):** `https://drone-api-spanner.onrender.com`
- **Target Drone ID:** `67010177` (Spanner)

---

## 🔌 API Endpoints

| Method | Endpoint | คำอธิบายการทำงาน |
| :--- | :--- | :--- |
| `GET` | `/configs/:droneId` | ดึงข้อมูลสเปกของโดรน (`drone_id`, `drone_name`, `light`, `country`) |
| `GET` | `/status/:droneId` | ดึงสถานะความพร้อมทำงานปัจจุบันของโดรน (`condition`) |
| `GET` | `/logs/:droneId?page=1` | ดึงประวัติอุณหภูมิเรียงจากล่าสุด แบ่งหน้าละ 12 รายการ (Pagination) |
| `POST` | `/logs` | บันทึกข้อมูลอุณหภูมิใหม่ (`drone_id`, `drone_name`, `country`, `celsius`) |

---

## 🛠️ การติดตั้งและรันในเครื่อง (Local Setup)

1. ติดตั้ง Dependencies:
   ```bash
   npm install
   ```
2. สร้างไฟล์ `.env` ที่โฟลเดอร์หลักของโปรเจกต์ และระบุค่า Environment Variables:
   ```env
   PORT=3000
   CONFIG_SERVER_URL=[https://script.google.com/macros/s/AKfycbzwclqJRodyVjzYyY-NTQDb9cWG6Hoc5vGAABVtr5-jPA_ET_2IasrAJK4aeo5XoONiaA/exec](https://script.google.com/macros/s/AKfycbzwclqJRodyVjzYyY-NTQDb9cWG6Hoc5vGAABVtr5-jPA_ET_2IasrAJK4aeo5XoONiaA/exec)
   LOG_SERVER_URL=[https://app-tracking.pockethost.io/api/collections/drone_logs/records](https://app-tracking.pockethost.io/api/collections/drone_logs/records)
   LOG_API_TOKEN=your_secret_token_here
   ```
3. รันเซิร์ฟเวอร์:
   ```bash
   npm start
   ```