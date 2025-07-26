<!-- billing/settings.html -->
<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>⚙️ সেটিংস প্যানেল - Admin</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <header>
    <h1>⚙️ সেটিংস প্যানেল</h1>
    <p>Billing Software - Admin Configuration</p>
  </header>

  <main>

    <!-- দোকানের তথ্য -->
    <section id="shopSettings">
      <h2>🏪 দোকানের তথ্য</h2>
      <input type="text" id="shopName" placeholder="দোকানের নাম" />
      <input type="text" id="shopAddress" placeholder="ঠিকানা" />
      <input type="text" id="shopPhone" placeholder="মোবাইল নম্বর" />
      <button onclick="saveShopSettings()">💾 সংরক্ষণ করুন</button>
    </section>

    <!-- ইউজার ব্যবস্থাপনা -->
    <section id="userSettings">
      <h2>👥 ইউজার ব্যবস্থাপনা</h2>
      <input type="text" id="newUserEmail" placeholder="ইউজার ইমেইল (salesman)" />
      <select id="userRole">
        <option value="salesman">Salesman</option>
        <option value="admin">Admin</option>
      </select>
      <button onclick="addUser()">➕ ইউজার যুক্ত করুন</button>
      <ul id="userList"></ul>
    </section>

    <!-- ব্যাকআপ ও ইম্পোর্ট -->
    <section id="backupSettings">
      <h2>💾 ব্যাকআপ / রিস্টোর</h2>
      <label>⏱️ অটো ব্যাকআপ টাইম:</label>
      <select id="backupInterval">
        <option value="6">প্রতি 6 ঘণ্টা</option>
        <option value="8">প্রতি 8 ঘণ্টা</option>
        <option value="12">প্রতি 12 ঘণ্টা</option>
        <option value="24">প্রতি 24 ঘণ্টা</option>
      </select>
      <button onclick="saveBackupSettings()">✅ সেট করুন</button>

      <hr/>

      <button onclick="exportData()">📤 ডেটা ব্যাকআপ (Export)</button>
      <input type="file" id="importFile" onchange="importData(event)" />
    </section>

    <!-- Reset -->
    <section id="resetSettings">
      <h2>⚠️ সফটওয়্যার রিসেট</h2>
      <button onclick="resetAllData()" style="background:#dc3545;">🔥 সব ডেটা মুছে ফেলুন</button>
    </section>

  </main>

  <script src="settings.js"></script>
</body>
</html>
