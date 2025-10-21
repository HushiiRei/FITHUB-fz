const API_BASE_URL = "http://localhost:5000/api"
let allWorkouts = []
let allExercises = []
let currentWorkout = null

// Declare variables before using them
function isLoggedIn() {
  // Implementation of isLoggedIn
  return true // Placeholder implementation
}

function getCurrentUserId() {
  // Implementation of getCurrentUserId
  return 1 // Placeholder implementation
}

function getAuthHeaders() {
  // Implementation of getAuthHeaders
  return { Authorization: "Bearer token" } // Placeholder implementation
}

// Initialize workout planner on page load
document.addEventListener("DOMContentLoaded", () => {
  checkAuthentication()
  loadExercises()
  loadWorkouts()
  setupFormHandlers()
})

// Check if user is authenticated
function checkAuthentication() {
  if (!isLoggedIn()) {
    window.location.href = "index.html"
  }
}

// Load all exercises
async function loadExercises() {
  try {
    const response = await fetch(`${API_BASE_URL}/exercises`)
    if (!response.ok) throw new Error("Failed to load exercises")

    allExercises = await response.json()
    populateExerciseSelect()
  } catch (error) {
    console.error("[v0] Error loading exercises:", error)
  }
}

// Populate exercise select dropdown
function populateExerciseSelect() {
  const select = document.getElementById("exercise-select")
  if (!select) return

  select.innerHTML =
    '<option value="">Select an Exercise</option>' +
    allExercises.map((exercise) => `<option value="${exercise.id}">${exercise.name}</option>`).join("")
}

// Load user's workouts
async function loadWorkouts() {
  try {
    const userId = getCurrentUserId()
    const response = await fetch(`${API_BASE_URL}/workouts`, {
      headers: getAuthHeaders(),
    })

    if (!response.ok) throw new Error("Failed to load workouts")

    allWorkouts = await response.json()
    displayWorkouts()
  } catch (error) {
    console.error("[v0] Error loading workouts:", error)
  }
}

// Display workouts in list
function displayWorkouts() {
  const container = document.getElementById("workouts-container")
  if (!container) return

  if (allWorkouts.length === 0) {
    container.innerHTML =
      '<p style="text-align: center; color: #6b7280; padding: 20px;">No workouts yet. Create one to get started!</p>'
    return
  }

  container.innerHTML = allWorkouts
    .map(
      (workout) => `
        <div class="workout-item" onclick="selectWorkout('${workout.id}')">
            <h3>${workout.name}</h3>
            <p style="font-size: 12px; color: #6b7280; margin-top: 4px;">
                ${workout.duration_minutes} min • ${workout.difficulty_level}
            </p>
        </div>
    `,
    )
    .join("")
}

// Select a workout to view/edit
async function selectWorkout(workoutId) {
  try {
    const response = await fetch(`${API_BASE_URL}/workouts/${workoutId}`, {
      headers: getAuthHeaders(),
    })

    if (!response.ok) throw new Error("Failed to load workout")

    currentWorkout = await response.json()
    displayWorkoutDetails()

    // Update active state
    document.querySelectorAll(".workout-item").forEach((item) => {
      item.classList.remove("active")
    })
    event.target.closest(".workout-item").classList.add("active")
  } catch (error) {
    console.error("[v0] Error selecting workout:", error)
  }
}

// Display workout details
function displayWorkoutDetails() {
  const content = document.getElementById("workout-editor-content")
  if (!content || !currentWorkout) return

  const exercisesHTML = (currentWorkout.exercises || [])
    .map(
      (we) => `
        <div class="exercise-item">
            <div class="exercise-details">
                <div class="exercise-name">${we.exercise.name}</div>
                <div class="exercise-specs">
                    ${we.sets} sets × ${we.reps} reps • ${we.rest_seconds}s rest
                </div>
            </div>
            <button class="btn-remove" onclick="removeExercise('${we.id}')">Remove</button>
        </div>
    `,
    )
    .join("")

  content.innerHTML = `
        <div>
            <h3>${currentWorkout.name}</h3>
            <p style="color: #6b7280; margin-bottom: 16px;">${currentWorkout.description || "No description"}</p>
            
            <div style="margin-bottom: 24px;">
                <strong>Duration:</strong> ${currentWorkout.duration_minutes} minutes<br>
                <strong>Difficulty:</strong> ${currentWorkout.difficulty_level}
            </div>

            <h4 style="margin-bottom: 12px;">Exercises</h4>
            <div style="margin-bottom: 20px;">
                ${exercisesHTML || '<p style="color: #6b7280;">No exercises added yet</p>'}
            </div>

            <button class="btn-primary" onclick="openAddExerciseModal()">Add Exercise</button>
            <button class="btn-secondary" onclick="deleteWorkout('${currentWorkout.id}')" style="margin-left: 10px;">Delete Workout</button>
        </div>
    `
}

