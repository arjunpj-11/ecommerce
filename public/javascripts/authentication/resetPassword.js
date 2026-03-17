// 📝 Common Utility Function for Validation Feedback
function setError(element, message) {
    const messageElement = document.getElementById(`${element.id}Message`);
    messageElement.textContent = message;
    element.classList.add('iAfter');
}

function clearError(element) {
    const messageElement = document.getElementById(`${element.id}Message`);
    messageElement.textContent = '';
    element.classList.remove('iAfter');
}

// 🔑 Password Validation
const password = document.getElementById('password');
let passwordError = false;

function validatePassword() {
    let passwordValue = password.value.trim();
    let regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (passwordValue === '') {
        setError(password, 'Password is required');
        passwordError = true;
    } else if (!regex.test(passwordValue)) {
        setError(
            password,
            'Password must be at least 8 characters long, contain uppercase, lowercase, number, and a special character'
        );
        passwordError = true;
    } else {
        clearError(password);
        passwordError = false;
    }
}

function validatePassword2() {
    if(!passwordError) {
        return;
    }
    let passwordValue = password.value.trim();
    let regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (passwordValue === '') {
        setError(password, 'Password is required');
        passwordError = true;
    } else if (!regex.test(passwordValue)) {
        setError(
            password,
            'Password must be at least 8 characters long, contain uppercase, lowercase, number, and a special character'
        );
        passwordError = true;
    } else {
        clearError(password);
        passwordError = false;
    }
}

password.addEventListener('blur', validatePassword);
password.addEventListener('input', validatePassword2);

// 📝 Confirm Password Validation
const passwordConfirm = document.getElementById('passwordConfirm');
let passwordConfirmError = false;

function validateConfirmPassword() {
    let passwordValue = password.value.trim();
    let confirmPasswordValue = passwordConfirm.value.trim();
    if (confirmPasswordValue === '') {
        setError(passwordConfirm, 'Confirm Password is required');
        passwordConfirmError = true;
    } else if (!passwordValue.startsWith(confirmPasswordValue)) {
        setError(passwordConfirm, 'Passwords do not match');
        passwordConfirmError = true;
    } 
    else if(passwordValue.length == confirmPasswordValue.length){
        if(passwordValue !== confirmPasswordValue){
            setError(passwordConfirm, 'Passwords do not match');
            passwordConfirmError = true;
        }
    }else {
        clearError(passwordConfirm);
        passwordConfirmError = false;
    }
}

passwordConfirm.addEventListener('input', validateConfirmPassword);

password.addEventListener('input', ()=>{
    let passwordValue = password.value.trim();
    let confirmPasswordValue = passwordConfirm.value.trim();
    if (passwordValue === confirmPasswordValue) {
        clearError(passwordConfirm);
        passwordConfirmError = false;
    }
});

// Toggle Password Visibility
const togglePassword = document.getElementById('togglePassword');

togglePassword.addEventListener('click', () => {
  const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
  password.setAttribute('type', type);
  togglePassword.classList.toggle('fa-eye');
  togglePassword.classList.toggle('fa-eye-slash');
});

// Toggle Confirm Password Visibility
const togglePasswordConfirm = document.getElementById('togglePasswordConfirm');

togglePasswordConfirm.addEventListener('click', () => {
  const type = passwordConfirm.getAttribute('type') === 'password' ? 'text' : 'password';
  passwordConfirm.setAttribute('type', type);
  togglePasswordConfirm.classList.toggle('fa-eye');
  togglePasswordConfirm.classList.toggle('fa-eye-slash');
});

// ✅ Final Validation on Form Submission
const form = document.getElementById('form');


form.addEventListener('submit', (e) => {
    validatePassword();
    validateConfirmPassword();

    if (passwordError || passwordConfirmError) {
        e.preventDefault(); // Prevent form submission if errors exist
        alert('Please fix validation errors before submitting.');
    } else {
        e.preventDefault(); // Always prevent default to control form submission via JavaScript
        // Prepare Form Data
        const formData = {
            password: password.value.trim()
        };

        console.log('Form submitted successfully!');

        fetch('/auth/resetPassword/resetPasswordConfirm', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json' // Sending JSON data
            },
            body: JSON.stringify(formData)
        })
        .then(response => {
            if (response.ok) {
                return response.text(); // Read the response body as text
            } else {
                throw new Error('Failed to authenticate. Please try again.');
            }
        })
        .then(data => {
            console.log('Response from server:', data);
            if (data === "done") {
                window.location.href = '/auth/resetSuccess'; // Redirect to landing page
            }
            else{
                alert('Failed to reset password. Please try again.');
            }
        })
        
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while logging in. Please try again.');
        });
     }
});

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


