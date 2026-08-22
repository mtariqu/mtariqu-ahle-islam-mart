// Reusable Header, Navigation & Footer Components with Clean SVG Icons

import { ICONS } from './icons.js';

export function getHeaderHTML(activeSlug = '') {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const urlParams = new URLSearchParams(window.location.search);
  const currentCategory = urlParams.get('category') || '';
  const isTrending = currentPath.includes('trending.html');

  return `
    <header class="bg-white/95 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40 shadow-xs">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between min-h-[72px] py-2 gap-3 sm:gap-4">
          
          <!-- Logo -->
          <a href="index.html" class="flex items-center shrink-0 group py-1" aria-label="Ahle E Islam Mart Home">
            <img 
              src="/ahle_islam_mart_logo.png" 
              onerror="this.onerror=null; this.src='/assets/ahle_islam_mart_logo.png';" 
              alt="Ahle E Islam Mart" 
              referrerPolicy="no-referrer"
              loading="eager"
              class="h-[48px] sm:h-[58px] md:h-[66px] w-auto max-w-[200px] sm:max-w-[260px] md:max-w-[320px] object-contain rounded-md transition-transform group-hover:scale-[1.01]"
            />
          </a>

          <!-- Main Desktop Navigation: ONLY 5 Priority Menus -->
          <nav class="hidden lg:flex items-center gap-1.5 xl:gap-3 text-xs xl:text-sm font-semibold text-gray-700">
            <!-- 1. Trending Products (Mandatory) -->
            <a href="trending.html" class="flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors ${isTrending ? 'text-amber-700 bg-amber-50 font-bold border border-amber-200' : 'text-amber-600 hover:text-amber-700 hover:bg-amber-50/60'}">
              ${ICONS.flame("w-4 h-4 text-amber-500")}
              <span>Trending Products</span>
            </a>

            <!-- 2. Islamic Clothing -->
            <a href="category.html?category=islamic-clothing" class="flex items-center gap-1.5 px-2.5 py-2 rounded-lg transition-colors ${currentCategory === 'islamic-clothing' ? 'text-emerald-700 bg-emerald-50 font-bold' : 'hover:text-emerald-700 hover:bg-gray-50'}">
              <span>Islamic Clothing</span>
            </a>

            <!-- 3. Modest Wear -->
            <a href="category.html?category=hijab-modest-wear" class="flex items-center gap-1.5 px-2.5 py-2 rounded-lg transition-colors ${currentCategory === 'hijab-modest-wear' ? 'text-emerald-700 bg-emerald-50 font-bold' : 'hover:text-emerald-700 hover:bg-gray-50'}">
              <span>Modest Wear</span>
            </a>

            <!-- 4. Prayer Essentials -->
            <a href="category.html?category=prayer-essentials" class="flex items-center gap-1.5 px-2.5 py-2 rounded-lg transition-colors ${currentCategory === 'prayer-essentials' ? 'text-emerald-700 bg-emerald-50 font-bold' : 'hover:text-emerald-700 hover:bg-gray-50'}">
              <span>Prayer Essentials</span>
            </a>

            <!-- 5. Books & Quran -->
            <a href="category.html?category=islamic-books" class="flex items-center gap-1.5 px-2.5 py-2 rounded-lg transition-colors ${currentCategory === 'islamic-books' ? 'text-emerald-700 bg-emerald-50 font-bold' : 'hover:text-emerald-700 hover:bg-gray-50'}">
              <span>Books & Quran</span>
            </a>
          </nav>

          <!-- Search Bar -->
          <div class="relative flex-1 max-w-[200px] sm:max-w-xs md:max-w-sm">
            <div class="relative">
              <input 
                type="text" 
                id="header-search" 
                placeholder="Search products..." 
                class="w-full bg-gray-100 border border-transparent rounded-full py-2 pl-9 pr-4 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:bg-white focus:border-emerald-500 focus:outline-none transition-all shadow-2xs"
                autocomplete="off"
              />
              <span class="absolute left-3 top-2.5 text-gray-400 pointer-events-none">
                ${ICONS.search("w-4 h-4")}
              </span>
            </div>
            <!-- Search Results Overlay -->
            <div id="search-results-overlay" class="hidden absolute left-0 right-0 top-full mt-2 bg-white rounded-xl border border-gray-200 shadow-2xl max-h-80 overflow-y-auto z-50 p-2"></div>
          </div>

          <!-- Mobile Menu Toggle Button -->
          <button id="mobile-menu-btn" type="button" class="lg:hidden p-2 text-gray-700 hover:text-emerald-700 rounded-lg hover:bg-gray-100 transition-colors" aria-label="Toggle Navigation Menu">
            <span id="menu-icon-open">${ICONS.menu("w-6 h-6")}</span>
            <span id="menu-icon-close" class="hidden">${ICONS.close("w-6 h-6")}</span>
          </button>
        </div>
      </div>

      <!-- Mobile Dropdown Menu -->
      <div id="mobile-menu" class="hidden lg:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-2 shadow-lg">
        <a href="index.html" class="flex items-center gap-2 px-3 py-2 rounded-lg text-emerald-800 font-bold text-sm bg-emerald-50/70">
          ${ICONS.home("w-4 h-4 text-emerald-600")}
          <span>Home</span>
        </a>
        
        <a href="trending.html" class="flex items-center gap-2 px-3 py-2 rounded-lg text-amber-800 font-bold text-sm bg-amber-50 border border-amber-200">
          ${ICONS.flame("w-4 h-4 text-amber-500")}
          <span>Trending Products & Best Deals</span>
        </a>

        <div class="py-2 border-t border-gray-100">
          <span class="text-[11px] font-bold uppercase tracking-wider text-gray-400 px-3">Major Categories</span>
          <div class="grid grid-cols-1 gap-1 pt-1.5">
            <a href="category.html?category=islamic-clothing" class="flex items-center justify-between px-3 py-2 rounded-lg text-gray-700 hover:text-emerald-700 hover:bg-emerald-50/50 text-xs font-semibold">
              <span>Islamic Clothing</span>
              <span class="text-gray-400">${ICONS.chevronRight("w-3.5 h-3.5")}</span>
            </a>
            <a href="category.html?category=hijab-modest-wear" class="flex items-center justify-between px-3 py-2 rounded-lg text-gray-700 hover:text-emerald-700 hover:bg-emerald-50/50 text-xs font-semibold">
              <span>Modest Wear</span>
              <span class="text-gray-400">${ICONS.chevronRight("w-3.5 h-3.5")}</span>
            </a>
            <a href="category.html?category=prayer-essentials" class="flex items-center justify-between px-3 py-2 rounded-lg text-gray-700 hover:text-emerald-700 hover:bg-emerald-50/50 text-xs font-semibold">
              <span>Prayer Essentials</span>
              <span class="text-gray-400">${ICONS.chevronRight("w-3.5 h-3.5")}</span>
            </a>
            <a href="category.html?category=islamic-books" class="flex items-center justify-between px-3 py-2 rounded-lg text-gray-700 hover:text-emerald-700 hover:bg-emerald-50/50 text-xs font-semibold">
              <span>Books & Quran</span>
              <span class="text-gray-400">${ICONS.chevronRight("w-3.5 h-3.5")}</span>
            </a>
          </div>
        </div>

        <div class="pt-2 border-t border-gray-100 space-y-1">
          <a href="category.html?view=all" class="flex items-center justify-between px-3 py-2 text-emerald-800 font-bold text-xs bg-emerald-50 rounded-lg border border-emerald-200">
            <span>Explore All 25 Categories</span>
            <span class="text-emerald-600">${ICONS.arrowRight("w-3.5 h-3.5")}</span>
          </a>
          <a href="contact.html" class="block px-3 py-2 text-gray-600 font-medium text-xs hover:text-gray-900">
            Contact Support
          </a>
        </div>
      </div>
    </header>
  `;
}

