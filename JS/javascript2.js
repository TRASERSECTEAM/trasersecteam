window.addEventListener("DOMContentLoaded", () => {
    lucide.createIcons();
  const sound = document.getElementById("click-sound");
    document.querySelectorAll('.tombol').forEach(el => {
      el.addEventListener("click", () => {
        sound.pause();
        sound.currentTime = 0;
        sound.play().catch(e => {
          console.warn("Gagal play:", e.message);
        });
      });
    });
  });
