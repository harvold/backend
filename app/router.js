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

router.post('/register', function (req, res){
	console.log(req.body);
	console.log(req.params);
	//sqlSearch.insertPlayer(req, res);
	res.status(200).send("received");
});

module.exports = router;
