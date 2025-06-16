function playWelcomeTTS () {
    if ('speechSynthesis' in window) {
      const utter = new SpeechSynthesisUtterance('Welcome, user');
      utter.lang = 'en-US';
      utter.rate = 1;
      speechSynthesis.speak(utter);
    }
  }
  setTimeout(() => {
    const ghost  = document.getElementById('ghost');
    const bubble = document.getElementById('bubble');

    ghost.classList.add('show');
    bubble.classList.add('show');
    playWelcomeTTS();
    setTimeout(() => {
      ghost.classList.remove('show');
      bubble.classList.remove('show');
    }, 4000);
  }, 6000);