export function getFooterHTML() {
  const currentYear = new Date().getFullYear();

  return `
    <footer class="bg-gray-950 text-gray-300 border-t border-gray-800 text-xs sm:text-sm mt-auto">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12">
          
          <!-- Column 1: Brand & Social Media -->
          <div class="space-y-4">
            <a href="index.html" class="inline-block py-1">
              <img 
                src="/ahle_islam_mart_logo.png" 
                onerror="this.onerror=null; this.src='/assets/ahle_islam_mart_logo.png';" 
                alt="Ahle E Islam Mart" 
                referrerPolicy="no-referrer"
                loading="lazy"
                class="h-10 sm:h-12 w-auto object-contain brightness-110"
              />
            </a>
            <p class="text-gray-400 text-xs leading-relaxed max-w-sm">
              Your premier curated Islamic lifestyle & essentials catalog. Discover top deals from trusted merchants and e-commerce partners worldwide.
            </p>
            
            <!-- Global Social Section with Clean SVG Icons -->
            <div class="pt-2">
              <span class="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2.5">Follow Our Channels</span>
              <div class="flex items-center gap-3">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" class="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-gray-300 hover:text-white hover:bg-emerald-700 transition-all hover:scale-105" title="Facebook" aria-label="Facebook">
                  ${ICONS.facebook("w-4 h-4")}
                </a>
                <a href="https://x.com" target="_blank" rel="noopener noreferrer" class="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-gray-300 hover:text-white hover:bg-emerald-700 transition-all hover:scale-105" title="X (Twitter)" aria-label="X (Twitter)">
                  ${ICONS.twitter("w-4 h-4")}
                </a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" class="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-gray-300 hover:text-white hover:bg-emerald-700 transition-all hover:scale-105" title="YouTube" aria-label="YouTube">
                  ${ICONS.youtube("w-4 h-4")}
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" class="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-gray-300 hover:text-white hover:bg-emerald-700 transition-all hover:scale-105" title="Instagram" aria-label="Instagram">
                  ${ICONS.instagram("w-4 h-4")}
                </a>
              </div>
            </div>
          </div>

          <!-- Column 2: Major Categories (NO emojis) -->
          <div>
            <h4 class="font-bold text-white text-sm uppercase tracking-wider mb-4">Major Categories</h4>
            <ul class="space-y-2.5 text-xs text-gray-400">
              <li><a href="category.html?category=islamic-clothing" class="hover:text-emerald-400 transition-colors">Islamic Clothing</a></li>
              <li><a href="category.html?category=hijab-modest-wear" class="hover:text-emerald-400 transition-colors">Hijabs & Modest Wear</a></li>
              <li><a href="category.html?category=prayer-essentials" class="hover:text-emerald-400 transition-colors">Prayer Essentials</a></li>
              <li><a href="category.html?category=islamic-books" class="hover:text-emerald-400 transition-colors">Islamic Books</a></li>
              <li><a href="category.html?category=muslim-lifestyle" class="hover:text-emerald-400 transition-colors">Beauty & Fragrances</a></li>
              <li><a href="category.html?category=islamic-gifts" class="hover:text-emerald-400 transition-colors">Gifts & Decor</a></li>
            </ul>
          </div>

          <!-- Column 3: Quick Links (NO Trending Products in Quick Menu) -->
          <div>
            <h4 class="font-bold text-white text-sm uppercase tracking-wider mb-4">Quick Links</h4>
            <ul class="space-y-2.5 text-xs text-gray-400">
              <li><a href="index.html" class="hover:text-emerald-400 transition-colors">Home</a></li>
              <li><a href="category.html?view=all" class="hover:text-emerald-400 transition-colors">Explore All Categories</a></li>
              <li><a href="about.html" class="hover:text-emerald-400 transition-colors">About Us</a></li>
              <li><a href="contact.html" class="hover:text-emerald-400 transition-colors">Contact Support</a></li>
              <li><a href="disclaimer.html" class="hover:text-emerald-400 transition-colors">Disclaimer</a></li>
              <li><a href="affiliate-disclosure.html" class="hover:text-emerald-400 transition-colors">Affiliate Disclosure</a></li>
            </ul>
          </div>

          <!-- Column 4: Legal & Compliance -->
          <div>
            <h4 class="font-bold text-white text-sm uppercase tracking-wider mb-4">Legal & Compliance</h4>
            <ul class="space-y-2.5 text-xs text-gray-400 mb-5">
              <li><a href="privacy.html" class="hover:text-emerald-400 transition-colors">Privacy Policy</a></li>
              <li><a href="terms.html" class="hover:text-emerald-400 transition-colors">Terms of Service</a></li>
            </ul>
            <div class="p-3 bg-gray-900/80 rounded-xl border border-gray-800 text-[11px] text-gray-400 leading-relaxed">
              <span class="font-semibold text-gray-300 block mb-1">Affiliate Disclosure:</span>
              As an affiliate, we may earn from qualifying purchases through partner merchant links.
            </div>
          </div>

        </div>

        <!-- Footer Bottom Bar with Dynamic Year -->
        <div class="pt-8 border-t border-gray-800/80 text-center text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>© <span id="global-footer-year">${currentYear}</span> Ahle E Islam Mart. All rights reserved.</p>
          <div class="flex items-center gap-4 text-[11px] text-gray-500">
            <span>Verified Merchant Links</span>
            <span>•</span>
            <a href="admin.html" class="text-gray-600 hover:text-emerald-400 transition-colors">Admin Portal</a>
          </div>
        </div>
      </div>
    </footer>
  `;
}

export function initGlobalHeaderAndFooter() {
  const headerContainer = document.getElementById('global-header');
  if (headerContainer) {
    headerContainer.innerHTML = getHeaderHTML();
  }

  const footerContainer = document.getElementById('global-footer');
  if (footerContainer) {
    footerContainer.innerHTML = getFooterHTML();
  }

  // Hook up mobile menu toggle
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const iconOpen = document.getElementById('menu-icon-open');
  const iconClose = document.getElementById('menu-icon-close');

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
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

  // Dynamic Year in case static footer exists
  const yearEl = document.getElementById('global-footer-year') || document.getElementById('current-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear().toString();
  }
}
