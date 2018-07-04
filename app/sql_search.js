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

function getPlayer(req, res) {
	var user = req.params.username;
	
	var sql = "SELECT first_name, last_name, username, status FROM users WHERE username= ?";
	con.query(sql, [user], function(err, result)
	{
		if (err) throw err;
		console.log("player_search");
		res.status(200).json(result);
	});
    
}

function getPokemon(req, res){
	var user = req.query['username'];
	var sql = "SELECT name, hp, max_hp, exp, to_next FROM pokemon WHERE owner= ?";
	con.query(sql, [user], function(err, result)
	{
		if (err) throw err;
		console.log ("searched");
		res.status(200).json(result);
	});
}
module.exports = { getPlayer };