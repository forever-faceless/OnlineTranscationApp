const { JWT_SECRETS } = require("../config")
const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
    const header = req.headers.authorization;
    
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(403).json({
            message: "invalid header format"
        });
    }

    const token = header.split(" ")[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRETS);

        if (decoded.userId) {
            req.userId = decoded.userId;
            next();
        } else {
            return res.status(403).json({
                message: "invalid userId in token"
            });
        }
    } catch (err) {
        return res.status(403).json({
            message: "invalid token in the header"
        });
    }
};

module.exports = {
    auth
}