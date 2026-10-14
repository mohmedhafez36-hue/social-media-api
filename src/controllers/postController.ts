import prisma from '../config/prisma.js';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';


export const create_post = async (
    req:Request,
    res:Response,
    next:NextFunction
) => {
    try{
        const {title , postBody} = req.body;
        const userId = req.user?.userId;

        const post = await prisma.post.create({
            data:{
                title,
                postBody,
                userId
            },
        })
        res.status(201).json({
            status: 'success',
            data: {
                post
            }
        })
    } catch (error) {
        next(error)
    }
};

export const update_post = async (
    req:Request,
    res:Response,
    next:NextFunction
) => {
    try{
        const postId =  String(req.params.id);
        const userId = req.user?.userId;
        const userRole = req.user?.role;
        const {title , postBody} = req.body;

        const post = await prisma.post.findUnique({
            where:{
                postId
            },
        });
        if(userId !== post?.userId && userRole !== "ADMIN"){
            return next(new AppError('You are not authorized to update this post', 403));
        }
        await prisma.post.update({
            where:{
                postId
            },
            data:{
                title,
                postBody
            }
        });
        res.status(200).json({
            status: 'success',
            data: {
                post
            }
        });
    } catch (error) {
        next(error);
    }
};

export const delete_post = async (
    req:Request,
    res:Response,
    next:NextFunction
) => {
    try{
        const postId = String(req.params.id);
        const userId = req.user?.userId;
        const userRole = req.user?.role;

        const post = await prisma.post.findUnique({
            where:{
                postId,
            },
        });
        if(post?.userId !== userId && userRole !== "ADMIN"){
            throw new AppError("You are not allowed to delete this post", 403)
        }
        await prisma.post.delete({
            where:{
                postId,
            },
        });
        res.status(200).json({
            status:"Success",
            message:"Post deleted successfully"
        })
    }
    catch(err){
        next(err);
    }
}