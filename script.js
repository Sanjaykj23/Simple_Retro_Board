// Check login status
const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
if (!loggedInUser) {
  alert("Please log in first!");
  window.location.href = "login.html";
}

// Extract user details
const teamName = loggedInUser.teamName;
const user = {
  name: loggedInUser.username,
  role: loggedInUser.role,
  uname: loggedInUser.username
};

// Display user info on page
document.getElementById("teamName").textContent = teamName;
document.getElementById("userName").textContent = user.name;
document.getElementById("userRole").textContent = user.role;

// Add note to list
function note(type) {
  const input = document.getElementById(`${type}-Input`);
  const list = document.getElementById(`${type}-list`);
  const text = input.value.trim();
  if (text === "") return;

  const li = document.createElement("li");
  li.innerHTML = `
    <div class="meta">
      ${text} - ${user.name} (${user.role})
    </div>
    <div class="votebtn" onclick="vote(this)">👍</div>
  `;
  list.appendChild(li);
  input.value = "";
}

// Handle vote button
function vote(btn) {
  if (!btn.dataset.vote) btn.dataset.vote = 0;
  btn.dataset.vote++;
  btn.textContent = `👍${btn.dataset.vote}`;
}

// Logout logic
const logoutBtn = document.getElementById("logoutbtn");
logoutBtn.addEventListener("click", () => {
  console.log("hi");
  const confirmLogout = confirm("Are you sure you want to log out?");
  if (confirmLogout) {
    localStorage.removeItem("loggedInUser");
    window.location.href = "login.html";
  }
});