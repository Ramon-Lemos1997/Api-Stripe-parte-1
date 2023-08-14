const express= require('express');
const router= express.Router();
const apiController= require('../controllers/apiController');


router.post('/create-checkout-session', apiController.apiStripe);


module.exports= router;