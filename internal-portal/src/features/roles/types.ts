export interface PortalRole {
  id: string;
  name: string;
  scope: string;
  description: string | null;
  status: string;
  permissions: string[];
  users: number;
}

export interface PermissionCatalogItem {
  id: string;
  code: string;
  description: string;
  roles: number;
  users: number;
}
