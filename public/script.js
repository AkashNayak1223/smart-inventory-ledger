/**
 * LEDGER.OS - Minimalist / Fintech CRUD Application
 * Connects with Express REST API endpoints:
 *   GET    /items     - Retrieve all items
 *   POST   /items     - Create a new item
 *   PUT    /items/:id - Update item
 *   DELETE /items/:id - Delete item
 */

// Global State
let rawItems = [];
let isEditing = false;
let pendingDeleteId = null;

// DOM Elements
const itemForm = document.getElementById('item-form');
const itemIdInput = document.getElementById('item-id');
const itemNameInput = document.getElementById('item-name');
const itemPriceInput = document.getElementById('item-price');
const submitBtn = document.getElementById('submit-btn');
const submitBtnText = document.getElementById('submit-btn-text');
const cancelBtn = document.getElementById('cancel-btn');
const formHeading = document.getElementById('form-heading');
const formDesc = document.getElementById('form-desc');
const modeBadge = document.getElementById('mode-badge');

const itemsTbody = document.getElementById('items-tbody');
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search-btn');
const sortSelect = document.getElementById('sort-select');
const itemCountBadge = document.getElementById('item-count-badge');
const refreshBtn = document.getElementById('refresh-btn');
const tableStatusText = document.getElementById('table-status-text');

// KPI Metric Elements
const statTotalItems = document.getElementById('stat-total-items');
const statTotalValue = document.getElementById('stat-total-value');
const statAvgPrice = document.getElementById('stat-avg-price');

// Modal Elements
const deleteModal = document.getElementById('delete-modal');
const deleteItemTitle = document.getElementById('delete-item-title');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');

// Toast Container
const toastContainer = document.getElementById('toast-container');

/* ============================================================
   1. DATA FETCHING (GET /items)
   ============================================================ */
async function fetchItems() {
  try {
    tableStatusText.textContent = 'Syncing data...';
    const response = await fetch('/items');
    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`);
    }
    rawItems = await response.json();
    renderWorkspace();
    tableStatusText.textContent = `Synchronized at ${new Date().toLocaleTimeString()}`;
  } catch (error) {
    console.error('Fetch error:', error);
    showToast('Failed to connect to backend server', 'error');
    tableStatusText.textContent = 'Sync failed. Server unreachable.';
    itemsTbody.innerHTML = `
      <tr>
        <td colspan="4" class="empty-state">
          <div class="empty-state-icon">!</div>
          <div class="empty-state-title">Backend Unreachable</div>
          <div class="empty-state-desc">Make sure Express server is running on port 3000.</div>
        </td>
      </tr>
    `;
  }
}

/* ============================================================
   2. RENDERING PIPELINE (SEARCH + SORT + METRICS + TABLE)
   ============================================================ */
function renderWorkspace() {
  updateMetrics(rawItems);

  const query = searchInput.value.trim().toLowerCase();
  clearSearchBtn.style.display = query ? 'flex' : 'none';

  // Filter items
  let processedItems = rawItems.filter(item => {
    if (!query) return true;
    const matchesName = item.name.toLowerCase().includes(query);
    const matchesPrice = item.price.toString().includes(query);
    return matchesName || matchesPrice;
  });

  // Sort items
  const sortOption = sortSelect.value;
  processedItems.sort((a, b) => {
    switch (sortOption) {
      case 'id-asc':
        return a.id - b.id;
      case 'id-desc':
        return b.id - a.id;
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;
      case 'name-asc':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  // Update item count badge
  if (query) {
    itemCountBadge.textContent = `${processedItems.length} of ${rawItems.length} matched`;
  } else {
    itemCountBadge.textContent = `${rawItems.length} items`;
  }

  // Render Table Rows
  renderTable(processedItems);
}

function updateMetrics(items) {
  const count = items.length;
  const total = items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  const avg = count > 0 ? total / count : 0;

  statTotalItems.textContent = count.toLocaleString();
  statTotalValue.textContent = formatCurrency(total);
  statAvgPrice.textContent = formatCurrency(avg);
}

function renderTable(items) {
  itemsTbody.innerHTML = '';

  if (items.length === 0) {
    const isSearching = searchInput.value.trim().length > 0;
    itemsTbody.innerHTML = `
      <tr>
        <td colspan="4" class="empty-state">
          <div class="empty-state-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
          </div>
          <div class="empty-state-title">${isSearching ? 'No Matching Records' : 'Ledger is Empty'}</div>
          <div class="empty-state-desc">${isSearching ? 'Try modifying your search keywords or clear the filter.' : 'Create your first inventory entry using the panel on the left.'}</div>
        </td>
      </tr>
    `;
    return;
  }

  items.forEach((item) => {
    const isCurrentEditing = isEditing && itemIdInput.value == item.id;
    const row = document.createElement('tr');
    if (isCurrentEditing) {
      row.classList.add('row-editing');
    }

    row.innerHTML = `
      <td class="cell-seq">#${String(item.id).padStart(2, '0')}</td>
      <td class="cell-name">${escapeHtml(item.name)}</td>
      <td class="cell-price">${formatCurrency(item.price)}</td>
      <td class="cell-actions">
        <div class="action-btns">
          <button 
            type="button" 
            class="btn-icon-sm" 
            title="Edit Item" 
            onclick="handleEdit(${item.id}, '${escapeQuotes(item.name)}', ${item.price})">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
          </button>
          <button 
            type="button" 
            class="btn-icon-sm delete-btn" 
            title="Delete Item" 
            onclick="promptDelete(${item.id}, '${escapeQuotes(item.name)}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </td>
    `;

    itemsTbody.appendChild(row);
  });
}

/* ============================================================
   3. FORM SUBMISSION (CREATE or UPDATE)
   ============================================================ */
itemForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = itemNameInput.value.trim();
  const price = parseFloat(itemPriceInput.value);

  if (!name || isNaN(price) || price < 0) {
    showToast('Please provide a valid item name and non-negative price', 'error');
    return;
  }

  submitBtn.disabled = true;
  submitBtnText.textContent = isEditing ? 'Saving...' : 'Adding...';

  try {
    if (isEditing) {
      // UPDATE: PUT /items/:id
      const id = itemIdInput.value;
      const res = await fetch(`/items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, price })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update item.');
      }

      showToast(`Updated "${name}" successfully`, 'success');
    } else {
      // CREATE: POST /items
      const res = await fetch('/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, price })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create item.');
      }

      showToast(`Added "${name}" to ledger`, 'success');
    }

    resetForm();
    await fetchItems();
  } catch (err) {
    console.error('Submission error:', err);
    showToast(err.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtnText.textContent = isEditing ? 'Update Record' : 'Add Item';
  }
});

