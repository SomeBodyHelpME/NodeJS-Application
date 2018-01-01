const express = require('express');
const router = express.Router();
const crypto = require('crypto-promise');

const jwt = require('../../module/jwt.js');
const db = require('../../module/pool.js');
const sql = require('../../module/sql.js');

router.get('/notice', async(req, res, next) => {
  let token = req.header.token;
  let test = jwt.verify(token);
  let u_idx = test.u_idx;
  let result = await sql.homeNotice(u_idx);
  res.status(200).send({
    message : "success",
    data : result
  });
});

router.get('/lights', async(req, res, next) => {
  let u_idx = req.query.u_idx;
  let result = await sql.homeLights(u_idx);
  res.status(200).send({
    message : "success",
    data : result
  });
});

router.get('/pick', async(req, res, next) => {
  let u_idx = req.query.u_idx;
  let result = await sql.homePick(u_idx);
  res.status(200).send({
    message : "success",
    data : result
  });
});

router.get('/vote', async(req, res, next) => {
  let u_idx = req.query.u_idx;
  let result = await sql.homeVote(u_idx);
  res.status(200).send({
    message : "success",
    data : result
  });
});

module.exports = router;
