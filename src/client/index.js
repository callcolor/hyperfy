import 'ses'
import '../core/lockdown'
import { createRoot } from 'react-dom/client'

import { Client } from './world-client'
import { initDiscord, isDiscordContext } from './discord'
import { storage } from '../core/storage'

function getWsUrl() {
  // Inside the Discord Activity iframe, CSP only allows connections to
  // <app-id>.discordsays.com, so we must use the iframe's own origin.
  // Discord's URL mappings then proxy /ws back to our server.
  if (typeof window !== 'undefined' && window.location.hostname.endsWith('.discordsays.com')) {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${proto}//${window.location.host}/ws`
  }
  return env.PUBLIC_WS_URL
}

function App({ name }) {
  return <Client wsUrl={getWsUrl()} name={name} />
}

async function bootstrap() {
  let name
  if (isDiscordContext()) {
    const discord = await initDiscord()
    if (discord) {
      // Pre-populate the authToken storage slot so ClientNetwork picks up
      // the Discord-issued JWT on its first connect.
      storage.set('authToken', discord.authToken)
      name = discord.name
    }
  }
  const root = createRoot(document.getElementById('root'))
  root.render(<App name={name} />)
}

bootstrap()
