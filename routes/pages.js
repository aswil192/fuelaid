const express = require('express');
const router = express.Router();
router.get('/terms', (req, res) => {
    res.render('pages/terms');
  });
  
  // Route for Refunds and Cancellations page
  router.get('/refunds', (req, res) => {
    res.render('pages/refunds');
  });
  
  // Route for Privacy Policy page
  router.get('/policy', (req, res) => {
    res.render('pages/policy');
  });
  
  // Route for Products/Services page
  router.get('/products', (req, res) => {
    res.render('pages/products');
  });

  router.get('/contact-us', (req, res) => {
    res.render('pages/contact-us');
  });
  

  module.exports=router;