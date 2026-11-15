require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ล้างเครื่องหมายคำพูดและช่องว่างที่อาจติดมากับ Environment Variables
const getCleanToken = () =>
  (process.env.LOG_API_TOKEN || '').replace(/^["']|["']$/g, '').trim();

const getCleanUrl = (url) => (url || '').trim();

// ฟังก์ชันช่วยดึงข้อมูลทั้งหมดจาก Drone Config Server
async function fetchDroneConfig(droneId) {
  const response = await axios.get(getCleanUrl(process.env.CONFIG_URL));
  const raw = response.data;
  const list = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []);
  return list.find((item) => Number(item.drone_id) === Number(droneId));
}

// หน้าแรกสำหรับเช็กสถานะเซิร์ฟเวอร์
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Drone API Server is running' });
});

// 1. GET /configs/:droneId
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
    res.status(500).json({ error: 'Failed to fetch drone config', detail: error.message });
  }
});

// 2. GET /status/:droneId
app.get('/status/:droneId', async (req, res) => {
  try {
    const drone = await fetchDroneConfig(req.params.droneId);
    if (!drone) return res.status(404).json({ error: 'Drone not found' });

    res.json({
      condition: drone.condition,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch drone status', detail: error.message });
  }
});

// 3. GET /logs/:droneId
app.get('/logs/:droneId', async (req, res) => {
  const droneId = Number(req.params.droneId);
  const page = Number(req.query.page) || 1;
  const url = getCleanUrl(process.env.LOG_URL);
  const token = getCleanToken();
  const params = {
    filter: `(drone_id=${droneId})`,
    sort: '-created',
    perPage: 12,
    page: page,
  };

  try {
    let response;
    try {
      response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
    } catch {
      response = await axios.get(url, {
        headers: { Authorization: token },
        params,
      });
    }

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
    res.status(500).json({
      error: 'Failed to fetch drone logs',
      detail: error.response?.data || error.message,
    });
  }
});

// 4. POST /logs
app.post('/logs', async (req, res) => {
  const { drone_id, drone_name, country, celsius } = req.body;
  const url = getCleanUrl(process.env.LOG_URL);
  const token = getCleanToken();

  const payload = {
    drone_id: Number(drone_id),
    drone_name: String(drone_name),
    country: String(country),
    celsius: Number(celsius),
  };

  const authHeaders = [
    { Authorization: `Bearer ${token}` },
    { Authorization: token },
    { token: token },
    { 'api-key': token },
    { 'x-api-key': token },
  ];

  let lastError = null;

  for (const authHeader of authHeaders) {
    try {
      const response = await axios.post(url, payload, {
        headers: {
          ...authHeader,
          'Content-Type': 'application/json',
        },
      });
      return res.status(201).json(response.data);
    } catch (err) {
      lastError = err;
    }
  }

  return res.status(500).json({
    error: 'Failed to create log record',
    receivedBody: req.body,
    sentPayload: payload,
    detail: lastError?.response?.data || lastError?.message,
  });
});

app.listen(PORT, () => {
  console.log(`API Server running on port ${PORT}`);
});