import { publishToQueue } from "../config/rabbitmq.js";
import TryCatch from "../config/TryCatch.js";
import { redisClient } from "../index.js";

export const loginUser=TryCatch(async(req,res)=>{

    const { email, password } = req.body;

    // Rate limiting logic
    const rateLimitKey=`otp:rateLimit:${email}`;
    const rateLimit=await redisClient.get(rateLimitKey);

    if(rateLimit){
        res.status(429).json({
            message: "Too many requests. Please try again later."   
        });
        return;
    }
    //create OTP
    const otp=Math.floor(100000 + Math.random() * 900000).toString();
    const otpKey=`otp:${email}`;
    await redisClient.set(otpKey, otp, 'EX', 300); // Store OTP for 5 minutes
    await redisClient.set(rateLimitKey, '1', 'EX', 60); // Set rate limit for 1 minute

    // Publish OTP to RabbitMQ
  const message = {
    to: email,
    subject: "Your OTP Code",
    body: `Your OTP code is ${otp}. It is valid for 5 minutes.`

  }
  await publishToQueue("send-otp", message);

    res.status(200).json({
        message: "OTP sent successfully"
    });

})