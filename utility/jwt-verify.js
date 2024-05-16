function verifyToken(req, res, next) {
    // get auth header value
    const bearerHeader = req.headers['authorization'];
    if (typeof bearerHeader !== 'undefined') {
        // split
        const bearer = bearerHeader.split(' ');
        // get token from array
        const bearerToken = bearer[1];
        // set token
        req.token = bearerToken;
        next();
    } else {
        res.sendStatus(403);
    }
}

module.exports = verifyToken;