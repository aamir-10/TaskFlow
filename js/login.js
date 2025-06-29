document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const usernameInput = document.getElementById("username");
  const dobInput = document.getElementById("dob");
  const errorMsg = document.getElementById("errorMsg");

  const storedUser = JSON.parse(localStorage.getItem("taskflowUser"));

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    errorMsg.textContent = "";

    const enteredName = usernameInput.value.trim();
    const enteredDOB = new Date(dobInput.value).toISOString().split("T")[0];
    const savedName = storedUser?.name?.trim();
    const savedDOB = new Date(storedUser?.dob).toISOString().split("T")[0];

    // Check if entered credentials match stored user data
    if (enteredName === savedName && enteredDOB === savedDOB) {
      // Log in and redirect to app
      localStorage.setItem("isLoggedIn", "true");
      window.location.href = "app.html";
    } else {
      errorMsg.textContent = "Invalid name or date of birth. Please try again.";
    }
  });
});
