document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("userForm");
  const nameInput = document.getElementById("name");
  const dobInput = document.getElementById("dob");
  const errorMsg = document.getElementById("errorMsg");

  const existingUser = JSON.parse(localStorage.getItem("taskflowUser"));
  const sessionActive = localStorage.getItem("isLoggedIn");

  // Redirect to app if already logged in
  if (existingUser && sessionActive === "true") {
    window.location.href = "app.html";
    return;
  }

  // Show "Sign in" option if user exists
  if (existingUser) {
    const loginLink = document.getElementById("loginLink");
    loginLink.innerHTML = `Already have an account? <a href="login.html" class="signin-highlight">Sign in</a>`;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    errorMsg.textContent = "";

    const name = nameInput.value.trim();
    const dob = new Date(dobInput.value);

    if (!name || !dobInput.value) {
      errorMsg.textContent = "Please fill in all fields.";
      return;
    }

    const age = calculateAge(dob);
    if (age <= 10) {
      errorMsg.textContent = "You must be over 10 years old to continue.";
      return;
    }

    // Prevent registration if user already exists
    const existingUser = JSON.parse(localStorage.getItem("taskflowUser"));
    if (existingUser) {
      errorMsg.textContent = "An account already exists! Please sign in instead.";
      return;
    }

    // Save user and log in
    const user = {
      name,
      dob: dob.toISOString()
    };

    localStorage.setItem("taskflowUser", JSON.stringify(user));
    localStorage.setItem("isLoggedIn", "true");
    window.location.href = "app.html";
  });

  // Calculate age based on DOB
  function calculateAge(dob) {
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  }
});
