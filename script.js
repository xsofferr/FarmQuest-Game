let currentUser = null;
let users = JSON.parse(localStorage.getItem('farmquest_users')) || [];

const currentUserLabel = document.getElementById('currentUserLabel');
const logoutBtn = document.getElementById('logoutBtn');

window.onload = function() {
  const savedUser = localStorage.getItem('farmquest_currentUser');
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    updateUserUI();
  }
};

function showRegisterModal() {
  window.location.href = 'reg.html';
}

function showLoginModal() {
  window.location.href = 'login.html';
}

function loginAsGuest() {
  currentUser = { id: 'guest', username: 'Гость', isGuest: true };
  localStorage.setItem('farmquest_currentUser', JSON.stringify(currentUser));
  updateUserUI();
}

function updateUserUI() {
  if (currentUser) {
    currentUserLabel.textContent = currentUser.username;
    logoutBtn.style.display = 'inline-block';
  } else {
    currentUserLabel.textContent = 'Не вошли';
    logoutBtn.style.display = 'none';
  }
}

function logout() {
  currentUser = null;
  localStorage.removeItem('farmquest_currentUser');
  updateUserUI();
}

//ЗАГОТОВКИ
function startGame() {
  alert('Скоро будет экран игры!');
}

function showScreen(screenId) {
  alert(`Скоро будет экран: ${screenId}`);
}
