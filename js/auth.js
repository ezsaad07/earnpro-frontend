// Authentication Management
class AuthManager {
  constructor() {
    this.currentUser = null
    this.init()
  }

  init() {
    // Check if user is already logged in
    const token = localStorage.getItem("authToken")
    if (token) {
      this.loadUserProfile()
    }

    // Setup form event listeners
    this.setupEventListeners()
    this.setupPasswordToggles()
  }

  setupEventListeners() {
    // Login form
    const loginForm = document.getElementById("login-form")
    if (loginForm) {
      loginForm.addEventListener("submit", (e) => this.handleLogin(e))
    }

    // Signup form
    const signupForm = document.getElementById("signup-form")
    if (signupForm) {
      signupForm.addEventListener("submit", (e) => this.handleSignup(e))
    }

    // Password strength indicator
    const signupPassword = document.getElementById("signup-password")
    if (signupPassword) {
      signupPassword.addEventListener("input", (e) => this.checkPasswordStrength(e.target.value))
    }
  }

  setupPasswordToggles() {
    // Add password toggle functionality
    const passwordInputs = document.querySelectorAll('input[type="password"]')
    passwordInputs.forEach((input) => {
      const container = input.parentElement
      if (!container.classList.contains("password-input-container")) {
        container.classList.add("password-input-container")

        const toggleBtn = document.createElement("button")
        toggleBtn.type = "button"
        toggleBtn.className = "password-toggle"
        toggleBtn.innerHTML = '<i class="fas fa-eye"></i>'
        toggleBtn.setAttribute("aria-label", "Toggle password visibility")

        toggleBtn.addEventListener("click", () => {
          const isPassword = input.type === "password"
          input.type = isPassword ? "text" : "password"
          toggleBtn.innerHTML = isPassword ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>'
        })

        container.appendChild(toggleBtn)
      }
    })
  }

  async handleLogin(event) {
    event.preventDefault()

    const form = event.target
    const formData = new FormData(form)
    const email = formData.get("email")
    const password = formData.get("password")

    // Validate inputs
    if (!this.validateLoginForm(email, password)) {
      return
    }

    const submitBtn = form.querySelector('button[type="submit"]')
    window.setLoading(submitBtn, true)

    try {
      // Simulate API call with enhanced response
      const response = await this.simulateLogin(email, password)

      // Store token and user data
      window.api.setToken(response.token)
      this.currentUser = response.user

      // Check if user is admin
      if (response.user.role === "admin") {
        window.showScreen("admin")
        await this.loadAdminData()
      } else {
        window.showScreen("main")
        window.showDashboard()
      }

      window.showSuccess(`Welcome back, ${response.user.name}!`)
    } catch (error) {
      window.showError(error.message || "Login failed")
    } finally {
      window.setLoading(submitBtn, false)
    }
  }

  async handleSignup(event) {
    event.preventDefault()

    const form = event.target
    const formData = new FormData(form)
    const name = formData.get("name")
    const email = formData.get("email")
    const password = formData.get("password")

    // Validate inputs
    if (!this.validateSignupForm(name, email, password)) {
      return
    }

    const submitBtn = form.querySelector('button[type="submit"]')
    window.setLoading(submitBtn, true)

    try {
      // Simulate API call with default settings
      const response = await this.simulateSignup(name, email, password)

      // Store token and user data
      window.api.setToken(response.token)
      this.currentUser = response.user

      // Immediate login after successful signup
      window.showScreen("main")
      window.showDashboard()
      window.showSuccess(
        `Welcome to EarnPro, ${response.user.name}! Your account has been created with a $5.00 welcome bonus.`,
      )
    } catch (error) {
      window.showError(error.message || "Registration failed")
    } finally {
      window.setLoading(submitBtn, false)
    }
  }

