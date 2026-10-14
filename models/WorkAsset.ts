import mongoose, { Schema, type Model } from "mongoose";

export interface IWorkAsset {
  url: string;
  publicId: string;
  resourceType: "image" | "video";
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const workAssetSchema = new Schema<IWorkAsset>(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, required: true, trim: true, unique: true },
    resourceType: { type: String, enum: ["image", "video"], required: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false },
);

const WorkAsset =
  (mongoose.models.WorkAsset as Model<IWorkAsset> | undefined) ?? mongoose.model<IWorkAsset>("WorkAsset", workAssetSchema);

export default WorkAsset;