/* ============================================================
   4. EDIT MODE
   ============================================================ */
window.handleEdit = function(id, name, price) {
  isEditing = true;
  itemIdInput.value = id;
  itemNameInput.value = name;
  itemPriceInput.value = price;

  formHeading.textContent = `Edit Record #${id}`;
  formDesc.textContent = `Modifying properties for "${name}".`;
  modeBadge.textContent = 'UPDATE';
  modeBadge.classList.add('editing');

  submitBtnText.textContent = 'Update Record';
  cancelBtn.style.display = 'inline-flex';

  itemNameInput.focus();
  renderWorkspace();
};

cancelBtn.addEventListener('click', resetForm);

function resetForm() {
  itemForm.reset();
  itemIdInput.value = '';
  isEditing = false;

  formHeading.textContent = 'New Record';
  formDesc.textContent = 'Add a new item to the in-memory database.';
  modeBadge.textContent = 'CREATE';
  modeBadge.classList.remove('editing');

  submitBtnText.textContent = 'Add Item';
  cancelBtn.style.display = 'none';

  renderWorkspace();
}

/* ============================================================
   5. DELETE MODAL & CONFIRMATION (DELETE /items/:id)
   ============================================================ */
window.promptDelete = function(id, name) {
  pendingDeleteId = id;
  deleteItemTitle.textContent = `"${name}" (#${id})`;
  deleteModal.style.display = 'flex';
};

cancelDeleteBtn.addEventListener('click', () => {
  deleteModal.style.display = 'none';
  pendingDeleteId = null;
});

confirmDeleteBtn.addEventListener('click', async () => {
  if (!pendingDeleteId) return;

  const id = pendingDeleteId;
  confirmDeleteBtn.disabled = true;
  confirmDeleteBtn.textContent = 'Deleting...';

  try {
    const res = await fetch(`/items/${id}`, {
      method: 'DELETE'
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete record.');
    }

    showToast('Record removed and serial numbers re-indexed', 'success');

    if (isEditing && itemIdInput.value == id) {
      resetForm();
    }

    deleteModal.style.display = 'none';
    pendingDeleteId = null;
    await fetchItems();
  } catch (err) {
    console.error('Delete error:', err);
    showToast(err.message, 'error');
  } finally {
    confirmDeleteBtn.disabled = false;
    confirmDeleteBtn.textContent = 'Confirm Delete';
  }
});

// Close modal on backdrop click
deleteModal.addEventListener('click', (e) => {
  if (e.target === deleteModal) {
    deleteModal.style.display = 'none';
    pendingDeleteId = null;
  }
});

/* ============================================================
   6. SEARCH & FILTER LISTENERS
   ============================================================ */
searchInput.addEventListener('input', () => {
  renderWorkspace();
});

clearSearchBtn.addEventListener('click', () => {
  searchInput.value = '';
  searchInput.focus();
  renderWorkspace();
});

sortSelect.addEventListener('change', () => {
  renderWorkspace();
});

refreshBtn.addEventListener('click', () => {
  fetchItems();
});

// Global Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (deleteModal.style.display === 'flex') {
      deleteModal.style.display = 'none';
      pendingDeleteId = null;
    } else if (isEditing) {
      resetForm();
    }
  }
});

/* ============================================================
   7. UTILITIES & TOAST
   ============================================================ */
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function escapeQuotes(text) {
  return text.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type === 'error' ? 'toast-error' : type === 'success' ? 'toast-success' : ''}`;
  toast.textContent = message;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => {
      toast.remove();
    }, 200);
  }, 3200);
}

// Initial bootstrap
document.addEventListener('DOMContentLoaded', fetchItems);
