// FPL Monte Carlo Explorer Frontend Application

const state = {
  allPlayers: [],
  filteredPlayers: [],
  currentFixtures: 1,
  currentPos: 'ALL',
  currentMaxPrice: 20.0,
  currentOwnership: 'all',
  currentSearch: '',
  currentPreset: 'all',
  sortKey: 'xp',
  sortAsc: false,
  squad: JSON.parse(localStorage.getItem('fpl_mc_squad') || '[]'),
  compareIds: new Set(JSON.parse(localStorage.getItem('fpl_mc_compare') || '[]')),
  activePlayer: null
};

// DOM Elements
const searchInput = document.getElementById('searchInput');
const posPills = document.getElementById('posPills');
const priceSelect = document.getElementById('priceSelect');
const ownershipSelect = document.getElementById('ownershipSelect');
const horizonSelect = document.getElementById('horizonSelect');
const playersTableBody = document.getElementById('playersTableBody');
const playersTableHeaders = document.querySelectorAll('#playersTable th[data-sort]');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingText = document.getElementById('loadingText');

// Modals & Drawer
const playerModal = document.getElementById('playerModal');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const compareModal = document.getElementById('compareModal');
const compareCloseBtn = document.getElementById('compareCloseBtn');
const closeCompareFooterBtn = document.getElementById('closeCompareFooterBtn');
const clearCompareBtn = document.getElementById('clearCompareBtn');
const btnCompareOpen = document.getElementById('btnCompareOpen');
const compareBadge = document.getElementById('compareBadge');

const squadDrawer = document.getElementById('squadDrawer');
const btnSquadOpen = document.getElementById('btnSquadOpen');
const squadDrawerClose = document.getElementById('squadDrawerClose');
const squadBadge = document.getElementById('squadBadge');
const btnAutoOptimize = document.getElementById('btnAutoOptimize');
const btnClearSquad = document.getElementById('btnClearSquad');

// Modal Elements
const modalPlayerName = document.getElementById('modalPlayerName');
const modalPlayerPrice = document.getElementById('modalPlayerPrice');
const modalPosBadge = document.getElementById('modalPosBadge');
const modalPlayerTeamFixture = document.getElementById('modalPlayerTeamFixture');
const modalStatXP = document.getElementById('modalStatXP');
const modalStatFloor = document.getElementById('modalStatFloor');
const modalStatMedian = document.getElementById('modalStatMedian');
const modalStatCeiling = document.getElementById('modalStatCeiling');
const modalStatHaul = document.getElementById('modalStatHaul');
const modalStatDefCon = document.getElementById('modalStatDefCon');
const svgChartWrapper = document.getElementById('svgChartWrapper');
const modalFixturesList = document.getElementById('modalFixturesList');
const modalAddSquadBtn = document.getElementById('modalAddSquadBtn');
const modalAddCompareBtn = document.getElementById('modalAddCompareBtn');

// Initialize
async function init() {
  setupEventListeners();
  updateCompareBadge();
  updateSquadBadge();
  await loadPlayers();
}

function showLoading(msg = 'Simulating matches...') {
  loadingText.textContent = msg;
  loadingOverlay.classList.add('active');
}

function hideLoading() {
  loadingOverlay.classList.remove('active');
}

// Fetch Players
async function loadPlayers() {
  showLoading('Loading FPL player stats & fixture difficulty...');
  try {
    const res = await fetch(`/api/players?fixtures=${state.currentFixtures}`);
    const data = await res.json();
    state.allPlayers = data.players || [];
    applyFiltersAndRender();
    updateKPIs();
  } catch (err) {
    console.error('Failed to load players:', err);
    playersTableBody.innerHTML = `<tr><td colspan="12" style="text-align:center; color:#ff5c85; padding:2rem;">Failed to load data from FPL API. Please try refreshing.</td></tr>`;
  } finally {
    hideLoading();
  }
}

