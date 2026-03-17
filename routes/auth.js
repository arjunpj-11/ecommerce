var express = require('express');
var router = express.Router();

const signInRouter = require('./authentication/signin');
const signinOtpRouter = require('./authentication/signinotp')
const loginRouter = require('./authentication/login')
const forgetPasswordRouter = require('./authentication/forgetPassword')
const forgetPasswordOtpRouter = require('./authentication/forgetPasswordOtp')
const resetPasswordRouter = require('./authentication/resetPassword')



router.use('/signin', signInRouter)
router.use('/otp', signinOtpRouter)
router.use('/login', loginRouter)
router.use('/forgetPassword', forgetPasswordRouter)
router.use('/forgetPasswordOtp', forgetPasswordOtpRouter)
router.use('/resetPassword', resetPasswordRouter)

router.get('/terms', function(req, res, next) {
    res.render('../views/pages/authentication/terms', {
        siteName: 'Your Store Name',
        currency: 'USD',
        returnPeriod: '30',
        contactEmail: 'support@yourstore.com',
        contactPhone: '+1 (555) 123-4567',
        lastUpdated: 'December 29, 2024'
    });
});

router.get('/privacy', function(req, res, next) {
    res.render('../views/pages/authentication/privacy', {
        siteName: 'Your Store Name',
        minAge: '13',
        privacyEmail: 'privacy@yourstore.com',
        companyAddress: '123 Fashion Street, City, Country',
        lastUpdated: 'December 29, 2024'
    });
});

router.get('/resetSuccess', function(req, res, next) {
    res.render('../views/pages/authentication/resetSuccess');
  });

  router.get('/already', function(req, res, next) {
    let value = req.session.value;
  res.render('../views/pages/authentication/already',{value});
});

router.get('/blocked', function(req, res, next) {
  res.render('../views/pages/authentication/blocked');
});


module.exports = router;
