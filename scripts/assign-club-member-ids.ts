import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();
import connectToDatabase from "../lib/mongodb";
import { ensureClubMemberIds } from "../lib/teamMembers";
import TeamMember from "../models/TeamMember";

async function main() {
  await connectToDatabase();
  await ensureClubMemberIds();

  const members = await TeamMember.find({})
    .sort({ clubMemberId: 1, createdAt: 1 })
    .select("name role clubMemberId")
    .lean();

  const assigned = members.filter((member) => member.clubMemberId);
  const advisors = members.filter((member) => !member.clubMemberId);
  console.log(`Updated CMC IDs: ${assigned.length}`);
  for (const member of assigned) {
    console.log(`${member.clubMemberId}  ${member.name}  (${member.role})`);
  }
  if (advisors.length) {
    console.log(`Skipped advisors/records without CMC IDs: ${advisors.length}`);
  }
  await (await import("mongoose")).default.disconnect();
}

main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : "Unable to assign CMC IDs.");
  await (await import("mongoose")).default.disconnect();
  process.exit(1);
});
