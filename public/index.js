var socket = io();

socket.on("reload", function() {
  window.location.reload();
});

socket.on("filename", function(filename) {
  document.title = filename;
});
