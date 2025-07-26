const barcodeInput = document.getElementById("barcodeInput");
const productList = document.getElementById("productList");
const totalAmountEl = document.getElementById("totalAmount");
const printSection = document.getElementById("printSection");
const receiptContent = document.getElementById("receiptContent");
const printBillBtn = document.getElementById("printBillBtn");

let products = [];
let total = 0;

barcodeInput.addEventListener("change", () => {
  const code = barcodeInput.value.trim();
  const found = products.find(p => p.barcode === code);
  if (found) {
    addToList(found.name, found.price);
  } else {
    alert("পণ্য পাওয়া যায়নি!");
  }
  barcodeInput.value = '';
});

function addToList(name, price) {
  const li = document.createElement("li");
  li.textContent = `${name} - ৳${price}`;
  productList.appendChild(li);
  total += parseFloat(price);
  totalAmountEl.textContent = `৳${total}`;
}

printBillBtn.addEventListener("click", () => {
  receiptContent.innerHTML = productList.innerHTML + `<hr><strong>মোট: ৳${total}</strong>`;
  printSection.style.display = "block";
  window.print();
  setTimeout(() => printSection.style.display = "none", 1000);
});

// Modal Functions
const modal = document.getElementById("productModal");
const addBtn = document.getElementById("addProductBtn");
const closeBtn = document.getElementById("closeModal");
const saveBtn = document.getElementById("saveProductBtn");

addBtn.onclick = () => modal.style.display = "block";
closeBtn.onclick = () => modal.style.display = "none";
window.onclick = e => { if (e.target === modal) modal.style.display = "none"; }

saveBtn.onclick = () => {
  const name = document.getElementById("newProductName").value.trim();
  const barcode = document.getElementById("newProductBarcode").value.trim();
  const price = document.getElementById("newProductPrice").value.trim();
  if (name && barcode && price) {
    products.push({ name, barcode, price });
    alert("পণ্য যোগ হয়েছে!");
    modal.style.display = "none";
    document.getElementById("newProductName").value = '';
    document.getElementById("newProductBarcode").value = '';
    document.getElementById("newProductPrice").value = '';
  } else {
    alert("সব ঘর পূরণ করুন!");
  }
};
