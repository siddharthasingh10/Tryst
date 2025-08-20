import amqp from "amqplib"
let channel:amqp.Channel;

export const connectRabbitMQ = async () => {
     console.log("RabbitMQ creds: 💘💘💘💘💘💘💘", process.env.RABBITMQ_USER, process.env.RABBITMQ_PASSWORD);
    try {
       

         const connection = await amqp.connect({   
            protocol: 'amqp',
            hostname:  process.env.RABBITMQ_HOST ,
            username:  process.env.RABBITMQ_USER,       
            password:  process.env.RABBITMQ_PASSWORD , 
            port: 5672, 
            vhost: '/',
         });

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
    await channel.assertQueue(queueName, { durable: true });
    channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), {
        persistent: true
    }); 
}