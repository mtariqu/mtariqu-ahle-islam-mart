// Admin Dashboard Controller (Directory, Pagination, Status Toggles, Contact Inquiries, Cloudinary)

import { 
  db, 
  collection, 
  getDocs, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp 
} from './firebase-config.js';
import { requireAdminAuth, logoutAdmin } from './auth.js';
import { SAMPLE_PRODUCTS } from './seed-data.js';

let allAdminProducts = [];
let allAdminMessages = [];
let currentPage = 1;
let itemsPerPage = 25;

// Toast notification function
function showToast(message, type = 'success') {
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  const bgClass = type === 'success' ? 'bg-emerald-900/95 text-white border-emerald-600 shadow-emerald-950/20' :
                  type === 'error' ? 'bg-rose-900/95 text-white border-rose-600 shadow-rose-950/20' :
                  'bg-gray-900/95 text-white border-gray-700 shadow-black/20';
  
  const icon = type === 'success' ? `
    <svg class="w-5 h-5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
  ` : type === 'error' ? `
    <svg class="w-5 h-5 text-rose-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
  ` : `
    <svg class="w-5 h-5 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
  `;

  toast.className = `pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl text-xs sm:text-sm font-semibold transform transition-all duration-300 opacity-0 translate-y-3 ${bgClass}`;
  toast.innerHTML = `
    ${icon}
    <div class="flex-1 leading-snug">${message}</div>
    <button type="button" class="text-gray-400 hover:text-white transition-colors p-1" onclick="this.parentElement.remove()">
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
    </button>
  `;

  toastContainer.appendChild(toast);
  requestAnimationFrame(() => {
    toast.classList.remove('opacity-0', 'translate-y-3');
  });

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-3');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
window.showToast = showToast;

// Cloudinary Config Keys
const CLOUDINARY_CLOUD_KEY = 'tariqu_cloudinary_cloud_name';
const CLOUDINARY_PRESET_KEY = 'tariqu_cloudinary_preset';

document.addEventListener('DOMContentLoaded', () => {
  requireAdminAuth((user) => {
    const emailEl = document.getElementById('admin-user-email');
    if (emailEl) emailEl.textContent = user.email || 'Admin';

    initAdminEvents();
    initTabNavigation();
    initPaginationControls();
    loadDashboardProducts();
    loadDashboardMessages();
    loadCloudinarySettings();
  });
});

function initAdminEvents() {
  // Logout
  const logoutBtn = document.getElementById('admin-logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', logoutAdmin);

  // Seed Sample Data Button
  const seedBtn = document.getElementById('seed-data-btn');
  if (seedBtn) seedBtn.addEventListener('click', handleSeedSampleData);

  // Add Product Button -> Redirects to dedicated page
  const addBtn = document.getElementById('open-add-product-btn');
  if (addBtn) addBtn.addEventListener('click', () => {
    window.location.href = 'admin-product.html';
  });

  // Filter & Search
  const searchInput = document.getElementById('admin-search-input');
  const statusFilter = document.getElementById('admin-status-filter');
  const categoryFilter = document.getElementById('admin-category-filter');

  if (searchInput) searchInput.addEventListener('input', () => { currentPage = 1; filterAndRenderAdminTable(); });
  if (statusFilter) statusFilter.addEventListener('change', () => { currentPage = 1; filterAndRenderAdminTable(); });
  if (categoryFilter) categoryFilter.addEventListener('change', () => { currentPage = 1; filterAndRenderAdminTable(); });

  // Delete Confirmation Modal Controls
  const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
  const confirmDeleteBtn = document.getElementById('confirm-delete-action-btn');
  const deleteModal = document.getElementById('delete-confirm-modal');

  if (cancelDeleteBtn && deleteModal) {
    cancelDeleteBtn.addEventListener('click', () => {
      deleteModal.classList.add('hidden');
      pendingDeleteProductId = null;
    });
  }

  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', () => {
      if (pendingDeleteProductId) {
        executeDeleteProduct(pendingDeleteProductId);
      }
    });
  }

  if (deleteModal) {
    deleteModal.addEventListener('click', (e) => {
      if (e.target === deleteModal) {
        deleteModal.classList.add('hidden');
        pendingDeleteProductId = null;
      }
    });
  }

  // Cloudinary Settings Modal
  const settingsBtn = document.getElementById('open-cloudinary-settings');
  const settingsModal = document.getElementById('cloudinary-modal');
  const closeSettingsBtn = document.getElementById('close-cloudinary-modal');
  const saveSettingsForm = document.getElementById('cloudinary-form');

  if (settingsBtn && settingsModal) settingsBtn.addEventListener('click', () => settingsModal.classList.remove('hidden'));
  if (closeSettingsBtn && settingsModal) closeSettingsBtn.addEventListener('click', () => settingsModal.classList.add('hidden'));
  if (saveSettingsForm) saveSettingsForm.addEventListener('submit', saveCloudinarySettings);

  // Contact Messages Search & Filter
  const msgSearchInput = document.getElementById('admin-msg-search');
  const msgStatusFilter = document.getElementById('admin-msg-filter');
  if (msgSearchInput) msgSearchInput.addEventListener('input', renderMessagesTable);
  if (msgStatusFilter) msgStatusFilter.addEventListener('change', renderMessagesTable);

  // Contact Reply Modal Controls
  const closeReplyBtn = document.getElementById('close-reply-modal');
  const cancelReplyBtn = document.getElementById('cancel-reply-btn');
  const replyForm = document.getElementById('reply-form');
  if (closeReplyBtn) closeReplyBtn.addEventListener('click', closeMessageModal);
  if (cancelReplyBtn) cancelReplyBtn.addEventListener('click', closeMessageModal);
  if (replyForm) replyForm.addEventListener('submit', handleReplySubmit);
}

