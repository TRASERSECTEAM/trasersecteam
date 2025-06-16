const player = new Audio();
  document.querySelectorAll('p[data-sound]').forEach(function(p) {
    p.addEventListener('click', function () {
      const url = this.getAttribute('data-sound');
      if (!url) return;      
      player.pause();           
      player.src = url;
      player.currentTime = 0;
      player.play().catch(function(e){
        console.warn('Gagal play:', e.message);
      });
    });
  });
