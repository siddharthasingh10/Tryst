import amqp from "amqplib"
let channel:amqp.Channel;

export const connectRabbitMQ = async () => {
    try {
       
        // Create a connection to RabbitMQ
         const connection = await amqp.connect({   
            protocol: 'amqp',
            hostname:  process.env.RABBITMQ_HOST ,
            username:  process.env.RABBITMQ_USER,       
            password:  process.env.RABBITMQ_PASSWORD , 
            port: 5672, 
            vhost: '/',
         });
        // Create a channel
        channel = await connection.createChannel();
        console.log("Connected to RabbitMQ successfully");

        
    } catch (error) {
        console.error("Error connecting to RabbitMQ:", error);     
    }
}
export const publishToQueue=async (queueName: string, message: any) => {
    if(!channel) {
        console.error("Channel is not initialized");
        return;
    }
    // Ensure the queue exists
    await channel.assertQueue(queueName, { durable: true });
    // Send the message to the queue
    channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), {
        persistent: true
    }); 
}