import mongoose, { Schema, Types, type Model } from "mongoose";

export interface ITeamMember {
  name: string;
  role: string;
  team?: string;
  department?: string;
  registrationNumber?: string;
  // Set for members created from an application. Such members are only shown publicly
  // while their application is Accepted (see lib/teamMembers.ts).
  applicationId?: Types.ObjectId;
  contactNumber?: string;
  semester?: number;
  areaOfInterest?: string;
  bio?: string;
  image?: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const teamMemberSchema = new Schema<ITeamMember>(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    team: { type: String, trim: true, index: true },
    department: { type: String, trim: true },
    registrationNumber: { type: String, trim: true },
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: "Application",
      unique: true,
      sparse: true,
    },
    contactNumber: { type: String, trim: true },
    semester: { type: Number },
    areaOfInterest: { type: String, trim: true },
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
  (mongoose.models.TeamMember as Model<ITeamMember> | undefined) ??
  mongoose.model<ITeamMember>("TeamMember", teamMemberSchema);

export default TeamMember;
