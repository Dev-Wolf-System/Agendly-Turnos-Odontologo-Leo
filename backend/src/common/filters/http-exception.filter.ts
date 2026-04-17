import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Error interno del servidor';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : ((exceptionResponse as Record<string, unknown>).message as string) ??
            'Error interno del servidor';
    } else if (exception instanceof Error) {
      const dbCode = (exception as any).code;
      const dbDetail = (exception as any).detail ?? exception.message;

      // FK violation (23503) → 409 con detalles para debugging
      if (dbCode === '23503') {
        status = HttpStatus.CONFLICT;
        message = `Error de integridad referencial: ${dbDetail}`;
      } else if (dbCode === '23505') {
        status = HttpStatus.CONFLICT;
        message = `Registro duplicado: ${dbDetail}`;
      } else {
        message = exception.message ?? message;
      }

      this.logger.error(
        `[${request.method} ${request.url}] ${exception.message}`,
        (exception as Error).stack,
      );
    }

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
