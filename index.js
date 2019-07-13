#!/usr/bin/env node

const process = require("process");
const childProcess = require("child_process");
const express = require("express");
const http = require("http");
const path = require("path");
const fs = require("fs");
const socketIo = require("socket.io");

const jsFilePath = process.argv[2];

// Detect erroneous user input
if (!jsFilePath) {
  console.error("Usage: refrosh <path to js file>");
  process.exit(1);
} else if (!fs.existsSync(jsFilePath)) {
  console.error(jsFilePath + " does not exist");
  process.exit(1);
}

const app = express();
const httpServer = http.createServer(app);
const io = socketIo(httpServer);
let emitReloadTimer = null;

// Watch for file changes
fs.watch(jsFilePath, event => {
  if (event != "change") return;

  if (emitReloadTimer) {
    clearTimeout(emitReloadTimer);
    emitReloadTimer = null;
  }

  // Tell browser to do a page reload
  // Use a timer to debounce the change event, so that it's not too noisy
  emitReloadTimer = setTimeout(() => {
    io.emit("reload", { for: "everyone" });
  }, 500);
});

io.on("connection", socket => {
  socket.emit("filename", jsFilePath);
});

// Show the user a placeholder website that auto-reloads the target JS file
app
  .use(express.static(path.resolve(__dirname, "public")))
  .get("/file.js", (_, response) => {
    response.type("application/javascript")
    fs.createReadStream(jsFilePath).pipe(response);
  });

// Start webserver
httpServer.listen(3000, err => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  childProcess.execSync("open http://localhost:3000");
  console.log("Serving " + jsFilePath);
});
