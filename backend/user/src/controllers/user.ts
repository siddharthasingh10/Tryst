import { publishToQueue } from "../config/rabbitmq.js";
import TryCatch from "../config/TryCatch.js";
import { redisClient } from "../index.js";
import { User } from "../model/User.js";

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

// Controller function to verify a user using email and OTP
export const verifyUser = TryCatch(async (req, res) => {
  const { email, otp: enteredOtp } = req.body;

  // 1. Validate request body
  if (!email || !enteredOtp) {
    res.status(400).json({
      message: "Email and OTP Required",
    });
    return;
  }

  // 2. Create a Redis key for storing OTP against the email
  const otpKey = `otp:${email}`;

  // 3. Fetch OTP from Redis
  const storedOtp = await redisClient.get(otpKey);

  // 4. Check if OTP exists and matches the entered one
  if (!storedOtp || storedOtp !== enteredOtp) {
    res.status(400).json({
      message: "Invalid or expired OTP",
    });
    return;
  }

  // 5. OTP is valid → delete it from Redis to prevent reuse
  await redisClient.del(otpKey);

  // 6. Check if user already exists in DB
  let user = await User.findOne({ email });

  // 7. If not, create a new user with part of email as default name
  if (!user) {
    const name = email.slice(0, 8); // e.g., first 8 chars of email used as name
    user = await User.create({ name, email });
  }

  // 8. Generate JWT token for authentication
  const token = generateToken(user);

  // 9. Send success response with user details and token
  res.json({
    message: "User Verified",
    user,
    token,
  });
});