// Event Listeners
function setupEventListeners() {
  // Search
  searchInput.addEventListener('input', (e) => {
    state.currentSearch = e.target.value;
    applyFiltersAndRender();
  });

  // Position Filter
  posPills.addEventListener('click', (e) => {
    const btn = e.target.closest('.pill-btn');
    if (!btn) return;
    posPills.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.currentPos = btn.dataset.pos;
    applyFiltersAndRender();
  });

  // Max Price
  priceSelect.addEventListener('change', (e) => {
    state.currentMaxPrice = parseFloat(e.target.value);
    applyFiltersAndRender();
  });

  // Ownership Filter Dropdown
  if (ownershipSelect) {
    ownershipSelect.addEventListener('change', (e) => {
      state.currentOwnership = e.target.value;
      if (state.currentOwnership === 'diff') {
        document.querySelectorAll('.preset-chip').forEach(c => c.classList.toggle('active', c.dataset.preset === 'differential'));
        state.currentPreset = 'differential';
      } else if (state.currentPreset === 'differential') {
        document.querySelectorAll('.preset-chip').forEach(c => c.classList.toggle('active', c.dataset.preset === 'all'));
        state.currentPreset = 'all';
      }
      applyFiltersAndRender();
    });
  }

  // Horizon
  horizonSelect.addEventListener('change', async (e) => {
    state.currentFixtures = parseInt(e.target.value, 10);
    await loadPlayers();
  });

  // Strategy Presets
  document.querySelectorAll('.preset-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.preset-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.currentPreset = chip.dataset.preset;
      applyPreset(chip.dataset.preset);
    });
  });

  // Sorting
  playersTableHeaders.forEach(th => {
    th.addEventListener('click', () => {
      const key = th.dataset.sort;
      if (state.sortKey === key) {
        state.sortAsc = !state.sortAsc;
      } else {
        state.sortKey = key;
        state.sortAsc = false; // Default desc
      }
      updateSortIndicators();
      applyFiltersAndRender();
    });
  });

  // Modal Closures
  modalCloseBtn.addEventListener('click', () => playerModal.close());
  playerModal.addEventListener('click', (e) => {
    if (e.target === playerModal) playerModal.close();
  });

  compareCloseBtn.addEventListener('click', () => compareModal.close());
  closeCompareFooterBtn.addEventListener('click', () => compareModal.close());
  btnCompareOpen.addEventListener('click', openCompareModal);
  clearCompareBtn.addEventListener('click', () => {
    state.compareIds.clear();
    saveCompare();
    updateCompareBadge();
    compareModal.close();
    renderTable();
  });

  // Squad Drawer
  btnSquadOpen.addEventListener('click', () => {
    squadDrawer.classList.toggle('open');
    renderSquadDrawer();
  });
  squadDrawerClose.addEventListener('click', () => squadDrawer.classList.remove('open'));
  btnAutoOptimize.addEventListener('click', handleAutoOptimize);
  btnClearSquad.addEventListener('click', () => {
    state.squad = [];
    saveSquad();
    renderSquadDrawer();
    renderTable();
  });

  // Modal Action Buttons
  modalAddSquadBtn.addEventListener('click', () => {
    if (!state.activePlayer) return;
    toggleSquadPlayer(state.activePlayer);
    updateModalActionButtons();
  });

  modalAddCompareBtn.addEventListener('click', () => {
    if (!state.activePlayer) return;
    toggleComparePlayer(state.activePlayer.id);
    updateModalActionButtons();
  });
}

function updateSortIndicators() {
  playersTableHeaders.forEach(th => {
    th.classList.remove('sorted-asc', 'sorted-desc');
    if (th.dataset.sort === state.sortKey) {
      th.classList.add(state.sortAsc ? 'sorted-asc' : 'sorted-desc');
    }
  });
}

// Preset logic
function applyPreset(preset) {
  if (preset === 'differential') {
    state.currentPos = 'ALL';
    posPills.querySelectorAll('.pill-btn').forEach(b => b.classList.toggle('active', b.dataset.pos === 'ALL'));
    state.currentMaxPrice = 20.0;
    priceSelect.value = '20.0';
    state.currentOwnership = 'diff';
    if (ownershipSelect) ownershipSelect.value = 'diff';
    state.sortKey = 'xp';
    state.sortAsc = false;
  } else if (preset === 'captain') {
    state.currentPos = 'ALL';
    posPills.querySelectorAll('.pill-btn').forEach(b => b.classList.toggle('active', b.dataset.pos === 'ALL'));
    state.currentOwnership = 'all';
    if (ownershipSelect) ownershipSelect.value = 'all';
    state.sortKey = 'ceiling';
    state.sortAsc = false;
  } else if (preset === 'value') {
    state.currentPos = 'ALL';
    posPills.querySelectorAll('.pill-btn').forEach(b => b.classList.toggle('active', b.dataset.pos === 'ALL'));
    state.currentOwnership = 'all';
    if (ownershipSelect) ownershipSelect.value = 'all';
    state.currentMaxPrice = 6.5;
    priceSelect.value = '6.5';
    state.sortKey = 'ppm';
    state.sortAsc = false;
  } else if (preset === 'defcon') {
    state.currentPos = 'ALL';
    posPills.querySelectorAll('.pill-btn').forEach(b => b.classList.toggle('active', b.dataset.pos === 'ALL'));
    state.currentOwnership = 'all';
    if (ownershipSelect) ownershipSelect.value = 'all';
    state.sortKey = 'defcon_prob';
    state.sortAsc = false;
  } else if (preset === 'cleansheet') {
    state.currentPos = 'DEF';
    state.currentOwnership = 'all';
    if (ownershipSelect) ownershipSelect.value = 'all';
    posPills.querySelectorAll('.pill-btn').forEach(b => b.classList.toggle('active', b.dataset.pos === 'DEF'));
    state.sortKey = 'cs_prob';
    state.sortAsc = false;
  } else {
    state.currentPos = 'ALL';
    posPills.querySelectorAll('.pill-btn').forEach(b => b.classList.toggle('active', b.dataset.pos === 'ALL'));
    state.currentOwnership = 'all';
    if (ownershipSelect) ownershipSelect.value = 'all';
    state.currentMaxPrice = 20.0;
    priceSelect.value = '20.0';
    state.sortKey = 'xp';
    state.sortAsc = false;
  }
  updateSortIndicators();
  applyFiltersAndRender();
}

