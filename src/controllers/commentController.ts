import prisma from '../config/prisma.js';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';

export const create_comment = async (
    req:Request,
    res:Response,
    next:NextFunction,
) => {
    try{
        const postId = String(req.params.id);
        const userId = req.user?.userId;
        const {commentBody} = req.body;
        if( !userId || !commentBody){
            throw next(new AppError("Missing required fields" , 400));
        }
        const comment = await prisma.comment.create({
            data:{
                commentBody,
                postId,
                userId,
            },  
            select:{
                commentBody:true,
                commentId:true,
                user:{
                    select:{
                        userName:true
                    }
                }
            }
        });
        res.status(201).json({
            status:"Success",
            message:"Comment created successfully",
            comment:comment
        });
    }
    catch(err){
        next(err);
    }
};

export const update_comment = async (
    req:Request,
    res:Response,
    next:NextFunction,
) => {
    try{
        const commentId = String(req.params.id);
        const userId = req.user?.userId;
        const {commentBody} = req.body;

        const comment = await prisma.comment.findUnique({
            where:{
                commentId,
            },
        });
        if(comment?.userId !== userId){
            throw next(new AppError("Unauthorized" , 401));
        }
        await prisma.comment.update({
            where:{
                commentId,
                userId,
            },
            data:{
                commentBody,
            }
        });
        res.status(200).json({
            status:"Success",
            message:"Comment updated successfully"
        });
    }
    catch(err){
        next(err);
    }
};

export const delete_comment = async (
    req:Request,
    res:Response,
    next:NextFunction,
) => {
    try{
        const  commentId  = String(req.params.id);

        const userId = req.user!.userId;
        const userRole = req.user!.role;
        const comment = await prisma.comment.findUnique({
            where:{
                commentId,
            },
            include:{
                user:true,
                post:{
                    select:{
                        userId:true,
                    },
                },
            },
        });

        if(comment?.userId !== userId && comment?.post.userId !== userId && userRole !== "ADMIN"){
            throw next(new AppError("Unauthorized" , 401));
        }
        await prisma.comment.delete({
            where:{
                commentId,
            },
        });
        res.status(200).json({
            status:"Success",
            message:"Comment deleted successfully"
        });
    }
    catch(err){
        next(err);
    }
}