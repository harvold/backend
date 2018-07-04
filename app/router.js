const express = require('express');

const sqlSearch = require('./sql_search');

const router = express.Router();


router.get('/get_pokemon', function (req, res) {
	sqlSearch.getPokemon(req, res);
})

router.get('/', function (req, res) {
	res.send('hello world');
});

router.get('/u/:username', function (req, res) {
	sqlSearch.getPlayer(req, res);
});

module.exports = router;
