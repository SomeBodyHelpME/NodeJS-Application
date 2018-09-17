const express = require('express');
const moment = require('moment');
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
		let chatroom_idx = req.body.chatroom_idx;
		let title = req.body.title;
		let taskArray = req.body.taskArray;
		let write_time = moment().format("YYYY-MM-DD HH:mm:ss");

		if (!chatroom_idx || !title) {
      res.status(400).send({
        message : "Null Value"
      });
    } else {
			let result = await sql.createRoleProject(chatroom_idx, title, u_idx, taskArray, write_time);
			if (!result) {
				res.status(500).send({
					message : "Internal Server Error"
				});
			} else {
				let result2 = await sql.fcmSendWhenMakeThings(u_idx, chatroom_idx, statuscode.makeRole, result[0], result[1]);
	      if(!result2) {
	        res.status(500).send({
	          message : "Internal Server Error"
	        });
	      } else {
	        res.status(201).send({
						message : "Success to Register Project"
					});
	      }//else
			}
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

    let result = await sql.createRoleUser(role_task_idx, u_idx);
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
router.post('/response', upload.array("file", MAXNUM), async(req, res, next) => {
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
		let write_time = moment().format("YYYY-MM-DD HH:mm:ss");
		console.log('req.files : ', req.files);
		console.log('files : ', files);
		if (!role_idx || !role_task_idx || !response_content) {
      res.status(400).send({
        message : "Null Value"
      });
    } else {
			let result = await sql.createRoleResponse(role_idx, role_task_idx, u_idx, response_content, files, write_time);
			if (result === 0) {
				res.status(500).send({
					message : "Internal Server Error"
				});
			} else if (result === -1) {
				res.status(400).send({
					message : "Wrong Person"
				});
			} else {
				res.status(201).send({
					message : "Success to Register Result"
				});
			}
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
    let write_time = moment().format("YYYY-MM-DD HH:mm:ss");

    if (!role_response_idx || !content) {
      res.status(400).send({
        message : "Null Value"
      });
    } else {
	    let result = await sql.createRoleFeedback(u_idx, role_response_idx, content, write_time);
	    if(!result) {
				res.status(500).send({
					message : "Internal Server Error"
				});
			} else {
				let result2 = await sql.readRoleFeedback(role_response_idx);
				if (!result2) {
					res.status(500).send({
						message : "Internal Server Error"
					});
				} else {
					res.status(201).send({
						message : "Success to Register Feedback",
						data : result2
					});	
				}
			}
		}
  }
});

module.exports = router;