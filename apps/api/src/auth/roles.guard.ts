import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleName } from '@prisma/client';
import { ROLES_KEY } from '../common/decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleName[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.role) {
      throw new ForbiddenException('Access denied: Authentication and authorization required');
    }

    const userRole = user.role.name as RoleName;

    // SUPER_ADMIN has master privileges
    if (userRole === RoleName.SUPER_ADMIN) {
      return true;
    }

    // Role hierarchy resolution:
    // SUPER_ADMIN > ADMIN > EDITOR > CONTENT_MANAGER
    const hasRole = requiredRoles.includes(userRole);
    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied: Action requires one of following roles [${requiredRoles.join(', ')}]`,
      );
    }

    return true;
  }
}
