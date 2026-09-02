const socket = io({
  query: {
    role: "admin"
  }
});


 const copyShareLinkButton = document.getElementById("copyShareLink");
    if (copyShareLinkButton) {
      copyShareLinkButton.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(copyShareLinkButton.dataset.shareUrl);
          copyShareLinkButton.textContent = "Copied";
          setTimeout(() => {
            copyShareLinkButton.textContent = "Copy link";
          }, 1500);
        } catch (error) {
          copyShareLinkButton.textContent = "Copy failed";
          setTimeout(() => {
            copyShareLinkButton.textContent = "Copy link";
          }, 1500);
        }
      });
    }

const targetList = document.getElementById("targetList");
const statusPill = document.getElementById("statusPill");
const selectedTargetLabel = document.getElementById("selectedTargetLabel");
const selectedTargetMeta = document.getElementById("selectedTargetMeta");
const emptyTargetMessage = document.getElementById("emptyTargetMessage");
const sidebarToggle = document.getElementById("sidebarToggle");
const sidebarClose = document.getElementById("sidebarClose");
const sidebarBackdrop = document.getElementById("sidebarBackdrop");

const targetState = new Map();
const map = L.map("map").setView([20, 0], 2);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 19
}).addTo(map);

let marker = null;
let activeTargetId = null;
const mobileMediaQuery = window.matchMedia("(max-width: 900px)");

const seedTargets = Array.isArray(window.ADMIN_TARGETS) ? window.ADMIN_TARGETS : [];

seedTargets.forEach((target) => {
  targetState.set(target.id, {
    ...target,
    latestLocation: target.latestLocation || null
  });
});

function formatTimestamp(timestamp) {
  if (!timestamp) {
    return "Waiting for first location";
  }

  return new Date(timestamp).toLocaleString();
}

function formatAccuracy(accuracy) {
  if (typeof accuracy !== "number" || Number.isNaN(accuracy)) {
    return "unknown accuracy";
  }

  return `\u00B1${accuracy.toFixed(0)} m`;
}

function getTargetItem(targetId) {
  if (!targetList) {
    return null;
  }

  return targetList.querySelector(`[data-target-id="${CSS.escape(targetId)}"]`);
}

function isMobileView() {
  return mobileMediaQuery.matches;
}

function setSidebarOpen(isOpen) {
  if (!isMobileView()) {
    document.body.classList.remove("sidebar-open");

    if (sidebarBackdrop) {
      sidebarBackdrop.hidden = true;
    }

    if (sidebarToggle) {
      sidebarToggle.setAttribute("aria-expanded", "false");
    }

    return;
  }

  document.body.classList.toggle("sidebar-open", isOpen);

  if (sidebarBackdrop) {
    sidebarBackdrop.hidden = !isOpen;
  }

  if (sidebarToggle) {
    sidebarToggle.setAttribute("aria-expanded", String(isOpen));
  }
}

function renderTargetItem(targetId) {
  const target = targetState.get(targetId);
  const item = getTargetItem(targetId);

  if (!item || !target) {
    return;
  }

  const statusEl = item.querySelector("[data-target-status]");
  const latestLocation = target.latestLocation;
  const isActive = activeTargetId === targetId;

  item.classList.toggle("is-active", isActive);
  item.classList.toggle("is-live", Boolean(latestLocation));

  if (statusEl) {
    statusEl.textContent = latestLocation
      ? `Last update: ${formatTimestamp(latestLocation.timestamp)}`
      : "Waiting for signal";
  }
}

function renderAllTargets() {
  if (targetList) {
    targetList.replaceChildren();

    targetState.forEach((target) => {
      const listItem = document.createElement("li");
      const button = document.createElement("button");
      const id = document.createElement("span");
      const status = document.createElement("span");

      button.type = "button";
      button.className = "target-item";
      button.dataset.targetId = target.id;

      id.className = "target-id";
      id.textContent = target.id;
      status.className = "target-status";
      status.dataset.targetStatus = "";

      button.append(id, status);
      listItem.append(button);
      targetList.append(listItem);
    });
  }

  if (emptyTargetMessage) {
    emptyTargetMessage.hidden = targetState.size > 0;
  }

  targetState.forEach((_, targetId) => {
    renderTargetItem(targetId);
  });
}

