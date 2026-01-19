document.addEventListener('DOMContentLoaded', () => {
  checkAuthStatus();

  document.getElementById('loginForm').addEventListener('submit', handleLogin);

  document.getElementById('logoutBtn').addEventListener('click', () => {
    sessionStorage.removeItem('adminAuthenticated');
    showLoginForm();
  });

  document.getElementById('appointmentsList').addEventListener('click', (e) => {
    if (e.target.classList.contains('confirm-btn')) {
      confirmAppointment(e.target.dataset.id);
    }
    if (e.target.classList.contains('reject-btn')) {
      rejectAppointment(e.target.dataset.id);
    }
  });
});


/* -------------------- AUTH CHECK -------------------- */

function checkAuthStatus() {
  if (sessionStorage.getItem('adminAuthenticated') === 'true') {
    showAdminPanel();
    updateDashboardCounts();
    loadAppointments();
  } else {
    showLoginForm();
  }
}

async function handleLogin(e) {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const loginBtn = e.target.querySelector('button[type="submit"]');

  loginBtn.textContent = 'Logging in...';
  loginBtn.disabled = true;

  try {
    const resp = await fetch('/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await resp.json();

    if (resp.ok && data.success) {
      sessionStorage.setItem('adminAuthenticated', 'true');
      showAdminPanel();
      updateDashboardCounts();
      loadAppointments();
      alert('Login successful!');
    } else {
      alert(data.message || 'Invalid login');
    }
  } catch (error) {
    alert('Login failed. Try again.');
  } finally {
    loginBtn.textContent = 'Login';
    loginBtn.disabled = false;
  }
}

function showLoginForm() {
  document.getElementById('loginContainer').style.display = 'flex';
  document.getElementById('adminPanel').style.display = 'none';
  document.getElementById('logoutBtn').style.display = 'none';
}

function showAdminPanel() {
  document.getElementById('loginContainer').style.display = 'none';
  document.getElementById('adminPanel').style.display = 'block';
  document.getElementById('logoutBtn').style.display = 'block';
}


/* -------------------- DASHBOARD COUNTS -------------------- */

async function updateDashboardCounts() {
  try {
    const resp = await fetch('/api/appointment-count');
    const data = await resp.json();

    document.getElementById('totalAppointments').textContent = data.total;
  } catch (err) {
    console.error("Count fetch error:", err);
  }
}


/* -------------------- LOAD APPOINTMENTS -------------------- */

async function loadAppointments() {
  try {
    const resp = await fetch('/api/appointments');
    const data = await resp.json();

    const container = document.getElementById('appointmentsList');
    container.innerHTML = '';

    if (data.length === 0) {
      container.innerHTML = '<p>No appointments yet.</p>';
      return;
    }

    data.forEach(a => {
      const div = document.createElement('div');
      div.classList.add('appointment-card');

      div.innerHTML = `
        <h3>${a.name}</h3>
        <p><strong>Email:</strong> ${a.email}</p>
        <p><strong>Phone:</strong> ${a.phone}</p>
        <p><strong>Service:</strong> ${a.service}</p>
        <p><strong>Date:</strong> ${a.date}</p>
        <p><strong>Time:</strong> ${a.time}</p>
        <p><strong>Status:</strong> <span class="status-${a.status}">${a.status}</span></p>

        <button class="confirm-btn" data-id="${a.id}" ${a.status !== 'pending' ? 'disabled' : ''}>
          Confirm
        </button>

        <button class="reject-btn" data-id="${a.id}" ${a.status !== 'pending' ? 'disabled' : ''}>
          Reject
        </button>
      `;

      container.appendChild(div);
    });
  } catch (err) {
    console.error('Error loading appointments:', err);
  }
}


/* -------------------- CONFIRM APPOINTMENT -------------------- */

async function confirmAppointment(id) {
  if (!confirm("Confirm this appointment?")) return;

  try {
    const resp = await fetch('/api/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });

    const data = await resp.json();

    if (data.success) {
      alert('Appointment confirmed!');
      updateDashboardCounts();
      loadAppointments();
    }
  } catch (err) {
    console.error('Confirm error:', err);
  }
}


/* -------------------- REJECT APPOINTMENT -------------------- */

async function rejectAppointment(id) {
  if (!confirm("Reject this appointment?")) return;

  try {
    const resp = await fetch('/api/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });

    const data = await resp.json();

    if (data.success) {
      alert('Appointment rejected!');
      updateDashboardCounts();
      loadAppointments();
    }
  } catch (err) {
    console.error('Reject error:', err);
  }
}
