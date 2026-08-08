(function registerResponsiveUI() {
  function initializeResponsiveUI() {
    function notify(message, type = "info") {
      let region = document.querySelector(".app-notification-region");
      if (!region) {
        region = document.createElement("div");
        region.className = "app-notification-region";
        region.setAttribute("aria-live", "polite");
        document.body.appendChild(region);
      }
      const notification = document.createElement("div");
      notification.className = `app-notification ${type}`;
      notification.setAttribute("role", type === "error" ? "alert" : "status");
      notification.textContent = message;
      region.appendChild(notification);
      window.setTimeout(() => notification.remove(), 4000);
    }

    window.ArniUI = { ...(window.ArniUI || {}), notify };
    if (document.querySelector(".login-container")) {
      document.body.classList.add("auth-page");
    }

    function setupCategoryMenu() {
      const navigation = document.querySelector(".navbar .nav-links");
      const categoryLinks = [
        ...(navigation?.querySelectorAll('a[data-category="true"]') || []),
      ];
      if (!navigation || !categoryLinks.length) return;

      let categories;
      try {
        categories = JSON.parse(categoryLinks[0].dataset.categories || "[]");
      } catch (error) {
        console.error("Unable to build the category menu:", error);
        return;
      }
      if (!Array.isArray(categories) || !categories.length) return;

      const menu = document.createElement("div");
      menu.className = "category-menu";
      const trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = "category-menu-trigger";
      trigger.setAttribute("aria-expanded", "false");
      trigger.setAttribute("aria-controls", "category-mega-menu");
      trigger.innerHTML =
        '<span>Categories</span><i class="fas fa-chevron-down" aria-hidden="true"></i>';

      const panel = document.createElement("div");
      panel.className = "category-mega-menu";
      panel.id = "category-mega-menu";
      panel.innerHTML =
        '<div class="category-menu-heading"><span>Shop by category</span><small>Browse every collection</small></div>';
      const grid = document.createElement("div");
      grid.className = "category-menu-grid";

      categories.forEach((category) => {
        const group = document.createElement("section");
        group.className = "category-menu-group";
        const categoryLink = document.createElement("a");
        categoryLink.className = "category-menu-main";
        categoryLink.href = `/subcategories?main=${encodeURIComponent(category._id)}`;
        categoryLink.textContent = toTitleCase(category.mainCategoryName);
        group.appendChild(categoryLink);

        const subcategoryList = document.createElement("div");
        subcategoryList.className = "category-subcategory-list";
        const subcategories = Array.isArray(category.subcategories)
          ? category.subcategories
          : [];
        if (subcategories.length) {
          subcategories.forEach((subcategory) => {
            const link = document.createElement("a");
            link.href = `/products?sub=${encodeURIComponent(subcategory._id)}`;
            link.textContent = toTitleCase(subcategory.subCategoryName);
            subcategoryList.appendChild(link);
          });
        } else {
          const unavailable = document.createElement("span");
          unavailable.className = "category-menu-unavailable";
          unavailable.textContent = "Collection coming soon";
          subcategoryList.appendChild(unavailable);
        }
        group.appendChild(subcategoryList);
        grid.appendChild(group);
      });

      panel.appendChild(grid);
      menu.append(trigger, panel);
      categoryLinks[0].before(menu);
      categoryLinks.forEach((link) => link.remove());

      const setOpen = (open) => {
        menu.classList.toggle("is-open", open);
        trigger.setAttribute("aria-expanded", String(open));
      };
      trigger.addEventListener("click", (event) => {
        event.stopPropagation();
        setOpen(!menu.classList.contains("is-open"));
      });
      menu.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          setOpen(false);
          trigger.focus();
        }
      });
      document.addEventListener("click", (event) => {
        if (!menu.contains(event.target)) setOpen(false);
      });
    }

    function toTitleCase(value = "") {
      return String(value)
        .trim()
        .toLowerCase()
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
    }

    function setupStoreNavigation() {
      const container = document.querySelector(".navbar .nav-container");
      const links = container?.querySelector(".nav-links");
      if (
        !container ||
        !links ||
        container.querySelector(".global-mobile-toggle")
      )
        return;

      // Replace older page-specific hamburger elements with one accessible control.
      container.querySelectorAll(".hamburger-menu").forEach((legacyToggle) => {
        legacyToggle.remove();
      });

      links.id ||= "primary-navigation";
      const button = document.createElement("button");
      button.type = "button";
      button.className = "global-mobile-toggle";
      button.setAttribute("aria-label", "Open navigation");
      button.setAttribute("aria-controls", links.id);
      button.setAttribute("aria-expanded", "false");
      button.innerHTML = '<i class="fas fa-bars" aria-hidden="true"></i>';

      const navRight = container.querySelector(".nav-right");
      container.insertBefore(button, navRight || links);

      const close = () => {
        container.classList.remove("global-open");
        button.setAttribute("aria-expanded", "false");
        button.setAttribute("aria-label", "Open navigation");
        button.innerHTML = '<i class="fas fa-bars" aria-hidden="true"></i>';
      };
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        const open = container.classList.toggle("global-open");
        button.setAttribute("aria-expanded", String(open));
        button.setAttribute(
          "aria-label",
          open ? "Close navigation" : "Open navigation",
        );
        button.innerHTML = `<i class="fas fa-${open ? "times" : "bars"}" aria-hidden="true"></i>`;
      });
      links.addEventListener("click", (event) => {
        if (event.target.closest("a")) close();
      });
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") close();
      });
      document.addEventListener("click", (event) => {
        if (!container.contains(event.target)) close();
      });
    }

    function setupAdminNavigation() {
      if (!window.location.pathname.startsWith("/admin")) return;
      const sidebar = document.querySelector("aside.sidebar, .sidebar");
      if (!sidebar || document.querySelector(".global-admin-toggle")) return;

      document.body.classList.add("has-global-admin-toggle");
      sidebar.id ||= "admin-navigation";
      const button = document.createElement("button");
      button.type = "button";
      button.className = "global-admin-toggle";
      button.setAttribute("aria-label", "Open admin navigation");
      button.setAttribute("aria-controls", sidebar.id);
      button.setAttribute("aria-expanded", "false");
      button.innerHTML = '<span aria-hidden="true">☰</span>';
      const backdrop = document.createElement("button");
      backdrop.type = "button";
      backdrop.className = "global-admin-backdrop";
      backdrop.setAttribute("aria-label", "Close admin navigation");
      document.body.append(button, backdrop);

      const setOpen = (open) => {
        sidebar.classList.toggle("global-open", open);
        backdrop.classList.toggle("global-open", open);
        button.setAttribute("aria-expanded", String(open));
        button.setAttribute(
          "aria-label",
          open ? "Close admin navigation" : "Open admin navigation",
        );
        button.innerHTML = `<span aria-hidden="true">${open ? "×" : "☰"}</span>`;
      };
      button.addEventListener("click", () =>
        setOpen(!sidebar.classList.contains("global-open")),
      );
      backdrop.addEventListener("click", () => setOpen(false));
      sidebar.addEventListener("click", (event) => {
        if (event.target.closest("a")) setOpen(false);
      });
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") setOpen(false);
      });
    }

    function wrapTables() {
      document.querySelectorAll("table").forEach((table) => {
        if (
          table.parentElement?.classList.contains("table-container") ||
          table.parentElement?.classList.contains("table-responsive")
        )
          return;
        const wrapper = document.createElement("div");
        wrapper.className = "table-responsive";
        wrapper.setAttribute("role", "region");
        wrapper.setAttribute("aria-label", "Scrollable data table");
        wrapper.tabIndex = 0;
        table.parentNode.insertBefore(wrapper, table);
        wrapper.appendChild(table);
      });
    }

    function markExternalLinks() {
      document.querySelectorAll('a[target="_blank"]').forEach((link) => {
        const rel = new Set(
          (link.getAttribute("rel") || "").split(/\s+/).filter(Boolean),
        );
        rel.add("noopener");
        rel.add("noreferrer");
        link.setAttribute("rel", [...rel].join(" "));
      });
    }

    function improveFormAccessibility() {
      document
        .querySelectorAll("input, select, textarea")
        .forEach((control) => {
          if (
            !control.getAttribute("aria-label") &&
            !control.getAttribute("aria-labelledby") &&
            !document.querySelector(`label[for="${control.id}"]`)
          ) {
            const label =
              control.getAttribute("placeholder") ||
              control.getAttribute("name") ||
              "Form field";
            control.setAttribute("aria-label", label);
          }
        });
    }

    document.querySelectorAll("[data-history-back]").forEach((button) => {
      button.addEventListener("click", () => window.history.back());
    });

    setupCategoryMenu();
    setupStoreNavigation();
    setupAdminNavigation();
    wrapTables();
    markExternalLinks();
    improveFormAccessibility();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeResponsiveUI);
  } else {
    initializeResponsiveUI();
  }
})();
