const socket = io();

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");

let watchId = null;

function setSharingState(isSharing) {
  if (isSharing) {
    statusDot.classList.add("live");
    statusText.textContent = "Sharing live location…";
    startBtn.style.display = "none";
    stopBtn.style.display = "inline-block";
  } else {
    statusDot.classList.remove("live");
    statusText.textContent = "Not sharing";
    startBtn.style.display = "inline-block";
    stopBtn.style.display = "none";
  }
}

function startSharing() {
  if (!navigator.geolocation) {
    statusText.textContent = "Geolocation not supported on this device";
    return;
  }

  watchId = navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      socket.emit("location-update", {
        lat: latitude,
        lng: longitude,
        timestamp: Date.now()
      });
    },
    (err) => {
      statusText.textContent = "Location error: " + err.message;
    },
    {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 10000
    }
  );

  setSharingState(true);
}

function stopSharing() {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
  setSharingState(false);
}

startBtn.addEventListener("click", startSharing);
stopBtn.addEventListener("click", stopSharing);