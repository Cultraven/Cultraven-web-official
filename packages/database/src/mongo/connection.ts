import mongoose from "mongoose";

// One logical database per service (dbName) keeps data ownership clean.
export async function connectMongo(uri: string, dbName: string) {
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, { dbName });
  return mongoose.connection;
}
