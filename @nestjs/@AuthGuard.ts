import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserDto } from '../dtos';
import { AppError } from '../errors';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly jwtService: JwtService, // install @nestjs/jwt
  ) {}

  validateRoles(roles: string[], userRoles: string[]) {
    const hasRole = userRoles.some((role) => roles.includes(role));

    if (!hasRole) {
      throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers['authorization']?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  async canActivate(context: ExecutionContext): Promise<any> {
    const req = context.switchToHttp().getRequest();

    const roles =
      this.reflector.get<string[]>('roles', context.getHandler()) ?? [];

    const token = this.extractTokenFromHeader(req);

    if (!token) {
      throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: jwtConstants.secret,
      });

      req.user = payload;

      if (roles.length > 0) {
        const user = payload.user as UserDto;
        this.validateRoles(roles, user?.type);
      }

      return true;
    } catch (error) {
      throw new AppError(error?.message, HttpStatus.UNAUTHORIZED);
    }
  }
}


/* -> app.module.ts
Import JwtModule in your AppModule:

 JwtModule.register({
    global: true,
    secret: jwtConstants.secret,
    signOptions: { expiresIn: '30d' },
  }),
*/