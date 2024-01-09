const express = require('express');
const router = express.Router();
const controller = require('../controllers/index');
const experimental = controller.experimental ;
const middleware = require('../middleware/index');

router.post('/compress', middleware.auth.isAuthenticated ,middleware.uploadStrategy.file ,experimental.compressFile)
router.post('/mockJob', middleware.auth.isAuthenticated ,experimental.mockJob)

module.exports = router;
