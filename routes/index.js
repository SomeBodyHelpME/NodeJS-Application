var express = require('express');
var router = express.Router();

router.use('/info', require('./info/index.js'));
router.use('/auth', require('./auth/index.js'));
router.use('/role', require('./role/index.js'));

router.get('/', (req, res) => {
  res.status(200).send({
    message : "TEST"
  });
});

module.exports = router;
