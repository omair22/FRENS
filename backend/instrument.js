import * as Sentry from "@sentry/node";
// import { nodeProfilingIntegration } from "@sentry/profiling-node";

Sentry.init({
  dsn: "https://859e77faa04577bb44ca0c8ab267a1e9@o4511058522734592.ingest.us.sentry.io/4511058637619200",
  // Profiling is disabled because Sentry's native binary currently doesn't support Node 25.8.0
  // integrations: [
  //   nodeProfilingIntegration(),
  // ],

  // Send structured logs to Sentry
  enableLogs: true,
  // Tracing
  tracesSampleRate: 1.0, // Capture 100% of the transactions
  // Set sampling rate for profiling
  // profileSessionSampleRate: 1.0,
  // Trace lifecycle automatically enables profiling during active traces
  // profileLifecycle: 'trace',
  // Setting this option to true will send default PII data to Sentry.
  sendDefaultPii: true,
});
