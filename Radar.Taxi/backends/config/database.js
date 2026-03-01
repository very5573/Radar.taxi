import mongoose from "mongoose";

const connectDatabase = async () => {
  try {
    const data = await mongoose.connect(process.env.DB_URI, {
      tls: true, // TLS/SSL enable
      tlsAllowInvalidCertificates: false, // dev me true kar sakte ho agar self-signed cert
    });

    console.log(`✅ MongoDB connected with server: ${data.connection.host}`);
  } catch (err) {
    console.error(`❌ MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};

export default connectDatabase;
