async function getPlayer(req, res) {
    const profile = { id: req.params.id }; //some data base stuff here
    res.status(200).send(profile);
}

module.exports = { getPlayer };