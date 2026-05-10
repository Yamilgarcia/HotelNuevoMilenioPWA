import { supabase } from "../supabase.config";

export async function logAuditEvent({
  action,
  entityTable = null,
  entityId = null,
  metadata = {},
}) {
  const { error } = await supabase.rpc("audit_app_event", {
    p_action: action,
    p_entity_table: entityTable,
    p_entity_id: entityId,
    p_metadata: metadata,
  });

  if (error) {
    console.warn("No se pudo registrar auditoría:", error.message);
  }
}