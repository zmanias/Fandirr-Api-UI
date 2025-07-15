/* eslint-disable no-console */
const express = require('express');
const cors    = require('cors');

module.exports = function(app) {

/* ─────────────────────────────────────────────
   Util: Deteksi operator berdasarkan prefix
──────────────────────────────────────────────*/
function detectOperator(numIntl) {
  const prefix = numIntl.replace('+62', '').slice(0, 3);

  if (/^(811|812|813|821|822|823|851|852|853|858)$/.test(prefix)) return 'Telkomsel';
  if (/^(814|815|816|855|856|857|859|895|896|897|898|899)$/.test(prefix)) return 'Indosat / Tri';
  if (/^(817|818|819|877|878)$/.test(prefix))                      return 'XL Axiata';
  if (/^(831|832|833|838)$/.test(prefix))                          return 'AXIS';
  if (/^(881|882|883|884|885|886|887|888|889)$/.test(prefix))      return 'Smartfren';

  return 'Tidak diketahui';
}

/* ─────────────────────────────────────────────
   Endpoint  GET /api/cek/number?number=08123...
──────────────────────────────────────────────*/
app.get('/stalk/ceknomer', (req, res) => {
  let { number } = req.query;
  if (!number) {
    return res.status(400).json({ status:false, message:'Parameter "number" wajib diisi.' });
  }

  // normalisasi: buang non-digit, ubah 0XXXXXXXX → +62XXXXXXXX
  number = number.replace(/\D/g, '');
  if (number.startsWith('0')) number = '62' + number.slice(1);

  if (!number.startsWith('62')) {
    return res.json({ status:false, message:'Deteksi hanya untuk nomor Indonesia (+62).' });
  }

  const intl     = '+' + number;
  const operator = detectOperator(intl);

  res.json({
    status   : true,
    number   : intl,
    operator,
    message  : `Nomor tersebut terdeteksi sebagai kartu ${operator}.`
  });
});
}