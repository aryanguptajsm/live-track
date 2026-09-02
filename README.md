# live-track

Local weather/location sharing app built with Express and Socket.IO.

## Run locally

```bash
npm install
npm start
```

The app listens on `PORT` if set, otherwise it uses `3000`.

## Share it with a Cloudflare URL

Use Cloudflare's quick tunnel mode to expose the local app without deploying it:

```bash
npm run tunnel
```

This starts the app and then runs:

```bash
cloudflared tunnel --url http://127.0.0.1:3000
```

Cloudflare will print a temporary `trycloudflare.com` URL in the terminal.

Prerequisite: install `cloudflared` and make sure it is available on `PATH`.

If you want a permanent hostname later, switch to a named Cloudflare Tunnel in the dashboard.

Reference: [Cloudflare quick tunnels docs](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/trycloudflare/)
