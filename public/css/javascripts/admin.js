const socket = io();

const statusPill = document.getElementById("statusPill");

// Default view before any location arrives (world-ish view)
const map = L.map("map").setView([20, 0], 2);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors",
  maxZoom: 19
}).addTo(map);

let marker = null;
let hasCentered = false;

socket.on("location-update", (data) => {
  const { lat, lng, timestamp } = data;

  if (!marker) {
    marker = L.marker([lat, lng]).addTo(map);
  } else {
    marker.setLatLng([lat, lng]);
  }

  if (!hasCentered) {
    map.setView([lat, lng], 16);
    hasCentered = true;
  } else {
    map.panTo([lat, lng]);
  }

  const time = new Date(timestamp).toLocaleTimeString();
  marker.bindPopup(`Last update: ${time}`);

  statusPill.textContent = "Live · updated " + time;
  statusPill.classList.add("live");
});

socket.on("disconnect", () => {
  statusPill.textContent = "Disconnected";
  statusPill.classList.remove("live");
});