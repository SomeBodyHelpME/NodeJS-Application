const express = require('express');
const router = express.Router();
const async = require('async');
const mysql = require('mysql');

const sql = require('../module/sql.js');
const db = require('../module/pool.js');
router.get('/', async(req, res, next) => {
//router.get('/:name/:u_idx', async(req, res, next) => {
  // let name = req.params.name;
  // let u_idx = req.params.u_idx;
  // let test = await sql.makeNewChatRoomTable(name, u_idx);
  // res.status(200).send({
  //   message : "successfully create table"
  // });
  let testQuery = 'SELECT count(user_idx) as idx FROM mydb.user';
  let testtest = await db.queryParamCnt_None(testQuery);
  console.log(testtest[0].idx);
});
module.exports = router;
