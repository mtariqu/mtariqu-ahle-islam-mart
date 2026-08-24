import { db, getDocs, collection } from './firebase-config.js';
import { renderProductGrid, CATEGORIES, initActiveNavigation, initGlobalHeaderAndFooter } from './app.js';
import { SAMPLE_PRODUCTS } from './seed-data.js';

let allTrendingProducts = [];
let filteredTrendingProducts = [];
let currentCategoryFilter = 'all';

document.addEventListener('DOMContentLoaded', async () => {
  await initGlobalHeaderAndFooter();
  
  const urlParams = new URLSearchParams(window.location.search);
  const categoryParam = urlParams.get('category')?.toLowerCase();
  if (categoryParam) {
    currentCategoryFilter = categoryParam;
    updateActiveFilterPill(categoryParam);
  }

  await loadTrendingProducts();

  // Hook up Category Filter Pills
  const filterPills = document.querySelectorAll('.trending-filter-btn');
  filterPills.forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.getAttribute('data-category');
      currentCategoryFilter = cat || 'all';
      
      // Update UI active state
      filterPills.forEach(b => {
        b.classList.remove('bg-emerald-600', 'text-white', 'font-bold', 'active');
        b.classList.add('bg-gray-100', 'text-gray-700', 'font-medium');
      });
      btn.classList.remove('bg-gray-100', 'text-gray-700', 'font-medium');
      btn.classList.add('bg-emerald-600', 'text-white', 'font-bold', 'active');

      applyTrendingFilters();
    });
  });

  // Hook up In-Page Live Search
  const searchInput = document.getElementById('trending-filter-search');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      applyTrendingFilters();
    });
  }

  // Hook up Sort Dropdown
  const sortSelect = document.getElementById('sort-trending-products');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      sortAndRenderTrendingProducts(e.target.value);
    });
  }
});

function updateActiveFilterPill(categorySlug) {
  const filterPills = document.querySelectorAll('.trending-filter-btn');
  filterPills.forEach(b => {
    if (b.getAttribute('data-category') === categorySlug) {
      b.classList.remove('bg-gray-100', 'text-gray-700', 'font-medium');
      b.classList.add('bg-emerald-600', 'text-white', 'font-bold', 'active');
    } else {
      b.classList.remove('bg-emerald-600', 'text-white', 'font-bold', 'active');
      b.classList.add('bg-gray-100', 'text-gray-700', 'font-medium');
    }
  });
}

async function loadTrendingProducts() {
  const container = document.getElementById('trending-products-grid');
  const countBadge = document.getElementById('trending-total-count');
  if (!container) return;

  try {
    const snapshot = await getDocs(collection(db, 'products'));
    let products = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(p => p.status === 'published');

    if (products.length === 0) {
      products = SAMPLE_PRODUCTS.map((p, idx) => ({ id: `sample-${idx}`, ...p }));
    }

    // Strictly filter for Trending Products
    let trendingList = products.filter(p => p.isTrending === true || p.isTrending === 'true' || p.isTrending === 1);
    if (trendingList.length === 0) {
      trendingList = products.filter(p => p.isFeatured || (p.rating && p.rating >= 4.7));
    }

    allTrendingProducts = trendingList;
    if (countBadge) {
      countBadge.textContent = allTrendingProducts.length;
    }

    applyTrendingFilters();
  } catch (err) {
    console.error('Error fetching trending products:', err);
    const sampleList = SAMPLE_PRODUCTS.map((p, idx) => ({ id: `sample-${idx}`, ...p }));
    const sampleTrending = sampleList.filter(p => p.isTrending === true || p.isTrending === 'true');
    allTrendingProducts = sampleTrending.length > 0 ? sampleTrending : sampleList;
    if (countBadge) {
      countBadge.textContent = allTrendingProducts.length;
    }
    applyTrendingFilters();
  }
}

