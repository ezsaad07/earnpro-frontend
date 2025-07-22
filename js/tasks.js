// Tasks Management
class TasksManager {
  constructor() {
    this.tasks = []
    this.filteredTasks = []
    this.currentFilter = "all"
    this.init()
  }

  init() {
    this.setupEventListeners()
  }

  setupEventListeners() {
    const taskFilter = document.getElementById("task-filter")
    if (taskFilter) {
      taskFilter.addEventListener("change", (e) => {
        this.currentFilter = e.target.value
        this.filterTasks()
      })
    }
  }

  async loadTasks() {
    const requireAuth = window.requireAuth // Assuming requireAuth is a global function
    if (!requireAuth()) return

    const api = window.api // Assuming api is a global object
    try {
      const response = await api.getTasks()
      this.tasks = response.tasks
      this.filteredTasks = [...this.tasks]
      this.renderTasks()
    } catch (error) {
      console.error("Failed to load tasks:", error)
      const showError = window.showError // Assuming showError is a global function
      showError("Failed to load tasks")
    }
  }

  filterTasks() {
    switch (this.currentFilter) {
      case "pending":
        this.filteredTasks = this.tasks.filter((task) => task.status === "pending")
        break
      case "completed":
        this.filteredTasks = this.tasks.filter((task) => task.status === "completed")
        break
      default:
        this.filteredTasks = [...this.tasks]
    }
    this.renderTasks()
  }

  renderTasks() {
    const container = document.getElementById("tasks-list")
    if (!container) return

    if (this.filteredTasks.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-tasks"></i>
          <h3>No tasks available</h3>
          <p>Check back later for new tasks</p>
        </div>
      `
      return
    }

    container.innerHTML = this.filteredTasks.map((task) => this.createTaskCard(task)).join("")
  }

  createTaskCard(task) {
    const sanitizeInput = window.sanitizeInput // Assuming sanitizeInput is a global function
    const isCompleted = task.status === "completed"
    const canComplete = task.status === "pending" && !task.user_completed

    return `
      <div class="task-card fade-in">
        <div class="task-header">
          <div class="task-info">
            <h4>${sanitizeInput(task.title)}</h4>
            <p>${sanitizeInput(task.description)}</p>
          </div>
          <div class="task-reward">$${task.reward}</div>
        </div>
        <div class="task-meta">
          <span class="task-category">${task.category}</span>
          <span class="task-difficulty">${task.difficulty}</span>
        </div>
        <div class="task-actions">
          <button 
            class="task-btn ${isCompleted ? "completed" : canComplete ? "complete" : "disabled"}" 
            onclick="completeTask(${task.id})"
            ${!canComplete ? "disabled" : ""}
          >
            ${isCompleted ? "Completed" : canComplete ? "Complete Task" : "Not Available"}
          </button>
        </div>
      </div>
    `
  }

  async completeTask(taskId) {
    const requireAuth = window.requireAuth // Assuming requireAuth is a global function
    const api = window.api // Assuming api is a global object
    const task = this.tasks.find((t) => t.id === taskId)
    if (!task || task.status !== "pending") return

    try {
      const response = await api.completeTask(taskId)

      // Update task status
      task.status = "completed"
      task.user_completed = true

      // Update user balance
      const authManager = window.authManager // Assuming authManager is a global object
      if (authManager.currentUser) {
        authManager.currentUser.balance += task.reward
        authManager.updateUserInterface()
      }

      // Refresh tasks display
      this.filterTasks()

      // Show success message
      const showSuccess = window.showSuccess // Assuming showSuccess is a global function
      showSuccess(`Task completed! You earned $${task.reward}`)

      // Refresh dashboard
      const dashboardManager = window.dashboardManager // Assuming dashboardManager is a global object
      dashboardManager.refreshDashboard()
    } catch (error) {
      console.error("Failed to complete task:", error)
      const showError = window.showError // Assuming showError is a global function
      showError("Failed to complete task")
    }
  }
}

// Initialize tasks manager
const tasksManager = new TasksManager()

// Global tasks functions
function showTasks() {
  const setActiveNavItem = window.setActiveNavItem // Assuming setActiveNavItem is a global function
  setActiveNavItem("tasks")
  const showContent = window.showContent // Assuming showContent is a global function
  showContent("tasks")
  const updatePageTitle = window.updatePageTitle // Assuming updatePageTitle is a global function
  updatePageTitle("Tasks")
  tasksManager.loadTasks()
}

function completeTask(taskId) {
  tasksManager.completeTask(taskId)
}
