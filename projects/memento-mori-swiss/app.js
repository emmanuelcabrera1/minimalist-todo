const TOTAL_YEARS = 80;
const WEEKS_PER_YEAR = 52.1429;
const TOTAL_WEEKS = Math.floor(TOTAL_YEARS * WEEKS_PER_YEAR);

const birthdateInput = document.getElementById('birthdate');
const weeksLivedEl = document.getElementById('weeksLived');
const weeksLeftEl = document.getElementById('weeksLeft');
const percentageLivedEl = document.getElementById('percentageLived');

const renderer = new GridRenderer('lifeGrid');

function calculateWeeks(birthDateStr) {
  if (!birthDateStr) return 0;
  const now = new Date();
  const birth = new Date(birthDateStr);
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  const diff = now - birth;
  const weeks = Math.floor(diff / oneWeek);
  return Math.max(0, weeks);
}

function updateUI(dateStr) {
  const lived = calculateWeeks(dateStr);
  const left = Math.max(0, TOTAL_WEEKS - lived);
  const percent = ((lived / TOTAL_WEEKS) * 100).toFixed(1);

  // Update Stats
  weeksLivedEl.innerText = lived.toLocaleString();
  weeksLeftEl.innerText = left.toLocaleString();
  percentageLivedEl.innerText = percent;

  // Draw Grid
  renderer.drawGrid(TOTAL_WEEKS, lived);
}

// Event Listener
birthdateInput.addEventListener('change', (e) => {
  const date = e.target.value;
  if (date) {
    localStorage.setItem('mementoMoriSwissDoB', date);
    updateUI(date);
  }
});

// Init
function init() {
  const savedDate = localStorage.getItem('mementoMoriSwissDoB');
  if (savedDate) {
    birthdateInput.value = savedDate;
    updateUI(savedDate);
  } else {
    // Initial render (empty or 0)
    renderer.drawGrid(TOTAL_WEEKS, 0);
  }

  // Force initial resize to ensure correct sizing
  setTimeout(() => renderer.resize(), 10);
}

init();
