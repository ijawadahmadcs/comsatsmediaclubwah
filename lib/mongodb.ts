import mongoose from "mongoose";

function getMongoUri() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("Please define the MONGODB_URI environment variable");
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

export default async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(getMongoUri());
  }

  cached.conn = await cached.promise;
  return cached.conn;
}