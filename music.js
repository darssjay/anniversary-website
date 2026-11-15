(() => {
  const audio = new Audio("music/love.mp3");
  audio.loop = true;
  audio.preload = "auto";

  const getSaved = (key, fallback) => {
    const value = localStorage.getItem(key);
    return value === null ? fallback : value;
  };

  let targetVolume = Math.max(0, Math.min(1, Number(getSaved("loveMusicVolume", "0.35"))));
  let muted = getSaved("loveMusicMuted", "false") === "true";
  let fadeTimer = null;

  audio.volume = 0;

  const savedTime = Number(localStorage.getItem("loveMusicTime") || 0);
  const shouldResume = localStorage.getItem("loveMusicShouldResume") === "true";

  audio.addEventListener("loadedmetadata", () => {
    if (savedTime > 0 && savedTime < audio.duration) {
      audio.currentTime = savedTime;
    }

    if (shouldResume) {
      localStorage.setItem("loveMusicShouldResume", "false");
      playMusic();
    }
  });

  const button = document.createElement("button");
  button.id = "loveMusicToggle";
  button.type = "button";
  button.textContent = "♫ Play Music";
  button.setAttribute("aria-label", "Play or pause background music");

  Object.assign(button.style, {
    position: "fixed",
    right: "16px",
    bottom: "16px",
    zIndex: "99999",
    padding: "12px 16px",
    border: "1px solid #e8b8c8",
    borderRadius: "30px",
    background: "#fff5f7",
    color: "#8b3d5a",
    fontSize: "13px",
    fontWeight: "600",
    boxShadow: "0 4px 14px rgba(80,30,50,.15)",
    cursor: "pointer"
  });

  const panel = document.createElement("div");
  panel.id = "loveMusicControls";

  Object.assign(panel.style, {
    position: "fixed",
    right: "16px",
    bottom: "68px",
    zIndex: "99999",
    display: "none",
    alignItems: "center",
    gap: "9px",
    padding: "10px 12px",
    border: "1px solid #e8b8c8",
    borderRadius: "18px",
    background: "#fff5f7",
    color: "#8b3d5a",
    boxShadow: "0 4px 14px rgba(80,30,50,.15)"
  });

  const muteButton = document.createElement("button");
  muteButton.type = "button";
  muteButton.textContent = muted ? "Unmute" : "Mute";

  Object.assign(muteButton.style, {
    border: "0",
    background: "transparent",
    color: "#8b3d5a",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer"
  });

  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = "0";
  slider.max = "1";
  slider.step = "0.01";
  slider.value = String(targetVolume);
  slider.setAttribute("aria-label", "Music volume");

  Object.assign(slider.style, {
    width: "105px",
    accentColor: "#c56b8a"
  });

  panel.append(muteButton, slider);
  document.body.append(button, panel);

  function updateButton() {
    button.textContent = audio.paused ? "♫ Play Music" : "♫ Pause Music";
    muteButton.textContent = muted ? "Unmute" : "Mute";
    slider.value = String(targetVolume);
  }

  function fadeTo(volume, duration, pauseAfter = false) {
    clearInterval(fadeTimer);

    const start = audio.volume;
    const difference = volume - start;
    const steps = 25;
    let step = 0;

    fadeTimer = setInterval(() => {
      step++;
      audio.volume = Math.max(0, Math.min(1, start + difference * (step / steps)));

      if (step >= steps) {
        clearInterval(fadeTimer);
        audio.volume = volume;
        if (pauseAfter) audio.pause();
      }
    }, duration / steps);
  }

  async function playMusic() {
    try {
      await audio.play();
      fadeTo(muted ? 0 : targetVolume, 700);
      updateButton();
    } catch (error) {
      button.textContent = "♫ Tap to Play";
    }
  }

  button.addEventListener("click", async () => {
    if (audio.paused) {
      await playMusic();
    } else {
      fadeTo(0, 500, true);
    }
  });

  button.addEventListener("contextmenu", event => {
    event.preventDefault();
    panel.style.display = panel.style.display === "none" ? "flex" : "none";
  });

  button.addEventListener("dblclick", () => {
    panel.style.display = panel.style.display === "none" ? "flex" : "none";
  });

  muteButton.addEventListener("click", () => {
    muted = !muted;
    localStorage.setItem("loveMusicMuted", String(muted));
    if (!audio.paused) fadeTo(muted ? 0 : targetVolume, 300);
    updateButton();
  });

  slider.addEventListener("input", () => {
    targetVolume = Number(slider.value);
    localStorage.setItem("loveMusicVolume", String(targetVolume));
    if (!audio.paused && !muted) fadeTo(targetVolume, 120);
  });

  function saveMusicState() {
    localStorage.setItem("loveMusicTime", String(audio.currentTime));
    localStorage.setItem("loveMusicVolume", String(targetVolume));
    localStorage.setItem("loveMusicMuted", String(muted));
  }

  audio.addEventListener("timeupdate", saveMusicState);
  window.addEventListener("pagehide", saveMusicState);

  audio.addEventListener("play", updateButton);
  audio.addEventListener("pause", updateButton);

  window.loveBackgroundMusic = audio;
  window.fadeOutLoveMusic = () => new Promise(resolve => {
    if (audio.paused) {
      localStorage.setItem("loveMusicShouldResume", "false");
      return resolve();
    }

    localStorage.setItem("loveMusicShouldResume", "true");
    fadeTo(0, 500, true);
    setTimeout(resolve, 550);
  });

  updateButton();
})();
