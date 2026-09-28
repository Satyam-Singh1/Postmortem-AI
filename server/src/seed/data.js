// Realistic demo dataset for PostmortemAI.
// Runbooks = operational "how to fix" docs. Incidents = past outages with root
// cause + resolution so the agent can say "we've seen this before".

export const runbooks = [
  {
    type: "runbook",
    title: "Checkout — Database Connection Pool Exhaustion",
    service: "checkout",
    content: `# Runbook: Checkout DB Connection Pool Exhaustion

## Symptoms
- Checkout API latency spikes; requests time out or return 500s.
- Postgres logs show "remaining connection slots are reserved" / "too many clients already".
- Connection pool saturation alert fires above 90%.

## Resolution Steps
1. Check active connections: SELECT count(*) FROM pg_stat_activity.
2. Identify long-running queries and terminate the worst offenders with pg_terminate_backend.
3. Temporarily raise the pool max size to relieve pressure.
4. Add a statement_timeout to prevent runaway queries from holding connections.
5. Scale out read replicas if reads dominate the load.

## Prevention
- Set sane per-instance pool limits and connection lifetimes.
- Add circuit breakers and backpressure on the checkout path.
- Alert on connection saturation at 80%.`,
  },
  {
    type: "runbook",
    title: "Payments — Gateway Timeouts & Circuit Breaking",
    service: "payments",
    content: `# Runbook: Payments Gateway Timeouts

## Symptoms
- Payment attempts return 503 or hang; error rate on /charge climbs.
- Upstream payment provider p99 latency elevated.
- Circuit breaker flapping between half-open and open.

## Resolution Steps
1. Check the payment provider status page and our egress latency dashboards.
2. Confirm the circuit breaker thresholds; open the breaker to fail fast if the provider is degraded.
3. Enable the queued/retry path so charges are retried asynchronously.
4. Roll back the most recent payments deploy if timeouts began right after a release.
5. Communicate degraded payments status to stakeholders.

## Prevention
- Keep per-call timeouts short (2–3s) with jittered retries and idempotency keys.
- Maintain a fallback provider where possible.`,
  },
  {
    type: "runbook",
    title: "Search — Cache Stampede & Latency Spikes",
    service: "search",
    content: `# Runbook: Search Cache Stampede

## Symptoms
- Search latency spikes; cache hit rate drops toward zero.
- Backend/database load surges as many requests recompute the same result.
- Often follows a cache flush, deploy, or mass key expiry.

## Resolution Steps
1. Confirm cache hit rate and origin QPS on the search dashboard.
2. Enable request coalescing / single-flight so only one request recomputes a key.
3. Add jitter to TTLs to avoid synchronized expiry.
4. Warm the cache for top queries.
5. Temporarily raise cache capacity if evictions are high.

## Prevention
- Use stale-while-revalidate and TTL jitter.
- Pre-warm hot keys after deploys.`,
  },
  {
    type: "runbook",
    title: "Auth — JWT Validation Failures & Key Rotation",
    service: "auth",
    content: `# Runbook: Auth Token Validation Failures

## Symptoms
- Widespread 401s across services immediately after a key rotation.
- Logs show "invalid signature" or "unknown kid" during JWT verification.

## Resolution Steps
1. Verify the JWKS endpoint serves both the old and new signing keys during rotation.
2. Confirm clients/services refreshed the JWKS cache; force-refresh if stale.
3. Roll back the key rotation if the new key was not fully propagated.
4. Re-issue tokens if necessary once keys are consistent.

## Prevention
- Always overlap old and new keys in the JWKS during rotation.
- Keep JWKS cache TTLs short and support forced refresh.`,
  },
  {
    type: "runbook",
    title: "Notifications — Queue Backlog & Consumer Lag",
    service: "notifications",
    content: `# Runbook: Notifications Queue Backlog

## Symptoms
- Notification delivery is delayed; queue depth and consumer lag climb steadily.
- Dead-letter queue growing; consumers crash-looping.

## Resolution Steps
1. Check consumer health and recent deploys; restart crash-looping consumers.
2. Scale out consumer instances to drain the backlog.
3. Inspect the dead-letter queue for poison messages and quarantine them.
4. Temporarily shed low-priority notifications to prioritize critical ones.

## Prevention
- Autoscale consumers on queue depth.
- Add poison-message handling and DLQ alerts.`,
  },
];