function initTabNavigation() {
  const tabProdBtn = document.getElementById('tab-products-btn');
  const tabMsgBtn = document.getElementById('tab-messages-btn');
  const prodView = document.getElementById('admin-products-view');
  const msgView = document.getElementById('admin-messages-view');

  if (tabProdBtn && tabMsgBtn && prodView && msgView) {
    tabProdBtn.addEventListener('click', () => {
      tabProdBtn.className = 'px-4 py-2 rounded-lg font-bold text-xs bg-emerald-600 text-white shadow-xs transition-colors flex items-center gap-1.5';
      tabMsgBtn.className = 'px-4 py-2 rounded-lg font-bold text-xs bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 transition-colors flex items-center gap-1.5 relative';
      prodView.classList.remove('hidden');
      msgView.classList.add('hidden');
    });

    tabMsgBtn.addEventListener('click', () => {
      tabMsgBtn.className = 'px-4 py-2 rounded-lg font-bold text-xs bg-emerald-600 text-white shadow-xs transition-colors flex items-center gap-1.5 relative';
      tabProdBtn.className = 'px-4 py-2 rounded-lg font-bold text-xs bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 transition-colors flex items-center gap-1.5';
      msgView.classList.remove('hidden');
      prodView.classList.add('hidden');
      renderMessagesTable();
    });
  }
}

function initPaginationControls() {
  const perPageSelect = document.getElementById('admin-per-page');
  const prevBtn = document.getElementById('admin-prev-page-btn');
  const nextBtn = document.getElementById('admin-next-page-btn');

  if (perPageSelect) {
    perPageSelect.addEventListener('change', (e) => {
      itemsPerPage = parseInt(e.target.value, 10) || 25;
      currentPage = 1;
      filterAndRenderAdminTable();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        filterAndRenderAdminTable();
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      currentPage++;
      filterAndRenderAdminTable();
    });
  }
}

