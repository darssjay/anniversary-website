(() => {
  const audio = new Audio("music/love.mp3");
  audio.loop = true;
  audio.volume = 0.35;

  const savedTime = Number(localStorage.getItem("loveMusicTime") || 0);
  audio.addEventListener("loadedmetadata", () => {
    if (savedTime < audio.duration) audio.currentTime = savedTime;
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

  document.body.appendChild(button);

  const updateButton = () => {
    button.textContent = audio.paused ? "♫ Play Music" : "♫ Pause Music";
  };

  button.addEventListener("click", async () => {
    if (audio.paused) {
      try {
        await audio.play();
      } catch (error) {
        button.textContent = "♫ Tap to Play";
      }
    } else {
      audio.pause();
    }
    updateButton();
  });

  audio.addEventListener("play", updateButton);
  audio.addEventListener("pause", updateButton);

  window.addEventListener("pagehide", () => {
    localStorage.setItem("loveMusicTime", String(audio.currentTime));
  });

  updateButton();
  window.loveBackgroundMusic = audio;
})();
