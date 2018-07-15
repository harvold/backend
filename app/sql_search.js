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

async function getPlayer(req, res) {
	var user = req.params.username;
	
	var sql = "SELECT first_name, last_name, username, status FROM users WHERE username= ?";
	return new Promise((resolve, reject) =>
	{
		con.query(sql, [user], function(err, result)
		{
			if (err) reject(err);
			console.log("player_search");
			resolve(result);
		});
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

async function getPokemon(req){
	var user = req.query['username'];
	var sql = "SELECT name, hp, max_hp, exp, to_next FROM pokemon WHERE owner= ?";
	return new Promise((resolve, reject) =>
	{
		con.query(sql, [user], function(err, result)
		{
			if (err) reject(err);
			console.log ("searched");
			resolve (result);
		});
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

async function register(req){
	var user = req.body.username;
	var fname = req.body.first_name;
	var lname = req.body.last_name;
	var pass = req.body.password;
	var sql2 = "INSERT INTO users (first_name, last_name, username, password, status, last_active) VALUES (?, ?, ?, ?, 0, ?)";
	var exists = await verifyUserExistence(user);

	return new Promise(async (resolve, reject) =>
	{
		if (exists != 0)
		{
			resolve(400);
		}
		else
		{
			console.log("Here");
			var date = new Date;
			console.log(date.toString());
			con.query(sql2, [fname, lname, user, pass, date], function(err, result)
			{
				if (err) reject(err);
				else
				{
					console.log(result);
					resolve(200);
				}
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

async function login (req){
	var user = req.body.username;
	var code = await verifyUserExistence(user);
	
	return new Promise (async (resolve, reject) =>
	{
		if (code == 0)
		{
			resolve({code: 404, message: "User not found"});
		}
		else if (code > 1)
		{
			resolve({code: 500, message: "Duplicate users found"});
		}
		else
		{
			var response = await authenticate (req);
			resolve(response);
		}
	});
}

async function authenticate(req)
{
	var user = req.body.username;
	var pass = req.body.password;
	var sql = "SELECT password, status FROM users WHERE username = ?";
	return new Promise((resolve, reject) =>
	{
		con.query(sql, [user], function(err, result)
		{
			if (err) reject(err);
			else if (result.length == 1)
			{
				if (result[0].status == 1)
				{
					resolve({code: 403, message: "User already logged in"});
				}
				else if (pass === result[0].password)
				{
					changeStatus(user, 1);
					resolve({code: 200, message: "Login successful"});
				}
				else
				{
					resolve({code: 401, message: "Password incorrect"});
				}
				
			}
		});
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


async function verifyUserExistence(user)
{
	var sql = "SELECT * FROM users WHERE username = ?";
	
	return new Promise((resolve, reject) =>
	{
		con.query(sql, [user], function(err, result)
		{
			if (err) reject(err);
			else if (result.length == 1)
			{
				resolve(1)
			}
			else if (result.length > 1)
			{
				resolve(2);
			}
			else if (result.length == 0)
			{
				resolve(0);
			}
		});
	});	
}

async function challenge(req)
{
	var user = req.body.username;
	var target = req.body.target;
	var code = await verifyUserExistence(user);
	var code2 = await verifyUserExistence(target);
	var sql = "INSERT INTO battles (challenger, challenged, status, winner) VALUES (?, ?, 0, null)";
	return new Promise((resolve, reject) =>
	{
		if (code == 0)
		{
			resolve({code: 404, message: "User not found"})
		}
		else if (code > 1)
		{
			resolve({code: 500, message: "Duplicate users found"})
		}
		else if (code2 == 0)
		{
			resolve({code: 404, message: "Target not found"})
		}
		else if (code2 > 1)
		{
			resolve({code: 500, message: "Duplicate target found"})
		}
		else
		{
			con.query(sql, [user, target], function (err, result)
			{
				if (err) throw err;
				else
				{
					resolve({code: 200, message: "Battle created"})
				}
			});
		}
	});
	
}

async function checkRecency (time, username)
{
	var sql = "SELECT last_active FROM users WHERE username = ?";
	
	return new Promise((resolve, reject) =>
	{
		con.query(sql, [username], function (err, result)
		{
			if (err) reject(err);
			else
			{
				searchresult = result[0];
				var millislast = Date.parse(searchresult.last_active);
				var millisnow = Date.parse(time);
				if (millisnow - millislast > 20000)
				{
					changeStatus(username, 0);
					resolve(false);
				}
				else
				{
					changeStatus(username, 1);
					resolve(true);
				}
			}
		});
	});
}

async function getLatestBattles(username)
{
	var sql = "SELECT id, challenger FROM battles WHERE (challenged = ? AND status = 0)";
	return new Promise((resolve, reject) =>
	{
		con.query(sql, [username], function(err, result)
		{
			if (err) reject(err);
			else
			{
				resolve(result);
			}
		});
	});
}

async function getBattleResponses(username)
{
	var sql = "SELECT id, status, challenger FROM battles WHERE (challenger = ? AND status = 9)";
	return new Promise ((resolve, reject) =>
	{
		con.query(sql, [username], function(err, result)
		{
			if (err) reject(err);
			else
			{
				resolve(result);
			}
		});
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
async function logout(req)
{
	var user = req.body.username;
	var sql = "SELECT status FROM users WHERE username = ?";
	var code = await verifyUserExistence(user);
	return new Promise(async(resolve, reject) =>
	{
		if (code == 0)
		{
			resolve({code: 404, message: "User not found"});
		}
		else if (code > 1)
		{
			resolve({code: 500, message: "Duplicate users exist"});
		}
		else
		{
			var result = await applyLogOut(req);
			resolve(result);
		}
	});
}

async function applyLogOut(req)
{
	var user = req.body.username;
	var sql = "SELECT status FROM users WHERE username = ?";
	return new Promise((resolve, reject) =>
	{
		con.query(sql, [user], function(err, result)
		{
			if (err) reject(err);
			else if(result[0].status == 0)
			{
				resolve({code: 403, message: "Already logged out"});
			}
			else
			{
				changeStatus(user, 0);
				resolve({code: 200, message: "Logged out"});
			}
		});
	});
}



async function rejectBattle(req)
{
	var user = req.body.username;
	var id = req.body.id;
	var sql = "UPDATE battles SET status = -1 WHERE (id = ? AND challenged = ?)";
	var code = await verifyUserExistence(user);
	return new Promise(async (resolve, reject) =>
	{
		if (code == 0)
		{
			resolve({code:404, message: "User not found"});
		}
		else if (code > 1)
		{
			resolve({code:500, message: "Duplicate users found"});
		}
		else
		{
			con.query(sql, [id, user], function(err, result)
			{
				if (err) reject(err);
				else if (result.changedRows < 1)
				{
					resolve({code:404, message: "Battle not found"});
				}
				else
				{
					resolve({code:200, message: "Battle cancelled"});
				}
			});
		}
	});
}

async function checkIn(req)
{
	var user = req.body.username;
	var last_time = req.body.timestamp;
	console.log("Here")
	var code = await verifyUserExistence(user);

	return new Promise(async (resolve, reject) =>
	{
		if (code == 0)
		{
			resolve({code: 404, message: "User not found"});
		}
		else if (code > 1)
		{
			resolve({code: 500, message: "Duplicate users found"});
		}
		else
		{
			var recent = await checkRecency(last_time, user);
			if (!recent)
			{
				resolve({code: 403, message: "Session timed out, please log in again"});
			}
			else
			{
				var challenges = await getLatestBattles(user);
				var responses = await getBattleResponses(user);
				resolve({code: 200, info: ({message: "OK", battles_pending: challenges, battles_accepted: responses})});
			}
		}
	});
	
}
function acceptBattle(req, res)
{
	var user = req.body.username;
	var id = req.body.id;
	var sql1 = "UPDATE battles SET status = 9 WHERE (id = ? AND challenged = ?";
	verifyUserExistence(user, function (code)
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
				else if (result.changedRows < 1)
				{
					res.status(404).send("Battle not found");
				}
				else
				{
					res.status(200).json({message: "Battle accepted", id: id});
				}
			});
		}
	});
}

module.exports = { getPlayer, getPokemon, register, login, logout, checkIn, challenge, rejectBattle, acceptBattle };