/* Attach touch handlers that translate horizontal swipes into card actions. */
function initializeSwipeGestures() {
  const cards = document.querySelectorAll(".swipeCard");
  cards.forEach(function (card) {
    const wrapper = card.closest(".swipeWrapper");
    let startX = 0;
    let currentX = 0;
    let dragging = false;
    card.ontouchstart = function (event) {
      startX = event.touches[0].clientX;
      currentX = startX;
      dragging = true;
    };
    card.ontouchmove = function (event) {
      if (!dragging) {
        return;
      }
      currentX = event.touches[0].clientX;
      const diffX = currentX - startX;
      if (Math.abs(diffX) > 8) {
        wrapper.classList.add("isDragging");
      }
      card.style.transform = `translateX(${diffX}px)`;
    };
    card.ontouchend = function () {
      dragging = false;
      const diffX = currentX - startX;
      const itemName = card.dataset.itemName;
      const itemId = card.dataset.itemId || itemName;
      /* Always reset the card first */
      card.style.transition = "transform 0.2s ease";
      card.style.transform = "translateX(0px)";
      /* Keep swipe actions visible through the card's return animation, then hide them. */
      setTimeout(function () {
        wrapper.classList.remove("isDragging");
      }, 240);
      if (diffX > 120) {
        if (appState.activeTab === "favorites") {
          setTimeout(function () {
            addFavoriteToList(itemName);
          }, 200);
        } else {
          setTimeout(function () {
            openPurchaseConfirmation(itemId);
          }, 200);
        }
      } else if (diffX < -120) {
        if (appState.activeTab === "favorites") {
          setTimeout(function () {
            toggleFavorite(itemName);
          }, 200);
        } else {
          setTimeout(function () {
            deleteItem(itemId);
          }, 200);
        }
      }
    };
    card.ontouchcancel = function () {
      dragging = false;
      card.style.transition = "transform 0.2s ease";
      card.style.transform = "translateX(0px)";
      wrapper.classList.remove("isDragging");
    };
  });
}
