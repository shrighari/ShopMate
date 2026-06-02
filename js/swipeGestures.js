function initializeSwipeGestures() {
  const cards = document.querySelectorAll(".swipeCard");
  cards.forEach(function (card) {
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
      card.style.transform = `translateX(${diffX}px)`;
    };
    card.ontouchend = function () {
      dragging = false;
      const diffX = currentX - startX;
      const itemName = card.dataset.itemName;
      if (diffX > 120) {
        openPurchaseConfirmation(itemName);
      } else if (diffX < -120) {
        deleteItem(itemName);
      }
      card.style.transform = "translateX(0px)";
    };
  });
}
