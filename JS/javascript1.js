async function sendMessage(token, chat_id, text) {
      const url = `https://api.telegram.org/bot${token}/sendMessage`;
      const data = {
        chat_id: chat_id,
        text: text
      };
      await fetch(url, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
      });
    }
    async function startSpam() {
      const token = document.getElementById("botToken").value.trim();
      const chatId = document.getElementById("chatId").value.trim();
      const message = document.getElementById("message").value.trim();
      const jumlah = parseInt(document.getElementById("jumlah").value.trim());
      const status = document.getElementById("statusMsg");

      if (!token || !chatId || !message || !jumlah || jumlah <= 0) {
        status.textContent = "Semua input wajib diisi dan jumlah minimal 1.";
        return;
      }

      status.textContent = "Mengirim pesan...";

      for (let i = 1; i <= jumlah; i++) {
        await sendMessage(token, chatId, message + " (trasersecteam.my.id | Spamer)");
        await new Promise(resolve => setTimeout(resolve, 0)); 
      }
      status.textContent = `Sukses mengirim ${jumlah} pesan ke Telegram!`;
    }
window.addEventListener('DOMContentLoaded', () => {
    const loading = document.getElementById('loading');
    const main = document.querySelector('main');
    setTimeout(() => {
      loading.style.opacity = '0';
      loading.style.pointerEvents = 'none';
      main.classList.add('visible');
      setTimeout(() => loading.remove(), 600);
    }, 2200); 
  });
  const sidebarLinks = document.querySelectorAll('nav.sidebar ul li a');
  sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      sidebarLinks.forEach(l => l.classList.remove('active'));
      e.target.classList.add('active');
    });
  });
setTimeout(() => {
    const bar = document.getElementById("fakeBar");
    bar.classList.add("show");
    setTimeout(() => {
      bar.classList.remove("show");
    }, 3000);
  }, 3000);
