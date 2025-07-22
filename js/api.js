// API Configuration and Helper Functions
class API {
  constructor() {
    // Use environment variable or fallback to localhost for development
    this.baseURL =
      window.location.hostname === "localhost"
        ? "http://localhost:3000/api"
        : "https://earnpro-backend.railway.app/api"

    this.token = localStorage.getItem("authToken")
  }

  // Set authentication token
  setToken(token) {
    this.token = token
    localStorage.setItem("authToken", token)
  }

  // Remove authentication token
  removeToken() {
    this.token = null
    localStorage.removeItem("authToken")
  }

  // Get headers with authentication
  getHeaders() {
    const headers = {
      "Content-Type": "application/json",
    }

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`
    }

    return headers
  }

  // Generic API request method with error handling
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const config = {
      headers: this.getHeaders(),
      ...options,
    }

    try {
      const response = await fetch(url, config)

      // Handle different content types
      const contentType = response.headers.get("content-type")
      let data

      if (contentType && contentType.includes("application/json")) {
        data = await response.json()
      } else {
        data = { message: await response.text() }
      }

      if (!response.ok) {
        // Handle specific HTTP status codes
        if (response.status === 401) {
          this.removeToken()
          window.location.reload()
          return
        }

        throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      return data
    } catch (error) {
      console.error("API Error:", error)

      // Handle network errors
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        throw new Error("Network error. Please check your connection.")
      }

      throw error
    }
  }

  // Authentication methods
  async login(email, password) {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
  }

  async register(name, email, password) {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    })
  }

  async logout() {
    return this.request("/auth/logout", {
      method: "POST",
    })
  }

  // User methods
  async getProfile() {
    return this.request("/auth/profile")
  }

  async getUserStats() {
    return this.request("/user/stats")
  }

  // Task methods
  async getTasks() {
    return this.request("/tasks")
  }

  async completeTask(taskId) {
    return this.request(`/tasks/${taskId}/complete`, {
      method: "POST",
    })
  }

  async getTaskHistory(page = 1, limit = 10) {
    return this.request(`/tasks/history?page=${page}&limit=${limit}`)
  }

  // Transaction methods
  async getTransactions(page = 1, limit = 20, type = null) {
    let url = `/transactions?page=${page}&limit=${limit}`
    if (type) {
      url += `&type=${type}`
    }
    return this.request(url)
  }

  async createDeposit(amount, method) {
    return this.request("/transactions/deposit", {
      method: "POST",
      body: JSON.stringify({ amount, method }),
    })
  }

  async createWithdrawal(amount, method, details) {
    return this.request("/transactions/withdraw", {
      method: "POST",
      body: JSON.stringify({ amount, method, details }),
    })
  }

  async getTransaction(transactionId) {
    return this.request(`/transactions/${transactionId}`)
  }

  // Admin methods
  async getAdminStats() {
    return this.request("/admin/stats")
  }

  async getAllUsers(page = 1, limit = 50, search = "") {
    let url = `/admin/users?page=${page}&limit=${limit}`
    if (search) {
      url += `&search=${encodeURIComponent(search)}`
    }
    return this.request(url)
  }

  async updateUserBalance(userId, balance) {
    return this.request(`/admin/users/${userId}/balance`, {
      method: "PUT",
      body: JSON.stringify({ balance }),
    })
  }

  async updateUserPlan(userId, plan) {
    return this.request(`/admin/users/${userId}/plan`, {
      method: "PUT",
      body: JSON.stringify({ plan }),
    })
  }

  async getPendingWithdrawals() {
    return this.request("/admin/withdrawals/pending")
  }

  async approveWithdrawal(withdrawalId) {
    return this.request(`/admin/withdrawals/${withdrawalId}/approve`, {
      method: "POST",
    })
  }

  async rejectWithdrawal(withdrawalId, reason) {
    return this.request(`/admin/withdrawals/${withdrawalId}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    })
  }
}

// Create global API instance
const api = new API()
window.api = api;

// Utility functions
function showMessage(message, type = "success") {
  const messageDiv = document.createElement("div")
  messageDiv.className = `${type}-message`
  messageDiv.textContent = message

  document.body.appendChild(messageDiv)

  setTimeout(() => {
    messageDiv.remove()
  }, 5000)
}

function showError(message) {
  showMessage(message, "error")
}

function showSuccess(message) {
  showMessage(message, "success")
}

// Form validation utilities
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

function validatePassword(password) {
  return password.length >= 8 && /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)
}

function sanitizeInput(input) {
  const div = document.createElement("div")
  div.textContent = input
  return div.innerHTML
}

// Loading state management
function setLoading(element, loading = true) {
  if (loading) {
    element.classList.add("loading")
    element.disabled = true
  } else {
    element.classList.remove("loading")
    element.disabled = false
  }
}

// Format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// Debounce function for search/filter
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Check if user is authenticated
function isAuthenticated() {
  return !!localStorage.getItem("authToken")
}

// Redirect to login if not authenticated
function requireAuth(showScreen) {
  if (!isAuthenticated()) {
    showScreen("login")
    return false
  }
  return true
}

// Handle API errors globally
window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason)
  if (event.reason.message) {
    showError(event.reason.message)
  }
})
