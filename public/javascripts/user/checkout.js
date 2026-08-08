function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  window.setTimeout(() => toast.remove(), 3300);
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getOrderTotal() {
  const value = document.getElementById("totalAmount")?.textContent || "0";
  return Number(value.replace(/[^0-9.]/g, "")) || 0;
}

async function requestJson(url, options) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || data.error || "Request failed.");
  }
  return data;
}

function closeAddressModal() {
  const modal = document.getElementById("addressModal");
  if (modal) modal.style.display = "none";
}

function openAddressModal() {
  const modal = document.getElementById("addressModal");
  if (modal) modal.style.display = "flex";
}

function selectAddressCard(card) {
  document
    .querySelectorAll(".address-card")
    .forEach((item) => item.classList.remove("selected"));
  card.classList.add("selected");
  const radio = card.querySelector('input[name="shipping-address"]');
  if (radio) radio.checked = true;
}

function renderAddresses(addresses) {
  const list = document.querySelector(".address-list");
  if (!list) return;
  list.replaceChildren();

  if (!addresses.length) {
    const message = document.createElement("p");
    message.className = "empty-address-message";
    message.textContent = "Add a delivery address to place your order.";
    list.appendChild(message);
    return;
  }

  addresses.forEach((address, index) => {
    const card = document.createElement("div");
    card.className = `address-card${address.isPrimary || (!addresses.some((item) => item.isPrimary) && index === 0) ? " selected" : ""}`;
    card.dataset.addressId = address._id;

    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "shipping-address";
    radio.value = address._id;
    radio.checked = card.classList.contains("selected");

    const details = document.createElement("div");
    details.className = "address-details";
    const title = document.createElement("h3");
    title.textContent = address.name || "Delivery address";
    const street = document.createElement("p");
    street.textContent = address.street;
    const location = document.createElement("p");
    location.textContent = [
      address.city,
      address.state,
      address.postalCode,
      address.country,
    ]
      .filter(Boolean)
      .join(", ");
    details.append(title, street, location);
    if (address.phone) {
      const phone = document.createElement("p");
      phone.textContent = address.phone;
      details.appendChild(phone);
    }

    card.append(radio, details);
    card.addEventListener("click", () => selectAddressCard(card));
    list.appendChild(card);
  });
}

async function fetchAddresses() {
  const addresses = await requestJson("/users/checkout/addresses");
  renderAddresses(addresses);
}

function initializePaymentMethods() {
  const total = getOrderTotal();
  document.querySelectorAll(".payment-method").forEach((method) => {
    const radio = method.querySelector('input[type="radio"]');
    if (method.dataset.method === "cod" && total > 1000) {
      radio.disabled = true;
      method.classList.add("disabled");
      const warning = document.createElement("p");
      warning.className = "payment-warning";
      warning.textContent =
        "Cash on Delivery is unavailable for orders above ₹1,000.";
      method.querySelector("label")?.appendChild(warning);
    }

    method.addEventListener("click", () => {
      if (radio.disabled) {
        showToast(
          method.dataset.method === "cod"
            ? "Cash on Delivery is unavailable for orders above ₹1,000."
            : "This payment method is unavailable.",
          "warning",
        );
        return;
      }
      document
        .querySelectorAll(".payment-method")
        .forEach((item) => item.classList.remove("selected"));
      method.classList.add("selected");
      radio.checked = true;
    });
  });
}

async function initializeWalletPayment() {
  try {
    const { balance } = await requestJson("/users/checkout/wallet/balance");
    const container = document.querySelector(".payment-methods");
    if (!container) return;

    const total = getOrderTotal();
    const method = document.createElement("div");
    method.className = "payment-method";
    method.dataset.method = "wallet";
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "payment";
    radio.value = "wallet";
    radio.id = "wallet";
    radio.disabled = balance < total;
    const label = document.createElement("label");
    label.htmlFor = "wallet";
    const title = document.createElement("h3");
    title.textContent = "Pay with Wallet";
    const amount = document.createElement("p");
    amount.textContent = `Available Balance: ₹${formatMoney(balance)}`;
    label.append(title, amount);
    if (radio.disabled) {
      method.classList.add("disabled");
      const warning = document.createElement("p");
      warning.className = "payment-warning";
      warning.textContent = "Insufficient wallet balance for this order.";
      label.appendChild(warning);
    }
    method.append(radio, label);
    container.appendChild(method);

    method.addEventListener("click", () => {
      if (radio.disabled) {
        showToast("Insufficient wallet balance.", "warning");
        return;
      }
      document
        .querySelectorAll(".payment-method")
        .forEach((item) => item.classList.remove("selected"));
      method.classList.add("selected");
      radio.checked = true;
    });
  } catch (error) {
    showToast(error.message || "Wallet payment is unavailable.", "error");
  }
}

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = resolve;
    script.onerror = () => reject(new Error("Payment gateway failed to load."));
    document.head.appendChild(script);
  });
}