function updateSelectedTargetDetails() {
  if (!activeTargetId) {
    if (selectedTargetLabel) {
      selectedTargetLabel.textContent = "No target selected";
    }

    if (selectedTargetMeta) {
      selectedTargetMeta.textContent = "Click a target to open the live map.";
    }

    if (statusPill) {
      statusPill.textContent = "Connected - waiting for selection";
      statusPill.style.backgroundColor = "#3a3b40";
    }

    return;
  }

  const target = targetState.get(activeTargetId);
  const latestLocation = target && target.latestLocation;

  if (selectedTargetLabel) {
    selectedTargetLabel.textContent = activeTargetId;
  }

  if (selectedTargetMeta) {
    selectedTargetMeta.textContent = latestLocation
      ? `Last seen ${formatTimestamp(latestLocation.timestamp)}`
      : "No location received yet.";
  }

  if (statusPill) {
    statusPill.textContent = latestLocation
      ? `Live ${formatAccuracy(latestLocation.accuracy)}`
      : "Waiting for first location";
    statusPill.style.backgroundColor = latestLocation ? "#10b981" : "#3a3b40";
  }
}

function showLocation(location, focus = false) {
  const { lat, lng, accuracy, timestamp } = location;

  if (marker) {
    marker.setLatLng([lat, lng]);
  } else {
    marker = L.marker([lat, lng]).addTo(map);
  }

  if (focus) {
    map.setView([lat, lng], 16);
  }

  if (activeTargetId === location.targetId) {
    if (selectedTargetMeta) {
      selectedTargetMeta.textContent = `Last seen ${formatTimestamp(timestamp)} | ${formatAccuracy(accuracy)}`;
    }

    if (statusPill) {
      statusPill.textContent = `Live ${formatAccuracy(accuracy)}`;
      statusPill.style.backgroundColor = "#10b981";
    }
  }
}

function activateTarget(targetId) {
  activeTargetId = targetId;

  renderAllTargets();
  updateSelectedTargetDetails();

  const target = targetState.get(targetId);
  if (target && target.latestLocation) {
    showLocation(target.latestLocation, true);
  }

  map.invalidateSize();

  if (isMobileView()) {
    setSidebarOpen(false);
  }
}

if (targetList) {
  targetList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-target-id]");

    if (!button) {
      return;
    }

    activateTarget(button.dataset.targetId);
  });
}

if (sidebarToggle) {
  sidebarToggle.addEventListener("click", () => {
    setSidebarOpen(!document.body.classList.contains("sidebar-open"));
  });
}

if (sidebarClose) {
  sidebarClose.addEventListener("click", () => {
    setSidebarOpen(false);
  });
}

if (sidebarBackdrop) {
  sidebarBackdrop.addEventListener("click", () => {
    setSidebarOpen(false);
  });
}

const handleViewportChange = () => {
  setSidebarOpen(false);
  map.invalidateSize();
};

if (mobileMediaQuery.addEventListener) {
  mobileMediaQuery.addEventListener("change", handleViewportChange);
} else if (mobileMediaQuery.addListener) {
  mobileMediaQuery.addListener(handleViewportChange);
}

socket.on("connect", () => {
  if (statusPill && !activeTargetId) {
    statusPill.textContent = "Connected - select a target";
    statusPill.style.backgroundColor = "#3a3b40";
  }
});

socket.on("disconnect", () => {
  if (statusPill) {
    statusPill.textContent = "Disconnected";
    statusPill.style.backgroundColor = "#ef4444";
  }
});

socket.on("target-list", (targets) => {
  if (!Array.isArray(targets)) {
    return;
  }

  targets.forEach((target) => {
    const current = targetState.get(target.id) || { id: target.id };

    targetState.set(target.id, {
      ...current,
      ...target,
      latestLocation: target.latestLocation || current.latestLocation || null
    });
  });

  renderAllTargets();
  updateSelectedTargetDetails();
});

socket.on("target-removed", (targetId) => {
  targetState.delete(targetId);

  if (activeTargetId === targetId) {
    activeTargetId = null;
    if (marker) {
      marker.remove();
      marker = null;
    }
  }

  renderAllTargets();
  updateSelectedTargetDetails();
});

socket.on("location-update", (location) => {
  if (!location || !location.targetId) {
    return;
  }

  const current = targetState.get(location.targetId) || { id: location.targetId };

  targetState.set(location.targetId, {
    ...current,
    latestLocation: location
  });

  renderAllTargets();

  if (activeTargetId === location.targetId) {
    showLocation(location, true);
  }
});

renderAllTargets();
updateSelectedTargetDetails();
setSidebarOpen(false);

window.requestAnimationFrame(() => {
  map.invalidateSize();
});

window.addEventListener("resize", () => {
  map.invalidateSize();
});