function getProductTimestamp(p) {
  // Prioritize createdAt (latest added product on top), fallback to updatedAt
  const t = p.createdAt || p.updatedAt;
  if (!t) return 0;
  if (typeof t.toMillis === 'function') return t.toMillis();
  if (typeof t.toDate === 'function') return t.toDate().getTime();
  if (t.seconds) return t.seconds * 1000 + ((t.nanoseconds || 0) / 1000000);
  if (typeof t === 'number') return t;
  const parsed = new Date(t).getTime();
  return isNaN(parsed) ? 0 : parsed;
}

async function loadDashboardProducts() {
  const tbody = document.getElementById('admin-products-tbody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="6" class="py-8 text-center text-gray-500">Loading products...</td></tr>`;

  try {
    const deletedIds = JSON.parse(localStorage.getItem('tariqu_deleted_product_ids') || '[]');
    const snapshot = await getDocs(collection(db, 'products'));
    allAdminProducts = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    // Filter out any locally marked deleted IDs
    if (deletedIds && deletedIds.length > 0) {
      allAdminProducts = allAdminProducts.filter(p => !deletedIds.includes(p.id));
    }

    // Sort strictly so the latest added product is displayed at the top
    allAdminProducts.sort((a, b) => {
      const timeA = getProductTimestamp(a);
      const timeB = getProductTimestamp(b);
      if (timeB !== timeA) return timeB - timeA;
      return (b.id || '').localeCompare(a.id || '');
    });

    updateKPIs(allAdminProducts);
    filterAndRenderAdminTable();
  } catch (err) {
    console.warn('Firestore offline/connection notice:', err);
    allAdminProducts = [];
    updateKPIs(allAdminProducts);
    filterAndRenderAdminTable();
  }
}

function updateKPIs(products) {
  const totalEl = document.getElementById('kpi-total');
  const pubEl = document.getElementById('kpi-published');
  const draftEl = document.getElementById('kpi-drafts');

  const total = products.length;
  const published = products.filter(p => p.status === 'published').length;
  const drafts = products.filter(p => p.status === 'draft').length;

  if (totalEl) totalEl.textContent = total;
  if (pubEl) pubEl.textContent = published;
  if (draftEl) draftEl.textContent = drafts;
}

function filterAndRenderAdminTable() {
  const tbody = document.getElementById('admin-products-tbody');
  if (!tbody) return;

  const searchVal = document.getElementById('admin-search-input')?.value.toLowerCase().trim() || '';
  const statusVal = document.getElementById('admin-status-filter')?.value || 'all';
  const categoryVal = document.getElementById('admin-category-filter')?.value || 'all';

  const filtered = allAdminProducts.filter(p => {
    const matchSearch = p.name?.toLowerCase().includes(searchVal) || p.category?.toLowerCase().includes(searchVal);
    const matchStatus = statusVal === 'all' || 
                        (statusVal === 'trending' ? (p.isTrending || p.isFeatured) : p.status === statusVal);
    const matchCategory = categoryVal === 'all' || p.category === categoryVal;
    return matchSearch && matchStatus && matchCategory;
  });

  const totalFiltered = filtered.length;
  const totalPages = Math.ceil(totalFiltered / itemsPerPage) || 1;

  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filtered.slice(startIndex, startIndex + itemsPerPage);

  // Update Pagination Controls UI
  const totalEl = document.getElementById('admin-pagination-total');
  const pageIndicator = document.getElementById('admin-page-indicator');
  const prevBtn = document.getElementById('admin-prev-page-btn');
  const nextBtn = document.getElementById('admin-next-page-btn');

  if (totalEl) {
    const endDisplay = Math.min(startIndex + itemsPerPage, totalFiltered);
    totalEl.textContent = `Showing ${totalFiltered > 0 ? startIndex + 1 : 0}-${endDisplay} of ${totalFiltered} products`;
  }
  if (pageIndicator) pageIndicator.textContent = `Page ${currentPage} of ${totalPages}`;
  if (prevBtn) prevBtn.disabled = currentPage <= 1;
  if (nextBtn) nextBtn.disabled = currentPage >= totalPages;

  if (paginatedItems.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="py-12 text-center text-gray-500">
          <p class="font-medium text-gray-700">No matching products found</p>
          <p class="text-xs text-gray-400 mt-1">Try adjusting your search filters or click "+ ADD PRODUCT".</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = paginatedItems.map(p => {
    const img = (p.images && p.images.length > 0) ? p.images[0] : 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=800&q=80';
    const isPub = p.status === 'published';
    const isTrend = !!(p.isTrending || p.isFeatured);

    return `
      <tr class="border-b border-gray-100 hover:bg-gray-50/80 transition-colors text-xs sm:text-sm">
        <td class="py-3 px-4">
          <div class="flex items-center gap-3">
            <img src="${img}" onerror="this.onerror=null; this.src='/apna_mart_logo.png';" alt="${escapeHtml(p.name)}" class="w-12 h-12 object-cover rounded-lg border border-gray-200 shrink-0 bg-gray-100" />
            <div class="min-w-0">
              <a href="admin-product.html?id=${p.id}" class="font-bold text-gray-900 hover:text-emerald-700 truncate max-w-xs block transition-colors">${escapeHtml(p.name)}</a>
              <p class="text-[10px] text-gray-400 font-mono">ID: ${p.id}</p>
            </div>
          </div>
        </td>

        <td class="py-3 px-4">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
            ${escapeHtml(p.category || '')}
          </span>
        </td>

        <td class="py-3 px-4 font-bold text-gray-900">
          ${escapeHtml(p.price || '₹0')}
          ${p.oldPrice ? `<span class="text-xs text-gray-400 font-normal line-through ml-1">${escapeHtml(p.oldPrice)}</span>` : ''}
        </td>

        <!-- Trending Column -->
        <td class="py-3 px-4">
          <button 
            type="button" 
            onclick="toggleTrendingStatus('${p.id}', ${isTrend})"
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${isTrend ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 shadow-2xs' : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'} transition-all cursor-pointer"
            title="Click to toggle Trending status"
          >
            ${isTrend ? '🔥 Yes' : '☆ No'}
          </button>
        </td>

        <!-- Status Column -->
        <td class="py-3 px-4">
          <button 
            type="button" 
            onclick="toggleProductStatus('${p.id}', '${p.status}')"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${isPub ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'} transition-colors cursor-pointer"
          >
            <span class="w-2 h-2 rounded-full ${isPub ? 'bg-emerald-500' : 'bg-amber-500'}"></span>
            ${isPub ? 'Published' : 'Draft'}
          </button>
        </td>

        <!-- Actions -->
        <td class="py-3 px-4 text-right">
          <div class="flex items-center justify-end gap-2">
            <a 
              href="admin-product.html?id=${p.id}"
              class="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer" 
              title="Edit Product"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            </a>

            <button 
              type="button" 
              onclick="confirmDeleteProduct('${p.id}')"
              class="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer" 
              title="Delete Product"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function escapeHtml(str) {
  if (!str) return '';
  return str.toString()
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

window.toggleTrendingStatus = async function(id, currentStatus) {
  const newStatus = !currentStatus;
  try {
    await updateDoc(doc(db, 'products', id), {
      isTrending: newStatus,
      isFeatured: newStatus,
      updatedAt: serverTimestamp()
    });

    const item = allAdminProducts.find(p => p.id === id);
    if (item) {
      item.isTrending = newStatus;
      item.isFeatured = newStatus;
    }
    filterAndRenderAdminTable();
    showToast(`Trending status updated to ${newStatus ? 'Active 🔥' : 'Standard'}`);
  } catch (err) {
    console.error('Error updating trending status:', err);
    showToast('Failed to update trending status', 'error');
  }
};

window.toggleProductStatus = async function(id, currentStatus) {
  const newStatus = currentStatus === 'published' ? 'draft' : 'published';
  try {
    await updateDoc(doc(db, 'products', id), {
      status: newStatus,
      updatedAt: serverTimestamp()
    });

    const item = allAdminProducts.find(p => p.id === id);
    if (item) item.status = newStatus;
    updateKPIs(allAdminProducts);
    filterAndRenderAdminTable();
    showToast(`Product status set to ${newStatus.toUpperCase()}`);
  } catch (err) {
    console.error('Error updating product status:', err);
    showToast('Failed to update product status', 'error');
  }
};

let pendingDeleteProductId = null;

window.confirmDeleteProduct = function(id) {
  const prod = allAdminProducts.find(p => p.id === id);
  const prodName = prod ? prod.name : 'this product';
  pendingDeleteProductId = id;

  const modal = document.getElementById('delete-confirm-modal');
  const msgEl = document.getElementById('delete-confirm-message');
  if (msgEl) {
    msgEl.innerHTML = `Are you sure you want to permanently delete <strong>"${escapeHtml(prodName)}"</strong> from your store?`;
  }
  if (modal) {
    modal.classList.remove('hidden');
  } else {
    // Fallback if modal container not present
    executeDeleteProduct(id);
  }
};

async function executeDeleteProduct(id) {
  if (!id) return;
  const modal = document.getElementById('delete-confirm-modal');
  if (modal) modal.classList.add('hidden');

  try {
    showToast('Deleting product...', 'info');

    // 1. Delete from Firestore if it's a Firestore document
    if (id && !id.startsWith('sample-')) {
      await deleteDoc(doc(db, 'products', id));
    }

    // 2. Track deleted ID in localStorage so sample or offline items stay deleted
    const deletedIds = JSON.parse(localStorage.getItem('tariqu_deleted_product_ids') || '[]');
    if (!deletedIds.includes(id)) {
      deletedIds.push(id);
      localStorage.setItem('tariqu_deleted_product_ids', JSON.stringify(deletedIds));
    }

    // 3. Remove from memory and re-render
    allAdminProducts = allAdminProducts.filter(p => p.id !== id);
    updateKPIs(allAdminProducts);
    filterAndRenderAdminTable();
    showToast('Product deleted successfully');
  } catch (err) {
    console.error('Error deleting product:', err);
    // If Firestore fails, ensure local persistence still removes it
    const deletedIds = JSON.parse(localStorage.getItem('tariqu_deleted_product_ids') || '[]');
    if (!deletedIds.includes(id)) {
      deletedIds.push(id);
      localStorage.setItem('tariqu_deleted_product_ids', JSON.stringify(deletedIds));
    }
    allAdminProducts = allAdminProducts.filter(p => p.id !== id);
    updateKPIs(allAdminProducts);
    filterAndRenderAdminTable();
    showToast('Product deleted locally', 'info');
  } finally {
    pendingDeleteProductId = null;
  }
}

// Seed 25 Sample Products
async function handleSeedSampleData() {
  const btn = document.getElementById('seed-data-btn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = '🌱 Seeding Catalog...';
  }

  showToast('Seeding 25 sample products to Firestore...', 'info');

  try {
    // Clear any deleted sample tracking on fresh seed
    localStorage.removeItem('tariqu_deleted_product_ids');

    let count = 0;
    for (const prod of SAMPLE_PRODUCTS) {
      await addDoc(collection(db, 'products'), {
        ...prod,
        status: 'published',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      count++;
    }

    showToast(`Successfully seeded ${count} sample products!`);
    await loadDashboardProducts();
  } catch (err) {
    console.error('Error seeding data:', err);
    showToast(`Seeding failed: ${err.message}`, 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<span>🌱 Seed Sample Data</span>';
    }
  }
}

// Contact Messages Controller
async function loadDashboardMessages() {
  try {
    const snapshot = await getDocs(collection(db, 'contact_messages'));
    allAdminMessages = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    
    // Sort latest first
    allAdminMessages.sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    const unreadCount = allAdminMessages.filter(m => !m.status || m.status === 'unread').length;
    const badge = document.getElementById('unread-count-badge');
    if (badge) {
      if (unreadCount > 0) {
        badge.textContent = unreadCount.toString();
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }

    renderMessagesTable();
  } catch (err) {
    console.error('Error loading contact messages:', err);
  }
}

function renderMessagesTable() {
  const tbody = document.getElementById('admin-messages-tbody');
  if (!tbody) return;

  const searchVal = document.getElementById('admin-msg-search')?.value.toLowerCase().trim() || '';
  const filterVal = document.getElementById('admin-msg-filter')?.value || 'all';

  const filtered = allAdminMessages.filter(m => {
    const matchSearch = (m.name || '').toLowerCase().includes(searchVal) ||
                        (m.email || '').toLowerCase().includes(searchVal) ||
                        (m.subject || '').toLowerCase().includes(searchVal) ||
                        (m.message || '').toLowerCase().includes(searchVal);
    
    const isUnread = !m.status || m.status === 'unread';
    const isReplied = m.status === 'replied';

    const matchFilter = filterVal === 'all' ||
                        (filterVal === 'unread' && isUnread) ||
                        (filterVal === 'replied' && isReplied);

    return matchSearch && matchFilter;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="py-12 text-center text-gray-500">
          <p class="font-medium text-gray-700">No contact messages found</p>
          <p class="text-xs text-gray-400 mt-1">Customer inquiries submitted through contact form will appear here.</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(m => {
    const isUnread = !m.status || m.status === 'unread';
    const dateStr = m.createdAt ? new Date(m.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent';

    return `
      <tr class="border-b border-gray-100 hover:bg-gray-50/80 transition-colors ${isUnread ? 'bg-emerald-50/20 font-semibold' : ''}">
        <td class="py-3 px-4">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full ${isUnread ? 'bg-rose-500 animate-pulse' : 'bg-gray-300'}"></span>
            <div>
              <p class="text-gray-900 font-bold">${escapeHtml(m.name || 'Anonymous')}</p>
              <p class="text-gray-400 text-[11px] font-mono">${escapeHtml(m.email || '')}</p>
            </div>
          </div>
        </td>

        <td class="py-3 px-4">
          <p class="text-gray-900 font-medium truncate max-w-xs">${escapeHtml(m.subject || 'Inquiry')}</p>
          <p class="text-gray-500 text-[11px] truncate max-w-sm">${escapeHtml(m.message || '')}</p>
        </td>

        <td class="py-3 px-4 text-gray-500 font-mono text-[11px] whitespace-nowrap">
          ${dateStr}
        </td>

        <td class="py-3 px-4">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${isUnread ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}">
            ${isUnread ? 'Unread' : 'Replied'}
          </span>
        </td>

        <td class="py-3 px-4 text-right">
          <button 
            type="button" 
            onclick="openMessageModal('${m.id}')"
            class="bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            View / Reply
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

let activeMessage = null;

window.openMessageModal = function(id) {
  activeMessage = allAdminMessages.find(m => m.id === id);
  if (!activeMessage) return;

  const modal = document.getElementById('contact-reply-modal');
  const content = document.getElementById('reply-modal-content');
  const replyTextarea = document.getElementById('reply-textarea');

  if (content) {
    content.innerHTML = `
      <div class="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2 text-xs">
        <div class="flex items-center justify-between border-b border-gray-200 pb-2">
          <div>
            <span class="text-gray-400">From:</span> <strong>${escapeHtml(activeMessage.name)}</strong> (${escapeHtml(activeMessage.email)})
          </div>
          <span class="text-gray-400 font-mono">${activeMessage.createdAt ? new Date(activeMessage.createdAt).toLocaleString() : ''}</span>
        </div>
        <div>
          <span class="text-gray-400">Subject:</span> <strong class="text-gray-900">${escapeHtml(activeMessage.subject)}</strong>
        </div>
        <div class="pt-2 text-gray-800 leading-relaxed whitespace-pre-wrap">
          ${escapeHtml(activeMessage.message)}
        </div>
      </div>
    `;
  }

  if (replyTextarea) {
    replyTextarea.value = `Dear ${activeMessage.name},\n\nThank you for reaching out to Apna Mart.\n\n\nBest regards,\nApna Mart Support Team`;
  }

  if (modal) modal.classList.remove('hidden');
};

function closeMessageModal() {
  const modal = document.getElementById('contact-reply-modal');
  if (modal) modal.classList.add('hidden');
  activeMessage = null;
}

async function handleReplySubmit(e) {
  e.preventDefault();
  if (!activeMessage) return;

  const replyText = document.getElementById('reply-textarea')?.value.trim();
  if (!replyText) {
    showToast('Please enter your reply message', 'error');
    return;
  }

  try {
    // Update message status to replied in Firestore
    await updateDoc(doc(db, 'contact_messages', activeMessage.id), {
      status: 'replied',
      repliedAt: serverTimestamp(),
      lastReply: replyText
    });

    activeMessage.status = 'replied';
    showToast('Inquiry marked as replied! Opening email client...');

    // Open mailto to customer email with prefilled subject and body
    const mailto = `mailto:${encodeURIComponent(activeMessage.email)}?subject=${encodeURIComponent('Re: ' + activeMessage.subject)}&body=${encodeURIComponent(replyText)}`;
    window.location.href = mailto;

    closeMessageModal();
    loadDashboardMessages();
  } catch (err) {
    console.error('Error replying to message:', err);
    showToast('Failed to update message status', 'error');
  }
}

// Cloudinary Configuration
function loadCloudinarySettings() {
  const cloud = localStorage.getItem(CLOUDINARY_CLOUD_KEY) || '';
  const preset = localStorage.getItem(CLOUDINARY_PRESET_KEY) || '';

  const cloudInput = document.getElementById('c-cloud-name');
  const presetInput = document.getElementById('c-upload-preset');

  if (cloudInput) cloudInput.value = cloud;
  if (presetInput) presetInput.value = preset;
}

function saveCloudinarySettings(e) {
  e.preventDefault();
  const cloud = document.getElementById('c-cloud-name')?.value.trim() || '';
  const preset = document.getElementById('c-upload-preset')?.value.trim() || '';

  localStorage.setItem(CLOUDINARY_CLOUD_KEY, cloud);
  localStorage.setItem(CLOUDINARY_PRESET_KEY, preset);

  const modal = document.getElementById('cloudinary-modal');
  if (modal) modal.classList.add('hidden');

  showToast('Cloudinary credentials saved locally');
}

window.testCloudinaryConnection = async function() {
  const cloud = document.getElementById('c-cloud-name')?.value.trim();
  const preset = document.getElementById('c-upload-preset')?.value.trim();
  const resBox = document.getElementById('cloudinary-test-result');

  if (!cloud || !preset) {
    showToast('Please enter both Cloud Name and Preset', 'error');
    return;
  }

  if (resBox) {
    resBox.className = 'text-xs text-blue-700 bg-blue-50 p-2.5 rounded-lg border border-blue-200';
    resBox.textContent = 'Testing Cloudinary API connection...';
    resBox.classList.remove('hidden');
  }

  try {
    const testCanvas = document.createElement('canvas');
    testCanvas.width = 1;
    testCanvas.height = 1;
    const blob = await new Promise(r => testCanvas.toBlob(r, 'image/png'));

    const formData = new FormData();
    formData.append('file', blob);
    formData.append('upload_preset', preset);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    if (data.secure_url) {
      if (resBox) {
        resBox.className = 'text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200';
        resBox.textContent = '✅ Cloudinary Connection Successful! Uploads are active.';
      }
      showToast('Cloudinary connected successfully!');
    } else {
      throw new Error(data.error?.message || 'Preset not unsigned or incorrect cloud name');
    }
  } catch (err) {
    console.error('Cloudinary connection test failed:', err);
    if (resBox) {
      resBox.className = 'text-xs text-rose-800 bg-rose-50 p-2.5 rounded-lg border border-rose-200';
      resBox.textContent = `❌ Test Failed: ${err.message}`;
    }
    showToast('Cloudinary test failed. Verify settings.', 'error');
  }
};
