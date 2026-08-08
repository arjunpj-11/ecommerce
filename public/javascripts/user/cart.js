const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
});

function showToast(message, type = "info") {
  const region = document.getElementById("toastRegion") || document.body;
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.setAttribute("role", type === "error" ? "alert" : "status");
  toast.textContent = message;
  region.appendChild(toast);
  window.setTimeout(() => toast.remove(), 3500);
}

async function readJson(response) {
  const contentType = response.headers.get("content-type") || "";
  if (response.redirected || contentType.includes("text/html")) {
    window.location.href = response.url || "/auth/login";
    throw new Error("Please sign in to continue.");
  }
  return response.json();
}

async function updateQuantity(button, change) {
  const item = button.closest(".cart-item");
  const input = item.querySelector(".quantity-input");
  const currentValue = Number.parseInt(input.value, 10) || 1;
  const quantity = Math.max(1, currentValue + change);

  if (quantity === currentValue) return;

  setItemBusy(item, true);
  try {
    const response = await fetch("/users/cart/update-quantity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        variantId: item.dataset.variantId,
        size2: item.dataset.size,
        quantity,
      }),
    });
    const data = await readJson(response);
    if (!response.ok)
      throw new Error(data.error || "Unable to update quantity.");

    input.value = data.quantity;
    if (data.couponCleared) {
      document.body.dataset.couponApplied = "false";
      renderCouponState(null);
      showToast("The coupon was removed because your cart changed.", "info");
    }
    updateCartTotals();
    showToast("Cart quantity updated.", "success");
  } catch (error) {
    showToast(
      error.message || "Unable to update quantity. Please try again.",
      "error",
    );
  } finally {
    setItemBusy(item, false);
  }
}

async function removeItem(button) {
  const item = button.closest(".cart-item");
  setItemBusy(item, true);

  try {
    const response = await fetch("/users/cart/remove-item", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        variantId: item.dataset.variantId,
        size: item.dataset.size,
      }),
    });
    const data = await readJson(response);
    if (!response.ok)
      throw new Error(data.error || "Unable to remove this item.");

    item.remove();
    if (data.couponCleared) {
      document.body.dataset.couponApplied = "false";
      renderCouponState(null);
    }
    if (!document.querySelector(".cart-item")) {
      window.location.reload();
      return;
    }
    updateCartTotals();
    showToast(data.message, "success");
  } catch (error) {
    setItemBusy(item, false);
    showToast(
      error.message || "Unable to remove this item. Please try again.",
      "error",
    );
  }
}

function setItemBusy(item, busy) {
  item.classList.toggle("is-busy", busy);
  item.querySelectorAll("button, input").forEach((control) => {
    control.disabled = busy || item.classList.contains("out-of-stock-item");
  });
}

function toggleCoupons() {
  const suggestions = document.getElementById("couponSuggestions");
  const button = document.querySelector(".show-coupons-btn");
  const isOpen = suggestions.classList.toggle("active");
  button?.setAttribute("aria-expanded", String(isOpen));
}

function selectCoupon(code) {
  document.getElementById("couponInput").value = code;
  toggleCoupons();
  applyCoupon();
}

async function applyCoupon() {
  const input = document.getElementById("couponInput");
  const applyButton = document.querySelector(".redeem-btn");
  const code = input.value.trim();
  if (!code) {
    showToast("Enter or select a coupon code.", "error");
    input.focus();
    return;
  }

  applyButton.disabled = true;
  try {
    const response = await fetch("/users/cart/apply-coupon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await readJson(response);
    if (!response.ok)
      throw new Error(data.error || "Unable to apply this coupon.");

    renderCouponState({ code: code.toUpperCase(), discount: data.discount });
    document.getElementById("totalAmount").textContent = money.format(
      data.total,
    );
    showToast(data.message || "Coupon applied successfully.", "success");
  } catch (error) {
    applyButton.disabled = false;
    input.setAttribute("aria-invalid", "true");
    showToast(error.message || "Unable to apply this coupon.", "error");
  }
}

async function clearCoupon() {
  const clearButton = document.querySelector(".clear-coupon-btn");
  if (clearButton) clearButton.disabled = true;

  try {
    const response = await fetch("/users/cart/clear-coupon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const data = await readJson(response);
    if (!response.ok)
      throw new Error(data.error || "Unable to remove the coupon.");

    renderCouponState(null);
    document.getElementById("totalAmount").textContent = money.format(
      data.total,
    );
    showToast(data.message, "success");
  } catch (error) {
    if (clearButton) clearButton.disabled = false;
    showToast(error.message || "Unable to remove the coupon.", "error");
  }
}

function renderCouponState(coupon) {
  const input = document.getElementById("couponInput");
  const applyButton = document.querySelector(".redeem-btn");
  const clearButton = document.querySelector(".clear-coupon-btn");

  input.removeAttribute("aria-invalid");
  input.disabled = Boolean(coupon);
  input.value = coupon?.code || "";
  applyButton.disabled = Boolean(coupon);
  document.getElementById("couponStatus").textContent = coupon
    ? `−${money.format(coupon.discount)}`
    : "No discount applied";
  if (clearButton) clearButton.hidden = !coupon;
}

function updateCartTotals() {
  const subtotal = [...document.querySelectorAll(".cart-item")].reduce(
    (total, item) => {
      const price = Number(item.dataset.price);
      const quantity = Number(item.querySelector(".quantity-input").value);
      return total + price * quantity;
    },
    0,
  );
  const shipping = Number(
    document.querySelector(".summary")?.dataset.shipping || 0,
  );
  document.getElementById("subtotalAmount").textContent =
    money.format(subtotal);
  document.getElementById("totalAmount").textContent = money.format(
    subtotal + shipping,
  );
}

function proceedToCheckout() {
  const unavailableItem = document.querySelector(".out-of-stock-item");
  if (unavailableItem) {
    unavailableItem.scrollIntoView({ behavior: "smooth", block: "center" });
    showToast("Update or remove unavailable items before checkout.", "error");
    return;
  }
  window.location.href = "/users/checkout";
}

document.addEventListener("click", (event) => {
  const control = event.target.closest("[data-cart-action]");
  if (!control) return;

  const actions = {
    remove: () => removeItem(control),
    decrease: () => updateQuantity(control, -1),
    increase: () => updateQuantity(control, 1),
    "apply-coupon": applyCoupon,
    "clear-coupon": clearCoupon,
    "toggle-coupons": toggleCoupons,
    "select-coupon": () => selectCoupon(control.dataset.couponCode),
    checkout: proceedToCheckout,
  };

  actions[control.dataset.cartAction]?.();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    const suggestions = document.getElementById("couponSuggestions");
    if (suggestions?.classList.contains("active")) toggleCoupons();
  }
});
