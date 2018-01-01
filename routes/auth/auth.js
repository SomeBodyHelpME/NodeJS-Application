const express = require('express');
const router = express.Router();
const crypto = require('crypto-promise');

const jwt = require('../../module/jwt.js');
const db = require('../../module/pool.js');
const sql = require('../../module/sql.js');

router.post('/login', async(req, res, next) => {
  var id = req.body.id;
  var pwd = req.body.pwd;

  let checkQuery = 'SELECT * FROM admin.user WHERE id = ?';
  let checkResult = await db.queryParamCnt_Arr(checkQuery, [id]);
  if(checkResult.length === 1) {
    const hashedpwd = await crypto.pbkdf2(pwd, checkResult[0].salt, 100000, 32, 'sha512');
    if(hashedpwd.toString('base64') === checkResult[0].pwd) {
      const token = jwt.sign(id,checkResult[0].u_idx);
      res.status(201).send({
        message : "Login Success",
        token : token
      });
    } else {
      res.status(400).send({
        message : "Login Failed"
      });
    }
  } else {
    res.status(400).send({
      message : "Login Failed"
    });
  }

});

router.post('/register', async(req, res, next) => {
  var id = req.body.id;
  var pwd = req.body.pwd;
  var name = req.body.name;
  var phone = req.body.phone;


  const salt = await crypto.randomBytes(32);
  const hashedpwd = await crypto.pbkdf2(pwd, salt.toString('base64'), 100000, 32, 'sha512');
  let checkIDQuery = 'SELECT * FROM admin.user WHERE id = ?';
  let checkID = await db.queryParamCnt_Arr(checkIDQuery, [id]);
  if(checkID.length === 0) {
    let insertQuery = 'INSERT INTO admin.user (name, salt, pwd, phone, id) VALUES (?, ?, ?, ?, ?)';
    let insertResult = await db.queryParamCnt_Arr(insertQuery, [name, salt.toString('base64'), hashedpwd.toString('base64'), phone, id]);
    res.status(201).send({
      message : "Success Register"
    });
  } else {
    res.status(400).send({
      message : "ID Already Exist"
    });
  }

});

router.get('/register/check', async(req, res, next) => {
  var id = req.query.id;
  let checkIDQuery = 'SELECT * FROM admin.user WHERE id = ?';
  let checkID = await db.queryParamCnt_Arr(checkIDQuery, [id]);
  if(checkID.length === 0) {
    res.status(200).send({
      message : "No ID in DB"
    });
  } else {
    res.status(400).send({
      message : "ID Already Exist"
    });
  }
});
module.exports = router;
