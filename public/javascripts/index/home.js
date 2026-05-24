document.addEventListener('DOMContentLoaded', () => {
    // =====================
    // NAVBAR — solid glass background + hide on scroll down
    // =====================
    const navbar = document.getElementById('navbar');
    let lastY = window.scrollY || 0;

    function updateNavbar() {
        if (!navbar) return;
        const y = window.scrollY || 0;
        navbar.classList.toggle('scrolled', y > 20);
        navbar.style.transform = (y > lastY && y > 120) ? 'translateY(-100%)' : 'translateY(0)';
        lastY = y;
    }

    updateNavbar();
    window.addEventListener('scroll', updateNavbar, { passive: true });

    // =====================
    // SEARCH OVERLAY
    // =====================
    const searchToggle = document.querySelector('.search-toggle');
    const searchOverlay = document.getElementById('searchOverlay');
    const searchClose = document.getElementById('searchClose');
    const searchInput = searchOverlay?.querySelector('.search-input');

    function closeSearch() {
        searchOverlay?.classList.remove('open');
    }

    searchToggle?.addEventListener('click', e => {
        e.stopPropagation();
        const open = searchOverlay?.classList.toggle('open');
        if (open) searchInput?.focus();
    });

    searchClose?.addEventListener('click', closeSearch);

    document.addEventListener('click', e => {
        const target = e.target;
        if (searchOverlay?.classList.contains('open') &&
            !searchOverlay.contains(target) &&
            !searchToggle?.contains(target)) {
            closeSearch();
        }
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeSearch();
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

    document.querySelectorAll('.drawer-nav a').forEach(link => {
        link.addEventListener('click', closeDrawer);
    });

    // =====================
    // HERO SLIDER
    // =====================
    const track = document.getElementById('heroTrack');
    const slides = track ? Array.from(track.querySelectorAll('.hero-slide')) : [];
    const dots = Array.from(document.querySelectorAll('.hero-dot'));
    const prevBtn = document.getElementById('heroPrev');
    const nextBtn = document.getElementById('heroNext');
    const progressBar = document.getElementById('heroProgressBar');

    const SLIDE_DURATION = 6000;
    let current = 0;
    let timer = null;
    let paused = false;

    function goTo(index, instant = false) {
        if (!slides.length) return;

        slides[current]?.classList.remove('active');
        dots[current]?.classList.remove('active');

        current = ((index % slides.length) + slides.length) % slides.length;

        if (track) {
            track.style.transition = instant ? 'none' : 'transform 0.7s cubic-bezier(0.16,1,0.3,1)';
            track.style.transform = `translateX(-${current * 100}%)`;
        }

        slides[current]?.classList.add('active');
        dots[current]?.classList.add('active');
    }

    function startProgress() {
        if (!progressBar || slides.length <= 1) return;
        progressBar.style.transition = 'none';
        progressBar.style.width = '0%';
        void progressBar.offsetWidth;
        progressBar.style.transition = `width ${SLIDE_DURATION}ms linear`;
        progressBar.style.width = '100%';
    }

    function stopAuto() {
        if (timer) clearInterval(timer);
        timer = null;
        if (progressBar) progressBar.style.transition = 'none';
    }

    function startAuto() {
        stopAuto();
        if (paused || slides.length <= 1) return;
        startProgress();
        timer = setInterval(() => {
            goTo(current + 1);
            startProgress();
        }, SLIDE_DURATION);
    }

    if (slides.length > 0) {
        goTo(0, true);
        startAuto();

        prevBtn?.addEventListener('click', () => { goTo(current - 1); startAuto(); });
        nextBtn?.addEventListener('click', () => { goTo(current + 1); startAuto(); });

        dots.forEach((dot, i) => {
            dot.addEventListener('click', () => { goTo(i); startAuto(); });
        });

        track?.addEventListener('mouseenter', () => { paused = true; stopAuto(); });
        track?.addEventListener('mouseleave', () => { paused = false; startAuto(); });

        let touchStartX = 0;
        track?.addEventListener('touchstart', e => {
            touchStartX = e.changedTouches[0].screenX;
            stopAuto();
        }, { passive: true });

        track?.addEventListener('touchend', e => {
            const diff = e.changedTouches[0].screenX - touchStartX;
            if (Math.abs(diff) > 40) goTo(diff > 0 ? current - 1 : current + 1);
            startAuto();
        }, { passive: true });

        document.addEventListener('keydown', e => {
            if (e.key === 'ArrowLeft') { goTo(current - 1); startAuto(); }
            if (e.key === 'ArrowRight') { goTo(current + 1); startAuto(); }
        });

        document.addEventListener('visibilitychange', () => {
            document.hidden ? stopAuto() : startAuto();
        });

        let resizeId;
        window.addEventListener('resize', () => {
            clearTimeout(resizeId);
            resizeId = setTimeout(() => {
                if (track) {
                    track.style.transition = 'none';
                    track.style.transform = `translateX(-${current * 100}%)`;
                }
            }, 200);
        });
    }

    // =====================
    // SCROLL REVEAL
    // =====================
    const revealEls = document.querySelectorAll(
        '.cat-card, .product-card, .section-header, .promo-text, .footer-brand, .footer-col, .empty-state'
    );

    revealEls.forEach((el, i) => {
        el.classList.add('reveal');
        el.style.transitionDelay = `${(i % 4) * 70}ms`;
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
    // CATEGORY DROPDOWN (desktop hover/focus)
    // =====================
    const navLinks = document.querySelector('.nav-links');
    const categoryTrigger = document.querySelector('[data-category="true"]');
    const categoriesDataEl = document.getElementById('arni-categories-data');
    let categories = [];

    try {
        categories = categoriesDataEl
            ? JSON.parse(categoriesDataEl.textContent || '[]')
            : [];
    } catch (error) {
        console.error('Failed to parse ARNI categories:', error);
        categories = [];
    }

    if (!Array.isArray(categories)) categories = [];

    let dropdownMenu = null;
    let closeDropdownTimer = null;

    function escapeHTML(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function buildDropdown() {
        if (!categories.length) return null;

        if (!dropdownMenu) {
            dropdownMenu = document.createElement('div');
            dropdownMenu.className = 'cat-dropdown';
            document.body.appendChild(dropdownMenu);

            dropdownMenu.addEventListener('mouseenter', () => clearTimeout(closeDropdownTimer));
            dropdownMenu.addEventListener('mouseleave', scheduleCloseDropdown);
        }

        dropdownMenu.innerHTML = `
            <div class="cat-dropdown-inner">
                ${categories.map(cat => `
                    <div class="cat-dropdown-col">
                        <a href="/subcategories?main=${encodeURIComponent(cat._id)}" class="cat-dropdown-title">
                            ${escapeHTML(cat.mainCategoryName)}
                        </a>
                        <ul>
                            ${(cat.subcategories || []).map(sub => `
                                <li><a href="/products?sub=${encodeURIComponent(sub._id)}">${escapeHTML(sub.subCategoryName)}</a></li>
                            `).join('') || '<li><span>No subcategories yet</span></li>'}
                        </ul>
                    </div>
                `).join('')}
            </div>
        `;

        return dropdownMenu;
    }

    function positionDropdown(trigger) {
        if (!dropdownMenu || !trigger) return;
        const rect = trigger.getBoundingClientRect();
        const width = Math.min(window.innerWidth - 24, 760);
        const left = Math.min(Math.max(12, rect.left), window.innerWidth - width - 12);

        dropdownMenu.style.top = `${rect.bottom + 10}px`;
        dropdownMenu.style.left = `${left}px`;
        dropdownMenu.style.maxWidth = `${width}px`;
    }

    function openDropdown(trigger) {
        clearTimeout(closeDropdownTimer);
        if (!buildDropdown()) return;
        positionDropdown(trigger);
        dropdownMenu?.classList.add('open');
        trigger?.setAttribute('aria-expanded', 'true');
    }

    function closeDropdown() {
        dropdownMenu?.classList.remove('open');
        categoryTrigger?.setAttribute('aria-expanded', 'false');
    }

    function scheduleCloseDropdown() {
        clearTimeout(closeDropdownTimer);
        closeDropdownTimer = setTimeout(closeDropdown, 120);
    }

    if (navLinks && categoryTrigger && categories.length) {
        categoryTrigger.addEventListener('mouseenter', () => openDropdown(categoryTrigger));
        categoryTrigger.addEventListener('focus', () => openDropdown(categoryTrigger));
        categoryTrigger.addEventListener('mouseleave', scheduleCloseDropdown);
        categoryTrigger.addEventListener('click', e => {
            e.preventDefault();
            dropdownMenu?.classList.contains('open') ? closeDropdown() : openDropdown(categoryTrigger);
        });

        window.addEventListener('resize', () => {
            if (dropdownMenu?.classList.contains('open')) positionDropdown(categoryTrigger);
        });

        window.addEventListener('scroll', () => {
            if (dropdownMenu?.classList.contains('open')) positionDropdown(categoryTrigger);
        }, { passive: true });

        document.addEventListener('click', e => {
            if (dropdownMenu?.classList.contains('open') &&
                !dropdownMenu.contains(e.target) &&
                !categoryTrigger.contains(e.target)) {
                closeDropdown();
            }
        });
    }
});
