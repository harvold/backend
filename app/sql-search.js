const { connect, query } = require("./mysql-promisified");

connect({
    host: 'localhost',
    user: 'standarduser',
    password: "",
    database: 'harvold'
});

async function getPlayer(req, res) {
    const user = req.params.username;

    const sql = "SELECT first_name, last_name, username, status FROM users WHERE username= ?";
    return query(sql, [user]);
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

async function getPokemon(req) {
    const user = req.query['username'];
    const sql = "SELECT name, hp, max_hp, exp, to_next FROM pokemon WHERE owner= ?";
    return query(sql, [user]);
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

async function register(req) {
    const user = req.body.username;
    const fname = req.body.first_name;
    const lname = req.body.last_name;
    const pass = req.body.password;
    const sql2 = "INSERT INTO users (first_name, last_name, username, password, status, last_active) VALUES (?, ?, ?, ?, 0, ?)";
    const exists = await verifyUserExistence(user);

    if (exists != 0) {
        return 400;
    } else {
        console.log("Here");
        const date = new Date;
        console.log(date.toString());
        const result = await query(sql2, [fname, lname, user, pass, date]);
        console.log(result);
        return 200;
    }
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

async function login(req) {
    const user = req.body.username;
    const code = await verifyUserExistence(user);

    if (code == 0) {
        return { code: 404, message: "User not found" };
    }
    else if (code > 1) {
        return { code: 500, message: "Duplicate users found" };
    }
    else {
        return authenticate(req);
    }
}

async function authenticate(req) {
    const user = req.body.username;
    const pass = req.body.password;
    const sql = "SELECT password, status FROM users WHERE username = ?";

    const result = await query(sql, [user]);
    if (result.length == 1) {
        if (result[0].status == 1) {
            return { code: 403, message: "User already logged in" };
        }
        else if (pass === result[0].password) {
            await changeStatus(user, 1);
            return { code: 200, message: "Login successful" };
        }
        else {
            return { code: 401, message: "Password incorrect" };
        }
    }
    return { code: 500, message: "Why we do have more than one user with this username?" };
}

/**
 *	Change status of user
 *	
 *	Params:
 *	user - username of the user in question
 *	state - status to be changed to (0 for offline, 1 for online, 2 for in battle, etc.)
 */

async function changeStatus(user, state) {
    const date = new Date();
    const sql = "UPDATE users SET status = ?, last_active = ? WHERE username = ?";
    const result = await query(sql, [state, date, user]);
    console.log(result);
}


async function verifyUserExistence(user) {
    const sql = "SELECT * FROM users WHERE username = ?";

    const result = await query(sql, [user]);
    if (result.length == 1) {
        return 1;
    }
    else if (result.length > 1) {
        return 2;
    }
    else if (result.length == 0) {
        return 0;
    }
}

async function challenge(req) {
  const user = req.body.username;
  const target = req.body.target;
  const code = await verifyUserExistence(user);
  const code2 = await verifyUserExistence(target);
  const sql = "INSERT INTO battles (challenger, challenged, status, winner) VALUES (?, ?, 0, null)";

  if (code == 0) {
    return { code: 404, message: "User not found" };
  }
  else if (code > 1) {
    return { code: 500, message: "Duplicate users found" };
  }
  else if (code2 == 0) {
    return { code: 404, message: "Target not found" };
  }
  else if (code2 > 1) {
    return { code: 500, message: "Duplicate target found" };
  }
  else {
    await query(sql, [user, target]);
    return { code: 200, message: "Battle created" };
  }
}

async function checkRecency(time, username) {
    const sql = "SELECT last_active FROM users WHERE username = ?";

    const result = await query(sql, [username]);
    const searchresult = result[0];
    const millislast = Date.parse(searchresult.last_active);
    const millisnow = Date.parse(time);
    if (millisnow - millislast > 20000) {
        await changeStatus(username, 0);
        return false;
    }
    else {
        await changeStatus(username, 1);
        return true;
    }
}

async function getLatestBattles(username) {
    const sql = "SELECT id, challenger FROM battles WHERE (challenged = ? AND status = 0)";
    return query(sql, [username]);
}

async function getBattleResponses(username) {
    const sql = "SELECT id, status, challenger FROM battles WHERE (challenger = ? AND status = 9)";
    return query(sql, [username]);
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
async function logout(req) {
    const user = req.body.username;
    const code = await verifyUserExistence(user);
    if (code == 0) {
        return { code: 404, message: "User not found" };
    }
    else if (code > 1) {
        return { code: 500, message: "Duplicate users exist" };
    }
    else {
        return applyLogOut(req);
    }
}

async function applyLogOut(req) {
    const user = req.body.username;
    const sql = "SELECT status FROM users WHERE username = ?";
    const result = await query(sql, [user]);
    if (result[0].status == 0) {
        return { code: 403, message: "Already logged out" };
    }
    else {
        await changeStatus(user, 0);
        return { code: 200, message: "Logged out" };
    }
}



async function rejectBattle(req) {
    const user = req.body.username;
    const id = req.body.id;
    const sql = "UPDATE battles SET status = -1 WHERE (id = ? AND challenged = ?)";
    const code = await verifyUserExistence(user);

    if (code == 0) {
        return { code: 404, message: "User not found" };
    }
    else if (code > 1) {
        return { code: 500, message: "Duplicate users found" };
    }
    else {
        const result = query(sql, [id, user]);
        if (result.changedRows < 1) {
            return { code: 404, message: "Battle not found" };
        }
        else {
            return { code: 200, message: "Battle cancelled" };
        }
    }
}

async function checkIn(req) {
    const user = req.body.username;
    const last_time = req.body.timestamp;
    console.log("Here")
    const code = await verifyUserExistence(user);

    if (code == 0) {
        return { code: 404, message: "User not found" };
    }
    else if (code > 1) {
        return { code: 500, message: "Duplicate users found" };
    }
    else {
        const recent = await checkRecency(last_time, user);
        if (recent) {
            const challenges = await getLatestBattles(user);
            const responses = await getBattleResponses(user);
            return { code: 200, info: { message: "OK", battles_pending: challenges, battles_accepted: responses } };
        }
        else {
            return { code: 403, message: "Session timed out, please log in again" };
        }
    }
}

// TODO?
function acceptBattle(req, res) {
    const user = req.body.username;
    const id = req.body.id;
    const sql1 = "UPDATE battles SET status = 9 WHERE (id = ? AND challenged = ?)";
    verifyUserExistence(user, function (code) {
        if (code == 0) {
            res.status(404).send("User not found");
        }
        else if (code > 1) {
            res.status(500).send("Duplicate users found");
        }
        else {
            con.query(sql, [id, user], function (err, result) {
                if (err) throw err;
                else if (result.changedRows < 1) {
                    res.status(404).send("Battle not found");
                }
                else {
                    res.status(200).json({ message: "Battle accepted", id: id });
                }
            });
        }
    });
}

// Generates a random pokemon
async function randomPokemon(req, res)
{
    const map = req.body.map_name;
    const tiletype = req.body.tile_type;
    const concatenated = map + tiletype;
    
    console.log(concatenated);
    
    const sql1 = "SELECT possible_pokemon, level_min, level_max FROM mapdata WHERE name = ?";
    const query1 = await query(sql1, [concatenated]);
    const result = query1[0];
    const level = result['level_min'] + Math.floor(Math.random() * (result['level_max'] - result['level_min'] + 1));
    
    const choices = result['possible_pokemon'].toString().split(";");
    const generatedPokemon = choices[Math.floor(Math.random() * choices.length)];
    
    const sql2 = "SELECT name, type_1, type_2, ability_1, ability_2, ability_hidden, base_hp, base_atk, base_def, base_spa, base_spd, base_spe FROM pokemon_ref WHERE name = ?";
    const query2 = await query(sql2, [generatedPokemon]); 
    const result2 = query2[0];
    
    const nature = Math.floor(Math.random() *25);
    const sql3 = "SELECT name, atk_mod, def_mod, spe_mod, spa_mod, spd_mod FROM nature WHERE id = ?";
    const query3 = await query(sql3, [nature]);
    const result3 = query3[0];
    
    const whichAbility = Math.floor(Math.random() * 3);
    let ability = "";
    
    const ivs = [];
    for (let x = 0; x < 6; x++)
    {
        ivs.push(Math.floor(Math.random() * 32));
    }
    
    if ((whichAbility == 1 && result2['ability_2'] == "") || whichAbility == 0)
    {
        ability = result2['ability_1'];
    }
    else if (whichAbility == 1)
    {
        ability = result2['ability_2'];
    }
    else
    {
        ability = result2['ability_hidden'];
    }
    
    let pokemonReturned = {
        name: result2['name'],
        nature: result3['name'],
        type1: result2['type_1'],
        type2: result2['type_2'],
        ability: ability,
        hp: Math.floor((2 * result2['base_hp'] + ivs[0])*level/100) + level + 10,
        atk: Math.floor((Math.floor((2 * result2['base_atk'] + ivs[1]) * level/100) + 5)*result3['atk_mod']),
        def: Math.floor((Math.floor((2 * result2['base_def'] + ivs[2]) * level/100) + 5)*result3['def_mod']),
        spa: Math.floor((Math.floor((2 * result2['base_spa'] + ivs[3]) * level/100) + 5)*result3['spa_mod']),
        spd: Math.floor((Math.floor((2 * result2['base_spd'] + ivs[4]) * level/100) + 5)*result3['spd_mod']),
        spe: Math.floor((Math.floor((2 * result2['base_spe'] + ivs[5]) * level/100) + 5)*result3['spe_mod']),
    };
    
    console.log(pokemonReturned);
    
    const sql4 = "INSERT INTO pokemon (name, owner, box, hp, max_hp, exp, to_next, atk, sp_atk, def, sp_def, spe, hp_iv, atk_iv, def_iv, spa_iv, spd_iv, spe_iv) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)"
    const result4 = await query(sql4, [pokemonReturned.name, "wild", 0, pokemonReturned.hp, pokemonReturned.hp, 0, 100, pokemonReturned.atk, pokemonReturned.spa, pokemonReturned.def, pokemonReturned.spd, pokemonReturned.spe,
    ivs[0], ivs[1], ivs[2], ivs[3], ivs[4], ivs[5]]);
    
    pokemonReturned.id = result4.insertId;
    
    return { code: 200, data: pokemonReturned };
}


module.exports = { getPlayer, getPokemon, register, login, logout, checkIn, challenge, rejectBattle, acceptBattle, randomPokemon};