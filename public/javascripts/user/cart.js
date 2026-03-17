 // Background canvas animation
 const canvas = document.getElementById('backgroundCanvas');
 const ctx = canvas.getContext('2d');
 let mousePosition = { x: 0, y: 0 };

 function setCanvasSize() {
     canvas.width = window.innerWidth;
     canvas.height = window.innerHeight;
 }
 setCanvasSize();
 window.addEventListener('resize', setCanvasSize);

 class Particle {
     constructor() {
         this.reset();
     }

     reset() {
         this.x = Math.random() * canvas.width;
         this.y = Math.random() * canvas.height;
         this.size = Math.random() * 2 + 0.5;
         this.speedX = Math.random() * 1 - 0.5;
         this.speedY = Math.random() * 1 - 0.5;
         this.life = 0;
         this.maxLife = Math.random() * 200 + 100;
         const colors = [
             'hsla(45, 100%, 50%, 0.2)',  // Gold
             'hsla(280, 70%, 40%, 0.2)',  // Deep Purple
             'hsla(350, 70%, 40%, 0.2)'   // Dark Red
         ];
         this.color = colors[Math.floor(Math.random() * colors.length)];
     }

     update() {
         this.x += this.speedX;
         this.y += this.speedY;
         this.life++;

         if (this.life >= this.maxLife ||
             this.x < 0 || this.x > canvas.width ||
             this.y < 0 || this.y > canvas.height) {
             this.reset();
         }
     }

     draw() {
         const opacity = 1 - (this.life / this.maxLife);
         ctx.fillStyle = this.color.replace('0.2', opacity * 0.2);
         ctx.beginPath();
         ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
         ctx.fill();
     }
 }

 const particles = Array.from({ length: 100 }, () => new Particle());

 function animate() {
     ctx.fillStyle = 'rgba(18, 18, 18, 0.1)';
     ctx.fillRect(0, 0, canvas.width, canvas.height);

     particles.forEach(particle => {
         particle.update();
         particle.draw();
     });

     const mouseGradient = ctx.createRadialGradient(
         mousePosition.x, mousePosition.y, 0,
         mousePosition.x, mousePosition.y, 150
     );
     mouseGradient.addColorStop(0, 'rgba(255, 215, 0, 0.1)');
     mouseGradient.addColorStop(1, 'rgba(18, 18, 18, 0)');
     ctx.fillStyle = mouseGradient;
     ctx.fillRect(0, 0, canvas.width, canvas.height);

     requestAnimationFrame(animate);
 }

 window.addEventListener('mousemove', (e) => {
     mousePosition = { x: e.clientX, y: e.clientY };
 });

 animate();


 // Update the updateQuantity function to also pass the size parameter
 async function updateQuantity(variantId, change, size) {
    const input = document.getElementById(`quantity-${variantId}`);
    let value = parseInt(input.value) + change;
    if (value < 1) value = 1;
    
    // Get the size from the correct element
    const sizeElement = input.closest('.cart-item').querySelector('#size');
    const size2 = sizeElement ? sizeElement.textContent.trim() : size;
    
    try {
        const response = await fetch('/users/cart/update-quantity', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                variantId,
                quantity: value,
                size2
            })
        });

        if (!response.ok) {
            const error = await response.json();
            showToast(error.error || 'Error updating quantity', 'error');
            return;
        }

        input.value = value;
        updateCartTotals();
        showToast('Quantity updated successfully', 'success');

    } catch (error) {
        console.error('Error:', error);
        showToast('Error updating quantity', 'error');
    }
}

async function removeItem(event, variantId) {
    event.preventDefault();
    try {
        const response = await fetch('/users/cart/remove-item', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ variantId })
        });

        if (!response.ok) {
            throw new Error('Failed to remove item');
        }

        const item = event.target.closest('.cart-item');
        item.style.opacity = 0;
        setTimeout(() => {
            item.remove();
            if (document.querySelectorAll('.cart-item').length === 0) {
                location.reload();
            } else {
                updateCartTotals();
            }
        }, 300);
    } catch (error) {
        console.error('Error:', error);
        alert('Error removing item');
    }
}

function toggleCoupons() {
    const suggestions = document.getElementById('couponSuggestions');
    suggestions.classList.toggle('active');
}

function selectCoupon(code) {
    const input = document.getElementById('couponInput');
    input.value = code;
    toggleCoupons();
    applyCoupon();
}

// Add to your existing cart.js file

async function applyCoupon() {
    const input = document.getElementById('couponInput');
    const couponStatus = document.getElementById('couponStatus');
    const totalAmount = document.getElementById('totalAmount');
    
    try {
        const response = await fetch('/users/cart/apply-coupon', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                code: input.value
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error);
        }

        couponStatus.textContent = `-$${data.discount.toFixed(2)}`;
        totalAmount.textContent = `$${data.total.toFixed(2)}`;
        input.style.borderColor = '#4CAF50';
        
        // Add clear coupon button
        const couponSection = document.querySelector('.coupon-section');
        if (!document.querySelector('.clear-coupon-btn')) {
            const clearBtn = document.createElement('button');
            clearBtn.className = 'clear-coupon-btn';
            clearBtn.textContent = 'Clear Coupon';
            clearBtn.onclick = clearCoupon;
            couponSection.appendChild(clearBtn);
        }
        
        showToast('Coupon applied successfully!', 'success');
        
        // Disable input and apply button
        input.disabled = true;
        document.querySelector('.redeem-btn').disabled = true;
        
    } catch (error) {
        console.error('Error:', error);
        couponStatus.textContent = 'No discount applied';
        input.style.borderColor = '#f44336';
        showToast(error.message || 'Invalid coupon code', 'error');
        
        setTimeout(() => {
            input.style.borderColor = '#333';
        }, 2000);
    }
}

