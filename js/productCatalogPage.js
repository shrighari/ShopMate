const productCatalogList = document.getElementById("productCatalogList");
const productSearchInput = document.getElementById("productSearchInput");
initializeProductCatalogPage();
/* Initialize Product Catalog */
function initializeProductCatalogPage() {
  renderProductCatalog();
  productSearchInput.addEventListener("input", renderProductCatalog);
}
/* Render Product Catalog */
function renderProductCatalog() {
  const searchText = productSearchInput.value.trim().toLowerCase();
  productCatalogList.innerHTML = "";
  Object.entries(appState.productCatalog || {})
    .filter(function ([name]) {
      return name.includes(searchText);
    })
    .forEach(function ([name, product]) {
      productCatalogList.innerHTML += `
        <div class="catalogCard">
          <div class="catalogCardHeader">
            <div class="catalogInfo">
              <h3 class="catalogTitle">${name}</h3>
              <p class="catalogPrice">$${product.defaultPrice || 0}</p>
              <p class="catalogShop">${product.preferredShop || "-"}</p>
            </div>
            ${product.imageUrl ? ` <img src="${product.imageUrl}" class="catalogImage"> ` : ""}
          </div>
          <div class="catalogActions">
            <button class="secondaryButton" onclick="editProduct('${name}')">Edit</button>
            <button class="dangerButton" onclick="deleteProduct('${name}')">Delete</button>
          </div>
        </div>
      `;
    });
}
/*Delete Product */
function deleteProduct(productName) {
  if (!confirm("Delete Product?")) {
    return;
  }
  delete appState.productCatalog[productName];
  saveAppState();
  showToast("Product Deleted");
  renderProductCatalog();
}
