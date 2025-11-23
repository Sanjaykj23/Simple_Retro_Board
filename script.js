const $ = id => document.getElementById(id);
const qs = sel => document.querySelector(sel);

let loggedInUser = null;
try { loggedInUser = JSON.parse(localStorage.getItem('loggedInUser')); } catch(e){ loggedInUser = null; }
if (!loggedInUser || !loggedInUser.teamName) {
  alert('Please log in first');
  location.href = 'login.html';
}

const teamName = loggedInUser.teamName;
const user = {
  name: loggedInUser.username,
  role: loggedInUser.role,
};

document.getElementById("teamName").textContent = teamName;
document.getElementById("userName").textContent = user.name;
document.getElementById("userRole").textContent = user.role;

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

function saveNotes() {
  localStorage.setItem("teamNotes_" + teamName, JSON.stringify(teamNotes));
}

let teamNotes = loadNotes();
saveNotes();

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => { const l = $('loader'); if (l) l.style.display = 'none'; }, 500);
});

function toast(message) {
  const toast = document.getElementById("toast");
  const msg = document.getElementById("toastMessage");
  if (!toast || !msg) return;
  msg.textContent = message;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("show"), 50);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.classList.add("hidden"), 300);
  }, 2500);
}

function renderNotes() {
  ['went-well','to-improve','action-needed'].forEach(type => {
    const list = $(type + '-list');
    list.innerHTML = '';
    const arr = teamNotes[type] || [];
    if (arr.length === 0) {
      const li = document.createElement('li');
      li.className = 'empty';
      li.textContent = 'No notes yet 📝';
      list.appendChild(li);
      return;
    }
    arr.forEach(note => {
      const li = document.createElement('li');
      li.draggable = true;
      li.dataset.id = note.id;
      li.dataset.type = type;

      const meta = document.createElement('div');
      meta.className = 'note-meta';
      meta.innerHTML = `<div>${escapeHtml(note.text)}</div><div style="font-size:11px;color:#444;margin-top:6px;">${escapeHtml(note.author)} (${escapeHtml(note.role)}) • ${note.time || ''}</div>`;

      const actions = document.createElement('div');
      actions.className = 'note-actions';
      const voteBtn = document.createElement('button');
      voteBtn.textContent = `👍 ${note.votes||0}`;
      voteBtn.onclick = () => { note.votes = (note.votes||0)+1; saveNotes(); renderNotes(); };
      const editBtn = document.createElement('button');
      editBtn.textContent = '✏️';
      editBtn.onclick = () => openEditModal(type, note.id);
      const delBtn = document.createElement('button');
      delBtn.textContent = '🗑️';
      delBtn.onclick = () => openConfirm('Delete this note?', () => deleteNote(type, note.id));
      [voteBtn, editBtn, delBtn].forEach(b => { b.classList.add('small-btn'); actions.appendChild(b); });

      li.appendChild(meta);
      li.appendChild(actions);

      li.addEventListener('dragstart', e => {
        li.classList.add('dragging');
        e.dataTransfer.setData('text/plain', JSON.stringify({ id: note.id, from: type }));
      });
      li.addEventListener('dragend', () => li.classList.remove('dragging'));

      list.appendChild(li);
    });
  });
  updateSummary();
  renderChart();
}

function escapeHtml(s) { return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }

function addNote(type) {
  const input = $(type + '-Input');
  if (!input) return;
  const text = input.value.trim();
  if (text.length < 1) { toast('Write something meaningful'); return; }
  if (!Array.isArray(teamNotes[type])) teamNotes[type] = [];
  const obj = { id: Date.now() + Math.floor(Math.random()*1000), text, author: user.name, role: user.role, time: new Date().toLocaleString(), votes: 0 };
  teamNotes[type].push(obj);
  saveNotes();
  input.value = '';
  renderNotes();
  toast('Note added');
}

document.querySelectorAll('.addBtn').forEach(btn => {
  btn.addEventListener('click', e => {
    const type = btn.dataset.type;
    addNote(type);
  });
});

['went-well','to-improve','action-needed'].forEach(type => {
  const input = $(type + '-Input');
  if (!input) return;
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addNote(type); }
  });
});

