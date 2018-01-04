const express = require('express');
const router = express.Router();
const crypto = require('crypto-promise');
const moment = require('moment');

const jwt = require('../../module/jwt.js');
const db = require('../../module/pool.js');
const sql = require('../../module/sql.js');

router.post('/lights', async(req, res, next) => {
    let token = req.headers.token;
    let decoded = jwt.verify(token);
    if (decoded == -1) {
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
        res.status(201).send({
            message : "Success Response Lights"
        });
    }
});

router.post('/vote', async(req, res, next) => {
    let token = req.headers.token;
    let decoded = jwt.verify(token);
    if (decoded == -1) {
        res.status(400).send({
            message : "Verification Failed"
        });
    } else {
        let u_idx = decoded.u_idx;
        let vote_idx = req.body.vote_idx;
        let value = req.body.value;

        let write_time = moment().format("YYYY-MM-DD HH:mm:ss");
        let result = await sql.actionVote(u_idx, vote_idx, value, write_time);
        res.status(201).send({
            message : "Success Response Vote"
        });
    }
});


module.exports = router;
