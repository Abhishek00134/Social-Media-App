import mongoose from 'mongoose';

async function DBConnect() {
    try {
        const uri = process.env.MONGO_URI || process.env.MONGOURI;
        if (!uri) {
            throw new Error('MongoDB connection URI is missing in .env file.');
        }
        await mongoose.connect(uri);
        console.log('MongoDB Database connected successfully.');
    } catch (error) {
        console.error('Database connection error:', error.message);
        if (error.message.includes('whitelist') || error.message.includes('Could not connect')) {
            console.warn(
                '\n💡 Quick Tip: If MongoDB fails to connect, please ensure your IP address is whitelisted in MongoDB Atlas under "Network Access" -> "Add IP Address" (or allow 0.0.0.0/0 for development).\n'
            );
        }
    }
}

export default DBConnect;