// Filter and Sort
function applyFiltersAndRender() {
  let list = [...state.allPlayers];

  // Position
  if (state.currentPos !== 'ALL') {
    list = list.filter(p => p.position === state.currentPos);
  }

  // Max Price
  if (state.currentMaxPrice < 20.0) {
    list = list.filter(p => p.price <= state.currentMaxPrice);
  }

  // Ownership / Differential Filter
  if (state.currentOwnership === 'diff') {
    list = list.filter(p => (p.selected_by_percent || 0) < 5.0);
  } else if (state.currentOwnership === 'ultra_diff') {
    list = list.filter(p => (p.selected_by_percent || 0) < 2.0);
  } else if (state.currentOwnership === 'template') {
    list = list.filter(p => (p.selected_by_percent || 0) >= 10.0);
  }

  // Search
  if (state.currentSearch) {
    const q = state.currentSearch.trim().toLowerCase();
    list = list.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.full_name.toLowerCase().includes(q) ||
      p.team.toLowerCase().includes(q)
    );
  }

  // Sort
  list.sort((a, b) => {
    let valA = a[state.sortKey];
    let valB = b[state.sortKey];
    if (typeof valA === 'string') {
      return state.sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return state.sortAsc ? (valA - valB) : (valB - valA);
  });

  state.filteredPlayers = list;
  renderTable();
}

