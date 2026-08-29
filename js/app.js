import { 
  db, 
  collection, 
  getDocs, 
  query, 
  where, 
  limit 
} from './firebase-config.js';
import { 
  initGlobalHeaderAndFooter, 
  initActiveNavigation, 
  initNavbarControls, 
  initHeaderSearch 
} from './components.js';

export { initGlobalHeaderAndFooter, initActiveNavigation };

// Modern Fisher-Yates shuffle algorithm for randomized product display on customer website
export function shuffleArray(array) {
  if (!Array.isArray(array)) return [];
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Global Category Map
export const CATEGORIES = [
  { slug: 'men', name: "Men's Fashion", icon: 'shirt', image: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=600&q=80', description: 'Shirts, t-shirts, jeans, ethnic wear & footwear' },
  { slug: 'women', name: "Women's Fashion", icon: 'sparkles', image: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=600&q=80', description: 'Dresses, sarees, kurtis, handbags & jewelry' },
  { slug: 'electronics', name: 'Electronics & Tech', icon: 'smartphone', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80', description: 'Earbuds, smartwatches, speakers & gadgets' },
  { slug: 'home-kitchen', name: 'Home & Kitchen', icon: 'utensils', image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80', description: 'Cookware, dining sets, appliances & storage' },
  { slug: 'beauty-personal-care', name: 'Beauty & Grooming', icon: 'sparkles', image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80', description: 'Skincare, perfumes, grooming kits & haircare' },
  { slug: 'home-decor', name: 'Home Decor & Living', icon: 'home', image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80', description: 'Wall art, lamps, clocks, curtains & showpieces' },
  { slug: 'sports-fitness', name: 'Sports & Fitness', icon: 'activity', image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80', description: 'Yoga mats, dumbbells, gym bags & activewear' },
  { slug: 'baby-kids', name: 'Baby & Kids', icon: 'smile', image: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=600&q=80', description: 'Kids clothing, educational toys & baby essentials' },
  { slug: 'books-stationery', name: 'Books & Stationery', icon: 'book-open', image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=600&q=80', description: 'Bestselling books, planners, notebooks & pens' },
  { slug: 'automotive', name: 'Automotive Accessories', icon: 'truck', image: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=600&q=80', description: 'Car mounts, cleaners, vacuum & bike essentials' }
];

// Initialize Home Page
document.addEventListener('DOMContentLoaded', async () => {
  await initGlobalHeaderAndFooter();
  loadHomepageCategories();
  
  // If home page elements exist, populate them
  if (document.getElementById('homepage-trending-slider') || document.getElementById('featured-products-grid')) {
    loadHomepageTrendingSlider();
  }
});

function getCategoryIconSvg(iconName) {
  switch (iconName) {
    case 'shirt':
      return `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>`;
    case 'sparkles':
      return `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>`;
    case 'book-open':
    case 'book':
      return `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>`;
    case 'smartphone':
      return `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>`;
    case 'utensils':
      return `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>`;
    case 'moon':
      return `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>`;
    case 'heart':
    case 'heart-handshake':
      return `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 21.364l-7.682-7.682a4.5 4.5 0 010-6.364z" /></svg>`;
    case 'gift':
      return `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V6a2 2 0 10-2 2h2zm-8 2h16v11a2 2 0 01-2 2H6a2 2 0 01-2-2V10z" /></svg>`;
    case 'image':
      return `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>`;
    case 'home':
      return `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>`;
    case 'compass':
      return `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>`;
    case 'disc':
      return `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
    case 'smile':
      return `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
    case 'user':
      return `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>`;
    case 'feather':
    case 'pen-tool':
      return `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>`;
    case 'graduation-cap':
      return `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>`;
    case 'tag':
      return `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5a1 1 0 01.707.293l7 7a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-7-7A1 1 0 017 8V3z" /></svg>`;
    case 'globe':
      return `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>`;
    case 'sun':
      return `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>`;
    default:
      return `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 11h14l1 12H4L5 11z" /></svg>`;
  }
}

export function loadHomepageCategories() {
  const sliderContainer = document.getElementById('homepage-categories-slider');
  const gridContainer = document.getElementById('homepage-categories-grid');

  const cardHtml = (cat, isSlider = false) => `
    <a 
      href="category.html?category=${cat.slug}" 
      class="group bg-white p-3 rounded-2xl border border-gray-200/80 hover:border-emerald-500 hover:shadow-md transition-all flex flex-col items-center justify-between text-center ${isSlider ? 'w-[140px] sm:w-[170px] md:w-[190px] shrink-0 snap-start' : 'h-full'}"
    >
      <div class="w-full h-24 sm:h-28 md:h-32 rounded-xl overflow-hidden mb-2 bg-gray-100 relative shadow-2xs shrink-0">
        <img 
          src="${cat.image || 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=600&q=80'}" 
          onerror="this.onerror=null; this.src='/apna_mart_logo.png';"
          alt="${cat.name}" 
          loading="lazy"
          class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
        />
        <div class="absolute top-2 right-2 w-7 h-7 bg-white/95 backdrop-blur-xs text-emerald-700 rounded-lg flex items-center justify-center shadow-xs border border-white/60">
          ${getCategoryIconSvg(cat.icon)}
        </div>
      </div>
      <h3 class="font-bold text-gray-900 text-xs sm:text-sm group-hover:text-emerald-600 transition-colors line-clamp-1 mb-0.5">${cat.name}</h3>
      <p class="text-[10px] sm:text-[11px] text-gray-400 line-clamp-1 leading-tight">${cat.description}</p>
    </a>
  `;

  if (sliderContainer) {
    sliderContainer.innerHTML = CATEGORIES.map(cat => cardHtml(cat, true)).join('');
    initCategorySliderControls(sliderContainer);
  }

  if (gridContainer) {
    gridContainer.innerHTML = CATEGORIES.map(cat => cardHtml(cat, false)).join('');
  }
}

function initCategorySliderControls(slider) {
  const prevBtn = document.getElementById('category-slide-prev');
  const nextBtn = document.getElementById('category-slide-next');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      const scrollAmount = Math.max(slider.clientWidth * 0.75, 220);
      slider.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const scrollAmount = Math.max(slider.clientWidth * 0.75, 220);
      slider.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });
  }

  // Mouse drag scrolling support for desktop
  let isDown = false;
  let startX = 0;
  let scrollLeft = 0;

  slider.addEventListener('mousedown', (e) => {
    isDown = true;
    slider.classList.add('cursor-grabbing');
    startX = e.pageX - slider.offsetLeft;
    scrollLeft = slider.scrollLeft;
  });

  slider.addEventListener('mouseleave', () => {
    isDown = false;
    slider.classList.remove('cursor-grabbing');
  });

  slider.addEventListener('mouseup', () => {
    isDown = false;
    slider.classList.remove('cursor-grabbing');
  });

  slider.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - slider.offsetLeft;
    const walk = (x - startX) * 1.5;
    slider.scrollLeft = scrollLeft - walk;
  });
}

function initNavbar() {
  const menuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }
}

function initSearch() {
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
            
          renderSearchResults(products, searchResults);
        } catch (err) {
          console.error('Search error:', err);
        }
      }, 300);
    });

    // Close search overlay on outside click
    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
        searchResults.classList.add('hidden');
      }
    });
  }
}

