export default `
import '@testing-library/jest-dom';

import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import mockedRequests from './test/mocked-requests';

const methodToRestHandlerMapping = {
  POST: rest.post,
  GET: rest.get,
  PUT: rest.put,
  PATCH: rest.patch,
  DELETE: rest.delete,
};

const stringIdentifiers = Object.keys(mockedRequests) as Array<
  keyof typeof mockedRequests
>;
const spies: { [key: string]: typeof vi.fn } = Object.keys(
  mockedRequests
).reduce(
  (acc, uri) =>
    Object.assign(acc, { [uri as MockRequestIdentifierType]: vi.fn() }),
  {}
);

export type MockRequestIdentifierType = typeof stringIdentifiers[number];
export const getRequestSpy = (identifier: MockRequestIdentifierType) =>
  spies[identifier];

const server = setupServer(
  ...Object.keys(mockedRequests).map((uri) => {
    const [responseStatus, method, path] = uri.split(' ') as [
      string,
      'POST' | 'GET' | 'PUT' | 'PATCH' | 'DELETE',
      string
    ];

    return methodToRestHandlerMapping[method](path, (req, res, ctx) => {
      process.nextTick(() => {
        spies[
          \`${responseStatus} ${req.method} ${req.url.pathname}\` as MockRequestIdentifierType
        ]();
      });

      return res(
        ctx.status(parseInt(responseStatus)),
        ctx.json(mockedRequests[uri as MockRequestIdentifierType])
      );
    });
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());
afterEach(() => server.resetHandlers());
`
