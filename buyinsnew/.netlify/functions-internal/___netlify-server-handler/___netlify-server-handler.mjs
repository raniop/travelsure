import {
  createRequestContext,
  runWithRequestContext,
} from '/var/task/travelsure-1/buyinsnew/.netlify/dist/run/handlers/request-context.cjs'
import { getTracer } from '/var/task/travelsure-1/buyinsnew/.netlify/dist/run/handlers/tracer.cjs'
import tracing from '/var/task/travelsure-1/buyinsnew/.netlify/dist/run/handlers/tracing.js'

process.chdir('/var/task/travelsure-1/buyinsnew')

// Set feature flag for regional blobs
process.env.USE_REGIONAL_BLOBS = 'false'

let cachedHandler
export default async function (req, context) {
  if (process.env.NETLIFY_OTLP_TRACE_EXPORTER_URL) {
    tracing.start()
  }

  const requestContext = createRequestContext(req.headers.get('x-next-debug-logging'))
  const tracer = getTracer()

  const handlerResponse = await runWithRequestContext(requestContext, () => {
    return tracer.withActiveSpan('Next.js Server Handler', async (span) => {
      span.setAttributes({
        'account.id': context.account.id,
        'deploy.id': context.deploy.id,
        'request.id': context.requestId,
        'site.id': context.site.id,
        'http.method': req.method,
        'http.target': req.url,
        monorepo: true,
        cwd: '/var/task/travelsure-1/buyinsnew',
      })
      if (!cachedHandler) {
        const { default: handler } = await import('/var/task/travelsure-1/buyinsnew/.netlify/dist/run/handlers/server.js')
        cachedHandler = handler
      }
      const response = await cachedHandler(req, context)
      span.setAttributes({
        'http.status_code': response.status,
      })
      return response
    })
  })

  if (requestContext.serverTiming) {
    handlerResponse.headers.set('server-timing', requestContext.serverTiming)
  }

  return handlerResponse
}

export const config = {
  path: '/*',
  preferStatic: true,
}
