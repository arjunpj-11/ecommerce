document.addEventListener('DOMContentLoaded', () => {
    // =====================
    // DATA FROM EJS
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
    // NAVBAR — background + hide on scroll down
    // =====================
    const navbar = document.getElementById('navbar');
    let lastY = window.scrollY || 0;

    window.addEventListener('scroll', () => {
        const y = window.scrollY || 0;
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
    const searchToggle = document.querySelector('.search-toggle');
    const searchOverlay = document.getElementById('searchOverlay');
    const searchClose = document.getElementById('searchClose');

    searchToggle?.addEventListener('click', (event) => {
        event.preventDefault();
        const open = searchOverlay?.classList.toggle('open');
        if (open) searchOverlay?.querySelector('.search-input')?.focus();
    });

    searchClose?.addEventListener('click', () => {
        searchOverlay?.classList.remove('open');
    });

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

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            searchOverlay?.classList.remove('open');
            closeDrawer();
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
    // CATEGORY DROPDOWN — desktop
    // =====================
    const navLinks = document.getElementById('navLinks');
    let dropdownMenu = null;

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function buildDropdown(categories) {
        if (!dropdownMenu) {
            dropdownMenu = document.createElement('div');
            dropdownMenu.className = 'cat-dropdown';
            document.body.appendChild(dropdownMenu);
        }

        dropdownMenu.innerHTML = `
            <div class="cat-dropdown-inner">
                ${(categories || []).map((cat) => `
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

    function openDropdown(anchor) {
        if (!arniCategories.length) return;
        buildDropdown(arniCategories);
        const rect = anchor.getBoundingClientRect();
        const dropdownWidth = Math.min(720, window.innerWidth - 24);
        const left = Math.min(
            Math.max(12, rect.left),
            window.innerWidth - dropdownWidth - 12
        );

        if (dropdownMenu) {
            dropdownMenu.style.top = `${rect.bottom + window.scrollY + 10}px`;
            dropdownMenu.style.left = `${left}px`;
            dropdownMenu.style.maxWidth = `${dropdownWidth}px`;
            dropdownMenu.classList.add('open');
        }
    }

    function closeDropdown() {
        dropdownMenu?.classList.remove('open');
    }

    navLinks?.addEventListener('mouseover', (event) => {
        const link = event.target.closest?.('a[data-category="true"]');
        if (link) openDropdown(link);
    });

    navLinks?.addEventListener('click', (event) => {
        const link = event.target.closest?.('a[data-category="true"]');
        if (link) {
            event.preventDefault();
            dropdownMenu?.classList.contains('open') ? closeDropdown() : openDropdown(link);
        }
    });

    document.addEventListener('mouseover', (event) => {
        if (
            dropdownMenu?.classList.contains('open') &&
            !event.target.closest?.('.cat-dropdown') &&
            !event.target.closest?.('[data-category="true"]')
        ) {
            closeDropdown();
        }
    });

    window.addEventListener('resize', closeDropdown);
    window.addEventListener('scroll', closeDropdown, { passive: true });

    // =====================
    // SCROLL REVEAL
    // =====================
    const revealEls = document.querySelectorAll(
        '.section-header, .subcategory-card, .empty-state, .footer-brand, .footer-col'
    );

    revealEls.forEach((el, index) => {
        el.classList.add('reveal');
        el.style.transitionDelay = `${(index % 4) * 70}ms`;
    });

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

        revealEls.forEach((el) => observer.observe(el));
    } else {
        revealEls.forEach((el) => el.classList.add('visible'));
    }
});
