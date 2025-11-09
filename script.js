// Team-Based Login Check 
const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
if (!loggedInUser || !loggedInUser.teamName) {
  alert("Please log in first!");
  window.location.href = "login.html";
}

const teamName = loggedInUser.teamName;
const user = {
  name: loggedInUser.username,
  role: loggedInUser.role,
};

//Display Info 
document.getElementById("teamName").textContent = teamName;
document.getElementById("userName").textContent = user.name;
document.getElementById("userRole").textContent = user.role;

//Load Notes from LocalStorage 
function loadNotes() {
  const stored = localStorage.getItem("teamNotes_" + teamName);
  if (!stored) {
    return { "went-well": [], "to-improve": [], "action-needed": [] };
  }

  try {
    const parsed = JSON.parse(stored);
    ["went-well", "to-improve", "action-needed"].forEach(type => {
      if (!Array.isArray(parsed[type])) parsed[type] = [];
    });
    return parsed;
  } catch (err) {
    console.warn("Invalid data found, resetting...");
    return { "went-well": [], "to-improve": [], "action-needed": [] };
  }
}


// Save Notes to LocalStorage 
function saveNotes() {
  localStorage.setItem("teamNotes_" + teamName, JSON.stringify(teamNotes));
}

// --- Initialize Notes Object Safely ---
let teamNotes = loadNotes();

// --- Ensure Correct Data Structure ---
["went-well", "to-improve", "action-needed"].forEach(type => {
  if (!Array.isArray(teamNotes[type])) {
    teamNotes[type] = [];
  }
});

// --- Save to make sure corrupted data is reset ---
saveNotes();

// --- Render Notes Safely ---
document.addEventListener("DOMContentLoaded", () => {
  renderNotes();

  // Add enter key listener for note creation
  ["went-well", "to-improve", "action-needed"].forEach(type => {
    const input = document.getElementById(`${type}-Input`);
    input.addEventListener("keypress", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        note(type);
      }
    });
  });
});

// Render Notes 
function renderNotes() {
  ["went-well", "to-improve", "action-needed"].forEach(type => {
    const list = document.getElementById(`${type}-list`);
    list.innerHTML = "";

    if (!Array.isArray(teamNotes[type])) teamNotes[type] = [];

    if (teamNotes[type].length === 0) {
      list.innerHTML = "<li class='text-gray-400 italic'>No notes yet 📝</li>";
      return;
    }

    teamNotes[type].forEach(note => {
      const li = document.createElement("li");
      li.className = "border-b py-1 flex justify-between items-center";
      li.innerHTML = `
        <div class="meta text-sm">
          ${note.text} <span class="text-gray-500">- ${note.author} (${note.role})</span>
        </div>
        <div class="flex gap-2">
          <button class="text-blue-500" onclick="editNote('${type}', ${note.id})">✏️</button>
          <button class="text-red-500" onclick="deleteNote('${type}', ${note.id})">🗑️</button>
        </div>
      `;
      list.appendChild(li);
    });
  });
}

renderNotes();

// Add New Note
function note(type) {
  const input = document.getElementById(`${type}-Input`);
  var text = input.value.trim();
  if (text.length < 3) return alert("Please enter something meaningful!");

  if (!Array.isArray(teamNotes[type])) teamNotes[type] = [];
  teamNotes[type].push({
    id: Date.now(),
    text,
    author: user.name,
    role: user.role,
    time: new Date().toLocaleString()
  });

  input.value = "";
  saveNotes();
  renderNotes();
}

// Edit Note
function editNote(type, id) {
  const noteToEdit = teamNotes[type].find(n => n.id === id);
  if (!noteToEdit) return;
  if(noteToEdit.text.length<3)alert("Enter valid note");
  const newText = prompt("Edit note:", noteToEdit.text);
  if (newText && newText.trim()) {
    noteToEdit.text = newText.trim();
    saveNotes();
    renderNotes();
  }
}

// --- Delete Note ---
function deleteNote(type, id) {
  teamNotes[type] = teamNotes[type].filter(n => n.id !== id);
  saveNotes();
  renderNotes();
}

// --- Search Functionality ---
document.getElementById("searchBox").addEventListener("input", (e) => {
  const term = e.target.value.toLowerCase();
  document.querySelectorAll(".column ul li").forEach(li => {
    li.style.display = li.textContent.toLowerCase().includes(term) ? "flex" : "none";
  });
});



["went-well", "to-improve", "action-needed"].forEach(type => {
  const dropdown = document.getElementById(`sort-${type}`);
  if (dropdown) {
    dropdown.addEventListener("change", (e) => sortNotes(type, e.target.value));
  }

  // Add note with Enter key
  const input = document.getElementById(`${type}-Input`);
  input.addEventListener("keypress", (event) => {
    if (event.key === "Enter") note(type);
  });
});

// --- Logout ---
document.getElementById("logoutbtn").addEventListener("click", () => {
  if (confirm("Are you sure you want to logout?")) {
    localStorage.removeItem("loggedInUser");
    window.location.href = "login.html";
  }
});

// --- Export JSON ---
document.getElementById("exportBtn").addEventListener("click", () => {
  const data = JSON.stringify(teamNotes, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${teamName}_retro_data.json`;
  a.click();
  URL.revokeObjectURL(a.href);
});

document.addEventListener("DOMContentLoaded", renderNotes);
