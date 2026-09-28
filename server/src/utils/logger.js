const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
const active = LEVELS[process.env.LOG_LEVEL] || LEVELS.info;

function emit(level, scope, msg, extra) {
  if (LEVELS[level] < active) return;
  const ts = new Date().toISOString();
  const tag = `[${ts}] ${level.toUpperCase().padEnd(5)} (${scope})`;
  // Log to stderr so stdout stays clean — required for the MCP stdio transport,
  // and standard practice for server diagnostics.
  if (extra !== undefined) {
    console.error(`${tag} ${msg}`, extra);
  } else {
    console.error(`${tag} ${msg}`);
  }
}

export function createLogger(scope) {
  return {
    debug: (m, e) => emit('debug', scope, m, e),
    info: (m, e) => emit('info', scope, m, e),
    warn: (m, e) => emit('warn', scope, m, e),
    error: (m, e) => emit('error', scope, m, e),
  };
}
