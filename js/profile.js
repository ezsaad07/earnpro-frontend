// Profile Management
class ProfileManager {
  constructor(api, authManager) {
    this.api = api
    this.authManager = authManager
    this.paymentMethods = []
    this.plans = []
    this.init()
  }

  init() {
    this.loadPlans()
  }

  async loadPlans() {
    try {
      const response = await this.api.getPlans()
      this.plans = response.plans
    } catch (error) {
      console.error("Failed to load plans:", error)
    }
  }

  async loadPaymentMethods() {
    try {
      const response = await this.api.getPaymentMethods()
      this.paymentMethods = response.methods
    } catch (error) {
      console.error("Failed to load payment methods:", error)
    }
  }

  async updateProfile(data) {
    try {
      const response = await this.api.updateProfile(data)

      // Update current user data
      if (this.authManager.currentUser) {
        Object.assign(this.authManager.currentUser, data)
        this.authManager.updateUserInterface()
      }

      showSuccess("Profile updated successfully!")
      return response
    } catch (error) {
      console.error("Failed to update profile:", error)
      showError("Failed to update profile")
      throw error
    }
  }

  async addPaymentMethod(type, details) {
    try {
      const response = await this.api.addPaymentMethod(type, details)
      showSuccess("Payment method added successfully!")
      this.loadPaymentMethods()
      return response
    } catch (error) {
      console.error("Failed to add payment method:", error)
      showError("Failed to add payment method")
      throw error
    }
  }

  async upgradePlan(planId) {
    try {
      const response = await this.api.upgradePlan(planId)
      showSuccess("Plan upgrade request submitted successfully!")
      return response
    } catch (error) {
      console.error("Failed to upgrade plan:", error)
      showError("Failed to submit upgrade request")
      throw error
    }
  }
}

// Initialize profile manager
const api = {
  getPlans: () => Promise.resolve({ plans: [] }),
  getPaymentMethods: () => Promise.resolve({ methods: [] }),
  updateProfile: (data) => Promise.resolve(data),
  addPaymentMethod: (type, details) => Promise.resolve({ type, details }),
  upgradePlan: (planId) => Promise.resolve(planId),
}

const authManager = {
  currentUser: { name: "John Doe", email: "john@example.com", plan: "Basic" },
  updateUserInterface: () => {},
}

const profileManager = new ProfileManager(api, authManager)

// Global profile functions
function showProfile(setActiveNavItem, showContent, updatePageTitle) {
  setActiveNavItem("profile")
  showContent("profile")
  updatePageTitle("Profile")

  // Update profile display
  if (authManager.currentUser) {
    const nameEl = document.getElementById("profile-name")
    const emailEl = document.getElementById("profile-email")
    const planEl = document.getElementById("profile-plan-badge")

    if (nameEl) nameEl.textContent = authManager.currentUser.name
    if (emailEl) emailEl.textContent = authManager.currentUser.email
    if (planEl) planEl.textContent = `${authManager.currentUser.plan} Plan`
  }
}

function editProfile(showModal, hideModal, setLoading, sanitizeInput) {
  const user = authManager.currentUser
  if (!user) return

  const content = `
    <div class="modal-header">
      <h3>Edit Profile</h3>
      <button class="modal-close" onclick="hideModal()">×</button>
    </div>
    <div class="modal-body">
      <form id="profile-form">
        <div class="form-group">
          <label for="edit-name">Full Name</label>
          <input type="text" id="edit-name" name="name" value="${sanitizeInput(user.name)}" required>
        </div>
        <div class="form-group">
          <label for="edit-email">Email Address</label>
          <input type="email" id="edit-email" name="email" value="${sanitizeInput(user.email)}" required>
        </div>
        <div class="form-group">
          <label for="edit-phone">Phone Number</label>
          <input type="tel" id="edit-phone" name="phone" value="${user.phone || ""}" placeholder="Enter phone number">
        </div>
        <button type="submit" class="btn-primary">Update Profile</button>
      </form>
    </div>
  `

  showModal(content)

  // Setup form handler
  const form = document.getElementById("profile-form")
  form.addEventListener("submit", async (e) => {
    e.preventDefault()

    const formData = new FormData(form)
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
    }

    const submitBtn = form.querySelector('button[type="submit"]')
    setLoading(submitBtn, true)

    try {
      await profileManager.updateProfile(data)
      hideModal()
    } catch (error) {
      // Error already handled in profileManager
    } finally {
      setLoading(submitBtn, false)
    }
  })
}

