const express = require('express');
const router = express.Router();
const crypto = require('crypto-promise');
const moment = require('moment');
const upload = require('../../config/multer.js');

const jwt = require('../../module/jwt.js');
const db = require('../../module/pool.js');
const sql = require('../../module/sql.js');
const statuscode = require('../../module/statuscode.js');

router.post('/group', upload.single('photo'), async(req, res, next) => {
  var photo = ' ';
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
    let real_name = req.body.name;
    let ctrl_name = real_name + '_' + moment().format('YYMMDDHHmmss');

    if (!real_name) {
      res.status(400).send({
        message : "Null Value"
      });
    } else {
      let result = await sql.makeNewGroup(u_idx, real_name, ctrl_name, photo);
      
      if(!result) {
        res.status(500).send({
          message : "Internal Server Error"
        });
      } else {    
        res.status(201).send({
          message : "Success to Make New Group",
          data : result
        });
      }
    }
  }
});

router.post('/chatroom', upload.single('photo'), async(req, res, next) => {
  var photo = ' ';
  if(req.file != undefined) {
    photo = req.file.location;
  }
  var userArray = [];
  if(req.body.userArray != undefined) {
    userArray = req.body.userArray;
  }

  let token = req.headers.token;
  let decoded = jwt.verify(token);
  if(decoded === -1) {
    res.status(400).send({
      message : "Verification Failed"
    });
  } else {
    let u_idx = decoded.u_idx;
    let g_idx = req.body.g_idx;
    let real_name = req.body.name;
    let ctrl_name = real_name + '_' + moment().format('YYMMDDHHmmss');
    console.log(userArray);
    if (!g_idx || !real_name) {
      res.status(400).send({
        message : "Null Value"
      });
    } else {
      let result = await sql.makeNewChatroom(u_idx, g_idx, real_name, ctrl_name, photo, userArray);
      
      if (!result) {
        res.status(500).send({
          message : "Internal Server Error"
        });
      } else {
        res.status(201).send({
          message : "Success to Make New Chatroom",
          data : result
        });
      }
    }
  }
});

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
    let chatroom_idx = req.body.chatroom_idx;
    let content = req.body.content;
    let write_time = moment().format("YYYY-MM-DD HH:mm:ss");

    if (!chat_idx || !chatroom_idx || !content) {
      res.status(400).send({
        message : "Null Value"
      });
    } else {
      let result = await sql.makeNotice(u_idx, chat_idx, chatroom_idx, write_time, content);
      if(!result) {
        res.status(500).send({
          message : "Internal Server Error"
        });
      } else {
        let result2 = await sql.fcmSendWhenMakeThings(u_idx, chatroom_idx, statuscode.makeNotice, result[0], result[1]);
        if(!result2) {
          res.status(500).send({
            message : "Internal Server Error"
          });
        } else {
          res.status(201).send({
              message : "Success Make Notice",
              data : result
          });
        }//else
      }//else
    }//else
  }//else
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
    let chatroom_idx = req.body.chatroom_idx;
    let write_time = moment().format("YYYY-MM-DD HH:mm:ss");
    let content = req.body.content;
    let open_status = req.body.open_status;
    let entire_status = req.body.entire_status;
    let userArray = req.body.userArray;

    if (!chat_idx || !chatroom_idx || !content || !open_status || !entire_status) {
      res.status(400).send({
        message : "Null Value"
      });
    } else {
      let result = await sql.makeLights(u_idx, chatroom_idx, open_status, entire_status, content, write_time, chat_idx, userArray);
      if(!result) {
        res.status(500).send({
          message : "Internal Server Error"
        });
      } else {
        let result2 = await sql.fcmSendWhenMakeThings(u_idx, chatroom_idx, statuscode.makeLights, result[0], result[1]);
        if(!result2) {
          res.status(500).send({
            message : "Internal Server Error"
          });
        } else {
          res.status(201).send({
              message : "Success Make Lights",
              data : result
          });
        }//else
      }//else
    }//else
  }//else
});

// router.post('/pick', async(req, res, next) => {
//   let token = req.headers.token;
//   let decoded = jwt.verify(token);
//   if (decoded === -1) {
//     res.status(400).send({
//       message : "Verification Failed"
//     });
//   } else {
//     let u_idx = decoded.u_idx;
//     let write_id = req.body.write_id;
//     let chat_idx = req.body.chat_idx;
//     let g_idx = req.body.g_idx;
//     let write_time = req.body.write_time;
//     let content = req.body.content;
//     let result = await sql.makePick(u_idx, write_id, chat_idx, g_idx, write_time, content);
//     if(!result) {
//       res.status(500).send({
//         message : "Internal Server Error"
//       });
//     } else {
//       res.status(201).send({
//         message: "Success Make Pick"
//       });
//     }
//   }


// });

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
    let chatroom_idx = req.body.chatroom_idx;
    let write_time = moment().format("YYYY-MM-DD HH:mm:ss");
    let content = req.body.content;
    let title = req.body.title;
    let choice = req.body.choice;
    let endtime = req.body.endtime;

    if (!chat_idx || !chatroom_idx || !content || !title || !choice) {
      res.status(400).send({
        message : "Null Value"
      });
    } else {
      if (!endtime) {
        endtime = moment().add(7, 'days').format("YYYY-MM-DD HH:mm:ss");
      } 
      let result = await sql.makeVote(u_idx, chat_idx, chatroom_idx, write_time, title, content, choice, endtime);
      if(!result) {
        res.status(500).send({
          message : "Internal Server Error"
        });
      } else {
        let result2 = await sql.fcmSendWhenMakeThings(u_idx, chatroom_idx, statuscode.makeVote, result[0], result[1]);
        if(!result2) {
          res.status(500).send({
            message : "Internal Server Error"
          });
        } else {
          res.status(201).send({
            message : "Success Make Vote",
            data : result
          });
        }//else
      }
    }
  }
});

router.put('/vote', async(req, res, next) => {
  let token = req.headers.token;
  let decoded = jwt.verify(token);
  if (decoded === -1) {
    res.status(400).send({
      message: "Verification Failed"
    });
  } else {
    let u_idx = decoded.u_idx;
    let vote_idx = req.body.vote_idx;
    let choice = req.body.choice;
    if (!vote_idx || !choice) {
      res.status(400).send({
        message : "Null Value"
      });
    } else {
      let result = await sql.modifyVote(u_idx, vote_idx, choice);
      if(!result) {
        res.status(400).send({
          message : "Wrong Person"
        });
      } else {
        res.status(201).send({
          message: "Success Modify Vote"
        });
      }
    }
  }
});

module.exports = router;