function renderSearchResults(products, container) {
  if (products.length === 0) {
    container.innerHTML = `<div class="p-4 text-gray-500 text-sm text-center">No products found matching your search.</div>`;
    container.classList.remove('hidden');
    return;
  }
  
  const html = products.slice(0, 6).map(p => `
    <a href="product.html?id=${p.id}" class="flex items-center gap-3 p-3 hover:bg-emerald-50 transition-colors border-b border-gray-100 last:border-0">
      <img src="${(p.images && p.images[0]) ? p.images[0] : 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=800&q=80'}" onerror="this.onerror=null; this.src='/apna_mart_logo.png';" alt="${p.name}" class="w-12 h-12 object-cover rounded shrink-0 bg-gray-100" loading="lazy" />
      <div class="flex-1 min-w-0">
        <h4 class="text-sm font-semibold text-gray-800 truncate">${p.name}</h4>
        <span class="text-xs text-emerald-600 font-medium capitalize">${p.category}</span>
      </div>
      <span class="text-sm font-bold text-gray-900">${p.price}</span>
    </a>
  `).join('');
  
  container.innerHTML = html;
  container.classList.remove('hidden');
}

export async function loadHomepageTrendingSlider() {
  const sliderContainer = document.getElementById('homepage-trending-slider');
  const gridContainer = document.getElementById('featured-products-grid');
  if (!sliderContainer && !gridContainer) return;

  try {
    const snapshot = await getDocs(collection(db, 'products'));
    let allPublished = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(p => p.status === 'published');

    // Filter strictly for products marked as trending
    let trendingProducts = allPublished.filter(p => p.isTrending === true || p.isTrending === 'true' || p.isTrending === 1);
    if (trendingProducts.length === 0) {
      trendingProducts = allPublished.filter(p => p.isFeatured || (p.rating && p.rating >= 4.7));
    }
    if (trendingProducts.length === 0) {
      trendingProducts = allPublished;
    }

    // Randomize product order on the customer website for fresh product discovery
    const randomizedTrending = shuffleArray(trendingProducts);
    const randomizedFeatured = shuffleArray(allPublished.length > 0 ? allPublished : trendingProducts);

    if (sliderContainer) {
      renderTrendingSliderCards(randomizedTrending, sliderContainer);
      initCategorySliderControlsGeneric(sliderContainer, 'trending-slide-prev', 'trending-slide-next');
    }

    if (gridContainer) {
      renderProductGrid(randomizedFeatured.slice(0, 4), gridContainer);
    }
  } catch (err) {
    console.error('Error loading homepage trending slider:', err);
    if (sliderContainer) {
      renderTrendingSliderCards([], sliderContainer);
    }
    if (gridContainer) {
      renderProductGrid([], gridContainer);
    }
  }
}

