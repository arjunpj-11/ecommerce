// Constants
const RAZORPAY_KEY = 'rzp_test_EoM9R5cEQq0ViU';
const ANIMATION_COLORS = [
    'hsla(45, 100%, 50%, 0.2)',
    'hsla(280, 70%, 40%, 0.2)',
    'hsla(350, 70%, 40%, 0.2)'
];

// Toast Notification System
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Remove toast after animation
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// Utility Functions
function loadRazorpay() {
    return new Promise((resolve, reject) => {
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

// Modal Functions
function closeAddressModal() {
    const modal = document.getElementById('addressModal');
    if (modal) modal.style.display = 'none';
}


function showAddAddressModal() {
    const modal = document.getElementById('addressModal');
    if (modal) {
        modal.style.display = 'flex';
    } else {
        showToast('Could not open address form. Please refresh the page.', 'error');
    }
}

// Address Management Functions
async function fetchAddresses() {
    try {
        const response = await fetch('/users/checkout/addresses');
        if (!response.ok) throw new Error('Failed to fetch addresses');
        
        const addresses = await response.json();
        const addressList = document.querySelector('.address-list');
        if (!addressList) {
            showToast('Address list container not found. Please refresh the page.', 'error');
            return;
        }

        addressList.innerHTML = addresses.map(address => `
            <div class="address-card" data-address-id="${address._id}">
                <input type="radio" name="shipping-address" 
                       value="${address._id}" 
                       ${address.isPrimary ? 'checked' : ''}>
                <div class="address-details">
                    <h3>${address.street}</h3>
                    <p>${address.city}, ${address.state} ${address.postalCode}</p>
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
    document.querySelectorAll('.address-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('.address-actions')) return;
            document.querySelectorAll('.address-card').forEach(c => 
                c.classList.remove('selected'));
            card.classList.add('selected');
            const radio = card.querySelector('input[type="radio"]');
            if (radio) radio.checked = true;
        });
    });
}

async function updateAddressList() {
    try {
        const response = await fetch('/users/checkout/addresses/primary');
        if (!response.ok) {
            if (response.status === 404) {
                showToast('Please select a primary address to continue', 'warning');
                return;
            }
            throw new Error('Failed to update address list');
        }

        const address = await response.json();
        const addressList = document.querySelector('.address-list');
        if (!addressList) {
            showToast('Address list container not found. Please refresh the page.', 'error');
            return;
        }

        addressList.innerHTML = `
            <div class="address-card selected">
                <h3>${address.street}</h3>
                <p>${address.city}, ${address.state} ${address.postalCode}</p>
            </div>
        `;
    } catch (error) {
        showToast(error.message, 'error');
        console.error('Address update error:', error);
    }
}

// Payment Method Handling
// Payment Method Handling
function initializePaymentMethods() {
    const totalAmountElement = document.getElementById('totalAmount');
    if (!totalAmountElement) {
        showToast('Could not determine order amount', 'error');
        return;
    }

    const totalAmount = parseFloat(totalAmountElement.textContent.slice(1));
    const isCODAllowed = totalAmount <= 1000;

    // Get COD payment method element
    const codMethod = document.querySelector('.payment-method[data-method="cod"]');
    if (codMethod) {
        const codRadio = codMethod.querySelector('input[type="radio"]');
        const codLabel = codMethod.querySelector('label');

        if (!isCODAllowed) {
            // Disable COD for orders above $1000
            codRadio.disabled = true;
            codMethod.classList.add('disabled');
            
            // Add message explaining why COD is disabled
            const warningMessage = document.createElement('p');
            warningMessage.className = 'text-red-500 text-sm mt-1';
            warningMessage.textContent = 'Cash on Delivery not available for orders above ₹1,000';
            codLabel.appendChild(warningMessage);
        }
    }

    // Add click handlers for all payment methods
    document.querySelectorAll('.payment-method').forEach(method => {
        method.addEventListener('click', () => {
            const radio = method.querySelector('input[type="radio"]');
            
            // Check if method is COD and if total amount exceeds limit
            if (method.dataset.method === 'cod' && !isCODAllowed) {
                showToast('Cash on Delivery is not available for orders above ₹1,000', 'warning');
                return;
            }
            
            if (radio?.disabled) {
                showToast('This payment method is not available', 'warning');
                return;
            }
            
            document.querySelectorAll('.payment-method').forEach(m => 
                m.classList.remove('selected'));
            method.classList.add('selected');
            if (radio) radio.checked = true;
        });
    });
}
// Background Animation Class
class Particle {
    constructor(canvas) {
        this.canvas = canvas;
        this.reset();
    }

    reset() {
        this.x = Math.random() * this.canvas.width;
        this.y = Math.random() * this.canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = Math.random() * 1 - 0.5;
        this.speedY = Math.random() * 1 - 0.5;
        this.life = 0;
        this.maxLife = Math.random() * 200 + 100;
        this.color = ANIMATION_COLORS[Math.floor(Math.random() * ANIMATION_COLORS.length)];
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life++;

        if (this.life >= this.maxLife ||
            this.x < 0 || this.x > this.canvas.width ||
            this.y < 0 || this.y > this.canvas.height) {
            this.reset();
        }
    }

    draw(ctx) {
        const opacity = 1 - (this.life / this.maxLife);
        ctx.fillStyle = this.color.replace('0.2', opacity * 0.2);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Payment Handler Functions
async function handleRazorpayPayment(orderData) {
    try {
        await loadRazorpay();

        const response = await fetch('/users/checkout/create-razorpay-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        if (!response.ok) throw new Error('Failed to create order');

        const { order, userInfo } = await response.json();

        const options = {
            key: RAZORPAY_KEY,
            amount: order.amount,
            currency: order.currency,
            name: 'ARNI',
            description: 'Purchase Payment',
            order_id: order.id,
            prefill: {
                name: userInfo.name,
                email: userInfo.email,
                contact: userInfo.phone
            },
            handler: async function(response) {
                handlePaymentCompletion(orderData, response);
            },
            modal: {
                ondismiss: async function() {
                    // Create failed order when modal is dismissed
                    handlePaymentCompletion(orderData, {
                        razorpay_order_id: order.id,
                        razorpay_payment_id: null,
                        razorpay_signature: null
                    });
                }
            }
        };

        const rzp = new Razorpay(options);
        rzp.open();
    } catch (error) {
        showToast('Payment initialization failed', 'error');
        console.error('Razorpay error:', error);
    }
}

// Separate function to handle payment completion
async function handlePaymentCompletion(orderData, paymentResponse) {
    try {
        showToast('Processing payment...', 'info');
        const verifyResponse = await fetch('/users/checkout/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
        showToast('Payment processing failed. Redirecting...', 'error');
        window.location.href = '/users/order';
    }
}
async function handleWalletPayment(orderData) {
    try {
        const totalAmountElement = document.getElementById('totalAmount');
        if (!totalAmountElement) {
            showToast('Could not determine order amount. Please refresh the page.', 'error');
            return;
        }

        const totalAmount = parseFloat(totalAmountElement.textContent.slice(1));
        const placeOrderBtn = document.getElementById('placeOrderBtn');
        
        if (placeOrderBtn) {
            placeOrderBtn.disabled = true;
            placeOrderBtn.textContent = 'Processing...';
        }

        showToast('Processing wallet payment...', 'info');

        const response = await fetch('/users/checkout/wallet/pay', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: totalAmount,
                shippingAddressId: orderData.shippingAddressId
            })
        });

        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Payment failed');
        }

        showToast('Payment successful! Redirecting to orders page...', 'success');
        setTimeout(() => {
            window.location.href = '/users/order';
        }, 1500);

    } catch (error) {
        showToast(error.message || 'Wallet payment failed. Please try again.', 'error');
        console.error('Wallet Payment Error:', error);
        
        const placeOrderBtn = document.getElementById('placeOrderBtn');
        if (placeOrderBtn) {
            placeOrderBtn.disabled = false;
            placeOrderBtn.textContent = 'Place Order';
        }
    }
}

async function handleCODPayment(orderData) {
    try {
        showToast('Processing your order...', 'info');
        
        const response = await fetch('/users/checkout/place-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        const responseData = await response.json();

        if (!response.ok) {
            if (responseData.stock === "out") {
                showToast('Some items in your cart are out of stock', 'error');
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
        console.error('COD Payment Error:', error);
    }
}

// Initialize Everything
async function initializeCheckout() {
    try {
        // Initialize animations for elements
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        });

        document.querySelectorAll('.section-title, .category, .product-card, .blog-card').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'all 0.6s ease-out';
            observer.observe(el);
        });

        // Initialize wallet payment
        await initializeWalletPayment();

        // Initialize address fetching and payment methods
        await fetchAddresses();
        initializePaymentMethods();

        // Setup place order button
        setupPlaceOrderButton();

        // Setup modal close handlers
        setupModalCloseHandlers();

        showToast('Checkout page loaded successfully', 'success');
    } catch (error) {
        showToast('Failed to initialize checkout. Please refresh the page.', 'error');
        console.error('Initialization error:', error);
    }
}

function setupPlaceOrderButton() {
    const placeOrderBtn = document.getElementById('placeOrderBtn');
    if (placeOrderBtn) {
        placeOrderBtn.addEventListener('click', async (e) => {
            e.preventDefault();

            const selectedAddressRadio = document.querySelector('input[name="shipping-address"]:checked');
            const selectedPaymentMethod = document.querySelector('input[name="payment"]:checked')?.value;
            const totalAmount = parseFloat(document.getElementById('totalAmount')?.textContent.slice(1) || '0');

            if (!selectedAddressRadio) {
                showToast('Please select a shipping address', 'warning');
                return;
            }

            if (!selectedPaymentMethod) {
                showToast('Please select a payment method', 'warning');
                return;
            }

            // Double-check COD restriction
            if (selectedPaymentMethod === 'cod' && totalAmount > 1000) {
                showToast('Cash on Delivery is not available for orders above ₹1,000', 'error');
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
                        showToast('Invalid payment method selected', 'error');
                }
            } catch (error) {
                showToast('Failed to process order. Please try again.', 'error');
                console.error('Order Placement Error:', error);
            }
        });
    } else {
        showToast('Place order button not found. Please refresh the page.', 'error');
    }
}

function setupModalCloseHandlers() {
    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    };

    // Add escape key handler for modals
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        }
    });
}

// Address Edit Function
async function editAddress(addressId) {
    try {
        showToast('Loading address details...', 'info');
        
        const response = await fetch(`/users/checkout/addresses/${addressId}`);
        if (!response.ok) throw new Error('Failed to fetch address details');
        
        const address = await response.json();
        
        // Populate edit form
        const editForm = document.getElementById('editAddressForm');
        if (!editForm) {
            showToast('Edit form not found. Please refresh the page.', 'error');
            return;
        }

        document.getElementById('editAddressId').value = addressId;
        document.getElementById('editName').value = address.name;
        document.getElementById('editStreet').value = address.street;
        document.getElementById('editCity').value = address.city;
        document.getElementById('editState').value = address.state;
        document.getElementById('editZip').value = address.postalCode;
        document.getElementById('editPhone').value = address.phone;

        // Show edit modal
        const editModal = document.getElementById('editAddressModal');
        if (editModal) {
            editModal.style.display = 'flex';
        } else {
            showToast('Edit modal not found. Please refresh the page.', 'error');
        }
    } catch (error) {
        showToast('Failed to load address details. Please try again.', 'error');
        console.error('Edit address error:', error);
    }
}

// Address Selection Function
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
        showToast('Delivery address updated successfully', 'success');
    } catch (error) {
        showToast('Failed to update delivery address. Please try again.', 'error');
        console.error('Address selection error:', error);
    }
}

// Wallet Payment Initialization
async function initializeWalletPayment() {
    try {
        const response = await fetch('/users/checkout/wallet/balance');
        if (!response.ok) throw new Error('Failed to fetch wallet balance');
        
        const { balance } = await response.json();
        const paymentMethodsDiv = document.querySelector('.payment-methods');
        if (!paymentMethodsDiv) return;

        const totalAmountElement = document.getElementById('totalAmount');
        if (!totalAmountElement) {
            showToast('Could not determine order amount', 'error');
            return;
        }

        const totalAmount = parseFloat(totalAmountElement.textContent.slice(1));
        const hasEnoughBalance = balance >= totalAmount;

        const walletMethod = document.createElement('div');
        walletMethod.className = 'payment-method';
        walletMethod.dataset.method = 'wallet';
        
        walletMethod.innerHTML = `
            <input type="radio" name="payment" value="wallet" id="wallet" 
                   ${!hasEnoughBalance ? 'disabled' : ''}>
            <label for="wallet" class="${!hasEnoughBalance ? 'opacity-50' : ''}">
                <h3>Pay with Wallet</h3>
                <p>Available Balance: ₹${balance.toFixed(2)}</p>
                ${!hasEnoughBalance ? 
                    `<p class="text-red-500 text-sm mt-1">
                        Insufficient balance for this order
                    </p>` : ''}
            </label>
        `;
        
        paymentMethodsDiv.appendChild(walletMethod);

        // Add click handler for payment method selection
        walletMethod.addEventListener('click', function() {
            if (!hasEnoughBalance) {
                showToast('Insufficient wallet balance', 'warning');
                return;
            }
            
            document.querySelectorAll('.payment-method').forEach(method => 
                method.classList.remove('selected'));
            this.classList.add('selected');
            const radio = this.querySelector('input[type="radio"]');
            if (radio) radio.checked = true;
        });

    } catch (error) {
        showToast('Failed to initialize wallet payment', 'error');
        console.error('Wallet initialization error:', error);
    }
}

// Form Submission Handlers
function setupFormSubmissionHandlers() {
    // Add new address form handler
    const addAddressForm = document.getElementById('addAddressForm');
    if (addAddressForm) {
        addAddressForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                showToast('Adding new address...', 'info');
                
                const formData = {
                    name: document.getElementById('name').value,
                    street: document.getElementById('street').value,
                    city: document.getElementById('city').value,
                    state: document.getElementById('state').value,
                    postalCode: document.getElementById('zip').value,
                };

                const response = await fetch('/users/checkout/addresses', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                if (!response.ok) throw new Error('Failed to add address');

                showToast('Address added successfully', 'success');
                closeAddressModal();
                await fetchAddresses();
                addAddressForm.reset();
            } catch (error) {
                showToast('Failed to add address. Please try again.', 'error');
                console.error('Add address error:', error);
            }
        });
    }

}
// Error Handling for Failed Requests
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    showToast('An unexpected error occurred. Please try again.', 'error');
});

// Cleanup Function for Page Unload
window.addEventListener('beforeunload', function() {
    if (window.currentAnimation) {
        cancelAnimationFrame(window.currentAnimation);
    }
});

// Initialize on DOM Content Loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeCheckout();
    setupFormSubmissionHandlers();
});

// Export functions for global access
window.showAddAddressModal = showAddAddressModal;
window.closeAddressModal = closeAddressModal;
window.selectAddress = selectAddress;

