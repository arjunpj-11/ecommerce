document.addEventListener('DOMContentLoaded', () => {

    document.querySelectorAll('.color-btn').forEach((button) => {
    const color = button.dataset.colorValue || '#d1d5db';
    button.style.backgroundColor = color;
});
    // =====================
    // SAFE CATEGORY DATA
    // =====================
    const categoriesDataEl = document.getElementById('arni-categories-data');
    let arniCategories = [];

    try {
        arniCategories = categoriesDataEl
            ? JSON.parse(categoriesDataEl.textContent || '[]')
            : [];
    } catch (error) {
        console.error('Failed to parse ARNI categories:', error);
        arniCategories = [];
    }

    // =====================
    // NAVBAR — visible background + hide on scroll down
    // =====================
    const navbar = document.getElementById('navbar');
    let lastY = window.scrollY || 0;

    window.addEventListener('scroll', () => {
        const y = window.scrollY;
        navbar?.classList.toggle('scrolled', y > 20);

        if (navbar) {
            navbar.style.transform = (y > lastY && y > 140) ? 'translateY(-100%)' : 'translateY(0)';
        }

        lastY = y;
    }, { passive: true });

    // =====================
    // SEARCH OVERLAY
    // =====================
    const searchToggle = document.querySelector('.search-toggle');
    const searchOverlay = document.getElementById('searchOverlay');
    const searchClose = document.getElementById('searchClose');

    searchToggle?.addEventListener('click', (event) => {
        event.stopPropagation();
        const open = searchOverlay?.classList.toggle('open');
        if (open) searchOverlay?.querySelector('.search-input')?.focus();
    });

    searchClose?.addEventListener('click', () => searchOverlay?.classList.remove('open'));

    document.addEventListener('click', (event) => {
        const target = event.target;
        if (
            searchOverlay?.classList.contains('open') &&
            !searchOverlay.contains(target) &&
            !searchToggle?.contains(target)
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
    mobileOverlay?.addEventListener('click', closeDrawer);
    drawerClose?.addEventListener('click', closeDrawer);

    // =====================
    // CATEGORY DROPDOWN — desktop hover
    // =====================
    const navLinks = document.querySelector('.nav-links');
    let dropdownMenu = null;

    function escapeHtml(value) {
        return String(value ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function buildDropdown(categories) {
        if (!dropdownMenu) {
            dropdownMenu = document.createElement('div');
            dropdownMenu.className = 'cat-dropdown';
            document.body.appendChild(dropdownMenu);
        }

        if (!Array.isArray(categories) || categories.length === 0) {
            dropdownMenu.innerHTML = `
                <div class="cat-dropdown-inner">
                    <div class="cat-dropdown-col">
                        <span class="cat-dropdown-title">Categories</span>
                        <ul><li><a href="/shop">Explore Shop</a></li></ul>
                    </div>
                </div>
            `;
            return;
        }

        dropdownMenu.innerHTML = `
            <div class="cat-dropdown-inner">
                ${categories.map(cat => `
                    <div class="cat-dropdown-col">
                        <a href="/subcategories?main=${encodeURIComponent(cat._id)}" class="cat-dropdown-title">
                            ${escapeHtml(cat.mainCategoryName)}
                        </a>
                        <ul>
                            ${(cat.subcategories || []).map(sub => `
                                <li><a href="/products?sub=${encodeURIComponent(sub._id)}">${escapeHtml(sub.subCategoryName)}</a></li>
                            `).join('') || '<li><a href="/shop">View products</a></li>'}
                        </ul>
                    </div>
                `).join('')}
            </div>
        `;
    }

    if (navLinks) {
        navLinks.addEventListener('mouseover', (event) => {
            const link = event.target.closest?.('a[data-category="true"]');
            if (!link) return;

            buildDropdown(arniCategories);

            if (dropdownMenu) {
                const rect = link.getBoundingClientRect();
                dropdownMenu.style.top = `${rect.bottom + window.scrollY + 10}px`;
                dropdownMenu.style.left = `${Math.max(12, rect.left)}px`;
                dropdownMenu.classList.add('open');
            }
        });

        document.addEventListener('mouseover', (event) => {
            const target = event.target;
            if (
                dropdownMenu?.classList.contains('open') &&
                !target.closest?.('.cat-dropdown') &&
                !target.closest?.('[data-category="true"]')
            ) {
                dropdownMenu.classList.remove('open');
            }
        });
    }

    // =====================
    // SCROLL REVEAL
    // =====================
    const revealEls = document.querySelectorAll(
        '.product-gallery-card, .product-info-card, .section-header, .product-card, .footer-brand, .footer-col'
    );

    revealEls.forEach((el, index) => {
        el.classList.add('reveal');
        el.style.transitionDelay = `${(index % 4) * 70}ms`;
    });

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

        revealEls.forEach(el => observer.observe(el));
    } else {
        revealEls.forEach(el => el.classList.add('visible'));
    }

    // =====================
    // PRODUCT IMAGE GALLERY
    // =====================
    function initializeThumbnailClicks() {
        document.querySelectorAll('.thumbnail-btn').forEach(button => {
            button.addEventListener('click', () => {
                const thumb = button.querySelector('.thumbnail');
                const fullImage = thumb?.getAttribute('data-full');
                const mainImage = document.querySelector('.main-image');

                document.querySelectorAll('.thumbnail-btn').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                if (mainImage && fullImage) {
                    mainImage.src = fullImage;
                }
            });
        });
    }

    initializeThumbnailClicks();

    // =====================
    // ZOOM MODAL
    // =====================
    const zoomBtn = document.querySelector('.zoom-btn');

    zoomBtn?.addEventListener('click', () => {
        const mainImage = document.querySelector('.main-image');
        if (!mainImage?.src) return;

        const modal = document.createElement('div');
        modal.className = 'zoom-modal';

        const zoomedImage = document.createElement('img');
        zoomedImage.src = mainImage.src;
        zoomedImage.alt = mainImage.alt || 'Zoomed product image';
        zoomedImage.className = 'zoomed-image';

        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '<i class="fas fa-times"></i>';
        closeBtn.className = 'zoom-close-btn';
        closeBtn.type = 'button';
        closeBtn.setAttribute('aria-label', 'Close zoom');

        modal.appendChild(closeBtn);
        modal.appendChild(zoomedImage);
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';

        let isDragging = false;
        let initialX = 0;
        let initialY = 0;
        let xOffset = 0;
        let yOffset = 0;

        function setTranslate(xPos, yPos) {
            zoomedImage.style.transform = `translate3d(${xPos}px, ${yPos}px, 0) scale(1.6)`;
        }

        zoomedImage.addEventListener('mousedown', (event) => {
            isDragging = true;
            initialX = event.clientX - xOffset;
            initialY = event.clientY - yOffset;
            zoomedImage.style.cursor = 'grabbing';
        });

        modal.addEventListener('mousemove', (event) => {
            if (!isDragging) return;
            event.preventDefault();
            xOffset = event.clientX - initialX;
            yOffset = event.clientY - initialY;
            setTranslate(xOffset, yOffset);
        });

        function endDrag() {
            isDragging = false;
            zoomedImage.style.cursor = 'grab';
        }

        modal.addEventListener('mouseup', endDrag);
        modal.addEventListener('mouseleave', endDrag);

        function closeModal() {
            modal.remove();
            document.body.style.overflow = '';
        }

        closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', event => {
            if (event.target === modal) closeModal();
        });
        document.addEventListener('keydown', function escapeClose(event) {
            if (event.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', escapeClose);
            }
        });
    });

    // =====================
    // TOASTS
    // =====================
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'toastIn 0.28s ease-out reverse';
            setTimeout(() => toast.remove(), 280);
        }, 3000);
    }

    // =====================
    // SIZE + STOCK
    // =====================
    const quantityInput = document.querySelector('.quantity-input');
    const minusBtn = document.querySelector('.quantity-btn.minus');
    const plusBtn = document.querySelector('.quantity-btn.plus');
    const addToCartBtn = document.querySelector('.add-to-cart');

    function updateStockInfo(stockCount) {
        const stockInfo = document.querySelector('.stock-info');
        if (!stockInfo) return;

        const count = Number(stockCount || 0);
        const statusClass = count === 0 ? 'low' : count <= 30 ? 'medium' : 'high';
        const statusText = count === 0 ? 'Out of Stock' : count <= 30 ? 'Limited Stock' : 'In Stock';

        stockInfo.innerHTML = `
            <i class="fas fa-box"></i>
            <span class="stock-count">${count}</span> items in stock
            <span class="stock-status ${statusClass}">${statusText}</span>
        `;

        if (addToCartBtn) {
            addToCartBtn.disabled = count === 0;
            addToCartBtn.innerHTML = count === 0
                ? '<i class="fas fa-shopping-cart"></i> Out of Stock'
                : '<i class="fas fa-shopping-cart"></i> Add to Cart';
        }

        if (quantityInput) {
            quantityInput.disabled = count === 0;
            quantityInput.max = count;

            const currentValue = Number(quantityInput.value || 0);
            if (count === 0) {
                quantityInput.value = 0;
            } else if (currentValue < 1 || currentValue > count) {
                quantityInput.value = 1;
            }
        }
    }

    function bindSizeButtons() {
        document.querySelectorAll('.size-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.size-btn').forEach(button => button.classList.remove('active'));
                btn.classList.add('active');
                updateStockInfo(btn.dataset.stock || 0);
            });
        });
    }

    function updateSizeButtons(sizes) {
        const sizeOptions = document.querySelector('.size-options');
        if (!sizeOptions || !sizes) return;

        sizeOptions.innerHTML = Object.entries(sizes).map(([size, count], index) => `
            <button class="size-btn ${index === 0 ? 'active' : ''} ${Number(count) === 0 ? 'out-of-stock' : ''}"
                    type="button"
                    data-size="${escapeHtml(size)}"
                    data-stock="${Number(count)}">
                ${escapeHtml(size)}
            </button>
        `).join('');

        bindSizeButtons();

        const firstSize = sizeOptions.querySelector('.size-btn.active');
        if (firstSize) updateStockInfo(firstSize.dataset.stock || 0);
    }

    bindSizeButtons();

    const activeInitialSize = document.querySelector('.size-btn.active');
    if (activeInitialSize) {
        updateStockInfo(activeInitialSize.dataset.stock || 0);
    }

    // =====================
    // QUANTITY CONTROLS
    // =====================
    minusBtn?.addEventListener('click', () => {
        if (!quantityInput || quantityInput.disabled) return;
        const currentValue = Number(quantityInput.value || 1);
        quantityInput.value = Math.max(1, currentValue - 1);
    });

    plusBtn?.addEventListener('click', () => {
        if (!quantityInput || quantityInput.disabled) return;
        const currentValue = Number(quantityInput.value || 1);
        const maxStock = Number(quantityInput.max || document.querySelector('.stock-count')?.textContent || 1);
        quantityInput.value = Math.min(maxStock, currentValue + 1);
    });

    quantityInput?.addEventListener('input', () => {
        const maxStock = Number(quantityInput.max || 1);
        const value = Number(quantityInput.value || 1);
        if (value > maxStock) quantityInput.value = maxStock;
        if (value < 1 && maxStock > 0) quantityInput.value = 1;
    });

    // =====================
    // COLOR VARIANT SELECTION
    // =====================
    async function checkWishlistState() {
        const wishlistBtn = document.querySelector('.wishlist-btn');
        const activeColorBtn = document.querySelector('.color-btn.active');
        const variantId = activeColorBtn?.dataset.variantId;
        if (!wishlistBtn || !variantId) return;

        try {
            const response = await fetch(`/users/wishlist/check/${variantId}`);
            const data = await response.json();
            updateWishlistIcon(Boolean(data.isInWishlist));
        } catch (error) {
            console.error('Error checking wishlist state:', error);
        }
    }

    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const variantId = btn.dataset.variantId;
            if (!variantId) return;

            try {
                const response = await fetch(`/overview/variants/${variantId}`);
                if (!response.ok) throw new Error('Failed to fetch variant data');
                const variant = await response.json();

                history.pushState({}, '', `/overview/${variantId}`);

                const thumbnailColumn = document.querySelector('.thumbnail-column');
                if (thumbnailColumn && Array.isArray(variant.images)) {
                    thumbnailColumn.innerHTML = variant.images.map((image, index) => `
                        <button class="thumbnail-btn ${index === 0 ? 'active' : ''}" type="button" aria-label="View image ${index + 1}">
                            <img src="${escapeHtml(image)}"
                                 alt="Product thumbnail ${index + 1}"
                                 class="thumbnail"
                                 data-full="${escapeHtml(image)}">
                        </button>
                    `).join('');
                }

                const mainImage = document.querySelector('.main-image');
                if (mainImage && Array.isArray(variant.images) && variant.images[0]) {
                    mainImage.src = variant.images[0];
                }

                document.querySelectorAll('.color-btn').forEach(button => button.classList.remove('active'));
                btn.classList.add('active');

                updateSizeButtons(variant.sizes || {});
                initializeThumbnailClicks();
                await checkWishlistState();
            } catch (error) {
                console.error('Error fetching variant data:', error);
                showToast('Failed to switch color. Please try again.', 'error');
            }
        });
    });

    // =====================
    // ADD TO CART
    // =====================
    addToCartBtn?.addEventListener('click', async () => {
        const activeColorBtn = document.querySelector('.color-btn.active');
        const activeSizeBtn = document.querySelector('.size-btn.active');
        const variantId = activeColorBtn?.dataset.variantId;
        const selectedSize = activeSizeBtn?.dataset.size;
        const quantity = Number(quantityInput?.value || 0);
        const selectedStock = Number(activeSizeBtn?.dataset.stock || 0);

        if (!selectedSize) {
            showToast('Please select a size', 'error');
            return;
        }

        if (!variantId) {
            showToast('Please select a color', 'error');
            return;
        }

        if (selectedStock === 0) {
            showToast('Selected size is out of stock', 'error');
            return;
        }

        if (!quantity || quantity < 1) {
            showToast('Please enter a valid quantity', 'error');
            return;
        }

        try {
            const response = await fetch('/users/cart/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ variantId, quantity, selectedSize })
            });

            const result = await response.json();

            if (result.exists) {
                showToast('This item is already in your cart', 'error');
                return;
            }

            if (!response.ok) throw new Error(result.message || 'Failed to add item to cart');

            showToast(`Added ${quantity} item${quantity > 1 ? 's' : ''} to cart`);
        } catch (error) {
            console.error('Error adding to cart:', error);
            showToast('Failed to add item to cart. Please login and try again.', 'error');
        }
    });

    // =====================
    // WISHLIST
    // =====================
    const wishlistBtn = document.querySelector('.wishlist-btn');

    function updateWishlistIcon(isInWishlist) {
        const icon = wishlistBtn?.querySelector('i');
        if (!wishlistBtn || !icon) return;

        if (isInWishlist) {
            icon.classList.remove('far');
            icon.classList.add('fas');
            wishlistBtn.classList.add('active');
        } else {
            icon.classList.remove('fas');
            icon.classList.add('far');
            wishlistBtn.classList.remove('active');
        }
    }

    wishlistBtn?.addEventListener('click', async () => {
        const activeColorBtn = document.querySelector('.color-btn.active');
        const variantId = activeColorBtn?.dataset.variantId;

        if (!variantId) {
            showToast('Please select a color first', 'error');
            return;
        }

        try {
            const isCurrentlyActive = wishlistBtn.classList.contains('active');
            const response = await fetch('/users/wishlist/toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    variantId,
                    action: isCurrentlyActive ? 'remove' : 'add'
                })
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Failed to update wishlist');

            updateWishlistIcon(!isCurrentlyActive);
            showToast(isCurrentlyActive ? 'Removed from wishlist' : 'Added to wishlist');
        } catch (error) {
            console.error('Error updating wishlist:', error);
            showToast('Failed to update wishlist. Please login and try again.', 'error');
        }
    });

    checkWishlistState();
});
