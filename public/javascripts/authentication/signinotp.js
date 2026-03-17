// Wait for the DOM to fully load before executing the script
document.addEventListener('DOMContentLoaded', () => {
    // Select all input fields for OTP
    const otpInputs = document.querySelectorAll('.otp-inputs input');
  
    // Loop through each OTP input field
    otpInputs.forEach((input, index) => {
        // Add an input event listener to each input field
        input.addEventListener('input', (e) => {
            const value = e.target.value;
  
            // Allow only one digit in the input field
            e.target.value = value.replace(/[^0-9]/g, '').slice(0, 1);
  
            // Move to the next input if there's a value
            if (value && index < otpInputs.length - 1) {
                otpInputs[index + 1].focus();
            }
        });
  
        // Add a keydown event listener to handle backspace
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace') {
                // Clear the current box and move to the previous one if it's empty
                if (!e.target.value && index > 0) {
                    otpInputs[index - 1].focus();
                }
            }
        });
  
        // Add a paste event listener to handle pasted data
        input.addEventListener('paste', (e) => {
            e.preventDefault(); // Prevent the default paste action
            const pastedData = e.clipboardData.getData('text').slice(0, otpInputs.length);
            // Check if the pasted data is numeric
            if (/^\d+$/.test(pastedData)) {
                otpInputs.forEach((input, i) => {
                    input.value = pastedData[i] || ''; // Fill the inputs with pasted data
                });
                otpInputs[Math.min(pastedData.length, otpInputs.length - 1)].focus(); // Focus on the last filled input
            }
        });
    });
});

// Toast Alert Function
function showToast(message, type = 'info') {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
        `;
        document.body.appendChild(toastContainer);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.style.cssText = `
        background-color: ${
            type === 'success' ? '#4CAF50' : 
            type === 'error' ? '#F44336' : 
            '#2196F3'
        };
        color: white;
        padding: 15px;
        border-radius: 5px;
        margin: 10px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease-in-out;
    `;
    toast.textContent = message;

    // Append toast to container
    toastContainer.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
    });

    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            toastContainer.removeChild(toast);
        }, 300);
    }, 3000);
}

// Timer for Resend OTP
let countdown = 60; // Timer duration in seconds
const resendBtn = document.getElementById('resendBtn'); // Resend button
const timerDisplay = document.getElementById('timer'); // Timer display element

// Initialize localStorage values if not already set
if (!localStorage.getItem('count')) localStorage.setItem('count', 0);
if (!localStorage.getItem('expiryTime')) localStorage.setItem('expiryTime', 0);

// Function to start the timer
function startTimer() {
    const count = parseInt(localStorage.getItem('count'), 10);

    // Check if user hit resend limit
    if (count >= 5) {
        const currentTime = new Date().getTime();
        const expiryTime = parseInt(localStorage.getItem('expiryTime'), 10);

        // If the current time is less than the expiry time, show remaining time
        if (currentTime < expiryTime) {
            const remainingTime = Math.ceil((expiryTime - currentTime) / 1000);
            timerDisplay.textContent = `Try again after ${Math.floor(remainingTime / 60)} minutes`;
            resendBtn.style.pointerEvents = 'none'; // Disable button
            resendBtn.style.color = '#C4AA7B'; // Muted color for disabled state
            return;
        } else {
            // Reset count if expiry time has passed
            localStorage.setItem('count', 0);
            localStorage.removeItem('expiryTime');
        }
    }

    // Start the countdown
    resendBtn.style.pointerEvents = 'none'; // Disable button
    resendBtn.style.color = '#C4AA7B'; // Muted color for disabled state

    const timerInterval = setInterval(() => {
        timerDisplay.textContent = `Resend available in ${countdown}s`;
        countdown--;

        // When countdown reaches zero
        if (countdown < 0) {
            clearInterval(timerInterval); // Stop the timer
            resendBtn.style.pointerEvents = 'auto'; // Enable button
            resendBtn.style.color = '#EBCB92'; // Active state color
            timerDisplay.textContent = 'You can now resend the OTP!';
        }
    }, 1000);
}

// Function to set expiry timestamp for 12 hours
function setExpiryTime() {
    const currentTime = new Date().getTime();
    const expiryTime = currentTime + 12 * 60 * 60 * 1000; // 12 hours in milliseconds
    localStorage.setItem('expiryTime', expiryTime); // Store expiry time in localStorage
}

// Event Listener for Resend Button
resendBtn.addEventListener('click', () => {
    let count = parseInt(localStorage.getItem('count'), 10);

    // Check if the resend limit has been reached
    if (count >= 5) {
        showToast('You have reached the maximum resend attempts. Try again after 12 hours.', 'error');
        return;
    }

    showToast('OTP has been resent!', 'success'); // Notify user that OTP has been resent
    count++;
    localStorage.setItem('count', count); // Increment the resend count

    // If the count reaches 5, set expiry time
    if (count === 5) {
        setExpiryTime();
        showToast('You have reached the maximum attempts. Please wait 12 hours.', 'error');
    }

    countdown = 60; // Reset countdown
    startTimer(); // Restart the timer
});

// Function to reset resend count if expiry time has passed
function resetCountIfExpired() {
    const currentTime = new Date().getTime();
    const expiryTime = parseInt(localStorage.getItem('expiryTime'), 10);

    // If the current time is greater than the expiry time, reset the count
    if (expiryTime && currentTime > expiryTime) {
        localStorage.setItem('count', 0); // Reset count
        localStorage.removeItem('expiryTime'); // Remove expiry time
    }
}

// Initialize on page load
resetCountIfExpired(); // Reset count if expired
startTimer(); // Start the timer

// Function to resend OTP
function resend() {
    let count = parseInt(localStorage.getItem('count'), 10);
    if (count >= 5) {
        return; // Do not proceed if resend limit is reached
    }
    window.location.reload(); // Reload the page
    fetch('/auth/otp/resendOtp', {
        method: 'POST' // Send a POST request to resend OTP
    })
    .then(response => {
        if (response.ok) {
            showToast('OTP resent successfully', 'success');
        } else {
            showToast('Failed to resend OTP', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('An error occurred while resending OTP', 'error');
    });
}

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

// Scroll animations for elements
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Animate sections on scroll
document.querySelectorAll('.section-title, .category, .product-card, .blog-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'all 0.6s ease-out';
    observer.observe(el);
});