const express = require('express');
const router = express.Router();
const crypto = require('crypto-promise');
const upload = require('../../config/multer');

const jwt = require('../../module/jwt.js');
const db = require('../../module/pool.js');
const sql = require('../../module/sql.js');

router.post('/login', async(req, res, next) => {
    var id = req.body.id;
    var pwd = req.body.pwd;
    var client_token = req.body.client_token;

    let checkQuery = 'SELECT * FROM admin.user WHERE id = ?';
    let checkResult = await db.queryParamCnt_Arr(checkQuery, [id]);
    if (checkResult.length === 1) {
        const hashedpwd = await crypto.pbkdf2(pwd, checkResult[0].salt, 100000, 32, 'sha512');
        if (hashedpwd.toString('base64') === checkResult[0].pwd) {
          let updateTokenQuery = 'UPDATE admin.user SET token = ? WHERE id = ?';
          let updateToken = await db.queryParamCnt_Arr(updateTokenQuery, [client_token, id]);

          const token = jwt.sign(id, checkResult[0].u_idx);
          let infoQuery = 'SELECT * FROM admin.user WHERE id = ?';
          let info = await db.queryParamCnt_Arr(infoQuery, id);
          if(!checkResult || !info) {
            res.status(500).send({
              message : "Internal Server Error"
            });
          } else {
            res.status(201).send({
              message: "Login Success",
              name : info[0].name,
              u_idx : info[0].u_idx,
              phone : info[0].phone,
              bio : info[0].bio,
              id : info[0].id,
              photo : info[0].photo,
              token: token
            });
          }
        } else {
            res.status(400).send({
                message: "Login Failed"
            });
            console.log("pwd error");
        }

    } else {
        res.status(400).send({
            message: "Login Failed"
        });
        console.log("id error");
    }

});

router.post('/register', async(req, res, next) => {
    var id = req.body.id;
    var pwd = req.body.pwd;
    var name = req.body.name;
    var phone = req.body.phone;
    var token = req.header.token;
    var photo = ' ';

    const salt = await crypto.randomBytes(32);
    const hashedpwd = await crypto.pbkdf2(pwd, salt.toString('base64'), 100000, 32, 'sha512');
    let checkIDQuery = 'SELECT * FROM admin.user WHERE id = ?';
    let checkID = await db.queryParamCnt_Arr(checkIDQuery, [id]);
    if (checkID.length === 0) {
        let insertQuery = 'INSERT INTO admin.user (name, salt, pwd, phone, id, token, photo) VALUES (?, ?, ?, ?, ?, ?, ?)';
        let insertResult = await db.queryParamCnt_Arr(insertQuery, [name, salt.toString('base64'), hashedpwd.toString('base64'), phone, id, token, photo]);
        if(!checkID || !insertResult) {
          res.status(500).send({
            message : "Internal Server Error"
          });
        } else {
          res.status(201).send({
              message: "Success Register"
          });
        }
    } else {
        res.status(400).send({
            message: "ID Already Exist"
        });
    }

});

router.get('/register/check', async(req, res, next) => {
    var id = req.query.id;
    let checkIDQuery = 'SELECT * FROM admin.user WHERE id = ?';
    let checkID = await db.queryParamCnt_Arr(checkIDQuery, [id]);
    if(!checkID) {
      res.status(500).send({
        message : "Internal Server Error"
      });
    } else if (checkID.length === 0) {
        res.status(200).send({
            message: "No ID in DB"
        });
    } else {
        res.status(400).send({
            message: "ID Already Exist"
        });
    }
});

router.post('/invite', async(req, res, next) => {
    let name = req.body.name;
    let phone = req.body.phone;
    let g_idx =req.body.g_idx;

    let findUserQuery = 'SELECT u_idx FROM admin.user WHERE name = ? AND phone = ?';
    let findUser = await db.queryParamCnt_Arr(findUserQuery, [name, phone]);


    if(findUser.length === 1) {
      let statusQuery = 'SELECT * FROM admin.joined WHERE g_idx = ? AND u_idx = ?';
      let status = await db.queryParamCnt_Arr(statusQuery, [g_idx, findUser[0].u_idx]);
      if(status.length === 0) {
        let result = await sql.joinNewPerson(g_idx, findUser[0].u_idx);
        res.status(201).send({
          message: "Success to Invite Person"
        });
      } else {
        res.status(400).send({
          message : "Already Joined"
        });
      }
    } else {
      res.status(400).send({
        message : "Fail to Search Person"
      });
    }

});

router.delete('/leave', async(req, res, next) => {
  let g_idx = req.body.g_idx;
  let token = req.headers.token;
  let decoded = jwt.verify(token);
  if(decoded === -1) {
    res.status(400).send({
      message : "Verification Failed"
    });
  } else {
    let u_idx = decoded.u_idx;

    let result = await sql.leaveRoom(u_idx, g_idx);
    if(!result) {
      res.status(500).send({
        message : "Internal Server Error"
      });
    } else {
      res.status(201).send({
        message : "Success Leave Group"
      });
    }
  }
});

router.put('/profile', upload.single('photo'), async(req, res, next) => {

  var photo = null;
  if(req.file != undefined) {
    photo = req.file.location;
  }
  let token = req.headers.token;
  let decoded = jwt.verify(token);
  if(decoded === -1) {
    res.status(400).send({
      message : "Verification Failed"
    });
  } else {
    let u_idx = decoded.u_idx;

    var name = req.body.name;
    var bio = req.body.bio;
    var phone = req.body.phone;

    let selectUserInfoQuery = 'SELECT photo, name, bio, phone FROM admin.user WHERE u_idx = ?';
    let selectUserInfo = await db.queryParamCnt_Arr(selectUserInfoQuery, [u_idx]);

    if(photo === null) {
      photo = selectUserInfo[0].photo;
    }
    if(name === undefined) {
      name = selectUserInfo[0].name;
    }
    if(bio === undefined) {
      bio = selectUserInfo[0].bio;
    }
    if(phone === undefined) {
      phone = selectUserInfo[0].phone;
    }
    let updateProfileQuery = 'UPDATE admin.user SET name = ?, bio = ?, phone = ?, photo = ? where u_idx = ?';
    let updateProfile = await db.queryParamCnt_Arr(updateProfileQuery, [name, bio, phone, photo, u_idx]);
    if(!selectUserInfo || !updateProfile) {
      res.status(500).send({
        message : "Internal Server Error"
      });
    } else if (updateProfile.changedRows === 1) {
      res.status(201).send({
        message: "Success to Change"
      });
    } else {
      //값은 넘어왔는데 바뀐게 없다.오류는 x
      res.status(400).send({
        message: "No Change"
      });
    }
  }
});

module.exports = router;
