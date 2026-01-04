export * from './auth.controller';
// Service is likely not exported in auth if it's just handled by controller, but usually it is. I'll include it if it exists. 
// Wait, list_dir didn't show auth.service.ts? 
// Let me check list_dir output again.
// {"name":"auth.controller.ts", "sizeBytes":"13616"}
// {"name":"auth.routes.ts", "sizeBytes":"2695"}
// {"name":"auth.schema.ts", "sizeBytes":"4450"}
// {"name":"auth.types.ts", "sizeBytes":"482"}
// NO SERVICE FILE in auth? That's odd. Maybe it's inside controller or implicit?
// I will not export service if it's not there.
export * from './auth.schema';
export * from './auth.types';
export { default as authRoutes } from './auth.routes';
