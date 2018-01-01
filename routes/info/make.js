const express = require('express');
const router = express.Router();
const crypto = require('crypto-promise');

const jwt = require('../../module/jwt.js');
const db = require('../../module/pool.js');
const sql = require('../../module/sql.js');

router.post('/register/notice', async(req, res, next) => {
  let u_idx = req.body.u_idx;
  let chat_idx = req.body.chat_idx;
  let g_idx = req.body.g_idx;
  let write_time = '';
  let content = req.body.content;

  let result = await sql.makeNotice(u_idx, chat_idx, g_idx, write_time, content);
  res.status(201).send({
    message : "Success Add Notice"
  });

});

router.post('/register/lights', async(req, res, next) => {
  let u_idx = req.body.u_idx;
  let g_idx = req.body.g_idx;
  let status = req.body.status;
  let content = req.body.content;
  let userArray = [];

  let write_time = '';
  let chat_idx = req.body.chat_idx;

  let result = await sql.makeNotice(u_idx, g_idx, status, content, userArray, write_time, chat_idx);
  res.status(201).send({
    message : "Success Add Lights"
  });

});

router.post('/register/pick', async(req, res, next) => {
  let u_idx = req.body.u_idx;
  let chat_idx = req.body.chat_idx;
  let g_idx = req.body.g_idx;
  let write_time = '';
  let content = req.body.content;

  let result = await sql.makeNotice(u_idx, chat_idx, g_idx, write_time, content);
  res.status(201).send({
    message : "Success Add Pick"
  });
});

router.post('/register/vote', async(req, res, next) => {
  let u_idx = req.body.u_idx;
  let chat_idx = req.body.chat_idx;
  let g_idx = req.body.g_idx;
  let write_time = '';
  let content = req.body.content;

  let result = await sql.makeNotice(u_idx, chat_idx, g_idx, write_time, content);
});


module.exports = router;
