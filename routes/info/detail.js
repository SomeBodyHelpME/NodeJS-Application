const express = require('express');
const router = express.Router();
const crypto = require('crypto-promise');

const jwt = require('../../module/jwt.js');
const db = require('../../module/pool.js');
const sql = require('../../module/sql.js');

router.get('/notice/:chatroom_idx', async(req, res, next) => {
  let token = req.headers.token;
  let decoded = jwt.verify(token);
  if (decoded === -1) {
    let u_idx = decoded.u_idx;
    let chatroom_idx = req.params.chatroom_idx;
    let result = await sql.forEachNotice(u_idx, chatroom_idx);
    if (!result) {
      res.status(500).send({
        message : "Internal Server Error"
      });
    } else {
      res.status(200).send({
          message : "Success to Load Notices for the Specific Room",
          data : result
      });
    }  
  }
});

router.get('/lights/:chatroom_idx', async(req, res, next) => {
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
        let chatroom_idx = req.params.chatroom_idx;
        let result = await sql.forEachLights(u_idx, chatroom_idx);
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

router.get('/lights/each/:color/:chatroom_idx/:light_idx', async(req, res, next) => {
  let token = req.headers.token;
  let decoded = jwt.verify(token);
  if(decoded === -1) {
    res.status(400).send({
      message : "Verification Failed"
    });
  } else {
    let u_idx = decoded.u_idx;
    let color = req.params.color;
    let chatroom_idx = req.params.chatroom_idx;
    let light_idx = req.params.light_idx;

    let status = await sql.forEachLightsStatus(u_idx, chatroom_idx, light_idx);
    let result = await sql.forEachLightsResponse(u_idx, chatroom_idx, light_idx, color);

    if(!result) {
      res.status(500).send({
        message : "Internal Server Error"
      });
    } else {
      if(status) {
        res.status(200).send({
          message : "Success to Load Lights Detail - Request",
          data : result
        });
      } else {
        res.status(200).send({
          message : "Success to Load Lights Detail - Response",
          data : result
        });
      }
    }
  }
});

// router.get('/pick', async(req, res, next) => {
//     let token = req.headers.token;
//     let decoded = jwt.verify(token);
//     if(decoded === -1)
//     {
//         res.status(400).send({
//             message : "Verification Failed"
//         });
//     } else {
//         let u_idx = decoded.u_idx;
//         let g_idx = req.query.g_idx;
//         let result = await sql.forEachPick(u_idx, g_idx);
//         if(!result) {
//           res.status(500).send({
//             message : "Internal Server Error"
//           });
//         } else {
//           res.status(200).send({
//               message : "Success to Load Picks for the Specific Room",
//               data : result
//           });
//         }
//     }
// });

router.get('/vote/:chatroom_idx', async(req, res, next) => {
    let token = req.headers.token;
    let decoded = jwt.verify(token);
    if(decoded === -1)
    {
        res.status(400).send({
            message : "Verification Failed"
        });
    } else {
        let u_idx = decoded.u_idx;
        let chatroom_idx = req.params.chatroom_idx;
        let result = await sql.forEachVote(u_idx, chatroom_idx);
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

router.get('/single/vote/:vote_idx', async(req, res, next) => {
  let token = req.headers.token;
  let decoded = jwt.verify(token);
  if(decoded === -1) {
    res.status(400).send({
      message : "Verification Failed"
    });
  } else {
    let u_idx = decoded.u_idx;
    let vote_idx = req.params.vote_idx;
    let voteresult = await sql.forEachVoteOne(vote_idx);
    let choiceresult = await sql.forEachVoteChoice(vote_idx);
    let responseresult = await sql.forEachVoteResponse(vote_idx);

    if(!voteresult || !choiceresult || !responseresult) {
      res.status(500).send({
        message : "Internal Server Error"
      });
    } else {
      let result = await sql.forEachVoteCombine(choiceresult, responseresult);
      res.status(200).send({
        message : "Success to Load Vote Detail",
        vote : voteresult,
        choice : result,
        response : responseresult
      });
    }
  }
});

router.get('/single/notice/:notice_idx', async(req, res, next) => {
  let notice_idx = req.params.notice_idx;

  let result = await sql.showSingleNoticeDetail(notice_idx);
  if (!result) {
    res.status(500).send({
      message : "Internal Server Error"
    });
  } else {
    res.status(200).send({
      message : "Success to Load Single Notice Detail",
      data : result
    });
  }
});

router.get('/single/lights/:light_idx', async(req, res, next) => {
  let token = req.headers.token;
  let decoded = jwt.verify(token);
  if(decoded === -1) {
    res.status(400).send({
      message : "Verification Failed"
    });
  } else {
    let u_idx = decoded.u_idx;
    let light_idx = req.params.light_idx;

    let result = await sql.showSingleLightsContent(light_idx, u_idx);
    if (!result) {
      res.status(500).send({
        message : "Internal Server Error"
      });
    } else {
      res.status(200).send({
        message : "Success to Load Single Lights Detail",
        data : result
      });
    }
  }
});



module.exports = router;
