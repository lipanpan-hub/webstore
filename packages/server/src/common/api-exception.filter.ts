import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common'
import type { ApiResponse } from '@webstore/shared'

// 精简的响应类型，避免引入 @types/express 依赖
interface HttpResponse {
  status(code: number): HttpResponse
  json(body: unknown): void
}

interface HttpRequest {
  method: string
  url: string
}

// 统一异常出口：将异常转换为 ApiResponse 结构，保证前后端接口契约一致
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp()
    const res = http.getResponse<HttpResponse>()
    const req = http.getRequest<HttpRequest>()

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

    // 分级日志：5xx 为服务端错误，附带堆栈便于排查；4xx 为客户端错误，仅告警
    const context = `${req.method} ${req.url} -> ${code} ${message}`
    if (code >= 500) {
      this.logger.error(context, exception instanceof Error ? exception.stack : undefined)
    } else {
      this.logger.warn(context)
    }

    const body: ApiResponse<null> = { code, message, data: null }
    res.status(code).json(body)
  }
}
