const API_BASE_URL = "http://localhost:5000/api"
let currentUserProfile = null

// Declare necessary variables and functions
function isLoggedIn() {
  // Implementation for isLoggedIn
  return true // Placeholder implementation
}

function getCurrentUserId() {
  // Implementation for getCurrentUserId
  return 1 // Placeholder implementation
}

function getAuthHeaders() {
  // Implementation for getAuthHeaders
  return { Authorization: "Bearer token" } // Placeholder implementation
}

// Initialize profile page on load
document.addEventListener("DOMContentLoaded", () => {
  checkAuthentication()
  loadUserProfile()
  loadFavorites()
  setupFormHandlers()
})

// Check if user is authenticated
function checkAuthentication() {
  if (!isLoggedIn()) {
    window.location.href = "index.html"
  }
}

// Load user profile
async function loadUserProfile() {
  try {
    const userId = getCurrentUserId()
    const response = await fetch(`${API_BASE_URL}/profiles/${userId}`)

    if (!response.ok) throw new Error("Failed to load profile")

    currentUserProfile = await response.json()
    displayProfile()
  } catch (error) {
    console.error("[v0] Error loading profile:", error)
  }
}

// Display user profile
function displayProfile() {
  if (!currentUserProfile) return

  document.getElementById("profile-name").textContent = currentUserProfile.full_name || "User"
  document.getElementById("profile-username").textContent = `@${currentUserProfile.username}`
  document.getElementById("profile-bio").textContent = currentUserProfile.bio || "No bio yet"

  if (currentUserProfile.avatar_url) {
    document.getElementById("profile-avatar").src = currentUserProfile.avatar_url
  }
}

// Load favorite videos
async function loadFavorites() {
  try {
    const response = await fetch(`${API_BASE_URL}/favorites`, {
      headers: getAuthHeaders(),
    })

    if (!response.ok) throw new Error("Failed to load favorites")

    const favorites = await response.json()
    displayFavorites(favorites)
  } catch (error) {
    console.error("[v0] Error loading favorites:", error)
  }
}

// Display favorite videos
function displayFavorites(favorites) {
  const grid = document.getElementById("favorites-grid")

  if (favorites.length === 0) {
    grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px;">No favorite videos yet</p>'
    return
  }

  grid.innerHTML = favorites
    .map(
      (fav) => `
        <div class="video-card" onclick="openVideoModal('${fav.videos.id}')">
            <div class="video-thumbnail">
                <img src="${fav.videos.thumbnail_url || "https://via.placeholder.com/280x160?text=" + encodeURIComponent(fav.videos.title)}" 
                     alt="${fav.videos.title}" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
            <div class="video-info">
                <h3>${fav.videos.title}</h3>
                <div class="video-meta">
                    <span>${fav.videos.duration_minutes} min</span>
                    <span class="difficulty-badge difficulty-${fav.videos.difficulty_level}">
                        ${fav.videos.difficulty_level}
                    </span>
                </div>
                <p style="font-size: 12px; color: #6b7280;">${fav.videos.instructor_name}</p>
            </div>
        </div>
    `,
    )
    .join("")
}

// Open edit profile modal
function openEditProfileModal() {
  if (!currentUserProfile) return

  document.getElementById("edit-full-name").value = currentUserProfile.full_name || ""
  document.getElementById("edit-bio").value = currentUserProfile.bio || ""
  document.getElementById("edit-avatar").value = currentUserProfile.avatar_url || ""

  document.getElementById("edit-profile-modal").classList.add("show")
}

// Close edit profile modal
function closeEditProfileModal() {
  document.getElementById("edit-profile-modal").classList.remove("show")
}

// Setup form handlers
function setupFormHandlers() {
  const editForm = document.getElementById("edit-profile-form")
  if (editForm) {
    editForm.addEventListener("submit", handleEditProfile)
  }

  // Close modal when clicking outside
  window.addEventListener("click", (event) => {
    const modal = document.getElementById("edit-profile-modal")
    if (event.target === modal) {
      closeEditProfileModal()
    }
  })
}

// Handle edit profile form submission
async function handleEditProfile(e) {
  e.preventDefault()

  const fullName = document.getElementById("edit-full-name").value
  const bio = document.getElementById("edit-bio").value
  const avatarUrl = document.getElementById("edit-avatar").value

  try {
    const userId = getCurrentUserId()
    const response = await fetch(`${API_BASE_URL}/profiles/${userId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        full_name: fullName,
        bio,
        avatar_url: avatarUrl,
      }),
    })

    if (!response.ok) throw new Error("Failed to update profile")

    currentUserProfile = await response.json()
    displayProfile()
    closeEditProfileModal()
  } catch (error) {
    console.error("[v0] Error updating profile:", error)
    alert("Failed to update profile")
  }
}

// Open video modal (from videos.js)
function openVideoModal(videoId) {
  // This would be implemented in videos.js
  alert("Video modal would open here")
}
