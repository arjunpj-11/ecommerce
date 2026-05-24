const RAZORPAY_KEY = 'rzp_test_EoM9R5cEQq0ViU';

document.addEventListener('DOMContentLoaded', () => {
  const navbar = document.getElementById('navbar');
  const searchToggle = document.querySelector('.search-toggle');
  const searchOverlay = document.getElementById('searchOverlay');
  const searchClose = document.getElementById('searchClose');

  const hamburger = document.getElementById('hamburger');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const mobileOverlay = document.getElementById('mobileOverlay');
  const drawerClose = document.getElementById('drawerClose');

  const categoriesDataEl = document.getElementById('arni-categories-data');
  const canvas = document.getElementById('backgroundCanvas');

  let lastScrollY = 0;
  let arniCategories = [];

  try {
    arniCategories = categoriesDataEl
      ? JSON.parse(categoriesDataEl.textContent || '[]')
      : [];
  } catch (error) {
    console.error('Failed to parse ARNI categories:', error);
    arniCategories = [];
  }

  initializeCanvas();
  initializeNavbar();
  initializeSearch();
  initializeMobileDrawer();
  initializeCategoryDropdown();
  initializeColorCircles();
  initializeReveal();
  initializeCheckout();
  setupFormSubmissionHandlers();

  window.showAddAddressModal = showAddAddressModal;
  window.closeAddressModal = closeAddressModal;
  window.selectAddress = selectAddress;

  function initializeNavbar() {
    if (!navbar) return;

    window.addEventListener('scroll', () => {
      const currentY = window.scrollY;

      navbar.classList.toggle('scrolled', currentY > 20);
      navbar.style.transform =
        currentY > lastScrollY && currentY > 140
          ? 'translateY(-100%)'
          : 'translateY(0)';

      lastScrollY = currentY;
    }, { passive: true });
  }

  function initializeSearch() {
    searchToggle?.addEventListener('click', () => {
      const isOpen = searchOverlay?.classList.toggle('open');

      if (isOpen) {
        searchOverlay?.querySelector('.search-input')?.focus();
      }
    });

    searchClose?.addEventListener('click', () => {
      searchOverlay?.classList.remove('open');
    });

    document.addEventListener('click', (event) => {
      if (
        searchOverlay?.classList.contains('open') &&
        !searchOverlay.contains(event.target) &&
        !searchToggle?.contains(event.target)
      ) {
        searchOverlay.classList.remove('open');
      }
    });
  }

  function initializeMobileDrawer() {
    function openDrawer() {
      mobileDrawer?.classList.add('open');
      mobileOverlay?.classList.add('visible');
      hamburger?.classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    function closeDrawer() {
      mobileDrawer?.classList.remove('open');
      mobileOverlay?.classList.remove('visible');
      hamburger?.classList.remove('open');
      document.body.style.overflow = '';
    }

    hamburger?.addEventListener('click', () => {
      if (mobileDrawer?.classList.contains('open')) {
        closeDrawer();
      } else {
        openDrawer();
      }
    });

    mobileOverlay?.addEventListener('click', closeDrawer);
    drawerClose?.addEventListener('click', closeDrawer);

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeDrawer();
        closeAddressModal();
        searchOverlay?.classList.remove('open');
      }
    });
  }

  function initializeCategoryDropdown() {
    const navLinks = document.querySelector('.nav-links');
    if (!navLinks || !arniCategories.length) return;

    let dropdownMenu = null;

    function buildDropdown(categories) {
      if (!dropdownMenu) {
        dropdownMenu = document.createElement('div');
        dropdownMenu.className = 'cat-dropdown';
        document.body.appendChild(dropdownMenu);
      }

      dropdownMenu.innerHTML = `
        <div class="cat-dropdown-inner">
          ${categories.map((category) => `
            <div class="cat-dropdown-col">
              <a href="/subcategories?main=${escapeHtml(category._id || '')}" class="cat-dropdown-title">
                ${escapeHtml(category.mainCategoryName || 'Category')}
              </a>

              <ul>
                ${(category.subcategories || []).map((subcategory) => `
                  <li>
                    <a href="/products?sub=${escapeHtml(subcategory._id || '')}">
                      ${escapeHtml(subcategory.subCategoryName || 'Subcategory')}
                    </a>
                  </li>
                `).join('')}
              </ul>
            </div>
          `).join('')}
        </div>
      `;
    }

    function openDropdown(link) {
      buildDropdown(arniCategories);

      const rect = link.getBoundingClientRect();
      const left = Math.min(
        Math.max(12, rect.left),
        window.innerWidth - 360
      );

      dropdownMenu.style.top = `${rect.bottom + 10}px`;
      dropdownMenu.style.left = `${left}px`;
      dropdownMenu.classList.add('open');
    }

    function closeDropdown() {
      dropdownMenu?.classList.remove('open');
    }

    navLinks.addEventListener('mouseover', (event) => {
      const link = event.target.closest('a[data-category="true"]');

      if (link) {
        openDropdown(link);
      }
    });

    document.addEventListener('mouseover', (event) => {
      if (
        dropdownMenu?.classList.contains('open') &&
        !event.target.closest('.cat-dropdown') &&
        !event.target.closest('[data-category="true"]')
      ) {
        closeDropdown();
      }
    });

    window.addEventListener('scroll', closeDropdown, { passive: true });
    window.addEventListener('resize', closeDropdown);
  }

  function initializeColorCircles() {
    document.querySelectorAll('.color-circle[data-color-value]').forEach((circle) => {
      circle.style.backgroundColor = circle.dataset.colorValue || '#d1d5db';
    });
  }

  function initializeReveal() {
    const revealEls = document.querySelectorAll(
      '.checkout-hero, .card, .summary, .footer-section'
    );

    if (!revealEls.length) return;

    revealEls.forEach((el, index) => {
      el.classList.add('reveal');
      el.style.transitionDelay = `${Math.min(index * 55, 240)}ms`;
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px'
    });

    revealEls.forEach((el) => observer.observe(el));
  }

  async function initializeCheckout() {
    try {
      await initializeWalletPayment();
      await fetchAddresses();

      initializePaymentMethods();
      setupPlaceOrderButton();
      setupModalCloseHandlers();
    } catch (error) {
      console.error('Checkout initialization error:', error);
      showToast('Failed to initialize checkout. Please refresh the page.', 'error');
    }
  }

  function loadRazorpay() {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';

      script.onload = resolve;

      script.onerror = () => {
        showToast('Failed to load payment gateway. Please try again.', 'error');
        reject(new Error('Razorpay load failed'));
      };

      document.body.appendChild(script);
    });
  }

  function showAddAddressModal() {
    const modal = document.getElementById('addressModal');

    if (!modal) {
      showToast('Could not open address form. Please refresh the page.', 'error');
      return;
    }

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeAddressModal() {
    const modal = document.getElementById('addressModal');

    if (!modal) return;

    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }

  async function fetchAddresses() {
    try {
      const response = await fetch('/users/checkout/addresses');

      if (!response.ok) {
        throw new Error('Failed to fetch addresses');
      }

      const addresses = await response.json();
      const addressList = document.querySelector('.address-list');

      if (!addressList) {
        showToast('Address list container not found. Please refresh the page.', 'error');
        return;
      }

      if (!addresses.length) {
        addressList.innerHTML = `
          <div class="empty-address">
            <i class="fas fa-location-dot"></i>
            <p>No saved addresses found. Add a new address to continue.</p>
          </div>
        `;
        return;
      }

      addressList.innerHTML = addresses.map((address) => `
        <div class="address-card ${address.isPrimary ? 'selected' : ''}" data-address-id="${escapeHtml(address._id)}">
          <input
            type="radio"
            name="shipping-address"
            value="${escapeHtml(address._id)}"
            ${address.isPrimary ? 'checked' : ''}
          >

          <div class="address-details">
            <h3>${escapeHtml(address.name || address.street || 'Saved Address')}</h3>
            <p>${escapeHtml(address.street || '')}</p>
            <p>${escapeHtml(address.city || '')}, ${escapeHtml(address.state || '')} ${escapeHtml(address.postalCode || '')}</p>
          </div>
        </div>
      `).join('');

      attachAddressCardListeners();
    } catch (error) {
      showToast('Failed to load addresses. Please try again.', 'error');
      console.error('Address fetch error:', error);
    }
  }

  function attachAddressCardListeners() {
    document.querySelectorAll('.address-card').forEach((card) => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.address-card').forEach((item) => {
          item.classList.remove('selected');
        });

        card.classList.add('selected');

        const radio = card.querySelector('input[type="radio"]');

        if (radio) {
          radio.checked = true;
        }
      });
    });
  }

  async function updateAddressList() {
    try {
      const response = await fetch('/users/checkout/addresses/primary');

      if (!response.ok) {
        if (response.status === 404) {
          showToast('Please select a primary address to continue.', 'warning');
          return;
        }

        throw new Error('Failed to update address list');
      }

      await fetchAddresses();
    } catch (error) {
      showToast(error.message || 'Failed to update address.', 'error');
      console.error('Address update error:', error);
    }
  }

  function initializePaymentMethods() {
    const totalAmount = getTotalAmount();
    const isCODAllowed = totalAmount <= 1000;

    const codMethod = document.querySelector('.payment-method[data-method="cod"]');

    if (codMethod) {
      const codRadio = codMethod.querySelector('input[type="radio"]');
      const codLabel = codMethod.querySelector('label');

      if (!isCODAllowed && codRadio && codLabel && !codMethod.querySelector('.cod-warning')) {
        codRadio.disabled = true;
        codMethod.classList.add('disabled');

        const warningMessage = document.createElement('p');
        warningMessage.className = 'text-red-500 cod-warning';
        warningMessage.textContent = 'Cash on Delivery not available for orders above ₹1,000';

        codLabel.querySelector('span:last-child')?.appendChild(warningMessage);
      }
    }

    document.querySelectorAll('.payment-method').forEach((method) => {
      method.addEventListener('click', () => {
        const radio = method.querySelector('input[type="radio"]');

        if (method.dataset.method === 'cod' && !isCODAllowed) {
          showToast('Cash on Delivery is not available for orders above ₹1,000.', 'warning');
          return;
        }

        if (radio?.disabled) {
          showToast('This payment method is not available.', 'warning');
          return;
        }

        document.querySelectorAll('.payment-method').forEach((item) => {
          item.classList.remove('selected');
        });

        method.classList.add('selected');

        if (radio) {
          radio.checked = true;
        }
      });
    });
  }

  async function initializeWalletPayment() {
    try {
      const response = await fetch('/users/checkout/wallet/balance');

      if (!response.ok) {
        throw new Error('Failed to fetch wallet balance');
      }

      const { balance } = await response.json();
      const paymentMethodsDiv = document.querySelector('.payment-methods');

      if (!paymentMethodsDiv) return;

      const totalAmount = getTotalAmount();
      const hasEnoughBalance = Number(balance) >= totalAmount;

      const walletMethod = document.createElement('div');
      walletMethod.className = `payment-method ${!hasEnoughBalance ? 'disabled' : ''}`;
      walletMethod.dataset.method = 'wallet';

      walletMethod.innerHTML = `
        <input
          type="radio"
          name="payment"
          value="wallet"
          id="wallet"
          ${!hasEnoughBalance ? 'disabled' : ''}
        >

        <label for="wallet">
          <span class="payment-icon">
            <i class="fas fa-wallet"></i>
          </span>

          <span>
            <h3>Pay with Wallet</h3>
            <p>Available Balance: ₹${Number(balance).toFixed(2)}</p>
            ${!hasEnoughBalance ? '<p class="text-red-500">Insufficient balance for this order</p>' : ''}
          </span>
        </label>
      `;

      paymentMethodsDiv.appendChild(walletMethod);

      walletMethod.addEventListener('click', function () {
        if (!hasEnoughBalance) {
          showToast('Insufficient wallet balance.', 'warning');
          return;
        }

        document.querySelectorAll('.payment-method').forEach((method) => {
          method.classList.remove('selected');
        });

        this.classList.add('selected');

        const radio = this.querySelector('input[type="radio"]');

        if (radio) {
          radio.checked = true;
        }
      });
    } catch (error) {
      console.error('Wallet initialization error:', error);
    }
  }

  function setupPlaceOrderButton() {
    const placeOrderBtn = document.getElementById('placeOrderBtn');

    if (!placeOrderBtn) {
      showToast('Place order button not found. Please refresh the page.', 'error');
      return;
    }

    placeOrderBtn.addEventListener('click', async (event) => {
      event.preventDefault();

      const selectedAddressRadio = document.querySelector('input[name="shipping-address"]:checked');
      const selectedPaymentMethod = document.querySelector('input[name="payment"]:checked')?.value;
      const totalAmount = getTotalAmount();

      if (!selectedAddressRadio) {
        showToast('Please select a shipping address.', 'warning');
        return;
      }

      if (!selectedPaymentMethod) {
        showToast('Please select a payment method.', 'warning');
        return;
      }

      if (selectedPaymentMethod === 'cod' && totalAmount > 1000) {
        showToast('Cash on Delivery is not available for orders above ₹1,000.', 'error');
        return;
      }

      const orderData = {
        shippingAddressId: selectedAddressRadio.value,
        paymentMethod: selectedPaymentMethod
      };

      try {
        switch (selectedPaymentMethod) {
          case 'razorpay':
            await handleRazorpayPayment(orderData);
            break;

          case 'wallet':
            await handleWalletPayment(orderData);
            break;

          case 'cod':
            await handleCODPayment(orderData);
            break;

          default:
            showToast('Invalid payment method selected.', 'error');
        }
      } catch (error) {
        console.error('Order placement error:', error);
        showToast('Failed to process order. Please try again.', 'error');
      }
    });
  }

  async function handleRazorpayPayment(orderData) {
    try {
      await loadRazorpay();

      const response = await fetch('/users/checkout/create-razorpay-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      const { order, userInfo } = await response.json();

      const options = {
        key: RAZORPAY_KEY,
        amount: order.amount,
        currency: order.currency,
        name: 'ARNI',
        description: 'Purchase Payment',
        order_id: order.id,
        prefill: {
          name: userInfo?.name,
          email: userInfo?.email,
          contact: userInfo?.phone
        },
        handler: async function (paymentResponse) {
          await handlePaymentCompletion(orderData, paymentResponse);
        },
        modal: {
          ondismiss: async function () {
            await handlePaymentCompletion(orderData, {
              razorpay_order_id: order.id,
              razorpay_payment_id: null,
              razorpay_signature: null
            });
          }
        }
      };

      const razorpay = new Razorpay(options);
      razorpay.open();
    } catch (error) {
      showToast('Payment initialization failed.', 'error');
      console.error('Razorpay error:', error);
    }
  }

  async function handlePaymentCompletion(orderData, paymentResponse) {
    try {
      showToast('Processing payment...', 'info');

      const verifyResponse = await fetch('/users/checkout/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...orderData,
          razorpay_payment_id: paymentResponse.razorpay_payment_id,
          razorpay_order_id: paymentResponse.razorpay_order_id,
          razorpay_signature: paymentResponse.razorpay_signature
        })
      });

      const result = await verifyResponse.json();

      if (verifyResponse.ok) {
        showToast('Payment successful! Redirecting...', 'success');
      } else {
        showToast('Payment unsuccessful. Redirecting to orders...', 'error');
      }

      setTimeout(() => {
        window.location.href = result.redirect || '/users/order';
      }, 1500);
    } catch (error) {
      console.error('Payment completion error:', error);
      showToast('Payment processing failed. Redirecting...', 'error');
      window.location.href = '/users/order';
    }
  }

  async function handleWalletPayment(orderData) {
    const placeOrderBtn = document.getElementById('placeOrderBtn');

    try {
      const totalAmount = getTotalAmount();

      if (placeOrderBtn) {
        placeOrderBtn.disabled = true;
        placeOrderBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
      }

      showToast('Processing wallet payment...', 'info');

      const response = await fetch('/users/checkout/wallet/pay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: totalAmount,
          shippingAddressId: orderData.shippingAddressId
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Payment failed');
      }

      showToast('Payment successful! Redirecting to orders...', 'success');

      setTimeout(() => {
        window.location.href = '/users/order';
      }, 1500);
    } catch (error) {
      showToast(error.message || 'Wallet payment failed. Please try again.', 'error');
      console.error('Wallet payment error:', error);

      if (placeOrderBtn) {
        placeOrderBtn.disabled = false;
        placeOrderBtn.innerHTML = 'Place Order <i class="fas fa-arrow-right"></i>';
      }
    }
  }

  async function handleCODPayment(orderData) {
    try {
      showToast('Processing your order...', 'info');

      const response = await fetch('/users/checkout/place-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });

      const responseData = await response.json();

      if (!response.ok) {
        if (responseData.stock === 'out') {
          showToast('Some items in your cart are out of stock.', 'error');

          setTimeout(() => {
            window.location.href = '/users/cart';
          }, 1500);

          return;
        }

        throw new Error(responseData.error || 'Order placement failed');
      }

      showToast('Order placed successfully! Redirecting...', 'success');

      setTimeout(() => {
        window.location.href = '/users/order';
      }, 1500);
    } catch (error) {
      showToast(error.message || 'Failed to place order. Please try again.', 'error');
      console.error('COD payment error:', error);
    }
  }

  async function selectAddress(addressId) {
    try {
      showToast('Updating selected address...', 'info');

      const response = await fetch(`/users/checkout/addresses/${addressId}/select`, {
        method: 'PATCH'
      });

      if (!response.ok) {
        throw new Error('Failed to select address');
      }

      await updateAddressList();
      showToast('Delivery address updated successfully.', 'success');
    } catch (error) {
      showToast('Failed to update delivery address. Please try again.', 'error');
      console.error('Address selection error:', error);
    }
  }

  function setupFormSubmissionHandlers() {
    const addAddressForm = document.getElementById('addAddressForm');

    if (!addAddressForm) return;

    addAddressForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      try {
        showToast('Adding new address...', 'info');

        const formData = {
          name: document.getElementById('name')?.value.trim(),
          street: document.getElementById('street')?.value.trim(),
          city: document.getElementById('city')?.value.trim(),
          state: document.getElementById('state')?.value.trim(),
          postalCode: document.getElementById('zip')?.value.trim()
        };

        if (!formData.name || !formData.street || !formData.city || !formData.state || !formData.postalCode) {
          showToast('Please fill all address fields.', 'warning');
          return;
        }

        const response = await fetch('/users/checkout/addresses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });

        if (!response.ok) {
          throw new Error('Failed to add address');
        }

        showToast('Address added successfully.', 'success');
        closeAddressModal();

        await fetchAddresses();
        addAddressForm.reset();
      } catch (error) {
        showToast('Failed to add address. Please try again.', 'error');
        console.error('Add address error:', error);
      }
    });
  }

  function setupModalCloseHandlers() {
    document.addEventListener('click', (event) => {
      if (event.target.classList.contains('modal')) {
        closeAddressModal();
      }
    });
  }

  function getTotalAmount() {
    const totalAmountElement = document.getElementById('totalAmount');

    if (!totalAmountElement) return 0;

    return Number.parseFloat(totalAmountElement.textContent.replace(/[₹,\s]/g, '')) || 0;
  }

  function showToast(message, type = 'info') {
    let toastContainer = document.querySelector('.toast-container');

    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container';
      document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    setTimeout(() => {
      toast.classList.remove('show');

      setTimeout(() => {
        toast.remove();

        if (!toastContainer.children.length) {
          toastContainer.remove();
        }
      }, 300);
    }, 3200);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function initializeCanvas() {
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let mousePosition = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    };

    function setCanvasSize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    class Particle {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2.2 + 0.6;
        this.speedX = Math.random() * 0.6 - 0.3;
        this.speedY = Math.random() * 0.6 - 0.3;
        this.life = 0;
        this.maxLife = Math.random() * 220 + 120;

        const colors = [
          'rgba(16, 110, 190, 0.22)',
          'rgba(24, 128, 212, 0.2)',
          'rgba(15, 252, 190, 0.18)',
          'rgba(96, 200, 245, 0.2)'
        ];

        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life += 1;

        if (
          this.life >= this.maxLife ||
          this.x < 0 ||
          this.x > canvas.width ||
          this.y < 0 ||
          this.y > canvas.height
        ) {
          this.reset();
        }
      }

      draw() {
        const opacity = 1 - this.life / this.maxLife;

        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    setCanvasSize();

    const particles = Array.from({ length: 85 }, () => new Particle());

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        particle.update();
        particle.draw();
      });

      const mouseGradient = ctx.createRadialGradient(
        mousePosition.x,
        mousePosition.y,
        0,
        mousePosition.x,
        mousePosition.y,
        190
      );

      mouseGradient.addColorStop(0, 'rgba(15, 252, 190, 0.12)');
      mouseGradient.addColorStop(0.45, 'rgba(16, 110, 190, 0.08)');
      mouseGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = mouseGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      requestAnimationFrame(animate);
    }

    window.addEventListener('resize', setCanvasSize);

    window.addEventListener('mousemove', (event) => {
      mousePosition = {
        x: event.clientX,
        y: event.clientY
      };
    });

    animate();
  }

  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    showToast('An unexpected error occurred. Please try again.', 'error');
  });
});