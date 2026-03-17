// Global state
let itemsPerPage = 30;
let currentPage = 1;
let allProducts = [];
let totalPages = 0;
let currentFilters = {
    sort: 'popularity',
    categories: [],
    minPrice: '',
    maxPrice: '',
    sizes: []
};

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

// Product loading and filtering functions
async function fetchProducts() {
    const loadingSpinner = document.getElementById('loadingSpinner');
    try {
        loadingSpinner.style.display = 'block';
        
        const queryParams = new URLSearchParams({
            sort: currentFilters.sort,
            ...currentFilters.minPrice && { minPrice: currentFilters.minPrice },
            ...currentFilters.maxPrice && { maxPrice: currentFilters.maxPrice }
        });

        currentFilters.categories.forEach(category => {
            queryParams.append('categories', category);
        });

        currentFilters.sizes.forEach(size => {
            queryParams.append('sizes', size);
        });

        const response = await fetch(`/shop/products?${queryParams.toString()}`);
        if (!response.ok) {
            throw new Error('Error while fetching products');
        }
        const products = await response.json();
        allProducts = products;
        totalPages = Math.ceil(allProducts.length / itemsPerPage);
        return products;
    } catch (error) {
        console.error('Error:', error);
        showErrorMessage('Error fetching products. Please try again.');
        return [];
    } finally {
        loadingSpinner.style.display = 'none';
    }
}

function getPaginatedProducts() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return allProducts.slice(startIndex, endIndex);
}

function renderProducts(products) {
    const productGrid = document.getElementById('productGrid');
    productGrid.innerHTML = '';

    if (!products || products.length === 0) {
        const noProductsMessage = document.createElement('div');
        noProductsMessage.className = 'no-products-message';
        noProductsMessage.innerHTML = `
            <div class="no-products-icon">🔍</div>
            <h2>No Products Found</h2>
            <p>Try adjusting your filters or search criteria</p>
        `;
        productGrid.appendChild(noProductsMessage);
        return;
    }

    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        
        // Calculate discount percentage
        const originalPrice = product.productDetails.price;
        const discountPrice = product.productDetails.discountPrice;
        const discount = Math.round(((originalPrice - discountPrice) / originalPrice) * 100);
        
        // Create rating stars
        const rating = product.productDetails.review;
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const starHTML = [...Array(5)].map((_, i) => {
            if (i < fullStars) return '<i class="fas fa-star"></i>';
            if (i === fullStars && hasHalfStar) return '<i class="fas fa-star-half-alt"></i>';
            return '<i class="far fa-star"></i>';
        }).join('');

        productCard.innerHTML = `
            <a href="/overview/${product._id}" class="product-card-link">
                <div class="product-image-wrapper">
                    <img src="${product.images}" alt="${product.productDetails.name}" class="product-image">
                    ${discount > 0 ? `<span class="discount-tag">-${discount}%</span>` : ''}
                    <div class="quick-view-button">Quick View</div>
                </div>
                <div class="product-details">
                    <h3 class="product-title">${product.productDetails.name}</h3>
                    <div class="price-container">
                        <span class="current-price">₹${discountPrice.toLocaleString()}</span>
                        ${discount > 0 ? `<span class="original-price">₹${originalPrice.toLocaleString()}</span>` : ''}
                    </div>
                    <div class="product-meta">
                        <div class="rating-stars">${starHTML}</div>
                        <span class="rating-value">${rating.toFixed(1)}</span>
                    </div>
                </div>
            </a>
        `;

        productGrid.appendChild(productCard);
    });
}


