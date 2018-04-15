const express = require('express');
const router = express.Router();
const crypto = require('crypto-promise');
const moment = require('moment');

const jwt = require('../../module/jwt.js');
const db = require('../../module/pool.js');
const sql = require('../../module/sql.js');
const statuscode = require('../../module/statuscode.js');

router.delete('/notice', async(req, res, next) => {
	let token = req.headers.token;
  let decoded = jwt.verify(token);
  if (decoded === -1) {
    res.status(400).send({
      message : "Verification Failed"
    });
  } else {
    let u_idx = decoded.u_idx;
    let notice_idx = req.body.notice_idx;

    let result = await sql.deleteNotice(u_idx, notice_idx);
    if (!result) {
			res.status(500).send({
				message : "Internal Server Error"
			});
		} else if (result.affectedRows === 1) {
			res.status(201).send({
				message : "Success to Delete Notice"
			});
		} else {
			res.status(400).send({
				message : "Wrong Person or Wrong Index"
			});
		}
  }
});

router.delete('/lights', async(req, res, next) => {
	let token = req.headers.token;
  let decoded = jwt.verify(token);
  if (decoded === -1) {
    res.status(400).send({
      message : "Verification Failed"
    });
  } else {
    let u_idx = decoded.u_idx;
    let light_idx = req.body.light_idx;

    let result = await sql.deleteLights(u_idx, light_idx);
    if (!result) {
			res.status(500).send({
				message : "Internal Server Error"
			});
		} else if (result.affectedRows === 1) {
			res.status(201).send({
				message : "Success to Delete Lights"
			});
		} else {
			res.status(400).send({
				message : "Wrong Person or Wrong Index"
			});
		}
  }
});

// router.delete('/pick', async(req, res, next) => {
// 	let token = req.headers.token;
//   let decoded = jwt.verify(token);
//   if (decoded === -1) {
//     res.status(400).send({
//       message : "Verification Failed"
//     });
//   } else {
//     let u_idx = decoded.u_idx;
//     let pick_idx = req.body.pick_idx;

//     let result = await sql.deletePick(u_idx, pick_idx);
//     if (!result) {
// 			res.status(500).send({
// 				message : "Internal Server Error"
// 			});
// 		} else if (result.affectedRows === 1) {
// 			res.status(201).send({
// 				message : "Success to Delete Pick"
// 			});
// 		} else {
// 			res.status(400).send({
// 				message : "Wrong Person or Wrong Index"
// 			});
// 		}
//   }
// });

router.delete('/vote', async(req, res, next) => {
	let token = req.headers.token;
  let decoded = jwt.verify(token);
  if (decoded === -1) {
    res.status(400).send({
      message : "Verification Failed"
    });
  } else {
    let u_idx = decoded.u_idx;
    let vote_idx = req.body.vote_idx;

    let result = await sql.deleteVote(u_idx, vote_idx);
    if (!result) {
			res.status(500).send({
				message : "Internal Server Error"
			});
		} else if (result.affectedRows === 1) {
			res.status(201).send({
				message : "Success to Delete Vote"
			});
		} else {
			res.status(400).send({
				message : "Wrong Person or Wrong Index"
			});
		}
  }
});

module.exports = router;