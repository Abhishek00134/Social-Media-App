import 'dotenv/config';
import jwt from 'jsonwebtoken';
import userModel from '../models/user.js';

const getAccessSecret = () =>
    process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET || 'pulsechat_jwt_secret_fallback_key';

export const protectRoute = async (req, res, next) => {
    try {
        const token =
            req.cookies.accessToken ||
            req.headers.authorization?.split(' ')[1] ||
            req.cookies.token;

        if (!token) {
            return res.status(401).json({ message: 'Unauthorized - No access token provided' });
        }

        const decoded = jwt.verify(token, getAccessSecret());
        if (!decoded || !decoded.id) {
            return res.status(401).json({ message: 'Unauthorized - Invalid access token' });
        }

        const user = await userModel.findById(decoded.id).select('-password -refreshToken');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Error in auth middleware:', error.message);
        return res.status(401).json({ message: 'Unauthorized - Invalid or expired access token' });
    }
};
