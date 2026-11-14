require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ฟังก์ชันช่วยดึงข้อมูลทั้งหมดจาก Drone Config Server
async function fetchDroneConfig(droneId) {
  const response = await axios.get(process.env.CONFIG_URL);
  const raw = response.data;
  const list = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []);
  return list.find((item) => Number(item.drone_id) === Number(droneId));
}

// 1. GET /configs/:droneId -> ส่งกลับเฉพาะ 5 ฟิลด์ตามโจทย์
app.get('/configs/:droneId', async (req, res) => {
  try {
    const drone = await fetchDroneConfig(req.params.droneId);
    if (!drone) return res.status(404).json({ error: 'Drone not found' });

    res.json({
      drone_id: Number(drone.drone_id),
      drone_name: drone.drone_name,
      light: drone.light,
      country: drone.country,
      weight: Number(drone.weight),
    });
  } catch (error) {
    console.error('CONFIG ERROR:', error.message);
    res.status(500).json({ error: 'Failed to fetch drone config', detail: error.message });
  }
});

// 2. GET /status/:droneId -> ส่งกลับเฉพาะ condition
app.get('/status/:droneId', async (req, res) => {
  try {
    const drone = await fetchDroneConfig(req.params.droneId);
    if (!drone) return res.status(404).json({ error: 'Drone not found' });

    res.json({
      condition: drone.condition,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch drone status' });
  }
});

// 3. GET /logs/:droneId -> ดึง Logs เรียงล่าสุดขึ้นก่อน จำกัด 12 รายการ + รองรับ Pagination (?page=1)
app.get('/logs/:droneId', async (req, res) => {
  try {
    const droneId = Number(req.params.droneId);
    const page = Number(req.query.page) || 1;

    const response = await axios.get(process.env.LOG_URL, {
      headers: {
        Authorization: `Bearer ${process.env.LOG_API_TOKEN}`,
      },
      params: {
        filter: `(drone_id=${droneId})`,
        sort: '-created',
        perPage: 12,
        page: page,
      },
    });

    const items = response.data.items || [];
    const formattedLogs = items.map((log) => ({
      drone_id: Number(log.drone_id),
      drone_name: log.drone_name,
      created: log.created,
      country: log.country,
      celsius: Number(log.celsius),
    }));

    res.json(formattedLogs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch drone logs' });
  }
});

// 4. POST /logs -> รับข้อมูลจากหน้าเว็บแล้วส่งต่อไปสร้าง Record ใหม่
app.post('/logs', async (req, res) => {
  try {
    const { drone_id, drone_name, country, celsius } = req.body;

    const payload = {
      drone_id: Number(drone_id),
      drone_name,
      country,
      celsius: Number(celsius),
    };

    const response = await axios.post(process.env.LOG_URL, payload, {
      headers: {
        Authorization: `Bearer ${process.env.LOG_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    res.status(201).json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create log record' });
  }
});

app.listen(PORT, () => {
  console.log(`API Server running on port ${PORT}`);
});