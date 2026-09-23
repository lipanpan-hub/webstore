import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import type { AuthResult, AuthUserView, LoginInput, RegisterInput } from '@webstore/shared'
import { UserService } from '../user/user.service.js'
import type { JwtPayload } from './auth.types.js'

// 认证服务：处理注册、登录，并签发携带权限点的 JWT
@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  // 注册：创建用户（默认基础角色）后自动登录返回令牌
  async register(input: RegisterInput): Promise<AuthResult> {
    const user = await this.userService.create({
      username: input.username,
      password: input.password,
    })
    return this.buildResult(user)
  }

  // 登录：校验用户名密码与状态，通过后签发令牌
  async login(input: LoginInput): Promise<AuthResult> {
    const entity = await this.userService.findEntityByUsername(input.username)
    // 用户不存在与密码错误返回同一提示，避免暴露用户名是否存在
    if (!entity || !this.userService.verifyPassword(entity, input.password)) {
      throw new UnauthorizedException('用户名或密码错误')
    }
    if (entity.status !== 'active') throw new UnauthorizedException('账号已被停用')

    const user = await this.userService.toAuthUser(entity)
    return this.buildResult(user)
  }

  //#region 内部工具
  private buildResult(user: AuthUserView): AuthResult {
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      roles: user.roles,
      permissions: user.permissions,
    }
    return { token: this.jwtService.sign(payload), user }
  }
  //#endregion
}
