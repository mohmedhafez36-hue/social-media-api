-- CreateEnum
CREATE TYPE "LikeStatus" AS ENUM ('LOVE', 'FUNNY', 'SAD', 'LIKE');

-- CreateTable
CREATE TABLE "User" (
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Post" (
    "postId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "postBody" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("postId")
);

-- CreateTable
CREATE TABLE "Comment" (
    "commentId" TEXT NOT NULL,
    "commentBody" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("commentId")
);

-- CreateTable
CREATE TABLE "Like" (
    "likeId" TEXT NOT NULL,
    "likeType" "LikeStatus" NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,

    CONSTRAINT "Like_pkey" PRIMARY KEY ("likeId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Like_userId_postId_key" ON "Like"("userId", "postId");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("postId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("postId") ON DELETE CASCADE ON UPDATE CASCADE;
