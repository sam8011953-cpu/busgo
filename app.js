// ── APP STATE ──
let state = {
  user: null,
  from: '', to: '', date: '',
  selectedBus: null,
  selectedSeats: [],
  passengers: [],
  payMethod: 'UPI',
  bookings: [],
  darkMode: false
};

// ── BUS DATA ──
const BUSES = [
  {
    id: 1,
    name: 'Orange Travels',
    type: 'AC Sleeper',
    departure: '21:00',
    arrival: '05:30',
    duration: '8h 30m',
    price: 850,
    totalSeats: 30,
    bookedSeats: [2, 5, 8, 11, 14, 17, 20, 23],
    badges: ['AC', 'Sleeper'],
    rating: '4.5',
    amenities: '💺 Blanket • 💧 Water • 🔌 Charging'
  },
  {
    id: 2,
    name: 'SRS Express',
    type: 'Non-AC Seater',
    departure: '22:15',
    arrival: '06:45',
    duration: '8h 30m',
    price: 550,
    totalSeats: 40,
    bookedSeats: [1, 3, 6, 9, 12, 18, 25, 30],
    badges: ['Non-AC', 'Seater'],
    rating: '4.2',
    amenities: '💺 Seat • 📺 TV • 🔌 Charging'
  },
  {
    id: 3,
    name: 'KPN Travels',
    type: 'AC Semi-Sleeper',
    departure: '23:00',
    arrival: '07:00',
    duration: '8h 00m',
    price: 700,
    totalSeats: 36,
    bookedSeats: [4, 7, 10, 13, 16, 22, 28],
    badges: ['AC', 'Semi-Sleeper'],
    rating: '4.7',
    amenities: '💺 Semi-Sleeper • 💧 Water • 🔌 Charging'
  }
];

// ── INIT ──
window.addEventListener('load', () => {
  loadFromStorage();
  setTimeout(() => {
    document.getElementById('splash').style.opacity = '0';
    document.getElementById('splash').style.transition = 'opacity 0.5s';
    setTimeout(() => {
      document.getElementById('splash').classList.add('hidden');
      if (state.user) {
        showMainApp();
      } else {
        document.getElementById('authScreen').classList.remove('hidden');
      }
    }, 500);
  }, 2200);
  setTodayDate();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js');
  }
});

// ── STORAGE ──
function loadFromStorage() {
  const user = localStorage.getItem('busgo_user');
  const bookings = localStorage.getItem('busgo_bookings');
  const dark = localStorage.getItem('busgo_dark');
  if (user) state.user = JSON.parse(user);
  if (bookings) state.bookings = JSON.parse(bookings);
  if (dark === 'true') {
    state.darkMode = true;
    document.body.classList.add('dark');
    document.getElementById('darkBtn').textContent = '☀️';
  }
}

function saveBookings() {
  localStorage.setItem('busgo_bookings', JSON.stringify(state.bookings));
}

// ── AUTH ──
function switchAuth(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  if (tab === 'login') {
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('signupForm').classList.add('hidden');
  } else {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('signupForm').classList.remove('hidden');
  }
}

function login() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  if (!email || !password) { showToast('⚠️ Please fill all fields'); return; }
  if (!isValidEmail(email)) { showToast('⚠️ Enter a valid email'); return; }
  const name = email.split('@')[0];
  const capitalized = name.charAt(0).toUpperCase() + name.slice(1);
  state.user = { name: capitalized, email };
  localStorage.setItem('busgo_user', JSON.stringify(state.user));
  showToast('✅ Welcome back, ' + capitalized + '!');
  setTimeout(() => {
    document.getElementById('authScreen').classList.add('hidden');
    showMainApp();
  }, 800);
}

function signup() {
  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value.trim();
  if (!name || !email || !password) { showToast('⚠️ Please fill all fields'); return; }
  if (!isValidEmail(email)) { showToast('⚠️ Enter a valid email'); return; }
  if (password.length < 6) { showToast('⚠️ Password too short'); return; }
  state.user = { name, email };
  localStorage.setItem('busgo_user', JSON.stringify(state.user));
  showToast('🎉 Account created! Welcome, ' + name + '!');
  setTimeout(() => {
    document.getElementById('authScreen').classList.add('hidden');
    showMainApp();
  }, 800);
}

