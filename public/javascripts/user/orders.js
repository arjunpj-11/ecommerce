document.addEventListener('DOMContentLoaded', function() {
    // Initialize background canvas
    initBackgroundCanvas();
    
    // Initialize order functionality
    initOrderSystem();
    
    // Initialize scroll animations
    initScrollAnimations();
});

// Background Canvas Animation
function initBackgroundCanvas() {
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
}

// Order System Functionality
function initOrderSystem() {
    // Handle order row clicks to show details
    document.querySelectorAll('.orders-table tbody tr').forEach(row => {
        const productCell = row.querySelector('td:nth-child(2)');
        if (productCell) {
            productCell.addEventListener('click', async () => {
                const orderId = row.querySelector('.lets-go-button')?.dataset.orderId;
                if (orderId) {
                    window.location.href = `/users/orderOverview/${orderId}`;
                }
            });
        }
    });

    // Handle "Let's Go" button clicks
    document.querySelectorAll('.lets-go-button').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const orderId = e.target.dataset.orderId;
            window.location.href = `/users/orderOverview/${orderId}`;
        });
    });
}

// Scroll Animations
function initScrollAnimations() {
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

    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

// Add these styles to your CSS
const styles = `
    .lets-go-button {
        background-color: #eab308;
        color: #fff;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .lets-go-button:hover {
        background-color: #ca8a04;
    }

    .toast {
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        padding: 1rem 2rem;
        border-radius: 0.5rem;
        color: white;
        font-weight: 500;
        z-index: 2000;
        animation: slideIn 0.3s ease, fadeOut 0.3s ease 2.7s;
    }

    .toast.success {
        background: rgba(34, 197, 94, 0.9);
    }

    .toast.error {
        background: rgba(220, 38, 38, 0.9);
    }

    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }

    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
`;

// Add styles to document
const styleSheet = document.createElement("style");
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

// Utility function to show toast messages
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

