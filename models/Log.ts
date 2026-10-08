// src/models/Log.ts
import mongoose, { Schema, Types } from "mongoose";

const logSchema = new Schema(
  {
    action: { type: String, required: true }, // e.g., "event_created", "event_updated", "attendance_marked", "rating_submitted"
    adminId: { type: Types.ObjectId, ref: "Admin", required: true },
    details: { type: Schema.Types.Mixed }, // any extra info (eventId, payload, etc.)
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.models.Log || mongoose.model("Log", logSchema);
