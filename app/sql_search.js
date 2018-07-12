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

/**
 *	Gets the basic information of all pokemon owned by a player
 *	
 *	Params:
 *	username - username to query;
 *	
 *	Returns:
 *	A list of all pokemon owned by a trainer in json format.
 */

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

/**
 *	Registers a new player
 *	
 *	Params:
 *	username - username of the new player
 *	first_name - first name of the new player
 * 	last_name - last name of the new player
 *	password - password for the new player
 *
 *	Responses:
 *	200 - Success
 *	400 - User already exists, please choose different username
 */

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
			var sql2 = "INSERT INTO users (first_name, last_name, username, password, status, last_active) VALUES (?, ?, ?, ?, 0, ?)"
			con.query(sql2, [fname, lname, user, pass, Date.now()], function(err, result)
			{
				if (err) throw err;
				console.log(result);
				res.status(200).end();
			});
		}
	});
}

/**
 *	Logs a user in
 *
 *	Params:
 *	username - username of the user to be logged in
 *	password - password of that user
 *
 *	Responses:
 *	200 - Success
 *	401 - Password incorrect
 *	403 - User already logged in
 *	404 - User does not exists
 * 	500 - Duplicate users (This should never happen)
 */

function login (req, res){
	var user = req.body.username;
	var pass = req.body.password;
	var sql = "SELECT password, status FROM users WHERE username = ?";
	
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
					if (result[0].status == 1)
					{
						res.status(403).send("User already logged in");
					}
					else if (pass === result[0].password)
					{
						changeStatus(user, 1);
						res.status(200).send("Login successful");
					}
					else
					{
						res.status(401).send("Password incorrect");
					}
					
				}
			});
		}
	});
}

/**
 *	Change status of user
 *	
 *	Params:
 *	user - username of the user in question
 *	state - status to be changed to (0 for offline, 1 for online, 2 for in battle, etc.)
 */

function changeStatus(user, state)
{
	console.log(new Date());
	var sql = "UPDATE users SET status = ?, last_active = ? WHERE username = ?";
	con.query(sql, [state, new Date(), user], function(err, result)
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

function createBattle(req, res)
{
	var user = req.body.username;
	var target = req.body.target;
	var sql = "INSERT INTO battles (challenger, challenged, status, winner) VALUES (?, ?, 0, null)";
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
			verifyUserExistence(target, 
			function(code)
			{
				if (code == 0)
				{
					res.status(404).send("Target not found");
				}
				else if (code > 1)
				{
					res.status(500).send("Duplicate target found");
				}
				else
				{
					console.query(sql, [user, target], function (err, result)
					{
						if (err) err;
						else
						{
							res.status(200).send("Battle created");
						}
					});
				}
			});
		}
	});
}

function checkRecency (time, username, callback)
{
	var sql = "SELECT last_active FROM users WHERE username = ?";
	con.query(sql, [username], function (err, result)
	{
		if (err) throw err;
		else
		{
			searchresult = result[0];
			var millislast = Date.parse(searchresult.last_active);
			var millisnow = Date.parse(time);
			if (millisnow - millislast > 20000)
			{
				changeStatus(username, 0);
				callback(false);
			}
			else
			{
				changeStatus(username, 1);
				callback(true);
			}
		}
	});
}

function getLatestBattles(username, callback)
{
	var sql = "SELECT id, challenger FROM battles WHERE (challenged = ? AND status = 0)";
	con.query(sql, [username], function(err, result)
	{
		if (err) throw err;
		else
		{
			callback(result);
		}
	});
}

function getBattleResponses(username, clalback)
{
	var sql = "SELECT id, status, challenger FROM battles WHERE (challenger = ? AND status = 9)";
	con.query(sql, [username], function(err, result)
	{
		if (err) throw err;
		else
		{
			callback(result);
		}
	});
}

/**
 *	Logs a user out
 *
 *	Params:
 *	username - username of the user to be logged out
 *
 *	Responses:
 *	200 - Success
 *	403 - User already logged out
 *	404 - User does not exists
 * 	500 - Duplicate users (This should never happen)
 */
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

function rejectBattle(req, res)
{
	var user = req.body.username;
	var id = req.body.id;
	var sql = "UPDATE battles SET status = -1 WHERE (id = ? AND user = ?)"
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
			con.query(sql, [id, user], function(err, result)
			{
				if (err) throw err;
				res.status(200).send(result.affectedRows + " battles cancelled");
			});
		}
	});
}

function checkIn(req, res)
{
	var user = req.body.username;
	var last_time = req.body.timestamp;
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
			checkRecency(last_time, user, function(recent)
			{
				if (!recent)
				{
					res.status(403).send("Session timed out, please log in again.");
				}
				else
				{
					getLatestBattles(user, function (result)
					{
						getBattleResponses(user, function(accepted_result)
						{
							res.status(200).send({message: "OK", battles_pending: result, battles_accepted: accepted_result});
						});
					});
				}
			});
		}
	});
}

module.exports = { getPlayer, getPokemon, insertPlayer, login, logout, checkIn, createBattle, rejectBattle };