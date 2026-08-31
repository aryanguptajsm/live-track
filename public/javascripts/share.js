const socket = io();

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const statusText = document.getElementById("statusText");
const statusDot = document.getElementById("statusDot");

let isSharing = false;
let watchId = null;

startBtn.addEventListener("click", () => {
  if (navigator.geolocation) {
    isSharing = true;
    startBtn.style.display = "none";
    stopBtn.style.display = "block";
    statusText.textContent = "Sharing...";
    statusDot.style.backgroundColor = "#10b981";

    watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        socket.emit("location-update", {
          lat: latitude,
          lng: longitude,
          accuracy: accuracy,
          timestamp: new Date().toISOString()
        });
      },
      (error) => {
        console.error("Geolocation error:", error);
        statusText.textContent = "Error: " + error.message;
        statusDot.style.backgroundColor = "#ef4444";
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000
      }
    );
  } else {
    statusText.textContent = "Geolocation not supported";
    statusDot.style.backgroundColor = "#ef4444";
  }
});

stopBtn.addEventListener("click", () => {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
  isSharing = false;
  startBtn.style.display = "block";
  stopBtn.style.display = "none";
  statusText.textContent = "Not sharing";
  statusDot.style.backgroundColor = "#6b7280";
});

socket.on("connect", () => {
  console.log("Connected to server");
});

socket.on("disconnect", () => {
  console.log("Disconnected from server");
  if (isSharing) {
    stopBtn.click();
  }
});
