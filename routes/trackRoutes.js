const express = require('express');
const trackController = require('../controllers/trackController');

const router = express.Router();

router.post('/:id', trackController.track);

module.exports = router;
