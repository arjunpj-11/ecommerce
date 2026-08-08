function initializeBackground() {
  const canvas = document.getElementById("backgroundCanvas");
  if (!canvas) return;
  const context = canvas.getContext("2d");
  const particles = Array.from({ length: 50 }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    size: Math.random() * 3 + 1,
    speedX: Math.random() * 2 - 1,
    speedY: Math.random() * 2 - 1,
  }));

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function animate() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((particle) => {
      particle.x += particle.speedX;
      particle.y += particle.speedY;
      if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1;
      if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1;
      context.beginPath();
      context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      context.fillStyle = "rgba(200, 200, 255, 0.5)";
      context.fill();
    });
    window.requestAnimationFrame(animate);
  }

  resize();
  window.addEventListener("resize", resize);
  animate();
}

async function readJson(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) {
    throw new Error(data.message || "Request failed.");
  }
  return data;
}

async function verifyRetryPayment(response, orderId) {
  try {
    await fetch("/users/orderOverview/verify-retry-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_order_id: response.razorpay_order_id,
        orderId,
      }),
    }).then(readJson);
    await Swal.fire("Success!", "Payment completed successfully.", "success");
    window.location.reload();
  } catch (error) {
    Swal.fire("Payment failed", error.message, "error");
  }
}

async function retryPayment(orderId) {
  try {
    const data = await fetch(`/users/orderOverview/${orderId}/retry-payment`, {
      method: "POST",
    }).then(readJson);
    const gateway = new window.Razorpay({
      key: data.key_id,
      amount: data.order.amount,
      currency: data.order.currency,
      order_id: data.order.id,
      name: "ARNI",
      description: "Order payment retry",
      handler: (response) => verifyRetryPayment(response, orderId),
      theme: { color: "#4a90e2" },
    });
    gateway.on("payment.failed", () => {
      Swal.fire("Payment failed", "No charge was completed.", "error");
    });
    gateway.open();
  } catch (error) {
    Swal.fire("Payment unavailable", error.message, "error");
  }
}

function requestReason({ title, prompt, url, successTitle }) {
  return Swal.fire({
    title,
    text: prompt,
    input: "text",
    inputAttributes: { maxlength: "300" },
    showCancelButton: true,
    confirmButtonText: "Submit",
    showLoaderOnConfirm: true,
    preConfirm: async (value) => {
      const reason = String(value || "").trim();
      if (reason.length < 5) {
        Swal.showValidationMessage("Please enter at least 5 characters.");
        return false;
      }
      try {
        return await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason }),
        }).then(readJson);
      } catch (error) {
        Swal.showValidationMessage(error.message);
        return false;
      }
    },
  }).then(async (result) => {
    if (!result.isConfirmed) return;
    await Swal.fire(successTitle, result.value.message, "success");
    window.location.reload();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initializeBackground();
  document.querySelectorAll(".timeline-item").forEach((item, index) => {
    window.setTimeout(() => item.classList.add("animate"), index * 300);
  });
});

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-order-action]");
  if (!button) return;

  const orderId = button.dataset.orderId;
  if (button.dataset.orderAction === "retry") {
    retryPayment(orderId);
  } else if (button.dataset.orderAction === "cancel") {
    requestReason({
      title: "Cancel Order",
      prompt: "Please provide a reason for cancellation:",
      url: `/users/orderOverview/${orderId}/cancel`,
      successTitle: "Order cancelled",
    });
  } else if (button.dataset.orderAction === "refund") {
    requestReason({
      title: "Request Refund",
      prompt: "Please provide a reason for the refund:",
      url: `/users/orderOverview/${orderId}/refund`,
      successTitle: "Refund requested",
    });
  }
});
