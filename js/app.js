// Main Application Controller
class App {
  constructor() {
    this.currentScreen = "login"
    this.currentNavItem = "dashboard"
    this.init()
  }

  init() {
    // Initialize app after DOM is loaded
    document.addEventListener("DOMContentLoaded", () => {
      this.setupEventListeners()
      this.initializeApp()
    })
  }

  setupEventListeners() {
    // Modal overlay click to close
    const modalOverlay = document.getElementById("modal-overlay")
    if (modalOverlay) {
      modalOverlay.addEventListener("click", (e) => {
        if (e.target === modalOverlay) {
          hideModal()
        }
      })
    }

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      // Escape key to close modal
      if (e.key === "Escape") {
        hideModal()
      }
    })

    // Handle browser back/forward buttons
    window.addEventListener("popstate", (e) => {
      if (e.state && e.state.screen) {
        showScreen(e.state.screen)
      }
    })
  }

  async initializeApp() {
    // Show loading screen
    const loadingScreen = document.getElementById("loading-screen")
    if (loadingScreen) {
      setTimeout(() => {
        loadingScreen.classList.add("hidden")
        this.checkAuthAndShowScreen()
      }, 2000)
    } else {
      this.checkAuthAndShowScreen()
    }
  }

  checkAuthAndShowScreen() {
    const token = localStorage.getItem("authToken")
    const authManager = window.authManager // Declare authManager
    const showDashboard = window.showDashboard // Declare showDashboard
    const showSuccess = window.showSuccess // Declare showSuccess
    const showError = window.showError // Declare showError

    if (token) {
      // User is logged in, load profile and show main app
      authManager
        .loadUserProfile()
        .then(() => {
          if (authManager.currentUser && authManager.currentUser.role === "admin") {
            showScreen("admin")
            authManager.loadAdminData()
          } else {
            showScreen("main")
            showDashboard()
          }
        })
        .catch(() => {
          // Token is invalid, show login
          showScreen("login")
        })
    } else {
      // No token, show login
      showScreen("login")
    }
  }
}

// Screen Management Functions
function showScreen(screenName) {
  // Hide all screens
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.classList.remove("active")
  })

  // Show target screen
  const targetScreen = document.getElementById(screenName + "-screen") || document.getElementById(screenName + "-app")

  if (targetScreen) {
    targetScreen.classList.add("active")
    app.currentScreen = screenName

    // Update browser history
    history.pushState({ screen: screenName }, "", `#${screenName}`)
  }
}

// Navigation Functions
function setActiveNavItem(itemName) {
  // Remove active class from all nav items
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.remove("active")
  })

  // Add active class to current item
  const navItems = document.querySelectorAll(".nav-item")
  const itemIndex = ["dashboard", "tasks", "wallet", "profile"].indexOf(itemName)

  if (navItems[itemIndex]) {
    navItems[itemIndex].classList.add("active")
  }

  app.currentNavItem = itemName
}

function showContent(contentName) {
  // Hide all content sections
  document.querySelectorAll(".content-section").forEach((section) => {
    section.classList.remove("active")
  })

  // Show target content
  const targetContent = document.getElementById(contentName + "-content")
  if (targetContent) {
    targetContent.classList.add("active")
  }
}

function updatePageTitle(title) {
  const titleElement = document.getElementById("page-title")
  if (titleElement) {
    titleElement.textContent = title
  }

  // Update document title
  document.title = `${title} - EarnPro`
}

// Modal Functions
function showModal(content) {
  const modalOverlay = document.getElementById("modal-overlay")
  const modalContent = document.getElementById("modal-content")

  if (modalContent && modalOverlay) {
    modalContent.innerHTML = content
    modalOverlay.classList.add("active")

    // Focus management for accessibility
    const firstInput = modalContent.querySelector("input, select, textarea, button")
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100)
    }
  }
}

function hideModal() {
  const modalOverlay = document.getElementById("modal-overlay")
  if (modalOverlay) {
    modalOverlay.classList.remove("active")
  }
}

// Initialize the application
const app = new App()

// Service Worker Registration (for PWA capabilities)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("SW registered: ", registration)
      })
      .catch((registrationError) => {
        console.log("SW registration failed: ", registrationError)
      })
  })
}

// Handle online/offline status
window.addEventListener("online", () => {
  window.showSuccess("Connection restored") // Use window.showSuccess
})

window.addEventListener("offline", () => {
  window.showError("Connection lost. Some features may not work.") // Use window.showError
})

// Performance monitoring
window.addEventListener("load", () => {
  // Log performance metrics
  if (window.performance) {
    const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart
    console.log(`Page load time: ${loadTime}ms`)
  }
})

// Declare global functions
window.authManager = {
  loadUserProfile: () => Promise.resolve(),
  loadAdminData: () => {},
  currentUser: { role: "user" },
}

window.showDashboard = () => {}
window.showSuccess = (message) => console.log(message)
window.showError = (message) => console.error(message)
