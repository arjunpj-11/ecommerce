var express = require('express');
var router = express.Router();
const authController = require('../../controllers/authentication/login');

/* GET home page. */
router.get('/', authController.getLoginPage);

/* POST login authentication. */
router.post('/loginAuth', authController.loginAuth);

module.exports = router;