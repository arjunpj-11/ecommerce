document.addEventListener("DOMContentLoaded", () => {
  const otpInputs = Array.from(document.querySelectorAll(".otp-inputs input"));
  const resendBtn = document.getElementById("resendBtn");
  const timerDisplay = document.getElementById("timer");
  const canvas = document.getElementById("backgroundCanvas");

  const RESEND_WAIT_SECONDS = 60;
  const MAX_RESEND_ATTEMPTS = 5;
  const LOCK_DURATION_MS = 12 * 60 * 60 * 1000;
  const STORAGE_COUNT_KEY = "forgotPasswordOtpResendCount";
  const STORAGE_EXPIRY_KEY = "forgotPasswordOtpResendExpiryTime";

  let countdown = RESEND_WAIT_SECONDS;
  let timerInterval = null;

  initializeOtpInputs();
  initializeResendOtp();
  initializeCanvas();

  function initializeOtpInputs() {
    if (!otpInputs.length) return;

    otpInputs[0].focus();

    otpInputs.forEach((input, index) => {
      input.addEventListener("input", (event) => {
        const cleanValue = event.target.value.replace(/\D/g, "").slice(0, 1);
        event.target.value = cleanValue;

        if (cleanValue && index < otpInputs.length - 1) {
          otpInputs[index + 1].focus();
        }
      });

      input.addEventListener("keydown", (event) => {
        if (event.key === "Backspace" && !event.target.value && index > 0) {
          otpInputs[index - 1].focus();
        }

        if (event.key === "ArrowLeft" && index > 0) {
          otpInputs[index - 1].focus();
        }

        if (event.key === "ArrowRight" && index < otpInputs.length - 1) {
          otpInputs[index + 1].focus();
        }
      });

      input.addEventListener("paste", (event) => {
        event.preventDefault();

        const pastedData = event.clipboardData
          .getData("text")
          .replace(/\D/g, "")
          .slice(0, otpInputs.length);

        if (!pastedData) return;

        otpInputs.forEach((otpInput, otpIndex) => {
          otpInput.value = pastedData[otpIndex] || "";
        });

        const focusIndex = Math.min(pastedData.length, otpInputs.length - 1);
        otpInputs[focusIndex].focus();
      });
    });
  }

  function initializeResendOtp() {
    if (!resendBtn || !timerDisplay) return;

    if (!localStorage.getItem(STORAGE_COUNT_KEY)) {
      localStorage.setItem(STORAGE_COUNT_KEY, "0");
    }

    resetCountIfExpired();
    startTimer();

    resendBtn.addEventListener("click", handleResendOtp);
  }

  async function handleResendOtp() {
    const count = Number.parseInt(
      localStorage.getItem(STORAGE_COUNT_KEY) || "0",
      10,
    );

    if (count >= MAX_RESEND_ATTEMPTS) {
      showToast(
        "You have reached the maximum resend attempts. Try again after 12 hours.",
        "error",
      );
      lockResendButton();
      return;
    }

    try {
      resendBtn.disabled = true;
      timerDisplay.textContent = "Sending OTP...";

      const response = await fetch("/auth/forgetPasswordOtp/resendOtp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to resend OTP");
      }

      const nextCount = count + 1;
      localStorage.setItem(STORAGE_COUNT_KEY, String(nextCount));

      if (nextCount >= MAX_RESEND_ATTEMPTS) {
        setExpiryTime();
        showToast(
          "OTP resent. Maximum attempts reached. Please wait 12 hours after this.",
          "error",
        );
      } else {
        showToast("OTP resent successfully.", "success");
      }

      countdown = RESEND_WAIT_SECONDS;
      startTimer();
    } catch (error) {
      console.error("Forgot password OTP resend error:", error);
      showToast("Failed to resend OTP. Please try again.", "error");
      countdown = 10;
      startTimer();
    }
  }

  function startTimer() {
    clearInterval(timerInterval);

    const count = Number.parseInt(
      localStorage.getItem(STORAGE_COUNT_KEY) || "0",
      10,
    );
    const expiryTime = Number.parseInt(
      localStorage.getItem(STORAGE_EXPIRY_KEY) || "0",
      10,
    );
    const currentTime = Date.now();

    if (
      count >= MAX_RESEND_ATTEMPTS &&
      expiryTime &&
      currentTime < expiryTime
    ) {
      lockResendButton();
      return;
    }

    resendBtn.disabled = true;
    timerDisplay.textContent = `Resend available in ${countdown}s`;

    timerInterval = setInterval(() => {
      countdown -= 1;

      if (countdown <= 0) {
        clearInterval(timerInterval);
        resendBtn.disabled = false;
        timerDisplay.textContent = "You can now resend the OTP.";
        countdown = RESEND_WAIT_SECONDS;
        return;
      }

      timerDisplay.textContent = `Resend available in ${countdown}s`;
    }, 1000);
  }

  function lockResendButton() {
    clearInterval(timerInterval);

    const expiryTime = Number.parseInt(
      localStorage.getItem(STORAGE_EXPIRY_KEY) || "0",
      10,
    );
    const remainingMs = Math.max(expiryTime - Date.now(), 0);
    const remainingMinutes = Math.ceil(remainingMs / 60000);

    resendBtn.disabled = true;

    if (remainingMinutes > 60) {
      const hours = Math.ceil(remainingMinutes / 60);
      timerDisplay.textContent = `Try again after ${hours} hour${hours > 1 ? "s" : ""}.`;
    } else if (remainingMinutes > 0) {
      timerDisplay.textContent = `Try again after ${remainingMinutes} minute${remainingMinutes > 1 ? "s" : ""}.`;
    } else {
      localStorage.setItem(STORAGE_COUNT_KEY, "0");
      localStorage.removeItem(STORAGE_EXPIRY_KEY);
      countdown = RESEND_WAIT_SECONDS;
      startTimer();
    }
  }

  function setExpiryTime() {
    localStorage.setItem(
      STORAGE_EXPIRY_KEY,
      String(Date.now() + LOCK_DURATION_MS),
    );
  }

  function resetCountIfExpired() {
    const expiryTime = Number.parseInt(
      localStorage.getItem(STORAGE_EXPIRY_KEY) || "0",
      10,
    );

    if (expiryTime && Date.now() > expiryTime) {
      localStorage.setItem(STORAGE_COUNT_KEY, "0");
      localStorage.removeItem(STORAGE_EXPIRY_KEY);
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