function logout() {
  showConfirmModal(
    'Logout?',
    'Are you sure you want to logout from BusGo?',
    () => {
      localStorage.removeItem('busgo_user');
      state.user = null;
      document.getElementById('mainApp').classList.add('hidden');
      document.getElementById('authScreen').classList.remove('hidden');
      showToast('👋 Logged out successfully');
    }
  );
}

function togglePw(id) {
  const input = document.getElementById(id);
  input.type = input.type === 'password' ? 'text' : 'password';
}

function checkStrength(pw) {
  const fill = document.getElementById('strengthFill');
  const text = document.getElementById('strengthText');
  if (!pw) { fill.style.width = '0%'; text.textContent = ''; return; }
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const levels = [
    { w: '20%', color: '#ef4444', label: 'Very Weak' },
    { w: '40%', color: '#f97316', label: 'Weak' },
    { w: '60%', color: '#fbbf24', label: 'Fair' },
    { w: '80%', color: '#22c55e', label: 'Strong' },
    { w: '100%', color: '#16a34a', label: 'Very Strong' }
  ];
  const level = levels[Math.min(score - 1, 4)] || levels[0];
  fill.style.width = level.w;
  fill.style.background = level.color;
  text.textContent = level.label;
  text.style.color = level.color;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ── MAIN APP ──
function showMainApp() {
  document.getElementById('mainApp').classList.remove('hidden');
  updateHeader();
  showTab('search');
}

function updateHeader() {
  if (!state.user) return;
  const initial = state.user.name.charAt(0).toUpperCase();
  document.getElementById('userAvatar').textContent = initial;
  document.getElementById('heroName').textContent = state.user.name;
  document.getElementById('heroGreeting').textContent = getGreeting();
  document.getElementById('profileName').textContent = state.user.name;
  document.getElementById('profileEmail').textContent = state.user.email;
  document.getElementById('profileAvatar').textContent = initial;
  updateProfileStats();
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning 👋';
  if (h < 17) return 'Good Afternoon 👋';
  return 'Good Evening 👋';
}

function setTodayDate() {
  const today = new Date().toISOString().split('T')[0];
  const dateInput = document.getElementById('travelDate');
  if (dateInput) {
    dateInput.min = today;
    dateInput.value = today;
  }
}

// ── TABS ──
function showTab(tab) {
  const screens = {
    search: 'searchScreen',
    bookings: 'bookingsScreen',
    profile: 'profileScreen'
  };
  Object.values(screens).forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.classList.add('hidden'); el.classList.remove('active-screen'); }
  });
  ['busListScreen','seatScreen','passengerScreen','paymentScreen','ticketScreen'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  const target = document.getElementById(screens[tab]);
  if (target) { target.classList.remove('hidden'); target.classList.add('active-screen'); }
  const tabBtn = document.getElementById('tab-' + tab);
  if (tabBtn) tabBtn.classList.add('active');
  if (tab === 'bookings') renderBookings();
  if (tab === 'profile') updateProfileStats();
  if (tab === 'search') setTodayDate();
}

function goBack(screenId) {
  ['busListScreen','seatScreen','passengerScreen','paymentScreen','ticketScreen',
   'searchScreen','bookingsScreen','profileScreen'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });
  const target = document.getElementById(screenId);
  if (target) target.classList.remove('hidden');
}

// ── SEARCH ──
function swapCities() {
  const from = document.getElementById('fromCity');
  const to = document.getElementById('toCity');
  const temp = from.value;
  from.value = to.value;
  to.value = temp;
}

function fillRoute(from, to) {
  document.getElementById('fromCity').value = from;
  document.getElementById('toCity').value = to;
  setTodayDate();
  showToast('✅ Route selected!');
}

function searchBuses() {
  const from = document.getElementById('fromCity').value;
  const to = document.getElementById('toCity').value;
  const date = document.getElementById('travelDate').value;
  if (!from) { showToast('⚠️ Select departure city'); return; }
  if (!to) { showToast('⚠️ Select destination city'); return; }
  if (from === to) { showToast('⚠️ From and To cannot be same'); return; }
  if (!date) { showToast('⚠️ Select travel date'); return; }
  state.from = from;
  state.to = to;
  state.date = date;
  renderBusList();
  showScreen('busListScreen');
}

function showScreen(id) {
  ['searchScreen','busListScreen','seatScreen','passengerScreen',
   'paymentScreen','ticketScreen','bookingsScreen','profileScreen'].forEach(sid => {
    const el = document.getElementById(sid);
    if (el) el.classList.add('hidden');
  });
  document.getElementById(id).classList.remove('hidden');
}

