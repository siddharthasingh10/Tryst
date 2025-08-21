import express from 'express'
import dotenv from 'dotenv'
import connectDB from './config/db.js';
import { createClient } from 'redis';
import userRoutes from './routes/user.js';
import { connectRabbitMQ } from './config/rabbitmq.js';

dotenv.config();
const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());
//DB START
connectDB();
connectRabbitMQ();

app.use('api/v1',userRoutes);

//REDIS 
export const redisClient = createClient({
    url: process.env.REDIS_URL
})
redisClient.connect().then(() => console.log('Redis connected successfully')).catch((err) => {
    console.error('Redis connection failed:', err);
    process.exit(1);
});

//SERVER START
app.listen(PORT, () => {
    console.log('Server is running on port 3000');
});