function applyTrendingFilters() {
  const container = document.getElementById('trending-products-grid');
  const searchInput = document.getElementById('trending-filter-search');
  const sortSelect = document.getElementById('sort-trending-products');
  const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

  let list = [...allTrendingProducts];

  // Apply Category Filter
  if (currentCategoryFilter && currentCategoryFilter !== 'all') {
    list = list.filter(p => p.category?.toLowerCase() === currentCategoryFilter.toLowerCase());
  }

  // Apply Search Query
  if (query) {
    list = list.filter(p => 
      (p.name && p.name.toLowerCase().includes(query)) ||
      (p.category && p.category.toLowerCase().includes(query)) ||
      (p.shortDescription && p.shortDescription.toLowerCase().includes(query)) ||
      (p.description && p.description.toLowerCase().includes(query)) ||
      (p.price && p.price.toLowerCase().includes(query))
    );
  }

  filteredTrendingProducts = list;

  const currentSort = sortSelect ? sortSelect.value : 'name-asc';
  sortAndRenderTrendingProducts(currentSort);
}

function sortAndRenderTrendingProducts(sortType) {
  const container = document.getElementById('trending-products-grid');
  if (!container) return;

  let sorted = [...filteredTrendingProducts];

  const parsePrice = (priceStr) => {
    if (!priceStr) return 0;
    return parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;
  };

  switch (sortType) {
    case 'name-asc':
      sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      break;
    case 'name-desc':
      sorted.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
      break;
    case 'price-low':
      sorted.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
      break;
    case 'price-high':
      sorted.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
      break;
    default:
      sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      break;
  }

  if (sorted.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center text-gray-400 bg-white rounded-2xl border border-gray-200 p-8">
        <span class="text-4xl block mb-2">🔍</span>
        <h3 class="text-base font-bold text-gray-700">No trending products found</h3>
        <p class="text-xs text-gray-400 mt-1">Try changing your search term or selecting another category filter.</p>
        <button 
          type="button" 
          onclick="window.location.href='trending.html'" 
          class="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors"
        >
          Reset All Filters
        </button>
      </div>
    `;
    return;
  }

  renderProductGrid(sorted, container);
}

function initTrendingNavbar() {
  const menuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }
}

function initTrendingSearchHeader() {
  const searchInput = document.getElementById('header-search');
  const searchResults = document.getElementById('search-results-overlay');
  
  if (searchInput && searchResults) {
    let debounceTimeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimeout);
      const val = e.target.value.trim().toLowerCase();
      if (val.length < 2) {
        searchResults.classList.add('hidden');
        return;
      }
      
      debounceTimeout = setTimeout(async () => {
        try {
          const snapshot = await getDocs(collection(db, 'products'));
          const products = snapshot.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(p => p.status === 'published' && (
              p.name.toLowerCase().includes(val) || 
              p.category.toLowerCase().includes(val) ||
              (p.shortDescription && p.shortDescription.toLowerCase().includes(val))
            ));
            
          if (products.length === 0) {
            searchResults.innerHTML = `<div class="p-4 text-gray-500 text-sm text-center">No products found matching your search.</div>`;
            searchResults.classList.remove('hidden');
            return;
          }
          
          searchResults.innerHTML = products.slice(0, 6).map(p => `
            <a href="product.html?id=${p.id}" class="flex items-center gap-3 p-3 hover:bg-emerald-50 transition-colors border-b border-gray-100 last:border-0">
              <img src="${(p.images && p.images[0]) ? p.images[0] : 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=800&q=80'}" onerror="this.onerror=null; this.src='/ahle_islam_mart_logo.png';" alt="${p.name}" class="w-12 h-12 object-cover rounded shrink-0 bg-gray-100" loading="lazy" />
              <div class="flex-1 min-w-0">
                <h4 class="text-sm font-semibold text-gray-800 truncate">${p.name}</h4>
                <span class="text-xs text-emerald-600 font-medium capitalize">${p.category}</span>
              </div>
              <span class="text-sm font-bold text-gray-900">${p.price}</span>
            </a>
          `).join('');
          searchResults.classList.remove('hidden');
        } catch (err) {
          console.error('Search error:', err);
        }
      }, 300);
    });

    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
        searchResults.classList.add('hidden');
      }
    });
  }
}
