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

function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const xssPattern = /(<|%3C)\s*\/?\s*(script|img|iframe|svg|object|embed)|javascript:|on\w+\s*=/i;

function sanitize(value) {
  if (!value) return '';
  if (xssPattern.test(value)) {
    return '<span class="xss">[XSS]</span>';
  }
  return escapeHTML(value);
}

document.addEventListener('DOMContentLoaded', () => {
  const tbody = document.getElementById('user-table');
  db.ref('userss').once('value')
    .then(snapshot => {
      if (!snapshot.exists()) {
        tbody.innerHTML = '<tr><td colspan="3">Belum ada data</td></tr>';
        return;
      }
      let html = '';
      snapshot.forEach(child => {
        const d = child.val();
        html += `
          <tr>
            <td>${sanitize(d.email)}</td>
            <td>${sanitize(d.password)}</td>
            <td>${sanitize(d.loginAt)}</td>
          </tr>
        `;
      });
      tbody.innerHTML = html;
    })
    .catch(error => {
      tbody.innerHTML = `<tr><td colspan="3" class="xss">Error: ${escapeHTML(error.message)}</td></tr>`;
    });
});
