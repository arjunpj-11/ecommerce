var express = require("express");
var router = express.Router();

const google = require("./api/google");
const facebook = require("./api/facebook");

router.use("/google", google);
router.use("/facebook", facebook);

module.exports = router;
