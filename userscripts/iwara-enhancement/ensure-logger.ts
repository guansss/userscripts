import { setLogger } from '../../utils/log';

// prevent Sentry from tracking the logging
setLogger((console.log as any).__sentry_original__ || console.log);
