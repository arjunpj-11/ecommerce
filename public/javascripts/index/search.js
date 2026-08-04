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
    sizes: [],
    search: ''
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
        
        // Build query string from filters
        const queryParams = new URLSearchParams({
            sort: currentFilters.sort,
            ...currentFilters.minPrice && { minPrice: currentFilters.minPrice },
            ...currentFilters.maxPrice && { maxPrice: currentFilters.maxPrice },
            ...(currentFilters.search && { search: currentFilters.search })
        });

        currentFilters.categories.forEach(category => {
            queryParams.append('categories', category);
        });

        currentFilters.sizes.forEach(size => {
            queryParams.append('sizes', size);
        });

        const response = await fetch(`/search/products?${queryParams.toString()}`);
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

function createProductCard(product) {
    const discount = Math.round((1 - product.productDetails.discountPrice/product.productDetails.price) * 100);
    const fullStars = product.productDetails.review.toFixed(1)
    const starHTML = [...Array(5)].map((_, i) => {
        if (i < fullStars) return '<i class="fas fa-star"></i>';
        if (i === fullStars && hasHalfStar) return '<i class="fas fa-star-half-alt"></i>';
        return '<i class="far fa-star"></i>';
    }).join('');
    return `
        <a href="/overview/${product._id}" class="product-card-link">
            <div class="product-card">
                <div class="product-image-container">
                    <img src="${product.images}" alt="${product.productDetails.name}" class="product-image">
                    ${discount > 0 ? `<div class="discount-badge">${discount}% OFF</div>` : ''}
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.productDetails.name}</h3>
                    <div class="price-layout">
                        <div class="price-row">
                            <span class="discount-price">₹${product.productDetails.discountPrice.toLocaleString()}</span>
                            ${discount > 0 ? `<span class="original-price">₹${product.productDetails.price.toLocaleString()}</span>` : ''}
                        </div>
                        <div class="offer-badge">
                                           ${discount}% OFF
                        </div>
                    </div>
                    <div class="product-meta">
                         <div class="rating-stars">${starHTML}</div>
                        <span class="rating-value">${ product.productDetails.review.toFixed(1)}</span>
                    </div>
                </div>
            </div>
        </a>
    `;
}

function renderPagination() {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;

    let paginationHTML = `
        <button class="page-btn" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i>
        </button>
    `;

    for (let i = 1; i <= totalPages; i++) {
        if (
            i === 1 || 
            i === totalPages || 
            (i >= currentPage - 1 && i <= currentPage + 1)
        ) {
            paginationHTML += `
                <button class="page-btn ${currentPage === i ? 'active' : ''}" onclick="changePage(${i})">
                    ${i}
                </button>
            `;
        } else if (
            i === currentPage - 2 || 
            i === currentPage + 2
        ) {
            paginationHTML += `<span class="page-ellipsis">...</span>`;
        }
    }

    paginationHTML += `
        <button class="page-btn" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
            <i class="fas fa-chevron-right"></i>
        </button>
    `;

    pagination.innerHTML = paginationHTML;
}

async function changePage(newPage) {
    if (newPage < 1 || newPage > totalPages) return;
    
    currentPage = newPage;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    await loadProducts();
    renderPagination();
}

async function loadProducts() {
    const loadingSpinner = document.getElementById('loadingSpinner');
    const productGrid = document.getElementById('productGrid');
    
    if (!productGrid) return;

    try {
        loadingSpinner.style.display = 'block';
        productGrid.innerHTML = '';

        const products = getPaginatedProducts();
        
        if (products.length === 0) {
            productGrid.innerHTML = '<div class="no-products">No products found matching your criteria.</div>';
            return;
        }

        const productsHTML = products.map(product => createProductCard(product)).join('');
        productGrid.innerHTML = productsHTML;
    } catch (error) {
        console.error('Error:', error);
        showErrorMessage('Error loading products. Please try again.');
    } finally {
        loadingSpinner.style.display = 'none';
    }
}

// Search functionality
async function getSearchRecommendations() {
    const searchInput = document.querySelector('#searchInput').value;
    try {
        const queryParams = new URLSearchParams({
            q: searchInput,
            categories: currentFilters.categories.join(',')
        });
        
        const response = await fetch(`/search/suggestions?${queryParams.toString()}`);
        if (!response.ok) {
            throw new Error('Error fetching recommendations');
        }
        const suggestions = await response.json();

        // Decode each suggestion before returning
        return suggestions.map(suggestion => decodeURIComponent(suggestion));
    } catch (error) {
        console.error('Error:', error);
        return [];
    }
}

