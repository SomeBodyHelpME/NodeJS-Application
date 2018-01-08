const express = require('express');
const router = express.Router();
const crypto = require('crypto-promise');

const jwt = require('../../module/jwt.js');
const db = require('../../module/pool.js');
const sql = require('../../module/sql.js');

router.get('/notice', async(req, res, next) => {
    let g_idx = req.query.g_idx;
    let result = await sql.forEachNotice(g_idx);
    if(!result) {
      res.status(500).send({
        message : "Internal Server Error"
      });
    } else {
      res.status(200).send({
          message : "Success to Load Notices for the Specific Room",
          data : result
      });
    }
});

router.get('/lights', async(req, res, next) => {
    let token = req.headers.token;
    let decoded = jwt.verify(token);
    if(decoded === -1)
    {
        res.status(400).send({
            message : "Verification Failed"
        });
    }
    else{
        let u_idx = decoded.u_idx;
        let g_idx = req.query.g_idx;
        let result = await sql.forEachLights(u_idx, g_idx);
        if(!result) {
          res.status(500).send({
            message : "Internal Server Error"
          });
        } else {
          res.status(200).send({
            message : "Success to Load Lights for the Specific Room",
            data : result
          });
        }
    }
});

router.get('/lights/res/:g_idx/:light_idx', async(req, res, next) => {
  let token = req.headers.token;
  let decoded = jwt.verify(token);
  if(decoded === -1) {
    res.status(400).send({
      message : "Verification Failed"
    });
  } else {
    let u_idx = decoded.u_idx;
    let g_idx = req.params.g_idx;
    let light_idx = req.params.light_idx;

    let result = await sql.forEachLightsResponse(u_idx, g_idx, light_idx);
    if(!result) {
      res.status(500).send({
        message : "Internal Server Error"
      });
    } else {
      res.status(200).send({
        message : "Success to Load Lights Response",
        data : result
      });
    }
  }
});

router.get('/pick', async(req, res, next) => {
    let token = req.headers.token;
    let decoded = jwt.verify(token);
    if(decoded === -1)
    {
        res.status(400).send({
            message : "Verification Failed"
        });
    } else {
        let u_idx = decoded.u_idx;
        let g_idx = req.query.g_idx;
        let result = await sql.forEachPick(u_idx, g_idx);
        if(!result) {
          res.status(500).send({
            message : "Internal Server Error"
          });
        } else {
          res.status(200).send({
              message : "Success to Load Picks for the Specific Room",
              data : result
          });
        }
    }
});

router.get('/vote', async(req, res, next) => {
    let token = req.headers.token;
    let decoded = jwt.verify(token);
    if(decoded === -1)
    {
        res.status(400).send({
            message : "Verification Failed"
        });
    } else {
        let u_idx = decoded.u_idx;
        let g_idx = req.query.g_idx;
        let result = await sql.forEachVote(u_idx, g_idx);
        if(!result) {
          res.status(500).send({
            message : "Internal Server Error"
          });
        } else {
          res.status(200).send({
              message : "Success to Load Votes for the Specific Room",
              data : result
          });
        }
    }
});

router.get('/vote/res/:g_idx/:vote_idx', async(req, res, next) => {
  let token = req.headers.token;
  let decoded = jwt.verify(token);
  if(decoded === -1) {
    res.status(400).send({
      message : "Verification Failed"
    });
  } else {
    let u_idx = decoded.u_idx;
    let g_idx = req.params.g_idx;
    let vote_idx = req.params.vote_idx;

    let result = await sql.forEachVoteResponse(u_idx, g_idx, vote_idx);
    if(!result) {
      res.status(500).send({
        message : "Internal Server Error"
      });
    } else {
      res.status(200).send({
        message : "Success to Load Vote Response",
        data : result
      });
    }
  }
});

module.exports = router;
