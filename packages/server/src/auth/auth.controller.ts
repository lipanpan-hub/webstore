import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common'
import type { ApiResponse, AuthResult, AuthUserView, LoginInput, RegisterInput } from '@webstore/shared'
import { AuthService } from './auth.service.js'
import { UserService } from '../user/user.service.js'
import { JwtAuthGuard } from './jwt-auth.guard.js'
import { CurrentUser } from './current-user.decorator.js'
import type { JwtPayload } from './auth.types.js'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('register')
  async register(@Body() body: RegisterInput): Promise<ApiResponse<AuthResult>> {
    // POST /auth/register 注册并自动登录，默认仅基础角色
    const data = await this.authService.register(body)
    return { code: 200, message: 'ok', data }
  }

  @Post('login')
  async login(@Body() body: LoginInput): Promise<ApiResponse<AuthResult>> {
    // POST /auth/login 登录获取 JWT
    const data = await this.authService.login(body)
    return { code: 200, message: 'ok', data }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: JwtPayload): Promise<ApiResponse<AuthUserView>> {
    // GET /auth/me 获取当前登录用户信息（含最新权限），需携带令牌
    const data = await this.userService.findAuthUserById(user.sub)
    return { code: 200, message: 'ok', data }
  }
}
