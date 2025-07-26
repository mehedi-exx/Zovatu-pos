let products = [];
let sales = [];

// পণ্য যোগ করা
function addProduct() {
  const name = document.getElementById("productName").value;
  const price = parseFloat(document.getElementById("productPrice").value);
  const stock = parseInt(document.getElementById("productStock").value);

  if (!name || isNaN(price) || isNaN(stock)) {
    alert("সব তথ্য সঠিকভাবে পূরণ করুন।");
    return;
  }

  const product = {
    name,
    price,
    stock,
    sold: 0
  };
  products.push(product);
  displayProductList();
  clearProductForm();
}

// প্রোডাক্ট লিস্ট দেখানো
function displayProductList() {
  const productList = document.getElementById("productList");
  productList.innerHTML = "";

  products.forEach((product, index) => {
    const div = document.createElement("div");
    div.innerHTML = `
      <strong>${product.name}</strong> - দাম: ৳${product.price} | স্টক: ${product.stock}
      <br/>
      বিক্রি: <input type="number" id="sellQty${index}" placeholder="পরিমাণ" style="width:80px;" />
      <button onclick="sellProduct(${index})">বিক্রি</button>
      <hr/>
    `;
    productList.appendChild(div);
  });
}

// প্রোডাক্ট বিক্রি করা
function sellProduct(index) {
  const qtyInput = document.getElementById("sellQty" + index);
  const qty = parseInt(qtyInput.value);

  if (isNaN(qty) || qty <= 0) {
    alert("সঠিক বিক্রয় পরিমাণ দিন।");
    return;
  }

  if (qty > products[index].stock) {
    alert("পর্যাপ্ত স্টক নেই!");
    return;
  }

  products[index].stock -= qty;
  products[index].sold += qty;

  sales.push({
    name: products[index].name,
    price: products[index].price,
    quantity: qty,
    total: qty * products[index].price
  });

  displayProductList();
}

// প্রোডাক্ট ফর্ম ক্লিয়ার করা
function clearProductForm() {
  document.getElementById("productName").value = "";
  document.getElementById("productPrice").value = "";
  document.getElementById("productStock").value = "";
}

// রিসিভ তৈরি ও প্রিন্ট করা
function generateReceipt() {
  const shopName = document.getElementById("shopName").value || "দোকানের নাম";
  const shopAddress = document.getElementById("shopAddress").value || "ঠিকানা";
  const shopPhone = document.getElementById("shopPhone").value || "মোবাইল";

  let receiptHTML = `
    <div class="receipt">
      <h2>${shopName}</h2>
      <p>${shopAddress}</p>
      <p>মোবাইল: ${shopPhone}</p>
      <hr/>
      <table>
        <thead>
          <tr>
            <th>পণ্য</th>
            <th>পরিমাণ</th>
            <th>দাম</th>
            <th>মোট</th>
          </tr>
        </thead>
        <tbody>
  `;

  let total = 0;
  sales.forEach(item => {
    total += item.total;
    receiptHTML += `
      <tr>
        <td>${item.name}</td>
        <td>${item.quantity}</td>
        <td>৳${item.price}</td>
        <td>৳${item.total}</td>
      </tr>
    `;
  });

  receiptHTML += `
        </tbody>
      </table>
      <hr/>
      <p><strong>মোট: ৳${total}</strong></p>
      <p>ধন্যবাদ!</p>
    </div>
  `;

  document.getElementById("printSection").innerHTML = receiptHTML;
  window.print();
}
