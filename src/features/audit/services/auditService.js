import { supabase } from "../../../supabase.config";

const DEFAULT_PAGE_SIZE = 25;

function toStartOfDayISO(dateValue) {
  if (!dateValue) return null;
  return new Date(`${dateValue}T00:00:00`).toISOString();
}

function toEndOfDayISO(dateValue) {
  if (!dateValue) return null;
  return new Date(`${dateValue}T23:59:59`).toISOString();
}

function sanitizeSearch(value) {
  return String(value || "")
    .trim()
    .replaceAll("%", "")
    .replaceAll(",", "")
    .replaceAll("(", "")
    .replaceAll(")", "");
}

export async function getAuditLogs({
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  filters = {},
} = {}) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("audit_logs")
    .select(
      `
      id,
      created_at,
      actor_id,
      actor_email,
      actor_role,
      action,
      source,
      entity_schema,
      entity_table,
      entity_id,
      old_data,
      new_data,
      changed_fields,
      metadata
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters.action && filters.action !== "all") {
    query = query.eq("action", filters.action);
  }

  if (filters.table && filters.table !== "all") {
    query = query.eq("entity_table", filters.table);
  }

  if (filters.source && filters.source !== "all") {
    query = query.eq("source", filters.source);
  }

  if (filters.actorRole && filters.actorRole !== "all") {
    query = query.eq("actor_role", filters.actorRole);
  }

  if (filters.dateFrom) {
    query = query.gte("created_at", toStartOfDayISO(filters.dateFrom));
  }

  if (filters.dateTo) {
    query = query.lte("created_at", toEndOfDayISO(filters.dateTo));
  }

  const search = sanitizeSearch(filters.search);

  if (search) {
    query = query.or(
      [
        `actor_email.ilike.%${search}%`,
        `action.ilike.%${search}%`,
        `entity_table.ilike.%${search}%`,
        `entity_id.ilike.%${search}%`,
      ].join(",")
    );
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(error.message || "No se pudo cargar la auditoría.");
  }

  return {
    items: data || [],
    total: count || 0,
    page,
    pageSize,
  };
}