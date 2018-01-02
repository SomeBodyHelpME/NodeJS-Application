
const express = require('express');
const router = express.Router();
const crypto = require('crypto-promise');

const jwt = require('../../module/jwt.js');
const db = require('../../module/pool.js');
const sql = require('../../module/sql.js');

router.get('/unperformed',async(req,res,next)=>{
	console.log(req.headers);
	console.log(req.header);
	let token = req.header.token;
  let decoded = jwt.verify(token);
  let u_idx = decoded.u_idx;

  console.log("decoded=",decoded);

  let result = await sql.findRestGroupThings(u_idx);
  console.log(result);

  res.status(200).send({
  	message:"Success",
  	data:result
  });
});

router.get('/address', async(req, res, next) => {
	let token = req.header.token;
    let decoded = jwt.verify(token);
    let u_idx = decoded.u_idx;
	let result = await sql.findAllGroupMemberAddr(u_idx);
	 console.log(result);

    res.status(200).send({
    	message:"Success",
    	data:result
    });
});

module.exports = router;
