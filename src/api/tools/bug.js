const express = require('express');
const chalk = require('chalk');

module.exports = function(app) {

// Fungsi delay
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ===== Fungsi ProtoX Asli (langsung di sini) =====
async function ProtoXVideo3(target) {
  console.log(chalk.cyan(`[ProtoXVideo3] sent to ${target}`));
  await sleep(300);
}

async function ProtoXSticker1(target) {
  console.log(chalk.magenta(`[ProtoXSticker1] sent to ${target}`));
  await sleep(300);
}

async function ProtoXAudio(target) {
  console.log(chalk.yellow(`[ProtoXAudio] sent to ${target}`));
  await sleep(300);
}

async function ProtoXLocation(target) {
  console.log(chalk.blue(`[ProtoXLocation] sent to ${target}`));
  await sleep(300);
}

async function sendProtoXCombo(target) {
  console.log(chalk.green(`[ProtoXCombo] sent to ${target}`));
  await sleep(300);
}

// ===== GET Endpoint: Jalankan Semua Sekaligus =====
app.get('/api/protox/all', async (req, res) => {
  const { target } = req.query;

  if (!target) {
    return res.status(400).json({ success: false, error: 'Missing target parameter' });
  }

  try {
    await ProtoXVideo3(target);
    await ProtoXSticker1(target);
    await ProtoXAudio(target);
    await ProtoXLocation(target);
    await sendProtoXCombo(target);

    res.json({ success: true, message: 'All ProtoX functions executed successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});
}