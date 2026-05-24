document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form');
    const fullName = document.getElementById('fullName');
    const emailOrPhone = document.getElementById('emailOrPhone');
    const password = document.getElementById('password');
    const passwordConfirm = document.getElementById('passwordConfirm');
    const togglePassword = document.getElementById('togglePassword');
    const togglePasswordConfirm = document.getElementById('togglePasswordConfirm');
    const passwordCriteriaContainer = document.querySelector('.password-criteria');
    const submitButton = form?.querySelector('.submit-btn');

    const state = {
        fullNameError: false,
        emailOrPhoneError: false,
        passwordError: false,
        passwordConfirmError: false,
    };

    function setError(element, message) {
        if (!element) return;
        const messageElement = document.getElementById(`${element.id}Message`);
        if (messageElement) messageElement.textContent = message;
        element.classList.add('iAfter');
    }

    function clearError(element) {
        if (!element) return;
        const messageElement = document.getElementById(`${element.id}Message`);
        if (messageElement) messageElement.textContent = '';
        element.classList.remove('iAfter');
    }

    function showToast(message, type = 'success') {
        const existing = document.querySelector('.toast');
        existing?.remove();

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(12px)';
            setTimeout(() => toast.remove(), 220);
        }, 3000);
    }

    function validateFullName(force = true) {
        if (!force && !state.fullNameError) return;
        if (!fullName) return;

        const name = fullName.value.trim();
        const regex = /^[a-zA-Z\s]+$/;

        if (name === '') {
            setError(fullName, 'Full Name is required');
            state.fullNameError = true;
        } else if (name.length < 3) {
            setError(fullName, 'Name must be at least 3 characters long');
            state.fullNameError = true;
        } else if (!regex.test(name)) {
            setError(fullName, 'Name can only contain alphabetic characters and spaces');
            state.fullNameError = true;
        } else {
            clearError(fullName);
            state.fullNameError = false;
        }
    }

    function validateEmailOrPhone(force = true) {
        if (!force && !state.emailOrPhoneError) return;
        if (!emailOrPhone) return;

        const value = emailOrPhone.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^[+]?[0-9]{10,15}$/;

        if (value === '') {
            setError(emailOrPhone, 'Email or Phone Number is required');
            state.emailOrPhoneError = true;
        } else if (!emailRegex.test(value) && !phoneRegex.test(value)) {
            setError(emailOrPhone, 'Invalid email or phone number format');
            state.emailOrPhoneError = true;
        } else {
            clearError(emailOrPhone);
            state.emailOrPhoneError = false;
        }
    }

    function validatePassword(force = true) {
        if (!force && !state.passwordError) return;
        if (!password) return;

        const value = password.value.trim();
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

        if (value === '') {
            setError(password, 'Password is required');
            state.passwordError = true;
        } else if (!regex.test(value)) {
            setError(password, 'Password must be at least 8 characters long, contain uppercase, lowercase, number, and a special character');
            state.passwordError = true;
        } else {
            clearError(password);
            state.passwordError = false;
        }
    }

    function validateConfirmPassword(force = true) {
        if (!force && !state.passwordConfirmError) return;
        if (!password || !passwordConfirm) return;

        const passwordValue = password.value.trim();
        const confirmPasswordValue = passwordConfirm.value.trim();

        if (confirmPasswordValue === '') {
            setError(passwordConfirm, 'Confirm Password is required');
            state.passwordConfirmError = true;
        } else if (passwordValue !== confirmPasswordValue) {
            setError(passwordConfirm, 'Passwords do not match');
            state.passwordConfirmError = true;
        } else {
            clearError(passwordConfirm);
            state.passwordConfirmError = false;
        }
    }

    const passwordCriteria = {
        length: document.getElementById('criteria-length'),
        uppercase: document.getElementById('criteria-uppercase'),
        lowercase: document.getElementById('criteria-lowercase'),
        number: document.getElementById('criteria-number'),
        special: document.getElementById('criteria-special'),
    };

    function setCriterion(key, valid) {
        passwordCriteria[key]?.classList.toggle('valid', valid);
    }

    function validatePasswordCriteria(value) {
        setCriterion('length', value.length >= 8);
        setCriterion('uppercase', /[A-Z]/.test(value));
        setCriterion('lowercase', /[a-z]/.test(value));
        setCriterion('number', /\d/.test(value));
        setCriterion('special', /[@$!%*?&]/.test(value));
    }

    function togglePasswordCriteriaVisibility() {
        if (!passwordCriteriaContainer || !password) return;
        const shouldShow = password.value.trim() || document.activeElement === password;
        passwordCriteriaContainer.classList.toggle('visible', Boolean(shouldShow));
    }

    function setupPasswordToggle(button, input) {
        if (!button || !input) return;

        button.addEventListener('click', () => {
            const icon = button.querySelector('i');
            const isPassword = input.getAttribute('type') === 'password';
            input.setAttribute('type', isPassword ? 'text' : 'password');
            button.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
            icon?.classList.toggle('fa-eye', !isPassword);
            icon?.classList.toggle('fa-eye-slash', isPassword);
        });
    }

    fullName?.addEventListener('blur', () => validateFullName(true));
    fullName?.addEventListener('input', () => validateFullName(false));

    emailOrPhone?.addEventListener('blur', () => validateEmailOrPhone(true));
    emailOrPhone?.addEventListener('input', () => validateEmailOrPhone(false));

    password?.addEventListener('focus', togglePasswordCriteriaVisibility);
    password?.addEventListener('blur', () => {
        validatePassword(true);
        togglePasswordCriteriaVisibility();
    });
    password?.addEventListener('input', () => {
        const value = password.value.trim();
        validatePasswordCriteria(value);
        validatePassword(false);
        validateConfirmPassword(false);
        togglePasswordCriteriaVisibility();
    });

    passwordConfirm?.addEventListener('blur', () => validateConfirmPassword(true));
    passwordConfirm?.addEventListener('input', () => validateConfirmPassword(true));

    setupPasswordToggle(togglePassword, password);
    setupPasswordToggle(togglePasswordConfirm, passwordConfirm);

    form?.addEventListener('submit', async (event) => {
        event.preventDefault();

        validateFullName(true);
        validateEmailOrPhone(true);
        validatePassword(true);
        validateConfirmPassword(true);

        if (state.fullNameError || state.emailOrPhoneError || state.passwordError || state.passwordConfirmError) {
            showToast('Please fix validation errors before submitting.', 'error');
            return;
        }

        const formData = {
            emailOrPhone: emailOrPhone.value.trim(),
            password: password.value.trim(),
            name: fullName.value.trim(),
        };

        try {
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.innerHTML = '<span>Creating Account...</span><i class="fas fa-spinner fa-spin"></i>';
            }

            const response = await fetch('/auth/signin/signinAuth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error('Failed to authenticate.');
            }

            const data = await response.text();

            if (data === 'done') {
                window.location.href = '/auth/otp';
                return;
            }

            if (data === 'already') {
                window.location.href = '/auth/already';
                return;
            }

            showToast('Unexpected response. Please try again.', 'error');
        } catch (error) {
            console.error('Error:', error);
            showToast('An error occurred while signing up. Please try again.', 'error');
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = '<span>Create Account</span><i class="fas fa-arrow-right"></i>';
            }
        }
    });

    // Blue/mint particle background
    const canvas = document.getElementById('backgroundCanvas');
    const ctx = canvas?.getContext('2d');
    let mousePosition = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let particles = [];

    if (canvas && ctx) {
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
                this.size = Math.random() * 2 + 0.5;
                this.speedX = Math.random() * 0.55 - 0.275;
                this.speedY = Math.random() * 0.55 - 0.275;
                this.life = 0;
                this.maxLife = Math.random() * 220 + 120;
                const colors = [
                    'rgba(16, 110, 190, 0.22)',
                    'rgba(15, 252, 190, 0.22)',
                    'rgba(96, 200, 245, 0.18)',
                ];
                this.color = colors[Math.floor(Math.random() * colors.length)];
            }

            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                this.life += 1;

                if (this.life >= this.maxLife || this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
                    this.reset();
                }
            }

            draw() {
                const opacity = 1 - this.life / this.maxLife;
                ctx.globalAlpha = opacity;
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            }
        }

        function createParticles() {
            const count = window.innerWidth < 700 ? 45 : 90;
            particles = Array.from({ length: count }, () => new Particle());
        }

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach((particle) => {
                particle.update();
                particle.draw();
            });

            const mouseGradient = ctx.createRadialGradient(
                mousePosition.x, mousePosition.y, 0,
                mousePosition.x, mousePosition.y, 180
            );
            mouseGradient.addColorStop(0, 'rgba(15, 252, 190, 0.12)');
            mouseGradient.addColorStop(1, 'rgba(244, 250, 255, 0)');
            ctx.fillStyle = mouseGradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            requestAnimationFrame(animate);
        }

        setCanvasSize();
        createParticles();
        animate();

        window.addEventListener('resize', () => {
            setCanvasSize();
            createParticles();
        });

        window.addEventListener('mousemove', (event) => {
            mousePosition = { x: event.clientX, y: event.clientY };
        });
    }
});
