const Payment = {
  config: null,
  currentAmount: 0,
  currentCause: null,
  selectedGateway: null,

  async init() {
    await this.loadConfig();
    this.bindEvents();
  },

  async loadConfig() {
    try {
      const response = await fetch('data/payment-config.json?t=' + Date.now());
      this.config = await response.json();
    } catch (error) {
      console.error('Error loading payment config:', error);
    }
  },

  bindEvents() {
    const modal = document.getElementById('payment-modal');
    if (!modal) return;

    const closeBtn = document.getElementById('modal-close');
    const donateButtons = document.querySelectorAll('.donate-btn, .donation-amount');
    const amountBtns = document.querySelectorAll('.amount-btn');
    const customAmount = document.getElementById('custom-amount');
    const proceedBtn = document.getElementById('proceed-payment');

    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeModal();
      });
    }

    const backdrop = document.getElementById('modal-backdrop');
    if (backdrop) {
      backdrop.addEventListener('click', () => this.closeModal());
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeModal();
      });
    }

    donateButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const amount = e.target.dataset.amount;
        this.openModal(amount);
      });
    });

    amountBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        amountBtns.forEach(b => b.classList.remove('border-lime-400', 'bg-lime-50'));
        btn.classList.add('border-lime-400', 'bg-lime-50');
        this.currentAmount = parseInt(btn.dataset.amount);
        if (customAmount) customAmount.value = '';
      });
    });

    if (customAmount) {
      customAmount.addEventListener('input', () => {
        amountBtns.forEach(b => b.classList.remove('border-lime-400', 'bg-lime-50'));
        this.currentAmount = parseInt(customAmount.value) || 0;
      });
    }

    if (proceedBtn) {
      proceedBtn.addEventListener('click', () => this.processPayment());
    }

    document.querySelectorAll('input[name="gateway"]').forEach(radio => {
      radio.addEventListener('change', () => {
        this.selectedGateway = radio.value;
      });
    });

    window.addEventListener('popstate', () => {
      this.handlePaymentReturn();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const modal = document.getElementById('payment-modal');
        if (modal && !modal.classList.contains('hidden')) {
          this.closeModal();
        }
      }
    });

    this.handlePaymentReturn();
  },

  openModal(defaultAmount = null) {
    const modal = document.getElementById('payment-modal');
    const amountInput = document.getElementById('custom-amount');
    const causeTitle = document.getElementById('cause-title');
    const causeId = new URLSearchParams(window.location.search).get('id');

    if (!modal) return;

    this.currentCause = causeId;
    
    if (defaultAmount) {
      this.currentAmount = parseInt(defaultAmount);
      if (amountInput) amountInput.value = defaultAmount;
    }

    const titleEl = document.getElementById('payment-cause-title');
    if (titleEl && causeTitle) {
      titleEl.textContent = causeTitle.textContent;
    }

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  },

  closeModal() {
    const modal = document.getElementById('payment-modal');
    if (modal) {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
    }
  },

  getSelectedAmount() {
    const customAmount = document.getElementById('custom-amount');
    if (customAmount && customAmount.value) {
      return parseInt(customAmount.value);
    }
    return this.currentAmount || 0;
  },

  getDonorInfo() {
    const nameInput = document.getElementById('donor-name');
    const emailInput = document.getElementById('donor-email');
    return {
      name: nameInput ? nameInput.value : '',
      email: emailInput ? emailInput.value : ''
    };
  },

  processPayment() {
    const amount = this.getSelectedAmount();
    if (!amount || amount <= 0) {
      alert('Please select or enter a valid amount');
      return;
    }

    const gateway = document.querySelector('input[name="gateway"]:checked');
    if (!gateway) {
      alert('Please select a payment method');
      return;
    }

    this.selectedGateway = gateway.value;
    this.currentAmount = amount;

    switch (this.selectedGateway) {
      case 'esewa':
        this.processESewa();
        break;
      case 'khalti':
        this.processKhalti();
        break;
      case 'stripe':
        this.processStripe();
        break;
      case 'paypal':
        this.processPayPal();
        break;
      default:
        alert('Please select a valid payment method');
    }
  },

  processESewa() {
    if (!this.config?.gateways?.esewa?.enabled) {
      alert('eSewa payment is currently unavailable');
      return;
    }

    const esewa = this.config.gateways.esewa;
    const donor = this.getDonorInfo();
    const amount = this.currentAmount;
    const transactionUuid = this.generateTransactionId();
    const baseUrl = window.location.origin;
    
    const signature = this.generateESewaSignature(amount, transactionUuid, esewa.merchantId, esewa.secretKey);

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = esewa.apiUrl;
    form.target = '_blank';

    const fields = {
      amount: amount,
      tax_amount: 0,
      total_amount: amount,
      transaction_uuid: transactionUuid,
      product_code: esewa.merchantId,
      product_service_charge: 0,
      product_delivery_charge: 0,
      success_url: `${baseUrl}/payment-success.html?cause=${this.currentCause}&amount=${amount}&donor=${encodeURIComponent(donor.name)}&email=${encodeURIComponent(donor.email)}`,
      failure_url: `${baseUrl}/payment-failed.html?cause=${this.currentCause}`,
      signed_field_names: 'total_amount,transaction_uuid,product_code',
      signature: signature
    };

    Object.entries(fields).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value;
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);

    this.closeModal();
  },

  generateESewaSignature(totalAmount, transactionUuid, productCode, secretKey) {
    const data = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
    const hash = CryptoJS.HmacSHA256(data, secretKey);
    return CryptoJS.enc.Base64.stringify(hash);
  },

  generateTransactionId() {
    const now = new Date();
    return now.toISOString().slice(2, 10).replace(/-/g, '') + '-' + 
           now.getHours() + now.getMinutes() + now.getSeconds() + 
           Math.floor(Math.random() * 1000);
  },

  processKhalti() {
    if (!this.config?.gateways?.khalti?.enabled) {
      alert('Khalti payment is currently unavailable');
      return;
    }

    const khalti = this.config.gateways.khalti;
    const donor = this.getDonorInfo();
    const amount = this.currentAmount;
    const causeTitle = document.getElementById('cause-cause-title')?.textContent || 'Donation';
    const baseUrl = window.location.origin;

    if (window.KhaltiCheckout) {
      const config = {
        publicKey: khalti.publicKey,
        productIdentity: this.currentCause,
        productName: causeTitle,
        productUrl: window.location.href,
        amount: amount * 100,
        customData: {
          causeId: this.currentCause,
          donorName: donor.name,
          donorEmail: donor.email
        },
        paymentPreference: ['KHALTI', 'EBANKING', 'MOBILE_BANKING', 'CONNECT_IPS', 'SCT'],
        eventHandler: {
          onSuccess: (payload) => {
            console.log('Khalti payment success:', payload);
            window.location.href = `${baseUrl}/payment-success.html?cause=${this.currentCause}&amount=${amount}&token=${payload.token}&donor=${encodeURIComponent(donor.name)}&email=${encodeURIComponent(donor.email)}`;
          },
          onError: (error) => {
            console.error('Khalti payment error:', error);
            alert('Payment failed. Please try again.');
          },
          onClose: () => {
            console.log('Khalti modal closed');
          }
        }
      };

      const checkout = new KhaltiCheckout(config);
      checkout.show({
        amount: amount * 100,
        productIdentity: this.currentCause,
        productName: causeTitle
      });
    } else {
      alert('Khalti is not loaded. Please refresh and try again.');
    }

    this.closeModal();
  },

  processStripe() {
    if (!this.config?.gateways?.stripe?.enabled) {
      alert('Stripe payment is currently unavailable');
      return;
    }

    const stripe = this.config.gateways.stripe;
    const donor = this.getDonorInfo();
    const amount = this.currentAmount;
    const baseUrl = window.location.origin;

    const params = new URLSearchParams({
      amount: amount,
      cause: this.currentCause,
      donor: donor.name,
      email: donor.email,
      baseUrl: baseUrl
    });

    const paymentUrl = `${baseUrl}/stripe-checkout.html?${params.toString()}`;
    
    window.location.href = paymentUrl;
    this.closeModal();
  },

  processPayPal() {
    if (!this.config?.gateways?.paypal?.enabled) {
      alert('PayPal payment is currently unavailable');
      return;
    }

    const paypal = this.config.gateways.paypal;
    const donor = this.getDonorInfo();
    const amount = this.currentAmount;
    const causeId = this.currentCause;
    const baseUrl = window.location.origin;
    const causeTitle = document.getElementById('cause-cause-title')?.textContent || 'Donation';

    this.closeModal();

    // Create a PayPal checkout container
    const modal = document.createElement('div');
    modal.id = 'paypal-modal';
    modal.className = 'fixed inset-0 overflow-y-auto';
    modal.style.cssText = 'z-index: 9999; background: rgba(0,0,0,0.8); padding: 20px; display: flex; align-items: center; justify-content: center; min-height: 100vh;';
    
    modal.innerHTML = `
      <div class="bg-white rounded-2xl p-6 max-w-md w-full relative">
        <button id="paypal-close" class="absolute top-3 right-3 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xl">&times;</button>
        <h3 class="text-lg font-semibold mb-4">Pay with PayPal</h3>
        <p class="text-sm text-gray-500 mb-4">Amount: Rs${amount}</p>
        <div id="paypal-button-container"></div>
        <p class="text-xs text-gray-400 mt-4 text-center">Test Mode: Use any test account</p>
      </div>
    `;
    
    document.body.appendChild(modal);

    document.getElementById('paypal-close').addEventListener('click', () => {
      modal.remove();
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    // Render PayPal button
    if (window.paypal) {
      window.paypal.Buttons({
        style: {
          layout: 'vertical',
          color: 'blue',
          shape: 'rect',
          label: 'paypal'
        },
        createOrder: function(data, actions) {
          return actions.order.create({
            purchase_units: [{
              description: causeTitle,
              amount: {
                value: (amount / 130).toFixed(2) // Convert NPR to USD approx
              }
            }]
          });
        },
        onApprove: function(data, actions) {
          return actions.order.capture().then(function(details) {
            window.location.href = `${baseUrl}/payment-success.html?result=success&gateway=paypal&amount=${amount}&cause=${causeId}`;
          });
        },
        onError: function(err) {
          console.error('PayPal error:', err);
          alert('Payment failed. Please try again.');
          modal.remove();
        },
        onCancel: function() {
          modal.remove();
        }
      }).render('#paypal-button-container');
    } else {
      document.getElementById('paypal-button-container').innerHTML = '<p class="text-red-500">PayPal failed to load. Please refresh and try again.</p>';
    }
  },

  handlePaymentReturn() {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('result');
    const gateway = params.get('gateway');
    const amount = params.get('amount');
    const causeId = params.get('cause');

    if (paymentStatus === 'success') {
      this.showPaymentResult('success', gateway, amount, causeId);
      
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    } else if (paymentStatus === 'failed') {
      this.showPaymentResult('failed', gateway, amount, causeId);
      
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    }
  },

  showPaymentResult(status, gateway, amount, causeId) {
    const modal = document.getElementById('payment-modal');
    if (!modal) return;

    const content = modal.querySelector('.payment-modal-content');
    if (!content) return;

    if (status === 'success') {
      content.innerHTML = `
        <div class="text-center py-8">
          <div class="w-20 h-20 bg-lime-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <iconify-icon icon="solar:check-circle-bold" class="text-4xl text-lime-500"></iconify-icon>
          </div>
          <h3 class="text-2xl font-semibold mb-2" style="font-family: 'Playfair Display', serif;">Thank You!</h3>
          <p class="text-zinc-500 mb-4">Your donation of Rs${amount || '0'} has been received.</p>
          <p class="text-sm text-zinc-400 mb-6">Receipt has been sent to your email.</p>
          <div class="flex flex-col gap-3">
            <a href="explore.html" class="w-full py-3 rounded-full bg-lime-400 text-emerald-950 font-medium hover:bg-lime-300 transition">
              Explore More Causes
            </a>
            <button onclick="closePaymentModal()" class="w-full py-3 rounded-full border border-zinc-200 text-zinc-600 font-medium hover:bg-zinc-50 transition">
              Close
            </button>
          </div>
        </div>
      `;
    } else {
      content.innerHTML = `
        <div class="text-center py-8">
          <div class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <iconify-icon icon="solar:close-circle-bold" class="text-4xl text-red-500"></iconify-icon>
          </div>
          <h3 class="text-2xl font-semibold mb-2" style="font-family: 'Playfair Display', serif;">Payment Failed</h3>
          <p class="text-zinc-500 mb-6">Something went wrong. Please try again.</p>
          <button onclick="retryPayment()" class="w-full py-3 rounded-full bg-lime-400 text-emerald-950 font-medium hover:bg-lime-300 transition">
            Try Again
          </button>
        </div>
      `;
    }

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
};

function closePaymentModal() {
  const modal = document.getElementById('payment-modal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
    window.location.href = 'cause.html';
  }
}

function retryPayment() {
  window.location.href = 'cause.html';
}

document.addEventListener('DOMContentLoaded', () => {
  Payment.init();
});
