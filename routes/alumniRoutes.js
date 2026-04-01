const express = require('express');
const alumniController = require('../controllers/alumniController');

const router = express.Router();

router.get('/', alumniController.getAll);
router.post('/', alumniController.create);
router.put('/:id', alumniController.update);
router.delete('/:id', alumniController.remove);

module.exports = router;