async function clearCoupon() {
    try {
        const response = await fetch('/users/cart/clear-coupon', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error);
        }

        // Reset UI elements
        const couponStatus = document.getElementById('couponStatus');
        const totalAmount = document.getElementById('totalAmount');
        const input = document.getElementById('couponInput');
        
        couponStatus.textContent = 'No discount applied';
        totalAmount.textContent = `$${data.total.toFixed(2)}`;
        
        // Enable input and apply button
        input.disabled = false;
        input.value = '';
        input.style.borderColor = '#333';
        document.querySelector('.redeem-btn').disabled = false;
        
        // Remove clear button
        const clearBtn = document.querySelector('.clear-coupon-btn');
        if (clearBtn) {
            clearBtn.remove();
        }
        
        showToast('Coupon removed successfully', 'success');
        
    } catch (error) {
        console.error('Error:', error);
        showToast(error.message || 'Error clearing coupon', 'error');
    }
}

async function clearCoupon2() {
    try {
        const response = await fetch('/users/cart/clear-coupon', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error);
        }

        // Reset UI elements
        const couponStatus = document.getElementById('couponStatus');
        const totalAmount = document.getElementById('totalAmount');
        const input = document.getElementById('couponInput');
        
        couponStatus.textContent = 'No discount applied';
        totalAmount.textContent = `$${data.total.toFixed(2)}`;
        
        // Enable input and apply button
        input.disabled = false;
        input.value = '';
        input.style.borderColor = '#333';
        document.querySelector('.redeem-btn').disabled = false;
        
        // Remove clear button
        const clearBtn = document.querySelector('.clear-coupon-btn');
        if (clearBtn) {
            clearBtn.remove();
        }
        
    } catch (error) {
        console.error('Error:', error);
    }
}


clearCoupon2() 
// Add these styles to your CSS
const styles = document.createElement('style');
styles.textContent = `
    .clear-coupon-btn {
        background: #f44336;
        color: white;
        border: none;
        padding: 12px 24px;
        cursor: pointer;
        border-radius: 4px;
        margin-left: 10px;
        transition: background 0.2s;
    }

    .clear-coupon-btn:hover {
        background: #d32f2f;
    }

    .redeem-btn:disabled,
    .coupon-input:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
`;
document.head.appendChild(styles);

function showToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Add toast styles
const toastStyles = document.createElement('style');
toastStyles.textContent = `
    .toast {
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 24px;
        border-radius: 4px;
        color: white;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    }

    .toast.success {
        background-color: #4CAF50;
    }

    .toast.error {
        background-color: #f44336;
    }

    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(toastStyles);

async function updateSize(variantId, newSize) {
    try {
        const response = await fetch('/users/cart/update-size', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                variantId,
                newSize
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error);
        }

        // Update UI to reflect new size availability
        const quantityInput = document.getElementById(`quantity-${variantId}`);
        const quantityBtns = quantityInput.parentElement.querySelectorAll('button');
        
        if (data.availableStock === 0) {
            quantityInput.disabled = true;
            quantityBtns.forEach(btn => btn.disabled = true);
            showToast('Selected size is out of stock', 'error');
        } else {
            quantityInput.disabled = false;
            quantityBtns.forEach(btn => btn.disabled = false);
            showToast('Size updated successfully', 'success');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast(error.message, 'error');
    }
}

function updateCartTotals() {
    let subtotal = 0;
    const shippingFee = 20;
    
    // Calculate subtotal from all cart items
    document.querySelectorAll('.cart-item').forEach(item => {
        const quantity = parseInt(item.querySelector('.quantity-input').value);
        const priceElement = item.querySelector('.item-price');
        
        if (priceElement) {
            const priceText = priceElement.textContent;
            // Extract just the number from the price text (handles ₹ symbol)
            const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
            
            if (!isNaN(price)) {
                subtotal += price * quantity;
            } else {
                console.error('Invalid price format:', priceText);
            }
        }
    });

    // Update subtotal display
    const summaryRows = document.querySelectorAll('.summary-row');
    if (summaryRows.length > 0) {
        summaryRows[0].querySelector('span:last-child').textContent = `₹${subtotal.toFixed(2)}`;
    }

    // Get current discount if any
    const discountElement = document.getElementById('couponStatus');
    let discount = 0;
    if (discountElement && discountElement.textContent !== 'No discount applied') {
        // Extract just the number from the discount text
        const discountMatch = discountElement.textContent.match(/[0-9.]+/);
        if (discountMatch) {
            discount = parseFloat(discountMatch[0]);
        }
    }

    // Calculate and update total
    const total = subtotal + shippingFee - discount;
    const totalElement = document.getElementById('totalAmount');
    if (totalElement) {
        totalElement.textContent = `₹${total.toFixed(2)}`;
    }
}

function proceedToCheckout() {
    const outOfStockItems = document.querySelectorAll('.out-of-stock-item');
    if (outOfStockItems.length > 0) {
        showToast('Please adjust quantities for out of stock items', 'error');
        return;
    }

    const discountElement = document.getElementById('couponStatus');
    const discountText = discountElement.textContent;
    let discountAmount = 0;
    
    if (discountText !== 'No discount applied') {
        discountAmount = Math.abs(parseFloat(discountText.replace('-$', '')));
        window.location.href = `/users/checkout?discount=${discountAmount.toFixed(2)}`;
    } else {
        window.location.href = '/users/checkout';
    }
}