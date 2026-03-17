/* Common Utility Function for Validation Feedback */
function setError(element, message) {
    const messageElement = document.getElementById(`${element.id}Message`);
    messageElement.textContent = message; // Set error message
    element.classList.add('iAfter'); // Highlight input with error
}

function clearError(element) {
    const messageElement = document.getElementById(`${element.id}Message`);
    messageElement.textContent = ''; // Clear error message
    element.classList.remove('iAfter'); // Remove highlight
}

// Email and Phone Validation
const emailOrPhone = document.getElementById('emailOrPhone');
const emailOrPhoneMessage = document.getElementById('emailOrPhoneMessage');
let emailOrPhoneError = false;

// Validate email or phone input
function validateEmailOrPhone() {
    let value = emailOrPhone.value.trim();
    let emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;  // Email regex
    let phoneRegex = /^[+]?[0-9]{10,15}$/;  // Phone number regex

    if (value === '') {
        setError(emailOrPhone, 'Email or Phone Number is required');
        emailOrPhoneError = true;
    } else if (!emailRegex.test(value) && !phoneRegex.test(value)) {
        setError(emailOrPhone, 'Invalid email or phone number format');
        emailOrPhoneError = true;
    } else {
        clearError(emailOrPhone);
        emailOrPhoneError = false;
    }
}

// Validate on input change
function validateEmailOrPhone2() {
    if (!emailOrPhoneError) {
        return;
    }
    let value = emailOrPhone.value.trim();
    let emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let phoneRegex = /^[+]?[0-9]{10,15}$/;

    if (value === '') {
        setError(emailOrPhone, 'Email or Phone Number is required');
        emailOrPhoneError = true;
    } else if (!emailRegex.test(value) && !phoneRegex.test(value)) {
        setError(emailOrPhone, 'Invalid email or phone number format');
        emailOrPhoneError = true;
    } else {
        clearError(emailOrPhone);
        emailOrPhoneError = false;
    }
}

// Event listeners for validation
emailOrPhone.addEventListener('blur', validateEmailOrPhone);
emailOrPhone.addEventListener('input', validateEmailOrPhone2);

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