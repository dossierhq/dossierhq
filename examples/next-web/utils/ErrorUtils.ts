import type { Boom } from '@hapi/boom';
import boom, { boomify } from '@hapi/boom';
import type { ErrorResult } from '@jonasb/datadata-core';
import { ErrorType } from '@jonasb/datadata-core';

export function errorResultToBoom(error: ErrorResult<unknown, ErrorType>): Boom {
  //TODO use error.httpStatus
  switch (error.error) {
    case ErrorType.BadRequest:
      return boom.badRequest(error.message);
    case ErrorType.Conflict:
      return boom.conflict(error.message);
    case ErrorType.NotAuthenticated:
      return boom.unauthorized(error.message);
    case ErrorType.NotFound:
      return boom.notFound(error.message);
    default:
      return boomify(error.toError());
  }
}
