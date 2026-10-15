import mongoose, { Schema, type Model, type Types } from "mongoose";

export interface IRecognitionSetting {
  key: string;
  revealWeek: boolean;
  revealMonth: boolean;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const recognitionSettingSchema = new Schema<IRecognitionSetting>(
  {
    key: { type: String, required: true, unique: true, default: "member-recognition" },
    revealWeek: { type: Boolean, default: false },
    revealMonth: { type: Boolean, default: false },
    updatedBy: { type: Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true, versionKey: false },
);

const RecognitionSetting =
  (mongoose.models.RecognitionSetting as Model<IRecognitionSetting> | undefined) ??
  mongoose.model<IRecognitionSetting>("RecognitionSetting", recognitionSettingSchema);

export default RecognitionSetting;
