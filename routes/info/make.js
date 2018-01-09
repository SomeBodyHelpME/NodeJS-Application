const express = require('express');
const router = express.Router();
const crypto = require('crypto-promise');
const moment = require('moment');

const jwt = require('../../module/jwt.js');
const db = require('../../module/pool.js');
const sql = require('../../module/sql.js');

router.post('/notice', async(req, res, next) => {
    let token = req.headers.token;
    let decoded = jwt.verify(token);
    if (decoded === -1) {
        res.status(400).send({
            message : "Verification Failed"
        });
    } else {
        let u_idx = decoded.u_idx;
        let chat_idx = req.body.chat_idx;
        let g_idx = req.body.g_idx;
        let content = req.body.content;
        let write_time;
        if(req.body.write_time === undefined) {
           write_time = moment().format("YYYY-MM-DD HH:mm:ss");
        } else {
          write_time = req.body.write_time;
        }
        let result = await sql.makeNotice(u_idx, chat_idx, g_idx, write_time, content);
        if(!result) {
          res.status(500).send({
            message : "Internal Server Error"
          });
        } else {
          res.status(201).send({
              message : "Success Make Notice"
          });
        }
    }
});

router.post('/lights', async(req, res, next) => {
    let token = req.headers.token;
    let decoded = jwt.verify(token);
    if (decoded === -1) {
        res.status(400).send({
            message : "Verification Failed"
        });
    } else {
        let u_idx = decoded.u_idx;
        let chat_idx = req.body.chat_idx;
        let g_idx = req.body.g_idx;
        let write_time = moment().format("YYYY-MM-DD HH:mm:ss");
        let content = req.body.content;
        let open_status = req.body.open_status;
        let entire_status = req.body.entire_status;
        let userArray = req.body.userArray;

        let result = await sql.makeLights(u_idx, g_idx, open_status, entire_status, content, write_time, chat_idx, userArray);
        if(!result) {
          res.status(500).send({
            message : "Internal Server Error"
          });
        } else {
          res.status(201).send({
              message : "Success Make Lights"
          });
        }
    }
});

router.post('/pick', async(req, res, next) => {
    let u_idx = req.body.u_idx;
    let chat_idx = req.body.chat_idx;
    let g_idx = req.body.g_idx;
    let write_time = req.body.write_time;
    let content = req.body.content;
    let result = await sql.makePick(u_idx, chat_idx, g_idx, write_time, content);
    if(!result) {
      res.status(500).send({
        message : "Internal Server Error"
      });
    } else {
      res.status(201).send({
          message: "Success Make Pick"
      });
    }

});

router.post('/vote', async(req, res, next) => {
    let token = req.headers.token;
    let decoded = jwt.verify(token);
    if (decoded === -1) {
        res.status(400).send({
            message: "Verification Failed"
        });
    } else {
        let u_idx = decoded.u_idx;
        let chat_idx = req.body.chat_idx;
        let g_idx = req.body.g_idx;
        let write_time = moment().format("YYYY-MM-DD HH:mm:ss");
        let content = req.body.content;
        let title = req.body.title;
        let result = await sql.makeVote(u_idx, chat_idx, g_idx, write_time, content, title);
        if(!result) {
          res.status(500).send({
            message : "Internal Server Error"
          });
        } else {
          res.status(201).send({
              message: "Success Make Vote"
          });
        }
    }
});

module.exports = router;