async function verifyRazorpayPayment(orderData, payment) {
  const result = await requestJson("/users/checkout/verify-payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...orderData, ...payment }),
  });
  showToast("Payment successful. Opening your orders…");
  window.setTimeout(() => {
    window.location.href = result.redirect || "/users/order";
  }, 900);
}

async function handleRazorpayPayment(orderData) {
  const data = await requestJson("/users/checkout/create-razorpay-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(orderData),
  });
  await loadRazorpay();

  const gateway = new window.Razorpay({
    key: data.keyId,
    amount: data.order.amount,
    currency: data.order.currency,
    name: "ARNI",
    description: "Purchase payment",
    order_id: data.order.id,
    prefill: {
      name: data.userInfo.name,
      email: data.userInfo.email,
      contact: data.userInfo.phone,
    },
    handler: (payment) => verifyRazorpayPayment(orderData, payment),
  });
  gateway.on("payment.failed", () => {
    showToast("Payment was not completed. Your cart is unchanged.", "error");
  });
  gateway.open();
}

async function handleWalletPayment(orderData) {
  const result = await requestJson("/users/checkout/wallet/pay", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ shippingAddressId: orderData.shippingAddressId }),
  });
  showToast(result.message || "Payment completed. Opening your orders…");
  window.setTimeout(() => {
    window.location.href = "/users/order";
  }, 900);
}

async function handleCODPayment(orderData) {
  const result = await requestJson("/users/checkout/place-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(orderData),
  });
  showToast(result.message || "Order placed. Opening your orders…");
  window.setTimeout(() => {
    window.location.href = "/users/order";
  }, 900);
}

function setPlaceOrderLoading(loading) {
  const button = document.getElementById("placeOrderBtn");
  if (!button) return;
  button.disabled = loading;
  button.textContent = loading ? "Processing…" : "Place Order";
}

async function placeOrder() {
  const address = document.querySelector(
    'input[name="shipping-address"]:checked',
  )?.value;
  const paymentMethod = document.querySelector(
    'input[name="payment"]:checked',
  )?.value;

  if (!address) {
    showToast("Please select a shipping address.", "warning");
    return;
  }
  if (!paymentMethod) {
    showToast("Please select a payment method.", "warning");
    return;
  }

  setPlaceOrderLoading(true);
  try {
    const orderData = { shippingAddressId: address, paymentMethod };
    if (paymentMethod === "razorpay") await handleRazorpayPayment(orderData);
    else if (paymentMethod === "wallet") await handleWalletPayment(orderData);
    else if (paymentMethod === "cod") await handleCODPayment(orderData);
    else throw new Error("Invalid payment method selected.");
  } catch (error) {
    showToast(error.message || "Order could not be placed.", "error");
  } finally {
    setPlaceOrderLoading(false);
  }
}

async function addAddress(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;

  const fields = ["name", "street", "city", "state", "zip", "phone", "country"];
  const values = Object.fromEntries(
    fields.map((id) => [id, document.getElementById(id)?.value.trim() || ""]),
  );
  const address = await requestJson("/users/checkout/addresses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: values.name,
      street: values.street,
      city: values.city,
      state: values.state,
      postalCode: values.zip,
      phone: values.phone || undefined,
      country: values.country || "India",
    }),
  });
  closeAddressModal();
  form.reset();
  document.getElementById("country").value = "India";
  await fetchAddresses();
  const addedCard = document.querySelector(
    `.address-card[data-address-id="${CSS.escape(address._id)}"]`,
  );
  if (addedCard) selectAddressCard(addedCard);
  showToast("Address added successfully.");
}

document.addEventListener("DOMContentLoaded", async () => {
  document
    .getElementById("openAddressModalBtn")
    ?.addEventListener("click", openAddressModal);
  document
    .getElementById("closeAddressModalBtn")
    ?.addEventListener("click", closeAddressModal);
  document
    .getElementById("placeOrderBtn")
    ?.addEventListener("click", placeOrder);
  document
    .getElementById("addAddressForm")
    ?.addEventListener("submit", (event) => {
      addAddress(event).catch((error) =>
        showToast(error.message || "Address could not be added.", "error"),
      );
    });
  document
    .getElementById("addressModal")
    ?.addEventListener("click", (event) => {
      if (event.target === event.currentTarget) closeAddressModal();
    });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeAddressModal();
  });

  initializePaymentMethods();
  await Promise.allSettled([fetchAddresses(), initializeWalletPayment()]);
});
