const mongoose = require('mongoose');
const dns = require('dns');

const connectDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kdramaverse';
    if (connStr.startsWith('mongodb+srv://')) {
      dns.setServers((process.env.DNS_SERVERS || '1.1.1.1,8.8.8.8')
        .split(',')
        .map(server => server.trim())
        .filter(Boolean));
    }

    await mongoose.connect(connStr, {
      autoIndex: true, // Enable index builds
    });
    console.log(`MongoDB Connected successfully to ${connStr}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