export function renderTrendingSliderCards(products, container) {
  if (!container) return;

  if (products.length === 0) {
    container.innerHTML = `
      <div class="w-full py-12 text-center text-gray-500 bg-white rounded-2xl border border-dashed border-gray-200 p-8">
        <p class="text-base font-bold text-gray-700 mb-1">No trending products available</p>
        <p class="text-xs text-gray-400">Check back soon for new hot deals.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = products.map(p => {
    const mainImg = (p.images && p.images.length > 0) 
      ? p.images[0] 
      : 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=800&q=80';

    const starsHtml = '★'.repeat(Math.floor(p.rating || 5)) + '☆'.repeat(5 - Math.floor(p.rating || 5));

    return `
      <div class="group bg-white rounded-2xl border border-gray-200/90 overflow-hidden shadow-xs hover:shadow-md hover:border-emerald-400 transition-all duration-200 flex flex-col justify-between w-[230px] sm:w-[260px] md:w-[275px] lg:w-[285px] shrink-0 snap-start">
        <a href="product.html?id=${p.id}" class="block relative w-full h-44 sm:h-48 md:h-52 bg-gray-100 overflow-hidden shrink-0">
          <img 
            src="${mainImg}" 
            onerror="this.onerror=null; this.src='/apna_mart_logo.png';"
            alt="${p.name}" 
            loading="lazy"
            class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          />
          <div class="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
            <span class="bg-amber-500 text-gray-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
              🔥 Trending
            </span>
            <span class="bg-emerald-900/90 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize backdrop-blur-xs shadow-xs">
              ${p.category || 'Deal'}
            </span>
          </div>
        </a>

        <div class="p-3.5 sm:p-4 flex flex-col flex-1 justify-between">
          <div>
            <div class="flex items-center text-amber-500 text-xs mb-1 sm:mb-1.5">
              <span>${starsHtml}</span>
              <span class="text-gray-500 ml-1.5 font-bold text-[11px]">(${p.rating || 4.8})</span>
            </div>

            <h3 class="font-bold text-gray-900 text-xs sm:text-sm mb-1 sm:mb-1.5 group-hover:text-emerald-600 transition-colors line-clamp-2 leading-snug">
              <a href="product.html?id=${p.id}">${p.name}</a>
            </h3>

            <p class="text-[11px] sm:text-xs text-gray-500 mb-2 sm:mb-3 line-clamp-2 leading-relaxed">
              ${p.shortDescription || p.description || ''}
            </p>
          </div>

          <div class="pt-2.5 sm:pt-3 border-t border-gray-100 flex items-center justify-between mt-auto">
            <div>
              <span class="text-sm sm:text-base md:text-lg font-black text-gray-900">${p.price}</span>
              ${p.oldPrice ? `<span class="text-[10px] sm:text-xs text-gray-400 line-through ml-1">${p.oldPrice}</span>` : ''}
            </div>
            <a 
              href="product.html?id=${p.id}" 
              class="inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl transition-all shadow-xs hover:shadow-md"
            >
              View Details
            </a>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

export function initCategorySliderControlsGeneric(slider, prevBtnId, nextBtnId) {
  const prevBtn = document.getElementById(prevBtnId);
  const nextBtn = document.getElementById(nextBtnId);

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      const scrollAmount = Math.max(slider.clientWidth * 0.75, 240);
      slider.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const scrollAmount = Math.max(slider.clientWidth * 0.75, 240);
      slider.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });
  }

  // Mouse drag scrolling support
  let isDown = false;
  let startX = 0;
  let scrollLeft = 0;

  slider.addEventListener('mousedown', (e) => {
    isDown = true;
    slider.classList.add('cursor-grabbing');
    startX = e.pageX - slider.offsetLeft;
    scrollLeft = slider.scrollLeft;
  });

  slider.addEventListener('mouseleave', () => {
    isDown = false;
    slider.classList.remove('cursor-grabbing');
  });

  slider.addEventListener('mouseup', () => {
    isDown = false;
    slider.classList.remove('cursor-grabbing');
  });

  slider.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - slider.offsetLeft;
    const walk = (x - startX) * 1.5;
    slider.scrollLeft = scrollLeft - walk;
  });
}

