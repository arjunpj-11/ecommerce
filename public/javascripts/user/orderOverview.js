// public/javascripts/user/orderOverview.js

document.addEventListener('DOMContentLoaded', function() {
    // Initialize Razorpay
    const rzp = new Razorpay({
        key: 'rzp_test_EoM9R5cEQq0ViU'
    });

    // Background canvas animation
    const canvas = document.getElementById('backgroundCanvas');
    const ctx = canvas.getContext('2d');
    
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    const particles = [];
    for(let i = 0; i < 50; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 3 + 1,
            speedX: Math.random() * 2 - 1,
            speedY: Math.random() * 2 - 1
        });
    }
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(particle => {
            particle.x += particle.speedX;
            particle.y += particle.speedY;
            
            if(particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1;
            if(particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1;
            
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(200, 200, 255, 0.5)';
            ctx.fill();
        });
        
        requestAnimationFrame(animate);
    }
    
    animate();
});

const path = window.location.pathname; // Get the path from the URL
const segments = path.split('/'); // Split the path by "/"
const id = segments.pop(); // Get the last segment


// Payment Functions
function retryPayment(orderId) {
    fetch(`/users/orderOverview/${id}/retry-payment`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            const options = {
                key: data.key_id || process.env.RAZORPAY_KEY_ID,
                amount: data.order.amount,
                currency: data.order.currency,
                order_id: data.order.id,
                name: 'ARNI',
                description: 'Order Payment Retry',
                handler: function(response) {
                    verifyRetryPayment(response, orderId);
                },
                prefill: {
                    name: document.getElementById('userName')?.value || '',
                    email: document.getElementById('userEmail')?.value || '',
                    contact: document.getElementById('userPhone')?.value || ''
                },
                theme: {
                    color: '#4a90e2'
                },
                modal: {
                    ondismiss: function() {
                        console.log('Payment window closed');
                    }
                }
            };
            
            const rzp = new Razorpay(options);
            rzp.on('payment.failed', function(response) {
                handleError(response.error, 'Payment failed');
            });
            rzp.open();
        } else {
            throw new Error(data.message || 'Failed to initialize payment');
        }
    })
    .catch(error => {
        handleError(error, 'Payment initialization failed');
    });
}

function verifyRetryPayment(response, orderId) {
    fetch('/users/orderOverview/verify-retry-payment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            orderId: id
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            Swal.fire({
                title: 'Success!',
                text: 'Payment successful',
                icon: 'success',
                confirmButtonText: 'OK'
            }).then(() => {
                window.location.reload();
            });
        } else {
            Swal.fire('Error', 'Payment verification failed', 'error');
        }
    })
    .catch(error => {
        console.error('Verification Error:', error);
        Swal.fire('Error', 'Payment verification failed', 'error');
    });
}

function cancelOrder(orderId) {
    Swal.fire({
        title: 'Cancel Order',
        text: 'Please provide a reason for cancellation:',
        input: 'text',
        showCancelButton: true,
        confirmButtonText: 'Submit',
        showLoaderOnConfirm: true,
        preConfirm: (reason) => {
            return fetch(`/users/orderOverview/${id}/cancel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reason })
            })
            .then(response => response.json())
            .then(data => {
                if (!data.success) {
                    throw new Error('Cancellation failed');
                }
                return data;
            });
        }
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire('Cancelled!', 'Your order has been cancelled.', 'success')
            .then(() => {
                window.location.reload();
            });
        }
    });
}

function requestRefund(orderId, paymentMethod) {
    Swal.fire({
        title: 'Request Refund',
        text: 'Please provide a reason for the refund:',
        input: 'text',
        showCancelButton: true,
        confirmButtonText: 'Submit',
        showLoaderOnConfirm: true,
        preConfirm: (reason) => {
            return fetch(`/users/orderOverview/${id}/refund`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reason })
            })
            .then(response => response.json())
            .then(data => {
                if (!data.success) {
                    throw new Error(data.message || 'Refund request failed');
                }
                return data;
            });
        }
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire('Submitted!', 'Your refund request has been submitted.', 'success')
            .then(() => {
                window.location.reload();
            });
        }
    }).catch(error => {
        Swal.fire('Error', error.message, 'error');
    });
}

// Timeline animation
document.querySelectorAll('.timeline-item').forEach((item, index) => {
    setTimeout(() => {
        item.classList.add('animate');
    }, index * 300);
});

// Add to cart functionality
function updateQuantity(change) {
    const quantityInput = document.getElementById('quantity');
    let newQuantity = parseInt(quantityInput.value) + change;
    if (newQuantity < 1) newQuantity = 1;
    if (newQuantity > 10) newQuantity = 10;
    quantityInput.value = newQuantity;
    updateTotal();
}

function updateTotal() {
    const quantity = parseInt(document.getElementById('quantity').value);
    const price = parseFloat(document.getElementById('price').dataset.price);
    const shipping = 20;
    const total = (quantity * price) + shipping;
    document.getElementById('totalPrice').textContent = `$${total.toFixed(2)}`;
}

// Copy order ID to clipboard
function copyOrderId() {
    const orderId = document.querySelector('.order-title').textContent.split('#')[1];
    navigator.clipboard.writeText(orderId).then(() => {
        Swal.fire({
            title: 'Copied!',
            text: 'Order ID copied to clipboard',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
        });
    });
}

// Handle scroll animations
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, {
    threshold: 0.1
});

document.querySelectorAll('.animate-on-scroll').forEach((element) => {
    observer.observe(element);
});

// Error handling function
function handleError(error, message = 'An error occurred') {
    console.error(error);
    Swal.fire('Error', message, 'error');
}

// Initialize tooltips
const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
});