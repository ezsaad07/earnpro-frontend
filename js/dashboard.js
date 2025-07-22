// Dashboard Management
class DashboardManager {
  constructor() {
    this.stats = null
    this.init()
  }

  init() {
    this.loadDashboardData()
  }

  async loadDashboardData() {
    if (!window.requireAuth()) return

    try {
      const [profile, stats] = await Promise.all([window.api.getProfile(), window.api.getUserStats()])

      this.updateDashboard(profile.user, stats)
    } catch (error) {
      console.error("Failed to load dashboard data:", error)
      window.showError("Failed to load dashboard data")
    }
  }

  updateDashboard(user, stats) {
    // Update balance
    const balanceEl = document.getElementById("user-balance")
    if (balanceEl) {
      balanceEl.textContent = user.balance.toFixed(2)
    }

    // Update plan
    const planEl = document.getElementById("user-plan")
    if (planEl) {
      planEl.textContent = `${user.plan} Plan`
    }

    // Update stats
    const totalEarnedEl = document.getElementById("total-earned")
    const tasksCompletedEl = document.getElementById("tasks-completed")

    if (totalEarnedEl) {
      totalEarnedEl.textContent = window.formatCurrency(stats.totalEarned || 0)
    }

    if (tasksCompletedEl) {
      tasksCompletedEl.textContent = stats.tasksCompleted || 0
    }

    // Update notification count
    this.updateNotificationCount(stats.notifications || 0)
  }

  updateNotificationCount(count) {
    const badge = document.getElementById("notification-count")
    if (badge) {
      badge.textContent = count
      if (count > 0) {
        badge.classList.add("show")
      } else {
        badge.classList.remove("show")
      }
    }
  }

  async refreshDashboard() {
    await this.loadDashboardData()
  }
}

// Initialize dashboard manager
const dashboardManager = new DashboardManager()

// Global dashboard functions
function showDashboard() {
  window.setActiveNavItem("dashboard")
  window.showContent("dashboard")
  window.updatePageTitle("Dashboard")
  dashboardManager.refreshDashboard()
}

function showNotifications() {
  const content = `
    <div class="modal-header">
      <h3>Notifications</h3>
      <button class="modal-close" onclick="window.hideModal()">×</button>
    </div>
    <div class="modal-body">
      <div class="notifications-list">
        <div class="notification-item">
          <div class="notification-icon">
            <i class="fas fa-check-circle"></i>
          </div>
          <div class="notification-content">
            <h4>Task Completed</h4>
            <p>You earned $50 for completing the daily survey</p>
            <small>2 hours ago</small>
          </div>
        </div>
        <div class="notification-item">
          <div class="notification-icon">
            <i class="fas fa-arrow-up"></i>
          </div>
          <div class="notification-content">
            <h4>Withdrawal Processed</h4>
            <p>Your withdrawal of $200 has been approved</p>
            <small>1 day ago</small>
          </div>
        </div>
        <div class="notification-item">
          <div class="notification-icon">
            <i class="fas fa-crown"></i>
          </div>
          <div class="notification-content">
            <h4>Plan Upgrade Available</h4>
            <p>Upgrade to Silver plan for better rewards</p>
            <small>3 days ago</small>
          </div>
        </div>
      </div>
    </div>
  `
  window.showModal(content)
}

// Declare global variables
window.requireAuth = () => {
  // Implementation of requireAuth
  return true
}

window.api = {
  getProfile: () => {
    // Implementation of getProfile
    return Promise.resolve({ user: { balance: 100.5, plan: "Gold" } })
  },
  getUserStats: () => {
    // Implementation of getUserStats
    return Promise.resolve({ totalEarned: 500, tasksCompleted: 10, notifications: 3 })
  },
}

window.showError = (message) => {
  // Implementation of showError
  console.log(message)
}

window.formatCurrency = (amount) => {
  // Implementation of formatCurrency
  return `$${amount.toFixed(2)}`
}

window.setActiveNavItem = (item) => {
  // Implementation of setActiveNavItem
  console.log(`Active nav item set to: ${item}`)
}

window.showContent = (content) => {
  // Implementation of showContent
  console.log(`Content shown: ${content}`)
}

window.updatePageTitle = (title) => {
  // Implementation of updatePageTitle
  document.title = title
}

window.showModal = (content) => {
  // Implementation of showModal
  console.log("Modal shown with content:", content)
}

window.hideModal = () => {
  // Implementation of hideModal
  console.log("Modal hidden")
}
