document.addEventListener('DOMContentLoaded', function () {
  initBackgroundCanvas();
  initNavbar();
  initCategoryDropdown();
  initOrderSystem();
  initRevealAnimations();
});

function initBackgroundCanvas() {
  const canvas = document.getElementById('backgroundCanvas');

  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let mousePosition = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2
  };

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
      this.size = Math.random() * 2 + 0.6;
      this.speedX = Math.random() * 0.7 - 0.35;
      this.speedY = Math.random() * 0.7 - 0.35;
      this.life = 0;
      this.maxLife = Math.random() * 220 + 120;

      const colors = [
        'rgba(16, 110, 190, 0.18)',
        'rgba(15, 252, 190, 0.16)',
        'rgba(90, 174, 232, 0.16)'
      ];

      this.color = colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      this.life++;

      if (
        this.life >= this.maxLife ||
        this.x < 0 ||
        this.x > canvas.width ||
        this.y < 0 ||
        this.y > canvas.height
      ) {
        this.reset();
      }
    }

    draw() {
      const opacity = 1 - this.life / this.maxLife;

      ctx.globalAlpha = Math.max(opacity, 0);
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  const particles = Array.from({ length: 90 }, () => new Particle());

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach((particle) => {
      particle.update();
      particle.draw();
    });

    const mouseGradient = ctx.createRadialGradient(
      mousePosition.x,
      mousePosition.y,
      0,
      mousePosition.x,
      mousePosition.y,
      170
    );

    mouseGradient.addColorStop(0, 'rgba(15, 252, 190, 0.12)');
    mouseGradient.addColorStop(0.45, 'rgba(16, 110, 190, 0.06)');
    mouseGradient.addColorStop(1, 'rgba(244, 250, 255, 0)');

    ctx.fillStyle = mouseGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    requestAnimationFrame(animate);
  }

  window.addEventListener('mousemove', function (event) {
    mousePosition = {
      x: event.clientX,
      y: event.clientY
    };
  });

  animate();
}

function initNavbar() {
  const navbar = document.getElementById('navbar');
  const searchToggle = document.querySelector('.search-toggle');
  const searchOverlay = document.getElementById('searchOverlay');
  const searchClose = document.getElementById('searchClose');
  const hamburger = document.getElementById('hamburger');
  const mobileOverlay = document.getElementById('mobileOverlay');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const drawerClose = document.getElementById('drawerClose');

  function closeSearch() {
    if (!searchOverlay) return;
    searchOverlay.classList.remove('open');
  }

  function closeDrawer() {
    if (hamburger) hamburger.classList.remove('open');
    if (mobileOverlay) mobileOverlay.classList.remove('visible');
    if (mobileDrawer) mobileDrawer.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (navbar) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 40) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });
  }

  if (searchToggle && searchOverlay) {
    searchToggle.addEventListener('click', function () {
      searchOverlay.classList.toggle('open');

      const input = searchOverlay.querySelector('.search-input');
      if (searchOverlay.classList.contains('open') && input) {
        input.focus();
      }
    });
  }

  if (searchClose) {
    searchClose.addEventListener('click', closeSearch);
  }

  if (hamburger && mobileOverlay && mobileDrawer) {
    hamburger.addEventListener('click', function () {
      hamburger.classList.toggle('open');
      mobileOverlay.classList.toggle('visible');
      mobileDrawer.classList.toggle('open');

      document.body.style.overflow = mobileDrawer.classList.contains('open')
        ? 'hidden'
        : '';
    });
  }

  if (drawerClose) {
    drawerClose.addEventListener('click', closeDrawer);
  }

  if (mobileOverlay) {
    mobileOverlay.addEventListener('click', closeDrawer);
  }

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      closeSearch();
      closeDrawer();
    }
  });
}

