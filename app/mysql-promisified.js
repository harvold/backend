const mysql = require('mysql');

let con;

/**
 * creates a connection and returns the connection
 * 
 * @param {ConnectionConfig} settings connection config for createConnection function of mysql module 
 */
function connect(settings) {
    con = mysql.createConnection(settings);
    con.connect(function (err) {
        if (err) throw err;
        console.log("MySQL Connected");
    });
}

/**
 * 
 * @param {string} sql SQL query string
 * @param {Array<string>} args arguments for the query
 */
function query(sql, args) {
    return new Promise((resolve, reject) => {
        con.query(sql, args, (err, result) => {
            if (err)
                return reject(err);
            resolve(result);
        });
    });
}


module.exports = { connect, query };
