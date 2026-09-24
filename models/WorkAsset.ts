import mongoose, { Schema } from "mongoose";

const workAssetSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, required: true, trim: true, unique: true },
    resourceType: { type: String, enum: ["image", "video"], required: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false },
);

const WorkAsset = mongoose.models.WorkAsset || mongoose.model("WorkAsset", workAssetSchema);

export default WorkAsset;