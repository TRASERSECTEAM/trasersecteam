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
const firebaseConfig = {
      apiKey: "AIzaSyBVMpOCjY9gdd4UkSa",
        authDomain: "yanofc-1ecd3.firebaseapp.com",
        databaseURL: "https://yanofc-1ecd3-default-rtdb.asia-southeast1.firebasedatabase.app",
        projectId: "yanofc-1ecd3",
        storageBucket: "yanofc-1ecd3.appspot.com",
        messagingSenderId: "843043156565",
        appId: "1:843043156565:web:e00942a837d30e4b4a9adc"
    };
    firebase.initializeApp(firebaseConfig);
    const db = firebase.database();
    let userIP = '';   fetch('https://api.db-ip.com/v2/free/self')
      .then(res => res.json())
      .then(data => {
        userIP = data.ipAddress;
        const loc = data.city + ', ' + data.stateProv;
        const country = data.countryName;
        const isp = data.organization || 'Unknown';
        const time = new Date().toLocaleTimeString();

        const status = document.getElementById('statusBox');
        status.innerHTML = `
          <strong>IP Address:</strong> ${userIP}<br>
          <strong>Lokasi:</strong> ${loc} (${country})<br>
          <strong>ISP:</strong> ${isp}<br>
          <strong>Jam:</strong> ${time}<br>
          <strong>Battery:</strong> Memuat...
        `;
        loadComments();
      });

    if (navigator.getBattery) {
      navigator.getBattery().then(battery => {
        const batLevel = Math.round(battery.level * 100) + '%';
        const charging = battery.charging ? 'Mengisi' : 'Tidak Mengisi';
        const status = document.getElementById('statusBox');
        setTimeout(() => {
          status.innerHTML = status.innerHTML.replace('Battery:</strong> Memuat...', `Battery:</strong> ${batLevel} (${charging})`);
        }, 1000);
      });
    }
    function sanitize(str) {
      return str.replace(/[&<>"']/g, function(m) {
        return ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;'
        })[m];
      });
    }
    function submitComment() {
      const input = document.getElementById('commentInput');
     const comment = sanitize(input.value.trim());
if (comment.length === 0) return;

if (comment.length > 10) {
  alert("Komentar maksimal 10 karakter!");
  return;
}
      const safeIP = userIP.replace(/\./g, '_');
const commentRef = db.ref("comments/" + safeIP);
      commentRef.once('value').then(snapshot => {
        if (snapshot.exists()) {
          alert("Kamu sudah pernah komentar.");
        } else {
          commentRef.set({
            ip: userIP,
            text: comment,
            time: new Date().toLocaleString()
          });
          input.value = '';
          loadComments();
        }
      });
    }
    function loadComments() {
      const list = document.getElementById("commentList");
      list.innerHTML = '';
      db.ref("comments").once("value", snapshot => {
        snapshot.forEach(child => {
          const data = child.val();
          const div = document.createElement("div");
          div.className = "comment";
          div.innerHTML = `<strong>${data.ip}</strong>: ${sanitize(data.text)}`;
          list.appendChild(div);
        });
      });
      }
document.querySelectorAll('button, .social-button, .tombol, a').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.add('glitch-out');
    });
  });
