import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || '310acce7e62c4e9f16ce17a04d6cbdaf5a859926f896a8e85e1dcfa095378333b';

export default function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}
