import jwt from "jsonwebtoken";
import 'dotenv/config';
import crypto from "crypto"

export const generateAccessToken = (userId:string , role:string) =>{
    return jwt.sign(
        {
            userId,
            role
        },
        process.env.JWT_SECRET!,
        {
            expiresIn:"15m"
        }
    );
};

export const generateRefreshToken = () => {
    return crypto.randomBytes(64).toString("hex")
};

export const hashToken = (token:string) => {
    return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex")
}