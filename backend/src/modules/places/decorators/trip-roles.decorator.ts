import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const TRIP_ROLES_KEY = 'trip_roles';

/**
 * Decorator phân quyền chuyến đi (Trip RBAC).
 * Cho phép chỉ định các vai trò được phép truy cập vào endpoint (OWNER, EDITOR, VIEWER).
 *
 * @example
 * @TripRoles(UserRole.OWNER, UserRole.EDITOR)
 */
export const TripRoles = (...roles: UserRole[]) => SetMetadata(TRIP_ROLES_KEY, roles);