export const incidents = [
  {
    type: "incident",
    title: "Checkout outage: DB pool exhausted during flash sale",
    service: "checkout",
    content: `Incident: During a flash sale, checkout started timing out and returning 500s.
Symptoms: p99 latency spiked to 30s; Postgres reported "too many clients already".
Root cause: The connection pool was exhausted — a slow analytics query held connections
open while traffic surged, starving the pool.
Resolution: Terminated the slow queries, temporarily raised the pool size, and added a
statement_timeout. Error rate returned to normal within 12 minutes.
Follow-up: Added connection-saturation alerts at 80% and moved analytics reads to a replica.`,
  },
  {
    type: "incident",
    title: "Payments 503s after a bad deploy",
    service: "payments",
    content: `Incident: Payment charges began returning 503s minutes after a deploy.
Symptoms: /charge error rate jumped to 40%; circuit breaker flapping.
Root cause: A misconfigured upstream timeout (dropped from 3s to 300ms) caused most
provider calls to time out under normal latency.
Resolution: Rolled back the deploy, which restored the correct timeout; charges recovered
immediately. Queued/retry path caught the in-flight failures.
Follow-up: Added a config validation check and a canary stage for payments deploys.`,
  },
  {
    type: "incident",
    title: "Search latency spike from cache stampede",
    service: "search",
    content: `Incident: Search latency spiked 10x and the database was overloaded.
Symptoms: Cache hit rate dropped to ~0%; origin QPS surged.
Root cause: A cache flush during a deploy caused a stampede — thousands of requests
recomputed the same popular queries simultaneously.
Resolution: Enabled request coalescing (single-flight) and warmed the top queries; load
normalized in a few minutes.
Follow-up: Added TTL jitter and stale-while-revalidate to prevent synchronized expiry.`,
  },
  {
    type: "incident",
    title: "Auth 401 storm after signing-key rotation",
    service: "auth",
    content: `Incident: A wave of 401 Unauthorized errors hit every service.
Symptoms: JWT verification logged "unknown kid"; login and API calls failed broadly.
Root cause: A signing-key rotation published the new key but removed the old one before
clients refreshed their JWKS cache, so valid tokens failed verification.
Resolution: Re-published both old and new keys in the JWKS; forced a cache refresh.
Errors cleared within minutes.
Follow-up: Enforced key overlap windows and shortened JWKS cache TTLs.`,
  },
  {
    type: "incident",
    title: "Notifications delayed by consumer crash loop",
    service: "notifications",
    content: `Incident: Email and push notifications were delayed by up to an hour.
Symptoms: Queue depth and consumer lag climbed; consumers crash-looped.
Root cause: A poison message (malformed payload) crashed consumers on dequeue, blocking
progress and creating a growing backlog.
Resolution: Quarantined the poison message to the DLQ, restarted consumers, and scaled out
to drain the backlog.
Follow-up: Added poison-message handling and DLQ depth alerts.`,
  },
  {
    type: "incident",
    title: "Checkout OOM from cart-service memory leak",
    service: "checkout",
    content: `Incident: Checkout pods began OOM-killing and restarting under steady load.
Symptoms: Memory climbed continuously; pods restarted every ~20 minutes; intermittent 502s.
Root cause: A memory leak in the cart service — an unbounded in-memory cache of cart
sessions was never evicted.
Resolution: Rolled back to the previous build and raised memory limits as a stopgap; a fix
added an LRU bound to the cache.
Follow-up: Added heap-usage alerts and a load test for long-running memory growth.`,
  },
  {
    type: "incident",
    title: "Global API 525s from expired TLS certificate",
    service: "gateway",
    content: `Incident: A large fraction of API requests failed with TLS handshake errors (525).
Symptoms: Clients could not establish HTTPS; error rate spiked globally.
Root cause: The edge TLS certificate expired because auto-renewal had silently failed weeks
earlier and no alert fired.
Resolution: Issued and deployed a new certificate; traffic recovered immediately.
Follow-up: Added certificate-expiry alerts at 30/14/7 days and monitored the renewal job.`,
  },
];

export const seedDocs = [...runbooks, ...incidents];