let editContext = null;
function openEditModal(type, id) {
  editContext = { type, id };
  const note = (teamNotes[type]||[]).find(n=>n.id===id);
  if (!note) return;
  $('editText').value = note.text;
  $('editModal').classList.remove('hidden');
}
$('cancelEdit').addEventListener('click', ()=> $('editModal').classList.add('hidden'));
$('saveEdit').addEventListener('click', ()=>{
  if (!editContext) return;
  const { type, id } = editContext;
  const newText = $('editText').value.trim();
  if (!newText) { toast('Text cannot be empty'); return; }
  const note = teamNotes[type].find(n=>n.id===id);
  if (!note) return;
  note.text = newText;
  note.time = new Date().toLocaleString();
  saveNotes();
  renderNotes();
  $('editModal').classList.add('hidden');
  editContext = null;
  toast('Note updated');
});

function deleteNote(type, id) {
  teamNotes[type] = (teamNotes[type]||[]).filter(n=>n.id!==id);
  saveNotes();
  renderNotes();
  toast('Note deleted');
}

let confirmCallback = null;
function openConfirm(message, callback) {
  $('confirmText').textContent = message;
  confirmCallback = callback;
  $('confirmModal').classList.remove('hidden');
}
$('cancelConfirm').addEventListener('click', ()=> { confirmCallback = null; $('confirmModal').classList.add('hidden'); });
$('okConfirm').addEventListener('click', ()=> { if (typeof confirmCallback==='function') confirmCallback(); confirmCallback = null; $('confirmModal').classList.add('hidden'); });

['went-well','to-improve','action-needed'].forEach(type => {
  const ul = $(type + '-list');
  if (!ul) return;
  ul.addEventListener('dragover', e => e.preventDefault());
  ul.addEventListener('drop', e => {
    e.preventDefault();
    const data = e.dataTransfer.getData('text/plain');
    if (!data) return;
    let parsed;
    try { parsed = JSON.parse(data); } catch { return; }
    if (!parsed || !parsed.id) return;
    const from = parsed.from;
    const id = parsed.id;
    moveNote(id, from, type);
  });
});

function moveNote(id, from, to) {
  if (from === to) return;
  const idx = (teamNotes[from]||[]).findIndex(n=>n.id===id);
  if (idx === -1) return;
  const [item] = teamNotes[from].splice(idx,1);
  if (!Array.isArray(teamNotes[to])) teamNotes[to]=[];
  teamNotes[to].push(item);
  saveNotes();
  renderNotes();
  toast('Moved note');
}

$('searchBox').addEventListener('input', e => {
  const term = e.target.value.toLowerCase();
  document.querySelectorAll('.notes-list li').forEach(li => {
    if (li.classList.contains('empty')) return;
    li.style.display = li.textContent.toLowerCase().includes(term) ? '' : 'none';
  });
});

$('sortSelect').addEventListener('change', e => {
  const val = e.target.value;
  ['went-well','to-improve','action-needed'].forEach(type => {
    if (!Array.isArray(teamNotes[type])) return;
    if (val === 'az') teamNotes[type].sort((a,b)=> a.text.localeCompare(b.text));
    else if (val === 'za') teamNotes[type].sort((a,b)=> b.text.localeCompare(a.text));
    else if (val === 'recent') teamNotes[type].sort((a,b)=> b.id - a.id);
  });
  saveNotes();
  renderNotes();
});

$('logoutbtn').addEventListener('click', ()=> {
  if (confirm('Logout?')) { localStorage.removeItem('loggedInUser'); location.href='login.html'; }
});

