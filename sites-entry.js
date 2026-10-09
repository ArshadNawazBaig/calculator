// Research-only compatibility shim for OpenNext1.20.10 / Next16.4.
// Product proxy already selects maintenance and supplies these exact headers.
// Preserve streaming; do not issue a second request or duplicate routing rules.
import worker from './.open-next/worker.js';
export * from './.open-next/worker.js';
const finfloWorker = {
  async fetch(request, env, ctx) {
    const response = await worker.fetch(request, env, ctx);
    if (
      env.MAINTENANCE_MODE === 'true' && response.status === 200 &&
      response.headers.get('Retry-After') === '300' &&
      response.headers.get('Cache-Control') === 'no-store' &&
      response.headers.get('X-Robots-Tag') === 'noindex'
    ) {
      return new Response(response.body, {status: 503, statusText: 'Service Unavailable', headers: response.headers});
    }
    return response;
  }
};

export default finfloWorker;
