class NotificationSystem {
  constructor() {
    this.initializeToastContainer();
    this.initializeConfirmDialog();
  }

  initializeToastContainer() {
    this.toastContainer = document.createElement("div");
    this.toastContainer.className = "toast-container";
    document.body.appendChild(this.toastContainer);
  }

  initializeConfirmDialog() {
    const dialog = document.createElement("div");
    dialog.className = "confirm-dialog";
    dialog.innerHTML = `
      <div class="confirm-content">
        <h3>Confirm Action</h3>
        <p class="confirm-message"></p>

        <div class="confirm-buttons">
          <button class="cancel-btn" type="button">Cancel</button>
          <button class="confirm-btn" type="button">Confirm</button>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);

    this.confirmDialog = dialog;
    this.setupConfirmListeners();
  }

  setupConfirmListeners() {
    const cancelBtn = this.confirmDialog.querySelector(".cancel-btn");
    const confirmBtn = this.confirmDialog.querySelector(".confirm-btn");

    cancelBtn.addEventListener("click", () => {
      this.hideConfirm();
    });

    confirmBtn.addEventListener("click", () => {
      if (this.onConfirm) {
        this.onConfirm();
        this.hideConfirm();
      }
    });

    this.confirmDialog.addEventListener("click", (event) => {
      if (event.target === this.confirmDialog) {
        this.hideConfirm();
      }
    });
  }

  showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;

    this.toastContainer.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add("show");
    });

    setTimeout(() => {
      toast.classList.remove("show");

      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3200);
  }

  confirm(message, onConfirm) {
    this.confirmDialog.querySelector(".confirm-message").textContent = message;
    this.onConfirm = onConfirm;
    this.confirmDialog.style.display = "flex";
  }

  hideConfirm() {
    this.confirmDialog.style.display = "none";
    this.onConfirm = null;
  }
}

const notifications = new NotificationSystem();

const API = {
  async addAddress(data) {
    const response = await fetch("/users/adr/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    return response.json();
  },

  async updateAddress(id, data) {
    const response = await fetch(`/users/adr/addresses/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    return response.json();
  },

  async deleteAddress(id) {
    const response = await fetch(`/users/adr/addresses/${id}`, {
      method: "DELETE",
    });

    return response.json();
  },

