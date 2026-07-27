document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("profile-form");
  const editButton = document.querySelector(".edit-button");
  const usernameInput = form?.querySelector('input[name="username"]');
  const inputs = form
    ? Array.from(form.querySelectorAll('input:not([type="hidden"]), select'))
    : [];

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

  const avatarModal = document.getElementById("avatarModal");
  const profileImage = document.querySelector(".profile-image");
  const changePhotoBtn = document.querySelector(".change-photo-btn");
  const avatarCancelButton = document.getElementById("avatarCancelButton");
  const cancelAvatarButton = document.getElementById("cancelAvatarButton");
  const saveAvatarButton = document.getElementById("saveAvatarButton");
  const avatarOptions = Array.from(document.querySelectorAll(".avatar-option"));

  let isEditing = false;
  let lastScrollY = 0;
  let arniCategories = [];
  let selectedAvatarUrl = profileImage?.getAttribute("src") || "";

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
  initializeProfileEditing();
  initializeAvatarPicker();
  initializeReveal();

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
        closeAvatarModal();
        searchOverlay?.classList.remove("open");
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

  function initializeProfileEditing() {
    if (!form || !editButton || !usernameInput) return;

    setFormEditable(false);

    editButton.addEventListener("click", async () => {
      if (isEditing) {
        const isValid = validateUsername();

        if (!isValid) return;

        try {
          editButton.disabled = true;
          editButton.innerHTML =
            '<i class="fas fa-spinner fa-spin"></i> Saving...';

          const response = await fetch("/users/pI/update", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              username: usernameInput.value.trim(),
            }),
          });

          if (!response.ok) {
            const result = await safeJson(response);
            throw new Error(
              result?.message || result?.error || "Failed to update profile",
            );
          }

          showToast("Profile updated successfully.", "success");
          isEditing = false;
          setFormEditable(false);
          editButton.innerHTML = '<i class="fas fa-pen"></i> Edit Profile';
          return;
        } catch (error) {
          showToast(error.message || "Failed to update profile.", "error");
        } finally {
          editButton.disabled = false;
        }
      }

      isEditing = true;
      setFormEditable(true);
      usernameInput.focus();
      usernameInput.select();
      editButton.innerHTML = '<i class="fas fa-check"></i> Save Profile';
    });

    usernameInput.addEventListener("input", () => {
      if (isEditing) validateUsername();
    });
  }

  function setFormEditable(canEdit) {
    inputs.forEach((input) => {
      if (input === usernameInput) {
        input.readOnly = !canEdit;
      } else {
        input.readOnly = true;
      }
    });
  }

  function validateUsername() {
    if (!usernameInput) return true;

    const username = usernameInput.value.trim();
    const message = document.getElementById("usernameMessage");

    if (username.length < 3) {
      if (message)
        message.textContent = "Username must be at least 3 characters.";
      usernameInput.classList.add("input-error");
      return false;
    }

    if (username.length > 30) {
      if (message)
        message.textContent = "Username must be less than 30 characters.";
      usernameInput.classList.add("input-error");
      return false;
    }

    if (!/^[a-zA-Z0-9_ ]+$/.test(username)) {
      if (message)
        message.textContent =
          "Username can only contain letters, numbers, spaces, and underscores.";
      usernameInput.classList.add("input-error");
      return false;
    }

    if (message) message.textContent = "";
    usernameInput.classList.remove("input-error");
    return true;
  }

  function initializeAvatarPicker() {
    changePhotoBtn?.addEventListener("click", openAvatarModal);
    avatarCancelButton?.addEventListener("click", closeAvatarModal);
    cancelAvatarButton?.addEventListener("click", closeAvatarModal);
    saveAvatarButton?.addEventListener("click", saveSelectedAvatar);

    avatarOptions.forEach((option) => {
      option.addEventListener("click", () => {
        avatarOptions.forEach((item) => item.classList.remove("selected"));

        option.classList.add("selected");
        selectedAvatarUrl = option.dataset.avatarUrl || "";
      });
    });

    avatarModal?.addEventListener("click", (event) => {
      if (event.target === avatarModal) {
        closeAvatarModal();
      }
    });
  }

  function openAvatarModal() {
    if (!avatarModal) return;

    avatarOptions.forEach((option) => {
      const avatarUrl = option.dataset.avatarUrl || "";
      option.classList.toggle("selected", avatarUrl === selectedAvatarUrl);
    });

    avatarModal.classList.add("open");
    avatarModal.setAttribute("aria-hidden", "false");
  }

  function closeAvatarModal() {
    if (!avatarModal) return;

    avatarModal.classList.remove("open");
    avatarModal.setAttribute("aria-hidden", "true");
  }

  async function saveSelectedAvatar() {
    if (!selectedAvatarUrl) {
      showToast("Please select an avatar first.", "error");
      return;
    }

    try {
      if (saveAvatarButton) {
        saveAvatarButton.disabled = true;
        saveAvatarButton.innerHTML =
          '<i class="fas fa-spinner fa-spin"></i> Saving...';
      }

      const response = await fetch("/users/pI/update-avatar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          avatarUrl: selectedAvatarUrl,
        }),
      });

      if (!response.ok) {
        const result = await safeJson(response);
        throw new Error(
          result?.message || result?.error || "Failed to save avatar",
        );
      }

      if (profileImage) {
        profileImage.src = selectedAvatarUrl;
      }

      closeAvatarModal();
      showToast("Avatar updated successfully.", "success");
    } catch (error) {
      showToast(error.message || "Failed to update avatar.", "error");
    } finally {
      if (saveAvatarButton) {
        saveAvatarButton.disabled = false;
        saveAvatarButton.textContent = "Save Avatar";
      }
    }
  }

  function initializeReveal() {
    const revealEls = document.querySelectorAll(
      ".profile-hero, .sidebar, .content-area, .info-card, .footer-section",
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
