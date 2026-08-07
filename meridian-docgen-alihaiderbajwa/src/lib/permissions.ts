export function canApprove(role: string | null | undefined): boolean {
  return role === "admin" || role === "attorney";
}

export function canManageTemplates(role: string | null | undefined): boolean {
  return role === "admin" || role === "attorney";
}

export function canManageStaff(role: string | null | undefined): boolean {
  return role === "admin";
}

export function canDeleteClients(role: string | null | undefined): boolean {
  return role === "admin";
}