function renderPagination() {
    const paginationElement = document.getElementById('pagination');
    paginationElement.innerHTML = '';

    // if (totalPages <= 1) return;

    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Create pagination container
    const paginationContainer = document.createElement('div');
    paginationContainer.className = 'pagination-container';

    // Previous button
    const prevButton = document.createElement('button');
    prevButton.className = `pagination-button ${currentPage === 1 ? 'disabled' : ''}`;
    prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevButton.disabled = currentPage === 1;
    prevButton.onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            updateProducts();
        }
    };
    paginationContainer.appendChild(prevButton);

    // First page
    if (startPage > 1) {
        addPageButton(1);
        if (startPage > 2) {
            addEllipsis();
        }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
        addPageButton(i);
    }

    // Last page
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            addEllipsis();
        }
        addPageButton(totalPages);
    }

    // Next button
    const nextButton = document.createElement('button');
    nextButton.className = `pagination-button ${currentPage === totalPages ? 'disabled' : ''}`;
    nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextButton.disabled = currentPage === totalPages;
    nextButton.onclick = () => {
        if (currentPage < totalPages) {
            currentPage++;
            updateProducts();
        }
    };
    paginationContainer.appendChild(nextButton);

    paginationElement.appendChild(paginationContainer);

    function addPageButton(pageNum) {
        const button = document.createElement('button');
        button.className = `pagination-button ${pageNum === currentPage ? 'active' : ''}`;
        button.textContent = pageNum;
        button.onclick = () => {
            if (pageNum !== currentPage) {
                currentPage = pageNum;
                updateProducts();
            }
        };
        paginationContainer.appendChild(button);
    }

    function addEllipsis() {
        const ellipsis = document.createElement('span');
        ellipsis.className = 'pagination-ellipsis';
        ellipsis.textContent = '...';
        paginationContainer.appendChild(ellipsis);
    }
}


function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
}

// Event Listeners
document.querySelector('.sort-dropdown').addEventListener('change', async (e) => {
    currentFilters.sort = e.target.value;
    currentPage = 1;
    const products = await fetchProducts();
    renderProducts(getPaginatedProducts());
    renderPagination();
});

document.querySelectorAll('input[name="category"]').forEach(checkbox => {
    checkbox.addEventListener('change', async (e) => {
        if (e.target.checked) {
            currentFilters.categories.push(e.target.value);
        } else {
            currentFilters.categories = currentFilters.categories.filter(cat => cat !== e.target.value);
        }
        currentPage = 1;
        const products = await fetchProducts();
        renderProducts(getPaginatedProducts());
        renderPagination();
    });
});

document.querySelector('.apply-btn').addEventListener('click', async () => {
    currentFilters.minPrice = document.getElementById('minPrice').value;
    currentFilters.maxPrice = document.getElementById('maxPrice').value;
    currentPage = 1;
    const products = await fetchProducts();
    renderProducts(getPaginatedProducts());
    renderPagination();
});

function updateProducts() {
    renderProducts(getPaginatedProducts());
    renderPagination();
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Initial load
window.addEventListener('load', async () => {
    animate();
    const products = await fetchProducts();
    renderProducts(getPaginatedProducts());
    renderPagination();
});

// Search functionality
const searchIcon = document.querySelector('.nav-right a:nth-child(2)');
var navbar = document.querySelector('.nav-container');
let searchBar = null;

searchIcon.addEventListener('click', (e) => {
    e.preventDefault();
    
    if (searchBar) {
        // If search bar exists, remove it
        searchBar.remove();
        searchBar = null;
        return;
    }
    
    // Create search bar container
    searchBar = document.createElement('div');
    searchBar.className = 'search-container';
    
    // Create search form
    const searchForm = document.createElement('form');
    searchForm.className = 'search-form';
    searchForm.action = '/search';
    searchForm.method = 'GET';
    
    // Create search input
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.name = 'search';
    searchInput.placeholder = 'Search products...';
    searchInput.className = 'search-input';
    
    // Create submit button
    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.className = 'search-submit';
    submitButton.innerHTML = '🔍';
    
    // Create close button
    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'search-close';
    closeButton.innerHTML = '✕';
    closeButton.onclick = () => {
        searchBar.remove();
        searchBar = null;
    };
    
    // Assemble the search bar
    searchForm.appendChild(searchInput);
    searchForm.appendChild(submitButton);
    searchForm.appendChild(closeButton);
    searchBar.appendChild(searchForm);
    
    // Insert search bar after navbar
    navbar.appendChild(searchBar);
    
    // Focus the input
    searchInput.focus();
});

// Close search bar when clicking outside
document.addEventListener('click', (e) => {
    if (searchBar && 
        !searchBar.contains(e.target) && 
        !searchIcon.contains(e.target)) {
        searchBar.remove();
        searchBar = null;
    }
});