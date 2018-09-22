const express = require('express');
const router = express.Router();
const crypto = require('crypto-promise');
const request = require('request');
const upload = require('../../config/multer');

const jwt = require('../../module/jwt.js');
const db = require('../../module/pool.js');
const sql = require('../../module/sql.js');
const statuscode = require('../../module/statuscode.js');

router.post('/login', async(req, res, next) => {
  var id = req.body.id;
  var pwd = req.body.pwd;
  var client_token = req.body.client_token;

  if (!id || !pwd) {
    res.status(400).send({
      message : "Null Value"
    });
  } else {
    let checkQuery = 'SELECT * FROM tkb.user WHERE id = ?';
    let checkResult = await db.queryParamCnt_Arr(checkQuery, [id]);
    if (checkResult.length === 1) {
      const hashedpwd = await crypto.pbkdf2(pwd, checkResult[0].salt, 100000, 32, 'sha512');
      if (hashedpwd.toString('base64') === checkResult[0].pwd) {
        let updateTokenQuery = 'UPDATE tkb.user SET token = ? WHERE id = ?';
        let updateToken = await db.queryParamCnt_Arr(updateTokenQuery, [client_token, id]);

        const token = jwt.sign(id, checkResult[0].u_idx);
        let infoQuery = 'SELECT * FROM tkb.user WHERE id = ?';
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
  }
});

router.post('/register', async(req, res, next) => {
  var id = req.body.id;
  var pwd = req.body.pwd;
  var name = req.body.name;
  var phone = req.body.phone;
  var token = req.header.token;
  var photo = ' ';

  if (!id || !pwd || !name || !phone) {
    res.status(400).send({
      message : "Null Value"
    });
  } else {
    const salt = await crypto.randomBytes(32);
    const hashedpwd = await crypto.pbkdf2(pwd, salt.toString('base64'), 100000, 32, 'sha512');
    let checkIDQuery = 'SELECT * FROM tkb.user WHERE id = ?';
    let checkID = await db.queryParamCnt_Arr(checkIDQuery, [id]);
    if (checkID.length === 0) {

      let insertQuery = 'INSERT INTO tkb.user (name, salt, pwd, phone, id, token, photo) VALUES (?, ?, ?, ?, ?, ?, ?)';
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
  }
});

router.post('/register/check', async(req, res, next) => {
  var id = req.body.id;
  if (!id) {
    res.status(400).send({
      message : "Null Value"
    });
  } else {
    let checkIDQuery = 'SELECT * FROM tkb.user WHERE id = ?';
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
  }
});

router.post('/logout', async(req, res, next) => {
  let token = req.headers.token;
  let decoded = jwt.verify(token);
  if (decoded === -1) {
    res.status(400).send({
      message : "Verification Failed"
    });
  } else {
    let u_idx = decoded.u_idx;

    let updateQuery = 'UPDATE tkb.user SET token = ? WHERE u_idx = ?';
    let updateResult = await db.queryParamCnt_Arr(updateQuery, [null, u_idx]);

    if (!updateResult) {
      res.status(500).send({
        message : "Internal Server Error"
      });
    } else {
      res.status(201).send({
        message : "Success to Logout"
      });
    }
  }
});

router.post('/invite/group', async(req, res, next) => {
  let name = req.body.name;
  let phone = req.body.phone;
  let g_idx =req.body.g_idx;


  if (!name || !phone || !g_idx) {
    res.status(400).send({
      message : "Null Value"
    });
  } else {
    let findUserQuery = 'SELECT u_idx FROM tkb.user WHERE name = ? AND phone = ?';
    let findUser = await db.queryParamCnt_Arr(findUserQuery, [name, phone]);


    if(findUser && findUser.length === 1) {
      let statusQuery = 'SELECT * FROM tkb.group_joined WHERE g_idx = ? AND u_idx = ?';
      let status = await db.queryParamCnt_Arr(statusQuery, [g_idx, findUser[0].u_idx]);
      if(status && status.length === 0) {
        let result = await sql.joinNewPersonGroup(g_idx, findUser[0].u_idx);
        
        if(result) {
          res.status(201).send({
            message: "Success to Invite Person",
            data : findUser[0].u_idx
          });
          let sendFCM_AllUser = await sql.sendFCMData([findUser[0].u_idx], statuscode.FiveThingsChange, g_idx);
        } else {
          res.status(500).send({
            message : "Internal Server Error"
          });
        }
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
  }
});

router.post('/invite/chatroom', async(req, res, next) => {
  let userArray = req.body.userArray;
  let chatroom_idx = req.body.chatroom_idx;
  let g_idx = req.body.g_idx;
  
  if (!chatroom_idx || !g_idx) {
    res.status(400).send({
      message : "Null Value"
    });
  } else {
    let checkResult = await sql.checkPerson(chatroom_idx, g_idx, userArray);
    if (checkResult === 2) {
      let result = await sql.joinNewPersonChatroom(chatroom_idx, g_idx, userArray);
      
      if (result) {
        res.status(201).send({
          message: "Success to Invite Person"
        });
        let sendFCM_AllUser = await sql.sendFCMData(userArray, statuscode.ChatroomChatroom_joinedChange, chatroom_idx);
      } else {
        res.status(500).send({
          message : "Internal Server Error"
        });
      }
    } else if (checkResult === 1){
      res.status(400).send({
        message : "Already Joined"
      });
    } else if (checkResult === 0) {
      res.status(500).send({
        message : "Internal Server Error"
      });
    }
  }
});

router.post('/leave/group', async(req, res, next) => {
  let option = {
    uri : 'http://13.125.118.111:3003/auth/leave/group',
    method : 'DELETE',
    headers : {
      token : req.headers.token
    },
    form : {
      g_idx : req.body.g_idx
    }
  }

  request(option, async(err, response, body) => {
    let bodyParsed = JSON.parse(body);
    
    if (bodyParsed.message === "Success Leave Group") {
      res.status(201).send({
        message : bodyParsed.message
      });
    } else if (bodyParsed.message === "Verification Failed") {
      res.status(400).send({
        message : bodyParsed.message
      });
    } else if (bodyParsed.message === "Internal Server Error") {
      res.status(500).send({
        message : bodyParsed.message
      });
    } else if (bodyParsed.message === "Wrong Information") {
      res.status(400).send({
        message : bodyParsed.message
      });
    } 
  });
});

router.delete('/leave/group', async(req, res, next) => {
  let g_idx = req.body.g_idx;
  let token = req.headers.token;
  if (!g_idx) {
    res.status(400).send({
      message : "Null Value"
    });
  } else {
    let decoded = jwt.verify(token);
    if(decoded === -1) {
      res.status(400).send({
        message : "Verification Failed"
      });
    } else {
      let u_idx = decoded.u_idx;

      let result = await sql.leaveGroup(u_idx, g_idx);
      if(!result) {
        res.status(500).send({
          message : "Internal Server Error"
        });
      } else {
        if (result.affectedRows !== 0) {
          res.status(201).send({
            message : "Success Leave Group"
          });  
        } else {
          res.status(400).send({
            message : "Wrong Information"
          });
        }
        
        let sendFCM = await sql.sendFCMData([u_idx], statuscode.Group_joinedChatroom_joinedChange, g_idx);
      }
    }
  }
});

router.post('/leave/chatroom', async(req, res, next) => {
  let option = {
    uri : 'http://13.125.118.111:3002/auth/leave/chatroom',
    method : 'DELETE',
    headers : {
      token : req.headers.token
    },
    form : {
      chatroom_idx : req.body.chatroom_idx
    }
  }

  request(option, async(err, response, body) => {
    let bodyParsed = JSON.parse(body);
    
    if (bodyParsed.message === "Success Leave Chatroom") {
      res.status(201).send({
        message : bodyParsed.message
      });
    } else if (bodyParsed.message === "Verification Failed") {
      res.status(400).send({
        message : bodyParsed.message
      });
    } else if (bodyParsed.message === "Internal Server Error") {
      res.status(500).send({
        message : bodyParsed.message
      });
    } else if (bodyParsed.message === "Wrong Information") {
      res.status(400).send({
        message : bodyParsed.message
      });
    } 
  });
});

router.delete('/leave/chatroom', async(req, res, next) => {
  let chatroom_idx = req.body.chatroom_idx;
  let token = req.headers.token;
  if (!chatroom_idx) {
    res.status(400).send({
      message : "Null Value"
    });
  } else {
    let decoded = jwt.verify(token);
    if(decoded === -1) {
      res.status(400).send({
        message : "Verification Failed"
      });
    } else {
      let u_idx = decoded.u_idx;

      let result = await sql.leaveChatroom(u_idx, chatroom_idx);
      if (result === 0) {
        res.status(500).send({
          message : "Internal Server Error"
        });
      } else if (result === 1) {
        res.status(400).send({
          message : "Default Chatroom"
        });
      } else {
        if (result.affectedRows !== 0) {
          res.status(201).send({
            message : "Success Leave Chatroom"
          });  
        } else {
          res.status(400).send({
            message : "Wrong Information"
          });
        }
        
        let sendFCM = await sql.sendFCMData([u_idx], statuscode.Chatroom_joinedChange, chatroom_idx);
      }
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

    let selectUserInfoQuery = 'SELECT photo, name, bio, phone FROM tkb.user WHERE u_idx = ?';
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
    let updateProfileQuery = 'UPDATE tkb.user SET name = ?, bio = ?, phone = ?, photo = ? where u_idx = ?';
    let updateProfile = await db.queryParamCnt_Arr(updateProfileQuery, [name, bio, phone, photo, u_idx]);
    if(!selectUserInfo || !updateProfile) {
      res.status(500).send({
        message : "Internal Server Error"
      });
    } else if (updateProfile.changedRows === 1) {
      res.status(201).send({
        message: "Success to Change",
        data : photo
      });
      let sendFCM = await sql.sendFCMData([u_idx], statuscode.UserChange, 0);
    } else {
      //값은 넘어왔는데 바뀐게 없다.오류는 x
      res.status(400).send({
        message: "No Change"
      });
    }
  }
});

module.exports = router;