  async setPrimaryAddress(id) {
    const response = await fetch(`/users/adr/addresses/${id}/primary`, {
      method: "PATCH",
    });

    return response.json();
  },
};

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
  const canvas = document.getElementById("backgroundCanvas");

  const addAddressBtn = document.getElementById("addAddressBtn");
  const createAddressForm = document.getElementById("createAddressForm");
  const createFormContainer = document.getElementById(
    "createAddressFormContainer",
  );
  const closeCreateFormBtn = document.getElementById("closeCreateFormBtn");
  const cancelCreateFormBtn = document.getElementById("cancelCreateFormBtn");

  const editFormContainer = document.getElementById("editAddressFormContainer");
  const editForm = document.getElementById("editAddressForm");
  const closeEditFormBtn = document.getElementById("closeEditFormBtn");
  const cancelEditFormBtn = document.getElementById("cancelEditFormBtn");

  const addressGrid = document.getElementById("addressGrid");

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
  initializeReveal();
  initializeAddressForms();
  initializeAddressActions();

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
        closeCreateForm();
        closeEditForm();
        searchOverlay?.classList.remove("open");
        notifications.hideConfirm();
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

  function initializeAddressForms() {
    addAddressBtn?.addEventListener("click", () => {
      closeEditForm();
      createFormContainer?.classList.add("active");
      createAddressForm?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });

    closeCreateFormBtn?.addEventListener("click", closeCreateForm);
    cancelCreateFormBtn?.addEventListener("click", closeCreateForm);

    closeEditFormBtn?.addEventListener("click", closeEditForm);
    cancelEditFormBtn?.addEventListener("click", closeEditForm);

    createAddressForm?.addEventListener("submit", handleCreateAddress);
    editForm?.addEventListener("submit", handleEditAddress);
  }

  async function handleCreateAddress(event) {
    event.preventDefault();

    const data = readAddressForm(createAddressForm);

    if (!validateAddressData(data)) return;

    try {
      const response = await API.addAddress(data);

      if (response.success) {
        notifications.showToast("Address added successfully.", "success");
        closeCreateForm();

        setTimeout(() => {
          window.location.reload();
        }, 700);
      } else {
        notifications.showToast(
          response.message || response.error || "Failed to add address.",
          "error",
        );
      }
    } catch (error) {
      console.error("Create address error:", error);
      notifications.showToast(
        "An error occurred while adding the address.",
        "error",
      );
    }
  }

  async function handleEditAddress(event) {
    event.preventDefault();

    const data = readAddressForm(editForm);

    if (!data.id) {
      notifications.showToast(
        "Address id missing. Please refresh and try again.",
        "error",
      );
      return;
    }

    if (!validateAddressData(data)) return;

    try {
      const response = await API.updateAddress(data.id, data);

      if (response.success) {
        notifications.showToast("Address updated successfully.", "success");
        closeEditForm();

        setTimeout(() => {
          window.location.reload();
        }, 700);
      } else {
        notifications.showToast(
          response.message || response.error || "Failed to update address.",
          "error",
        );
      }
    } catch (error) {
      console.error("Edit address error:", error);
      notifications.showToast(
        "An error occurred while updating the address.",
        "error",
      );
    }
  }

  function initializeAddressActions() {
    if (!addressGrid) return;

    addressGrid.addEventListener("click", async (event) => {
      const target = event.target.closest("button");
      const card = event.target.closest(".address-card");

      if (!target || !card) return;

      const id = card.dataset.id;

      if (target.classList.contains("edit-address")) {
        openEditForm(card);
        return;
      }

      if (target.classList.contains("delete-address")) {
        notifications.confirm(
          "Are you sure you want to delete this address?",
          async () => {
            try {
              const response = await API.deleteAddress(id);

              if (response.success) {
                notifications.showToast(
                  "Address deleted successfully.",
                  "success",
                );

                setTimeout(() => {
                  window.location.reload();
                }, 700);
              } else {
                notifications.showToast(
                  response.message ||
                    response.error ||
                    "Failed to delete address.",
                  "error",
                );
              }
            } catch (error) {
              console.error("Delete address error:", error);
              notifications.showToast(
                "An error occurred while deleting the address.",
                "error",
              );
            }
          },
        );

        return;
      }

      if (target.classList.contains("set-default")) {
        try {
          const response = await API.setPrimaryAddress(id);

          if (response.success) {
            notifications.showToast(
              "Default address updated successfully.",
              "success",
            );

            setTimeout(() => {
              window.location.reload();
            }, 700);
          } else {
            notifications.showToast(
              response.message ||
                response.error ||
                "Failed to update default address.",
              "error",
            );
          }
        } catch (error) {
          console.error("Set default address error:", error);
          notifications.showToast(
            "An error occurred while updating default address.",
            "error",
          );
        }
      }
    });
  }

  function openEditForm(card) {
    if (!editForm || !editFormContainer) return;

    closeCreateForm();

    editForm.id.value = card.dataset.id || "";
    editForm.street.value = card.dataset.street || "";
    editForm.city.value = card.dataset.city || "";
    editForm.state.value = card.dataset.state || "";
    editForm.postalCode.value = card.dataset.postalCode || "";
    editForm.country.value = card.dataset.country || "";
    editForm.isPrimary.checked = card.dataset.primary === "true";

    editFormContainer.classList.add("active");
    editFormContainer.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function readAddressForm(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    data.street = data.street?.trim() || "";
    data.city = data.city?.trim() || "";
    data.state = data.state?.trim() || "";
    data.postalCode = data.postalCode?.trim() || "";
    data.country = data.country?.trim() || "";
    data.isPrimary = data.isPrimary === "on";

    return data;
  }

  function validateAddressData(data) {
    if (
      !data.street ||
      !data.city ||
      !data.state ||
      !data.postalCode ||
      !data.country
    ) {
      notifications.showToast(
        "Please fill all required address fields.",
        "error",
      );
      return false;
    }

    if (!/^[0-9]{6}$/.test(data.postalCode)) {
      notifications.showToast("Postal code must be exactly 6 digits.", "error");
      return false;
    }

    return true;
  }

  function closeCreateForm() {
    createFormContainer?.classList.remove("active");
    createAddressForm?.reset();
  }

  function closeEditForm() {
    editFormContainer?.classList.remove("active");
    editForm?.reset();
  }

  function initializeReveal() {
    const revealEls = document.querySelectorAll(
      ".profile-hero, .sidebar, .content-area, .address-card, .footer-section",
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

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
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
