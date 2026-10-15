import mongoose from "mongoose";

function getMongoUri() {
  const uri = process.env.MONGODB_URI?.trim();

  if (!uri) {
    throw new Error("MONGODB_URI is not configured");
  }

  if (!uri.startsWith("mongodb://") && !uri.startsWith("mongodb+srv://")) {
    throw new Error("MONGODB_URI has an invalid scheme");
  }

  return uri;
}

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalWithMongoose = globalThis as typeof globalThis & {
  mongoose?: MongooseCache;
};

const cached = globalWithMongoose.mongoose ?? {
  conn: null,
  promise: null,
};

globalWithMongoose.mongoose = cached;

// The connection is opened once per process. If it drops later, the MongoDB driver reconnects
// by itself and queries wait for it (calling connect() again would leak a second client).
// A failed first attempt clears the cached promise, so the next request tries again.
export default async function connectToDatabase() {
  if (cached.conn?.connection.readyState === 1) {
    return cached.conn;
  }

  if (cached.conn && cached.conn.connection.readyState !== 1) {
    cached.conn = null;
    cached.promise = null;
  }

  if (!cached.promise) {
    const uri = getMongoUri();
    cached.promise = mongoose
      .connect(uri, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        maxPoolSize: 10,
      })
      .then((connection) => {
        console.info("[DB] MongoDB connected", { readyState: connection.connection.readyState });
        return connection;
      })
      .catch((error) => {
        cached.promise = null;
        const message = error instanceof Error ? error.message : "Unknown MongoDB error";
        console.error("[DB] MongoDB connection failed", {
          name: error instanceof Error ? error.name : "UnknownError",
          message: message.replace(/(mongodb(?:\+srv)?:\/\/)[^\s]+/gi, "$1[redacted]"),
        });
        throw error;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}