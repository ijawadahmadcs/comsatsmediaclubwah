import mongoose, { Schema, type Model } from "mongoose";

// One document per rate-limit bucket (rule + hashed subject + time window).
// MongoDB's TTL monitor deletes buckets once their window has ended.
export interface IRateLimit {
  _id: string;
  count: number;
  expiresAt: Date;
}

const rateLimitSchema = new Schema<IRateLimit>(
  {
    _id: { type: String, required: true },
    count: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { versionKey: false },
);

rateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RateLimit =
  (mongoose.models.RateLimit as Model<IRateLimit> | undefined) ?? mongoose.model<IRateLimit>("RateLimit", rateLimitSchema);

export default RateLimit;
