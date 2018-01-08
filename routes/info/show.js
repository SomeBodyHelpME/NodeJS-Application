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

        res.status(200).send({
            message : "Success to Load Unperfomed List",
            data : result
        });
    }
});

router.get('/address', async(req, res, next) => {
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
        let result = await sql.findAllGroupMemberAddr(u_idx);

        res.status(200).send({
          	message : "Success to Load Address",
          	data : result
        });
    }
});

router.get('/userlist/chat', async(req, res, next) => {
	var g_idx = req.query.g_idx;

	let result = await sql.showSpecificMemberInChat(g_idx);
  res.status(200).send({
  	message : "Success to Load Userlist",
  	data : result
  });
});

router.get('/userlist/lights', async(req, res, next) => {
	  var g_idx = req.query.g_idx;

	  let token = req.headers.token;
    let decoded = jwt.verify(token);
    if(decoded === -1) {
        res.status(400).send({
            message : "Verification Failed"
        });
    } else {
    	let u_idx = decoded.u_idx;
      let result = await sql.showSpecificMemberInLights(u_idx,g_idx);

      res.status(200).send({
      	message : "Success to Load Userlist",
      	data : result
      });
    }
});

router.get('/chatlist', async(req, res, next) => {
	  let token = req.headers.token;
    let decoded = jwt.verify(token);
    if(decoded === -1)
    {
        res.status(400).send({
            message : "Verification Failed"
        });
    } else {
      	let u_idx = decoded.u_idx;
      	let result = await sql.showChatLists(u_idx);
      	res.status(200).send({
        		message : "Success to Load Chatlist",
        		data : result
      	});
    }
});

router.get('/grouplist', async(req, res, next) => {
  let token = req.headers.token;
  let decoded = jwt.verify(token);
  if(decoded === -1) {
    res.status(400).send({
      message : "Verification Failed"
    });
  } else {
    let u_idx = decoded.u_idx;
    let result = await sql.showAllGroupsJoined(u_idx);
    res.status(200).send({
      message : "Success to Load Group List",
      data : result
    });
  }
});

module.exports = router;
