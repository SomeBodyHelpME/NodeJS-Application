const express = require('express');
const router = express.Router();
const crypto = require('crypto-promise');

const jwt = require('../../module/jwt.js');
const db = require('../../module/pool.js');
const sql = require('../../module/sql.js');

router.get('/notice', async(req, res, next) => {
    let token = req.headers.token;
    let decoded = jwt.verify(token);
    if (decoded === -1) {
        res.status(400).send({
            message : "Verification Failed"
        });
    } else {
        let u_idx = decoded.u_idx;
        let result = await sql.homeNotice(u_idx);
        if(!result) {
          res.status(500).send({
            message : "Internal Server Error"
          });
        } else {
          res.status(200).send({
              message : "Success to Load All Notices",
              data : result
          });
        }
    }
});

router.get('/lights/res', async(req, res, next) => {
    let token = req.headers.token;
    let decoded = jwt.verify(token);
    if (decoded === -1) {
        res.status(400).send({
            message : "Verification Failed"
        });
    } else {
        let u_idx = decoded.u_idx;
        let result = await sql.homeLightsResponse(u_idx);
        if(!result) {
          res.status(500).send({
            message : "Internal Server Error"
          });
        } else {
          res.status(200).send({
              message : "Success to Load All Lights Response",
              data : result
          });
        }
    }
});

router.get('/lights/req', async(req, res, next) => {
    let token = req.headers.token;
    let decoded = jwt.verify(token);
    if (decoded === -1) {
        res.status(400).send({
            message : "Verification Failed"
        });
    } else {
        let u_idx = decoded.u_idx;
        let result = await sql.homeLightsRequest(u_idx);
        if(!result) {
          res.status(500).send({
            message : "Internal Server Error"
          });
        } else {
          res.status(200).send({
              message : "Success to Load All Lights Request",
              data : result
          });
        }
    }
});

router.get('/pick', async(req, res, next) => {
    let token = req.headers.token;
    let decoded = jwt.verify(token);
    if (decoded === -1) {
        res.status(400).send({
            message : "Verification Failed"
        });
    } else {
        let u_idx = decoded.u_idx;
        let result = await sql.homePick(u_idx);
        if(!result) {
          res.status(500).send({
            message : "Internal Server Error"
          });
        } else {
          res.status(200).send({
              message : "Success to Load All Picks",
              data : result
          });
        }
    }
});

router.get('/vote', async(req, res, next) => {
    let token = req.headers.token;
    let decoded = jwt.verify(token);
    if (decoded === -1) {
        res.status(400).send({
            message : "Verification Failed"
        });
    } else {
        let u_idx = decoded.u_idx;
        let result = await sql.homeVote(u_idx);
        if(!result) {
          res.status(500).send({
            message : "Internal Server Error"
          });
        } else {
          res.status(200).send({
              message : "Success to Load All Votes",
              data : result
          });
        }
    }
});

module.exports = router;
