import { Controller, Get } from '@nestjs/common'
import { AppService } from './app.service.js'
import type { ApiResponse } from '@webstore/shared'

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): ApiResponse<string> {
    return { code: 200, message: 'ok', data: this.appService.getHello() }
  }
}
