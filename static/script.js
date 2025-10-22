const API_BASE_URL = "http://localhost:5050/api"

// ==================== AUTHENTICATION STATE ====================

const authState = {
  isLoggedIn: false,
  userId: null,
  accessToken: null,
}

// Initialize auth state from localStorage
function initializeAuthState() {
  const token = localStorage.getItem("accessToken")
  const userId = localStorage.getItem("userId")

  if (token && userId) {
    authState.isLoggedIn = true
    authState.accessToken = token
    authState.userId = userId
  }
}

// ==================== MODAL MANAGEMENT ====================

function openLoginModal() {
  document.getElementById("login-modal").classList.add("show")
}

function closeLoginModal() {
  document.getElementById("login-modal").classList.remove("show")
}

function openSignupModal() {
  document.getElementById("signup-modal").classList.add("show")
}

function closeSignupModal() {
  document.getElementById("signup-modal").classList.remove("show")
}

function switchToSignup() {
  closeLoginModal()
  openSignupModal()
}

function switchToLogin() {
  closeSignupModal()
  openLoginModal()
}

// Close modal when clicking outside
window.addEventListener("click", (event) => {
  const loginModal = document.getElementById("login-modal")
  const signupModal = document.getElementById("signup-modal")

  if (event.target === loginModal) {
    closeLoginModal()
  }
  if (event.target === signupModal) {
    closeSignupModal()
  }
})

// ==================== AUTHENTICATION HELPERS ====================

function isLoggedIn() {
  return authState.isLoggedIn
}

function getCurrentUserId() {
  return authState.userId
}

function getAuthHeaders() {
  const headers = {
    "Content-Type": "application/json",
  }

  if (authState.userId) {
    headers["X-User-ID"] = authState.userId
  }

  return headers
}

// ==================== AUTHENTICATION HANDLERS ====================

// Handle login form submission
const loginForm = document.getElementById("login-form")
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    const email = loginForm.querySelector('input[type="email"]').value
    const password = loginForm.querySelector('input[type="password"]').value

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        // Store auth token and user ID
        localStorage.setItem("accessToken", data.access_token)
        localStorage.setItem("userId", data.user_id)

        // Update auth state
        authState.isLoggedIn = true
        authState.accessToken = data.access_token
        authState.userId = data.user_id

        closeLoginModal()
        loginForm.reset()
        updateAuthUI()

        // Redirect to profile
        window.location.href = "profile.html"
      } else {
        alert("Login failed: " + data.error)
      }
    } catch (error) {
      console.error("[v0] Login error:", error)
      alert("An error occurred during login")
    }
  })
}

// Handle signup form submission
const signupForm = document.getElementById("signup-form")
if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    const fullName = signupForm.querySelector('input[placeholder="Full Name"]').value
    const username = signupForm.querySelector('input[placeholder="Username"]').value
    const email = signupForm.querySelector('input[type="email"]').value
    const password = signupForm.querySelector('input[type="password"]').value

    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          username,
          full_name: fullName,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        alert("Account created successfully! Please log in.")
        closeSignupModal()
        signupForm.reset()
        openLoginModal()
      } else {
        alert("Signup failed: " + data.error)
      }
    } catch (error) {
      console.error("[v0] Signup error:", error)
      alert("An error occurred during signup")
    }
  })
}

// Logout function
function logout() {
  localStorage.removeItem("accessToken")
  localStorage.removeItem("userId")

  authState.isLoggedIn = false
  authState.accessToken = null
  authState.userId = null

  window.location.href = "index.html"
}

// ==================== UI UPDATES ====================

// Update UI based on authentication status
function updateAuthUI() {
  const navAuth = document.querySelector(".nav-auth")
  if (!navAuth) return

  if (isLoggedIn()) {
    navAuth.innerHTML = '<button class="btn-logout" onclick="logout()">Logout</button>'
  } else {
    navAuth.innerHTML = `
            <button class="btn-login" onclick="openLoginModal()">Login</button>
            <button class="btn-signup" onclick="openSignupModal()">Sign Up</button>
        `
  }
}

// ==================== HOME PAGE FEATURES ====================

// Load featured videos on home page
async function loadFeaturedVideos() {
  try {
    const response = await fetch(`${API_BASE_URL}/videos?limit=6`)
    if (!response.ok) throw new Error("Failed to load featured videos")

    const videos = await response.json()
    displayFeaturedVideos(videos.slice(0, 6))
  } catch (error) {
    console.error("[v0] Error loading featured videos:", error)
  }
}

// Display featured videos
function displayFeaturedVideos(videos) {
  const grid = document.getElementById("featured-videos")
  if (!grid) return

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
    `,
    )
    .join("")
}

// Filter by category from home page
function filterByCategory(category) {
  window.location.href = `videos.html?category=${encodeURIComponent(category)}`
}

// ==================== WATER INTAKE TRACKER ====================

// Water intake state
let waterIntake = 0
const waterGoal = 8

// Initialize water intake from localStorage
function initializeWaterIntake() {
  const stored = localStorage.getItem("waterIntake")
  if (stored) {
    waterIntake = parseInt(stored)
  }
  updateWaterDisplay()
}

// Update water display
function updateWaterDisplay() {
  const amountEl = document.getElementById("water-amount")
  const progressEl = document.getElementById("water-progress")
  const percentageEl = document.getElementById("water-percentage")

  if (amountEl) {
    amountEl.textContent = waterIntake
  }

  if (progressEl && percentageEl) {
    const percentage = Math.min((waterIntake / waterGoal) * 100, 100)
    progressEl.style.width = `${percentage}%`
    percentageEl.textContent = `${Math.round(percentage)}%`
  }
}

// Add water intake
function addWater(amount) {
  waterIntake = Math.max(0, waterIntake + amount)
  localStorage.setItem("waterIntake", waterIntake)
  updateWaterDisplay()
}

// Reset water intake
function resetWater() {
  waterIntake = 0
  localStorage.setItem("waterIntake", waterIntake)
  updateWaterDisplay()
}

// ==================== INITIALIZATION ====================

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  initializeAuthState()
  updateAuthUI()

  // Load featured videos if on home page
  if (document.getElementById("featured-videos")) {
    loadFeaturedVideos()
  }

  // Initialize water tracker if on dashboard
  if (document.querySelector(".water-tracker")) {
    initializeWaterIntake()
  }
})
