// লোকাল ডেটা থেকে লোড করা
let products = JSON.parse(localStorage.getItem("products")) || [];
let cart = [];

function saveProducts() {
  localStorage.setItem("products", JSON.stringify(products));
}

function addProduct() {
  const name = document.getElementById("productName").value.trim();
  const price = parseFloat(document.getElementById("productPrice").value);
  const stock = parseInt(document.getElementById("productStock").value);

  if (!name || isNaN(price) || isNaN(stock)) {
    alert("সব তথ্য সঠিকভাবে পূরণ করুন!");
    return;
  }

  const newProduct = { id: Date.now(), name, price, stock };
  products.push(newProduct);
  saveProducts();
  displayProducts();
  clearProductInputs();
}

function clearProductInputs() {
  document.getElementById("productName").value = "";
  document.getElementById("productPrice").value = "";
  document.getElementById("productStock").value = "";
}

function displayProducts() {
  const productList = document.getElementById("productList");
  productList.innerHTML = "";

  products.forEach((product) => {
    const div = document.createElement("div");
    div.className = "product-row";
    div.innerHTML = `
      <strong>${product.name}</strong> - 
      ৳${product.price} 
      <small>(স্টক: ${product.stock})</small>
      <input type="number" min="1" placeholder="Qty" id="qty-${product.id}" />
      <button onclick="addToCart(${product.id})">➕</button>
    `;
    productList.appendChild(div);
  });
}

function addToCart(productId) {
  const qtyInput = document.getElementById(`qty-${productId}`);
  const quantity = parseInt(qtyInput.value);
  const product = products.find(p => p.id === productId);

  if (!product || isNaN(quantity) || quantity < 1) {
    alert("সঠিক পরিমাণ লিখুন!");
    return;
  }

  if (quantity > product.stock) {
    alert("স্টকে পর্যাপ্ত পণ্য নেই!");
    return;
  }

  cart.push({ ...product, quantity });
  product.stock -= quantity;
  saveProducts();
  displayProducts();
  alert("পণ্য কার্টে যোগ হয়েছে ✅");
}

function generateReceipt() {
  const shopName = document.getElementById("shopName").value || "নামহীন দোকান";
  const shopAddress = document.getElementById("shopAddress").value || "ঠিকানা নেই";
  const shopPhone = document.getElementById("shopPhone").value || "ফোন নম্বর নেই";

  if (cart.length === 0) {
    alert("কোনও পণ্য বিক্রি করা হয়নি!");
    return;
  }

  let total = 0;
  let receiptHTML = `
    <div class="receipt">
      <h2>${shopName}</h2>
      <p>${shopAddress}<br>📞 ${shopPhone}</p>
      <hr/>
      <table style="width:100%; font-size:14px;">
        <thead>
          <tr><th>পণ্য</th><th>দাম</th><th>Qty</th><th>মোট</th></tr>
        </thead>
        <tbody>
  `;

  cart.forEach(item => {
    const subtotal = item.price * item.quantity;
    total += subtotal;
    receiptHTML += `
      <tr>
        <td>${item.name}</td>
        <td>৳${item.price}</td>
        <td>${item.quantity}</td>
        <td>৳${subtotal}</td>
      </tr>
    `;
  });

  receiptHTML += `
        </tbody>
      </table>
      <hr/>
      <h3>মোট: ৳${total.toFixed(2)}</h3>
      <p>তারিখ: ${new Date().toLocaleString()}</p>
    </div>
  `;

  document.getElementById("printSection").innerHTML = receiptHTML;
  window.print();
  cart = [];
}
  
// পেজ লোড হলে প্রোডাক্ট দেখাও
document.addEventListener("DOMContentLoaded", displayProducts);
