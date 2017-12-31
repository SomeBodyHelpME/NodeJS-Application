var express = require('express');
var router = express.Router();

router.use('/group', require('./group.js'));
router.use('/detail', require('./detail.js'));

module.exports = router;
