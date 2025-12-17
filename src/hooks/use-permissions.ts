import { useAuth } from '@/contexts/AuthContext';
import { getPermissions, type Permission } from '@/lib/permissions';

export function usePermissions(): Permission | null {
  const { user } = useAuth();
  
  if (!user) {
    return null;
  }

  return getPermissions(user.role);
}

export function useHasPermission(permission: keyof Permission): boolean {
  const permissions = usePermissions();
  
  if (!permissions) {
    return false;
  }

  return permissions[permission] || false;
}