// ── BUS LIST ──
function renderBusList() {
  document.getElementById('routeTitle').textContent = state.from + ' → ' + state.to;
  document.getElementById('routeDate').textContent = formatDate(state.date);
  const list = document.getElementById('busList');
  list.innerHTML = BUSES.map(bus => {
    const available = bus.totalSeats - bus.bookedSeats.length;
    const badgeHTML = bus.badges.map(b => {
      const cls = b === 'AC' ? 'badge-ac' : b === 'Non-AC' ? 'badge-nonac' :
                  b === 'Sleeper' ? 'badge-sleeper' : b === 'Seater' ? 'badge-seater' : 'badge-semi';
      return `<span class="badge ${cls}">${b}</span>`;
    }).join('');
    return `
      <div class="bus-card" onclick="selectBus(${bus.id})">
        <div class="bus-card-top">
          <div>
            <div class="bus-name">${bus.name}</div>
            <div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px;">${bus.amenities}</div>
          </div>
          <div class="bus-price">₹${bus.price}</div>
        </div>
        <div class="bus-badges">${badgeHTML}</div>
        <div class="bus-timing">
          <div class="bus-time">
            <div class="time">${bus.departure}</div>
            <div class="label">${state.from}</div>
          </div>
          <div class="bus-duration">
            <div class="dur">${bus.duration}</div>
            <div class="dur-line"></div>
            <div class="dur" style="font-size:0.7rem;">⭐ ${bus.rating}</div>
          </div>
          <div class="bus-time">
            <div class="time">${bus.arrival}</div>
            <div class="label">${state.to}</div>
          </div>
        </div>
        <div class="bus-seats-left">✅ ${available} seats available</div>
      </div>`;
  }).join('');
}

function selectBus(id) {
  state.selectedBus = BUSES.find(b => b.id === id);
  state.selectedSeats = [];
  renderSeatMap();
  showScreen('seatScreen');
  document.getElementById('seatBusName').textContent = state.selectedBus.name;
}

// ── SEAT MAP ──
function renderSeatMap() {
  const bus = state.selectedBus;
  const map = document.getElementById('seatMap');
  map.innerHTML = '';
  for (let i = 1; i <= bus.totalSeats; i++) {
    const seat = document.createElement('div');
    seat.className = 'seat';
    seat.textContent = i;
    seat.dataset.num = i;
    if (bus.bookedSeats.includes(i)) {
      seat.classList.add('booked');
    } else if (state.selectedSeats.includes(i)) {
      seat.classList.add('selected');
    }
    if (!seat.classList.contains('booked')) {
      seat.addEventListener('click', () => toggleSeat(i, seat));
    }
    map.appendChild(seat);
    // Add aisle after seat 2 in each row of 5
    if (i % 5 === 2) {
      const aisle = document.createElement('div');
      aisle.className = 'seat aisle';
      map.appendChild(aisle);
    }
  }
  updateSeatInfo();
}

function toggleSeat(num, el) {
  const idx = state.selectedSeats.indexOf(num);
  if (idx === -1) {
    if (state.selectedSeats.length >= 6) {
      showToast('⚠️ Max 6 seats per booking');
      return;
    }
    state.selectedSeats.push(num);
    el.classList.add('selected');
  } else {
    state.selectedSeats.splice(idx, 1);
    el.classList.remove('selected');
  }
  updateSeatInfo();
}

function updateSeatInfo() {
  const bus = state.selectedBus;
  document.getElementById('selectedSeatsText').textContent =
    state.selectedSeats.length ? state.selectedSeats.join(', ') : 'None';
  document.getElementById('seatTotal').textContent =
    '₹' + (state.selectedSeats.length * bus.price);
}

function goToPassenger() {
  if (!state.selectedSeats.length) {
    showToast('⚠️ Please select at least one seat');
    return;
  }
  renderPassengerForms();
  showScreen('passengerScreen');
}

// ── PASSENGER ──
function renderPassengerForms() {
  const forms = document.getElementById('passengerForms');
  forms.innerHTML = state.selectedSeats.map((seat, i) => `
    <div class="passenger-card">
      <h4>🧍 Passenger ${i + 1} — Seat ${seat}</h4>
      <div class="input-group">
        <span class="input-icon">👤</span>
        <input type="text" id="pName${i}" placeholder="Full Name" />
      </div>
      <div class="input-group">
        <span class="input-icon">🎂</span>
        <input type="number" id="pAge${i}" placeholder="Age" min="1" max="100" />
      </div>
      <div class="gender-row">
        <button class="gender-btn active" id="gM${i}" onclick="setGender(${i},'Male')">♂ Male</button>
        <button class="gender-btn" id="gF${i}" onclick="setGender(${i},'Female')">♀ Female</button>
      </div>
    </div>
  `).join('');
}

