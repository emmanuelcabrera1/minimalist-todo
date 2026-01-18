const TOTAL_YEARS = 80;
const WEEKS_PER_YEAR = 52.1429; // More precise
const TOTAL_WEEKS = Math.floor(TOTAL_YEARS * WEEKS_PER_YEAR);

const birthdateInput = document.getElementById('birthdate');
const lifeGrid = document.getElementById('lifeGrid');
const weeksLivedEl = document.getElementById('weeksLived');
const weeksLeftEl = document.getElementById('weeksLeft');
const percentageLivedEl = document.getElementById('percentageLived');

// Initialize Grid
function initGrid() {
  lifeGrid.innerHTML = '';
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < TOTAL_WEEKS; i++) {
    const week = document.createElement('div');
    week.classList.add('week');
    week.dataset.index = i; // For easier debugging if needed
    fragment.appendChild(week);
  }

  lifeGrid.appendChild(fragment);
}

// Calculate weeks lived
function calculateWeeks(birthDate) {
  const now = new Date();
  const birth = new Date(birthDate);
  // milliseconds per week
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  const diff = now - birth;
  const weeks = Math.floor(diff / oneWeek);
  return Math.max(0, weeks); // Prevent negative if future date
}

// Update UI
function updateUI(weeksLived) {
  // Update Stats
  weeksLivedEl.textContent = weeksLived.toLocaleString();
  const left = Math.max(0, TOTAL_WEEKS - weeksLived);
  weeksLeftEl.textContent = left.toLocaleString();

  const percentage = Math.min(100, (weeksLived / TOTAL_WEEKS) * 100).toFixed(1);
  percentageLivedEl.textContent = `${percentage}%`;

  // Update Grid - Improved performance by not re-rendering, just toggling classes
  const weeks = document.querySelectorAll('.week');

  weeks.forEach((week, index) => {
    // Reset classes
    week.className = 'week';

    if (index < weeksLived) {
      week.classList.add('lived');
    } else if (index === weeksLived) {
      week.classList.add('current');
    }
  });
}

// Handle Input Change
birthdateInput.addEventListener('change', (e) => {
  const date = e.target.value;
  if (date) {
    localStorage.setItem('mementoMoriBirthdate', date);
    const weeks = calculateWeeks(date);
    updateUI(weeks);
  }
});

// Init
function init() {
  initGrid();

  // Load from local storage
  const savedDate = localStorage.getItem('mementoMoriBirthdate');
  if (savedDate) {
    birthdateInput.value = savedDate;
    const weeks = calculateWeeks(savedDate);
    updateUI(weeks);
  } else {
    // Optional: Set default visual state or leave empty
    // Maybe animate specific pattern? For now, leave empty.
  }
}

init();
