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

router.route('/challenge').post(function (req, res){
	sqlSearch.createBattle(req, res);
});

router.route('/reject_battle').post(function (req, res){
	sqlSearch.rejectBattle(req, res);
});

router.route('/login').post(function(req, res){
	sqlSearch.login(req, res);
});

router.route('/logout').post(function(req, res){
	sqlSearch.logout(req, res);
});

router.route('/checkin').post(function(req, res){
	sqlSearch.checkIn(req, res);
});

module.exports = router;
