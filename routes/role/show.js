const express = require('express');
const router = express.Router();
const crypto = require('crypto-promise');
const moment = require('moment');
const upload = require('../../config/multer.js');

const jwt = require('../../module/jwt.js');
const db = require('../../module/pool.js');
const sql = require('../../module/sql.js');
const statuscode = require('../../module/statuscode.js');

router.get('/task/:role_idx', async(req, res, next) => {
	let role_idx = req.params.role_idx;

	let result = await sql.readRoleTask(role_idx);
	if (!result) {
		res.status(500).send({
			message : "Internal Server Error"
		});
	} else {
		res.status(200).send({
			message : "Success to Get Task",
			data : result
		});
	}
});

router.get('/user/:role_task_idx', async(req, res, next) => {
	let role_task_idx = req.params.role_task_idx;

	let result = await sql.readRoleUser(role_task_idx);
	if (!result) {
		res.status(500).send({
			message : "Internal Server Error"
		});
	} else {
		res.status(200).send({
			message : "Success to Get User",
			data : result
		});
	}
});

router.get('/response/:role_task_idx', async(req, res, next) => {
	let role_task_idx = req.params.role_task_idx;

	let result = await sql.readRoleResponse(role_task_idx);
	if (!result) {
		res.status(500).send({
			message : "Internal Server Error"
		});
	} else {
		res.status(200).send({
			message : "Success to Get Response",
			data : result
		});
	}
});

router.get('/feedback/:role_response_idx', async(req, res, next) => {
 let role_response_idx = req.params.role_response_idx;

	let result = await sql.readRoleFeedback(role_response_idx);
	if (!result) {
		res.status(500).send({
			message : "Internal Server Error"
		});
	} else {
		res.status(200).send({
			message : "Success to Get Feedback",
			data : result
		});
	}
});

router.get('/:type/:index', async(req, res, next) => {
	let token = req.headers.token;
  let decoded = jwt.verify(token);
  if (decoded === -1) {
    res.status(400).send({
      message : "Verification Failed"
    });
  } else {
    let u_idx = decoded.u_idx;
    let type = req.params.type;
		let index = req.params.index;
		
		let result = await sql.readRoleProject(u_idx, type, index);
		if (!result) {
			res.status(500).send({
				message : "Internal Server Error"
			});
		} else {
			res.status(200).send({
				message : "Success to Get Project",
				data : result
			});
		}
	}
});

module.exports = router;
