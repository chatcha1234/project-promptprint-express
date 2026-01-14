# คำอธิบายโค้ด Server (`server.js`)

เอกสารนี้จะอธิบายการทำงานของโค้ดฝั่ง Backend (Server) ทีละส่วนเพื่อให้เข้าใจง่ายครับ

## 1. การนำเข้าและตั้งค่า (Imports & Configuration)

```javascript
require("dotenv").config(); // ดึงค่าลับจากไฟล์ .env (เช่น รหัสผ่าน DB)
const express = require("express");
const cors = require("cors"); // อนุญาตให้หน้าเว็บ (Frontend) เชื่อมต่อหาเราได้
const mongoose = require("mongoose"); // ตัวเชื่อมต่อฐานข้อมูล MongoDB
const bcrypt = require("bcryptjs"); // ตัวช่วยเข้ารหัส Password ให้ปลอดภัย
const jwt = require("jsonwebtoken"); // ตัวออกบัตรผ่าน (Token) ให้ User
```

- **หน้าที่**: เตรียมเครื่องมือและ Library ที่จำเป็นทั้งหมดให้พร้อมใช้งาน

## 2. ตั้งค่า Server และ Middleware

```javascript
const app = express();
app.use(cors()); // เปิดประตูให้ React เชื่อมเข้ามาได้
app.use(express.json()); // บอก Server ให้เข้าใจภาษา JSON (เวลาหน้าเว็บส่งข้อมูลมา)
```

## 3. การเชื่อมต่อฐานข้อมูล (Database Connection)

```javascript
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected"))
  ...
```

- **หน้าที่**: ติดต่อไปยัง **MongoDB Atlas (Cloud)** เพื่อเตรียมเก็บข้อมูล โดยใช้รหัสผ่านที่อยู่ในไฟล์ `.env`

## 4. เส้นทาง API (API Endpoints) - หัวใจหลักของระบบ

### A. สมัครสมาชิก (`POST /api/register`)

- **สิ่งที่รับมา**: `username`, `email`, `password`
- **ขั้นตอนการทำงาน**:
  1.  เช็คว่าอีเมลนี้ซ้ำกับคนอื่นไหม?
  2.  **สับรหัสผ่าน (Hash)** ให้เละด้วย `bcrypt` (แปลงจาก "1234" เป็น "$2b$10$...") เพื่อความปลอดภัย
  3.  สร้าง User คนใหม่ลงในฐานข้อมูล
- **ผลลัพธ์**: แจ้งว่า "User created successfully"

### B. เข้าสู่ระบบ (`POST /api/login`)

- **สิ่งที่รับมา**: `email` (หรือ username), `password`
- **ขั้นตอนการทำงาน**:
  1.  ค้นหาคนที่มี email หรือ username ตรงกับที่พิมพ์มา
  2.  **เทียบรหัสผ่าน**: เอารหัสที่พิมพ์สดๆ ไปเทียบกับรหัสที่โดนสับเก็บไว้ใน DB
  3.  ถ้าถูกต้อง -> ออก **Token (บัตรผ่านดิจิทัล)** ให้ User เอาไปใช้
- **ผลลัพธ์**: ส่งข้อมูล User + Token กลับไปให้เก็บไว้ที่หน้าเว็บ

### C. ดึงสินค้า (`GET /api/products`)

- **ขั้นตอน**: ไปกวาดข้อมูลสินค้าทั้งหมดจากฐานข้อมูลออกมา
- **ผลลัพธ์**: รายชื่อสินค้าพร้อมราคาและรูปภาพ

### D. สร้าง Design AI (`POST /api/generate-design`)

- **สถานะ**: (จำลองการทำงานอยู่) รับคำสั่ง (Prompt) มา แล้วตอบกลับด้วยรูปภาพตัวอย่าง และบันทึกคำขอนั้นลงฐานข้อมูล

## 5. เริ่มต้น Server

```javascript
app.listen(PORT, () => { ... });
```

- **หน้าที่**: ปลุก Server ให้ตื่นและรอฟังคำสั่งที่ Port 5000 (หรือตามที่ตั้งไว้)
