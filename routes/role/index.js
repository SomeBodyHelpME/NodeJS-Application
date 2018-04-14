var express = require('express');
var router = express.Router();

router.use('/register', require('./register.js'));
router.use('/show', require('./show.js'));
router.use('/modify', require('./modify.js'));
router.use('/remove', require('./remove.js'));

module.exports = router;
