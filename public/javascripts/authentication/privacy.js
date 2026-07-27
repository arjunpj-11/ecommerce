document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("backgroundCanvas");
  const sections = document.querySelectorAll(
    ".section, .contact-info, .page-actions",
  );

  initializeCanvas();
  initializeReveal();

  function initializeReveal() {
    if (!sections.length) return;

    sections.forEach((section, index) => {
      section.style.opacity = "0";
      section.style.transform = "translateY(22px)";
      section.style.transition = `opacity 0.55s ease ${Math.min(index * 50, 250)}ms, transform 0.55s ease ${Math.min(index * 50, 250)}ms`;
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0)";
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -40px 0px",
      },
    );

    sections.forEach((section) => observer.observe(section));
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
