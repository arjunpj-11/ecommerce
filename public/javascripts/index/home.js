document.addEventListener('DOMContentLoaded', function() {
    // =============== SLIDER FUNCTIONALITY ===============
    function initializeSlider() {
        const sliderContainer = document.querySelector('.slider-container');
        const slides = document.querySelectorAll('.slide');
        const dots = document.querySelectorAll('.slider-dot');
        const prevBtn = document.querySelector('.slider-arrow.prev');
        const nextBtn = document.querySelector('.slider-arrow.next');
        
        let currentSlide = 0;
        const slideCount = slides.length;
        let isAnimating = false;
        const animationDuration = 500;
        let slideInterval;

        // Adjust slider timing based on device
        const isMobile = window.innerWidth < 768;
        const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
        const slideIntervalDuration = isMobile ? 5000 : 7000; // Faster on mobile

        // Initialize slide backgrounds
        function initializeSlideBackgrounds() {
            slides.forEach(slide => {
                const bannerData = JSON.parse(slide.dataset.banner || '{}');
                if (bannerData.imageUrl) {
                    const img = new Image();
                    img.onload = () => {
                        slide.style.background = `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url('${bannerData.imageUrl}') center/cover`;
                    };
                    img.onerror = () => {
                        slide.style.background = 'rgba(0, 0, 0, 0.5)';
                    };
                    img.src = bannerData.imageUrl;
                } else {
                    slide.style.background = 'rgba(0, 0, 0, 0.5)';
                }
            });
        }

        // Update slider state
        function updateSlider(instant = false) {
            if (instant) {
                sliderContainer.style.transition = 'none';
            }
            
            sliderContainer.style.transform = `translateX(-${currentSlide * 100}%)`;
            
            if (instant) {
                sliderContainer.offsetHeight;
                sliderContainer.style.transition = '';
            }

            dots.forEach((dot, index) => {
                dot.classList.toggle('active', index === currentSlide);
                dot.setAttribute('aria-current', index === currentSlide ? 'true' : 'false');
            });

            slides.forEach((slide, index) => {
                const isActive = index === currentSlide;
                slide.classList.toggle('active', isActive);
                slide.setAttribute('aria-hidden', !isActive);
                
                const focusableElements = slide.querySelectorAll('a, button, [tabindex]');
                focusableElements.forEach(el => {
                    if (isActive) {
                        el.removeAttribute('tabindex');
                    } else {
                        el.setAttribute('tabindex', '-1');
                    }
                });
            });
        }

        // Navigation functions
        function goToSlide(index, instant = false) {
            if (isAnimating && !instant) return;
            
            isAnimating = true;
            currentSlide = (index + slideCount) % slideCount;
            updateSlider(instant);

            setTimeout(() => {
                isAnimating = false;
            }, instant ? 0 : animationDuration);
        }

        function nextSlide() {
            goToSlide(currentSlide + 1);
        }

        function prevSlide() {
            goToSlide(currentSlide - 1);
        }

        // Auto-slide functions
        function startAutoSlide() {
            stopAutoSlide();
            slideInterval = setInterval(nextSlide, slideIntervalDuration);
        }

        function stopAutoSlide() {
            if (slideInterval) {
                clearInterval(slideInterval);
                slideInterval = null;
            }
        }

        function resetAutoSlide() {
            startAutoSlide();
        }

        // Event listeners setup
        function setupSliderEventListeners() {
            prevBtn.addEventListener('click', () => {
                prevSlide();
                resetAutoSlide();
            });

            nextBtn.addEventListener('click', () => {
                nextSlide();
                resetAutoSlide();
            });

            dots.forEach((dot, index) => {
                dot.addEventListener('click', () => {
                    goToSlide(index);
                    resetAutoSlide();
                });
            });

            sliderContainer.addEventListener('mouseenter', stopAutoSlide);
            sliderContainer.addEventListener('mouseleave', startAutoSlide);

            // Touch support
            let touchStartX = 0;
            let touchEndX = 0;

            sliderContainer.addEventListener('touchstart', (e) => {
                touchStartX = e.changedTouches[0].screenX;
                stopAutoSlide();
            }, { passive: true });

            sliderContainer.addEventListener('touchend', (e) => {
                touchEndX = e.changedTouches[0].screenX;
                handleSwipe();
                startAutoSlide();
            }, { passive: true });

            function handleSwipe() {
                const swipeThreshold = 50;
                const swipeDistance = touchEndX - touchStartX;

                if (Math.abs(swipeDistance) > swipeThreshold) {
                    if (swipeDistance > 0) {
                        prevSlide();
                    } else {
                        nextSlide();
                    }
                }
            }

            // Keyboard navigation
            document.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowLeft') {
                    prevSlide();
                    resetAutoSlide();
                } else if (e.key === 'ArrowRight') {
                    nextSlide();
                    resetAutoSlide();
                }
            });

            // Visibility change handler
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    stopAutoSlide();
                } else {
                    startAutoSlide();
                }
            });

            // Resize handler
            let resizeTimer;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(() => {
                    updateSlider(true);
                }, 250);
            });
        }

        // Initialize slider
        initializeSlideBackgrounds();
        setupSliderEventListeners();
        startAutoSlide();
        updateSlider(true);
    }

    // =============== BACKGROUND CANVAS ANIMATION ===============
    function initializeBackgroundCanvas() {
        const canvas = document.getElementById('backgroundCanvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let mousePosition = { x: 0, y: 0 };
        const isMobile = window.innerWidth < 768;

        // Adjust particle count based on device for better performance
        const particleCount = isMobile ? 30 : 100;

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
                this.speedX = Math.random() * 1 - 0.5;
                this.speedY = Math.random() * 1 - 0.5;
                this.life = 0;
                this.maxLife = Math.random() * 200 + 100;
                const colors = [
                    'hsla(45, 100%, 50%, 0.2)',
                    'hsla(280, 70%, 40%, 0.2)',
                    'hsla(350, 70%, 40%, 0.2)'
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

        const particles = Array.from({ length: particleCount }, () => new Particle());

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

        setCanvasSize();
        window.addEventListener('resize', setCanvasSize);
        window.addEventListener('mousemove', (e) => {
            mousePosition = { x: e.clientX, y: e.clientY };
        });

        animate();
    }

    // =============== SEARCH FUNCTIONALITY ===============
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

    // =============== MOBILE MENU TOGGLE ===============
    function initializeMobileMenu() {
        const hamburgerMenu = document.createElement('div');
        hamburgerMenu.className = 'hamburger-menu';
        hamburgerMenu.innerHTML = '<span></span><span></span><span></span>';
        
        const navContainer = document.querySelector('.nav-container');
        const navLinks = document.querySelector('.nav-links');
        
        if (navContainer && !document.querySelector('.hamburger-menu')) {
            navContainer.insertBefore(hamburgerMenu, navLinks);
        }
        
        // Toggle mobile menu
        hamburgerMenu.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            this.classList.toggle('active');
            document.body.classList.toggle('menu-open');
        });
        
        // Handle category touch events on mobile
        const categoryLinks = document.querySelectorAll('a[data-category="true"]');
        categoryLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                if (window.matchMedia('(hover: none)').matches) {
                    e.preventDefault();
                    categoryLinks.forEach(otherLink => {
                        if (otherLink !== link) {
                            otherLink.classList.remove('touch-active');
                        }
                    });
                    this.classList.toggle('touch-active');
                }
            });
        });
    }

    // =============== SCROLL ANIMATIONS ===============
    function initializeScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        document.querySelectorAll('.section-title, .category, .product-card').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'all 0.6s ease-out';
            observer.observe(el);
        });

        return observer;
    }

    // =============== NAVBAR SCROLL EFFECT ===============
    function initializeNavbar() {
        const navbar = document.querySelector('.navbar');
        let lastScrollTop = 0;

        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            if (scrollTop > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
            
            if (scrollTop > lastScrollTop && scrollTop > 100) {
                navbar.style.transform = 'translateY(-100%)';
            } else {
                navbar.style.transform = 'translateY(0)';
            }
            
            lastScrollTop = scrollTop;
        });
    }

    // =============== CATEGORY MENU ===============
    function initializeCategoryMenu() {
        const navLinks = document.querySelector('.nav-links');
        const categoryMenu = document.createElement('div');
        categoryMenu.className = 'category-menu hidden';
        document.body.appendChild(categoryMenu);

        function renderCategoryMenu(categories) {
            categoryMenu.innerHTML = categories.map(category => `
                <div class="category-section">
                    <h3 class="category-header">
                        <a href="/main/${category._id}">${category.mainCategoryName}</a>
                    </h3>
                    <ul class="subcategory-list">
                        ${category.subcategories.map(sub => `
                            <li>
                                <a href="/sub/${sub._id}">${sub.subCategoryName}</a>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `).join('');
        }

        navLinks.addEventListener('mouseenter', function(e) {
            const target = e.target.closest('a[data-category="true"]');
            if (target) {
                const categoryData = JSON.parse(target.dataset.categories);
                renderCategoryMenu(categoryData);
                categoryMenu.classList.remove('hidden');
                
                const rect = target.getBoundingClientRect();
                categoryMenu.style.top = `${rect.bottom}px`;
                categoryMenu.style.left = `${rect.left}px`;
            }
        });

        navLinks.addEventListener('mouseleave', function(e) {
            if (!e.relatedTarget || !e.relatedTarget.closest('.category-menu')) {
                categoryMenu.classList.add('hidden');
            }
        });

        categoryMenu.addEventListener('mouseleave', function(e) {
            if (!e.relatedTarget || !e.relatedTarget.closest('.nav-links')) {
                categoryMenu.classList.add('hidden');
            }
        });
    }

    // =============== CATEGORY CARDS ===============
    function initializeCategoryCards() {
        const categoryCards = document.querySelectorAll('.category');
        categoryCards.forEach(card => {
            card.addEventListener('click', function() {
                const categoryId = this.dataset.categoryId;
                if (categoryId) {
                    window.location.href = `/subcategories?main=${categoryId}`;
                }
            });
            card.style.cursor = 'pointer';
        });
    }

    // =============== RESPONSIVE LAYOUT ADJUSTMENTS ===============
    function initializeResponsiveLayout() {
        function adjustLayout() {
            const productCards = document.querySelectorAll('.product-card');
            if (window.innerWidth < 480) {
                productCards.forEach(card => {
                    const info = card.querySelector('.product-info');
                    if (info) {
                        // Simplify info on very small screens
                        const priceRow = info.querySelector('.price-row');
                        if (priceRow) {
                            priceRow.style.flexDirection = 'column';
                            priceRow.style.alignItems = 'center';
                        }
                    }
                });
            } else {
                productCards.forEach(card => {
                    const priceRow = card.querySelector('.price-row');
                    if (priceRow) {
                        priceRow.style.flexDirection = '';
                        priceRow.style.alignItems = '';
                    }
                });
            }
        }

        window.addEventListener('resize', adjustLayout);
        adjustLayout(); // Initial adjustment
    }

    // =============== PERFORMANCE OPTIMIZATIONS ===============
    function initializePerformanceOptimizations() {
        window.addEventListener('load', () => {
            const imagesToPreload = [
                ...Array.from(document.querySelectorAll('.slide')).map(slide => {
                    const bannerData = JSON.parse(slide.dataset.banner || '{}');
                    return bannerData.imageUrl;
                }),
                ...Array.from(document.querySelectorAll('.category img')).map(img => img.src),
                ...Array.from(document.querySelectorAll('.product-image')).map(img => img.src)
            ].filter(Boolean);

            imagesToPreload.forEach(src => {
                const img = new Image();
                img.src = src;
            });
        });
    }

    // =============== ERROR HANDLING ===============
    function initializeErrorHandling() {
        window.addEventListener('error', function(e) {
            console.error('Runtime error:', e);
            // You might want to send this to your error tracking service
        });
    }

    // =============== INITIALIZATION ===============
    function initialize() {
        // Store cleanup functions
        const cleanupFunctions = [];

        try {
            // Initialize all components
            initializeSlider();
            initializeBackgroundCanvas();
            initializeMobileMenu();
            const scrollObserver = initializeScrollAnimations();
            initializeNavbar();
            initializeCategoryMenu();
            initializeCategoryCards();
            initializeResponsiveLayout();
            initializePerformanceOptimizations();
            initializeErrorHandling();

            // Add cleanup functions
            cleanupFunctions.push(
                () => {
                    // Clear all intervals and timeouts
                    const highestTimeoutId = setTimeout(";");
                    for (let i = 0; i < highestTimeoutId; i++) {
                        clearTimeout(i);
                    }
                    
                    // Disconnect observers
                    if (scrollObserver) scrollObserver.disconnect();
                    
                    // Remove event listeners (if needed)
                    window.removeEventListener('scroll', () => {});
                    window.removeEventListener('resize', () => {});
                    
                    // Clean up canvas
                    const canvas = document.getElementById('backgroundCanvas');
                    if (canvas) {
                        canvas.width = canvas.height = 0;
                        canvas.remove();
                    }
                    
                    // Remove modals
                    const searchModal = document.querySelector('.search-modal');
                    if (searchModal) searchModal.remove();
                    
                    const categoryMenu = document.querySelector('.category-menu');
                    if (categoryMenu) categoryMenu.remove();
                }
            );

        } catch (error) {
            console.error('Initialization error:', error);
        }

        // Export cleanup function
        window.cleanup = () => {
            cleanupFunctions.forEach(cleanup => cleanup());
        };
    }

    // Start initialization
    initialize();
});