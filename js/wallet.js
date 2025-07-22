// Wallet Management
class WalletManager {
  constructor(
    api,
    requireAuth,
    showError,
    sanitizeInput,
    formatDate,
    formatCurrency,
    dashboardManager,
    authManager,
    showModal,
    setLoading,
    hideModal,
  ) {
    this.transactions = []
    this.paymentMethods = []
    this.api = api
    this.requireAuth = requireAuth
    this.showError = showError
    this.sanitizeInput = sanitizeInput
    this.formatDate = formatDate
    this.formatCurrency = formatCurrency
    this.dashboardManager = dashboardManager
    this.authManager = authManager
    this.showModal = showModal
    this.setLoading = setLoading
    this.hideModal = hideModal
    this.init()
  }

  init() {
    // Initialize wallet data
  }

  async loadWalletData() {
    if (!this.requireAuth()) return

    try {
      const [transactions, paymentMethods] = await Promise.all([
        this.api.getTransactions(),
        this.api.getPaymentMethods(),
      ])

      this.transactions = transactions.transactions
      this.paymentMethods = paymentMethods.methods

      this.renderRecentTransactions()
    } catch (error) {
      console.error("Failed to load wallet data:", error)
      this.showError("Failed to load wallet data")
    }
  }

  renderRecentTransactions() {
    const container = document.getElementById("recent-transactions")
    if (!container) return

    const recentTransactions = this.transactions.slice(0, 5)

    if (recentTransactions.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-receipt"></i>
          <h3>No transactions yet</h3>
          <p>Your transaction history will appear here</p>
        </div>
      `
      return
    }

    container.innerHTML = recentTransactions.map((transaction) => this.createTransactionItem(transaction)).join("")
  }

  createTransactionItem(transaction) {
    const isPositive = transaction.amount > 0
    const iconClass = this.getTransactionIconClass(transaction.type)
    const iconSymbol = this.getTransactionIcon(transaction.type)

    return `
      <div class="transaction-item">
        <div class="transaction-info">
          <div class="transaction-icon ${iconClass}">
            <i class="fas ${iconSymbol}"></i>
          </div>
          <div class="transaction-details">
            <h4>${this.sanitizeInput(transaction.description)}</h4>
            <p>${this.formatDate(transaction.created_at)} • ${transaction.status}</p>
          </div>
        </div>
        <div class="transaction-amount ${isPositive ? "positive" : "negative"}">
          ${isPositive ? "+" : ""}${this.formatCurrency(transaction.amount)}
        </div>
      </div>
    `
  }

  getTransactionIconClass(type) {
    switch (type) {
      case "deposit":
        return "deposit"
      case "withdrawal":
        return "withdraw"
      case "task_reward":
        return "task"
      default:
        return "task"
    }
  }

  getTransactionIcon(type) {
    switch (type) {
      case "deposit":
        return "fa-arrow-down"
      case "withdrawal":
        return "fa-arrow-up"
      case "task_reward":
        return "fa-tasks"
      default:
        return "fa-exchange-alt"
    }
  }

  async createDeposit(amount, method) {
    try {
      const response = await this.api.createDeposit(amount, method)
      this.showSuccess("Deposit request submitted successfully!")
      this.loadWalletData()
      return response
    } catch (error) {
      console.error("Failed to create deposit:", error)
      this.showError("Failed to create deposit request")
      throw error
    }
  }

  async createWithdrawal(amount, method, details) {
    try {
      const response = await this.api.createWithdrawal(amount, method, details)
      this.showSuccess("Withdrawal request submitted successfully!")
      this.loadWalletData()
      this.dashboardManager.refreshDashboard()
      return response
    } catch (error) {
      console.error("Failed to create withdrawal:", error)
      this.showError("Failed to create withdrawal request")
      throw error
    }
  }

  showSuccess(message) {
    console.log(message)
  }
}

// Initialize wallet manager
const walletManager = new WalletManager(
  api,
  requireAuth,
  showError,
  sanitizeInput,
  formatDate,
  formatCurrency,
  dashboardManager,
  authManager,
  showModal,
  setLoading,
  hideModal,
)

// Global wallet functions
function showWallet() {
  setActiveNavItem("wallet")
  showContent("wallet")
  updatePageTitle("Wallet")

  // Update wallet balance
  if (authManager.currentUser) {
    const walletBalanceEl = document.getElementById("wallet-balance")
    if (walletBalanceEl) {
      walletBalanceEl.textContent = authManager.currentUser.balance.toFixed(2)
    }
  }

  walletManager.loadWalletData()
}

function showDeposit() {
  const content = `
    <div class="modal-header">
      <h3>Deposit Request</h3>
      <button class="modal-close" onclick="hideModal()">×</button>
    </div>
    <div class="modal-body">
      <form id="deposit-form">
        <div class="form-group">
          <label for="deposit-amount">Deposit Amount</label>
          <input type="number" id="deposit-amount" name="amount" placeholder="Enter amount" min="10" step="0.01" required>
          <small>Minimum deposit: $10</small>
        </div>
        <div class="form-group">
          <label for="deposit-method">Payment Method</label>
          <select id="deposit-method" name="method" required>
            <option value="">Select payment method</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="crypto">Cryptocurrency</option>
            <option value="credit_card">Credit/Debit Card</option>
          </select>
        </div>
        <button type="submit" class="btn-primary">Submit Deposit Request</button>
      </form>
    </div>
  `

  walletManager.showModal(content)

  // Setup form handler
  const form = document.getElementById("deposit-form")
  form.addEventListener("submit", async (e) => {
    e.preventDefault()

    const formData = new FormData(form)
    const amount = Number.parseFloat(formData.get("amount"))
    const method = formData.get("method")

    if (amount >= 10 && method) {
      const submitBtn = form.querySelector('button[type="submit"]')
      walletManager.setLoading(submitBtn, true)

      try {
        await walletManager.createDeposit(amount, method)
        walletManager.hideModal()
      } catch (error) {
        // Error already handled in walletManager
      } finally {
        walletManager.setLoading(submitBtn, false)
      }
    }
  })
}

function showWithdraw() {
  const maxAmount = authManager.currentUser ? authManager.currentUser.balance : 0

  const content = `
    <div class="modal-header">
      <h3>Withdrawal Request</h3>
      <button class="modal-close" onclick="hideModal()">×</button>
    </div>
    <div class="modal-body">
      <form id="withdraw-form">
        <div class="form-group">
          <label for="withdraw-amount">Withdrawal Amount</label>
          <input type="number" id="withdraw-amount" name="amount" placeholder="Enter amount" min="10" step="0.01" max="${maxAmount}" required>
          <small>Available balance: ${formatCurrency(maxAmount)}</small>
        </div>
        <div class="form-group">
          <label for="withdraw-method">Withdrawal Method</label>
          <select id="withdraw-method" name="method" onchange="showWithdrawDetails()" required>
            <option value="">Select withdrawal method</option>
            <option value="bank_account">Bank Account</option>
            <option value="crypto_wallet">Crypto Wallet (USDT)</option>
          </select>
        </div>
        <div id="withdraw-details"></div>
        <button type="submit" class="btn-primary">Submit Withdrawal Request</button>
      </form>
    </div>
  `

  walletManager.showModal(content)

  // Setup form handler
  const form = document.getElementById("withdraw-form")
  form.addEventListener("submit", async (e) => {
    e.preventDefault()

    const formData = new FormData(form)
    const amount = Number.parseFloat(formData.get("amount"))
    const method = formData.get("method")

    if (amount >= 10 && amount <= maxAmount && method) {
      const details = {}

      // Collect method-specific details
      if (method === "bank_account") {
        details.bankName = formData.get("bank_name")
        details.accountHolder = formData.get("account_holder")
        details.iban = formData.get("iban")
      } else if (method === "crypto_wallet") {
        details.walletAddress = formData.get("wallet_address")
      }

      const submitBtn = form.querySelector('button[type="submit"]')
      walletManager.setLoading(submitBtn, true)

      try {
        await walletManager.createWithdrawal(amount, method, details)
        walletManager.hideModal()
      } catch (error) {
        // Error already handled in walletManager
      } finally {
        walletManager.setLoading(submitBtn, false)
      }
    }
  })
}

function showWithdrawDetails() {
  const method = document.getElementById("withdraw-method").value
  const detailsDiv = document.getElementById("withdraw-details")

  if (method === "bank_account") {
    detailsDiv.innerHTML = `
      <div class="form-group">
        <label for="bank_name">Bank Name</label>
        <input type="text" id="bank_name" name="bank_name" placeholder="Enter bank name" required>
      </div>
      <div class="form-group">
        <label for="account_holder">Account Holder Name</label>
        <input type="text" id="account_holder" name="account_holder" placeholder="Enter account holder name" required>
      </div>
      <div class="form-group">
        <label for="iban">IBAN</label>
        <input type="text" id="iban" name="iban" placeholder="Enter IBAN" required>
      </div>
    `
  } else if (method === "crypto_wallet") {
    detailsDiv.innerHTML = `
      <div class="form-group">
        <label for="wallet_address">USDT Wallet Address</label>
        <input type="text" id="wallet_address" name="wallet_address" placeholder="Enter USDT wallet address" required>
      </div>
    `
  } else {
    detailsDiv.innerHTML = ""
  }
}

function showHistory() {
  const content = `
    <div class="modal-header">
      <h3>Transaction History</h3>
      <button class="modal-close" onclick="hideModal()">×</button>
    </div>
    <div class="modal-body">
      <div class="transaction-list" id="history-transactions">
        <div class="loading-placeholder">Loading transactions...</div>
      </div>
    </div>
  `

  walletManager.showModal(content)

  // Load and display all transactions
  setTimeout(() => {
    const container = document.getElementById("history-transactions")
    if (container && walletManager.transactions.length > 0) {
      container.innerHTML = walletManager.transactions
        .map((transaction) => walletManager.createTransactionItem(transaction))
        .join("")
    } else if (container) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-receipt"></i>
          <h3>No transactions yet</h3>
          <p>Your transaction history will appear here</p>
        </div>
      `
    }
  }, 500)
}

// Placeholder functions for undeclared variables
function requireAuth() {
  // Implementation here
}

function api() {
  // Implementation here
}

function showError(message) {
  console.error(message)
}

function sanitizeInput(input) {
  // Implementation here
}

function formatDate(date) {
  // Implementation here
}

function formatCurrency(amount) {
  // Implementation here
}

function dashboardManager() {
  // Implementation here
}

function authManager() {
  // Implementation here
}

function showModal(content) {
  // Implementation here
}

function setLoading(element, isLoading) {
  // Implementation here
}

function hideModal() {
  // Implementation here
}

function setActiveNavItem(item) {
  // Implementation here
}

function showContent(content) {
  // Implementation here
}

function updatePageTitle(title) {
  // Implementation here
}
