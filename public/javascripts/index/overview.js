// Background canvas animation
const canvas = document.getElementById("backgroundCanvas");
const ctx = canvas.getContext("2d");
let mousePosition = { x: 0, y: 0 };

function setCanvasSize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
setCanvasSize();
window.addEventListener("resize", setCanvasSize);

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
      "hsla(45, 100%, 50%, 0.2)", // Gold
      "hsla(280, 70%, 40%, 0.2)", // Deep Purple
      "hsla(350, 70%, 40%, 0.2)", // Dark Red
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
    ctx.fillStyle = this.color.replace("0.2", opacity * 0.2);
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

const particles = Array.from({ length: 100 }, () => new Particle());

function animate() {
  ctx.fillStyle = "rgba(18, 18, 18, 0.1)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

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
    150,
  );
  mouseGradient.addColorStop(0, "rgba(255, 215, 0, 0.1)");
  mouseGradient.addColorStop(1, "rgba(18, 18, 18, 0)");
  ctx.fillStyle = mouseGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  requestAnimationFrame(animate);
}

window.addEventListener("mousemove", (e) => {
  mousePosition = { x: e.clientX, y: e.clientY };
});

animate();

// Scroll animations for elements
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -50px 0px",
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = "1";
      entry.target.style.transform = "translateY(0)";
    }
  });
}, observerOptions);

// Animate sections on scroll
document
  .querySelectorAll(".section-title, .category, .product-card, .blog-card")
  .forEach((el) => {
    el.style.opacity = "0";
    el.style.transform = "translateY(30px)";
    el.style.transition = "all 0.6s ease-out";
    observer.observe(el);
  });

// Navbar scroll effect
const navbar = document.querySelector(".navbar");
window.addEventListener("scroll", () => {
  if (window.scrollY > 50) {
    navbar.classList.add("scrolled");
  } else {
    navbar.classList.remove("scrolled");
  }
});

// Thumbnail and main image functionality
document.querySelectorAll(".thumbnail").forEach((thumb) => {
  thumb.addEventListener("click", () => {
    // Update active thumbnail
    document
      .querySelectorAll(".thumbnail")
      .forEach((t) => t.classList.remove("active"));
    thumb.classList.add("active");

    // Update main image
    document.querySelector(".main-image").src = thumb.getAttribute("data-full");
  });
});

// Zoom functionality
const zoomBtn = document.querySelector(".zoom-btn");
const mainImageContainer = document.querySelector(".main-image-container");
const mainImage = document.querySelector(".main-image");

