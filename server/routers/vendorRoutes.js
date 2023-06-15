const router = require('express').Router();
const vendorController = require('../controllers/vendorController/signup')


router.post('/vendorMobile', vendorController.mobileExist) //
router.post('/vendorSignup', vendorController.vendorSignup) //
router.post('/signin', vendorController.signin);
module.exports=router;