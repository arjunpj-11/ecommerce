// public/js/wishlist.js
document.addEventListener("DOMContentLoaded", function () {
  const wishlistGrid = document.querySelector(".wishlist-grid");

  // Handle remove from wishlist
  wishlistGrid.addEventListener("click", async (e) => {
    if (e.target.classList.contains("remove-wishlist")) {
      const wishlistItem = e.target.closest(".wishlist-item");
      const variantId = wishlistItem.dataset.variantId;

      try {
        const response = await fetch(`/users/wishlist/item/${variantId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();

        if (data.success) {
          wishlistItem.remove();
          showToast("Item removed from wishlist", "success");

          // Check if wishlist is empty after removal
          if (!document.querySelector(".wishlist-item")) {
            wishlistGrid.innerHTML = `
                            <div class="empty-wishlist">
                                <p>Your wishlist is empty</p>
                                <a href="/shop" class="shop-now-btn">Shop Now</a>
                            </div>
                        `;
          }
        } else {
          showToast("Failed to remove item", "error");
        }
      } catch (error) {
        console.error("Error:", error);
        showToast("Error removing item", "error");
      }
    }
  });

  // Toast notification function
  function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = "slideIn 0.3s ease-out reverse";
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
});
