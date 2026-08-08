document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("profile-form");
  const editButton = document.querySelector(".edit-button");
  const usernameInput = form?.querySelector('input[name="username"]');
  if (!form || !editButton || !usernameInput) return;

  let isEditing = false;

  function setEditing(editing) {
    isEditing = editing;
    usernameInput.readOnly = !editing;
    usernameInput.style.opacity = editing ? "1" : "0.7";
    usernameInput.style.cursor = editing ? "text" : "not-allowed";
    editButton.textContent = editing ? "Save Profile" : "✏️ Edit Profile";
    if (editing) usernameInput.focus();
  }

  function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.setAttribute("role", type === "error" ? "alert" : "status");
    toast.textContent = message;
    document.body.appendChild(toast);
    window.setTimeout(() => toast.remove(), 3000);
  }

  editButton.addEventListener("click", async () => {
    if (!isEditing) {
      setEditing(true);
      return;
    }

    editButton.disabled = true;
    try {
      const response = await fetch("/users/pI/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: usernameInput.value }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Unable to update your profile.");
      }

      usernameInput.value = result.user.username;
      document.querySelector(".profile-header p:last-child").textContent =
        result.user.username;
      setEditing(false);
      showToast("Profile updated successfully.");
    } catch (error) {
      showToast(error.message || "Unable to update your profile.", "error");
      usernameInput.focus();
    } finally {
      editButton.disabled = false;
    }
  });

  setEditing(false);
});

const canvas = document.getElementById("backgroundCanvas");
const context = canvas?.getContext("2d");

if (canvas && context) {
  const particles = Array.from({ length: 60 }, () => ({
    x: 0,
    y: 0,
    size: 0,
    speedX: 0,
    speedY: 0,
  }));

  function resetParticle(particle) {
    particle.x = Math.random() * canvas.width;
    particle.y = Math.random() * canvas.height;
    particle.size = Math.random() * 2 + 0.5;
    particle.speedX = Math.random() - 0.5;
    particle.speedY = Math.random() - 0.5;
  }

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    particles.forEach(resetParticle);
  }

  function animate() {
    context.fillStyle = "rgba(18, 18, 18, 0.14)";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "rgba(234, 179, 8, 0.2)";

    particles.forEach((particle) => {
      particle.x += particle.speedX;
      particle.y += particle.speedY;
      if (
        particle.x < 0 ||
        particle.x > canvas.width ||
        particle.y < 0 ||
        particle.y > canvas.height
      ) {
        resetParticle(particle);
      }
      context.beginPath();
      context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      context.fill();
    });

    window.requestAnimationFrame(animate);
  }

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
  animate();
}
