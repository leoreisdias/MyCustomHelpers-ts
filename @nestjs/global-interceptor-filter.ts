import { Catch, ArgumentsHost, Injectable, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { DeadLetterService } from 'src/modules/dead-letter/dead-letter.service';

@Injectable()
@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  constructor(private readonly deadLetterService: DeadLetterService) {
    super();
  }

  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown | any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();

    if (
      exception?.status === 400 ||
      exception?.status === 404 ||
      exception?.status === 401
    ) {
      return super.catch(exception, host);
    }

    this.logger.warn(
        `Warn at: ${request?.url} ${request?.params} ${request?.query}`,
        exception?.stack,
    );
  
    this.deadLetterService.create({
        body: request?.body,
        headers: request?.headers,
        method: request?.method,
        url: request?.url,
        error: exception,
        /*
        or
        error:
            exception?.stack ??
            exception?.message ??
            JSON.stringify(exception),
        */
        params: request?.params,
        query: request?.query,
        user: request?.user?.user,
        status: exception?.statusCode || exception?.status,
       // any other info...
    });

    super.catch(exception, host);
  }
}


/* USAGE

// -> app.module.ts
providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    // ...
],

*/
