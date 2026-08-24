// Centralized Reusable Header, Footer & Global Component System

import { db, collection, getDocs } from './firebase-config.js';

let headerHTMLCache = null;
let footerHTMLCache = null;

// Dynamic loader for header.html and footer.html
export async function loadComponent(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    return await response.text();
  } catch (err) {
    console.warn(`Dynamic component fetch failed for ${url}:`, err);
    return null;
  }
}

export async function initGlobalHeaderAndFooter() {
  const headerContainer = document.getElementById('global-header');
  const footerContainer = document.getElementById('global-footer');

  // Load Header if container is empty or needs dynamic content
  if (headerContainer && headerContainer.children.length === 0) {
    if (!headerHTMLCache) {
      headerHTMLCache = await loadComponent('/header.html');
    }
    if (headerHTMLCache) {
      headerContainer.innerHTML = headerHTMLCache;
    }
  }

  // Load Footer if container is empty or needs dynamic content
  if (footerContainer && footerContainer.children.length === 0) {
    if (!footerHTMLCache) {
      footerHTMLCache = await loadComponent('/footer.html');
    }
    if (footerHTMLCache) {
      footerContainer.innerHTML = footerHTMLCache;
    }
  }

  // Initialize interactive controls
  initNavbarControls();
  initHeaderSearch();
  initActiveNavigation();

  // Dynamic Year in footer
  const yearEl = document.getElementById('global-footer-year') || document.getElementById('current-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear().toString();
  }
}

// Mobile Menu Toggle
export function initNavbarControls() {
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const iconOpen = document.getElementById('menu-icon-open');
  const iconClose = document.getElementById('menu-icon-close');

  if (mobileMenuBtn && mobileMenu) {
    // Remove existing listener to avoid double-attachment
    const newBtn = mobileMenuBtn.cloneNode(true);
    mobileMenuBtn.parentNode.replaceChild(newBtn, mobileMenuBtn);

    newBtn.addEventListener('click', () => {
      const isExpanded = !mobileMenu.classList.contains('hidden');
      if (isExpanded) {
        mobileMenu.classList.add('hidden');
        if (iconOpen) iconOpen.classList.remove('hidden');
        if (iconClose) iconClose.classList.add('hidden');
      } else {
        mobileMenu.classList.remove('hidden');
        if (iconOpen) iconOpen.classList.add('hidden');
        if (iconClose) iconClose.classList.remove('hidden');
      }
    });
  }
}

// Header Live Search with Firestore Integration
export function initHeaderSearch() {
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
              p.name?.toLowerCase().includes(val) || 
              p.category?.toLowerCase().includes(val) ||
              (p.shortDescription && p.shortDescription.toLowerCase().includes(val))
            ));

          if (products.length === 0) {
            searchResults.innerHTML = `<div class="p-4 text-gray-500 text-sm text-center">No products found matching your search.</div>`;
            searchResults.classList.remove('hidden');
            return;
          }

          searchResults.innerHTML = products.slice(0, 6).map(p => `
            <a href="product.html?id=${p.id}" class="flex items-center gap-3 p-3 hover:bg-emerald-50 transition-colors border-b border-gray-100 last:border-0">
              <img 
                src="${(p.images && p.images[0]) ? p.images[0] : 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=800&q=80'}" 
                onerror="this.onerror=null; this.src='/ahle_islam_mart_logo.png';" 
                alt="${p.name}" 
                class="w-12 h-12 object-cover rounded shrink-0 bg-gray-100" 
                loading="lazy" 
              />
              <div class="flex-1 min-w-0">
                <h4 class="text-sm font-semibold text-gray-800 truncate">${p.name}</h4>
                <span class="text-xs text-emerald-600 font-medium capitalize">${p.category}</span>
              </div>
              <span class="text-sm font-bold text-gray-900">${p.price}</span>
            </a>
          `).join('');
          searchResults.classList.remove('hidden');
        } catch (err) {
          console.error('Search query error:', err);
        }
      }, 300);
    });

    // Close search overlay when clicking outside
    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
        searchResults.classList.add('hidden');
      }
    });
  }
}

// Active Nav Link Highlighting
export function initActiveNavigation() {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const urlParams = new URLSearchParams(window.location.search);
  const currentCategory = urlParams.get('category');
  const isAllCategories = urlParams.get('view') === 'all';

  // Desktop & Mobile Navigation Links
  const headerLinks = document.querySelectorAll('#global-header nav a, #global-header #mobile-menu a');
  headerLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;

    let isActive = false;
    if (isAllCategories && (href.includes('view=all') || link.getAttribute('data-nav-link') === 'all')) {
      isActive = true;
    } else if (currentCategory && href.includes(`category=${currentCategory}`)) {
      isActive = true;
    } else if (!currentCategory && !isAllCategories && (href === currentPath || (currentPath === '' && href === 'index.html') || (currentPath === 'index.html' && href === 'index.html'))) {
      isActive = true;
    }

    if (isActive && !href.includes('trending.html')) {
      link.classList.add('text-emerald-700', 'bg-emerald-50', 'font-bold');
      link.classList.remove('text-gray-700', 'hover:text-emerald-700', 'hover:bg-gray-50');
    }
  });

  // Footer Navigation Links
  const footerLinks = document.querySelectorAll('#global-footer a');
  footerLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;

    let isActive = false;
    if (currentCategory && href.includes(`category=${currentCategory}`)) {
      isActive = true;
    } else if (!currentCategory && (href === currentPath || (currentPath === '' && href === 'index.html') || (currentPath === 'index.html' && href === 'index.html'))) {
      isActive = true;
    }

    if (isActive) {
      link.classList.add('text-emerald-400', 'font-bold', 'underline', 'decoration-emerald-500', 'decoration-2', 'underline-offset-4');
      link.classList.remove('text-gray-400', 'text-gray-300');
    }
  });
}

// Auto-run on DOM ready if document is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initGlobalHeaderAndFooter();
  });
} else {
  initGlobalHeaderAndFooter();
}
