/**
 * Fare Calculator (حاسبة أجرة المواصلات)
 * 100% Offline, Pure Vanilla JS, No Dependencies
 */

(function () {
  'use strict';

  // State
  let state = {
    fare: '', // Single fare per person
    theme: localStorage.getItem('app_theme') || 'emerald',
    darkMode: localStorage.getItem('app_dark_mode') === 'true',
    confirmReset: localStorage.getItem('app_confirm_reset') !== 'false',
    groups: [
      { id: generateId(), people: '', received: '' }
    ]
  };

  // Helper ID generator
  function generateId() {
    return 'grp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  }

  // DOM Elements
  const fareInput = document.getElementById('fareInput');
  const groupsContainer = document.getElementById('groupsContainer');
  const groupsCountBadge = document.getElementById('groupsCountBadge');
  const grandTotalCard = document.getElementById('grandTotalCard');
  const grandTotalValue = document.getElementById('grandTotalValue');
  const addPersonBtn = document.getElementById('addPersonBtn');

  // Toolbar buttons
  const barResetBtn = document.getElementById('barResetBtn');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const barAddBtn = document.getElementById('barAddBtn');
  const darkModeBtn = document.getElementById('darkModeBtn');
  const settingsBtn = document.getElementById('settingsBtn');

  // Drawer Elements
  const menuBtn = document.getElementById('menuBtn');
  const quickHelpBtn = document.getElementById('quickHelpBtn');
  const sideDrawer = document.getElementById('sideDrawer');
  const drawerOverlay = document.getElementById('drawerOverlay');
  const closeDrawerBtn = document.getElementById('closeDrawerBtn');
  const confirmResetToggle = document.getElementById('confirmResetToggle');
  const shareAppBtn = document.getElementById('shareAppBtn');

  // Popover Elements
  const calcPopover = document.getElementById('calcPopover');
  const popoverBody = document.getElementById('popoverBody');
  const closePopoverBtn = document.getElementById('closePopoverBtn');

  /* ==========================================================================
     Initialization
     ========================================================================== */
  function init() {
    applyTheme();
    confirmResetToggle.checked = state.confirmReset;
    bindEvents();
    render();
  }

  /* ==========================================================================
     Theme & Display
     ========================================================================== */
  function applyTheme() {
    document.body.setAttribute('data-theme', state.theme);
    if (state.darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }

    // Update theme pill in settings
    document.querySelectorAll('.theme-pill').forEach(pill => {
      pill.classList.toggle('active', pill.getAttribute('data-pick-theme') === state.theme);
    });

    localStorage.setItem('app_theme', state.theme);
    localStorage.setItem('app_dark_mode', state.darkMode);
  }

  function toggleTheme() {
    state.theme = state.theme === 'emerald' ? 'ocean' : 'emerald';
    applyTheme();
  }

  function toggleDarkMode() {
    state.darkMode = !state.darkMode;
    applyTheme();
  }

  /* ==========================================================================
     Event Binding
     ========================================================================== */
  function bindEvents() {
    // Fare Input
    fareInput.addEventListener('input', (e) => {
      state.fare = e.target.value.trim();
      updateClearBtnVisibility(e.target);
      calculateAndRenderLive();
    });

    // Top clear buttons
    document.addEventListener('click', (e) => {
      const clearBtn = e.target.closest('.clear-input-btn');
      if (clearBtn) {
        const targetId = clearBtn.getAttribute('data-target');
        const inputEl = document.getElementById(targetId);
        if (inputEl) {
          inputEl.value = '';
          clearBtn.classList.remove('visible');
          
          if (targetId === 'fareInput') {
            state.fare = '';
            calculateAndRenderLive();
          } else if (targetId.startsWith('people_')) {
            const grpId = targetId.replace('people_', '');
            const grp = state.groups.find(g => g.id === grpId);
            if (grp) grp.people = '';
            calculateAndRenderLive();
          } else if (targetId.startsWith('received_')) {
            const grpId = targetId.replace('received_', '');
            const grp = state.groups.find(g => g.id === grpId);
            if (grp) grp.received = '';
            calculateAndRenderLive();
          }
        }
      }
    });

    // Add person / group
    addPersonBtn.addEventListener('click', addGroup);
    barAddBtn.addEventListener('click', addGroup);

    // Toolbar Reset
    barResetBtn.addEventListener('click', handleReset);

    // Toolbar Themes & Settings
    themeToggleBtn.addEventListener('click', toggleTheme);
    darkModeBtn.addEventListener('click', toggleDarkMode);
    settingsBtn.addEventListener('click', () => {
      openDrawer();
      // Scroll to or open settings accordion
      const accordions = document.querySelectorAll('.accordion-item');
      if (accordions[3]) {
        accordions.forEach(a => a.classList.remove('active'));
        accordions[3].classList.add('active');
      }
    });

    // Drawer events
    menuBtn.addEventListener('click', openDrawer);
    quickHelpBtn.addEventListener('click', () => {
      openDrawer();
      const accordions = document.querySelectorAll('.accordion-item');
      if (accordions[1]) {
        accordions.forEach(a => a.classList.remove('active'));
        accordions[1].classList.add('active');
      }
    });
    closeDrawerBtn.addEventListener('click', closeDrawer);
    drawerOverlay.addEventListener('click', closeDrawer);

    // Accordions toggle
    document.querySelectorAll('.accordion-header').forEach(header => {
      header.addEventListener('click', () => {
        const item = header.parentElement;
        const wasActive = item.classList.contains('active');
        document.querySelectorAll('.accordion-item').forEach(i => i.classList.remove('active'));
        if (!wasActive) item.classList.add('active');
      });
    });

    // Confirm reset setting toggle
    confirmResetToggle.addEventListener('change', (e) => {
      state.confirmReset = e.target.checked;
      localStorage.setItem('app_confirm_reset', state.confirmReset);
    });

    // Theme Picker in Settings
    document.querySelectorAll('.theme-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        state.theme = pill.getAttribute('data-pick-theme');
        applyTheme();
      });
    });

    // Popover Close
    closePopoverBtn.addEventListener('click', closePopover);
    calcPopover.addEventListener('click', (e) => {
      if (e.target === calcPopover) closePopover();
    });

    // Share button
    if (shareAppBtn) {
      shareAppBtn.addEventListener('click', () => {
        if (navigator.share) {
          navigator.share({
            title: 'حاسبة أجرة المواصلات',
            text: 'تطبيق خفيف وسريع لحساب أجرة المواصلات بدون إنترنت',
            url: window.location.href
          }).catch(() => {});
        } else {
          alert('شارك التطبيق مع أصدقائك وسائقي الأجرة!');
        }
      });
    }
  }

  function updateClearBtnVisibility(input) {
    const clearBtn = input.parentElement.querySelector('.clear-input-btn');
    if (clearBtn) {
      if (input.value && input.value.trim().length > 0) {
        clearBtn.classList.add('visible');
      } else {
        clearBtn.classList.remove('visible');
      }
    }
  }

  /* ==========================================================================
     Drawer Management
     ========================================================================== */
  function openDrawer() {
    sideDrawer.classList.add('active');
    drawerOverlay.classList.add('active');
  }

  function closeDrawer() {
    sideDrawer.classList.remove('active');
    drawerOverlay.classList.remove('active');
  }

  /* ==========================================================================
     Group Logic & Calculation
     ========================================================================== */
  function addGroup() {
    state.groups.push({
      id: generateId(),
      people: '',
      received: ''
    });
    render();
    // Scroll to the newly added group smoothly
    setTimeout(() => {
      const cards = groupsContainer.querySelectorAll('.group-card');
      if (cards.length > 0) {
        cards[cards.length - 1].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        // Focus first input of new group
        const firstInput = cards[cards.length - 1].querySelector('input');
        if (firstInput) firstInput.focus();
      }
    }, 50);
  }

  function deleteGroup(groupId) {
    if (state.groups.length === 1) {
      // Deleting the only group resets it instead of removing it
      state.groups[0].people = '';
      state.groups[0].received = '';
    } else {
      state.groups = state.groups.filter(g => g.id !== groupId);
    }
    render();
  }

  function handleReset() {
    if (state.confirmReset) {
      if (!confirm('هل أنت متأكد من تصفير جميع البيانات والبدء من جديد؟')) {
        return;
      }
    }
    state.fare = '';
    fareInput.value = '';
    fareInput.parentElement.querySelector('.clear-input-btn').classList.remove('visible');
    state.groups = [
      { id: generateId(), people: '', received: '' }
    ];
    render();
  }

  /* ==========================================================================
     Render Application UI
     ========================================================================== */
  function render() {
    // Update Groups Count Badge
    const count = state.groups.length;
    groupsCountBadge.textContent = count === 1 ? '1 مجموعة' : (count === 2 ? 'مجموعتان' : `${count} مجموعات`);

    // Render Group Cards
    groupsContainer.innerHTML = '';
    state.groups.forEach((group, index) => {
      const card = createGroupCard(group, index + 1);
      groupsContainer.appendChild(card);
    });

    calculateAndRenderLive();
  }

  function createGroupCard(group, groupNumber) {
    const card = document.createElement('div');
    card.className = 'group-card';
    card.id = `card_${group.id}`;

    card.innerHTML = `
      <div class="group-header">
        <div class="group-title-tag">
          <i class="fa-solid fa-user-group"></i>
          <span>مجموعة #${groupNumber}</span>
        </div>
        <button type="button" class="btn-delete-group" data-group-id="${group.id}" title="حذف / تصفير المجموعة">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>

      <div class="group-inputs-grid">
        <div class="field-group">
          <label for="people_${group.id}">
            <i class="fa-solid fa-users"></i>
            <span>عدد الأفراد</span>
          </label>
          <div class="input-wrapper">
            <input type="number" id="people_${group.id}" class="custom-input" inputmode="numeric" placeholder="0" min="1" step="1" value="${escapeHtml(group.people)}">
            <button type="button" class="clear-input-btn ${group.people ? 'visible' : ''}" data-target="people_${group.id}" title="مسح">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        <div class="field-group">
          <label for="received_${group.id}">
            <i class="fa-solid fa-hand-holding-dollar"></i>
            <span>المبلغ المستلم</span>
          </label>
          <div class="input-wrapper">
            <input type="number" id="received_${group.id}" class="custom-input" inputmode="decimal" placeholder="0.00" min="0" step="any" value="${escapeHtml(group.received)}">
            <button type="button" class="clear-input-btn ${group.received ? 'visible' : ''}" data-target="received_${group.id}" title="مسح">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>
      </div>

      <div id="results_${group.id}" class="group-results-box">
        <!-- Live calculated results injected here -->
      </div>
    `;

    // Bind Group Inputs
    const pInput = card.querySelector(`#people_${group.id}`);
    const rInput = card.querySelector(`#received_${group.id}`);

    pInput.addEventListener('input', (e) => {
      group.people = e.target.value.trim();
      updateClearBtnVisibility(e.target);
      calculateAndRenderLive();
    });

    rInput.addEventListener('input', (e) => {
      group.received = e.target.value.trim();
      updateClearBtnVisibility(e.target);
      calculateAndRenderLive();
    });

    // Bind Delete Button
    card.querySelector('.btn-delete-group').addEventListener('click', () => {
      deleteGroup(group.id);
    });

    return card;
  }

  /* ==========================================================================
     Real-Time Calculations & Grand Total
     ========================================================================== */
  function calculateAndRenderLive() {
    const fareVal = parseFloat(state.fare);
    const isFareValid = !isNaN(fareVal) && fareVal > 0;

    let grandTotalRemaining = 0;
    let hasAtLeastOneRemaining = false;

    state.groups.forEach((group) => {
      const resultsContainer = document.getElementById(`results_${group.id}`);
      if (!resultsContainer) return;

      const peopleNum = parseInt(group.people, 10);
      const isPeopleValid = !isNaN(peopleNum) && peopleNum > 0;

      const receivedNum = parseFloat(group.received);
      const isReceivedValid = !isNaN(receivedNum) && group.received.length > 0;

      let html = '';

      // 1. driverTotal = fare * people (shown only when fare and people are both filled)
      if (isFareValid && isPeopleValid) {
        const driverTotal = fareVal * peopleNum;
        const driverTotalFormatted = formatNumber(driverTotal);

        html += `
          <div class="calc-row-card driver-total">
            <div class="calc-label-with-action">
              <span>إجمالي السائق المطلوب:</span>
              <button type="button" class="calc-help-btn" data-calc-type="driverTotal" data-fare="${fareVal}" data-people="${peopleNum}" data-total="${driverTotal}" title="شرح طريقة الحساب">
                <i class="fa-solid fa-calculator"></i>
              </button>
            </div>
            <div>
              <bdi dir="ltr">${driverTotalFormatted}</bdi> ج.م
            </div>
          </div>
        `;

        // 2. remaining = received - driverTotal (shown only when received is also filled, updates live)
        if (isReceivedValid) {
          const remaining = receivedNum - driverTotal;
          const isNegative = remaining < 0;
          const remainingFormatted = formatNumber(Math.abs(remaining));
          
          grandTotalRemaining += remaining;
          hasAtLeastOneRemaining = true;

          if (isNegative) {
            // Negative remaining: red with warning "المبلغ غير كاف"
            html += `
              <div class="calc-row-card remaining-negative">
                <div class="calc-label-with-action">
                  <span>المبلغ الناقص:</span>
                  <button type="button" class="calc-help-btn" data-calc-type="remaining" data-received="${receivedNum}" data-drivertotal="${driverTotal}" data-remaining="${remaining}" title="شرح طريقة الحساب">
                    <i class="fa-solid fa-calculator"></i>
                  </button>
                </div>
                <div>
                  <bdi dir="ltr">-${remainingFormatted}</bdi> ج.م
                </div>
              </div>
              <div class="warning-line">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <span>تنبيه: المبلغ غير كافٍ (ناقص <bdi dir="ltr">${remainingFormatted}</bdi> ج.م)</span>
              </div>
            `;
          } else {
            // Positive or zero remaining: green
            html += `
              <div class="calc-row-card remaining-positive">
                <div class="calc-label-with-action">
                  <span>الباقي المستحق للراكب:</span>
                  <button type="button" class="calc-help-btn" data-calc-type="remaining" data-received="${receivedNum}" data-drivertotal="${driverTotal}" data-remaining="${remaining}" title="شرح طريقة الحساب">
                    <i class="fa-solid fa-calculator"></i>
                  </button>
                </div>
                <div>
                  <bdi dir="ltr">${remainingFormatted}</bdi> ج.م
                </div>
              </div>
            `;
          }
        }
      }

      resultsContainer.innerHTML = html;
    });

    // Grand total of remaining across all groups, shown when at least one remaining exists
    if (hasAtLeastOneRemaining) {
      grandTotalCard.classList.remove('hidden');
      const isGrandNegative = grandTotalRemaining < 0;
      const formattedGT = (isGrandNegative ? '-' : '') + formatNumber(Math.abs(grandTotalRemaining));
      grandTotalValue.innerHTML = `<bdi dir="ltr">${formattedGT}</bdi>`;
      grandTotalValue.style.color = isGrandNegative ? '#f87171' : '#38bdf8';
    } else {
      grandTotalCard.classList.add('hidden');
    }

    // Attach click handlers to new popover help buttons
    document.querySelectorAll('.calc-help-btn').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        openPopover(btn);
      };
    });
  }

  /* ==========================================================================
     Popover Math Explanation
     ========================================================================== */
  function openPopover(button) {
    const calcType = button.getAttribute('data-calc-type');
    let contentHtml = '';

    if (calcType === 'driverTotal') {
      const fare = button.getAttribute('data-fare');
      const people = button.getAttribute('data-people');
      const total = button.getAttribute('data-total');

      contentHtml = `
        <div class="calc-step-card">
          <strong>طريقة حساب إجمالي السائق:</strong>
          <span>سعر الفرد (<bdi dir="ltr">${fare}</bdi> ج.م) × عدد الأفراد (<bdi dir="ltr">${people}</bdi>)</span>
        </div>
        <div class="calc-step-card">
          <strong>النتيجة:</strong>
          <span><bdi dir="ltr">${fare} × ${people} = ${formatNumber(total)}</bdi> ج.م</span>
        </div>
      `;
    } else if (calcType === 'remaining') {
      const received = parseFloat(button.getAttribute('data-received'));
      const driverTotal = parseFloat(button.getAttribute('data-drivertotal'));
      const remaining = parseFloat(button.getAttribute('data-remaining'));
      const isNeg = remaining < 0;

      contentHtml = `
        <div class="calc-step-card">
          <strong>معادلة الباقي:</strong>
          <span>المبلغ المستلم (<bdi dir="ltr">${formatNumber(received)}</bdi>) - المطلوب للسائق (<bdi dir="ltr">${formatNumber(driverTotal)}</bdi>)</span>
        </div>
        <div class="calc-step-card">
          <strong>النتيجة النهائية:</strong>
          <span><bdi dir="ltr">${formatNumber(received)} - ${formatNumber(driverTotal)} = ${formatNumber(remaining)}</bdi> ج.م</span>
        </div>
        <p class="text-muted-custom mt-2">
          ${isNeg ? 'المبلغ المستلم أقل من المطلوب، لذلك يظهر باللون الأحمر مع التحذير.' : 'المبلغ كافٍ، وهذا هو المبلغ الواجب رده للراكب.'}
        </p>
      `;
    }

    popoverBody.innerHTML = contentHtml;
    calcPopover.classList.remove('hidden');
  }

  function closePopover() {
    calcPopover.classList.add('hidden');
  }

  /* ==========================================================================
     Utility Helpers
     ========================================================================== */
  function formatNumber(val) {
    const num = parseFloat(val);
    if (isNaN(num)) return '0.00';
    // Format to max 2 decimal places, trimming unnecessary zeros
    return Number.isInteger(num) ? num.toString() : num.toFixed(2).replace(/\.?0+$/, '');
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.toString()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Initialize once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
