var express = require('express');
var router = express.Router();

router.use('/group', require('./group.js'));
router.use('/detail', require('./detail.js'));
router.use('/make', require('./make.js'));
router.use('/response', require('./response.js'));
router.use('/remove', require('./remove.js'));
router.use('/',require('./show.js'));

module.exports = router;
