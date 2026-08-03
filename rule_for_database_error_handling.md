When performing database operations
- Always use the `dbOperation` wrapper to handle transient fetch errors and network timeouts.
- Treat `SyntaxError` (e.g., "Unexpected token <") as a retryable network issue, as it often indicates a server timeout or proxy error returning an HTML error page instead of JSON.
- Implement request throttling (e.g., 5000ms for background polling) to prevent "Failed to fetch" errors caused by network congestion.
- Use connection-aware retry strategies that wait for the 'online' event before retrying failed fetch operations.
- Check `navigator.onLine` before initiating any network request to fail fast and avoid triggering unnecessary TypeError exceptions.
- Provide sensible defaults (like empty arrays) in catch blocks to prevent UI crashes.
- Monitor the `isOnline` status in the main App component to provide user feedback when connectivity is lost.
- Use exponential backoff for retries (starting at 800ms) to resolve transient "NoPermission" or "Failed to fetch" errors.
- Strip all metadata fields (id, objectId, createdAt, updatedAt) from the data payload before calling trickleCreateObject or trickleUpdateObject to prevent schema validation issues.