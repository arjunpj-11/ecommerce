document.addEventListener("DOMContentLoaded", () => {
  const navbar = document.getElementById("navbar");
  const searchToggle = document.querySelector(".search-toggle");
  const searchOverlay = document.getElementById("searchOverlay");
  const searchClose = document.getElementById("searchClose");

  const hamburger = document.getElementById("hamburger");
  const mobileDrawer = document.getElementById("mobileDrawer");
  const mobileOverlay = document.getElementById("mobileOverlay");
  const drawerClose = document.getElementById("drawerClose");

  const categoriesDataEl = document.getElementById("arni-categories-data");
  const showCouponsBtn = document.getElementById("showCouponsBtn");
  const closeCouponsBtn = document.getElementById("closeCouponsBtn");
  const couponSuggestions = document.getElementById("couponSuggestions");
  const couponInput = document.getElementById("couponInput");
  const canvas = document.getElementById("backgroundCanvas");

  let lastScrollY = 0;
  let arniCategories = [];

  try {
    arniCategories = categoriesDataEl
      ? JSON.parse(categoriesDataEl.textContent || "[]")
      : [];
  } catch (error) {
    console.error("Failed to parse ARNI categories:", error);
    arniCategories = [];
  }

  initializeCanvas();
  initializeNavbar();
  initializeSearch();
  initializeMobileDrawer();
  initializeCategoryDropdown();
  initializeCouponDropdown();
  initializeColorCircles();
  initializeReveal();

  window.updateQuantity = updateQuantity;
  window.removeItem = removeItem;
  window.selectCoupon = selectCoupon;
  window.applyCoupon = applyCoupon;
  window.proceedToCheckout = proceedToCheckout;

  function initializeNavbar() {
    if (!navbar) return;

    window.addEventListener(
      "scroll",
      () => {
        const currentY = window.scrollY;

        navbar.classList.toggle("scrolled", currentY > 20);
        navbar.style.transform =
          currentY > lastScrollY && currentY > 140
            ? "translateY(-100%)"
            : "translateY(0)";

        lastScrollY = currentY;
      },
      { passive: true },
    );
  }

  function initializeSearch() {
    searchToggle?.addEventListener("click", () => {
      const isOpen = searchOverlay?.classList.toggle("open");

      if (isOpen) {
        searchOverlay?.querySelector(".search-input")?.focus();
      }
    });

    searchClose?.addEventListener("click", () => {
      searchOverlay?.classList.remove("open");
    });

    document.addEventListener("click", (event) => {
      if (
        searchOverlay?.classList.contains("open") &&
        !searchOverlay.contains(event.target) &&
        !searchToggle?.contains(event.target)
      ) {
        searchOverlay.classList.remove("open");
      }
    });
  }

  function initializeMobileDrawer() {
    function openDrawer() {
      mobileDrawer?.classList.add("open");
      mobileOverlay?.classList.add("visible");
      hamburger?.classList.add("open");
      document.body.style.overflow = "hidden";
    }

    function closeDrawer() {
      mobileDrawer?.classList.remove("open");
      mobileOverlay?.classList.remove("visible");
      hamburger?.classList.remove("open");
      document.body.style.overflow = "";
    }

    hamburger?.addEventListener("click", () => {
      if (mobileDrawer?.classList.contains("open")) {
        closeDrawer();
      } else {
        openDrawer();
      }
    });

    mobileOverlay?.addEventListener("click", closeDrawer);
    drawerClose?.addEventListener("click", closeDrawer);

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeDrawer();
        searchOverlay?.classList.remove("open");
        closeCouponDropdown();
      }
    });
  }

  function initializeCategoryDropdown() {
    const navLinks = document.querySelector(".nav-links");
    if (!navLinks || !arniCategories.length) return;

    let dropdownMenu = null;

    function buildDropdown(categories) {
      if (!dropdownMenu) {
        dropdownMenu = document.createElement("div");
        dropdownMenu.className = "cat-dropdown";
        document.body.appendChild(dropdownMenu);
      }

      dropdownMenu.innerHTML = `
        <div class="cat-dropdown-inner">
          ${categories
            .map(
              (category) => `
            <div class="cat-dropdown-col">
              <a href="/subcategories?main=${escapeHtml(category._id || "")}" class="cat-dropdown-title">
                ${escapeHtml(category.mainCategoryName || "Category")}
              </a>

              <ul>
                ${(category.subcategories || [])
                  .map(
                    (subcategory) => `
                  <li>
                    <a href="/products?sub=${escapeHtml(subcategory._id || "")}">
                      ${escapeHtml(subcategory.subCategoryName || "Subcategory")}
                    </a>
                  </li>
                `,
                  )
                  .join("")}
              </ul>
            </div>
          `,
            )
            .join("")}
        </div>
      `;
    }

    function openDropdown(link) {
      buildDropdown(arniCategories);

      const rect = link.getBoundingClientRect();
      const left = Math.min(Math.max(12, rect.left), window.innerWidth - 360);

      dropdownMenu.style.top = `${rect.bottom + 10}px`;
      dropdownMenu.style.left = `${left}px`;
      dropdownMenu.classList.add("open");
    }

    function closeDropdown() {
      dropdownMenu?.classList.remove("open");
    }

    navLinks.addEventListener("mouseover", (event) => {
      const link = event.target.closest('a[data-category="true"]');
      if (link) {
        openDropdown(link);
      }
    });

    document.addEventListener("mouseover", (event) => {
      if (
        dropdownMenu?.classList.contains("open") &&
        !event.target.closest(".cat-dropdown") &&
        !event.target.closest('[data-category="true"]')
      ) {
        closeDropdown();
      }
    });

    window.addEventListener("scroll", closeDropdown, { passive: true });
    window.addEventListener("resize", closeDropdown);
  }

  function initializeCouponDropdown() {
    showCouponsBtn?.addEventListener("click", () => {
      if (couponSuggestions?.classList.contains("open")) {
        closeCouponDropdown();
      } else {
        openCouponDropdown();
      }
    });

    closeCouponsBtn?.addEventListener("click", closeCouponDropdown);

    document.addEventListener("click", (event) => {
      if (
        couponSuggestions?.classList.contains("open") &&
        !couponSuggestions.contains(event.target) &&
        !showCouponsBtn?.contains(event.target)
      ) {
        closeCouponDropdown();
      }
    });

    window.addEventListener("resize", () => {
      if (couponSuggestions?.classList.contains("open")) {
        openCouponDropdown();
      }
    });

    window.addEventListener(
      "scroll",
      () => {
        if (couponSuggestions?.classList.contains("open")) {
          openCouponDropdown();
        }
      },
      { passive: true },
    );
  }

  function openCouponDropdown() {
    if (!couponSuggestions || !showCouponsBtn) return;

    const rect = showCouponsBtn.getBoundingClientRect();
    const width = Math.min(360, window.innerWidth - 24);
    const left = Math.min(
      Math.max(12, rect.left),
      window.innerWidth - width - 12,
    );

    couponSuggestions.style.width = `${width}px`;
    couponSuggestions.style.left = `${left}px`;
    couponSuggestions.style.top = `${rect.bottom + 10}px`;
    couponSuggestions.classList.add("open");
  }

  function closeCouponDropdown() {
    couponSuggestions?.classList.remove("open");
  }

  function initializeColorCircles() {
    document
      .querySelectorAll(".color-circle[data-color-value]")
      .forEach((circle) => {
        circle.style.backgroundColor = circle.dataset.colorValue || "#d1d5db";
      });
  }

  function initializeReveal() {
    const revealEls = document.querySelectorAll(
      ".cart-hero, .cart-item, .cart-summary-card, .empty-cart, .footer-section",
    );

    if (!revealEls.length) return;

    revealEls.forEach((el, index) => {
      el.classList.add("reveal");
      el.style.transitionDelay = `${Math.min(index * 55, 240)}ms`;
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -40px 0px",
      },
    );

    revealEls.forEach((el) => observer.observe(el));
  }

  async function updateQuantity(variantId, change, size) {
    const input = document.getElementById(`quantity-${variantId}`);

    if (!input) {
      showToast("Unable to find this cart item.", "error");
      return;
    }

    let value = Number.parseInt(input.value, 10) + change;

    if (Number.isNaN(value)) {
      value = 1;
    }

    if (value < 1) {
      value = 1;
    }

    const cartItem = input.closest(".cart-item");
    const sizeElement = cartItem?.querySelector(".item-size");
    const selectedSize = sizeElement ? sizeElement.textContent.trim() : size;

    try {
      const response = await fetch("/users/cart/update-quantity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          variantId,
          quantity: value,
          size2: selectedSize,
        }),
      });

      if (!response.ok) {
        const error = await safeJson(response);
        showToast(error?.error || "Error updating quantity.", "error");
        return;
      }

      input.value = value;
      updateCartTotals();
      showToast("Quantity updated successfully.", "success");
    } catch (error) {
      console.error("Update quantity error:", error);
      showToast("Error updating quantity.", "error");
    }
  }

  async function removeItem(event, variantId) {
    event?.preventDefault();

    const confirmed = window.confirm("Remove this item from your cart?");

    if (!confirmed) return;

    try {
      const response = await fetch("/users/cart/remove-item", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ variantId }),
      });

      if (!response.ok) {
        const error = await safeJson(response);
        showToast(error?.error || "Error removing item.", "error");
        return;
      }

      const item = document.querySelector(
        `.cart-item[data-variant-id="${cssEscape(variantId)}"]`,
      );
      item?.remove();

      updateCartTotals();
      showToast("Item removed from cart.", "success");

      if (!document.querySelector(".cart-item")) {
        window.location.reload();
      }
    } catch (error) {
      console.error("Remove item error:", error);
      showToast("Error removing item.", "error");
    }
  }

  function selectCoupon(code) {
    if (couponInput) {
      couponInput.value = code;
    }

    closeCouponDropdown();
    applyCoupon();
  }

  async function applyCoupon() {
    const code = couponInput?.value.trim();

    if (!code) {
      showToast("Please enter a coupon code.", "error");
      return;
    }

    const subtotal = calculateSubtotal();

    try {
      const response = await fetch("/users/cart/apply-coupon", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          couponCode: code,
          subtotal,
        }),
      });

      const result = await safeJson(response);

      if (!response.ok) {
        showToast(
          result?.error || result?.message || "Invalid coupon code.",
          "error",
        );
        return;
      }

      const discount = Number(result?.discount || result?.discountAmount || 0);
      const couponStatus = document.getElementById("couponStatus");

      if (couponStatus) {
        couponStatus.textContent = `-₹${discount.toFixed(2)}`;
        couponStatus.dataset.discount = String(discount);
        couponStatus.classList.add("applied");
      }

      updateCartTotals();
      showToast("Coupon applied successfully.", "success");
    } catch (error) {
      console.error("Apply coupon error:", error);
      showToast("Error applying coupon.", "error");
    }
  }

  function updateCartTotals() {
    const subtotal = calculateSubtotal();
    const shippingFee = 20;
    const couponStatus = document.getElementById("couponStatus");

    let discount = 0;

    if (couponStatus?.dataset.discount) {
      discount = Number.parseFloat(couponStatus.dataset.discount) || 0;
    } else if (
      couponStatus &&
      couponStatus.textContent !== "No discount applied"
    ) {
      const discountMatch = couponStatus.textContent.match(/[0-9.]+/);
      discount = discountMatch ? Number.parseFloat(discountMatch[0]) : 0;
    }

    const total = Math.max(subtotal + shippingFee - discount, 0);

    const subtotalElement = document.getElementById("subtotalAmount");
    const totalElement = document.getElementById("totalAmount");

    if (subtotalElement) {
      subtotalElement.textContent = `₹${subtotal.toFixed(2)}`;
    }

    if (totalElement) {
      totalElement.textContent = `₹${total.toFixed(2)}`;
    }
  }

  function calculateSubtotal() {
    let subtotal = 0;

    document.querySelectorAll(".cart-item").forEach((item) => {
      const quantity = Number.parseInt(
        item.querySelector(".quantity-input")?.value || "0",
        10,
      );
      const unitPrice = Number.parseFloat(item.dataset.unitPrice || "0");

      if (!Number.isNaN(quantity) && !Number.isNaN(unitPrice)) {
        subtotal += unitPrice * quantity;
      }
    });

    return subtotal;
  }

  function proceedToCheckout() {
    const outOfStockItems = document.querySelectorAll(".out-of-stock-item");

    if (outOfStockItems.length > 0) {
      showToast("Please adjust quantities for out-of-stock items.", "error");
      return;
    }

    const couponStatus = document.getElementById("couponStatus");
    let discountAmount = 0;

    if (couponStatus?.dataset.discount) {
      discountAmount = Number.parseFloat(couponStatus.dataset.discount) || 0;
    } else if (
      couponStatus &&
      couponStatus.textContent !== "No discount applied"
    ) {
      const discountMatch = couponStatus.textContent.match(/[0-9.]+/);
      discountAmount = discountMatch ? Number.parseFloat(discountMatch[0]) : 0;
    }

    if (discountAmount > 0) {
      window.location.href = `/users/checkout?discount=${discountAmount.toFixed(2)}`;
      return;
    }

    window.location.href = "/users/checkout";
  }

  function showToast(message, type = "info") {
    let toastContainer = document.querySelector(".toast-container");

    if (!toastContainer) {
      toastContainer = document.createElement("div");
      toastContainer.className = "toast-container";
      document.body.appendChild(toastContainer);
    }

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add("show");
    });

    setTimeout(() => {
      toast.classList.remove("show");

      setTimeout(() => {
        toast.remove();

        if (!toastContainer.children.length) {
          toastContainer.remove();
        }
      }, 300);
    }, 3200);
  }

  async function safeJson(response) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function cssEscape(value) {
    if (window.CSS?.escape) {
      return window.CSS.escape(value);
    }

    return String(value).replace(/["\\]/g, "\\$&");
  }

  function initializeCanvas() {
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let mousePosition = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    };

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
        this.size = Math.random() * 2.2 + 0.6;
        this.speedX = Math.random() * 0.6 - 0.3;
        this.speedY = Math.random() * 0.6 - 0.3;
        this.life = 0;
        this.maxLife = Math.random() * 220 + 120;

        const colors = [
          "rgba(16, 110, 190, 0.22)",
          "rgba(24, 128, 212, 0.2)",
          "rgba(15, 252, 190, 0.18)",
          "rgba(96, 200, 245, 0.2)",
        ];

        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life += 1;

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

        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    setCanvasSize();

    const particles = Array.from({ length: 85 }, () => new Particle());

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
        190,
      );

      mouseGradient.addColorStop(0, "rgba(15, 252, 190, 0.12)");
      mouseGradient.addColorStop(0.45, "rgba(16, 110, 190, 0.08)");
      mouseGradient.addColorStop(1, "rgba(255, 255, 255, 0)");

      ctx.fillStyle = mouseGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      requestAnimationFrame(animate);
    }

    window.addEventListener("resize", setCanvasSize);

    window.addEventListener("mousemove", (event) => {
      mousePosition = {
        x: event.clientX,
        y: event.clientY,
      };
    });

    animate();
  }
});
