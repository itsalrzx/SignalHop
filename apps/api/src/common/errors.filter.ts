import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
@Catch()
export class ErrorsFilter implements ExceptionFilter {
  private readonly logger = new Logger('HTTP');
  catch(error: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();
    const status = error instanceof HttpException ? error.getStatus() : 500;
    const body = error instanceof HttpException ? error.getResponse() : null;
    const details =
      typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
    if (status >= 500)
      this.logger.error({
        event: 'request_error',
        requestId: res.getHeader('x-request-id'),
        path: req.path,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    const extra = details.dependencies ? { dependencies: details.dependencies } : {};
    res.status(status).json({
      statusCode: status,
      code: String(details.code || 'HTTP_' + status),
      message:
        status === 500
          ? 'An unexpected error occurred'
          : details.message || (typeof body === 'string' ? body : 'Request failed'),
      requestId: res.getHeader('x-request-id'),
      ...extra,
    });
  }
}