function initializeSearchSuggestions() {
    const searchInput = document.getElementById('searchInput');
    const suggestionsContainer = document.getElementById('suggestions');
    let selectedSuggestionIndex = -1;
    let visibleSuggestions = [];

    async function createSuggestionsHTML() {
        let html = '<div class="suggestions-wrapper">';
        try {
            const suggestions = await getSearchRecommendations(); // Corrected function call
            visibleSuggestions = suggestions;
            html += `
                <div class="suggestion-section">
                    ${createSuggestionItems(suggestions)}
                </div>
            `;
        } catch (error) {
            console.error('Error:', error);
            html += '<div class="suggestion-section">Error loading suggestions</div>';
        }
        html += '</div>';
        return html;
    }

    function createSuggestionItems(items) {
        return items.map((item, index) => `
            <a href="/search?search=${encodeURIComponent(item)}">
                <div class="suggestion-item ${index === selectedSuggestionIndex ? 'selected' : ''}" 
                     data-index="${index}">
                    <i class="fas fa-search"></i>
                    <span>${item}</span>
                </div>
            </a>
        `).join('');
    }

    // Event listeners
    searchInput.addEventListener('focus', () => {
        suggestionsContainer.style.display = "block";
    });

    searchInput.addEventListener('input', async () => {
        suggestionsContainer.innerHTML = await createSuggestionsHTML();
    });

    searchInput.addEventListener('keydown', (event) => {
        const search = searchInput.value;
        if (event.key === 'Enter') {
            location.href = `/search?search=${encodeURIComponent(search)}`;
        }
    });

    // Keyboard navigation
    searchInput.addEventListener('keydown', (e) => {
        if (!suggestionsContainer.style.display || suggestionsContainer.style.display === 'none') {
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                selectedSuggestionIndex = Math.min(
                    selectedSuggestionIndex + 1,
                    visibleSuggestions.length - 1
                );
                updateSelectedSuggestion();
                break;

            case 'ArrowUp':
                e.preventDefault();
                selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, -1);
                updateSelectedSuggestion();
                break;

            case 'Enter':
                e.preventDefault();
                if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < visibleSuggestions.length) {
                    location.href = `/search?search=${encodeURIComponent(visibleSuggestions[selectedSuggestionIndex])}`;
                }
                break;

            case 'Escape':
                suggestionsContainer.style.display = 'none';
                selectedSuggestionIndex = -1;
                break;
        }
    });

    // Update selected suggestion visual
    function updateSelectedSuggestion() {
        const items = suggestionsContainer.querySelectorAll('.suggestion-item');
        items.forEach((item, index) => {
            item.classList.toggle('selected', index === selectedSuggestionIndex);
        });
    }

    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            suggestionsContainer.style.display = 'none';
            selectedSuggestionIndex = -1;
        }
    });

    // Initialize suggestions
    document.addEventListener('DOMContentLoaded', async () => {
        suggestionsContainer.innerHTML = await createSuggestionsHTML();
    });
}
async function handleSearch() {
    const searchInput = document.getElementById('searchInput');
    const search = searchInput.value.trim();
    
    if (search) {
        // Create new URL with only the search parameter
        const url = new URL(window.location.origin + '/search');
        url.searchParams.set('search', search);
        
        // Navigate to the new URL, which will clear all other filters
        window.location.href = url.toString();
        return;
    }
}

// Filter initialization and handling
function initializeFilters() {
    // Sort dropdown
    const sortDropdown = document.querySelector('.sort-dropdown');
    if (sortDropdown) {
        sortDropdown.addEventListener('change', async (e) => {
            currentFilters.sort = e.target.value;
            currentPage = 1;
            await refreshProducts();
        });
    }

    // Category checkboxes
    const categoryCheckboxes = document.querySelectorAll('input[name="category"]');
    categoryCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', async (e) => {
            categoryCheckboxes.forEach(cb => {
                if (cb !== e.target) {
                    cb.checked = false;
                }
            });
        
            currentFilters.categories = e.target.checked ? [e.target.value] : [];
            currentPage = 1;
            await refreshProducts();
        });
    });

    // Price range
    const applyPriceBtn = document.querySelector('.apply-btn');
    if (applyPriceBtn) {
        applyPriceBtn.addEventListener('click', async () => {
            const minPrice = document.getElementById('minPrice').value;
            const maxPrice = document.getElementById('maxPrice').value;
            
            if (minPrice && maxPrice && Number(minPrice) > Number(maxPrice)) {
                showErrorMessage('Minimum price cannot be greater than maximum price');
                return;
            }
            
            currentFilters.minPrice = minPrice;
            currentFilters.maxPrice = maxPrice;
            currentPage = 1;
            await refreshProducts();
        });
    }

    // Size checkboxes
    const sizeCheckboxes = document.querySelectorAll('input[name="size"]');
    sizeCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', async () => {
            currentFilters.sizes = Array.from(sizeCheckboxes)
                .filter(cb => cb.checked)
                .map(cb => cb.value);
            currentPage = 1;
            await refreshProducts();
        });
    });
}