  // Simulate login API call
  async simulateLogin(email, password) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Admin account credentials
        if (email === "admin@earnpro.com" && password === "EarnPro2024!") {
          resolve({
            token: "admin_token_" + Date.now(),
            user: {
              id: "admin-001",
              name: "Admin User",
              email: "admin@earnpro.com",
              role: "admin",
              plan: "Diamond",
              balance: 999999.99,
              totalEarned: 0,
              tasksCompleted: 0,
              isActive: true,
            },
          })
        }
        // Regular user login simulation
        else if (email && password) {
          resolve({
            token: "user_token_" + Date.now(),
            user: {
              id: "user_" + Date.now(),
              name: "Demo User",
              email: email,
              role: "user",
              plan: "Basic",
              balance: 5.0,
              totalEarned: 5.0,
              tasksCompleted: 0,
              isActive: true,
            },
          })
        } else {
          reject(new Error("Invalid credentials"))
        }
      }, 1500)
    })
  }

  // Simulate signup API call with default settings
  async simulateSignup(name, email, password) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (name && email && password) {
          resolve({
            token: "new_user_token_" + Date.now(),
            user: {
              id: "user_" + Date.now(),
              name: name,
              email: email,
              role: "user",
              plan: "Basic",
              balance: 5.0, // Default $5.00 welcome bonus
              totalEarned: 5.0,
              tasksCompleted: 0, // Default zero tasks
              isActive: true,
              isNewUser: true,
            },
          })
        } else {
          reject(new Error("Registration failed"))
        }
      }, 1500)
    })
  }

  validateLoginForm(email, password) {
    let isValid = true

    // Clear previous errors
    this.clearFormErrors("login-form")

    // Validate email
    if (!email) {
      this.showFieldError("login-email", "Email is required")
      isValid = false
    } else if (!window.validateEmail(email)) {
      this.showFieldError("login-email", "Please enter a valid email")
      isValid = false
    }

    // Validate password
    if (!password) {
      this.showFieldError("login-password", "Password is required")
      isValid = false
    }

    return isValid
  }

  validateSignupForm(name, email, password) {
    let isValid = true

    // Clear previous errors
    this.clearFormErrors("signup-form")

    // Validate name
    if (!name || name.trim().length < 2) {
      this.showFieldError("signup-name", "Name must be at least 2 characters")
      isValid = false
    }

    // Validate email
    if (!email) {
      this.showFieldError("signup-email", "Email is required")
      isValid = false
    } else if (!window.validateEmail(email)) {
      this.showFieldError("signup-email", "Please enter a valid email")
      isValid = false
    }

    // Enhanced password validation
    if (!password) {
      this.showFieldError("signup-password", "Password is required")
      isValid = false
    } else if (password.length < 8) {
      this.showFieldError("signup-password", "Password must be at least 8 characters")
      isValid = false
    } else if (!password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)) {
      this.showFieldError("signup-password", "Password must contain uppercase, lowercase, and numbers")
      isValid = false
    }

    return isValid
  }

  showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId)
    const formGroup = field.closest(".form-group")

    formGroup.classList.add("error")

    // Remove existing error message
    const existingError = formGroup.querySelector(".error-text")
    if (existingError) {
      existingError.remove()
    }

    // Add new error message
    const errorDiv = document.createElement("div")
    errorDiv.className = "error-text"
    errorDiv.textContent = message
    formGroup.appendChild(errorDiv)
  }

  clearFormErrors(formId) {
    const form = document.getElementById(formId)
    const errorGroups = form.querySelectorAll(".form-group.error")
    const errorTexts = form.querySelectorAll(".error-text")

    errorGroups.forEach((group) => group.classList.remove("error"))
    errorTexts.forEach((text) => text.remove())
  }

  checkPasswordStrength(password) {
    const strengthBar = document.querySelector(".password-strength-bar")
    const strengthText = document.querySelector(".password-strength-text")

    if (!strengthBar) return

    let strength = 0
    let strengthLabel = ""

    if (password.length >= 8) strength++
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++
    if (password.match(/\d/)) strength++
    if (password.match(/[^a-zA-Z\d]/)) strength++

    strengthBar.className = "password-strength-bar"

    if (strength >= 4) {
      strengthBar.classList.add("strong")
      strengthLabel = "Strong password"
    } else if (strength >= 3) {
      strengthBar.classList.add("medium")
      strengthLabel = "Medium strength"
    } else if (strength >= 1) {
      strengthBar.classList.add("weak")
      strengthLabel = "Weak password"
    }

    if (strengthText) {
      strengthText.textContent = strengthLabel
      strengthText.className = `password-strength-text ${strengthBar.classList.contains("strong") ? "strong" : strengthBar.classList.contains("medium") ? "medium" : "weak"}`
    }
  }

  async loadUserProfile() {
    try {
      const response = await window.api.getProfile()
      this.currentUser = response.user

      // Update UI with user data
      this.updateUserInterface()
    } catch (error) {
      console.error("Failed to load user profile:", error)
      this.logout()
    }
  }

  updateUserInterface() {
    if (!this.currentUser) return

    // Update balance displays
    const balanceElements = document.querySelectorAll("#user-balance, #wallet-balance")
    balanceElements.forEach((el) => {
      if (el) el.textContent = this.currentUser.balance.toFixed(2)
    })

    // Update plan displays
    const planElements = document.querySelectorAll("#user-plan, #profile-plan-badge")
    planElements.forEach((el) => {
      if (el) el.textContent = `${this.currentUser.plan} Plan`
    })

    // Update profile info
    const nameEl = document.getElementById("profile-name")
    const emailEl = document.getElementById("profile-email")

    if (nameEl) nameEl.textContent = this.currentUser.name
    if (emailEl) emailEl.textContent = this.currentUser.email
  }

  async logout() {
    try {
      await window.api.logout()
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      // Clear local data
      window.api.removeToken()
      this.currentUser = null

      // Reset forms
      const forms = document.querySelectorAll("form")
      forms.forEach((form) => form.reset())

      // Show login screen
      window.showScreen("login")
      window.showSuccess("Logged out successfully")
    }
  }

  async loadAdminData() {
    try {
      const [stats, users, withdrawals] = await Promise.all([
        window.api.getAdminStats(),
        window.api.getAllUsers(),
        window.api.getPendingWithdrawals(),
      ])

      this.updateAdminInterface(stats, users, withdrawals)
    } catch (error) {
      console.error("Failed to load admin data:", error)
      window.showError("Failed to load admin data")
    }
  }

  updateAdminInterface(stats, users, withdrawals) {
    // Update admin stats
    const totalUsersEl = document.getElementById("admin-total-users")
    const pendingWithdrawalsEl = document.getElementById("admin-pending-withdrawals")
    const totalBalanceEl = document.getElementById("admin-total-balance")

    if (totalUsersEl) totalUsersEl.textContent = stats.totalUsers
    if (pendingWithdrawalsEl) pendingWithdrawalsEl.textContent = stats.pendingWithdrawals
    if (totalBalanceEl) totalBalanceEl.textContent = window.formatCurrency(stats.totalBalance)

    // Update users list
    this.renderAdminUsersList(users)

    // Update withdrawals list
    this.renderAdminWithdrawalsList(withdrawals)
  }

  renderAdminUsersList(users) {
    const container = document.getElementById("admin-users-list")
    if (!container) return

    container.innerHTML = users
      .map(
        (user) => `
      <div class="admin-user-card">
        <div class="user-info">
          <h4>${window.sanitizeInput(user.name)}</h4>
          <p>${window.sanitizeInput(user.email)}</p>
          <span class="plan-badge">${user.plan}</span>
        </div>
        <div class="user-actions">
          <button class="btn-secondary" onclick="window.editUserBalance(${user.id}, ${user.balance})">
            Edit Balance: $${user.balance.toFixed(2)}
          </button>
          <button class="btn-secondary" onclick="window.editUserPlan(${user.id}, '${user.plan}')">
            Change Plan
          </button>
        </div>
      </div>
    `,
      )
      .join("")
  }

  renderAdminWithdrawalsList(withdrawals) {
    const container = document.getElementById("admin-withdrawals-list")
    if (!container) return

    container.innerHTML = withdrawals
      .map(
        (withdrawal) => `
      <div class="admin-withdrawal-card">
        <div class="withdrawal-info">
          <h4>$${withdrawal.amount.toFixed(2)}</h4>
          <p>User: ${window.sanitizeInput(withdrawal.user_name)}</p>
          <p>Method: ${withdrawal.method}</p>
          <p>Date: ${window.formatDate(withdrawal.created_at)}</p>
        </div>
        <div class="withdrawal-actions">
          <button class="btn-gold" onclick="window.approveWithdrawal(${withdrawal.id})">
            Approve
          </button>
          <button class="btn-secondary" onclick="window.rejectWithdrawal(${withdrawal.id})">
            Reject
          </button>
        </div>
      </div>
    `,
      )
      .join("")
  }
}

