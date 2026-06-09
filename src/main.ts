import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { html } from 'hono/html'
import type { KVNamespace } from '@cloudflare/workers-types'

type Env = {
  MY_KV: KVNamespace
  ASSETS: Fetcher
}

const app = new Hono<{ Bindings: Env }>()

app.use('*', cors())

app.post('/kv', async (c) => {
  const body = await c.req.text()
  const params = new URLSearchParams(body)
  const key = params.get('key')
  const value = params.get('value')
  
  if (!key || !value) {
    return c.html('<div class="p-3 bg-red-600 rounded">Key and value required</div>')
  }
  
  await c.env.MY_KV.put(key, value)
  
  return c.html(html`
    <div class="p-3 bg-green-600 rounded">Saved "${key}" = "${value}"</div>
  `)
})

app.get('/kv', async (c) => {
  const list = await c.env.MY_KV.list()
  const items = await Promise.all(
    list.keys.map(async (k: { name: string }) => {
      const value = await c.env.MY_KV.get(k.name)
      return html`<div class="flex justify-between p-2 bg-gray-600 rounded">
        <span class="font-mono">${k.name}</span>
        <span>${value}</span>
      </div>`
    })
  )
  
  return c.html(items.length > 0 ? items.join('') : '<div class="text-gray-400">No keys stored</div>')
})

app.get('/time', (c) => {
  return c.html(`<span class="text-yellow-400 font-mono">${new Date().toISOString()}</span>`)
})

export default app
