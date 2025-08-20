import amqp from "amqplib";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export const startSendOtpConsumer = async () => {
    try {
        // Connect to RabbitMQ server
        const connection = await amqp.connect({
            protocol: "amqp",
            hostname: process.env.RABBITMQ_HOST,
            port: parseInt(process.env.RABBITMQ_PORT || "5672"),
            username: process.env.RABBITMQ_USER,
            password: process.env.RABBITMQ_PASSWORD
        });

        // Create a channel to communicate with RabbitMQ
        const channel = await connection.createChannel();

        // Ensure the queue exists
        const queueName = "send-otp";
        await channel.assertQueue(queueName, { durable: true });

        console.log("Connected to RabbitMQ and listening to queue:", queueName);

        // Consume messages from the queue
        channel.consume(queueName, async (message) => {
            if (message) {
                try {
                    // Parse the message content
                    const { to, subject, body } = JSON.parse(message.content.toString());

                    // Configure email transporter
                    const transporter = nodemailer.createTransport({
                        host: "smtp.gmail.com",
                        port: 465,
                        auth: {
                            user: process.env.USER,
                            pass: process.env.PASSWORD
                        }
                    });

                    // Send the OTP email
                    await transporter.sendMail({
                        from: "TRYST",
                        to,
                        subject,
                        text: body,
                    });

                    console.log(`OTP sent to ${to} successfully`);

                    // Acknowledge message as processed
                    channel.ack(message);
                } catch (error) {
                    console.error("Failed to send OTP:", error);

                    // Reject the message so it can be retried or moved to DLQ and it will be again pushed into queue for retry 
                    channel.nack(message);
                }
            }
        });
    } catch (error) {
        console.error("Error starting OTP consumer:", error);
    }
};
