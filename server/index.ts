import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
// @ts-ignore - setupSocket is not yet compiled to JS in this context when running tsx watch potentially, but we build index.ts with esbuild. 
// Actually, since this is for production build, we need to import from relative path.
// But wait, setupSocket is in .ts. esbuild should bundle it.
import { setupSocket } from "./socket.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Initialize Socket.io
  const io = new Server(server);
  setupSocket(io);

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