function showPaymentMethods(showModal, hideModal, setLoading) {
  const content = `
    <div class="modal-header">
      <h3>Payment Methods</h3>
      <button class="modal-close" onclick="hideModal()">×</button>
    </div>
    <div class="modal-body">
      <div class="payment-methods">
        <div class="payment-section">
          <h4>Add Bank Account</h4>
          <form id="bank-form">
            <div class="form-group">
              <label for="bank-name-add">Bank Name</label>
              <input type="text" id="bank-name-add" name="bank_name" placeholder="Enter bank name" required>
            </div>
            <div class="form-group">
              <label for="account-holder-add">Account Holder Name</label>
              <input type="text" id="account-holder-add" name="account_holder" placeholder="Enter account holder name" required>
            </div>
            <div class="form-group">
              <label for="iban-add">IBAN</label>
              <input type="text" id="iban-add" name="iban" placeholder="Enter IBAN" required>
            </div>
            <button type="submit" class="btn-secondary">Add Bank Account</button>
          </form>
        </div>
        
        <div class="payment-section">
          <h4>Add Crypto Wallet</h4>
          <form id="crypto-form">
            <div class="form-group">
              <label for="wallet-address-add">USDT Wallet Address</label>
              <input type="text" id="wallet-address-add" name="wallet_address" placeholder="Enter USDT wallet address" required>
            </div>
            <button type="submit" class="btn-secondary">Add Crypto Wallet</button>
          </form>
        </div>
      </div>
    </div>
  `

  showModal(content)

  // Setup form handlers
  const bankForm = document.getElementById("bank-form")
  bankForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    const formData = new FormData(bankForm)
    const details = {
      bankName: formData.get("bank_name"),
      accountHolder: formData.get("account_holder"),
      iban: formData.get("iban"),
    }

    const submitBtn = bankForm.querySelector('button[type="submit"]')
    setLoading(submitBtn, true)

    try {
      await profileManager.addPaymentMethod("bank_account", details)
      bankForm.reset()
    } catch (error) {
      // Error already handled in profileManager
    } finally {
      setLoading(submitBtn, false)
    }
  })

  const cryptoForm = document.getElementById("crypto-form")
  cryptoForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    const formData = new FormData(cryptoForm)
    const details = {
      walletAddress: formData.get("wallet_address"),
    }

    const submitBtn = cryptoForm.querySelector('button[type="submit"]')
    setLoading(submitBtn, true)

    try {
      await profileManager.addPaymentMethod("crypto_wallet", details)
      cryptoForm.reset()
    } catch (error) {
      // Error already handled in profileManager
    } finally {
      setLoading(submitBtn, false)
    }
  })
}

function showUpgrade(showModal, hideModal) {
  const currentPlan = authManager.currentUser ? authManager.currentUser.plan : "Basic"

  const plans = [
    {
      id: 1,
      name: "Basic",
      price: 0,
      features: ["5 tasks per day", "Basic support", "Standard rewards"],
    },
    {
      id: 2,
      name: "Silver",
      price: 29,
      features: ["10 tasks per day", "Priority support", "1.2x rewards multiplier"],
    },
    {
      id: 3,
      name: "Gold",
      price: 59,
      features: ["20 tasks per day", "Premium support", "1.5x rewards multiplier"],
    },
    {
      id: 4,
      name: "Platinum",
      price: 99,
      features: ["50 tasks per day", "VIP support", "2x rewards multiplier"],
    },
    {
      id: 5,
      name: "Diamond",
      price: 199,
      features: ["Unlimited tasks", "24/7 support", "3x rewards multiplier"],
    },
  ]

  const content = `
    <div class="modal-header">
      <h3>Upgrade Plan</h3>
      <button class="modal-close" onclick="hideModal()">×</button>
    </div>
    <div class="modal-body">
      <div class="plans-list">
        ${plans
          .map(
            (plan) => `
          <div class="plan-card ${currentPlan === plan.name ? "current" : ""}">
            <div class="plan-header">
              <h4>${plan.name}</h4>
              <div class="plan-price">${plan.price === 0 ? "Free" : `$${plan.price}/month`}</div>
            </div>
            <ul class="plan-features">
              ${plan.features.map((feature) => `<li><i class="fas fa-check"></i> ${feature}</li>`).join("")}
            </ul>
            ${
              currentPlan === plan.name
                ? '<button class="btn-secondary" disabled>Current Plan</button>'
                : `<button class="btn-primary" onclick="upgradePlan(${plan.id}, '${plan.name}', ${plan.price})">
                   ${plan.price === 0 ? "Downgrade" : "Upgrade"} to ${plan.name}
                 </button>`
            }
          </div>
        `,
          )
          .join("")}
      </div>
    </div>
  `

  showModal(content)
}

async function upgradePlan(planId, planName, price, showModal, hideModal) {
  const confirmMessage =
    price === 0
      ? `Are you sure you want to downgrade to ${planName}?`
      : `Upgrade to ${planName} plan for $${price}/month?`

  if (confirm(confirmMessage)) {
    try {
      await profileManager.upgradePlan(planId)
      hideModal()
    } catch (error) {
      // Error already handled in profileManager
    }
  }
}

// Helper functions
function showSuccess(message) {
  console.log(message)
}

function showError(message) {
  console.error(message)
}

function setActiveNavItem(item) {
  console.log(`Active nav item set to: ${item}`)
}

function showContent(content) {
  console.log(`Content shown: ${content}`)
}

function updatePageTitle(title) {
  document.title = title
}

function sanitizeInput(input) {
  return input.replace(/[^a-zA-Z0-9\s]/g, "")
}

function showModal(content) {
  console.log("Modal shown with content:", content)
}

function setLoading(element, loading) {
  if (loading) {
    element.textContent = "Loading..."
    element.disabled = true
  } else {
    element.textContent = "Submit"
    element.disabled = false
  }
}

function hideModal() {
  console.log("Modal hidden")
}