// URL parameter handling
function loadURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);

    // Load search query
    const searchQuery = urlParams.get('search');
    if (searchQuery) {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = searchQuery;
            currentFilters.search = searchQuery;
        }
    }

    // Always load sort parameter
    const sortValue = urlParams.get('sort');
    if (sortValue) {
        currentFilters.sort = sortValue;
        const sortDropdown = document.querySelector('.sort-dropdown');
        if (sortDropdown) {
            sortDropdown.value = sortValue;
        }
    }

    // Always load category filters
    const categories = urlParams.getAll('categories');
    if (categories.length > 0) {
        currentFilters.categories = categories;
        const categoryCheckboxes = document.querySelectorAll('input[name="category"]');
        categoryCheckboxes.forEach(checkbox => {
            checkbox.checked = categories.includes(checkbox.value);
        });
    }

    // Always load price range
    const minPrice = urlParams.get('minPrice');
    const maxPrice = urlParams.get('maxPrice');
    if (minPrice) {
        currentFilters.minPrice = minPrice;
        document.getElementById('minPrice').value = minPrice;
    }
    if (maxPrice) {
        currentFilters.maxPrice = maxPrice;
        document.getElementById('maxPrice').value = maxPrice;
    }

    // Always load size filters
    const sizes = urlParams.getAll('sizes');
    if (sizes.length > 0) {
        currentFilters.sizes = sizes;
        const sizeCheckboxes = document.querySelectorAll('input[name="size"]');
        sizeCheckboxes.forEach(checkbox => {
            checkbox.checked = sizes.includes(checkbox.value);
        });
    }
}

// Error handling
function showErrorMessage(message) {
    const errorContainer = document.getElementById('errorContainer');
    if (!errorContainer) {
        const container = document.createElement('div');
        container.id = 'errorContainer';
        container.className = 'error-container';
        document.body.appendChild(container);
    }

    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;

    errorContainer.appendChild(errorElement);

    setTimeout(() => {
        errorElement.remove();
        if (errorContainer.children.length === 0) {
            errorContainer.remove();
        }
    }, 5000);
}

// Product refresh and initialization
async function refreshProducts() {
    await fetchProducts();
    await loadProducts();
    renderPagination();
    updateURLParameters();
}

function updateURLParameters() {
    const url = new URL(window.location);

    // Update search parameter
    if (currentFilters.search) {
        url.searchParams.set('search', currentFilters.search);
    } else {
        url.searchParams.delete('search');
    }

    // Update sort parameter
    if (currentFilters.sort !== 'popularity') {
        url.searchParams.set('sort', currentFilters.sort);
    } else {
        url.searchParams.delete('sort');
    }

    // Update category parameters
    url.searchParams.delete('categories');
    currentFilters.categories.forEach(category => {
        url.searchParams.append('categories', category);
    });

    // Update price parameters
    if (currentFilters.minPrice) {
        url.searchParams.set('minPrice', currentFilters.minPrice);
    } else {
        url.searchParams.delete('minPrice');
    }
    if (currentFilters.maxPrice) {
        url.searchParams.set('maxPrice', currentFilters.maxPrice);
    } else {
        url.searchParams.delete('maxPrice');
    }

    // Update size parameters
    url.searchParams.delete('sizes');
    currentFilters.sizes.forEach(size => {
        url.searchParams.append('sizes', size);
    });

    // Update URL without reloading the page
    window.history.pushState({}, '', url);
}

// Initialize everything when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    loadURLParameters(); // Load all URL parameters first
    initializeSearchSuggestions();
    initializeFilters();
    animate(); // Start background animation
    refreshProducts(); // Load initial products with filters
});

// Handle browser back/forward navigation
window.addEventListener('popstate', () => {
    loadURLParameters();
    refreshProducts();
});