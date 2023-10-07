const express = require('express');
const router = express.Router();
const config = require('../config/config')[env];
const user = require('./users');
const auth = require('./auth');
const admin = require('./admin');
const resources = require('./resources');
const events = require('./events')
const jobs = require('./jobs')
const quizzes = require('./quizzes')
const utils = require('./utils')
const base = `/api/v1`

const prometheus = require('prom-client');
const { register } = prometheus;

router.get('/', (req, res) => {
  res.render('index', {
    title: 'TechNoob API',
    environment: config.NODE_ENV
  });

});



router.use(`${base}/user`, user);
router.use(`${base}/authenticate`, auth);
router.use(`${base}/admin`, admin);
router.use(`${base}/resources`, resources);
router.use(`${base}/utils`, utils);
router.use(`${base}/events`, events);
router.use(`${base}/jobs`, jobs);
router.use(`${base}/quizzes`, quizzes)

// Prometheus middleware
router.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.send(await register.metrics());
  } catch (error) {
    res.status(500).send(error);
  }
});

router.all('*', (req, res) => {
  console.log(req.method, req.originalUrl)
  return res.status(400).json({
    status: 'fail',
    message: `Can't find (${req.method}) ${req.originalUrl} on this server. Please check the documentation for the correct route.`
  })

});

module.exports = router;
