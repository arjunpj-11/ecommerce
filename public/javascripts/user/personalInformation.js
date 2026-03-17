document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('profile-form');
    const editButton = document.querySelector('.edit-button');
    const usernameInput = form.querySelector('input[name="username"]'); // Assuming the username input has this name
    const inputs = form.querySelectorAll('input:not([type="hidden"]), select');
    let isEditing = false;

    // Profile Edit Functionality
    editButton.addEventListener('click', async () => {
        if (isEditing) {
            // Save changes
            const formData = {
                username: usernameInput.value
            }
            try {
                const response = await fetch('/users/pI/update', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData),
                });

                if (response.ok) {
                    showToast('Profile updated successfully!');
                } else {
                    throw new Error('Failed to update profile');
                }
            } catch (error) {
                showToast(error.message, 'error');
            }
        }

        isEditing = !isEditing;
        inputs.forEach(input => {
            if (input === usernameInput) {
                input.readOnly = !isEditing; // Only allow editing for username
            } else {
                input.readOnly = true; // Disable all other inputs
            }
            input.style.opacity = input === usernameInput && isEditing ? '1' : '0.7';
            input.style.cursor = input === usernameInput && isEditing ? 'text' : 'not-allowed';
        });

        editButton.textContent = isEditing ? 'Save Profile' : 'Edit Profile';
    });

    // Photo Upload Functionality
    const photoEditorModal = document.getElementById('photoEditorModal');
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const profileImage = document.querySelector('.profile-image');

    document.querySelector('.change-photo-btn').addEventListener('click', () => {
        photoEditorModal.style.display = 'flex';
    });

    document.getElementById('cancelButton').addEventListener('click', () => {
        photoEditorModal.style.display = 'none';
    });

    document.getElementById('browseButton').addEventListener('click', () => {
        fileInput.click();
    });

    async function uploadToCloudinary(file) {
        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch('/api/profile/upload-photo', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error('Upload failed');

            const data = await response.json();
            return data.imageUrl;
        } catch (error) {
            throw new Error('Failed to upload image');
        }
    }

    document.getElementById('saveButton').addEventListener('click', async () => {
        const imgElement = dropArea.querySelector('img');
        if (!imgElement) {
            showToast('Please select an image first', 'error');
            return;
        }

        try {
            // Convert base64 to blob
            const response = await fetch(imgElement.src);
            const blob = await response.blob();
            
            // Upload to Cloudinary
            const imageUrl = await uploadToCloudinary(blob);
            
            // Update profile image
            profileImage.src = imageUrl;
            photoEditorModal.style.display = 'none';
            showToast('Profile photo updated successfully!');
        } catch (error) {
            showToast(error.message, 'error');
        }
    });

    // File handling functions
    function handleFile(file) {
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = document.createElement('img');
                img.src = event.target.result;
                dropArea.innerHTML = '';
                dropArea.appendChild(img);
            };
            reader.readAsDataURL(file);
        }
    }

    fileInput.addEventListener('change', (e) => {
        handleFile(e.target.files[0]);
    });

    dropArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropArea.classList.add('dragging');
    });

    dropArea.addEventListener('dragleave', () => {
        dropArea.classList.remove('dragging');
    });

    dropArea.addEventListener('drop', (e) => {
        e.preventDefault();
        dropArea.classList.remove('dragging');
        handleFile(e.dataTransfer.files[0]);
    });

    // Toast functionality
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
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

// Navbar scroll effect
var navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

