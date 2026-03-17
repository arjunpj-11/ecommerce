var express = require('express');
var router = express.Router();

const google = require('./api/google')
const facebook = require('./api/facebook')
const razorpay = require('./api/razropay')



router.use('/google',google)
router.use('/facebook',facebook)
router.use('/razorpay',razorpay)



module.exports = router;
