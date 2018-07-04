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

router.route('/register').put(function (req, res){
	//console.log(req.body);
	sqlSearch.verifyPlayer(req, res);
});

router.route('/login').post(function(req, res){
	sqlSearch.login(req, res);
});

router.route('/logout').post(function(req, res){
	sqlSearch.logout(req, res);
});

module.exports = router;
