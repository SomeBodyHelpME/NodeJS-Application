const express = require('express');
const router = express.Router();
const crypto = require('crypto-promise');

const jwt = require('../../module/jwt.js');
const db = require('../../module/pool.js');
const sql = require('../../module/sql.js');

router.get('/unperformed', async(req, res, next) => {
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
        console.log("decoded=", decoded);
        let result = await sql.findRestGroupThings(u_idx);
        if(!result) {
          res.status(500).send({
            message : "Internal Server Error"
          });
        } else {
          res.status(200).send({
              message : "Success to Load Unperfomed List",
              data : result
          });
        }
    }
});

// router.get('/address', async(req, res, next) => {
// 	  let token = req.headers.token;
//     let decoded = jwt.verify(token);
//     if(decoded === -1)
//     {
//         res.status(400).send({
//             message : "Verification Failed"
//         });
//     }
//     else{
//         let u_idx = decoded.u_idx;
//         let result = await sql.findAllGroupMemberAddr(u_idx);

//         res.status(200).send({
//           	message : "Success to Load Address",
//           	data : result
//         });

//     }
// });

// router.get('/userlist/chat', async(req, res, next) => {
// 	var g_idx = req.query.g_idx;

// 	let result = await sql.showSpecificMemberInChat(g_idx);
//   if(!result) {
//     res.status(500).send({
//       message : "Internal Server Error"
//     });
//   } else {
//     res.status(200).send({
//     	message : "Success to Load Userlist",
//     	data : result
//     });
//   }
// });

// router.get('/userlist/lights', async(req, res, next) => {
// 	  var g_idx = req.query.g_idx;

// 	  let token = req.headers.token;
//     let decoded = jwt.verify(token);
//     if(decoded === -1) {
//         res.status(400).send({
//             message : "Verification Failed"
//         });
//     } else {
//     	let u_idx = decoded.u_idx;
//       let result = await sql.showSpecificMemberInLights(u_idx,g_idx);
//       if(!result) {
//         res.status(500).send({
//           message : "Internal Server Error"
//         });
//       } else {
//         res.status(200).send({
//         	message : "Success to Load Userlist",
//         	data : result
//         });
//       }
//     }
// });

// router.get('/chatlist', async(req, res, next) => {
// 	  let token = req.headers.token;
//     let decoded = jwt.verify(token);
//     if(decoded === -1)
//     {
//         res.status(400).send({
//             message : "Verification Failed"
//         });
//     } else {
//       	let u_idx = decoded.u_idx;
//       	let result = await sql.showChatLists(u_idx);
//         if(!result) {
//           res.status(500).send({
//             message : "Internal Server Error"
//           });
//         } else {
//         	res.status(200).send({
//           		message : "Success to Load Chatlist",
//           		data : result
//         	});
//         }
//     }
// });

router.get('/group', async(req, res, next) => {
  let token = req.headers.token;
  let decoded = jwt.verify(token);
  if(decoded === -1) {
    res.status(400).send({
      message : "Verification Failed"
    });
  } else {
    let u_idx = decoded.u_idx;
    let result = await sql.showAllGroupsJoined(u_idx);
    if(!result) {
      res.status(500).send({
        message : "Internal Server Error"
      });
    } else {
      res.status(200).send({
        message : "Success to Load Group List",
        data : result
      });
    }
  }
});

// router.get('/chatroom/:g_idx', async(req, res, next) => {
router.get('/chatroom', async(req, res, next) => {
  let token = req.headers.token;
  let decoded = jwt.verify(token);
  if(decoded === -1) {
    res.status(400).send({
      message : "Verification Failed"
    });
  } else {
    let u_idx = decoded.u_idx;
    // let g_idx = req.params.g_idx;
    // let result = await sql.showAllChatroomJoined(u_idx, g_idx);
    let result = await sql.showAllChatroomJoined(u_idx);
    if(!result) {
      res.status(500).send({
        message : "Internal Server Error"
      });
    } else {
      res.status(200).send({
        message : "Success to Load Chatroom List",
        data : result
      });
    }
  }
});

router.get('/joined/group', async(req, res, next) => {
  let token = req.headers.token;
  let decoded = jwt.verify(token);
  if(decoded === -1) {
    res.status(400).send({
      message : "Verification Failed"
    });
  } else {
    let u_idx = decoded.u_idx;
    let result = await sql.getGJoinedInfo(u_idx);
    if(!result) {
      res.status(500).send({
        message : "Internal Server Error"
      });
    } else {
      res.status(200).send({
        message : "Success to Load Group Joined Information",
        data : result
      });
    }
  }
});

router.get('/joined/chatroom', async(req, res, next) => {
  let token = req.headers.token;
  let decoded = jwt.verify(token);
  if(decoded === -1) {
    res.status(400).send({
      message : "Verification Failed"
    });
  } else {
    let u_idx = decoded.u_idx;
    let result = await sql.getCJoinedInfo(u_idx);
    if(!result) {
      res.status(500).send({
        message : "Internal Server Error"
      });
    } else {
      res.status(200).send({
        message : "Success to Load Chatroom Joined Information",
        data : result
      });
    }
  }
});

router.get('/user', async(req, res, next) => {
  let token = req.headers.token;
  let decoded = jwt.verify(token);
  if(decoded === -1) {
    res.status(400).send({
      message : "Verification Failed"
    });
  } else {
    let u_idx = decoded.u_idx;
    let result = await sql.getUserInfo(u_idx);
    if(!result) {
      res.status(500).send({
        message : "Internal Server Error"
      });
    } else {
      res.status(200).send({
        message : "Success to Load User Information",
        data : result
      });
    }
  }
});

router.get('/newmember', async(req, res, next) => {
  let token = req.headers.token;
  let decoded = jwt.verify(token);
  if(decoded === -1) {
    res.status(400).send({
      message : "Verification Failed"
    });
  } else {
    let u_idx = decoded.u_idx;
    let result1 = await sql.showAllGroupsJoined(u_idx);
    let result2 = await sql.getJoinedInfo(u_idx);
    let result3 = await sql.getUserInfo(u_idx);
    if(!result1 || !result2 || !result3) {
      res.status(500).send({
        message : "Internal Server Error"
      });
    } else {
      res.status(200).send({
        message : "Success to Load Information For A New Member",
        data : {
          group : result1,
          joined : result2,
          user : result3
        }
      });
    }
  }
});

module.exports = router;
