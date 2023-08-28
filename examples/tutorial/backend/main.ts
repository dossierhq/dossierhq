import {
  AdminClientModifyingOperations,
  createConsoleLogger,
  decodeURLSearchParamsParam,
  executeAdminClientOperationFromJson,
  executePublishedClientOperationFromJson,
  notOk,
  type AdminClientJsonOperationArgs,
  type ErrorType,
  type PublishedClientJsonOperationArgs,
  type Result,
} from '@dossierhq/core';
import bodyParser from 'body-parser';
import { config } from 'dotenv';
import express, { type RequestHandler, type Response } from 'express';
import { expressjwt, type GetVerificationKey } from 'express-jwt';
import { expressJwtSecret } from 'jwks-rsa';
import { getAdminClientForRequest, getPublishedClientForRequest, initialize } from './server.js';

// prefer .env.local file if exists, over .env file
config({ path: '.env.local' });
config({ path: '.env' });

const app = express();
const port = 3000;

const logger = createConsoleLogger(console);
const { server } = (await initialize(logger)).valueOrThrow();

function asyncHandler(handler: (...args: Parameters<RequestHandler>) => Promise<void>) {
  return (...args: Parameters<RequestHandler>) => {
    return handler(...args).catch(args[2]);
  };
}

function sendResult(res: Response, result: Result<unknown, ErrorType>) {
  if (result.isError()) {
    res.status(result.httpStatus).send(result.message);
  } else {
    res.json(result.value);
  }
}

app.use(bodyParser.json());
app.use(
  expressjwt({
    secret: expressJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
    }) as GetVerificationKey,
    audience: process.env.AUTH0_AUDIENCE,
    issuer: `https://${process.env.AUTH0_DOMAIN}/`,
    algorithms: ['RS256'],
    credentialsRequired: false,
  })
);

app.get(
  '/api/message',
  asyncHandler(async (req, res) => {
    const publishedClient = getPublishedClientForRequest(server, req);
    const samples = (
      await publishedClient.getEntitiesSample({ entityTypes: ['Message'] }, { count: 1 })
    ).valueOrThrow();
    const message = samples.items[0];
    res.send({ message: message.fields.message });
  })
);

app.get(
  '/api/admin/:operationName',
  asyncHandler(async (req, res) => {
    const adminClient = getAdminClientForRequest(server, req);
    const { operationName } = req.params;
    const operationArgs = decodeURLSearchParamsParam<AdminClientJsonOperationArgs>(
      req.query as Record<string, string>,
      'args'
    );
    const operationModifies = AdminClientModifyingOperations.has(operationName);
    if (operationModifies) {
      sendResult(res, notOk.BadRequest('Operation modifies data, but GET was used'));
    } else if (!operationArgs) {
      sendResult(res, notOk.BadRequest('Missing args'));
    } else {
      sendResult(
        res,
        await executeAdminClientOperationFromJson(adminClient, operationName, operationArgs)
      );
    }
  })
);

app.put(
  '/api/admin/:operationName',
  asyncHandler(async (req, res) => {
    const adminClient = getAdminClientForRequest(server, req);
    const { operationName } = req.params;
    const operationArgs = req.body as AdminClientJsonOperationArgs;
    const operationModifies = AdminClientModifyingOperations.has(operationName);
    if (!operationModifies) {
      sendResult(res, notOk.BadRequest('Operation does not modify data, but PUT was used'));
    } else {
      sendResult(
        res,
        await executeAdminClientOperationFromJson(adminClient, operationName, operationArgs)
      );
    }
  })
);

app.get(
  '/api/published/:operationName',
  asyncHandler(async (req, res) => {
    const publishedClient = getPublishedClientForRequest(server, req);
    const { operationName } = req.params;
    const operationArgs = decodeURLSearchParamsParam<PublishedClientJsonOperationArgs>(
      req.query as Record<string, string>,
      'args'
    );
    if (!operationArgs) {
      sendResult(res, notOk.BadRequest('Missing args'));
    } else {
      sendResult(
        res,
        await executePublishedClientOperationFromJson(publishedClient, operationName, operationArgs)
      );
    }
  })
);

const httpServer = app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
process.once('SIGUSR2', shutdown);

async function shutdown(signal: NodeJS.Signals) {
  logger.info('Received signal %s, shutting down', signal);
  httpServer.closeAllConnections();

  const shutdownResult = await server.shutdown();
  if (shutdownResult.isError()) {
    logger.error(
      'Error while shutting down: %s (%s)',
      shutdownResult.error,
      shutdownResult.message
    );
  }

  httpServer.close((error) => {
    if (error) {
      logger.error('Error while shutting down: %s', error.message);
    }
    logger.info('Backend shut down');
    process.kill(process.pid, signal);
  });
}
