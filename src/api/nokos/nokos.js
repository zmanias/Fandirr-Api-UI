const express = require('express');
const axios = require('axios');

module.exports = function(app) {

const VIRTUSIM_API_URL = 'https://virtusim.com/api/v2/json.php';

// --- FUNGSI UTAMA ---
async function callVirtusimAPI(params) {
  try {
    const response = await axios.get(VIRTUSIM_API_URL, { params });
    return response.data;
  } catch (error) {
    const status = error.response ? error.response.status : 500;
    const message = error.response ? error.response.data : { msg: 'Gagal menghubungi server provider.' };
    throw { status, message };
  }
}

// --- MIDDLEWARE ---
const checkApiKey = (req, res, next) => {
  if (!req.query.api_key) {
    return res.status(401).json({ status: false, data: { msg: 'Parameter "api_key" wajib diisi.' } });
  }
  next();
};

app.use(checkApiKey); // Terapkan middleware ke semua request

// --- ROUTERS ---

// Router untuk semua yang berhubungan dengan Akun
const accountRouter = express.Router();

accountRouter.get('/nokos/balance', async (req, res) => {
  try {
    const data = await callVirtusimAPI({ ...req.query, action: 'balance' });
    res.json(data);
  } catch (err) {
    res.status(err.status).json(err.message);
  }
});

accountRouter.get('/nokos/balance-logs', async (req, res) => {
  try {
    const data = await callVirtusimAPI({ ...req.query, action: 'balance_logs' });
    res.json(data);
  } catch (err) {
    res.status(err.status).json(err.message);
  }
});

accountRouter.get('/nokos/recent-activity', async (req, res) => {
  try {
    const data = await callVirtusimAPI({ ...req.query, action: 'recent_activity' });
    res.json(data);
  } catch (err) {
    res.status(err.status).json(err.message);
  }
});


// Router untuk semua yang berhubungan dengan Layanan (Service)
const servicesRouter = express.Router();

servicesRouter.get('/', async (req, res) => {
    try {
        const data = await callVirtusimAPI({ ...req.query, action: 'services' });
        res.json(data);
    } catch (err) {
        res.status(err.status).json(err.message);
    }
});

servicesRouter.get('/nokos/countries', async (req, res) => {
    try {
        const data = await callVirtusimAPI({ ...req.query, action: 'get_countries' });
        res.json(data);
    } catch (err) {
        res.status(err.status).json(err.message);
    }
});

servicesRouter.get('/nokos/operators', async (req, res) => {
    try {
        const data = await callVirtusimAPI({ ...req.query, action: 'get_operators' });
        res.json(data);
    } catch (err) {
        res.status(err.status).json(err.message);
    }
});


// Router untuk semua yang berhubungan dengan Pesanan (Order/Transaction)
const orderRouter = express.Router();

orderRouter.get('/', async (req, res) => {
  const { service, operator } = req.query;
  if (!service || !operator) {
    return res.status(400).json({ status: false, data: { msg: 'Parameter "service" dan "operator" wajib diisi.' } });
  }
  try {
    const data = await callVirtusimAPI({ ...req.query, action: 'order' });
    res.json(data);
  } catch (err) {
    res.status(err.status).json(err.message);
  }
});

orderRouter.get('/nokos/:id', async (req, res) => {
  try {
    const data = await callVirtusimAPI({ ...req.query, action: 'status', id: req.params.id });
    res.json(data);
  } catch (err) {
    res.status(err.status).json(err.message);
  }
});

orderRouter.get('/nokos/:id/set-status', async (req, res) => {
  if (!req.query.status) {
    return res.status(400).json({ status: false, data: { msg: 'Parameter "status" wajib diisi.' } });
  }
  try {
    const data = await callVirtusimAPI({ ...req.query, action: 'set_status', id: req.params.id });
    res.json(data);
  } catch (err) {
    res.status(err.status).json(err.message);
  }
});

orderRouter.get('/nokos/:id/get-sms', async (req, res) => {
  try {
    const data = await callVirtusimAPI({ ...req.query, action: 'get_sms', id: req.params.id });
    res.json(data);
  } catch (err) {
    res.status(err.status).json(err.message);
  }
});


// --- MOUNT ROUTERS ---
app.use('/account', accountRouter);
app.use('/services', servicesRouter);
app.use('/order', orderRouter);
}