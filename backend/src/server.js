const http = require("http");
const { Server } = require("socket.io");

const { createApp } = require("./app");
const { connectDb } = require("./config/db");
const { env } = require("./config/env");
const { initSocket } = require("./socket");

async function main() {
  await connectDb(env.mongoUri);

  const app = createApp();
  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: env.clientOrigin,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    socket.join("activity:global");
    socket.on("join", ({ doctorId, slotStartAt }) => {
      if (!doctorId || !slotStartAt) return;
      socket.join(`queue:${doctorId}:${slotStartAt}`);
    });
  });

  initSocket(io);
  server.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on :${env.port}`);
  });
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});