// Render Table
function renderTable() {
  if (!state.filteredPlayers.length) {
    playersTableBody.innerHTML = `<tr><td colspan="12" style="text-align:center; color:var(--text-muted); padding:3rem;">No players match current filters.</td></tr>`;
    return;
  }

  const rowsHtml = state.filteredPlayers.slice(0, 100).map(p => {
    const inSquad = state.squad.some(s => s.id === p.id);
    const inCompare = state.compareIds.has(p.id);

    const fixChips = (p.fixtures || []).slice(0, 4).map(f => {
      const fdrClass = `fdr-${f.fdr || 3}`;
      return `<span class="fix-chip ${fdrClass}" title="GW${f.event || ''}: ${f.opponent_name} (FDR ${f.fdr})">${f.opponent}</span>`;
    }).join('');

    const ownPct = p.selected_by_percent !== undefined ? p.selected_by_percent : 0;
    const isDiff = ownPct < 5.0;
    const ownDisplay = isDiff
      ? `<span class="diff-badge" title="Differential asset (&lt;5% ownership)">${ownPct.toFixed(1)}%</span>`
      : `<span class="own-cell ${ownPct >= 20.0 ? 'own-high' : ''}">${ownPct.toFixed(1)}%</span>`;

    return `
      <tr data-id="${p.id}">
        <td>
          <div style="font-weight:700;">${p.name}</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">${p.team}</div>
        </td>
        <td><span class="pos-badge pos-${p.position}">${p.position}</span></td>
        <td style="font-weight:700;">£${p.price.toFixed(1)}m</td>
        <td>${ownDisplay}</td>
        <td><div class="fixtures-cell">${fixChips}</div></td>
        <td><span class="val-xp">${p.xp.toFixed(2)}</span></td>
        <td><span class="val-ppm">${p.ppm.toFixed(2)}</span></td>
        <td><span class="val-range">${p.floor.toFixed(1)}</span></td>
        <td><span class="val-range" style="color:var(--fpl-yellow); font-weight:700;">${p.ceiling.toFixed(1)}</span></td>
        <td>${p.haul_prob.toFixed(1)}%</td>
        <td style="color:${p.defcon_prob > 25 ? 'var(--fpl-cyan)' : 'var(--text-muted)'}; font-weight:${p.defcon_prob > 25 ? '700' : '400'};">${p.defcon_prob.toFixed(1)}%</td>
        <td>
          <div class="action-buttons">
            <button class="btn-icon btn-inspect" title="Run Monte Carlo & Inspect Distribution">📊</button>
            <button class="btn-icon btn-toggle-squad ${inSquad ? 'active' : ''}" title="${inSquad ? 'Remove from squad' : 'Add to squad'}">${inSquad ? '✔' : '+'}</button>
            <button class="btn-icon btn-toggle-compare ${inCompare ? 'active' : ''}" title="${inCompare ? 'Remove from compare' : 'Add to compare'}">⚖️</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  playersTableBody.innerHTML = rowsHtml;

  // Row click events
  playersTableBody.querySelectorAll('tr').forEach(row => {
    const id = parseInt(row.dataset.id, 10);
    const p = state.allPlayers.find(x => x.id === id);
    if (!p) return;

    row.querySelector('.btn-inspect').addEventListener('click', (e) => {
      e.stopPropagation();
      openPlayerModal(p);
    });

    row.querySelector('.btn-toggle-squad').addEventListener('click', (e) => {
      e.stopPropagation();
      toggleSquadPlayer(p);
    });

    row.querySelector('.btn-toggle-compare').addEventListener('click', (e) => {
      e.stopPropagation();
      toggleComparePlayer(p.id);
    });

    row.addEventListener('click', () => openPlayerModal(p));
  });
}

// Update Top KPIs
function updateKPIs() {
  if (!state.allPlayers.length) return;

  const topXp = [...state.allPlayers].sort((a, b) => b.xp - a.xp)[0];
  if (topXp) {
    document.getElementById('kpiTopPlayer').textContent = `${topXp.name} (${topXp.xp.toFixed(1)} xP)`;
    document.getElementById('kpiTopPlayerSub').textContent = `${topXp.team} | £${topXp.price.toFixed(1)}m`;
  }

  const regulars = state.allPlayers.filter(p => p.minutes >= 120 && p.price <= 7.0);
  const topVal = regulars.sort((a, b) => b.ppm - a.ppm)[0] || state.allPlayers[0];
  if (topVal) {
    document.getElementById('kpiTopValue').textContent = `${topVal.name} (${topVal.ppm.toFixed(2)} pts/£m)`;
    document.getElementById('kpiTopValueSub').textContent = `${topVal.position} | £${topVal.price.toFixed(1)}m (${topVal.xp.toFixed(1)} xP)`;
  }

  const topCeil = [...state.allPlayers].sort((a, b) => b.ceiling - a.ceiling)[0];
  if (topCeil) {
    document.getElementById('kpiTopCeiling').textContent = `${topCeil.name} (${topCeil.ceiling.toFixed(1)} pts)`;
    document.getElementById('kpiTopCeilingSub').textContent = `${topCeil.haul_prob.toFixed(0)}% Haul Rate (≥10 pts)`;
  }

  const defs = state.allPlayers.filter(p => p.minutes >= 120 && p.position !== 'GKP');
  const topDefCon = defs.sort((a, b) => b.def_contrib90 - a.def_contrib90)[0];
  if (topDefCon) {
    document.getElementById('kpiTopDefCon').textContent = `${topDefCon.name} (${topDefCon.def_contrib90.toFixed(1)}/90)`;
    document.getElementById('kpiTopDefConSub').textContent = `${topDefCon.defcon_prob.toFixed(0)}% DefCon Hit Rate (+2 pts)`;
  }

  const diffs = state.allPlayers.filter(p => (p.selected_by_percent || 0) < 5.0 && p.start_prob >= 65);
  const topDiff = diffs.sort((a, b) => b.xp - a.xp)[0] || state.allPlayers.filter(p => (p.selected_by_percent || 0) < 5.0).sort((a, b) => b.xp - a.xp)[0];
  if (topDiff && document.getElementById('kpiTopDiff')) {
    document.getElementById('kpiTopDiff').textContent = `${topDiff.name} (${topDiff.xp.toFixed(1)} xP)`;
    document.getElementById('kpiTopDiffSub').textContent = `${topDiff.team} | ${topDiff.selected_by_percent.toFixed(1)}% Own • £${topDiff.price.toFixed(1)}m`;
  }
}

// Open Detailed Simulation Modal
async function openPlayerModal(p) {
  state.activePlayer = p;
  modalPlayerName.textContent = p.full_name;
  modalPlayerPrice.textContent = `£${p.price.toFixed(1)}m`;
  modalPosBadge.textContent = p.position;
  modalPosBadge.className = `pos-badge pos-${p.position}`;

  const ownPct = p.selected_by_percent !== undefined ? p.selected_by_percent : 0;
  const isDiff = ownPct < 5.0;
  const modalPlayerOwn = document.getElementById('modalPlayerOwn');
  if (modalPlayerOwn) {
    modalPlayerOwn.textContent = `${ownPct.toFixed(1)}% Own${isDiff ? ' 🎯' : ''}`;
    modalPlayerOwn.title = isDiff ? 'Differential player with under 5% ownership' : 'FPL ownership percentage';
    modalPlayerOwn.style.background = isDiff ? 'rgba(4, 245, 255, 0.15)' : 'rgba(255, 255, 255, 0.08)';
    modalPlayerOwn.style.color = isDiff ? 'var(--fpl-cyan)' : 'var(--text-main)';
    modalPlayerOwn.style.borderColor = isDiff ? 'rgba(4, 245, 255, 0.35)' : 'var(--border-color)';
  }

  modalPlayerTeamFixture.textContent = `${p.team} • Next: ${p.fixtures?.[0]?.opponent || 'TBD'} • Start: ${p.start_prob}% • Own: ${ownPct.toFixed(1)}%`;

  modalStatXP.textContent = p.xp.toFixed(2);
  modalStatFloor.textContent = p.floor.toFixed(1);
  modalStatMedian.textContent = (p.median !== undefined ? p.median : p.xp).toFixed(1);
  modalStatCeiling.textContent = p.ceiling.toFixed(1);
  modalStatHaul.textContent = `${p.haul_prob.toFixed(1)}%`;
  modalStatDefCon.textContent = `${p.defcon_prob.toFixed(1)}%`;

  // Render fixtures
  modalFixturesList.innerHTML = (p.fixtures || []).map(f => `
    <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-color); border-radius:var(--radius-sm); padding:0.6rem;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.3rem;">
        <span class="fix-chip fdr-${f.fdr}">${f.opponent}</span>
        <span style="font-weight:700; color:var(--fpl-green);">${f.match_xp.toFixed(1)} xP</span>
      </div>
      <div style="font-size:0.7rem; color:var(--text-muted); display:flex; justify-content:space-between;">
        <span>${p.position !== 'FWD' ? `CS: ${f.cs_prob}%` : 'CS: N/A (0 pts)'}</span>
        <span>DefCon: ${f.defcon_prob}%</span>
      </div>
    </div>
  `).join('');

  updateModalActionButtons();
  playerModal.showModal();

  // Show already generated and cached simulation data immediately without rerunning
  if (p.distribution && Object.keys(p.distribution).length > 0) {
    const scores = Object.keys(p.distribution).map(Number).sort((a, b) => a - b);
    const minScore = scores[0];
    const maxScore = scores[scores.length - 1];
    const simsCount = p.simulations || 10000;
    const sigmaText = p.sigma !== undefined ? `Vol: ±${p.sigma.toFixed(2)} pts | ` : '';
    document.getElementById('modalChartSub').textContent = `${sigmaText}Range: ${minScore} - ${maxScore} pts (${simsCount.toLocaleString()} cached simulations)`;
    renderDistributionSVG(svgChartWrapper, p.distribution, p.floor, (p.median !== undefined ? p.median : p.xp), p.ceiling);
  } else {
    // If not already present on p, fetch the precomputed cached record without rerunning
    svgChartWrapper.innerHTML = `<div style="text-align:center; padding:3rem; color:var(--text-muted);">Loading cached simulation data for ${p.name}...</div>`;
    try {
      const res = await fetch(`/api/player/${p.id}/simulate?fixtures=${state.currentFixtures}`);
      const simData = await res.json();
      modalStatXP.textContent = simData.mean_xp.toFixed(2);
      modalStatFloor.textContent = simData.p10.toFixed(1);
      modalStatMedian.textContent = simData.median.toFixed(1);
      modalStatCeiling.textContent = simData.p90.toFixed(1);
      if (simData.haul_rate !== undefined) modalStatHaul.textContent = `${simData.haul_rate.toFixed(1)}%`;
      if (simData.defcon_rate !== undefined) modalStatDefCon.textContent = `${simData.defcon_rate.toFixed(1)}%`;

      document.getElementById('modalChartSub').textContent = `Vol: ±${simData.std_dev.toFixed(2)} pts | Range: ${simData.min} - ${simData.max} pts (${(simData.simulations || 10000).toLocaleString()} cached simulations)`;
      renderDistributionSVG(svgChartWrapper, simData.distribution, simData.p10, simData.median, simData.p90);
      
      p.distribution = simData.distribution;
      p.sigma = simData.std_dev;
      p.median = simData.median;
    } catch (err) {
      console.error('Failed to load cached simulation:', err);
      svgChartWrapper.innerHTML = `<div style="text-align:center; padding:2rem; color:#ff5c85;">Simulation data not available.</div>`;
    }
  }
}

function updateModalActionButtons() {
  if (!state.activePlayer) return;
  const inSquad = state.squad.some(s => s.id === state.activePlayer.id);
  modalAddSquadBtn.textContent = inSquad ? '✔ In My Squad' : '📋 Add to Squad';
  modalAddSquadBtn.className = inSquad ? 'btn btn-secondary' : 'btn btn-primary';

  const inCompare = state.compareIds.has(state.activePlayer.id);
  modalAddCompareBtn.textContent = inCompare ? '✔ In Compare' : '⚖️ Add to Compare';
}

// Render SVG Distribution Chart
function renderDistributionSVG(container, distMap, p10, median, p90) {
  const scores = Object.keys(distMap).map(Number).sort((a, b) => a - b);
  if (!scores.length) return;

  const minScore = Math.min(0, scores[0]);
  const maxScore = Math.max(16, scores[scores.length - 1]);
  const width = container.clientWidth || 700;
  const height = 210;
  const padLeft = 35;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 30;

  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;

  const maxProb = Math.max(...Object.values(distMap), 0.1);

  const numBins = (maxScore - minScore) + 1;
  const barWidth = Math.max(4, (plotWidth / numBins) - 3);

  let barsSvg = '';
  scores.forEach(s => {
    const prob = distMap[s] || 0;
    const x = padLeft + ((s - minScore) / (maxScore - minScore)) * (plotWidth - barWidth);
    const barHeight = (prob / maxProb) * plotHeight;
    const y = padTop + plotHeight - barHeight;

    const isHigh = s >= 10;
    const barColor = isHigh ? 'var(--fpl-pink)' : (s >= 5 ? 'var(--fpl-green)' : 'rgba(255,255,255,0.4)');

    barsSvg += `
      <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="2" fill="${barColor}">
        <title>Score: ${s} pts | Prob: ${(prob * 100).toFixed(1)}%</title>
      </rect>
      <text x="${x + barWidth/2}" y="${height - 12}" text-anchor="middle" fill="var(--text-dim)" font-size="10">${s}</text>
    `;
  });

  // Reference lines for P10, Median, P90
  const getX = (val) => padLeft + ((val - minScore) / (maxScore - minScore)) * (plotWidth - barWidth) + barWidth/2;

  const p10X = getX(p10);
  const medX = getX(median);
  const p90X = getX(p90);

  const refLines = `
    <!-- Floor P10 -->
    <line x1="${p10X}" y1="${padTop}" x2="${p10X}" y2="${padTop + plotHeight}" stroke="#ff5c85" stroke-dasharray="3,3" stroke-width="1.5"></line>
    <text x="${p10X}" y="${padTop - 5}" text-anchor="middle" fill="#ff5c85" font-size="10" font-weight="bold">Floor ${p10}</text>

    <!-- Median P50 -->
    <line x1="${medX}" y1="${padTop}" x2="${medX}" y2="${padTop + plotHeight}" stroke="var(--fpl-green)" stroke-width="2"></line>
    <text x="${medX}" y="${padTop - 5}" text-anchor="middle" fill="var(--fpl-green)" font-size="10" font-weight="bold">Median ${median}</text>

    <!-- Ceiling P90 -->
    <line x1="${p90X}" y1="${padTop}" x2="${p90X}" y2="${padTop + plotHeight}" stroke="var(--fpl-yellow)" stroke-dasharray="3,3" stroke-width="1.5"></line>
    <text x="${p90X}" y="${padTop - 5}" text-anchor="middle" fill="var(--fpl-yellow)" font-size="10" font-weight="bold">Ceiling ${p90}</text>
  `;

  container.innerHTML = `
    <svg width="100%" height="100%" viewBox="0 0 ${width} ${height}">
      ${refLines}
      ${barsSvg}
      <line x1="${padLeft}" y1="${padTop + plotHeight}" x2="${width - padRight}" y2="${padTop + plotHeight}" stroke="var(--border-color)"></line>
    </svg>
  `;
}

// Compare Feature
function toggleComparePlayer(id) {
  if (state.compareIds.has(id)) {
    state.compareIds.delete(id);
  } else {
    if (state.compareIds.size >= 4) {
      alert('You can compare a maximum of 4 players at once.');
      return;
    }
    state.compareIds.add(id);
  }
  saveCompare();
  updateCompareBadge();
  renderTable();
}

function updateCompareBadge() {
  compareBadge.textContent = state.compareIds.size;
}

function saveCompare() {
  localStorage.setItem('fpl_mc_compare', JSON.stringify([...state.compareIds]));
}

async function openCompareModal() {
  if (state.compareIds.size < 2) {
    alert('Select at least 2 players to compare (click ⚖️ icon on players).');
    return;
  }

  showLoading('Simulating head-to-head match distributions...');
  try {
    const ids = [...state.compareIds].join(',');
    const res = await fetch(`/api/compare?ids=${ids}&fixtures=${state.currentFixtures}&sims=10000`);
    const compData = await res.json();

    const compareCards = document.getElementById('compareCards');
    compareCards.innerHTML = compData.players.map(p => `
      <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:1rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
          <h3 style="font-size:1.1rem; font-weight:800;">${p.name}</h3>
          <span class="pos-badge pos-${p.position}">${p.position}</span>
        </div>
        <div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:0.75rem;">Price: £${p.price.toFixed(1)}m • Own: ${(p.selected_by_percent || 0).toFixed(1)}%${(p.selected_by_percent || 0) < 5.0 ? ' 🎯' : ''}</div>
        <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:0.5rem; text-align:center;">
          <div style="background:rgba(0,255,135,0.08); padding:0.4rem; border-radius:4px;">
            <span style="font-size:0.7rem; color:var(--text-muted); display:block;">Mean xP</span>
            <span style="font-weight:800; color:var(--fpl-green);">${p.mean_xp.toFixed(2)}</span>
          </div>
          <div style="background:rgba(255,255,255,0.05); padding:0.4rem; border-radius:4px;">
            <span style="font-size:0.7rem; color:var(--text-muted); display:block;">P10 Floor</span>
            <span style="font-weight:700;">${p.p10.toFixed(1)}</span>
          </div>
          <div style="background:rgba(255,230,0,0.08); padding:0.4rem; border-radius:4px;">
            <span style="font-size:0.7rem; color:var(--text-muted); display:block;">P90 Ceiling</span>
            <span style="font-weight:800; color:var(--fpl-yellow);">${p.p90.toFixed(1)}</span>
          </div>
          <div style="background:rgba(4,245,255,0.08); padding:0.4rem; border-radius:4px;">
            <span style="font-size:0.7rem; color:var(--text-muted); display:block;">xP / £m</span>
            <span style="font-weight:700; color:var(--fpl-cyan);">${p.ppm.toFixed(2)}</span>
          </div>
        </div>
      </div>
    `).join('');

    const h2hMatrix = document.getElementById('h2hMatrix');
    h2hMatrix.innerHTML = compData.head_to_head.map(h => `
      <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); border:1px solid var(--border-color); padding:0.75rem 1rem; border-radius:var(--radius-sm); margin-bottom:0.5rem;">
        <div style="flex:1;">
          <span style="font-weight:700;">${h.player_a}</span>
          <span style="color:var(--fpl-green); font-weight:800; margin-left:0.5rem;">${h.a_win_pct}%</span>
        </div>
        <div style="font-size:0.75rem; color:var(--text-muted); padding:0 1rem;">Tie: ${h.tie_pct}%</div>
        <div style="flex:1; text-align:right;">
          <span style="color:var(--fpl-cyan); font-weight:800; margin-right:0.5rem;">${h.b_win_pct}%</span>
          <span style="font-weight:700;">${h.player_b}</span>
        </div>
      </div>
    `).join('');

    compareModal.showModal();
  } catch (err) {
    console.error('Failed to run comparison:', err);
    alert('Comparison failed.');
  } finally {
    hideLoading();
  }
}

// Squad Feature
function toggleSquadPlayer(p) {
  const idx = state.squad.findIndex(s => s.id === p.id);
  if (idx >= 0) {
    state.squad.splice(idx, 1);
  } else {
    // Check constraints
    const posCount = state.squad.filter(s => s.position === p.position).length;
    const posLimits = { GKP: 2, DEF: 5, MID: 5, FWD: 3 };
    if (posCount >= posLimits[p.position]) {
      alert(`Your squad already has the maximum of ${posLimits[p.position]} ${p.position}s.`);
      return;
    }
    const teamCount = state.squad.filter(s => s.team === p.team).length;
    if (teamCount >= 3) {
      alert(`You can select at most 3 players from ${p.team}.`);
      return;
    }
    const currentCost = state.squad.reduce((sum, s) => sum + s.price, 0);
    if (currentCost + p.price > 100.0) {
      alert(`Adding ${p.name} (£${p.price}m) exceeds the £100.0m budget.`);
      return;
    }
    state.squad.push(p);
  }
  saveSquad();
  updateSquadBadge();
  renderSquadDrawer();
  renderTable();
}

function updateSquadBadge() {
  squadBadge.textContent = `${state.squad.length}/15`;
}

function saveSquad() {
  localStorage.setItem('fpl_mc_squad', JSON.stringify(state.squad));
}

function renderSquadDrawer() {
  const currentCost = state.squad.reduce((sum, s) => sum + s.price, 0);
  const bank = Math.max(0, 100.0 - currentCost);

  document.getElementById('squadCostDisplay').textContent = `£${currentCost.toFixed(1)}m / £100.0m`;
  document.getElementById('squadBankDisplay').textContent = `£${bank.toFixed(1)}m`;

  const posTargets = { GKP: 2, DEF: 5, MID: 5, FWD: 3 };
  ['GKP', 'DEF', 'MID', 'FWD'].forEach(pos => {
    const list = state.squad.filter(s => s.position === pos);
    document.getElementById(`count${pos}`).textContent = list.length;
    const container = document.getElementById(`slots${pos}`);

    let slotsHtml = '';
    for (let i = 0; i < posTargets[pos]; i++) {
      const p = list[i];
      if (p) {
        slotsHtml += `
          <div class="squad-slot-item filled">
            <div>
              <span style="font-weight:700;">${p.name}</span>
              <span style="font-size:0.75rem; color:var(--text-muted); margin-left:0.4rem;">${p.team}</span>
            </div>
            <div style="display:flex; align-items:center; gap:0.6rem;">
              <span style="font-weight:700; color:var(--fpl-green);">${p.xp.toFixed(1)} xP</span>
              <span style="font-size:0.75rem;">£${p.price.toFixed(1)}m</span>
              <button class="remove-slot-btn" data-id="${p.id}" title="Remove">&times;</button>
            </div>
          </div>
        `;
      } else {
        slotsHtml += `
          <div class="squad-slot-item">
            <span style="color:var(--text-dim);">Empty ${pos} Slot</span>
            <span style="font-size:0.75rem; color:var(--text-dim);">+ Add from table</span>
          </div>
        `;
      }
    }
    container.innerHTML = slotsHtml;

    container.querySelectorAll('.remove-slot-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id, 10);
        state.squad = state.squad.filter(s => s.id !== id);
        saveSquad();
        updateSquadBadge();
        renderSquadDrawer();
        renderTable();
      });
    });
  });

  // Calculate Starting XI & Total Points if squad is full or partial
  const totalXp = state.squad.reduce((sum, s) => sum + s.xp, 0);
  document.getElementById('squadTotalXpDisplay').textContent = `${totalXp.toFixed(1)} pts`;
}

// Auto-Optimize Squad
async function handleAutoOptimize() {
  showLoading('Solving optimal 15-player squad and formation under £100m budget...');
  try {
    const lockedIds = state.squad.map(s => s.id);
    const res = await fetch('/api/optimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        budget: 100.0,
        locked_ids: lockedIds,
        excluded_ids: [],
        objective: 'xp',
        fixtures: state.currentFixtures
      })
    });
    const result = await res.json();
    state.squad = result.squad;
    saveSquad();
    updateSquadBadge();
    renderSquadDrawer();
    renderTable();

    if (result.starting_xi) {
      document.getElementById('squadFormationDisplay').textContent = `Formation: ${result.starting_xi.formation} (C: ${result.starting_xi.captain?.name || '-'})`;
    }
  } catch (err) {
    console.error('Failed to optimize squad:', err);
    alert('Squad optimization failed.');
  } finally {
    hideLoading();
  }
}

// Start
init();
