import { DiscordSDK } from '@discord/embedded-app-sdk'

// Discord Activities launch the app inside an iframe at
// https://<APP_ID>.discordsays.com, passing a `frame_id` query param.
// We detect that here and only run the SDK handshake in that context —
// outside of Discord, this module is a no-op and the normal auth flow runs.
export function isDiscordContext() {
  if (typeof window === 'undefined') return false
  const params = new URLSearchParams(window.location.search)
  return params.has('frame_id')
}

let sdk = null

export function getDiscordSDK() {
  return sdk
}

// Runs the Discord OAuth2 handshake and returns identity + connection hints.
// Returns null if we're not in a Discord context or the app isn't configured.
export async function initDiscord() {
  if (!isDiscordContext()) return null
  const clientId = globalThis.env?.PUBLIC_DISCORD_CLIENT_ID
  if (!clientId) {
    console.warn('[discord] PUBLIC_DISCORD_CLIENT_ID not set; skipping SDK init')
    return null
  }
  try {
    sdk = new DiscordSDK(clientId)
    await sdk.ready()
    // The RPC authorize flow rejects redirect_uri, but the server-side
    // token exchange requires one matching what's registered in the
    // Developer Portal (OAuth2 → Redirects). We pass the iframe origin
    // to the server; the authorize call leaves it off.
    const redirectUri = window.location.origin
    // identify for global_name/username, guilds.members.read for server nickname
    const { code } = await sdk.commands.authorize({
      client_id: clientId,
      response_type: 'code',
      state: '',
      prompt: 'none',
      scope: ['identify', 'guilds.members.read'],
    })
    // exchange the auth code for a Hyperfy authToken via our server.
    // When inside the Discord iframe, /api/* is proxied back to our server
    // via the URL mappings configured in the Developer Portal.
    const resp = await fetch('/api/discord/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, redirect_uri: redirectUri, guild_id: sdk.guildId }),
    })
    if (!resp.ok) {
      console.error('[discord] token exchange failed:', resp.status, await resp.text())
      return null
    }
    const { access_token, authToken, name } = await resp.json()
    // complete the SDK auth so Discord APIs (voice, etc.) are available
    await sdk.commands.authenticate({ access_token })
    return {
      authToken,
      name,
      instanceId: sdk.instanceId,
      channelId: sdk.channelId,
      guildId: sdk.guildId,
    }
  } catch (err) {
    console.error('[discord] init failed:', err)
    return null
  }
}
