const express = require('express');
const router = express.Router();
const crypto = require('crypto-promise');

const jwt = require('../../module/jwt.js');
const db = require('../../module/pool.js');
const sql = require('../../module/sql.js');

router.get('/notice', async(req, res, next) => {
  let g_idx = req.query.g_idx;
  let result = await sql.forEachNotice(g_idx);
  res.status(200).send({
    message : "success",
    data : result
  });
});

router.get('/lights', async(req, res, next) => {
  let u_idx = req.query.u_idx;
  let g_idx = req.query.g_idx;
  let result = await sql.forEachLights(u_idx, g_idx);
  res.status(200).send({
    message : "success",
    data : result
  });
});

router.get('/pick', async(req, res, next) => {
  let u_idx = req.query.u_idx;
  let g_idx = req.query.g_idx;
  let result = await sql.forEachPick(u_idx, g_idx);
  res.status(200).send({
    message : "success",
    data : result
  });
});

router.get('/vote', async(req, res, next) => {
  let u_idx = req.query.u_idx;
  let g_idx = req.query.g_idx;
  let result = await sql.forEachVote(u_idx, g_idx);
  res.status(200).send({
    message : "success",
    data : result
  });
});

module.exports = router;
