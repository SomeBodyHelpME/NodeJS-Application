const express = require('express');
const router = express.Router();
const crypto = require('crypto-promise');
const moment = require('moment');

// FCM
const FCM = require('fcm-node');
const serverKey = require('../../config/serverKey').key;
const fcm = new FCM(serverKey);

const statuscode = require('../../module/statuscode.js');
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
    let notice_idx = req.body.notice_idx;

    let result = await sql.actionNotice(u_idx, notice_idx);
    if(!result) {
      res.status(500).send({
        message : "Internal Server Error"
      });
    } else {
      res.status(201).send({
        message : "Success Response Notice"
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
        let light_idx = req.body.light_idx;
        let color = req.body.color;
        let content = req.body.content;
        let write_time = moment().format("YYYY-MM-DD HH:mm:ss");

        let result = await sql.actionLights(u_idx, light_idx, color, content, write_time);
        if(!result) {
          res.status(500).send({
            message : "Internal Server Error"
          });
        } else {
          res.status(201).send({
              message : "Success Response Lights"
          });
        }
    }
});

router.post('/vote', async(req, res, next) => {
    let token = req.headers.token;
    let decoded = jwt.verify(token);
    if (decoded === -1) {
        res.status(400).send({
            message : "Verification Failed"
        });
    } else {
        let u_idx = decoded.u_idx;
        let vote_idx = req.body.vote_idx;
        let value = req.body.value;

        console.log("vote_idx : " + vote_idx);
        console.log("value : " + value);
        let write_time = moment().format("YYYY-MM-DD HH:mm:ss");
        let result = await sql.actionVote(u_idx, vote_idx, value, write_time);
        if(!result) {
          res.status(500).send({
            message : "Internal Server Error"
          });
        } else {
          res.status(201).send({
              message : "Success Response Vote"
          });
        }
    }
});

router.post('/press', async(req, res, next) => {
  let g_idx = req.body.g_idx;
  let vote_idx = req.body.vote_idx;

  let findUnvotedUserQuery = 'SELECT u_idx FROM chat.vote_response WHERE vote_idx = ? AND g_idx = ? AND status = ?';
  let findUnvotedUser = await db.queryParamCnt_Arr(findUnvotedUserQuery, [vote_idx, g_idx, 0]);
  console.log('findUnvotedUser', findUnvotedUser);
  for(let i = 0 ; i < findUnvotedUser.length ; i++) {
    let findUserTokenQuery = 'SELECT token FROM chat.user WHERE u_idx = ?';
    let findUserToken = await db.queryParamCnt_Arr(findUserTokenQuery, [findUnvotedUser[i].u_idx]);
    let client_token = findUserToken[0].token;
    console.log(client_token);
    var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
        to: client_token,
        // notification: {
        //     title: '팀플의 요정',   //제목
        //     body: '투표 해주세요!!'  //보낼메시지
        // },
        data: {
          data : statuscode.votePush
        }
    };
    console.log(findUnvotedUser[i]);
    fcm.send(message, function(err, response) {
      if(err) {
        console.log("Something has gone wrong!", err);
        res.status(500).send({
          message : "Internal Server Error"
        });
      } else {
        console.log("Successfully sent with response: ", response);
        res.status(201).send({
          message : "Success to Send Message"
        });
      }
    });//fcm.send
  }
});

router.get('/close/:g_idx/:vote_idx', async(req, res, next) => {
  let token = req.headers.token;
  let decoded = jwt.verify(token);
  if (decoded === -1) {
      res.status(400).send({
          message : "Verification Failed"
      });
  } else {
    let u_idx = decoded.u_idx;
    let g_idx = req.params.g_idx;
    let vote_idx = req.params.vote_idx;

    let result = await sql.closeVote(u_idx, g_idx, vote_idx);
    if(!result) {
      res.status(500).send({
        message : "Internal Server Error"
      });
    } else {
      res.status(200).send({
        message : "Success Close"
      });
    }
  }
});

module.exports = router;
