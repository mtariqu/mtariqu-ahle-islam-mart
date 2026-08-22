import { db, collection, getDocs } from './firebase-config.js';
import { renderProductGrid, CATEGORIES, initActiveNavigation } from './app.js';
import { SAMPLE_PRODUCTS } from './seed-data.js';

let currentProductsList = [];
let allCategoriesList = [...CATEGORIES];

document.addEventListener('DOMContentLoaded', async () => {
  initActiveNavigation();
  
  const urlParams = new URLSearchParams(window.location.search);
  const viewParam = urlParams.get('view')?.toLowerCase();
  const categoryParam = urlParams.get('category')?.toLowerCase();

  // Populate horizontal quick switcher pills
  renderQuickCategoryPills(categoryParam || (viewParam === 'all' ? 'all' : null));

  // Determine whether to show the Full Directory or a Specific Category
  if (!categoryParam || categoryParam === 'all' || categoryParam === 'categories' || viewParam === 'all') {
    showAllCategoriesDirectory();
  } else {
    await showSpecificCategoryProducts(categoryParam);
  }

  // Hook up directory search filter
  const searchInput = document.getElementById('category-directory-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      filterCategoriesDirectory(e.target.value.trim().toLowerCase());
    });
  }

  // Hook up product sorting
  const sortSelect = document.getElementById('sort-products');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      sortAndRenderProducts(e.target.value);
    });
  }
});

function renderQuickCategoryPills(activeSlug) {
  const container = document.getElementById('quick-category-pills');
  if (!container) return;

  const allPill = `
    <a 
      href="category.html?view=all" 
      class="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
        !activeSlug || activeSlug === 'all' || activeSlug === 'categories' 
          ? 'bg-emerald-600 text-white shadow-xs' 
          : 'bg-white text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 border border-gray-200'
      }"
    >
      ✨ All Categories (${CATEGORIES.length})
    </a>
  `;

  const categoryPills = CATEGORIES.map(cat => {
    const isActive = activeSlug === cat.slug;
    return `
      <a 
        href="category.html?category=${cat.slug}" 
        class="px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 ${
          isActive 
            ? 'bg-emerald-600 text-white font-bold shadow-xs' 
            : 'bg-white text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 border border-gray-200'
        }"
      >
        ${cat.name}
      </a>
    `;
  }).join('');

  container.innerHTML = allPill + categoryPills;
}

function showAllCategoriesDirectory() {
  const directorySection = document.getElementById('all-categories-directory-section');
  const productsSection = document.getElementById('specific-category-products-section');
  const backBtn = document.getElementById('back-to-all-categories-btn');
  const breadcrumbCategory = document.getElementById('breadcrumb-category');
  const breadcrumbSeparator = document.getElementById('breadcrumb-separator');

  if (directorySection) directorySection.classList.remove('hidden');
  if (productsSection) productsSection.classList.add('hidden');
  if (backBtn) backBtn.classList.add('hidden');
  if (breadcrumbCategory) breadcrumbCategory.classList.add('hidden');
  if (breadcrumbSeparator) breadcrumbSeparator.classList.add('hidden');

  document.title = 'All Categories & Collections | Ahle E Islam Mart';

  renderCategoriesDirectoryGrid(allCategoriesList);
}

