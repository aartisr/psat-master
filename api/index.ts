// @ts-ignore
import serverModule from '../dist/server.cjs';

const app = (serverModule as any).default || serverModule;

export const maxDuration = 60;

export default app;

