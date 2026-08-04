// Add loader styles
const style = document.createElement('style');
style.textContent = `
.loader-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(17, 24, 39, 0.8);
    display: none;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.loader {
    width: 48px;
    height: 48px;
    border: 4px solid var(--text-light);
    border-top-color: var(--primary-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.loader-active {
    display: flex;
}`;

document.head.appendChild(style);

// Create loader HTML
const loaderHTML = `
<div class="loader-overlay">
    <div class="loader"></div>
</div>`;

document.body.insertAdjacentHTML('beforeend', loaderHTML);

// Utility functions
const getBase64Image = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
};

// Get loader element
const loader = document.querySelector('.loader-overlay');

// Function to show/hide loader
const toggleLoader = (show) => {
    loader.classList.toggle('loader-active', show);
};

// DOM Elements
const bannerForm = document.getElementById('bannerForm');
const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');
const selectedFileName = document.getElementById('selectedFileName');
const imageUploadContainer = document.getElementById('imageUploadContainer');
const mainCategorySelect = document.getElementById('main-category');
const subCategorySelect = document.getElementById('sub-category');
const addBannerBtn = document.getElementById('addBanner');
const deleteBannerBtn = document.getElementById('deleteBanner');
const prevBannerBtn = document.querySelector('.prev-banner');
const nextBannerBtn = document.querySelector('.next-banner');
const dotsContainer = document.querySelector('.dots');

// State management
let currentBannerIndex = 0;
let banners = [];

// Fetch initial banners
const fetchBanners = async () => {
    try {
        toggleLoader(true);
        const response = await fetch('/admin/banner/banners');
        banners = await response.json();
        updateBannerDisplay();
        updateDots();
    } catch (error) {
        console.error('Error fetching banners:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to fetch banners. Please try again later.'
        });
    } finally {
        toggleLoader(false);
    }
};

// Update banner preview
const updateBannerDisplay = () => {
    if (banners.length === 0) return;
    
    const banner = banners[currentBannerIndex];
    const preview = document.querySelector('.banner-preview');
    preview.style.backgroundImage = `url(${banner.imageUrl})`;
    
    document.querySelector('.banner-title').textContent = banner.title;
    document.querySelector('.banner-heading').textContent = banner.heading;
    document.querySelector('.banner-subtext').textContent = banner.subtext;
    document.querySelector('.banner-button').textContent = banner.buttonText;
   
  // Update form
bannerForm.bannerId.value = banner._id;
bannerForm.title.value = banner.title;
bannerForm.heading.value = banner.heading;
bannerForm.subtext.value = banner.subtext;
bannerForm.buttonText.value = banner.buttonText;

// Set the category dropdown value based on the banner data
const categoryPrefix = banner.categoryType === 'MainCategory' ? 'main' : 'sub';
const categoryValue = `${categoryPrefix}_${banner.categoryId}`;
mainCategorySelect.value = categoryValue;
    
    imagePreview.src = banner.imageUrl;
    imagePreview.classList.add('visible');
};

// Update navigation dots
const updateDots = () => {
    dotsContainer.innerHTML = '';
    banners.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.className = `dot ${index === currentBannerIndex ? 'active' : ''}`;
        dot.addEventListener('click', () => {
            currentBannerIndex = index;
            updateBannerDisplay();
            updateDots();
        });
        dotsContainer.appendChild(dot);
    });
};

// Handle banner navigation
prevBannerBtn.addEventListener('click', () => {
    if (currentBannerIndex > 0) {
        currentBannerIndex--;
        updateBannerDisplay();
        updateDots();
    }
});

nextBannerBtn.addEventListener('click', () => {
    if (currentBannerIndex < banners.length - 1) {
        currentBannerIndex++;
        updateBannerDisplay();
        updateDots();
    }
});

// Handle image upload
imageUploadContainer.addEventListener('click', () => imageInput.click());

imageUploadContainer.addEventListener('dragover', (e) => {
    e.preventDefault();
    imageUploadContainer.classList.add('dragover');
});

