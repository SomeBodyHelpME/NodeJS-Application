const express = require('express');
const router = express.Router();
const async = require('async');
const mysql = require('mysql');

const sql = require('../module/sql.js');

router.get('/:name/:u_idx', async(req, res, next) => {
  let name = req.params.name;
  let u_idx = req.params.u_idx;
  let test = await sql.makeNewChatRoomTable(name, u_idx);
  res.status(200).send({
    message : "successfully create table"
  });
});
module.exports = router;
