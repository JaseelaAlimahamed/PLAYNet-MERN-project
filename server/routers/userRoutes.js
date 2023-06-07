const express = require('express')
const router = express.Router();
const userController = require('../controllers/userController/signIn')

// signIn SignUp
router.post('/signup', userController.userSignup) //
router.post('/signin', userController.userSignin) //
router.post('/mobileExist', userController.mobileExist) //

router.post('/signin/google', userController.googleSignin) //

module.exports=router;