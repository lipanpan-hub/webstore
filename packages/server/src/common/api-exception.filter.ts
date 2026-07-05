import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common'
import type { ApiResponse } from '@webstore/shared'

// 精简的响应类型，避免引入 @types/express 依赖
interface HttpResponse {
  status(code: number): HttpResponse
  json(body: unknown): void
}

// 统一异常出口：将异常转换为 ApiResponse 结构，保证前后端接口契约一致
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<HttpResponse>()

    let code = 500
    let message = '服务器内部错误'
    if (exception instanceof HttpException) {
      code = exception.getStatus()
      const payload = exception.getResponse()
      message =
        typeof payload === 'string'
          ? payload
          : ((payload as { message?: string | string[] }).message?.toString() ?? message)
    } else if (exception instanceof Error) {
      message = exception.message
    }

    const body: ApiResponse<null> = { code, message, data: null }
    res.status(code).json(body)
  }
}
