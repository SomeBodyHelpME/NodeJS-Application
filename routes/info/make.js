const express = require('express');
const router = express.Router();
const crypto = require('crypto-promise');

const jwt = require('../../module/jwt.js');
const db = require('../../module/pool.js');
const sql = require('../../module/sql.js');

router.post('/notice', async(req, res, next) => {
  let token = req.headers.token;
  let decoded = jwt.verify(token);
  if(decoded == -1)
  {
    res.status(400).send({
      message : "verification failed"
    })
  }
  else 
  {
      let u_idx = decoded.u_idx;
      let chat_idx = req.body.chat_idx;
      let g_idx = req.body.g_idx;
      let write_time = req.body.write_time;
      let content = req.body.content;
      let result = await sql.makeNotice(u_idx, chat_idx, g_idx, write_time, content);
      res.status(201).send({
          message: "Success Make Notice"
      });
  }
});

router.post('/lights', async(req, res, next) => {
  let token = req.headers.token;
  let decoded = jwt.verify(token);
  if(decoded == -1)
  {
    res.status(400).send({
      message : "verification failed"
    })
  }
  else 
  {
      let u_idx = decoded.u_idx;
      let chat_idx = req.body.chat_idx;
      let g_idx = req.body.g_idx;
      let write_time = 'moment will be used';
      let content = req.body.content;
      let status = req.body.status;
      let userArray = req.body.userArray;
      let result = await sql.makeLights(u_idx, g_idx, status, content, write_time, chat_idx, userArray);

      res.status(201).send({
          message: "Success Make Light"
      });
  }
});

router.post('/pick', async(req, res, next) => {
  let token = req.headers.token;
  let decoded = jwt.verify(token);
  if(decoded == -1)
  {
    res.status(400).send({
      message : "verification failed"
    })
  }
  else 
  {
      let u_idx = decoded.u_idx;
      let chat_idx = req.body.chat_idx;
      let g_idx = req.body.g_idx;
      let write_time = req.body.write_time;
      let content = req.body.content;
      let result = await sql.makePick(u_idx, chat_idx, g_idx, write_time, content);
      
      res.status(201).send({
          message: "Success Make Pick"
      });
  }
});

router.post('/vote', async(req, res, next) => {
  let token = req.headers.token;
  let decoded = jwt.verify(token);
  if(decoded == -1)
  {
    res.status(400).send({
      message : "verification failed"
    })
  }
  else 
  {
      let u_idx = decoded.u_idx;
      let chat_idx = req.body.chat_idx;
      let g_idx = req.body.g_idx;
      let write_time = 'moment will be used';
      let content = req.body.content;
      let title = req.body.title;
      let result = await sql.makeVote(u_idx, chat_idx, g_idx, write_time, content, title);
      
      res.status(201).send({
          message: "Success Make Pick"
      });
  }
});

module.exports = router;