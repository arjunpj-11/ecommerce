document.addEventListener('DOMContentLoaded', () => {
    // =====================
    // STATE
    // =====================
    const itemsPerPage = 30;
    let currentPage = 1;
    let allProducts = [];
    let totalPages = 0;

    const currentFilters = {
        sort: 'popularity',
        categories: [],
        minPrice: '',
        maxPrice: '',
        sizes: [],
    };

    // =====================
    // HELPERS
    // =====================
    const $ = (selector, scope = document) => scope.querySelector(selector);
    const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

    function escapeHtml(value = '') {
        return String(value)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function getCategoriesData() {
        const categoriesDataEl = document.getElementById('arni-categories-data');

        try {
            return categoriesDataEl
                ? JSON.parse(categoriesDataEl.textContent || '[]')
                : [];
        } catch (error) {
            console.error('Failed to parse ARNI categories:', error);
            return [];
        }
    }

    const arniCategories = getCategoriesData();

    // =====================
    // NAVBAR — scroll + hide on scroll down
    // =====================
    const navbar = document.getElementById('navbar');
    let lastY = 0;

    window.addEventListener('scroll', () => {
        const y = window.scrollY;

        navbar?.classList.toggle('scrolled', y > 20);

        if (navbar) {
            navbar.style.transform = (y > lastY && y > 140)
                ? 'translateY(-100%)'
                : 'translateY(0)';
        }

        lastY = y;
    }, { passive: true });

    // =====================
    // SEARCH OVERLAY
    // =====================
    const searchToggle = $('.search-toggle');
    const searchOverlay = document.getElementById('searchOverlay');
    const searchClose = document.getElementById('searchClose');

    searchToggle?.addEventListener('click', () => {
        const open = searchOverlay?.classList.toggle('open');
        if (open) $('.search-input', searchOverlay)?.focus();
    });

    searchClose?.addEventListener('click', () => {
        searchOverlay?.classList.remove('open');
    });

    document.addEventListener('click', (event) => {
        if (
            searchOverlay?.classList.contains('open') &&
            !searchOverlay.contains(event.target) &&
            !searchToggle?.contains(event.target)
        ) {
            searchOverlay.classList.remove('open');
        }
    });

    // =====================
    // MOBILE DRAWER
    // =====================
    const hamburger = document.getElementById('hamburger');
    const mobileDrawer = document.getElementById('mobileDrawer');
    const mobileOverlay = document.getElementById('mobileOverlay');
    const drawerClose = document.getElementById('drawerClose');

    function openDrawer() {
        mobileDrawer?.classList.add('open');
        mobileOverlay?.classList.add('visible');
        hamburger?.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeDrawer() {
        mobileDrawer?.classList.remove('open');
        mobileOverlay?.classList.remove('visible');
        hamburger?.classList.remove('open');
        document.body.style.overflow = '';
    }

    hamburger?.addEventListener('click', () => {
        mobileDrawer?.classList.contains('open') ? closeDrawer() : openDrawer();
    });
    mobileOverlay?.addEventListener('click', () => {
        closeDrawer();
        closeFilters();
    });
    drawerClose?.addEventListener('click', closeDrawer);

    // =====================
    // FILTER DRAWER MOBILE
    // =====================
    const filterToggle = document.getElementById('filterToggle');
    const filtersPanel = document.getElementById('filtersPanel');
    const filtersClose = document.getElementById('filtersClose');

    function openFilters() {
        filtersPanel?.classList.add('open');
        mobileOverlay?.classList.add('visible');
        document.body.style.overflow = 'hidden';
    }

    function closeFilters() {
        filtersPanel?.classList.remove('open');

        if (!mobileDrawer?.classList.contains('open')) {
            mobileOverlay?.classList.remove('visible');
            document.body.style.overflow = '';
        }
    }

    filterToggle?.addEventListener('click', openFilters);
    filtersClose?.addEventListener('click', closeFilters);

    // =====================
    // CATEGORY DROPDOWN
    // =====================
    const navLinks = document.getElementById('navLinks');

    if (navLinks && arniCategories.length > 0) {
        let dropdownMenu = null;

        function buildDropdown(categories) {
            if (!dropdownMenu) {
                dropdownMenu = document.createElement('div');
                dropdownMenu.className = 'cat-dropdown';
                document.body.appendChild(dropdownMenu);
            }

            dropdownMenu.innerHTML = `
                <div class="cat-dropdown-inner">
                    ${categories.map((cat) => `
                        <div class="cat-dropdown-col">
                            <a href="/subcategories?main=${encodeURIComponent(cat._id || '')}" class="cat-dropdown-title">
                                ${escapeHtml(cat.mainCategoryName || 'Category')}
                            </a>
                            <ul>
                                ${(cat.subcategories || []).map((sub) => `
                                    <li>
                                        <a href="/products?sub=${encodeURIComponent(sub._id || '')}">
                                            ${escapeHtml(sub.subCategoryName || 'Subcategory')}
                                        </a>
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        navLinks.addEventListener('mouseover', (event) => {
            const link = event.target.closest('a[data-category="true"]');

            if (!link) return;

            buildDropdown(arniCategories);

            if (dropdownMenu) {
                const rect = link.getBoundingClientRect();
                dropdownMenu.style.top = `${rect.bottom + 10}px`;
                dropdownMenu.style.left = `${Math.min(
                    Math.max(12, rect.left),
                    window.innerWidth - dropdownMenu.offsetWidth - 12
                )}px`;
                dropdownMenu.classList.add('open');
            }
        });

        document.addEventListener('mouseover', (event) => {
            if (
                dropdownMenu?.classList.contains('open') &&
                !event.target.closest('.cat-dropdown') &&
                !event.target.closest('[data-category="true"]')
            ) {
                dropdownMenu.classList.remove('open');
            }
        });

        window.addEventListener('scroll', () => {
            dropdownMenu?.classList.remove('open');
        }, { passive: true });
    }

    // =====================
    // PRODUCT LOADING + FILTERING
    // =====================
    const loadingSpinner = document.getElementById('loadingSpinner');
    const productGrid = document.getElementById('productGrid');
    const paginationElement = document.getElementById('pagination');
    const productCount = document.getElementById('productCount');

    async function fetchProducts() {
        try {
            if (loadingSpinner) loadingSpinner.style.display = 'block';

            const queryParams = new URLSearchParams({
                sort: currentFilters.sort,
            });

            if (currentFilters.minPrice) queryParams.set('minPrice', currentFilters.minPrice);
            if (currentFilters.maxPrice) queryParams.set('maxPrice', currentFilters.maxPrice);

            currentFilters.categories.forEach((category) => {
                queryParams.append('categories', category);
            });

            currentFilters.sizes.forEach((size) => {
                queryParams.append('sizes', size);
            });

            const response = await fetch(`/shop/products?${queryParams.toString()}`);

            if (!response.ok) {
                throw new Error('Error while fetching products');
            }

            const products = await response.json();

            allProducts = Array.isArray(products) ? products : [];
            totalPages = Math.ceil(allProducts.length / itemsPerPage);

            updateProductCount();

            return allProducts;
        } catch (error) {
            console.error('Error:', error);
            allProducts = [];
            totalPages = 0;
            updateProductCount();
            showErrorMessage('Error fetching products. Please try again.');
            return [];
        } finally {
            if (loadingSpinner) loadingSpinner.style.display = 'none';
        }
    }

    function updateProductCount() {
        if (!productCount) return;

        if (allProducts.length === 0) {
            productCount.textContent = 'No products found';
            return;
        }

        productCount.textContent = `${allProducts.length} product${allProducts.length === 1 ? '' : 's'} found`;
    }

    function getPaginatedProducts() {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return allProducts.slice(startIndex, endIndex);
    }

    function getProductImage(product) {
        const image = product?.images;

        if (Array.isArray(image)) return image[0] || '';
        return image || product?.displayImage || '';
    }

    function renderProducts(products) {
        if (!productGrid) return;

        productGrid.innerHTML = '';

        if (!products || products.length === 0) {
            productGrid.innerHTML = `
                <div class="no-products-message">
                    <div class="no-products-icon">🔍</div>
                    <h2>No Products Found</h2>
                    <p>Try adjusting your filters or search criteria.</p>
                </div>
            `;
            return;
        }

        products.forEach((product) => {
            const details = product.productDetails || product;
            const originalPrice = Number(details.price || 0);
            const discountPrice = Number(details.discountPrice || originalPrice || 0);
            const hasDiscount = originalPrice > discountPrice;
            const discount = hasDiscount
                ? Math.round(((originalPrice - discountPrice) / originalPrice) * 100)
                : 0;

            const rating = Number(details.review || 0);
            const safeRating = Number.isFinite(rating) ? rating : 0;
            const fullStars = Math.floor(safeRating);
            const hasHalfStar = safeRating % 1 >= 0.5;

            const starHTML = Array.from({ length: 5 }).map((_, index) => {
                if (index < fullStars) return '<i class="fas fa-star"></i>';
                if (index === fullStars && hasHalfStar) return '<i class="fas fa-star-half-alt"></i>';
                return '<i class="far fa-star"></i>';
            }).join('');

            const productId = encodeURIComponent(product._id || product.variantId || '');
            const productName = escapeHtml(details.name || 'Product');
            const imageUrl = escapeHtml(getProductImage(product));

            const productCard = document.createElement('article');
            productCard.className = 'product-card reveal';

            productCard.innerHTML = `
                <a href="/overview/${productId}" class="product-card-link">
                    <div class="product-image-wrapper">
                        <img src="${imageUrl}" alt="${productName}" class="product-image" loading="lazy">
                        ${discount > 0 ? `<span class="discount-tag">${discount}% OFF</span>` : ''}
                        <div class="quick-view-button">Quick View</div>
                    </div>
                    <div class="product-details">
                        <h3 class="product-title">${productName}</h3>
                        <div class="price-container">
                            <span class="current-price">₹${discountPrice.toLocaleString('en-IN')}</span>
                            ${hasDiscount ? `<span class="original-price">₹${originalPrice.toLocaleString('en-IN')}</span>` : ''}
                        </div>
                        <div class="product-meta">
                            <div class="rating-stars">${starHTML}</div>
                            <span class="rating-value">${safeRating.toFixed(1)}</span>
                        </div>
                    </div>
                </a>
            `;

            productGrid.appendChild(productCard);
        });

        observeReveals();
    }

    function renderPagination() {
        if (!paginationElement) return;

        paginationElement.innerHTML = '';

        if (totalPages <= 1) return;

        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        const paginationContainer = document.createElement('div');
        paginationContainer.className = 'pagination-container';

        const prevButton = document.createElement('button');
        prevButton.className = `pagination-button ${currentPage === 1 ? 'disabled' : ''}`;
        prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevButton.disabled = currentPage === 1;
        prevButton.type = 'button';
        prevButton.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage -= 1;
                updateProducts();
            }
        });
        paginationContainer.appendChild(prevButton);

        if (startPage > 1) {
            addPageButton(1);
            if (startPage > 2) addEllipsis();
        }

        for (let page = startPage; page <= endPage; page += 1) {
            addPageButton(page);
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) addEllipsis();
            addPageButton(totalPages);
        }

        const nextButton = document.createElement('button');
        nextButton.className = `pagination-button ${currentPage === totalPages ? 'disabled' : ''}`;
        nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
        nextButton.disabled = currentPage === totalPages;
        nextButton.type = 'button';
        nextButton.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage += 1;
                updateProducts();
            }
        });
        paginationContainer.appendChild(nextButton);

        paginationElement.appendChild(paginationContainer);

        function addPageButton(pageNumber) {
            const button = document.createElement('button');
            button.className = `pagination-button ${pageNumber === currentPage ? 'active' : ''}`;
            button.textContent = String(pageNumber);
            button.type = 'button';
            button.addEventListener('click', () => {
                if (pageNumber !== currentPage) {
                    currentPage = pageNumber;
                    updateProducts();
                }
            });
            paginationContainer.appendChild(button);
        }

        function addEllipsis() {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'pagination-ellipsis';
            ellipsis.textContent = '...';
            paginationContainer.appendChild(ellipsis);
        }
    }

    function updateProducts() {
        renderProducts(getPaginatedProducts());
        renderPagination();

        const top = document.querySelector('.products-container')?.getBoundingClientRect().top || 0;
        window.scrollTo({
            top: window.scrollY + top - 90,
            behavior: 'smooth',
        });
    }

    function showErrorMessage(message) {
        const existing = document.querySelector('.error-message');
        existing?.remove();

        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);

        setTimeout(() => errorDiv.remove(), 3000);
    }

    // =====================
    // FILTER EVENTS
    // =====================
    $('.sort-dropdown')?.addEventListener('change', async (event) => {
        currentFilters.sort = event.target.value;
        currentPage = 1;
        await fetchProducts();
        renderProducts(getPaginatedProducts());
        renderPagination();
    });

    $$('input[name="category"]').forEach((checkbox) => {
        checkbox.addEventListener('change', async (event) => {
            if (event.target.checked) {
                currentFilters.categories.push(event.target.value);
            } else {
                currentFilters.categories = currentFilters.categories.filter(
                    (category) => category !== event.target.value
                );
            }

            currentPage = 1;
            await fetchProducts();
            renderProducts(getPaginatedProducts());
            renderPagination();
        });
    });

    $('.apply-btn')?.addEventListener('click', async () => {
        currentFilters.minPrice = document.getElementById('minPrice')?.value || '';
        currentFilters.maxPrice = document.getElementById('maxPrice')?.value || '';
        currentPage = 1;

        await fetchProducts();
        renderProducts(getPaginatedProducts());
        renderPagination();
        closeFilters();
    });

    // =====================
    // SCROLL REVEAL
    // =====================
    let revealObserver = null;

    function observeReveals() {
        const revealEls = $$('.reveal:not(.visible)');

        if (!('IntersectionObserver' in window)) {
            revealEls.forEach((el) => el.classList.add('visible'));
            return;
        }

        if (!revealObserver) {
            revealObserver = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        revealObserver.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
        }

        revealEls.forEach((el, index) => {
            el.style.transitionDelay = `${(index % 4) * 70}ms`;
            revealObserver.observe(el);
        });
    }

    document.querySelectorAll('.section-header, .filters, .shop-hero-inner, .footer-brand, .footer-col')
        .forEach((el) => el.classList.add('reveal'));
    observeReveals();

    // =====================
    // INITIAL LOAD
    // =====================
    (async function init() {
        await fetchProducts();
        renderProducts(getPaginatedProducts());
        renderPagination();
    })();
});
