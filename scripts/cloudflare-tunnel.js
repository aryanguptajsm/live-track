const { spawn } = require("child_process");
const path = require("path");

const port = process.env.PORT || "3000";
const originUrl = `http://127.0.0.1:${port}`;
const serverPath = path.join(__dirname, "..", "server.js");

let serverProcess = null;
let tunnelProcess = null;
let shuttingDown = false;
let tunnelStarted = false;
let serverOutput = "";

function stop(exitCode = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  for (const child of [tunnelProcess, serverProcess]) {
    if (child && !child.killed) {
      child.kill();
    }
  }

  setTimeout(() => process.exit(exitCode), 250).unref();
}

console.log(`Starting the weather app on ${originUrl}...`);

serverProcess = spawn(process.execPath, [serverPath], {
  env: process.env,
  stdio: ["inherit", "pipe", "inherit"],
  windowsHide: true
});

serverProcess.on("error", (error) => {
  console.error("Failed to start the local server:", error.message);
  stop(1);
});

serverProcess.stdout.on("data", (chunk) => {
  const output = chunk.toString();
  process.stdout.write(output);
  serverOutput += output;

  if (!tunnelStarted && serverOutput.includes("Server running at")) {
    startTunnel();
  }
});

serverProcess.on("exit", (code, signal) => {
  if (!shuttingDown) {
    console.log(
      signal
        ? `Local server stopped with signal ${signal}.`
        : `Local server exited with code ${code ?? 0}.`
    );
    stop(code ?? 0);
  }
});

function startTunnel() {
  if (shuttingDown || tunnelStarted) {
    return;
  }

  tunnelStarted = true;
  console.log(`Starting Cloudflare quick tunnel to ${originUrl}...`);
  tunnelProcess = spawn("cloudflared", ["tunnel", "--url", originUrl], {
    env: process.env,
    stdio: "inherit",
    windowsHide: true
  });

  tunnelProcess.on("error", (error) => {
    if (error.code === "ENOENT") {
      console.error("cloudflared was not found on PATH.");
      console.error(
        "Install Cloudflare Tunnel, then run `npm run tunnel` again."
      );
    } else {
      console.error("Failed to start Cloudflare Tunnel:", error.message);
    }

    stop(1);
  });

  tunnelProcess.on("exit", (code, signal) => {
    if (!shuttingDown) {
      console.log(
        signal
          ? `Cloudflare tunnel stopped with signal ${signal}.`
          : `Cloudflare tunnel exited with code ${code ?? 0}.`
      );
      stop(code ?? 0);
    }
  });
}

process.on("SIGINT", () => stop(0));
process.on("SIGTERM", () => stop(0));
