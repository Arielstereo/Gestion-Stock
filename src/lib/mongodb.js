import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Por favor define MONGODB_URI en tu archivo .env.local");
}

// Cachear la conexión para no reconectar en cada request (hot-reload Next.js)
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnection() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
      })
      .then((m) => {
        console.log("✅ MongoDB conectado");
        return m;
      })
      .catch((err) => {
        cached.promise = null;
        console.error("❌ Error conectando a MongoDB:", err.message);
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnection;
