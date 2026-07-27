document.addEventListener("DOMContentLoaded", () => {
  // =====================
  // GLOBAL STATE
  // =====================
  const itemsPerPage = 30;
  let currentPage = 1;
  let allProducts = [];
  let totalPages = 0;
  const currentFilters = {
    sort: "popularity",
    categories: [],
    minPrice: "",
    maxPrice: "",
    sizes: [],
    search: "",
  };

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

  // =====================
  // NAVBAR
  // =====================
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

  // =====================
  // SEARCH OVERLAY
  // =====================
  const searchToggle = document.querySelector(".search-toggle");
  const searchOverlay = document.getElementById("searchOverlay");
  const searchClose = document.getElementById("searchClose");

  searchToggle?.addEventListener("click", () => {
    const open = searchOverlay?.classList.toggle("open");
    if (open) searchOverlay?.querySelector(".search-input")?.focus();
  });

  searchClose?.addEventListener("click", () =>
    searchOverlay?.classList.remove("open"),
  );

  document.addEventListener("click", (event) => {
    if (
      searchOverlay?.classList.contains("open") &&
      !searchOverlay.contains(event.target) &&
      !searchToggle?.contains(event.target)
    ) {
      searchOverlay.classList.remove("open");
    }
  });

  // =====================
  // MOBILE DRAWER
  // =====================
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

  // =====================
  // FILTER DRAWER
  // =====================
  const filterToggle = document.getElementById("filterToggle");
  const filtersPanel = document.getElementById("filtersPanel");
  const filterOverlay = document.getElementById("filterOverlay");
  const filterClose = document.getElementById("filterClose");

  function openFilters() {
    filtersPanel?.classList.add("open");
    filterOverlay?.classList.add("visible");
    document.body.style.overflow = "hidden";
  }

  function closeFilters() {
    filtersPanel?.classList.remove("open");
    filterOverlay?.classList.remove("visible");
    document.body.style.overflow = "";
  }

  filterToggle?.addEventListener("click", openFilters);
  filterOverlay?.addEventListener("click", closeFilters);
  filterClose?.addEventListener("click", closeFilters);

  // =====================
  // CATEGORY DROPDOWN
  // =====================
  const navLinks = document.querySelector(".nav-links");

  if (navLinks) {
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
                                    <li><a href="/products?sub=${encodeURIComponent(sub._id || "")}">${escapeHtml(sub.subCategoryName || "Subcategory")}</a></li>
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

    navLinks.addEventListener("mouseover", (event) => {
      const link = event.target.closest('a[data-category="true"]');
      if (!link || arniCategories.length === 0) return;

      buildDropdown(arniCategories);

      if (dropdownMenu) {
        const rect = link.getBoundingClientRect();
        dropdownMenu.style.top = `${rect.bottom + window.scrollY + 8}px`;
        dropdownMenu.style.left = `${Math.max(12, rect.left)}px`;
        dropdownMenu.classList.add("open");
      }
    });

    document.addEventListener("mouseover", (event) => {
      if (
        dropdownMenu?.classList.contains("open") &&
        !event.target.closest(".cat-dropdown") &&
        !event.target.closest('[data-category="true"]')
      ) {
        dropdownMenu.classList.remove("open");
      }
    });
  }

  // =====================
  // PRODUCT HELPERS
  // =====================
  function showErrorMessage(message) {
    let errorContainer = document.getElementById("errorContainer");

    if (!errorContainer) {
      errorContainer = document.createElement("div");
      errorContainer.id = "errorContainer";
      errorContainer.className = "error-container";
      document.body.appendChild(errorContainer);
    }

    const errorElement = document.createElement("div");
    errorElement.className = "error-message";
    errorElement.textContent = message;
    errorContainer.appendChild(errorElement);

    setTimeout(() => {
      errorElement.remove();
      if (errorContainer.children.length === 0) {
        errorContainer.remove();
      }
    }, 5000);
  }

  function getProductImage(product) {
    if (Array.isArray(product.images)) return product.images[0] || "";
    return product.images || product.displayImage || "";
  }

  function getProductDetails(product) {
    return product.productDetails || product;
  }

  async function fetchProducts() {
    const loadingSpinner = document.getElementById("loadingSpinner");

    try {
      if (loadingSpinner) loadingSpinner.style.display = "block";

      const queryParams = new URLSearchParams({
        sort: currentFilters.sort,
      });

      if (currentFilters.minPrice)
        queryParams.set("minPrice", currentFilters.minPrice);
      if (currentFilters.maxPrice)
        queryParams.set("maxPrice", currentFilters.maxPrice);
      if (currentFilters.search)
        queryParams.set("search", currentFilters.search);

      currentFilters.categories.forEach((category) =>
        queryParams.append("categories", category),
      );
      currentFilters.sizes.forEach((size) => queryParams.append("sizes", size));

      const response = await fetch(
        `/search/products?${queryParams.toString()}`,
      );

      if (!response.ok) {
        throw new Error("Error while fetching products");
      }

      const products = await response.json();
      allProducts = Array.isArray(products) ? products : [];
      totalPages = Math.ceil(allProducts.length / itemsPerPage);
      updateResultsCount();

      return allProducts;
    } catch (error) {
      console.error("Error:", error);
      showErrorMessage("Error fetching products. Please try again.");
      allProducts = [];
      totalPages = 0;
      updateResultsCount();
      return [];
    } finally {
      if (loadingSpinner) loadingSpinner.style.display = "none";
    }
  }

  function getPaginatedProducts() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return allProducts.slice(startIndex, endIndex);
  }

  function createStarHTML(reviewValue) {
    const rating = Number(reviewValue) || 0;
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    return Array.from({ length: 5 }, (_, index) => {
      if (index < fullStars) return '<i class="fas fa-star"></i>';
      if (index === fullStars && hasHalfStar)
        return '<i class="fas fa-star-half-alt"></i>';
      return '<i class="far fa-star"></i>';
    }).join("");
  }

  function createProductCard(product) {
    const details = getProductDetails(product);
    const name = details.name || "Product";
    const image = getProductImage(product);
    const variantId = product._id || product.variantId || details._id || "";
    const price = Number(details.price) || 0;
    const discountPrice = Number(details.discountPrice) || price;
    const discount =
      price > discountPrice && price > 0
        ? Math.round((1 - discountPrice / price) * 100)
        : 0;
    const review = Number(details.review) || 0;

    return `
            <a href="/overview/${variantId}" class="product-card-link">
                <article class="product-card">
                    <div class="product-image-container">
                        <img src="${image}" alt="${name}" class="product-image" loading="lazy">
                        ${discount > 0 ? `<div class="discount-badge">${discount}% OFF</div>` : ""}
                    </div>
                    <div class="product-info">
                        <h3 class="product-name">${name}</h3>
                        <div class="price-layout">
                            <div class="price-row">
                                <span class="discount-price">₹${discountPrice.toLocaleString("en-IN")}</span>
                                ${discount > 0 ? `<span class="original-price">₹${price.toLocaleString("en-IN")}</span>` : ""}
                            </div>
                            ${discount > 0 ? `<div class="offer-badge">${discount}% OFF</div>` : ""}
                        </div>
                        <div class="product-meta">
                            <div class="rating-stars">${createStarHTML(review)}</div>
                            <span class="rating-value">${review.toFixed(1)}</span>
                        </div>
                    </div>
                </article>
            </a>
        `;
  }

  function updateResultsCount() {
    const resultsCount = document.getElementById("resultsCount");
    if (!resultsCount) return;

    if (allProducts.length === 0) {
      resultsCount.textContent = "No products";
      return;
    }

    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, allProducts.length);
    resultsCount.textContent = `${start}-${end} of ${allProducts.length}`;
  }

  async function loadProducts() {
    const loadingSpinner = document.getElementById("loadingSpinner");
    const productGrid = document.getElementById("productGrid");

    if (!productGrid) return;

    try {
      if (loadingSpinner) loadingSpinner.style.display = "block";
      productGrid.innerHTML = "";

      const products = getPaginatedProducts();

      if (products.length === 0) {
        productGrid.innerHTML = `
                    <div class="no-products">
                        <i class="fas fa-search"></i>
                        <h3>No products found</h3>
                        <p>Try changing the search text, category, size, or price filter.</p>
                    </div>
                `;
        return;
      }

      productGrid.innerHTML = products
        .map((product) => createProductCard(product))
        .join("");

      productGrid.querySelectorAll(".product-card").forEach((card, index) => {
        card.classList.add("reveal");
        card.style.transitionDelay = `${(index % 4) * 60}ms`;
        revealObserver.observe(card);
      });
    } catch (error) {
      console.error("Error:", error);
      showErrorMessage("Error loading products. Please try again.");
    } finally {
      if (loadingSpinner) loadingSpinner.style.display = "none";
      updateResultsCount();
    }
  }

  function renderPagination() {
    const pagination = document.getElementById("pagination");
    if (!pagination) return;

    if (totalPages <= 1) {
      pagination.innerHTML = "";
      return;
    }

    let paginationHTML = `
            <button class="page-btn" data-page="${currentPage - 1}" ${currentPage === 1 ? "disabled" : ""}>
                <i class="fas fa-chevron-left"></i>
            </button>
        `;

    for (let i = 1; i <= totalPages; i += 1) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - 1 && i <= currentPage + 1)
      ) {
        paginationHTML += `
                    <button class="page-btn ${currentPage === i ? "active" : ""}" data-page="${i}">
                        ${i}
                    </button>
                `;
      } else if (i === currentPage - 2 || i === currentPage + 2) {
        paginationHTML += `<span class="page-ellipsis">...</span>`;
      }
    }

    paginationHTML += `
            <button class="page-btn" data-page="${currentPage + 1}" ${currentPage === totalPages ? "disabled" : ""}>
                <i class="fas fa-chevron-right"></i>
            </button>
        `;

    pagination.innerHTML = paginationHTML;

    pagination.querySelectorAll(".page-btn[data-page]").forEach((button) => {
      button.addEventListener("click", async () => {
        const newPage = Number(button.dataset.page);
        if (newPage < 1 || newPage > totalPages || newPage === currentPage)
          return;

        currentPage = newPage;
        window.scrollTo({ top: 0, behavior: "smooth" });
        await loadProducts();
        renderPagination();
        updateResultsCount();
      });
    });
  }

  async function refreshProducts() {
    await fetchProducts();
    currentPage = Math.min(currentPage, Math.max(totalPages, 1));
    await loadProducts();
    renderPagination();
    updateURLParameters();
  }

  // =====================
  // SEARCH SUGGESTIONS
  // =====================
  async function getSearchRecommendations() {
    const searchInput = document.getElementById("searchInput");
    const searchValue = searchInput?.value || "";

    try {
      const queryParams = new URLSearchParams({
        q: searchValue,
        categories: currentFilters.categories.join(","),
      });

      const response = await fetch(
        `/search/suggestions?${queryParams.toString()}`,
      );

      if (!response.ok) {
        throw new Error("Error fetching recommendations");
      }

      const suggestions = await response.json();
      return Array.isArray(suggestions)
        ? suggestions.map((suggestion) =>
            decodeURIComponent(String(suggestion)),
          )
        : [];
    } catch (error) {
      console.error("Error:", error);
      return [];
    }
  }

  function initializeSearchSuggestions() {
    const searchInput = document.getElementById("searchInput");
    const suggestionsContainer = document.getElementById("suggestions");
    const inlineSearchBtn = document.getElementById("inlineSearchBtn");

    if (!searchInput || !suggestionsContainer) return;

    let selectedSuggestionIndex = -1;
    let visibleSuggestions = [];
    let debounceId = null;

    function positionSuggestions() {
      const rect = searchInput.getBoundingClientRect();
      const containerRect =
        searchInput.closest(".search-container")?.getBoundingClientRect() ||
        rect;
      const top = rect.bottom + 12;
      const left = containerRect.left;
      const width = containerRect.width;

      suggestionsContainer.style.setProperty("--suggestions-top", `${top}px`);
      suggestionsContainer.style.setProperty("--suggestions-left", `${left}px`);
      suggestionsContainer.style.setProperty(
        "--suggestions-width",
        `${width}px`,
      );
    }

    function showSuggestions() {
      positionSuggestions();
      suggestionsContainer.style.display = "block";
    }

    function hideSuggestions() {
      suggestionsContainer.style.display = "none";
      selectedSuggestionIndex = -1;
    }

    function createSuggestionItems(items) {
      if (items.length === 0) {
        return `<div class="suggestion-item"><i class="fas fa-info-circle"></i><span>No suggestions</span></div>`;
      }

      return items
        .map(
          (item, index) => `
                <a href="/search?search=${encodeURIComponent(item)}">
                    <div class="suggestion-item ${index === selectedSuggestionIndex ? "selected" : ""}" data-index="${index}">
                        <i class="fas fa-search"></i>
                        <span>${item}</span>
                    </div>
                </a>
            `,
        )
        .join("");
    }

    async function updateSuggestions() {
      visibleSuggestions = await getSearchRecommendations();
      suggestionsContainer.innerHTML = `<div class="suggestions-wrapper">${createSuggestionItems(visibleSuggestions)}</div>`;
      showSuggestions();
    }

    function updateSelectedSuggestion() {
      suggestionsContainer
        .querySelectorAll(".suggestion-item")
        .forEach((item, index) => {
          item.classList.toggle("selected", index === selectedSuggestionIndex);
        });
    }

    function goToSearch() {
      const search = searchInput.value.trim();
      const url = new URL(window.location.origin + "/search");
      if (search) url.searchParams.set("search", search);
      window.location.href = url.toString();
    }

    searchInput.addEventListener("focus", updateSuggestions);

    searchInput.addEventListener("input", () => {
      clearTimeout(debounceId);
      selectedSuggestionIndex = -1;
      currentFilters.search = searchInput.value.trim();
      debounceId = setTimeout(updateSuggestions, 250);
    });

    searchInput.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        selectedSuggestionIndex = Math.min(
          selectedSuggestionIndex + 1,
          visibleSuggestions.length - 1,
        );
        updateSelectedSuggestion();
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, -1);
        updateSelectedSuggestion();
        return;
      }

      if (event.key === "Escape") {
        hideSuggestions();
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();

        if (
          selectedSuggestionIndex >= 0 &&
          selectedSuggestionIndex < visibleSuggestions.length
        ) {
          window.location.href = `/search?search=${encodeURIComponent(visibleSuggestions[selectedSuggestionIndex])}`;
          return;
        }

        goToSearch();
      }
    });

    window.addEventListener("resize", () => {
      if (suggestionsContainer.style.display === "block") positionSuggestions();
    });

    window.addEventListener(
      "scroll",
      () => {
        if (suggestionsContainer.style.display === "block")
          positionSuggestions();
      },
      { passive: true },
    );

    inlineSearchBtn?.addEventListener("click", goToSearch);

    document.addEventListener("click", (event) => {
      if (!event.target.closest(".search-container")) {
        hideSuggestions();
      }
    });
  }

  // =====================
  // FILTERS
  // =====================
  function initializeFilters() {
    const sortDropdown = document.querySelector(".sort-dropdown");

    sortDropdown?.addEventListener("change", async (event) => {
      currentFilters.sort = event.target.value;
      currentPage = 1;
      await refreshProducts();
    });

    const categoryCheckboxes = document.querySelectorAll(
      'input[name="category"]',
    );

    categoryCheckboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", async (event) => {
        categoryCheckboxes.forEach((cb) => {
          if (cb !== event.target) cb.checked = false;
        });

        currentFilters.categories = event.target.checked
          ? [event.target.value]
          : [];
        currentPage = 1;
        await refreshProducts();
        closeFilters();
      });
    });

    const applyPriceBtn = document.querySelector(".apply-btn");

    applyPriceBtn?.addEventListener("click", async () => {
      const minPrice = document.getElementById("minPrice")?.value || "";
      const maxPrice = document.getElementById("maxPrice")?.value || "";

      if (minPrice && maxPrice && Number(minPrice) > Number(maxPrice)) {
        showErrorMessage("Minimum price cannot be greater than maximum price.");
        return;
      }

      currentFilters.minPrice = minPrice;
      currentFilters.maxPrice = maxPrice;
      currentPage = 1;
      await refreshProducts();
      closeFilters();
    });

    const sizeCheckboxes = document.querySelectorAll('input[name="size"]');

    sizeCheckboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", async () => {
        currentFilters.sizes = Array.from(sizeCheckboxes)
          .filter((cb) => cb.checked)
          .map((cb) => cb.value);
        currentPage = 1;
        await refreshProducts();
      });
    });

    document
      .getElementById("clearFilters")
      ?.addEventListener("click", async () => {
        currentFilters.sort = "popularity";
        currentFilters.categories = [];
        currentFilters.minPrice = "";
        currentFilters.maxPrice = "";
        currentFilters.sizes = [];
        currentFilters.search = "";

        document.querySelector(".sort-dropdown").value = "popularity";
        document.querySelectorAll('input[type="checkbox"]').forEach((input) => {
          input.checked = false;
        });
        const minPrice = document.getElementById("minPrice");
        const maxPrice = document.getElementById("maxPrice");
        const searchInput = document.getElementById("searchInput");

        if (minPrice) minPrice.value = "";
        if (maxPrice) maxPrice.value = "";
        if (searchInput) searchInput.value = "";

        currentPage = 1;
        await refreshProducts();
        closeFilters();
      });
  }

  function loadURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);

    const searchQuery = urlParams.get("search");
    const searchInput = document.getElementById("searchInput");

    if (searchQuery && searchInput) {
      searchInput.value = searchQuery;
      currentFilters.search = searchQuery;
    }

    const sortValue = urlParams.get("sort");

    if (sortValue) {
      currentFilters.sort = sortValue;
      const sortDropdown = document.querySelector(".sort-dropdown");
      if (sortDropdown) sortDropdown.value = sortValue;
    }

    const categories = urlParams.getAll("categories");

    if (categories.length > 0) {
      currentFilters.categories = categories;
      document
        .querySelectorAll('input[name="category"]')
        .forEach((checkbox) => {
          checkbox.checked = categories.includes(checkbox.value);
        });
    }

    const minPrice = urlParams.get("minPrice");
    const maxPrice = urlParams.get("maxPrice");

    if (minPrice) {
      currentFilters.minPrice = minPrice;
      const minInput = document.getElementById("minPrice");
      if (minInput) minInput.value = minPrice;
    }

    if (maxPrice) {
      currentFilters.maxPrice = maxPrice;
      const maxInput = document.getElementById("maxPrice");
      if (maxInput) maxInput.value = maxPrice;
    }

    const sizes = urlParams.getAll("sizes");

    if (sizes.length > 0) {
      currentFilters.sizes = sizes;
      document.querySelectorAll('input[name="size"]').forEach((checkbox) => {
        checkbox.checked = sizes.includes(checkbox.value);
      });
    }
  }

  function updateURLParameters() {
    const url = new URL(window.location);

    if (currentFilters.search)
      url.searchParams.set("search", currentFilters.search);
    else url.searchParams.delete("search");

    if (currentFilters.sort !== "popularity")
      url.searchParams.set("sort", currentFilters.sort);
    else url.searchParams.delete("sort");

    url.searchParams.delete("categories");
    currentFilters.categories.forEach((category) =>
      url.searchParams.append("categories", category),
    );

    if (currentFilters.minPrice)
      url.searchParams.set("minPrice", currentFilters.minPrice);
    else url.searchParams.delete("minPrice");

    if (currentFilters.maxPrice)
      url.searchParams.set("maxPrice", currentFilters.maxPrice);
    else url.searchParams.delete("maxPrice");

    url.searchParams.delete("sizes");
    currentFilters.sizes.forEach((size) =>
      url.searchParams.append("sizes", size),
    );

    window.history.pushState({}, "", url);
  }

  // =====================
  // SCROLL REVEAL
  // =====================
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
  );

  document
    .querySelectorAll(
      ".search-section, .filters, .results-toolbar, .footer-brand, .footer-col",
    )
    .forEach((element, index) => {
      element.classList.add("reveal");
      element.style.transitionDelay = `${(index % 4) * 70}ms`;
      revealObserver.observe(element);
    });

  // =====================
  // INIT
  // =====================
  loadURLParameters();
  initializeSearchSuggestions();
  initializeFilters();
  refreshProducts();

  window.addEventListener("popstate", () => {
    loadURLParameters();
    refreshProducts();
  });
});
