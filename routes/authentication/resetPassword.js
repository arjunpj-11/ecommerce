var express = require('express');
var router = express.Router();
const passwordController = require('../../controllers/authentication/resetPassword');

/* GET reset password page. */
router.get('/', passwordController.getResetPasswordPage);

/* POST reset password confirmation. */
router.post('/resetPasswordConfirm', passwordController.resetPasswordConfirm);

module.exports = router;