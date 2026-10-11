import { verifyJwt } from '../config/security.js';

export default function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    try {
        const user = verifyJwt(token);
        req.user = user;
        next();
    } catch {
        return res.sendStatus(403);
    }
}
