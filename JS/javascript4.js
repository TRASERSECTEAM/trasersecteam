const sound = document.getElementById("click-sound");
  const glitch = document.getElementById("glitch-effect");
  document.querySelectorAll("button, a").forEach(el => {
    el.addEventListener("click", () => {
      sound.currentTime = 0;
      sound.play().catch(e => console.warn(e));
      glitch.style.opacity = '1';
      setTimeout(() => {
        glitch.style.opacity = '0';
      }, 2000);
    });
  });