imageUploadContainer.addEventListener('dragleave', () => {
    imageUploadContainer.classList.remove('dragover');
});

imageUploadContainer.addEventListener('drop', async (e) => {
    e.preventDefault();
    imageUploadContainer.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) await handleImageUpload(file);
});

imageInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) await handleImageUpload(file);
});

const handleImageUpload = async (file) => {
    if (!file.type.startsWith('image/')) {
        Swal.fire({
            icon: 'warning',
            title: 'Invalid File',
            text: 'Please upload an image file.'
        });
        return;
    }
    
    selectedFileName.textContent = file.name;
    const base64Image = await getBase64Image(file);
    imagePreview.src = base64Image;
    imagePreview.classList.add('visible');
};

// Handle form submission
bannerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    toggleLoader(true);
    
    const categoryValue = bannerForm.mainCategory.value;
    const [type, id] = categoryValue.split('_');
    
    const formData = {
        title: bannerForm.title.value,
        heading: bannerForm.heading.value,
        subtext: bannerForm.subtext.value,
        buttonText: bannerForm.buttonText.value,
        categoryType: type === 'main' ? 'MainCategory' : 'SubCategory', // Convert to proper model name
        categoryId: id,
    };

    if (imagePreview.src && !imagePreview.src.startsWith('http')) {
        formData.image = imagePreview.src;
    }

    const bannerId = bannerForm.bannerId.value;
    const url = bannerId ? `/admin/banner/banners/${bannerId}` : '/admin/banner/banners';
    const method = bannerId ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (!response.ok) throw new Error('Failed to save banner');

        const savedBanner = await response.json();
        if (bannerId) {
            banners[currentBannerIndex] = savedBanner;
        } else {
            banners.push(savedBanner);
            currentBannerIndex = banners.length - 1;
        }

        updateBannerDisplay();
        updateDots();
        
        // Hide loader before showing success message
        toggleLoader(false);
        
        Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'Banner saved successfully!'
        });
    } catch (error) {
        console.error('Error saving banner:', error);
        
        // Hide loader before showing error message
        toggleLoader(false);
        
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to save banner. Please try again.'
        });
    }
});

// Handle banner deletion
deleteBannerBtn.addEventListener('click', async () => {
    if (banners.length === 0) return;
    
    const result = await Swal.fire({
        icon: 'warning',
        title: 'Are you sure?',
        text: 'You are about to delete this banner. This action cannot be undone.',
        showCancelButton: true,
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;
    
    // Show loader
    toggleLoader(true);
    
    const bannerId = bannerForm.bannerId.value;
    try {
        const response = await fetch(`/admin/banner/banners/${bannerId}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete banner');

        banners.splice(currentBannerIndex, 1);
        currentBannerIndex = Math.min(currentBannerIndex, banners.length - 1);
        updateBannerDisplay();
        updateDots();
        
        // Hide loader before showing success message
        toggleLoader(false);
        
        Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'Banner deleted successfully!'
        });
    } catch (error) {
        console.error('Error deleting banner:', error);
        
        // Hide loader before showing error message
        toggleLoader(false);
        
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to delete banner. Please try again.'
        });
    }
});

// Handle adding new banner
addBannerBtn.addEventListener('click', () => {
    bannerForm.reset();
    bannerForm.bannerId.value = '';
    imagePreview.src = '';
    imagePreview.classList.remove('visible');
    selectedFileName.textContent = '';
});

// Initialize the page
fetchBanners();

document.addEventListener('DOMContentLoaded', function() {
    const hamburgerMenu = document.getElementById('hamburger-menu');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const navLinks = document.querySelectorAll('.nav-links a');

    // Toggle sidebar
    hamburgerMenu.addEventListener('click', function() {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    });

    // Close sidebar when clicking outside or on a link
    overlay.addEventListener('click', function() {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    });

    // Close sidebar when clicking on a navigation link
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        });
    });
});
