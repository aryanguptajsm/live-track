# live-track

Local weather/location sharing app built with Express and Socket.IO.

## Run locally and with a public URL

```bash
npm install
npm start
```

`npm start` starts the complete application locally on port `3000` and starts a
Cloudflare Quick Tunnel for the same application automatically. Cloudflare prints
a temporary `trycloudflare.com` URL. The public URL exposes the complete app,
including login, admin, sharing, assets, and Socket.IO.

The terminal is intentionally limited to the local URL and the public URL. After
opening the admin dashboard, its sharing link points directly to the public
Cloudflare `/share` route.

The app listens on `PORT` if set, otherwise it uses `3000`.

Prerequisite: install `cloudflared`. The server automatically checks PATH and
standard Windows installation locations. You can also set `CLOUDFLARED_PATH` to
the executable path if it is installed elsewhere.

If you want a permanent hostname later, switch to a named Cloudflare Tunnel in the dashboard.

Reference: [Cloudflare quick tunnels docs](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/trycloudflare/)
