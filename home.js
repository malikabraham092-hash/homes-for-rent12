// ✅ Initialize EmailJS once
if (!window.emailjsInitialized) {
  emailjs.init("ovtP9kCBBtVMNH2Xl"); // <-- Replace with your EmailJS User ID
  window.emailjsInitialized = true;
}

let selectedHome = "";
let isAdmin = false; // Track if admin is logged in

// Load homes from localStorage when page loads
document.addEventListener("DOMContentLoaded", () => {
  loadHomes();
});

// Admin key check
function checkAdminKey() {
  const key = document.getElementById("adminKey").value;
  if (key === "2128580653") {
    document.getElementById("addHomeForm").style.display = "block";
    document.getElementById("adminLogin").style.display = "none";
    isAdmin = true;
    addDeleteButtonsToExistingHomes();
  } else {
    alert("Incorrect key.");
  }
}

// Add new home
function addHome() {
  const title = document.getElementById("homeTitle").value.trim();
  const desc = document.getElementById("homeDesc").value.trim();
  const imgFile = document.getElementById("homeImage").files[0];

  if (!title) return alert("Please enter a home title.");

  const reader = new FileReader();
  reader.onload = function (e) {
    const imgSrc = imgFile ? e.target.result : "";

    const homes = JSON.parse(localStorage.getItem("homes") || "[]");
    homes.push({ title, desc, imgSrc });
    localStorage.setItem("homes", JSON.stringify(homes));

    renderHome({ title, desc, imgSrc });

    document.getElementById("homeTitle").value = "";
    document.getElementById("homeDesc").value = "";
    document.getElementById("homeImage").value = "";
  };

  if (imgFile) reader.readAsDataURL(imgFile);
  else reader.onload({ target: { result: "" } });
}

// Load homes from localStorage
function loadHomes() {
  const homes = JSON.parse(localStorage.getItem("homes") || "[]");
  homes.forEach((home) => renderHome(home));
}

// Render a home card
function renderHome(home) {
  const homeCard = document.createElement("div");
  homeCard.className = "home-card";

  let buttonsHtml = `<button type="button" onclick="showInterestForm('${home.title}')">I'm Interested</button>`;
  if (isAdmin) {
    buttonsHtml += ` <button type="button" class="delete-btn" onclick="deleteHome('${home.title}', this)">Delete</button>`;
  }

  homeCard.innerHTML = `
    <img src="${home.imgSrc}" alt="Home Image">
    <h4>${home.title}</h4>
    <p>${home.desc}</p>
    ${buttonsHtml}
  `;

  document.getElementById("homeList").appendChild(homeCard);
}

// Add Delete buttons to existing home cards after admin login
function addDeleteButtonsToExistingHomes() {
  const homeCards = document.querySelectorAll("#homeList .home-card");
  homeCards.forEach((card) => {
    if (card.querySelector("button.delete-btn")) return;

    const title = card.querySelector("h4").innerText;
    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "delete-btn";
    deleteBtn.innerText = "Delete";
    deleteBtn.onclick = () => deleteHome(title, deleteBtn);

    card.appendChild(deleteBtn);
  });
}

// Delete a home
function deleteHome(title, btn) {
  if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

  let homes = JSON.parse(localStorage.getItem("homes") || "[]");
  homes = homes.filter((home) => home.title !== title);
  localStorage.setItem("homes", JSON.stringify(homes));

  btn.parentElement.remove();
}

// Show interest form
function showInterestForm(homeName) {
  selectedHome = homeName;
  document.getElementById("interestForm").style.display = "block";
  window.scrollTo(0, document.body.scrollHeight);
}

// ✅ Prevent duplicate submissions & send 2 emails only
let isSending = false;

function sendInterest() {
  if (isSending) return; // Prevent double send clicks
  isSending = true;

  const email = document.getElementById("userEmail").value.trim();
  const phone = document.getElementById("userPhone").value.trim();

  if (!email || !phone) {
    alert("Please fill out both fields.");
    isSending = false;
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    alert("Please enter a valid email address.");
    isSending = false;
    return;
  }

  const params = {
    user_email: email,
    phone: phone,
    home: selectedHome,
  };

  // First: send email to admin (notification)
  emailjs
    .send("service_gpkzfy8", "template_7m81dxd", params)
    .then(() => {
      console.log("Admin notification sent.");

      // Second: send confirmation to user
      return emailjs.send("service_gpkzfy8", "template_fsfwmyo", params);
    })
    .then(() => {
      console.log("User confirmation sent.");
      alert(
        `Your interest in "${selectedHome}" has been sent! A confirmation email has also been sent to you.`
      );

      document.getElementById("interestForm").style.display = "none";
      document.getElementById("userEmail").value = "";
      document.getElementById("userPhone").value = "";
    })
    .catch((error) => {
      console.error("Email sending error:", error);
      alert("Failed to send your interest. Please check your EmailJS setup and try again.");
    })
    .finally(() => {
      isSending = false; // Re-enable after process
    });
}
