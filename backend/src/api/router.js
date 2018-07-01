const express = require('express');
const router = express.Router();

const mysql = require('mysql');

var con = mysql.createConnection({
	host: 'localhost',
	user: 'standarduser',
	password: "",
	database: 'harvold'
});

con.connect(function(err)
{
	if (err) 
		throw err;
	console.log("MySQL Connected");
});

router.get('/get_pokemon', function (req, res) {
	var user = req.query['username'];
	var sql = "SELECT name, hp, max_hp, exp, to_next FROM pokemon WHERE owner= ?";
	con.query(sql, [user], function(err, result)
	{
		if (err) throw err;
		console.log ("searched");
		res.status(200).json(result);
	});
})

router.get('/', function (req, res) {
	res.send('hello world');
})
module.exports = router;
