// প্রোডাক্ট ডেটাবেইজ (ডেমো জন্য)
const productDatabase = {
  "123456789012": { name: "চিনি", price: 60 },
  "111222333444": { name: "তেল", price: 160 },
  "999888777666": { name: "সাবান", price: 45 },
  "555666777888": { name: "ডাল", price: 95 },
  "321321321321": { name: "লবণ", price: 25 }
};

let scannedProducts = [];

// বারকোড হ্যান্ডলার
function handleBarcode(event) {
  if (event.key === "Enter") {
    const barcode = event.target.value.trim();
    if (barcode && productDatabase[barcode]) {
      addProduct(barcode);
    } else {
      alert("এই বারকোড এর কোনো পণ্য খুঁজে পাওয়া যায়নি!");
    }
    event.target.value = "";
  }
}

// প্রোডাক্ট যুক্ত করা
function addProduct(barcode) {
  const product = productDatabase[barcode];
  const existing = scannedProducts.find(p => p.barcode === barcode);

  if (existing) {
    existing.quantity += 1;
  } else {
    scannedProducts.push({
      barcode,
      name: product.name,
      price: product.price,
      quantity: 1
    });
  }

  renderProductList();
}

// প্রোডাক্ট লিস্ট রেন্ডার
function renderProductList() {
  const list = document.getElementById("productList");
  const totalDisplay = document.getElementById("totalAmount");
  list.innerHTML = "";
  let total = 0;

  scannedProducts.forEach((p, index) => {
    const row = document.createElement("div");
    row.className = "product-row";
    row.innerHTML = `
      <strong>${p.name}</strong> - ${p.price} টাকা × 
      <input type="number" min="1" value="${p.quantity}" onchange="updateQuantity(${index}, this.value)" />
      = ${p.price * p.quantity} টাকা
      <button onclick="removeProduct(${index})">❌</button>
    `;
    list.appendChild(row);
    total += p.price * p.quantity;
  });

  totalDisplay.textContent = total;
}

// কোয়ান্টিটি আপডেট
function updateQuantity(index, newQty) {
  scannedProducts[index].quantity = parseInt(newQty);
  renderProductList();
}

// পণ্য রিমুভ
function removeProduct(index) {
  scannedProducts.splice(index, 1);
  renderProductList();
}

// রিসিভ জেনারেট
function generateReceipt() {
  if (scannedProducts.length === 0) return alert("কোনো পণ্য যোগ করা হয়নি!");

  const shopName = document.getElementById("shopName").value || "দোকানের নাম";
  const shopAddress = document.getElementById("shopAddress").value || "ঠিকানা";
  const shopPhone = document.getElementById("shopPhone").value || "মোবাইল";

  const printDiv = document.getElementById("printSection");
  const now = new Date();
  const formattedTime = now.toLocaleString("bn-BD");

  let html = `
    <div class="receipt">
      <h2>${shopName}</h2>
      <p>${shopAddress}</p>
      <p>মোবাইল: ${shopPhone}</p>
      <hr />
      <p><strong>তারিখ:</strong> ${formattedTime}</p>
      <table style="width:100%; font-size:14px;">
        <thead>
          <tr>
            <th>পণ্য</th>
            <th>দর</th>
            <th>পরিমাণ</th>
            <th>মোট</th>
          </tr>
        </thead>
        <tbody>
  `;

  let grandTotal = 0;
  scannedProducts.forEach(p => {
    const lineTotal = p.price * p.quantity;
    html += `
      <tr>
        <td>${p.name}</td>
        <td>${p.price}</td>
        <td>${p.quantity}</td>
        <td>${lineTotal}</td>
      </tr>
    `;
    grandTotal += lineTotal;
  });

  html += `
        </tbody>
      </table>
      <hr />
      <h3>মোট payable: ${grandTotal} টাকা</h3>
      <p style="text-align:center;">ধন্যবাদ! আবার আসবেন।</p>
    </div>
  `;

  printDiv.innerHTML = html;
  window.print();
}