function renderCategoriesDirectoryGrid(categories) {
  const grid = document.getElementById('full-categories-directory-grid');
  const countBadge = document.getElementById('category-count-badge');
  if (!grid) return;

  if (countBadge) {
    countBadge.textContent = categories.length;
  }

  if (categories.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full py-12 text-center text-gray-400">
        <p class="text-base font-semibold text-gray-600">No categories found matching your search.</p>
        <p class="text-xs text-gray-400 mt-1">Try searching for other terms like 'Prayer', 'Books', 'Clothing' or 'Fashion'.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = categories.map(cat => `
    <a 
      href="category.html?category=${cat.slug}" 
      class="group bg-white rounded-2xl border border-gray-200/90 hover:border-emerald-500 hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden text-left"
    >
      <div class="w-full aspect-[4/3] bg-gray-100 relative overflow-hidden">
        <img 
          src="${cat.image || 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=600&q=80'}" 
          onerror="this.onerror=null; this.src='/assets/ahle_islam_mart_logo.png';"
          alt="${cat.name}" 
          loading="lazy"
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <span class="absolute top-2.5 right-2.5 bg-white/95 backdrop-blur-xs text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-md shadow-xs border border-white/80">
          Collection
        </span>
      </div>

      <div class="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 class="font-black text-gray-900 text-sm sm:text-base group-hover:text-emerald-700 transition-colors line-clamp-1 mb-1">
            ${cat.name}
          </h3>
          <p class="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-3 font-normal">
            ${cat.description || 'Curated high-quality items with verified deals.'}
          </p>
        </div>

        <div class="pt-2 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-emerald-600 group-hover:text-emerald-700">
          <span>Explore Products</span>
          <span class="transform group-hover:translate-x-1 transition-transform">&rarr;</span>
        </div>
      </div>
    </a>
  `).join('');
}

function filterCategoriesDirectory(query) {
  if (!query) {
    renderCategoriesDirectoryGrid(allCategoriesList);
    return;
  }

  const filtered = allCategoriesList.filter(cat => 
    cat.name.toLowerCase().includes(query) ||
    cat.slug.toLowerCase().includes(query) ||
    (cat.description && cat.description.toLowerCase().includes(query))
  );

  renderCategoriesDirectoryGrid(filtered);
}

async function showSpecificCategoryProducts(categorySlug) {
  const directorySection = document.getElementById('all-categories-directory-section');
  const productsSection = document.getElementById('specific-category-products-section');
  const backBtn = document.getElementById('back-to-all-categories-btn');
  const breadcrumbCategory = document.getElementById('breadcrumb-category');
  const breadcrumbSeparator = document.getElementById('breadcrumb-separator');

  if (directorySection) directorySection.classList.add('hidden');
  if (productsSection) productsSection.classList.remove('hidden');
  if (backBtn) backBtn.classList.remove('hidden');
  if (breadcrumbCategory) breadcrumbCategory.classList.remove('hidden');
  if (breadcrumbSeparator) breadcrumbSeparator.classList.remove('hidden');

  updateCategoryHeader(categorySlug);
  await loadCategoryProducts(categorySlug);
}

function updateCategoryHeader(categorySlug) {
  let categoryInfo;
  if (categorySlug === 'all' || categorySlug === 'featured' || categorySlug === 'trending') {
    categoryInfo = {
      name: "Trending Products",
      description: "Browse all top-rated curated trending products and recommendations."
    };
  } else {
    categoryInfo = CATEGORIES.find(c => c.slug === categorySlug) || {
      name: categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1).replace(/-/g, ' '),
      description: `Browse top curated affiliate products in ${categorySlug.replace(/-/g, ' ')}.`
    };
  }

  const titleEl = document.getElementById('category-title');
  const descEl = document.getElementById('category-description');
  const breadcrumbEl = document.getElementById('breadcrumb-category');
  const badgeSlug = document.getElementById('category-badge-slug');

  if (titleEl) titleEl.textContent = categoryInfo.name;
  if (descEl) descEl.textContent = categoryInfo.description;
  if (breadcrumbEl) breadcrumbEl.textContent = categoryInfo.name;
  if (badgeSlug) badgeSlug.textContent = categoryInfo.name;

  document.title = `${categoryInfo.name} | Ahle E Islam Mart`;
}

async function loadCategoryProducts(categorySlug) {
  const container = document.getElementById('category-products-grid');
  if (!container) return;

  try {
    const snapshot = await getDocs(collection(db, 'products'));
    let products = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(p => p.status === 'published');

    if (categorySlug !== 'all' && categorySlug !== 'featured') {
      products = products.filter(p => p.category?.toLowerCase() === categorySlug);
    }

    // Fallback to sample data if database is empty for this category
    if (products.length === 0) {
      if (categorySlug === 'all' || categorySlug === 'featured') {
        products = SAMPLE_PRODUCTS.map((p, idx) => ({ id: `sample-${idx}`, ...p }));
      } else {
        products = SAMPLE_PRODUCTS
          .filter(p => p.category?.toLowerCase() === categorySlug)
          .map((p, idx) => ({ id: `sample-${categorySlug}-${idx}`, ...p }));
      }
    }

    if (products.length === 0) {
      // Create rich curated category product item
      const catObj = CATEGORIES.find(c => c.slug === categorySlug);
      const catName = catObj ? catObj.name : categorySlug.toUpperCase();
      products = [
        {
          id: `curated-${categorySlug}-1`,
          name: `Curated ${catName} Essential Collection Item`,
          slug: `curated-${categorySlug}-essential`,
          category: categorySlug,
          price: "₹899",
          oldPrice: "₹1,299",
          rating: 4.9,
          shortDescription: `Top recommended ${catName} product carefully selected for durability, quality and exceptional value.`,
          description: `Experience exceptional quality with our curated ${catName} selection. Crafted with premium materials to serve your daily requirements with style and functionality.`,
          features: ["High Quality Craftsmanship", "Top Customer Satisfaction", "Affiliate Verified Product", "Safe Merchant Checkout"],
          specifications: { "Category": catName, "Guarantee": "100% Verified Quality", "Delivery": "Standard 3-5 Business Days" },
          images: [catObj?.image || "https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=800&q=80"],
          affiliateUrl: "https://amazon.in?tag=tariqu-21",
          status: "published"
        }
      ];
    }

    currentProductsList = products;
    renderProductGrid(currentProductsList, container);
  } catch (err) {
    console.error('Error loading category products:', err);
    currentProductsList = SAMPLE_PRODUCTS
      .filter(p => p.category?.toLowerCase() === categorySlug)
      .map((p, idx) => ({ id: `sample-${categorySlug}-${idx}`, ...p }));
    renderProductGrid(currentProductsList, container);
  }
}

function sortAndRenderProducts(sortBy) {
  const container = document.getElementById('category-products-grid');
  if (!container || currentProductsList.length === 0) return;

  let sorted = [...currentProductsList];

  const parsePrice = (priceStr) => {
    if (typeof priceStr === 'number') return priceStr;
    if (!priceStr) return 0;
    return parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;
  };

  if (sortBy === 'price-low') {
    sorted.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
  } else if (sortBy === 'price-high') {
    sorted.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
  } else if (sortBy === 'rating') {
    sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else if (sortBy === 'newest') {
    sorted.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }

  renderProductGrid(sorted, container);
}