export async function loadFeaturedProducts() {
  return loadHomepageTrendingSlider();
}

export function renderProductGrid(products, container) {
  if (!container) return;
  
  if (products.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-12 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200 p-8">
        <p class="text-lg font-medium text-gray-700 mb-1">No products available yet</p>
        <p class="text-sm text-gray-500">Check back soon for curated affiliate recommendations.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = products.map(p => {
    const mainImg = (p.images && p.images.length > 0) 
      ? p.images[0] 
      : 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=800&q=80';

    const starsHtml = '★'.repeat(Math.floor(p.rating || 5)) + '☆'.repeat(5 - Math.floor(p.rating || 5));

    return `
      <div class="group bg-white rounded-xl sm:rounded-2xl border border-gray-200/90 overflow-hidden shadow-xs hover:shadow-md hover:border-emerald-500 transition-all duration-200 flex flex-col h-full">
        <a href="product.html?id=${p.id}" class="block relative w-full h-40 sm:h-48 md:h-52 bg-gray-100 overflow-hidden shrink-0">
          <img 
            src="${mainImg}" 
            onerror="this.onerror=null; this.src='/apna_mart_logo.png';"
            alt="${p.name}" 
            loading="lazy"
            class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          />
          <span class="absolute top-2 left-2 bg-emerald-700/95 backdrop-blur-xs text-white text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full capitalize shadow-xs">
            ${p.category || 'Deal'}
          </span>
        </a>

        <div class="p-3 sm:p-4 flex flex-col flex-1 justify-between">
          <div>
            <div class="flex items-center text-amber-500 text-[11px] sm:text-xs mb-1">
              <span>${starsHtml}</span>
              <span class="text-gray-500 ml-1 font-bold">(${p.rating || 4.5})</span>
            </div>

            <h3 class="font-bold text-gray-900 text-xs sm:text-sm mb-1 sm:mb-1.5 group-hover:text-emerald-600 transition-colors line-clamp-2 leading-snug">
              <a href="product.html?id=${p.id}">${p.name}</a>
            </h3>

            <p class="text-[11px] sm:text-xs text-gray-500 mb-2.5 sm:mb-3 line-clamp-2 leading-relaxed hidden sm:block">
              ${p.shortDescription || p.description || ''}
            </p>
          </div>

          <div class="pt-2 sm:pt-3 border-t border-gray-100 flex items-center justify-between mt-auto">
            <div>
              <span class="text-sm sm:text-base md:text-lg font-black text-gray-900">${p.price}</span>
              ${p.oldPrice ? `<span class="text-[10px] sm:text-xs text-gray-400 line-through ml-1">${p.oldPrice}</span>` : ''}
            </div>
            <a 
              href="product.html?id=${p.id}" 
              class="inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] sm:text-xs font-bold px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-lg sm:rounded-xl transition-all shadow-2xs hover:shadow-xs"
            >
              View Details
            </a>
          </div>
        </div>
      </div>
    `;
  }).join('');
}
