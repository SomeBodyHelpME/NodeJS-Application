const express = require('express');
const router = express.Router();
const crypto = require('crypto-promise');
const moment = require('moment');
const upload = require('../../config/multer.js');

const jwt = require('../../module/jwt.js');
const db = require('../../module/pool.js');
const sql = require('../../module/sql.js');
const statuscode = require('../../module/statuscode.js');

router.put('/', async(req, res, next) => { //역할 등록
	let role_idx = req.body.role_idx;
	let title = req.body.title;

	let result = await sql.updateRoleProject(role_idx, title);
	if (!result) {
		res.status(500).send({
			message : "Internal Server Error"
		});
	} else {
		res.status(201).send({
			message : "Success to Modify Project"
		});
	}
});

router.put('/task', async(req, res, next) => {
	let role_idx = req.body.role_idx;
	let minusArray = req.body.minusArray;
	let plusArray = req.body.plusArray;

	let result = await sql.updateRoleTask(role_idx, minusArray, plusArray);
	if (!result) {
		res.status(500).send({
			message : "Internal Server Error"
		});
	} else {
		res.status(201).send({
			message : "Success to Modify Task"
		});
	}
});

router.put('/user', async(req, res, next) => {
	let token = req.headers.token;
  let decoded = jwt.verify(token);
  if (decoded === -1) {
    res.status(400).send({
      message : "Verification Failed"
    });
  } else {
    let u_idx = decoded.u_idx;
		let role_idx = req.body.role_idx;
		let role_task_idx = req.body.role_task_idx;
		let minusArray = req.body.minusArray;
		let plusArray = req.body.plusArray;
		let status = req.body.status;

		let result = await sql.updateRoleUser(u_idx, role_idx, role_task_idx, minusArray, plusArray, status);
		if (!result) {
			res.status(500).send({
				message : "Internal Server Error"
			});
		} else {
			let result2 = await sql.updateRoleUserIndex(role_task_idx);
			if (!result2) {
				res.status(500).send({
					message : "Internal Server Error"
				});
			} else {
				res.status(201).send({
					message : "Success to Modify User",
					data : result2
				});
			}
		}
	}
});

var MAXNUM = 10;
router.put('/response', upload.fields({name : "file", maxCount : MAXNUM}), async(req, res, next) => {

	let token = req.headers.token;
  let decoded = jwt.verify(token);
  if (decoded === -1) {
    res.status(400).send({
      message : "Verification Failed"
    });
  } else {
    let u_idx = decoded.u_idx;
		let role_task_idx = req.body.role_task_idx;
		let role_response_idx = req.body.role_response_idx;
		let content = req.body.content;
		let minusArray = req.body.minusArray;
		let plusArray = req.files.file;

		let result = await sql.updateRoleResponse(u_idx, role_task_idx, role_response_idx, content, minusArray, plusArray);
		if (result === 0) {
			res.status(500).send({
				message : "Internal Server Error"
			});
		} else if (result === -1) {
			res.status(400).send({
				message : "Wrong User"
			});
		} else {
			res.status(201).send({
				message : "Success to Modify Response"
			});
		}
	}
});

router.put('/feedback', async(req, res, next) => {
	let token = req.headers.token;
  let decoded = jwt.verify(token);
  if (decoded === -1) {
    res.status(400).send({
      message : "Verification Failed"
    });
  } else {
    let u_idx = decoded.u_idx;
		let role_response_idx = req.body.role_response_idx;
		let content = req.body.content;

		let result = await sql.updateRoleFeedback(u_idx, role_response_idx, content);
		if (!result) {
			res.status(500).send({
				message : "Internal Server Error"
			});
		} else {
			res.status(201).send({
				message : "Success to Modify Feedback"
			});
		}
	}
});

module.exports = router;