zoomBtn.addEventListener("click", () => {
  const modal = document.createElement("div");
  modal.className = "zoom-modal";

  const zoomedImage = document.createElement("img");
  zoomedImage.src = mainImage.src;
  zoomedImage.className = "zoomed-image";

  const closeBtn = document.createElement("button");
  closeBtn.innerHTML = '<i class="fas fa-times"></i>';
  closeBtn.className = "zoom-close-btn";

  modal.appendChild(closeBtn);
  modal.appendChild(zoomedImage);
  document.body.appendChild(modal);

  // Add zoom pan functionality
  let isDragging = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;
  let xOffset = 0;
  let yOffset = 0;

  modal.addEventListener("mousedown", dragStart);
  modal.addEventListener("mousemove", drag);
  modal.addEventListener("mouseup", dragEnd);
  modal.addEventListener("mouseleave", dragEnd);

  function dragStart(e) {
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;

    if (e.target === zoomedImage) {
      isDragging = true;
    }
  }

  function drag(e) {
    if (isDragging) {
      e.preventDefault();
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;
      xOffset = currentX;
      yOffset = currentY;

      setTranslate(currentX, currentY, zoomedImage);
    }
  }

  function setTranslate(xPos, yPos, el) {
    el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0) scale(2)`;
  }

  function dragEnd() {
    initialX = currentX;
    initialY = currentY;
    isDragging = false;
  }

  closeBtn.addEventListener("click", () => {
    document.body.removeChild(modal);
  });
});

// Color Selection with Image Update
document.querySelectorAll(".color-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const variantId = btn.dataset.variantId;

    try {
      const response = await fetch(`/overview/variants/${variantId}`);
      if (!response.ok) throw new Error("Unable to load this colour.");
      const variant = await response.json();

      // Update URL without page reload
      history.pushState({}, "", `/overview/${variantId}`);

      // Update images
      const thumbnailColumn = document.querySelector(".thumbnail-column");
      thumbnailColumn.innerHTML = variant.images
        .map(
          (image, index) => `
                <img src="${image}" 
                     alt="Product thumbnail ${index + 1}" 
                     class="thumbnail ${index === 0 ? "active" : ""}"
                     data-full="${image}">
            `,
        )
        .join("");

      // Update main image
      document.querySelector(".main-image").src = variant.images[0];

      // Update size buttons and stock information
      const selectedSize = updateSizeButtons(variant.sizes);

      // Update active state for color buttons
      document
        .querySelectorAll(".color-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      updateStockInfo(variant.sizes[selectedSize] ?? 0);
      await checkCartStatus();

      // Reinitialize thumbnail clicks
      initializeThumbnailClicks();
    } catch (error) {
      console.error("Error fetching variant data:", error);
      showToast(
        error.message || "Unable to change the selected colour.",
        "error",
      );
    }
  });
});

function initializeSizeButtonClicks() {
  document.querySelectorAll(".size-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      // Update active state
      document
        .querySelectorAll(".size-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      // Update stock information
      const variantId =
        document.querySelector(".color-btn.active").dataset.variantId;
      fetch(`/overview/variants/${variantId}`)
        .then((response) => {
          if (!response.ok)
            throw new Error("Unable to load size availability.");
          return response.json();
        })
        .then((variant) => {
          const activeVariantId =
            document.querySelector(".color-btn.active")?.dataset.variantId;
          const activeSize =
            document.querySelector(".size-btn.active")?.dataset.size;
          if (
            activeVariantId !== variantId ||
            activeSize !== btn.dataset.size
          ) {
            return;
          }
          const stockCount = variant.sizes[btn.dataset.size];
          updateStockInfo(stockCount);
          checkCartStatus();
        })
        .catch((error) => {
          console.error("Error:", error);
          showToast(error.message, "error");
        });
    });
  });
}

function updateSizeButtons(sizes) {
  const options = Object.entries(sizes || {});
  const previouslySelected =
    document.querySelector(".size-btn.active")?.dataset.size;
  const selected =
    options.find(([size, count]) => size === previouslySelected && count > 0) ||
    options.find(([, count]) => count > 0) ||
    options[0];
  const container = document.querySelector(".size-options");

  container.innerHTML = options
    .map(
      ([size, count]) => `
      <button type="button" class="size-btn ${size === selected?.[0] ? "active" : ""} ${count === 0 ? "out-of-stock" : ""}" data-size="${size}">
        ${size}
      </button>
    `,
    )
    .join("");
  initializeSizeButtonClicks();
  return selected?.[0];
}

// Quantity controls
const quantityInput = document.querySelector(".quantity-input");
const minusBtn = document.querySelector(".quantity-btn.minus");
const plusBtn = document.querySelector(".quantity-btn.plus");

minusBtn.addEventListener("click", () => {
  const currentValue = parseInt(quantityInput.value);
  if (currentValue > 1) {
    quantityInput.value = currentValue - 1;
  }
});

plusBtn.addEventListener("click", () => {
  const currentValue = parseInt(quantityInput.value);
  const maxStock = parseInt(document.querySelector(".stock-count").textContent);
  if (currentValue < maxStock) {
    quantityInput.value = currentValue + 1;
  }
});

// Helper functions
function updateStockInfo(stockCount) {
  stockCount = Number(stockCount) || 0;
  const stockInfo = document.querySelector(".stock-info");
  const addToCartBtn = document.querySelector(".add-to-cart");

  stockInfo.innerHTML = `
        <i class="fas fa-box"></i>
        <span class="stock-count">${stockCount}</span> items in stock
        <span class="stock-status ${stockCount <= 10 ? "low" : stockCount <= 30 ? "medium" : "high"}">
            ${stockCount == 0 ? "Out Of Stock" : stockCount <= 30 ? "Limited Stock" : "In Stock"}
        </span>
    `;

  // Update add to cart button state
  addToCartBtn.disabled = stockCount === 0;
  addToCartBtn.dataset.state = stockCount === 0 ? "out-of-stock" : "available";
  addToCartBtn.innerHTML =
    stockCount === 0
      ? '<i class="fas fa-ban"></i> Out of Stock'
      : '<i class="fas fa-shopping-cart"></i> Add to Cart';

  // Update quantity input
  quantityInput.max = stockCount;
  quantityInput.disabled = stockCount === 0;
  if (parseInt(quantityInput.value) > stockCount) {
    quantityInput.value = Math.max(1, stockCount);
  }
}

function initializeThumbnailClicks() {
  document.querySelectorAll(".thumbnail").forEach((thumb) => {
    thumb.addEventListener("click", () => {
      document
        .querySelectorAll(".thumbnail")
        .forEach((t) => t.classList.remove("active"));
      thumb.classList.add("active");
      document.querySelector(".main-image").src =
        thumb.getAttribute("data-full");
    });
  });
}

// Initialize thumbnail clicks on page load
initializeThumbnailClicks();
initializeSizeButtonClicks();

// Add toast styles to document head
const toastStyles = document.createElement("style");
toastStyles.textContent = `
    .toast {
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 24px;
        border-radius: 4px;
        color: white;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    }

    .toast.success {
        background-color: #4CAF50;
    }

    .toast.error {
        background-color: #f44336;
    }

    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(toastStyles);

// Toast notification function
function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "slideIn 0.3s ease-out reverse";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function setCartButtonState(state) {
  const button = document.querySelector(".add-to-cart");
  button.dataset.state = state;
  button.classList.toggle("is-added", state === "added");
  button.disabled = state === "loading" || state === "out-of-stock";
  const labels = {
    loading: '<i class="fas fa-spinner fa-spin"></i> Adding…',
    added: '<i class="fas fa-check"></i> Already in Cart — View Cart',
    available: '<i class="fas fa-shopping-cart"></i> Add to Cart',
    "out-of-stock": '<i class="fas fa-ban"></i> Out of Stock',
  };
  button.innerHTML = labels[state] || labels.available;
}

async function checkCartStatus() {
  const variantId =
    document.querySelector(".color-btn.active")?.dataset.variantId;
  const selectedSize = document.querySelector(".size-btn.active")?.dataset.size;
  const button = document.querySelector(".add-to-cart");
  if (!variantId || !selectedSize || button.dataset.state === "out-of-stock")
    return;

  try {
    const response = await fetch(
      `/users/cart/status?variantId=${encodeURIComponent(variantId)}&size=${encodeURIComponent(selectedSize)}`,
      {
        headers: { Accept: "application/json" },
      },
    );
    if (
      response.redirected ||
      (response.headers.get("content-type") || "").includes("text/html")
    ) {
      setCartButtonState("available");
      return;
    }
    const data = await response.json();
    const currentVariantId =
      document.querySelector(".color-btn.active")?.dataset.variantId;
    const currentSize =
      document.querySelector(".size-btn.active")?.dataset.size;
    if (
      response.ok &&
      currentVariantId === variantId &&
      currentSize === selectedSize
    ) {
      setCartButtonState(data.exists ? "added" : "available");
    }
  } catch (error) {
    console.error("Unable to check cart status:", error);
    setCartButtonState("available");
  }
}

// Add to cart event listener
document.querySelector(".add-to-cart").addEventListener("click", async () => {
  const button = document.querySelector(".add-to-cart");
  if (button.dataset.state === "added") {
    window.location.href = "/users/cart";
    return;
  }
  const activeColorBtn = document.querySelector(".color-btn.active");
  const variantId = activeColorBtn?.dataset.variantId;
  const quantity = parseInt(document.querySelector(".quantity-input").value);
  const activeSizeBtn = document.querySelector(".size-btn.active");
  const selectedSize = activeSizeBtn?.dataset.size;

  // Validate inputs
  if (!selectedSize) {
    showToast("Please select a size", "error");
    return;
  }

  if (!variantId) {
    showToast("Please select a color", "error");
    return;
  }

  if (!quantity || quantity < 1) {
    showToast("Please enter a valid quantity", "error");
    return;
  }

  try {
    setCartButtonState("loading");
    const response = await fetch("/users/cart/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        variantId,
        quantity,
        selectedSize,
      }),
    });

    if (
      response.redirected ||
      (response.headers.get("content-type") || "").includes("text/html")
    ) {
      showToast("Please sign in to add items to your cart.", "error");
      window.setTimeout(() => {
        window.location.href = "/auth/login";
      }, 900);
      return;
    }
    const result = await response.json();

    if (!response.ok) {
      if (result.exists) {
        setCartButtonState("added");
        showToast(result.message, "error");
        return;
      }
      throw new Error(result.message || "Unable to add this item.");
    }

    setCartButtonState("added");
    showToast(`Added ${quantity} item${quantity > 1 ? "s" : ""} to your cart.`);
  } catch (error) {
    console.error("Error adding to cart:", error);
    setCartButtonState("available");
    showToast(
      error.message || "Unable to add this item. Please try again.",
      "error",
    );
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const firstAvailableSize = document.querySelector(
    ".size-btn:not(.out-of-stock)",
  );
  const initialSize =
    document.querySelector(".size-btn.active") || firstAvailableSize;
  initialSize?.click();
});

