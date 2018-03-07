const express = require('express');
const router = express.Router();
const crypto = require('crypto-promise');
const moment = require('moment');
const upload = require('../../config/multer.js');

const jwt = require('../../module/jwt.js');
const db = require('../../module/pool.js');
const sql = require('../../module/sql.js');
const statuscode = require('../../module/statuscode.js');

router.delete('/', async(req, res, next) => { //역할 등록
	let role_idx = req.body.role_idx;

	let result = await sql.deleteRoleProject(role_idx);
	if (!result) {
		res.status(500).send({
			message : "Internal Server Error"
		});
	} else {
		res.status(201).send({
			message : "Success to Delete Project"
		});
	}
});

router.delete('/task', async(req, res, next) => {
	let role_task_idx = req.body.role_task_idx;

	let result = await sql.deleteRoleTask(role_task_idx);
	if (!result) {
		res.status(500).send({
			message : "Internal Server Error"
		});
	} else {
		res.status(201).send({
			message : "Success to Delete Task"
		});
	}
});

router.delete('/user', async(req, res, next) => {
	let token = req.headers.token;
  let decoded = jwt.verify(token);
  if (decoded === -1) {
    res.status(400).send({
      message : "Verification Failed"
    });
  } else {
    let u_idx = decoded.u_idx;
		let role_task_idx = req.body.role_task_idx;

		let result = await sql.deleteRoleUser(role_task_idx, u_idx);
		if (!result) {
			res.status(500).send({
				message : "Internal Server Error"
			});
		} else {
			res.status(201).send({
				message : "Success to Delete User"
			});
		}
	}
});

router.delete('/response', async(req, res, next) => {
	let role_response_idx = req.body.role_response_idx;

	let result = await sql.deleteRoleResponse(role_response_idx);
	if (!result) {
		res.status(500).send({
			message : "Internal Server Error"
		});
	} else {
		res.status(201).send({
			message : "Success to Delete Response"
		});
	}
});

router.delete('/feedback', async(req, res, next) => {
	let token = req.headers.token;
  let decoded = jwt.verify(token);
  if (decoded === -1) {
    res.status(400).send({
      message : "Verification Failed"
    });
  } else {
    let u_idx = decoded.u_idx;
		let role_response_idx = req.body.role_response_idx;
		
		let result = await sql.deleteRoleFeedback(role_response_idx, u_idx);
		if (!result) {
			res.status(500).send({
				message : "Internal Server Error"
			});
		} else {
			res.status(201).send({
				message : "Success to Delete Feedback"
			});
		}
	}
});

module.exports = router;
