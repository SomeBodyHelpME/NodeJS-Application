var express = require('express');
var router = express.Router();

router.use('/', require('./register.js'));
router.use('/', require('./show.js'));
router.use('/', require('./modify.js'));
router.use('/', require('./remove.js'));

module.exports = router;
