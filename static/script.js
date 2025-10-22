const API_BASE_URL = "http://localhost:5050/api";

// ==================== AUTHENTICATION STATE ====================

const authState = {
  isLoggedIn: false,
  userId: null,
  accessToken: null,
};

// Initialize auth state from localStorage
function initializeAuthState() {
  const token = localStorage.getItem("accessToken");
  const userId = localStorage.getItem("userId");

  if (token && userId) {
    authState.isLoggedIn = true;
    authState.accessToken = token;
    authState.userId = userId;
  }
}

// ==================== MODAL MANAGEMENT ====================

function openLoginModal() {
  document.getElementById("login-modal").classList.add("show");
}
function closeLoginModal() {
  document.getElementById("login-modal").classList.remove("show");
}
function openSignupModal() {
  document.getElementById("signup-modal").classList.add("show");
}
function closeSignupModal() {
  document.getElementById("signup-modal").classList.remove("show");
}
function switchToSignup() {
  closeLoginModal();
  openSignupModal();
}
function switchToLogin() {
  closeSignupModal();
  openLoginModal();
}

// Close modal when clicking outside
window.addEventListener("click", (event) => {
  const loginModal = document.getElementById("login-modal");
  const signupModal = document.getElementById("signup-modal");
  if (event.target === loginModal) closeLoginModal();
  if (event.target === signupModal) closeSignupModal();
});

// ==================== AUTHENTICATION HANDLERS ====================

// Handle login
const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // ✅ Make sure your HTML input has id="login-username"
    const username = document.getElementById("login-username").value.trim();
    if (!username) return alert("Please enter your username");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("userId", data.user_id);
        localStorage.setItem("username", username);
        localStorage.setItem("full_name", data.full_name);
        localStorage.setItem("accessToken", "loggedin"); // Set dummy token for auth state

        alert("Login successful!");
        closeLoginModal();
        window.location.href = "/profile";
      } else {
        alert(data.error || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("An error occurred during login");
    }
  });
}

// Handle signup
const signupForm = document.getElementById("signup-form");
if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fullName = signupForm.querySelector('input[placeholder="Full Name"]').value;
    const username = signupForm.querySelector('input[placeholder="Username"]').value;
    const email = signupForm.querySelector('input[type="email"]').value;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName, username, email }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Account created successfully! Please log in.");
        closeSignupModal();
        openLoginModal();
      } else {
        alert(data.error || "Signup failed");
      }
    } catch (error) {
      console.error("Signup error:", error);
      alert("An error occurred during signup");
    }
  });
}

// ==================== UI UPDATES ====================

function updateAuthUI() {
  const navAuth = document.querySelector(".nav-auth");
  if (!navAuth) return;

  if (authState.isLoggedIn) {
    navAuth.innerHTML = `<button class="btn-logout" onclick="logout()">Logout</button>`;
  } else {
    navAuth.innerHTML = `
      <button class="btn-login" onclick="openLoginModal()">Login</button>
      <button class="btn-signup" onclick="openSignupModal()">Sign Up</button>
    `;
  }
}

// Logout function
function logout() {
  localStorage.clear();
  authState.isLoggedIn = false;
  authState.userId = null;
  alert("You have been logged out.");
  window.location.href = "/";
}

// ==================== PROFILE PAGE ====================

// ==================== PROFILE PAGE NAME DISPLAY ====================

async function loadProfilePage() {
  const userId = localStorage.getItem("userId");
  const profileName = document.getElementById("profile-name");

  if (!userId || !profileName) return;

  try {
    const res = await fetch(`${API_BASE_URL}/profiles/${userId}`);   // ← ✅ THIS LINE
    const data = await res.json();

    if (res.ok && data.full_name) {
      profileName.textContent = data.full_name;
    } else {
      profileName.textContent = "User";
    }
  } catch {
    profileName.textContent = "Error loading profile";
  }
}


// ==================== HOME PAGE FEATURES ====================

async function loadFeaturedVideos() {
  try {
    const response = await fetch(`${API_BASE_URL}/videos?limit=6`);
    if (!response.ok) throw new Error("Failed to load featured videos");

    const videos = await response.json();
    displayFeaturedVideos(videos.slice(0, 6));
  } catch (error) {
    console.error("[v0] Error loading featured videos:", error);
  }
}

function displayFeaturedVideos(videos) {
  const grid = document.getElementById("featured-videos");
  if (!grid) return;

  grid.innerHTML = videos
    .map(
      (video) => `
        <div class="video-card" onclick="window.location.href='videos.html?video=${video.id}'">
          <div class="video-thumbnail">
            <img src="${video.thumbnail_url || "https://via.placeholder.com/280x160?text=" + encodeURIComponent(video.title)}"
                 alt="${video.title}" style="width: 100%; height: 100%; object-fit: cover;">
          </div>
          <div class="video-info">
            <h3>${video.title}</h3>
            <div class="video-meta">
              <span>${video.duration_minutes} min</span>
              <span class="difficulty-badge difficulty-${video.difficulty_level}">
                ${video.difficulty_level}
              </span>
            </div>
          </div>
        </div>
      `
    )
    .join("");
}

// ==================== WATER INTAKE TRACKER ====================

let waterIntake = 0;
const waterGoal = 8;

function initializeWaterIntake() {
  const stored = localStorage.getItem("waterIntake");
  if (stored) waterIntake = parseInt(stored);
  updateWaterDisplay();
}

function updateWaterDisplay() {
  const amountEl = document.getElementById("water-amount");
  const progressEl = document.getElementById("water-progress");
  const percentageEl = document.getElementById("water-percentage");

  if (amountEl) amountEl.textContent = waterIntake;
  if (progressEl && percentageEl) {
    const percentage = Math.min((waterIntake / waterGoal) * 100, 100);
    progressEl.style.width = `${percentage}%`;
    percentageEl.textContent = `${Math.round(percentage)}%`;
  }
}

function addWater(amount) {
  waterIntake = Math.max(0, waterIntake + amount);
  localStorage.setItem("waterIntake", waterIntake);
  updateWaterDisplay();
}

function resetWater() {
  waterIntake = 0;
  localStorage.setItem("waterIntake", waterIntake);
  updateWaterDisplay();
}

// ==================== INITIALIZATION ====================

document.addEventListener("DOMContentLoaded", () => {
  initializeAuthState();
  updateAuthUI();

  if (document.getElementById("featured-videos")) loadFeaturedVideos();
  if (document.getElementById("profile-name")) loadProfilePage();
  if (document.querySelector(".water-tracker")) initializeWaterIntake();
});
