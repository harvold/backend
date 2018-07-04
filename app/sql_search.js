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

function insertPlayer(req, res){
	var user = req.body.username;
	var fname = req.body.first_name;
	var lname = req.body.last_name;
	var pass = req.body.password;
	
	verifyUserExistence(user, function(code)
	{
		if (code != 0)
		{
			res.statusMessage = "Username already exists.";
			res.status(400).end();
		}
		else
		{
			var sql2 = "INSERT INTO users (first_name, last_name, username, password, status) VALUES (?, ?, ?, ?, 0)"
			con.query(sql2, [fname, lname, user, pass], function(err, result)
			{
				if (err) throw err;
				console.log(result);
				res.status(200).end();
			});
		}
	});
}

function login (req, res){
	var user = req.body.username;
	var pass = req.body.password;
	var sql = "SELECT password FROM users WHERE username = ?";
	
	verifyUserExistence(user, function(code){
		if (code == 0)
		{
			res.status(404).send("User not found");
		}
		else if (code > 1)
		{
			res.status(500).send("Duplicate users found");
		}
		else
		{
			con.query(sql, [user], function(err, result)
			{
				if (err) throw err;
				else if (result.length == 1)
				{
					if (pass === result[0].password)
					{
						changeStatus(user, 1);
						res.status(200).send("Login successful");
					}
					else
					{
						res.status(403).send("Password incorrect");
					}
					
				}
			});
		}
	});
}

function changeStatus(user, state)
{
	var sql = "UPDATE users SET status = ? WHERE username = ?";
	con.query(sql, [state, user], function(err, result)
	{
		if (err) throw err;
		else 
		{
			console.log(result);
		}
	});
}

function verifyUserExistence(user, callback)
{
	var sql = "SELECT * FROM users WHERE username = ?";
	con.query(sql, [user], function(err, result)
	{
		if (err) throw err;
		else if (result.length == 1)
		{
			callback(1);
		}
		else if (result.length > 1)
		{
			callback(2);
		}
		else if (result.length == 0)
		{
			callback(0);
		}
	});
}

function logout(req, res)
{
	var user = req.body.username;
	var sql = "SELECT status FROM users WHERE username = ?";
	verifyUserExistence(user, function(code)
	{
		if (code == 0)
		{
			res.status(404).send("User not found");
		}
		else if (code > 1)
		{
			res.status(500).send("Duplicate users found");
		}
		else
		{
			con.query(sql, [user], function(err, result)
			{
				if(result[0].status == 0)
				{
					res.status(403).send("Already logged out");
				}
				else
				{
					changeStatus(user, 0);
					res.status(200).send("Logged out");
				}
			});
		}
	});
}
module.exports = { getPlayer, getPokemon, insertPlayer, login, logout};