const socket = io();

// Initialize Leaflet map centered on a default location
const map = L.map("map").setView([51.505, -0.09], 13);

// Add OpenStreetMap tiles
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 19
}).addTo(map);

let marker = null;
const statusPill = document.getElementById("statusPill");

// Listen for location updates from connected devices
socket.on("location-update", (data) => {
  console.log("Location update received:", data);

  const { lat, lng, accuracy, timestamp } = data;

  // Update or create marker
  if (marker) {
    marker.setLatLng([lat, lng]);
  } else {
    marker = L.marker([lat, lng]).addTo(map);
  }

  // Center map on marker
  map.setView([lat, lng], 16);

  // Update status pill
  const time = new Date(timestamp).toLocaleTimeString();
  statusPill.textContent = `📍 Last signal: ${time} (±${accuracy.toFixed(0)}m)`;
  statusPill.style.backgroundColor = "#10b981";
});

socket.on("connect", () => {
  console.log("Connected to server");
  statusPill.textContent = "✓ Connected - waiting for location";
});

socket.on("disconnect", () => {
  console.log("Disconnected from server");
  statusPill.textContent = "✗ Disconnected";
  statusPill.style.backgroundColor = "#ef4444";
});
