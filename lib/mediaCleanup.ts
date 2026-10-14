import { destroyCloudinaryUrls } from "@/lib/cloudinary";
import Application from "@/models/Application";
import TeamMember from "@/models/TeamMember";

/**
 * Deletes photos from Cloudinary once no application or team member uses them any more.
 * An accepted applicant's photo is shared by their application and their team member record.
 */
export async function destroyUnreferencedImages(urls: (string | null | undefined)[]) {
  const candidates = [...new Set(urls.filter((url): url is string => Boolean(url)))];
  const unreferenced: string[] = [];
  for (const url of candidates) {
    const [usedByApplication, usedByMember] = await Promise.all([Application.exists({ image: url }), TeamMember.exists({ image: url })]);
    if (!usedByApplication && !usedByMember) unreferenced.push(url);
  }
  await destroyCloudinaryUrls(unreferenced);
}
