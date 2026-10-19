import express from 'express';
import cookieParser from "cookie-parser";
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import { errorHandler } from './middlewares/errorHandler.js';

import userRoute from './routes/userRoute.js';
import postRoute from './routes/postRoutes.js';
import commentRoute from './routes/commentRoutes.js';
import authRoute from './routes/authRoutes.js'

import { generalRateLimiter } from './middlewares/rateLimiter.js';

const app = express();

app.use(helmet({
    contentSecurityPolicy: false,
    xDownloadOptions: false,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
}));
app.use(cookieParser());
app.use(generalRateLimiter);

app.disable("x-powered-by");

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Social Media API',
            version: '1.0.0',
            description: '',
        },
        servers: [
            {
                url: 'http://localhost:3000',
            },
        ],
    },
    // المسارات التي تحتوي على التعليقات البرمجية لتوثيقها
    apis: ['./src/routes/*.ts', './src/server.ts'],
};

const swaggerDocs = swaggerJSDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));



app.use("/api", authRoute);
app.use("/api/users", userRoute);
app.use("/api/posts", postRoute);
app.use("/api/comments", commentRoute);


app.use(errorHandler)

export default app;
