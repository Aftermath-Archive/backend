const jwt = require('jsonwebtoken');

const verifyTokenMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ message: 'No token provided' });

    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
        console.log(decoded);
        
        if (err) return res.status(403).json({ message: 'Failed to authenticate token' });
        
        req.userId = decoded.id;
        next();
    });
};

module.exports = verifyTokenMiddleware;