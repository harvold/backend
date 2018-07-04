const express = require('express');

const playerStuff = require('./player-stuff');

const router = express.Router();

router.get('/', function (req, res) {
  res.send('hello world');
});

router.get('/u/:id', function (req, res) {
  playerStuff.getProfile(req, res);
});

module.exports = router;