function setGender(i, gender) {
  document.getElementById('gM' + i).classList.toggle('active', gender === 'Male');
  document.getElementById('gF' + i).classList.toggle('active', gender === 'Female');
}

function goToPayment() {
  const passengers = [];
  for (let i = 0; i < state.selectedSeats.length; i++) {
    const name = document.getElementById('pName' + i).value.trim();
    const age = document.getElementById('pAge' + i).value.trim();
    if (!name || !age) {
      showToast('⚠️ Fill all passenger details');
      return;
    }
    const gender = document.getElementById('gM' + i).classList.contains('active') ? 'Male' : 'Female';
    passengers.push({ name, age, gender, seat: state.selectedSeats[i] });
  }
  state.passengers = passengers;
  renderPaymentSummary();
  showScreen('paymentScreen');
}

// ── PAYMENT ──
function renderPaymentSummary() {
  const bus = state.selectedBus;
  const total = state.selectedSeats.length * bus.price;
  document.getElementById('payRoute').textContent = state.from + ' → ' + state.to;
  document.getElementById('payDate').textContent = formatDate(state.date);
  document.getElementById('payBus').textContent = bus.name;
  document.getElementById('paySeats').textContent = state.selectedSeats.join(', ');
  document.getElementById('payTotal').textContent = '₹' + total;
}

function selectPay(method) {
  state.payMethod = method;
  document.getElementById('payUPI').classList.toggle('active', method === 'UPI');
  document.getElementById('payCard').classList.toggle('active', method === 'Card');
  document.getElementById('upiSection').classList.toggle('hidden', method !== 'UPI');
  document.getElementById('cardSection').classList.toggle('hidden', method !== 'Card');
}

function processPayment() {
  if (state.payMethod === 'UPI') {
    const upi = document.getElementById('upiId').value.trim();
    if (!upi) { showToast('⚠️ Enter UPI ID'); return; }
    if (!upi.includes('@')) { showToast('⚠️ Invalid UPI ID'); return; }
  } else {
    const card = document.getElementById('cardNum').value.trim();
    const exp = document.getElementById('cardExp').value.trim();
    const cvv = document.getElementById('cardCvv').value.trim();
    if (!card || !exp || !cvv) { showToast('⚠️ Fill all card details'); return; }
    if (card.length < 16) { showToast('⚠️ Invalid card number'); return; }
  }
  showToast('⏳ Processing payment...');
  setTimeout(() => confirmBooking(), 1500);
}

// ── BOOKING CONFIRM ──
function confirmBooking() {
  const bus = state.selectedBus;
  const total = state.selectedSeats.length * bus.price;
  const booking = {
    id: 'BG' + Date.now().toString().slice(-6),
    from: state.from,
    to: state.to,
    date: state.date,
    bus: bus.name,
    busType: bus.type,
    departure: bus.departure,
    arrival: bus.arrival,
    seats: [...state.selectedSeats],
    passengers: [...state.passengers],
    total,
    payMethod: state.payMethod,
    status: 'confirmed',
    bookedAt: new Date().toISOString()
  };
  state.bookings.unshift(booking);
  saveBookings();
  renderTicket(booking);
  showScreen('ticketScreen');
  showToast('🎉 Booking Confirmed!');
}

// ── TICKET ──
function renderTicket(booking) {
  document.getElementById('ticketId').textContent = 'Booking ID: ' + booking.id;
  document.getElementById('ticketFrom').textContent = booking.from;
  document.getElementById('ticketTo').textContent = booking.to;
  document.getElementById('ticketDate').textContent = formatDate(booking.date);
  document.getElementById('ticketBus').textContent = booking.bus;
  document.getElementById('ticketSeats').textContent = booking.seats.join(', ');
  document.getElementById('ticketAmount').textContent = '₹' + booking.total;
  generateQR(booking.id);
}