// Wishlist functionality
const wishlistBtn = document.querySelector(".wishlist-btn");

// Function to update wishlist icon state
function updateWishlistIcon(isInWishlist) {
  const icon = wishlistBtn.querySelector("i");
  if (isInWishlist) {
    icon.classList.remove("far");
    icon.classList.add("fas");
    wishlistBtn.classList.add("active");
  } else {
    icon.classList.remove("fas");
    icon.classList.add("far");
    wishlistBtn.classList.remove("active");
  }
}

// Check initial wishlist state when page loads
async function checkWishlistState() {
  try {
    const variantId =
      document.querySelector(".color-btn.active").dataset.variantId;
    const response = await fetch(`/users/wishlist/check/${variantId}`);
    const data = await response.json();
    updateWishlistIcon(data.isInWishlist);
  } catch (error) {
    console.error("Error checking wishlist state:", error);
  }
}

// Toggle wishlist
wishlistBtn.addEventListener("click", async () => {
  try {
    const variantId =
      document.querySelector(".color-btn.active").dataset.variantId;
    const isCurrentlyActive = wishlistBtn.classList.contains("active");

    const response = await fetch("/users/wishlist/toggle", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        variantId,
        action: isCurrentlyActive ? "remove" : "add",
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to update wishlist");
    }

    updateWishlistIcon(!isCurrentlyActive);

    // Show toast notification
    showToast(
      isCurrentlyActive ? "Removed from wishlist" : "Added to wishlist",
      "success",
    );
  } catch (error) {
    console.error("Error updating wishlist:", error);
    showToast(
      "Failed to update wishlist.  Please login or logout and login again.",
      "error",
    );
  }
});

// Initialize wishlist state on page load
document.addEventListener("DOMContentLoaded", checkWishlistState);

// Update wishlist state when color variant changes
document.querySelectorAll(".color-btn").forEach((btn) => {
  const originalClick = btn.onclick;
  btn.onclick = async function (e) {
    if (originalClick) {
      originalClick.call(this, e);
    }
    await checkWishlistState();
  };
});
