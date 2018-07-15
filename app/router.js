const express = require('express');

const sqlSearch = require('./sql_search');

const router = express.Router();

router.get('/get_pokemon', async function (req, res, next) {
	try
	{
		var data = await sqlSearch.getPokemon(req);
		//console.log(data);
		res.status(200).send(data);
	}
	catch(err)
	{
		next(err);
		console.log(err);
		res.status(500).send(data);

		return;
	}
});

router.get('/', function (req, res) {
	res.send('hello world');
});

router.get('/u/:username', async function (req, res, next) {
	try
	{
		var data = await sqlSearch.getPlayer(req, res);
		res.status(200).send(data);
	}
	catch(err)
	{
		next(err);
		console.log(err);
		res.status(500).send(data);	
		return;
	}
	
});

router.route('/register').put(async function (req, res, next){
	//console.log(req.body);
	try
	{
		var data = await sqlSearch.register(req);
		res.status(data).end();
	}
	catch(err)
	{
		next(err);
		console.log(err);
		res.status(500).send(data);
		return;
	}
});

router.route('/challenge').post(async function (req, res, next){
	try
	{
		var data = await sqlSearch.challenge(req);
		res.status(data.code).send(data.message);
	}
	catch(err)
	{
		next(err);
		console.log(err);
		res.status(500).send(data);
		return;
	}
});

router.route('/reject_battle').post(async function (req, res, next){
	try
	{
		var data = await sqlSearch.rejectBattle(req);
		res.status(data.code).send(data.message);
	}
	catch(err)
	{
		next(err);
		console.log(err);
		res.status(500).send(data);
		return;
	}
});

router.route('/login').post(async function(req, res, next){
	try
	{
		var data = await sqlSearch.login(req);
		res.status(data.code).send(data.message);
	}
	catch(err)
	{
		next(err);
		console.log(err);
		res.status(500).send(data);
		return;
	}
});

router.route('/logout').post(async function(req, res, next){
	try
	{
		var data = await sqlSearch.logout(req, res);
		res.status(data.code).send(data.message);
	}
	catch(err)
	{
		next(err);
		console.log(err);
		res.status(500).send(data);
		return;
	}
});

router.route('/checkin').post(async function(req, res, next){
	try
	{
		var data = await sqlSearch.checkIn(req);
		
		if (data.code == 200)
		{
			res.status(data.code).json(data.info);
		}
		else
		{
			res.status(data.code).send(data.message);
		}
	}
	catch(err)
	{
		next(err);
		console.log(err);
		res.status(500).send(data);
		return;
	}
});


module.exports = router;
