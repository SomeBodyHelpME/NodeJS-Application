const express = require('express');
const router = express.Router();
const upload = require('../../config/multer.js');

const jwt = require('../../module/jwt.js');
const db = require('../../module/pool.js');
const sql = require('../../module/sql.js');
const statuscode = require('../../module/statuscode.js');

router.post('/', async(req, res, next) => { //역할 등록
	let token = req.headers.token;
  let decoded = jwt.verify(token);
  if (decoded === -1) {
    res.status(400).send({
      message : "Verification Failed"
    });
  } else {
    let u_idx = decoded.u_idx;
		let g_idx = req.body.g_idx;
		let title = req.body.title;
		let taskArray = req.body.taskArray;

		let result = await sql.createRoleProject(g_idx, title, u_idx, taskArray);
		if (!result) {
			res.status(500).send({
				message : "Internal Server Error"
			});
		} else {
			res.status(201).send({
				message : "Success to Register Project"
			});
		}
	}
});

router.post('/task', async(req, res, next) => {
	let role_idx = req.body.role_idx;
	let content = req.body.content;

	let result = await sql.createRoleTask(role_idx, content);
	if (!result) {
		res.status(500).send({
			message : "Internal Server Error"
		});
	} else {
		res.status(201).send({
			message : "Success to Register Task"
		});
	}
});

router.post('/user', async(req, res, next) => {
	let token = req.headers.token;
  let decoded = jwt.verify(token);
  if (decoded === -1) {
    res.status(400).send({
      message : "Verification Failed"
    });
  } else {
    let u_idx = decoded.u_idx;
    let role_task_idx = req.body.role_task_idx;

    let result = await.sql.createRoleUser(role_task_idx, u_idx);
    if (!result) {
			res.status(500).send({
				message : "Internal Server Error"
			});
		} else {
			res.status(201).send({
				message : "Success to Register User"
			});
    }
  }
});

var MAXNUM = 10;
router.post('/response', upload.fields({name : "file", maxCount : MAXNUM}), async(req, res, next) => {
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
		let response_content = req.body.response_content;
		let files = req.files.file;	// Array

		let result = await sql.createRoleResponse(role_idx, role_task_idx, u_idx, response_content, files);
		if (result === 0) {
			res.status(500).send({
				message : "Internal Server Error"
			});
		} else if (result === -1) {
			res.status(400).send({
				message : "Wrong Person"
			});
		} else if (result === 1) {
			res.status(201).send({
				message : "Success to Register Result"
			});
		}
	}

});

router.post('/feedback', async(req, res, next) => {
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

    let result = await sql.createRoleFeedback(u_idx, role_response_idx, content);
    if(!result) {
			res.status(500).send({
				message : "Internal Server Error"
			});
		} else {
			res.status(201).send({
				message : "Success to Register Feedback"
			});
		}
  }
});

module.exports = router;