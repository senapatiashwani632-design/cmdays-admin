import mongoose from "mongoose";
import { GridFSBucket } from "mongodb";

export function getGridFSBucket() {
  const db = mongoose.connection.db;

  if (!db) {
    throw new Error("MongoDB not connected");
  }

  return new GridFSBucket(db, {
    bucketName: "uploads",
  });
}