// Initialize auth manager
const authManager = new AuthManager()

// Global auth functions
function showLogin() {
  window.showScreen("login")
}

function showSignup() {
  window.showScreen("signup")
}

function logout() {
  authManager.logout()
}

// Admin functions
async function editUserBalance(userId, currentBalance) {
  const newBalance = prompt(`Enter new balance for user (current: $${currentBalance.toFixed(2)}):`)

  if (newBalance !== null && !isNaN(newBalance)) {
    try {
      await window.api.updateUserBalance(userId, Number.parseFloat(newBalance))
      window.showSuccess("User balance updated successfully")
      authManager.loadAdminData()
    } catch (error) {
      window.showError("Failed to update user balance")
    }
  }
}

async function editUserPlan(userId, currentPlan) {
  const plans = ["Basic", "Silver", "Gold", "Platinum", "Diamond"]
  const newPlan = prompt(`Enter new plan for user (current: ${currentPlan}):\nOptions: ${plans.join(", ")}`)

  if (newPlan && plans.includes(newPlan)) {
    try {
      await window.api.updateUserPlan(userId, newPlan)
      window.showSuccess("User plan updated successfully")
      authManager.loadAdminData()
    } catch (error) {
      window.showError("Failed to update user plan")
    }
  }
}

async function approveWithdrawal(withdrawalId) {
  if (confirm("Are you sure you want to approve this withdrawal?")) {
    try {
      await window.api.approveWithdrawal(withdrawalId)
      window.showSuccess("Withdrawal approved successfully")
      authManager.loadAdminData()
    } catch (error) {
      window.showError("Failed to approve withdrawal")
    }
  }
}

async function rejectWithdrawal(withdrawalId) {
  const reason = prompt("Enter reason for rejection:")

  if (reason) {
    try {
      await window.api.rejectWithdrawal(withdrawalId, reason)
      window.showSuccess("Withdrawal rejected successfully")
      authManager.loadAdminData()
    } catch (error) {
      window.showError("Failed to reject withdrawal")
    }
  }
}