function generateQR(text) {
  const canvas = document.getElementById('qrCanvas');
  const ctx = canvas.getContext('2d');
  const size = 150;
  canvas.width = size;
  canvas.height = size;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#0f1b2d';
  const cellSize = 5;
  const cells = Math.floor(size / cellSize);
  // Simple deterministic pattern based on text
  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      const charCode = text.charCodeAt((r * cells + c) % text.length);
      if ((charCode + r + c) % 3 === 0) {
        ctx.fillRect(c * cellSize, r * cellSize, cellSize - 1, cellSize - 1);
      }
    }
  }
  // Corner markers
  [[0,0],[0,cells-7],[cells-7,0]].forEach(([r,c]) => {
    ctx.fillStyle = '#0f1b2d';
    ctx.fillRect(c*cellSize, r*cellSize, 7*cellSize, 7*cellSize);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(c*cellSize+cellSize, r*cellSize+cellSize, 5*cellSize, 5*cellSize);
    ctx.fillStyle = '#f97316';
    ctx.fillRect(c*cellSize+2*cellSize, r*cellSize+2*cellSize, 3*cellSize, 3*cellSize);
  });
}

// ── BOOKINGS ──
function renderBookings() {
  const list = document.getElementById('bookingsList');
  if (!state.bookings.length) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🎫</div>
        <h3>No Bookings Yet</h3>
        <p>Search and book your first bus ticket!</p>
      </div>`;
    return;
  }
  list.innerHTML = state.bookings.map(b => `
    <div class="booking-card">
      <div class="booking-card-top">
        <div class="booking-route">${b.from} → ${b.to}</div>
        <div class="booking-status ${b.status === 'confirmed' ? 'status-confirmed' : 'status-cancelled'}">
          ${b.status === 'confirmed' ? '✅ Confirmed' : '❌ Cancelled'}
        </div>
      </div>
      <div class="booking-meta">
        <span>📅 ${formatDate(b.date)}</span>
        <span>🚌 ${b.bus}</span>
        <span>💺 Seats: ${b.seats.join(', ')}</span>
        <span>💰 ₹${b.total}</span>
        <span>🆔 ${b.id}</span>
      </div>
      <div class="booking-actions">
        <button class="btn-view" onclick="viewTicketFromBooking('${b.id}')">View Ticket</button>
        ${b.status === 'confirmed' ?
          `<button class="btn-cancel" onclick="cancelBooking('${b.id}')">Cancel</button>` :
          `<button class="btn-cancel" disabled style="opacity:0.4">Cancelled</button>`
        }
      </div>
    </div>
  `).join('');
}

function viewTicketFromBooking(id) {
  const booking = state.bookings.find(b => b.id === id);
  if (!booking) return;
  renderTicket(booking);
  showScreen('ticketScreen');
}

function cancelBooking(id) {
  showConfirmModal(
    'Cancel Booking?',
    'Are you sure you want to cancel this booking? This cannot be undone.',
    () => {
      const booking = state.bookings.find(b => b.id === id);
      if (booking) {
        booking.status = 'cancelled';
        saveBookings();
        renderBookings();
        showToast('🚫 Booking cancelled');
      }
    }
  );
}

// ── PROFILE STATS ──
function updateProfileStats() {
  const confirmed = state.bookings.filter(b => b.status === 'confirmed');
  const spent = confirmed.reduce((sum, b) => sum + b.total, 0);
  const cities = new Set(confirmed.flatMap(b => [b.from, b.to])).size;
  document.getElementById('statTotal').textContent = confirmed.length;
  document.getElementById('statSpent').textContent = '₹' + spent;
  document.getElementById('statCities').textContent = cities;
  document.getElementById('darkStatus').textContent = state.darkMode ? 'On' : 'Off';
}

// ── DARK MODE ──
function toggleDark() {
  state.darkMode = !state.darkMode;
  document.body.classList.toggle('dark', state.darkMode);
  document.getElementById('darkBtn').textContent = state.darkMode ? '☀️' : '🌙';
  localStorage.setItem('busgo_dark', state.darkMode);
  document.getElementById('darkStatus').textContent = state.darkMode ? 'On' : 'Off';
}

// ── TOAST ──
function showToast(msg) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// ── MODAL ──
function showConfirmModal(title, msg, onConfirm) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-box">
      <h3>${title}</h3>
      <p>${msg}</p>
      <div class="modal-actions">
        <button class="btn-modal-cancel" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        <button class="btn-modal-confirm" id="confirmBtn">Confirm</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('#confirmBtn').addEventListener('click', () => {
    overlay.remove();
    onConfirm();
  });
}

// ── UTILS ──
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}