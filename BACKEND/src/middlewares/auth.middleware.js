const jwt = require("jsonwebtoken");

const verificarToken = (req, res, next) => {

    const token = req.headers["authorization"];

    if (!token) {
        return res.status(403).json({
            message: "Token requerido"
        });
    }

    try {

        const decoded = jwt.verify(
            token.replace("Bearer ", ""),
            process.env.JWT_SECRET
        );

        req.usuario = decoded;

        next();

    } catch (error) {
        res.status(401).json({
            message: "Token inválido"
        });
    }

};

module.exports = verificarToken;