function initCategoryDropdown() {
  const categoryTrigger = document.querySelector('[data-category="true"]');
  const dataScript = document.getElementById('arni-categories-data');

  if (!categoryTrigger || !dataScript) return;

  let categories = [];

  try {
    categories = JSON.parse(dataScript.textContent || '[]');
  } catch (error) {
    categories = [];
  }

  if (!Array.isArray(categories) || categories.length === 0) return;

  const dropdown = document.createElement('div');
  dropdown.className = 'cat-dropdown';

  const inner = document.createElement('div');
  inner.className = 'cat-dropdown-inner';

  categories.forEach(function (category) {
    const column = document.createElement('div');
    column.className = 'cat-dropdown-col';

    const title = document.createElement('a');
    title.className = 'cat-dropdown-title';
    title.href = `/subcategories?main=${category._id}`;
    title.textContent = category.mainCategoryName || 'Category';

    const list = document.createElement('ul');

    const subCategories = Array.isArray(category.subcategories)
      ? category.subcategories
      : Array.isArray(category.subCategories)
        ? category.subCategories
        : [];

    if (subCategories.length > 0) {
      subCategories.forEach(function (subCategory) {
        const item = document.createElement('li');
        const link = document.createElement('a');

        link.href = `/products?sub=${subCategory._id}`;
        link.textContent =
          subCategory.subCategoryName ||
          subCategory.name ||
          'Subcategory';

        item.appendChild(link);
        list.appendChild(item);
      });
    } else {
      const item = document.createElement('li');
      const link = document.createElement('a');

      link.href = `/subcategories?main=${category._id}`;
      link.textContent = 'View all';

      item.appendChild(link);
      list.appendChild(item);
    }

    column.appendChild(title);
    column.appendChild(list);
    inner.appendChild(column);
  });

  dropdown.appendChild(inner);
  document.body.appendChild(dropdown);

  function positionDropdown() {
    const rect = categoryTrigger.getBoundingClientRect();

    dropdown.style.top = `${rect.bottom + 12}px`;
    dropdown.style.left = `${Math.min(
      rect.left,
      window.innerWidth - dropdown.offsetWidth - 16
    )}px`;
  }

  function openDropdown() {
    positionDropdown();
    dropdown.classList.add('open');
  }

  function closeDropdown() {
    dropdown.classList.remove('open');
  }

  categoryTrigger.addEventListener('mouseenter', openDropdown);
  categoryTrigger.addEventListener('focus', openDropdown);
  dropdown.addEventListener('mouseenter', openDropdown);

  categoryTrigger.addEventListener('mouseleave', function () {
    setTimeout(function () {
      if (!dropdown.matches(':hover')) closeDropdown();
    }, 120);
  });

  dropdown.addEventListener('mouseleave', closeDropdown);

  window.addEventListener('resize', function () {
    if (dropdown.classList.contains('open')) {
      positionDropdown();
    }
  });

  window.addEventListener('scroll', function () {
    if (dropdown.classList.contains('open')) {
      positionDropdown();
    }
  });
}

function initOrderSystem() {
  document.querySelectorAll('.lets-go-button[data-order-id]').forEach(function (button) {
    button.addEventListener('click', function (event) {
      event.preventDefault();

      const orderId = button.dataset.orderId;

      if (!orderId || button.disabled) return;

      window.location.href = `/users/orderOverview/${orderId}`;
    });
  });

  document.querySelectorAll('.order-card[data-order-id]').forEach(function (card) {
    card.addEventListener('click', function (event) {
      const clickedButton = event.target.closest('button, a');

      if (clickedButton) return;

      const orderId = card.dataset.orderId;

      if (!orderId) return;

      window.location.href = `/users/orderOverview/${orderId}`;
    });
  });

  document.querySelectorAll('.pagination-button.disabled').forEach(function (button) {
    button.addEventListener('click', function (event) {
      event.preventDefault();
    });
  });
}

function initRevealAnimations() {
  const revealElements = document.querySelectorAll('.reveal, .order-card');

  if (!revealElements.length) return;

  const observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px'
    }
  );

  revealElements.forEach(function (element, index) {
    element.style.transitionDelay = `${Math.min(index * 45, 260)}ms`;
    observer.observe(element);
  });
}