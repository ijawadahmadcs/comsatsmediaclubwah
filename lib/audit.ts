import type { AuthAdmin } from "@/lib/auth";
import { logServerError } from "@/lib/api";
import Log from "@/models/Log";

type AuditEntry = {
  action: string;
  targetType?: string;
  targetId?: string;
  details?: unknown;
};

/** Records a state-changing action. Never throws: a failed audit write must not undo the action. */
export async function recordAudit(actor: AuthAdmin, entry: AuditEntry) {
  try {
    await Log.create({
      action: entry.action,
      adminId: actor.id,
      actorRole: actor.role,
      actorRegistrationNumber: actor.registrationNumber,
      targetType: entry.targetType,
      targetId: entry.targetId,
      details: entry.details,
    });
  } catch (error) {
    logServerError("[AUDIT] Unable to record action", error);
  }
}