$('exportBtnSmall').addEventListener('click', ()=> {
  const blob = new Blob([ JSON.stringify(teamNotes, null, 2) ], { type:'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `${teamName}_retro.json`; a.click(); URL.revokeObjectURL(url);
});

$('exportCsvBtn').addEventListener('click', ()=> {
  const rows = [['column','text','author','role','time','votes']];
  ['went-well','to-improve','action-needed'].forEach(k=>{
    (teamNotes[k]||[]).forEach(n=>{
      rows.push([k, `"${n.text.replaceAll('"','""')}"`, n.author, n.role, n.time||'', n.votes||0]);
    });
  });
  const csv = rows.map(r=> r.join(',') ).join('\n');
  const blob = new Blob([csv], { type:'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `${teamName}_retro.csv`; a.click(); URL.revokeObjectURL(url);
  toast('CSV exported');
});

$('exportPdfBtn').addEventListener('click', ()=> {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(`Team Retro Board - ${teamName}`, 10, 12);
  doc.setFontSize(11);
  doc.text(`Exported by: ${user.name} (${user.role})`, 10, 20);
  let y = 30;
  const sections = [
    { key:'went-well', title:'What went well' },
    { key:'to-improve', title:'What needs improvement' },
    { key:'action-needed', title:'Action needed' }
  ];
  sections.forEach(sec => {
    doc.setFontSize(13); doc.text(sec.title, 10, y); y += 6; doc.setFontSize(11);
    const arr = teamNotes[sec.key] || [];
    if (arr.length === 0) {
      doc.text('- No notes', 12, y); y += 8;
    } else {
      arr.forEach((n,i) => {
        const line = `${i+1}. ${n.text} — ${n.author} (${n.role})`;
        const split = doc.splitTextToSize(line, 180);
        doc.text(split, 12, y); y += split.length * 6;
        if (y > 270) { doc.addPage(); y = 20; }
      });
    }
    y += 6;
  });
  doc.save(`${teamName}_RetroBoard.pdf`);
  toast('PDF exported');
});

let dashChart = null;
function renderChart() {
  const ctx = $('retroChart');
  if (!ctx) return;
  const data = [
    (teamNotes['went-well']||[]).length,
    (teamNotes['to-improve']||[]).length,
    (teamNotes['action-needed']||[]).length
  ];
  if (dashChart) dashChart.destroy();
  dashChart = new Chart(ctx.getContext('2d'), {
    type: 'bar',
    data: { labels: ['Went well','To improve','Action needed'], datasets:[{ data, backgroundColor:['#16a34a','#f59e0b','#2563eb'] }] },
    options: { responsive:true, plugins:{ legend:{ display:false } } }
  });
}

$('dashboardBtn').addEventListener('click', openDashboard);
function openDashboard() {
  $('dashboardModal').classList.remove('hidden');
  $('dSumWell').textContent = (teamNotes['went-well']||[]).length;
  $('dSumImprove').textContent = (teamNotes['to-improve']||[]).length;
  $('dSumAction').textContent = (teamNotes['action-needed']||[]).length;
  setTimeout(()=> {
    const c = $('dashChart'); if (!c) return;
    const data = [ (teamNotes['went-well']||[]).length, (teamNotes['to-improve']||[]).length, (teamNotes['action-needed']||[]).length ];
    new Chart(c.getContext('2d'), { type:'pie', data:{ labels:['Went well','To improve','Action needed'], datasets:[{ data, backgroundColor:['#16a34a','#f59e0b','#2563eb'] }] } });
  }, 40);
}
function closeDashboard() { $('dashboardModal').classList.add('hidden'); }

$('themeToggle').addEventListener('click', ()=> {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark');
  $('themeToggle').textContent = isDark ? '☀️' : '🌙';
});

function updateSummary() {
  $('sumWell').textContent = (teamNotes['went-well']||[]).length;
  $('sumImprove').textContent = (teamNotes['to-improve']||[]).length;
  $('sumAction').textContent = (teamNotes['action-needed']||[]).length;
  const dWell = $('dSumWell'); if (dWell) dWell.textContent = $('sumWell').textContent;
  const dImp = $('dSumImprove'); if (dImp) dImp.textContent = $('sumImprove').textContent;
  const dAct = $('dSumAction'); if (dAct) dAct.textContent = $('sumAction').textContent;
}

document.addEventListener('keydown', e => {
  if (e.ctrlKey && e.key === '1') { $('went-well-Input').focus(); }
  if (e.ctrlKey && e.key === '2') { $('to-improve-Input').focus(); }
  if (e.ctrlKey && e.key === '3') { $('action-needed-Input').focus(); }
  if (e.key === '/') openDashboard();
});

function init() {
  renderNotes();
  renderChart();
  updateSummary();
}
init();

window.note = addNote;

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.small-btn').forEach(b => b.classList.add('small-btn'));
});