// Open create workout modal
function openCreateWorkoutModal() {
  document.getElementById("create-workout-modal").classList.add("show")
}

// Close create workout modal
function closeCreateWorkoutModal() {
  document.getElementById("create-workout-modal").classList.remove("show")
}

// Open add exercise modal
function openAddExerciseModal() {
  if (!currentWorkout) {
    alert("Please select a workout first")
    return
  }
  document.getElementById("add-exercise-modal").classList.add("show")
}

// Close add exercise modal
function closeAddExerciseModal() {
  document.getElementById("add-exercise-modal").classList.remove("show")
}

// Setup form handlers
function setupFormHandlers() {
  // Create workout form
  const createForm = document.getElementById("create-workout-form")
  if (createForm) {
    createForm.addEventListener("submit", handleCreateWorkout)
  }

  // Add exercise form
  const addExerciseForm = document.getElementById("add-exercise-form")
  if (addExerciseForm) {
    addExerciseForm.addEventListener("submit", handleAddExercise)
  }

  // Close modals when clicking outside
  window.addEventListener("click", (event) => {
    const createModal = document.getElementById("create-workout-modal")
    const addModal = document.getElementById("add-exercise-modal")

    if (event.target === createModal) {
      closeCreateWorkoutModal()
    }
    if (event.target === addModal) {
      closeAddExerciseModal()
    }
  })
}

// Handle create workout form submission
async function handleCreateWorkout(e) {
  e.preventDefault()

  const name = document.getElementById("workout-name").value
  const description = document.getElementById("workout-description").value
  const difficulty = document.getElementById("workout-difficulty").value
  const duration = document.getElementById("workout-duration").value

  try {
    const response = await fetch(`${API_BASE_URL}/workouts`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        name,
        description,
        difficulty_level: difficulty,
        duration_minutes: Number.parseInt(duration),
      }),
    })

    if (!response.ok) throw new Error("Failed to create workout")

    const newWorkout = await response.json()
    allWorkouts.push(newWorkout)
    displayWorkouts()

    closeCreateWorkoutModal()
    document.getElementById("create-workout-form").reset()

    // Select the new workout
    setTimeout(() => {
      selectWorkout(newWorkout.id)
    }, 100)
  } catch (error) {
    console.error("[v0] Error creating workout:", error)
    alert("Failed to create workout")
  }
}

// Handle add exercise form submission
async function handleAddExercise(e) {
  e.preventDefault()

  if (!currentWorkout) {
    alert("Please select a workout first")
    return
  }

  const exerciseId = document.getElementById("exercise-select").value
  const sets = document.getElementById("exercise-sets").value
  const reps = document.getElementById("exercise-reps").value
  const rest = document.getElementById("exercise-rest").value

  try {
    const response = await fetch(`${API_BASE_URL}/workouts/${currentWorkout.id}/exercises`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        exercise_id: exerciseId,
        sets: Number.parseInt(sets),
        reps: Number.parseInt(reps),
        rest_seconds: Number.parseInt(rest),
        order_index: (currentWorkout.exercises || []).length,
      }),
    })

    if (!response.ok) throw new Error("Failed to add exercise")

    // Reload workout details
    selectWorkout(currentWorkout.id)
    closeAddExerciseModal()
    document.getElementById("add-exercise-form").reset()
  } catch (error) {
    console.error("[v0] Error adding exercise:", error)
    alert("Failed to add exercise")
  }
}

// Remove exercise from workout
async function removeExercise(exerciseId) {
  if (!confirm("Are you sure you want to remove this exercise?")) {
    return
  }

  try {
    const response = await fetch(`${API_BASE_URL}/workouts/${currentWorkout.id}/exercises/${exerciseId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    })

    if (!response.ok) throw new Error("Failed to remove exercise")

    // Reload workout details
    selectWorkout(currentWorkout.id)
  } catch (error) {
    console.error("[v0] Error removing exercise:", error)
    alert("Failed to remove exercise")
  }
}

// Delete workout
async function deleteWorkout(workoutId) {
  if (!confirm("Are you sure you want to delete this workout?")) {
    return
  }

  try {
    const response = await fetch(`${API_BASE_URL}/workouts/${workoutId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    })

    if (!response.ok) throw new Error("Failed to delete workout")

    allWorkouts = allWorkouts.filter((w) => w.id !== workoutId)
    currentWorkout = null
    displayWorkouts()

    const content = document.getElementById("workout-editor-content")
    if (content) {
      content.innerHTML = "<p>Select a workout to edit or create a new one</p>"
    }
  } catch (error) {
    console.error("[v0] Error deleting workout:", error)
    alert("Failed to delete workout")
  }
}
