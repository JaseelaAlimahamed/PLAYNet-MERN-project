const router = require('express').Router();
const adminController = require('../controllers/adminController/adminLogin');
const sportsController= require('../controllers/adminController/sportsController')
const verifyToken = require('../middlewares/adminVerifyToken')

router.post('/signin', adminController.adminLogin); 

router.get('/sports',verifyToken, sportsController.getSports) //
router.post('/sports/add',verifyToken, sportsController.addSports) //
router.put('/sports/status',verifyToken, sportsController.changeStatus) //


module.exports=router;