import * as trpcNext from '@trpc/server/adapters/next';
import { appRouter } from '../../../server/trpc';

const handler = trpcNext.createNextApiHandler({
  router: appRouter,
  createContext: () => ({}),
});

export default handler;