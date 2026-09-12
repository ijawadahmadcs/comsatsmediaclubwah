import mongoose, { Schema } from "mongoose";

const teamMemberSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    department: { type: String, trim: true },
    registrationNumber: { type: String, trim: true },
    semester: { type: Number },
    bio: { type: String, trim: true },
    image: { type: String, trim: true },
    instagram: { type: String, trim: true },
    facebook: { type: String, trim: true },
    linkedin: { type: String, trim: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false },
);

const TeamMember =
  mongoose.models.TeamMember || mongoose.model("TeamMember", teamMemberSchema);

export default TeamMember;