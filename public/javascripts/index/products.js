document.addEventListener("DOMContentLoaded", () => {
  const categoriesDataEl = document.getElementById("arni-categories-data");
  let arniCategories = [];

  try {
    arniCategories = categoriesDataEl
      ? JSON.parse(categoriesDataEl.textContent || "[]")
      : [];
  } catch (error) {
    console.error("Failed to parse ARNI categories:", error);
    arniCategories = [];
  }

  // Navbar background + hide on scroll down
  const navbar = document.getElementById("navbar");
  let lastY = window.scrollY || 0;

  window.addEventListener(
    "scroll",
    () => {
      const y = window.scrollY || 0;
      navbar?.classList.toggle("scrolled", y > 20);

      if (navbar) {
        navbar.style.transform =
          y > lastY && y > 140 ? "translateY(-100%)" : "translateY(0)";
      }

      lastY = y;
    },
    { passive: true },
  );

  // Search overlay
  const searchToggle = document.querySelector(".search-toggle");
  const searchOverlay = document.getElementById("searchOverlay");
  const searchClose = document.getElementById("searchClose");
  const searchInput = searchOverlay?.querySelector(".search-input");

  searchToggle?.addEventListener("click", (event) => {
    event.stopPropagation();
    const open = searchOverlay?.classList.toggle("open");
    if (open) searchInput?.focus();
  });

  searchClose?.addEventListener("click", () => {
    searchOverlay?.classList.remove("open");
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (
      searchOverlay?.classList.contains("open") &&
      !searchOverlay.contains(target) &&
      !searchToggle?.contains(target)
    ) {
      searchOverlay.classList.remove("open");
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      searchOverlay?.classList.remove("open");
      closeDrawer();
      dropdownMenu?.classList.remove("open");
    }
  });

  // Mobile drawer
  const hamburger = document.getElementById("hamburger");
  const mobileDrawer = document.getElementById("mobileDrawer");
  const mobileOverlay = document.getElementById("mobileOverlay");
  const drawerClose = document.getElementById("drawerClose");

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
    mobileDrawer?.classList.contains("open") ? closeDrawer() : openDrawer();
  });

  mobileOverlay?.addEventListener("click", closeDrawer);
  drawerClose?.addEventListener("click", closeDrawer);

  // Desktop category dropdown
  const navLinks = document.getElementById("navLinks");
  let dropdownMenu = null;

  function escapeHtml(value = "") {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

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
                    (cat) => `
                    <div class="cat-dropdown-col">
                        <a href="/subcategories?main=${encodeURIComponent(cat._id || "")}" class="cat-dropdown-title">
                            ${escapeHtml(cat.mainCategoryName || "Category")}
                        </a>
                        <ul>
                            ${(cat.subcategories || [])
                              .map(
                                (sub) => `
                                <li>
                                    <a href="/products?sub=${encodeURIComponent(sub._id || "")}">
                                        ${escapeHtml(sub.subCategoryName || "Subcategory")}
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

  function positionDropdown(anchor) {
    if (!dropdownMenu || !anchor) return;
    const rect = anchor.getBoundingClientRect();
    const dropdownWidth = Math.min(920, window.innerWidth - 24);
    const left = Math.min(
      Math.max(12, rect.left),
      window.innerWidth - dropdownWidth - 12,
    );
    dropdownMenu.style.top = `${rect.bottom + 12}px`;
    dropdownMenu.style.left = `${left}px`;
  }

  navLinks?.addEventListener("mouseover", (event) => {
    const link = event.target.closest('a[data-category="true"]');
    if (!link || arniCategories.length === 0) return;
    buildDropdown(arniCategories);
    positionDropdown(link);
    dropdownMenu?.classList.add("open");
  });

  document.addEventListener("mouseover", (event) => {
    const target = event.target;
    if (
      dropdownMenu?.classList.contains("open") &&
      !target.closest(".cat-dropdown") &&
      !target.closest('[data-category="true"]')
    ) {
      dropdownMenu.classList.remove("open");
    }
  });

  window.addEventListener("resize", () => {
    dropdownMenu?.classList.remove("open");
  });

  // Scroll reveal
  const revealEls = document.querySelectorAll(
    ".section-header, .product-card, .empty-state, .footer-brand, .footer-col",
  );
  revealEls.forEach((el, index) => {
    el.classList.add("reveal");
    el.style.transitionDelay = `${(index % 4) * 65}ms`;
  });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );

    revealEls.forEach((el) => observer.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("visible"));
  }
});
