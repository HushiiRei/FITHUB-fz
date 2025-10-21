const API_BASE_URL = "http://localhost:5050/api"
let allVideos = []
let currentVideo = null

// Function to open login modal
function openLoginModal() {
  // Placeholder for login modal logic
  alert("Please log in to favorite videos.")
}

// Initialize video library on page load
document.addEventListener("DOMContentLoaded", () => {
  loadVideos()
})

// Load all videos from backend
async function loadVideos() {
  try {
    const response = await fetch(`${API_BASE_URL}/videos`)
    if (!response.ok) throw new Error("Failed to load videos")

    allVideos = await response.json()
    displayVideos(allVideos)
  } catch (error) {
    console.error("[v0] Error loading videos:", error)
    displayErrorMessage("Failed to load videos. Please try again later.")
  }
}

// Display videos in grid
function displayVideos(videos) {
  const grid = document.getElementById("videos-grid")

  if (videos.length === 0) {
    grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px;">No videos found</p>'
    return
  }

  grid.innerHTML = videos
    .map(
      (video) => `
        <div class="video-card" onclick="openVideoModal('${video.id}')">
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
                <p style="font-size: 12px; color: #6b7280;">${video.instructor_name}</p>
            </div>
        </div>
    `,
    )
    .join("")
}

// Apply filters to videos
function applyFilters() {
  const category = document.getElementById("category-filter").value
  const difficulty = document.getElementById("difficulty-filter").value
  const searchTerm = document.getElementById("search-input").value.toLowerCase()

  const filtered = allVideos.filter((video) => {
    const matchCategory = !category || video.category === category
    const matchDifficulty = !difficulty || video.difficulty_level === difficulty
    const matchSearch =
      !searchTerm ||
      video.title.toLowerCase().includes(searchTerm) ||
      video.description.toLowerCase().includes(searchTerm) ||
      video.instructor_name.toLowerCase().includes(searchTerm)

    return matchCategory && matchDifficulty && matchSearch
  })

  displayVideos(filtered)
}

// Open video modal
function openVideoModal(videoId) {
  const video = allVideos.find((v) => v.id === videoId)
  if (!video) return

  currentVideo = video
  document.getElementById("video-title").textContent = video.title
  document.getElementById("video-description").textContent = video.description
  document.getElementById("video-instructor").textContent = `Instructor: ${video.instructor_name}`
  document.getElementById("video-duration").textContent = `Duration: ${video.duration_minutes} min`
  document.getElementById("video-difficulty").textContent = `Level: ${video.difficulty_level}`

  // Set video iframe (using placeholder for demo)
  document.getElementById("video-iframe").src = `https://www.youtube.com/embed/dQw4w9WgXcQ`

  // Update favorite button
  updateFavoriteButton()

  const modal = document.getElementById("video-modal")
  modal.classList.add("show")
}

// Close video modal
function closeVideoModal() {
  const modal = document.getElementById("video-modal")
  modal.classList.remove("show")
  document.getElementById("video-iframe").src = ""
  currentVideo = null
}

// Toggle favorite status
async function toggleFavorite() {
  if (!currentVideo) return

  const userId = localStorage.getItem("userId")
  if (!userId) {
    openLoginModal()
    return
  }

  try {
    const isFavorited = await checkIfFavorited(currentVideo.id)

    if (isFavorited) {
      // Remove from favorites
      const response = await fetch(`${API_BASE_URL}/favorites/${currentVideo.id}`, {
        method: "DELETE",
        headers: {
          "X-User-ID": userId,
        },
      })

      if (response.ok) {
        updateFavoriteButton()
      }
    } else {
      // Add to favorites
      const response = await fetch(`${API_BASE_URL}/favorites`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": userId,
        },
        body: JSON.stringify({ video_id: currentVideo.id }),
      })

      if (response.ok) {
        updateFavoriteButton()
      }
    }
  } catch (error) {
    console.error("[v0] Error toggling favorite:", error)
  }
}

// Check if video is favorited
async function checkIfFavorited(videoId) {
  const userId = localStorage.getItem("userId")
  if (!userId) return false

  try {
    const response = await fetch(`${API_BASE_URL}/favorites`, {
      headers: {
        "X-User-ID": userId,
      },
    })

    if (response.ok) {
      const favorites = await response.json()
      return favorites.some((fav) => fav.video_id === videoId)
    }
  } catch (error) {
    console.error("[v0] Error checking favorite:", error)
  }

  return false
}

// Update favorite button text
async function updateFavoriteButton() {
  const btn = document.getElementById("favorite-btn")
  const isFavorited = await checkIfFavorited(currentVideo.id)

  if (isFavorited) {
    btn.textContent = "Remove from Favorites"
    btn.style.backgroundColor = "#fecaca"
    btn.style.color = "#991b1b"
  } else {
    btn.textContent = "Add to Favorites"
    btn.style.backgroundColor = "#7c3aed"
    btn.style.color = "#ffffff"
  }
}

// Filter by category from home page
function filterByCategory(category) {
  window.location.href = `videos.html?category=${category}`
}

// Display error message
function displayErrorMessage(message) {
  const grid = document.getElementById("videos-grid")
  grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: #991b1b;">${message}</p>`
}

// Load category from URL params on page load
window.addEventListener("load", () => {
  const params = new URLSearchParams(window.location.search)
  const category = params.get("category")

  if (category) {
    document.getElementById("category-filter").value = category
    applyFilters()
  }
})
