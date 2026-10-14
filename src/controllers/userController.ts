import prisma from '../config/prisma.js';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';

export const get_all_users = async (
    req:Request,
    res:Response,
    next:NextFunction
) => {
    try{
        const users = await prisma.user.findMany({
            select:{
                userId:true,
                userName:true,
                email:true,
                role:true,
                birthDate:true
            }
        });
        res.status(200).json({ 
            status: "success",
            data: users
        });
    }
    catch(err){
        next(err);
    }
};

export const get_profile = async (
    req:Request,
    res:Response,
    next:NextFunction
) => {
    try{
        const userId = req.user?.userId
        const user = await prisma.user.findUnique({
            where:{
                userId
            },
            select:{
                userName:true,
                email:true,
                posts:{
                    select:{
                        postId:true,
                        title:true,
                        postBody:true,
                        comments:{
                            select:{
                                commentBody:true,
                                commentId:true,
                                user:{
                                    select:{
                                        userName:true,
                                    },
                                },
                            },
                        },
                        likes:{
                            select:{
                                likeType:true,
                                user:{
                                    select:{
                                        userName:true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        res.status(200).json({ user });
    }
    catch(err){
        next(err);
    }
};

// for owening user to update his profile and admin to update any user profile
export const update_profile = async (
    req:Request,
    res:Response,
    next:NextFunction
) => {
    try{
        const userId = req.user?.userId
        const { userName , email } = req.body;
        if(!userId){
            throw next(new AppError("Unauthorized" , 401));
        }
        const user = await prisma.user.update({
            where:{
                userId
            },
            data:{
                userName,
                email
            },
            select:{
                userName:true,
                email:true,
                role:true,
                birthDate:true
            }
        });
        res.status(200).json({ user });
    }
    catch(err){
        next(err);
    }
};

export const delete_user = async (
    req:Request,
    res:Response,
    next:NextFunction
) => {
    try{
        const userId  = String(req.params.id);
        await prisma.user.delete({
            where:{
                userId,
            },
        });
        res.status(200).json({
            message: "User deleted successfully"
        })
    }
    catch(err){
        next(err)
    }
}
