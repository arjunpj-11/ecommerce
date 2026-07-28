document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form");
  const password = document.getElementById("password");
  const passwordConfirm = document.getElementById("passwordConfirm");
  const togglePassword = document.getElementById("togglePassword");
  const togglePasswordConfirm = document.getElementById(
    "togglePasswordConfirm",
  );
  const canvas = document.getElementById("backgroundCanvas");

  const criteria = {
    length: document.getElementById("criteria-length"),
    uppercase: document.getElementById("criteria-uppercase"),
    lowercase: document.getElementById("criteria-lowercase"),
    number: document.getElementById("criteria-number"),
    special: document.getElementById("criteria-special"),
  };

  let passwordError = false;
  let passwordConfirmError = false;

  initializeValidation();
  initializePasswordToggles();
  initializeCanvas();

  function setError(element, message) {
    if (!element) return;

    const messageElement = document.getElementById(`${element.id}Message`);

    if (messageElement) {
      messageElement.textContent = message;
    }

    element.classList.add("iAfter");
  }

  function clearError(element) {
    if (!element) return;

    const messageElement = document.getElementById(`${element.id}Message`);

    if (messageElement) {
      messageElement.textContent = "";
    }

    element.classList.remove("iAfter");
  }

  function getPasswordChecks(value) {
    return {
      length: value.length >= 8,
      uppercase: /[A-Z]/.test(value),
      lowercase: /[a-z]/.test(value),
      number: /\d/.test(value),
      special: /[@$!%*?&]/.test(value),
    };
  }

  function updatePasswordCriteria(value) {
    const checks = getPasswordChecks(value);

    Object.entries(checks).forEach(([key, isValid]) => {
      criteria[key]?.classList.toggle("valid", isValid);
    });

    return Object.values(checks).every(Boolean);
  }

  function validatePassword() {
    if (!password) return true;

    const value = password.value.trim();
    const isStrong = updatePasswordCriteria(value);

    if (!value) {
      setError(password, "Password is required.");
      passwordError = true;
      return false;
    }

    if (!isStrong) {
      setError(password, "Password must meet all listed criteria.");
      passwordError = true;
      return false;
    }

    clearError(password);
    passwordError = false;
    return true;
  }

  function validateConfirmPassword() {
    if (!password || !passwordConfirm) return true;

    const passwordValue = password.value.trim();
    const confirmPasswordValue = passwordConfirm.value.trim();

    if (!confirmPasswordValue) {
      setError(passwordConfirm, "Confirm password is required.");
      passwordConfirmError = true;
      return false;
    }

    if (passwordValue !== confirmPasswordValue) {
      setError(passwordConfirm, "Passwords do not match.");
      passwordConfirmError = true;
      return false;
    }

    clearError(passwordConfirm);
    passwordConfirmError = false;
    return true;
  }

  function initializeValidation() {
    if (!form || !password || !passwordConfirm) return;

    password.addEventListener("blur", validatePassword);
    password.addEventListener("input", () => {
      validatePassword();

      if (passwordConfirm.value.trim()) {
        validateConfirmPassword();
      }
    });

    passwordConfirm.addEventListener("blur", validateConfirmPassword);
    passwordConfirm.addEventListener("input", validateConfirmPassword);

    form.addEventListener("submit", handleSubmit);
  }

  function initializePasswordToggles() {
    setupPasswordToggle(togglePassword, password, "password");
    setupPasswordToggle(
      togglePasswordConfirm,
      passwordConfirm,
      "confirm password",
    );
  }

  function setupPasswordToggle(button, input, label) {
    if (!button || !input) return;

    button.addEventListener("click", () => {
      const icon = button.querySelector("i");
      const isPassword = input.getAttribute("type") === "password";

      input.setAttribute("type", isPassword ? "text" : "password");
      button.setAttribute(
        "aria-label",
        isPassword ? `Hide ${label}` : `Show ${label}`,
      );

      icon?.classList.toggle("fa-eye", !isPassword);
      icon?.classList.toggle("fa-eye-slash", isPassword);
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const isPasswordValid = validatePassword();
    const isConfirmValid = validateConfirmPassword();

    if (
      !isPasswordValid ||
      !isConfirmValid ||
      passwordError ||
      passwordConfirmError
    ) {
      showToast(
        "Please fix the highlighted fields before resetting your password.",
        "error",
      );
      (isPasswordValid ? passwordConfirm : password)?.focus();
      return;
    }

    const submitButton = form.querySelector(".submit-btn");

    try {
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerHTML =
          '<i class="fas fa-spinner fa-spin"></i> Resetting...';
      }

      const response = await fetch("/auth/resetPassword/resetPasswordConfirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: password.value,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to reset password.");
      }

      const data = await response.text();

      if (data === "done") {
        showToast("Password reset successfully. Redirecting...", "success");
        window.location.href = "/auth/resetSuccess";
        return;
      }

      showToast("Failed to reset password. Please try again.", "error");
    } catch (error) {
      console.error("Reset password error:", error);
      showToast("An error occurred while resetting your password.", "error");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fas fa-lock"></i> Reset Password';
      }
    }
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
    toast.setAttribute("role", type === "error" ? "alert" : "status");
    toast.setAttribute("aria-live", type === "error" ? "assertive" : "polite");

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
