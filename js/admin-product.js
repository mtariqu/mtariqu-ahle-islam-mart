// Admin Dedicated Product Wizard Logic (5 Steps with Strict Validation, SEO Sync & Media)

import { 
  db, 
  doc, 
  getDoc, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp 
} from './firebase-config.js';
import { requireAdminAuth } from './auth.js';
import { SAMPLE_PRODUCTS } from './seed-data.js';
import { CATEGORIES } from './app.js';

let currentStep = 1;
const TOTAL_STEPS = 5;
let editingProductId = null;
let uploadedImages = [];

// Master Product Type Mappings for all Categories
const CATEGORY_PRODUCT_TYPES = {
  'men': ['Casual Shirt', 'Formal Shirt', 'T-Shirt & Polo', 'Denim Jeans', 'Trousers & Chinos', 'Ethnic Kurta & Pyjama', 'Blazer & Coat', 'Sneakers & Shoes', 'Leather Wallet', 'Analog / Smart Watch'],
  'women': ['Designer Kurti & Suit', 'Saree & Blouse', 'Western Dress & Gown', 'Top & Tunic', 'Jeans & Trousers', 'Handbag & Sling', 'Ethnic Jewelry', 'Heels & Flats', 'Fashion Sunglasses'],
  'electronics': ['Smartphones', 'Smartwatch & Fitness Band', 'TWS Wireless Earbuds', 'Noise-Cancelling Headphones', 'Bluetooth Portable Speaker', 'Fast Power Bank', 'USB-C Cable & Hub', 'Laptop Stand & Bag'],
  'home-kitchen': ['Non-Stick Cookware Set', 'Stainless Steel Dinner Set', 'Electric Kettle & Toaster', 'Air Fryer & Juicer', 'Airtight Storage Containers', 'Chef Knife Set', 'Water Bottle & Thermos Flask'],
  'beauty-personal-care': ['Face Wash & Cleanser', 'Moisturizer & Sunscreen', 'Hair Serum & Shampoo', 'Luxury Eau De Parfum (EDP)', 'Beard Grooming Kit', 'Makeup & Lipstick', 'Electric Hair Trimmer'],
  'home-decor': ['Canvas Wall Art & Frames', 'Modern Wall Clock', 'Ceramic Table Lamp', 'Curtains & Sheers', 'Cushion Covers Set', 'Indoor Planter Pot', 'Aromatherapy Diffuser & Candles'],
  'sports-fitness': ['Anti-Slip Yoga Mat', 'Adjustable Dumbbells Set', 'Resistance Exercise Bands', 'Gym Duffel Bag', 'Stainless Gym Shaker', 'Running & Training Shoes', 'Fitness Tracker Watch'],
  'baby-kids': ['Kids Casual Clothing Set', 'Educational STEM Toys', 'Building Blocks & Puzzles', 'Baby Stroller & Carrier', 'Kids Story & Activity Book', 'School Backpack & Lunch Box'],
  'books-stationery': ['Bestselling Fiction & Novels', 'Self-Help & Productivity Book', 'Hardcover Daily Planner', 'Premium Rollerball Pen', 'Artist Sketchbook & Colors', 'Office Desk Organizer'],
  'automotive': ['Car Dashboard Phone Mount', 'High-Pressure Car Vacuum Cleaner', 'Microfiber Cleaning Cloth Set', 'Universal Car Seat Cushion', 'Tubeless Tyre Inflator Gauge', 'All-Weather Bike Cover']
};

// Master Brands / Manufacturers List
const MASTER_BRANDS = [
  'Apna Mart Choice',
  'Boat Lifestyle',
  'Noise',
  'Fire-Boltt',
  'Prestige',
  'Hawkins',
  'Milton',
  'Puma',
  'Campus',
  'FabIndia',
  'Allen Solly',
  'Peter England',
  'Biba',
  'W for Woman',
  'Mamaearth',
  'Plum Goodness',
  'The Man Company',
  'Penguin India',
  'Classmate',
  'Handcrafted / Artisan Choice'
];

// LocalStorage helpers for custom user additions
function getCustomProductTypes() {
  try {
    const raw = localStorage.getItem('apna_custom_product_types');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveCustomProductType(name, category = 'all') {
  const list = getCustomProductTypes();
  if (!list.some(item => (typeof item === 'string' ? item : item.name).toLowerCase() === name.toLowerCase())) {
    list.push({ name, category });
    localStorage.setItem('apna_custom_product_types', JSON.stringify(list));
  }
}

function getCustomBrands() {
  try {
    const raw = localStorage.getItem('apna_custom_brands');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveCustomBrand(name) {
  const list = getCustomBrands();
  if (!list.some(item => item.toLowerCase() === name.toLowerCase())) {
    list.push(name);
    localStorage.setItem('apna_custom_brands', JSON.stringify(list));
  }
}

// Toast notification helper
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

document.addEventListener('DOMContentLoaded', () => {
  requireAdminAuth(async () => {
    initDropdowns();
    initModalHandlers();
    initWizardEvents();
    initCharCounters();
    initAiAutoFill();
    
    // Check if editing existing product via ?id=...
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (productId) {
      editingProductId = productId;
      await loadProductForEditing(productId);
    } else {
      // Initialize default rows
      addFeatureRow('');
      addFbRow('', '');
      addSpecRow('', '');
      addFaqRow('', '');
      autoGenerateSlug();
    }
  });
});

// Initialize Categories, Product Types and Brand Dropdowns
function initDropdowns() {
  populateCategorySelect();
  populateProductTypeSelect();
  populateBrandSelect();

  const categorySelect = document.getElementById('p-category');
  if (categorySelect) {
    categorySelect.addEventListener('change', (e) => {
      const selectedCat = e.target.value;
      populateProductTypeSelect(selectedCat);
    });
  }
}

function populateCategorySelect() {
  const select = document.getElementById('p-category');
  const modalSelect = document.getElementById('new-product-type-category-select');

  if (select) {
    const currentVal = select.value;
    select.innerHTML = '<option value="">-- Select Category (25 Collections) --</option>' + 
      CATEGORIES.map(cat => `<option value="${cat.slug}">${cat.name}</option>`).join('');
    if (currentVal) select.value = currentVal;
  }

  if (modalSelect) {
    modalSelect.innerHTML = '<option value="all">All / Any Category</option>' + 
      CATEGORIES.map(cat => `<option value="${cat.slug}">${cat.name}</option>`).join('');
  }
}

function populateProductTypeSelect(categorySlug = null, selectValue = null) {
  const select = document.getElementById('p-product-type');
  if (!select) return;

  const currentCat = categorySlug || document.getElementById('p-category')?.value;
  const currentVal = selectValue || select.value;

  let optionsList = [];

  // Category specific product types
  if (currentCat && CATEGORY_PRODUCT_TYPES[currentCat]) {
    optionsList.push({ group: `Standard Types (${currentCat.replace(/-/g, ' ')})`, items: CATEGORY_PRODUCT_TYPES[currentCat] });
  }

  // Custom user types
  const customTypes = getCustomProductTypes();
  const filteredCustom = customTypes
    .filter(t => typeof t === 'string' || !t.category || t.category === 'all' || t.category === currentCat)
    .map(t => typeof t === 'string' ? t : t.name);

  if (filteredCustom.length > 0) {
    optionsList.push({ group: 'Custom Added Types', items: filteredCustom });
  }

  // Fallback general types
  const generalTypes = [
    'Apparel & Fashion Wear',
    'Electronics & Gadgets',
    'Home & Kitchen Appliance',
    'Beauty & Personal Care',
    'Home Decor & Accents',
    'Books & Stationery',
    'Sports & Fitness Gear',
    'Handcrafted Gift Item'
  ];
  optionsList.push({ group: 'Other Common Types', items: generalTypes });

  let html = '<option value="">-- Select Product Type / Subtype --</option>';
  optionsList.forEach(grp => {
    html += `<optgroup label="${grp.group}">`;
    grp.items.forEach(item => {
      html += `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`;
    });
    html += `</optgroup>`;
  });

  select.innerHTML = html;

  if (currentVal) {
    // If the saved value is not present in options, append it dynamically
    const exists = Array.from(select.options).some(opt => opt.value.toLowerCase() === currentVal.toLowerCase());
    if (!exists && currentVal.trim() !== '') {
      const newOpt = document.createElement('option');
      newOpt.value = currentVal;
      newOpt.textContent = currentVal;
      newOpt.selected = true;
      select.appendChild(newOpt);
    } else {
      select.value = currentVal;
    }
  }
}

function populateBrandSelect(selectValue = null) {
  const select = document.getElementById('p-brand');
  if (!select) return;

  const currentVal = selectValue || select.value;
  const customBrands = getCustomBrands();

  let html = '<option value="">-- Select Brand / Manufacturer --</option>';

  if (customBrands.length > 0) {
    html += `<optgroup label="Custom Added Brands">`;
    customBrands.forEach(b => {
      html += `<option value="${escapeHtml(b)}">${escapeHtml(b)}</option>`;
    });
    html += `</optgroup>`;
  }

  html += `<optgroup label="Respected Manufacturers & Brands">`;
  MASTER_BRANDS.forEach(b => {
    html += `<option value="${escapeHtml(b)}">${escapeHtml(b)}</option>`;
  });
  html += `</optgroup>`;

  select.innerHTML = html;

  if (currentVal) {
    const exists = Array.from(select.options).some(opt => opt.value.toLowerCase() === currentVal.toLowerCase());
    if (!exists && currentVal.trim() !== '') {
      const newOpt = document.createElement('option');
      newOpt.value = currentVal;
      newOpt.textContent = currentVal;
      newOpt.selected = true;
      select.appendChild(newOpt);
    } else {
      select.value = currentVal;
    }
  }
}

// Modal Handlers for "+ Add Product Type" & "+ Add Manufacturer"
function initModalHandlers() {
  // Product Type Modal
  const openTypeBtn = document.getElementById('open-add-product-type-modal-btn');
  const closeTypeBtn = document.getElementById('close-add-product-type-modal-btn');
  const cancelTypeBtn = document.getElementById('cancel-add-product-type-btn');
  const saveTypeBtn = document.getElementById('save-new-product-type-btn');
  const typeModal = document.getElementById('add-product-type-modal');
  const typeInput = document.getElementById('new-product-type-input');
  const typeCatSelect = document.getElementById('new-product-type-category-select');

  const openTypeModal = () => {
    if (typeInput) typeInput.value = '';
    const currentCat = document.getElementById('p-category')?.value;
    if (typeCatSelect && currentCat) typeCatSelect.value = currentCat;
    if (typeModal) typeModal.classList.remove('hidden');
    typeInput?.focus();
  };

  const closeTypeModal = () => {
    if (typeModal) typeModal.classList.add('hidden');
  };

  if (openTypeBtn) openTypeBtn.addEventListener('click', openTypeModal);
  if (closeTypeBtn) closeTypeBtn.addEventListener('click', closeTypeModal);
  if (cancelTypeBtn) cancelTypeBtn.addEventListener('click', closeTypeModal);

  if (saveTypeBtn) {
    saveTypeBtn.addEventListener('click', () => {
      const val = typeInput?.value.trim();
      if (!val) {
        showToast('Please enter a product type name', 'error');
        return;
      }
      const cat = typeCatSelect?.value || 'all';
      saveCustomProductType(val, cat);
      populateProductTypeSelect(cat === 'all' ? null : cat, val);
      closeTypeModal();
      showToast(`Product Type "${val}" added and selected!`);
    });
  }

  // Brand / Manufacturer Modal
  const openBrandBtn = document.getElementById('open-add-brand-modal-btn');
  const closeBrandBtn = document.getElementById('close-add-brand-modal-btn');
  const cancelBrandBtn = document.getElementById('cancel-add-brand-btn');
  const saveBrandBtn = document.getElementById('save-new-brand-btn');
  const brandModal = document.getElementById('add-brand-modal');
  const brandInput = document.getElementById('new-brand-input');

  const openBrandModal = () => {
    if (brandInput) brandInput.value = '';
    if (brandModal) brandModal.classList.remove('hidden');
    brandInput?.focus();
  };

  const closeBrandModal = () => {
    if (brandModal) brandModal.classList.add('hidden');
  };

  if (openBrandBtn) openBrandBtn.addEventListener('click', openBrandModal);
  if (closeBrandBtn) closeBrandBtn.addEventListener('click', closeBrandModal);
  if (cancelBrandBtn) cancelBrandBtn.addEventListener('click', closeBrandModal);

  if (saveBrandBtn) {
    saveBrandBtn.addEventListener('click', () => {
      const val = brandInput?.value.trim();
      if (!val) {
        showToast('Please enter a manufacturer or brand name', 'error');
        return;
      }
      saveCustomBrand(val);
      populateBrandSelect(val);
      closeBrandModal();
      showToast(`Manufacturer "${val}" added and selected!`);
    });
  }
}

function initWizardEvents() {
  // Step Navigation Buttons
  const nextBtn = document.getElementById('wizard-next-btn');
  const prevBtn = document.getElementById('wizard-prev-btn');
  const saveDraftBtn = document.getElementById('wizard-save-draft-btn');
  const headerDraftBtn = document.getElementById('header-save-draft-btn');
  const headerPublishBtn = document.getElementById('header-publish-btn');

  if (nextBtn) nextBtn.addEventListener('click', handleNextStep);
  if (prevBtn) prevBtn.addEventListener('click', handlePrevStep);
  if (saveDraftBtn) saveDraftBtn.addEventListener('click', () => saveProduct(false));
  if (headerDraftBtn) headerDraftBtn.addEventListener('click', () => saveProduct(false));
  if (headerPublishBtn) headerPublishBtn.addEventListener('click', () => saveProduct(true));

  // Tab Header Direct Click
  const tabButtons = document.querySelectorAll('.wizard-step-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetStep = parseInt(btn.getAttribute('data-step'), 10);
      if (targetStep < currentStep || validateStep(currentStep)) {
        goToStep(targetStep);
      }
    });
  });

  // Dynamic Row Addition Buttons
  const addFeatureBtn = document.getElementById('add-feature-row-btn');
  const addFbBtn = document.getElementById('add-fb-row-btn');
  const addFaqBtn = document.getElementById('add-faq-row-btn');
  const addSpecBtn = document.getElementById('add-spec-row-btn');

  if (addFeatureBtn) addFeatureBtn.addEventListener('click', () => addFeatureRow(''));
  if (addFbBtn) addFbBtn.addEventListener('click', () => addFbRow('', ''));
  if (addFaqBtn) addFaqBtn.addEventListener('click', () => addFaqRow('', ''));
  if (addSpecBtn) addSpecBtn.addEventListener('click', () => addSpecRow('', ''));

  // SEO & Slug Generation
  const nameInput = document.getElementById('p-name');
  const regenSlugBtn = document.getElementById('regenerate-slug-btn');
  const syncSeoBtn = document.getElementById('sync-seo-btn');

  if (nameInput) {
    nameInput.addEventListener('input', () => {
      if (!editingProductId) {
        autoGenerateSlug();
      }
    });
  }
  if (regenSlugBtn) regenSlugBtn.addEventListener('click', autoGenerateSlug);
  if (syncSeoBtn) syncSeoBtn.addEventListener('click', syncSeoWithBasicInfo);

  // Image Upload / Add URL
  const addUrlBtn = document.getElementById('add-url-btn');
  const urlField = document.getElementById('image-url-field');
  const dropBox = document.getElementById('image-drop-box');
  const fileInput = document.getElementById('image-file-input');

  if (addUrlBtn && urlField) {
    addUrlBtn.addEventListener('click', () => {
      const val = urlField.value.trim();
      if (val) {
        uploadedImages.push(val);
        urlField.value = '';
        renderImagesGrid();
        showToast('Image URL added to gallery');
      }
    });
  }

  if (dropBox && fileInput) {
    dropBox.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        uploadFilesToCloudinaryOrBase64(e.target.files);
      }
    });
  }
}

function initCharCounters() {
  const metaTitle = document.getElementById('p-meta-title');
  const metaDesc = document.getElementById('p-meta-desc');
  const ogTitle = document.getElementById('p-og-title');
  const ogDesc = document.getElementById('p-og-desc');

  const updateCount = (input, counterId, max) => {
    if (!input) return;
    const counter = document.getElementById(counterId);
    const len = input.value.length;
    if (counter) counter.textContent = `${len} / ${max} chars`;
  };

  if (metaTitle) metaTitle.addEventListener('input', () => updateCount(metaTitle, 'meta-title-counter', 60));
  if (metaDesc) metaDesc.addEventListener('input', () => updateCount(metaDesc, 'meta-desc-counter', 160));
  if (ogTitle) ogTitle.addEventListener('input', () => updateCount(ogTitle, 'og-title-counter', 60));
  if (ogDesc) ogDesc.addEventListener('input', () => updateCount(ogDesc, 'og-desc-counter', 160));
}

// Step Navigation
function goToStep(step) {
  if (step < 1 || step > TOTAL_STEPS) return;

  for (let i = 1; i <= TOTAL_STEPS; i++) {
    const pane = document.getElementById(`step-pane-${i}`);
    if (pane) pane.classList.toggle('hidden', i !== step);
  }

  const tabButtons = document.querySelectorAll('.wizard-step-btn');
  tabButtons.forEach(btn => {
    const btnStep = parseInt(btn.getAttribute('data-step'), 10);
    const badge = btn.querySelector('div:first-child');
    
    if (btnStep === step) {
      btn.className = 'wizard-step-btn active flex items-center gap-2.5 p-2.5 rounded-xl text-left border transition-all text-xs font-bold cursor-pointer bg-emerald-50 border-emerald-500 text-emerald-800 shadow-2xs';
      if (badge) badge.className = 'w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 bg-emerald-600 text-white';
    } else if (btnStep < step) {
      btn.className = 'wizard-step-btn flex items-center gap-2.5 p-2.5 rounded-xl text-left border transition-all text-xs font-semibold cursor-pointer bg-white border-emerald-200 text-emerald-900 hover:bg-emerald-50/50';
      if (badge) badge.className = 'w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 bg-emerald-100 text-emerald-700';
    } else {
      btn.className = 'wizard-step-btn flex items-center gap-2.5 p-2.5 rounded-xl text-left border transition-all text-xs font-semibold cursor-pointer bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100';
      if (badge) badge.className = 'w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 bg-gray-200 text-gray-700';
    }
  });

  currentStep = step;

  const prevBtn = document.getElementById('wizard-prev-btn');
  const nextBtn = document.getElementById('wizard-next-btn');
  const stepNumEl = document.getElementById('current-step-num');

  if (prevBtn) prevBtn.disabled = currentStep === 1;
  if (stepNumEl) stepNumEl.textContent = currentStep.toString();

  if (nextBtn) {
    if (currentStep === TOTAL_STEPS) {
      nextBtn.innerHTML = `<span>Publish Product</span> <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>`;
      nextBtn.className = 'bg-emerald-600 hover:bg-emerald-700 text-white px-5 sm:px-7 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer';
    } else {
      nextBtn.innerHTML = `<span>Next Step</span> <span>&rarr;</span>`;
      nextBtn.className = 'bg-emerald-600 hover:bg-emerald-700 text-white px-5 sm:px-7 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer';
    }
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function handleNextStep() {
  if (currentStep === TOTAL_STEPS) {
    saveProduct(true);
    return;
  }

  if (validateStep(currentStep)) {
    goToStep(currentStep + 1);
  }
}

function handlePrevStep() {
  if (currentStep > 1) {
    goToStep(currentStep - 1);
  }
}

// Step-by-step Validation
function validateStep(step) {
  let isValid = true;
  let firstErrorEl = null;

  if (step === 1) {
    const name = document.getElementById('p-name');
    const category = document.getElementById('p-category');
    const price = document.getElementById('p-price');
    const shortDesc = document.getElementById('p-short-desc');

    [name, category, price, shortDesc].forEach(input => {
      if (!input || !input.value.trim()) {
        input?.classList.add('border-rose-500', 'bg-rose-50/30');
        if (!firstErrorEl) firstErrorEl = input;
        isValid = false;
      } else {
        input.classList.remove('border-rose-500', 'bg-rose-50/30');
      }
    });

    if (!isValid) {
      showToast('Please fill in all required fields in Step 1 (Title, Category, Price, Summary)', 'error');
    }
  }

  if (step === 4) {
    const slug = document.getElementById('p-slug');
    if (!slug || !slug.value.trim()) {
      slug?.classList.add('border-rose-500', 'bg-rose-50/30');
      if (!firstErrorEl) firstErrorEl = slug;
      isValid = false;
      showToast('Product URL Slug is required in Step 4', 'error');
    } else {
      slug.classList.remove('border-rose-500', 'bg-rose-50/30');
    }
  }

  if (step === 5) {
    const affiliateUrl = document.getElementById('p-affiliate-url');
    if (!affiliateUrl || !affiliateUrl.value.trim()) {
      affiliateUrl?.classList.add('border-rose-500', 'bg-rose-50/30');
      if (!firstErrorEl) firstErrorEl = affiliateUrl;
      isValid = false;
      showToast('Affiliate checkout URL is required in Step 5', 'error');
    } else {
      affiliateUrl.classList.remove('border-rose-500', 'bg-rose-50/30');
    }
  }

  if (firstErrorEl) {
    firstErrorEl.focus();
  }

  return isValid;
}

// Auto slug generator
function autoGenerateSlug() {
  const name = document.getElementById('p-name')?.value || '';
  const slugField = document.getElementById('p-slug');
  if (slugField && name) {
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    slugField.value = slug;
  }
}

// SEO Synchronization
function syncSeoWithBasicInfo() {
  const name = document.getElementById('p-name')?.value.trim() || '';
  const brand = document.getElementById('p-brand')?.value.trim() || '';
  const category = document.getElementById('p-category')?.value || '';
  const shortDesc = document.getElementById('p-short-desc')?.value.trim() || '';

  if (!name) {
    showToast('Please enter a product title in Step 1 before syncing SEO', 'error');
    return;
  }

  const metaTitle = document.getElementById('p-meta-title');
  const metaDesc = document.getElementById('p-meta-desc');
  const focusKeywords = document.getElementById('p-focus-keywords');
  const ogTitle = document.getElementById('p-og-title');
  const ogDesc = document.getElementById('p-og-desc');
  const ogImage = document.getElementById('p-og-image');

  if (metaTitle) metaTitle.value = `${name} | Best Price & Reviews`.slice(0, 60);
  if (metaDesc) metaDesc.value = (shortDesc || `Buy ${name} at verified merchant discount. Read reviews and specifications.`).slice(0, 160);
  if (focusKeywords) focusKeywords.value = `${name.toLowerCase()}, ${category.replace(/-/g, ' ')}, ${brand.toLowerCase()}, best deal`;
  if (ogTitle) ogTitle.value = `${name} - Verified Deal`.slice(0, 60);
  if (ogDesc) ogDesc.value = (shortDesc || `Explore ${name} with full buying guide and verified affiliate merchant prices.`).slice(0, 160);

  if (ogImage && uploadedImages.length > 0) {
    ogImage.value = uploadedImages[0];
  }

  initCharCounters();
  showToast('SEO & Social meta tags synced from product details');
}

// Dynamic Rows Helpers
function addFeatureRow(val = '') {
  const container = document.getElementById('feature-rows-container');
  if (!container) return;

  const div = document.createElement('div');
  div.className = 'flex items-center gap-2';
  div.innerHTML = `
    <input type="text" value="${escapeHtml(val)}" placeholder="e.g. 100% Breathable Combed Cotton Fabric" class="feature-item-input flex-1 px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500" />
    <button type="button" class="text-rose-500 hover:text-rose-700 p-1.5 transition-colors" onclick="this.parentElement.remove()" title="Remove feature">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
    </button>
  `;
  container.appendChild(div);
}

function addFbRow(feature = '', benefit = '') {
  const container = document.getElementById('fb-rows-container');
  if (!container) return;

  const div = document.createElement('div');
  div.className = 'grid grid-cols-1 sm:grid-cols-2 gap-2 p-2.5 rounded-xl border border-gray-200 bg-gray-50/60 relative group';
  div.innerHTML = `
    <input type="text" value="${escapeHtml(feature)}" placeholder="Feature (e.g. Combed Cotton)" class="fb-feature-input px-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-white" />
    <div class="flex items-center gap-2">
      <input type="text" value="${escapeHtml(benefit)}" placeholder="Benefit (e.g. Keeps cool in hot weather)" class="fb-benefit-input flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-white" />
      <button type="button" class="text-rose-500 hover:text-rose-700 p-1 transition-colors" onclick="this.parentElement.parentElement.remove()" title="Remove pair">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>
  `;
  container.appendChild(div);
}

function addFaqRow(q = '', a = '') {
  const container = document.getElementById('faq-rows-container');
  if (!container) return;

  const div = document.createElement('div');
  div.className = 'space-y-1.5 p-3 rounded-xl border border-gray-200 bg-gray-50/60 relative group';
  div.innerHTML = `
    <div class="flex items-center justify-between">
      <span class="text-[10px] font-bold uppercase text-gray-400">FAQ Question</span>
      <button type="button" class="text-rose-500 hover:text-rose-700 p-0.5" onclick="this.parentElement.parentElement.remove()">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>
    <input type="text" value="${escapeHtml(q)}" placeholder="Question (e.g. Is the fabric transparent?)" class="faq-q-input w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-white font-medium" />
    <textarea rows="2" placeholder="Scholarly/merchant answer..." class="faq-a-input w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-white">${escapeHtml(a)}</textarea>
  `;
  container.appendChild(div);
}

function addSpecRow(key = '', val = '') {
  const container = document.getElementById('spec-rows-container');
  if (!container) return;

  const div = document.createElement('div');
  div.className = 'flex items-center gap-2';
  div.innerHTML = `
    <input type="text" value="${escapeHtml(key)}" placeholder="Attribute (e.g. Material)" class="spec-key-input w-1/3 px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white font-semibold" />
    <input type="text" value="${escapeHtml(val)}" placeholder="Value (e.g. 100% Combed Cotton)" class="spec-val-input flex-1 px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white" />
    <button type="button" class="text-rose-500 hover:text-rose-700 p-1.5 transition-colors" onclick="this.parentElement.remove()" title="Remove spec">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
    </button>
  `;
  container.appendChild(div);
}

// Media Rendering
function renderImagesGrid() {
  const container = document.getElementById('images-preview-grid');
  if (!container) return;

  if (uploadedImages.length === 0) {
    container.innerHTML = `<div class="col-span-full text-center text-xs text-gray-400 py-3">No images added yet. Add a direct URL or upload a file.</div>`;
    renderAiThumbnailsStrip();
    return;
  }

  container.innerHTML = uploadedImages.map((img, idx) => `
    <div class="relative group rounded-xl border ${idx === 0 ? 'border-emerald-500 ring-2 ring-emerald-400/50' : 'border-gray-200'} bg-white overflow-hidden aspect-square shadow-2xs">
      <img src="${img}" alt="Preview ${idx + 1}" class="w-full h-full object-cover" />
      
      ${idx === 0 ? `<span class="absolute top-1 left-1 bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs">PRIMARY</span>` : ''}

      <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1">
        ${idx !== 0 ? `
          <button type="button" class="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2 py-1 rounded transition-colors" onclick="makeImagePrimary(${idx})">
            Set Primary
          </button>
        ` : ''}
        <button type="button" class="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold px-2 py-1 rounded transition-colors" onclick="removeImage(${idx})">
          Remove
        </button>
      </div>
    </div>
  `).join('');

  renderAiThumbnailsStrip();
}

window.removeImage = (idx) => {
  uploadedImages.splice(idx, 1);
  renderImagesGrid();
};

window.makeImagePrimary = (idx) => {
  const [target] = uploadedImages.splice(idx, 1);
  uploadedImages.unshift(target);
  renderImagesGrid();
};

// File Upload Support
async function uploadFilesToCloudinaryOrBase64(files) {
  const settings = JSON.parse(localStorage.getItem('tariqu_mart_settings') || '{}');
  const cloudName = settings.cloudinaryCloudName;
  const preset = settings.cloudinaryUploadPreset;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    if (cloudName && preset) {
      try {
        showToast(`Uploading ${file.name} to Cloudinary...`, 'info');
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', preset);

        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (data.secure_url) {
          uploadedImages.push(data.secure_url);
          renderImagesGrid();
          showToast(`${file.name} uploaded successfully!`);
        }
      } catch (err) {
        console.error('Cloudinary upload error:', err);
        showToast(`Failed to upload ${file.name}`, 'error');
      }
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        uploadedImages.push(e.target.result);
        renderImagesGrid();
      };
      reader.readAsDataURL(file);
      showToast('Image added to gallery');
    }
  }
}

// ==========================================
// AI AUTO-FILL CONTROLLER (HINGLISH ENGINE)
// ==========================================
let aiIsLoading = false;

function initAiAutoFill() {
  const dropzone = document.getElementById('ai-dropzone');
  const fileInput = document.getElementById('ai-image-file-input');
  const addUrlBtn = document.getElementById('ai-add-url-btn');
  const urlInput = document.getElementById('ai-image-url-input');
  const generateBtn = document.getElementById('ai-generate-all-btn');
  const step3AiBtn = document.getElementById('step3-ai-autofill-btn');
  const clearImagesBtn = document.getElementById('ai-clear-images-btn');

  // Drag & drop on AI banner
  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => fileInput.click());

    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('border-amber-400', 'bg-emerald-900/80', 'scale-[1.01]');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('border-amber-400', 'bg-emerald-900/80', 'scale-[1.01]');
      }, false);
    });

    dropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      if (dt && dt.files && dt.files.length > 0) {
        handleAiImagesUpload(dt.files);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleAiImagesUpload(e.target.files);
      }
    });
  }

  // Add by URL
  if (addUrlBtn && urlInput) {
    addUrlBtn.addEventListener('click', () => {
      const val = urlInput.value.trim();
      if (!val) {
        showToast('Please enter an image URL', 'error');
        return;
      }
      uploadedImages.push(val);
      urlInput.value = '';
      renderImagesGrid();
      showToast('Image added to gallery. Click "Generate All Details with AI" when ready.', 'success');
    });

    urlInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addUrlBtn.click();
      }
    });
  }

  // Clear all images
  if (clearImagesBtn) {
    clearImagesBtn.addEventListener('click', () => {
      uploadedImages = [];
      renderImagesGrid();
      showToast('All product photos cleared');
    });
  }

  // Affiliate link synchronization between AI banner and Step 5
  const aiAffiliateInput = document.getElementById('ai-affiliate-url-input');
  const pAffiliateInput = document.getElementById('p-affiliate-url');

  if (aiAffiliateInput) {
    aiAffiliateInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      if (pAffiliateInput && pAffiliateInput.value !== val) {
        pAffiliateInput.value = val;
      }
      autoDetectAffiliatePlatform(val);
    });
  }

  if (pAffiliateInput) {
    pAffiliateInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      if (aiAffiliateInput && aiAffiliateInput.value !== val) {
        aiAffiliateInput.value = val;
      }
      autoDetectAffiliatePlatform(val);
    });
  }

  // Main Generate Button
  if (generateBtn) {
    generateBtn.addEventListener('click', () => {
      triggerAiAutoFill();
    });
  }

  // Step 3 Quick AI Button
  if (step3AiBtn) {
    step3AiBtn.addEventListener('click', () => {
      triggerAiAutoFill();
    });
  }

  // Initial check if ?ai=1 is present in URL
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('ai') === '1') {
    setTimeout(() => {
      const aiCard = document.getElementById('ai-autofill-card');
      if (aiCard) {
        aiCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        aiCard.classList.add('ring-4', 'ring-amber-400');
        setTimeout(() => aiCard.classList.remove('ring-4', 'ring-amber-400'), 2500);
      }
    }, 400);
  }
}

async function handleAiImagesUpload(files) {
  const settings = JSON.parse(localStorage.getItem('tariqu_mart_settings') || '{}');
  const cloudName = settings.cloudinaryCloudName;
  const preset = settings.cloudinaryUploadPreset;

  showToast(`Processing ${files.length} product photo(s)...`, 'info');

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    if (cloudName && preset) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', preset);

        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (data.secure_url) {
          uploadedImages.push(data.secure_url);
        }
      } catch (err) {
        console.warn('Cloudinary upload error, falling back to base64:', err);
        const base64 = await readFileAsBase64(file);
        uploadedImages.push(base64);
      }
    } else {
      const base64 = await readFileAsBase64(file);
      uploadedImages.push(base64);
    }
  }

  renderImagesGrid();
  showToast(`Added ${files.length} photo(s) to gallery. Upload more or click "Generate All Details with AI".`, 'success');
}

function readFileAsBase64(file) {
  return new Promise((resolve) => {
    // If SVG or very small file (< 300KB), return directly as DataURL
    if (file.type === 'image/svg+xml' || file.size < 300 * 1024) {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
      return;
    }

    // For larger phone/DSLR images, compress to max 1280px to prevent 503 high-demand payload timeouts
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1280;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        } else {
          resolve(readerEvent.target.result);
        }
      };
      img.onerror = () => resolve(readerEvent.target.result);
      img.src = readerEvent.target.result;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

function renderAiThumbnailsStrip() {
  const strip = document.getElementById('ai-images-strip');
  const container = document.getElementById('ai-thumbnails-container');
  if (!strip || !container) return;

  if (uploadedImages.length === 0) {
    strip.classList.add('hidden');
    container.innerHTML = '';
    return;
  }

  strip.classList.remove('hidden');
  container.innerHTML = uploadedImages.map((img, idx) => `
    <div class="relative group w-14 h-14 rounded-lg overflow-hidden border ${idx === 0 ? 'border-amber-400 ring-2 ring-amber-400/50' : 'border-emerald-500/40'} bg-black/40 shadow-xs shrink-0">
      <img src="${img}" alt="Thumbnail ${idx + 1}" class="w-full h-full object-cover" />
      ${idx === 0 ? `<span class="absolute top-0.5 left-0.5 bg-amber-400 text-gray-950 font-black text-[8px] px-1 rounded">MAIN</span>` : ''}
      <button type="button" class="absolute inset-0 bg-red-900/80 text-white font-bold text-[10px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center" onclick="removeAiImage(${idx})">
        ✕
      </button>
    </div>
  `).join('');
}

window.removeAiImage = (idx) => {
  uploadedImages.splice(idx, 1);
  renderImagesGrid();
};

function autoDetectAffiliatePlatform(url) {
  if (!url) return;
  const u = url.toLowerCase();
  const platformEl = document.getElementById('p-platform');
  const ctaEl = document.getElementById('p-cta-text');
  if (!platformEl) return;

  if (u.includes('amazon.')) {
    platformEl.value = 'Amazon';
    if (ctaEl && (!ctaEl.value || ctaEl.value.includes('Check Price') || ctaEl.value.includes('Buy'))) {
      ctaEl.value = 'Check Price on Amazon';
    }
  } else if (u.includes('flipkart.')) {
    platformEl.value = 'Flipkart';
    if (ctaEl && (!ctaEl.value || ctaEl.value.includes('Check Price') || ctaEl.value.includes('Buy'))) {
      ctaEl.value = 'Buy on Flipkart';
    }
  } else if (u.includes('myntra.')) {
    platformEl.value = 'Myntra';
    if (ctaEl && (!ctaEl.value || ctaEl.value.includes('Check Price') || ctaEl.value.includes('Buy'))) {
      ctaEl.value = 'Shop on Myntra';
    }
  } else if (u.includes('meesho.')) {
    platformEl.value = 'Meesho';
    if (ctaEl && (!ctaEl.value || ctaEl.value.includes('Check Price') || ctaEl.value.includes('Buy'))) {
      ctaEl.value = 'Buy on Meesho';
    }
  } else if (u.includes('ajio.')) {
    platformEl.value = 'Ajio';
    if (ctaEl && (!ctaEl.value || ctaEl.value.includes('Check Price') || ctaEl.value.includes('Buy'))) {
      ctaEl.value = 'Shop on Ajio';
    }
  }
}

async function triggerAiAutoFill() {
  if (aiIsLoading) return;

  if (uploadedImages.length === 0) {
    showToast('Please upload or select at least 1 product image first.', 'error');
    const dropzone = document.getElementById('ai-dropzone');
    if (dropzone) {
      dropzone.scrollIntoView({ behavior: 'smooth', block: 'center' });
      dropzone.classList.add('ring-4', 'ring-amber-400');
      setTimeout(() => dropzone.classList.remove('ring-4', 'ring-amber-400'), 1500);
    }
    return;
  }

  aiIsLoading = true;
  const generateBtn = document.getElementById('ai-generate-all-btn');
  const btnText = document.getElementById('ai-generate-btn-text');
  const statusContainer = document.getElementById('ai-status-container');
  const statusText = document.getElementById('ai-status-text');
  const step3AiBtn = document.getElementById('step3-ai-autofill-btn');

  if (generateBtn) generateBtn.disabled = true;
  if (step3AiBtn) step3AiBtn.disabled = true;
  if (statusContainer) statusContainer.classList.remove('hidden');

  const customHint = document.getElementById('ai-custom-hint')?.value.trim() || '';
  const currentTitle = document.getElementById('p-name')?.value.trim() || '';
  const currentCategory = document.getElementById('p-category')?.value || '';
  const affiliateUrl = document.getElementById('ai-affiliate-url-input')?.value.trim() || document.getElementById('p-affiliate-url')?.value.trim() || '';

  const updateStatus = (msg) => {
    if (statusText) statusText.textContent = msg;
    if (btnText) btnText.textContent = `⏳ ${msg}`;
  };

  updateStatus('Analyzing product images with Gemini AI...');

  const timer1 = setTimeout(() => {
    if (aiIsLoading) updateStatus('Identifying materials, category & product features...');
  }, 2200);

  const timer2 = setTimeout(() => {
    if (aiIsLoading) updateStatus('Writing natural Indian English overview, bullet points & benefits...');
  }, 5000);

  const timer3 = setTimeout(() => {
    if (aiIsLoading) updateStatus('Generating Indian English FAQs, Pros/Cons & SEO meta tags...');
  }, 8500);

  try {
    const res = await fetch('/api/ai/fill-product-details', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        images: uploadedImages,
        existingName: currentTitle,
        existingCategory: currentCategory,
        affiliateUrl: affiliateUrl,
        customPrompt: customHint
      })
    });

    clearTimeout(timer1);
    clearTimeout(timer2);
    clearTimeout(timer3);

    const result = await res.json();

    if (!res.ok || !result.success || !result.data) {
      throw new Error(result.error || 'Failed to generate product details with AI');
    }

    const p = result.data;

    // 1. Populate Step 1: Basic Info
    const nameEl = document.getElementById('p-name');
    if (nameEl && p.name) {
      nameEl.value = p.name;
      flashHighlight(nameEl);
    }

    const catEl = document.getElementById('p-category');
    if (catEl && p.category) {
      catEl.value = p.category;
      flashHighlight(catEl);
    }

    populateProductTypeSelect(p.category || catEl?.value, p.productType);
    const typeEl = document.getElementById('p-product-type');
    if (typeEl && p.productType) flashHighlight(typeEl);

    populateBrandSelect(p.brand);
    const brandEl = document.getElementById('p-brand');
    if (brandEl && p.brand) flashHighlight(brandEl);

    const ratingEl = document.getElementById('p-rating');
    if (ratingEl && p.rating) {
      ratingEl.value = p.rating;
      flashHighlight(ratingEl);
    }

    const priceEl = document.getElementById('p-price');
    if (priceEl && p.price) {
      priceEl.value = p.price;
      flashHighlight(priceEl);
    }

    const oldPriceEl = document.getElementById('p-old-price');
    if (oldPriceEl && p.oldPrice) {
      oldPriceEl.value = p.oldPrice;
      flashHighlight(oldPriceEl);
    }

    const shortDescEl = document.getElementById('p-short-desc');
    if (shortDescEl && p.shortDescription) {
      shortDescEl.value = p.shortDescription;
      flashHighlight(shortDescEl);
    }

    // 2. Populate Step 2: Highlights & Content in Hinglish
    const descEl = document.getElementById('p-description');
    if (descEl && p.description) {
      descEl.value = p.description;
      flashHighlight(descEl);
    }

    // Clear & populate Features
    const featContainer = document.getElementById('feature-rows-container');
    if (featContainer) {
      featContainer.innerHTML = '';
      if (Array.isArray(p.features) && p.features.length > 0) {
        p.features.forEach(f => addFeatureRow(f));
      } else {
        addFeatureRow('');
      }
      flashHighlight(featContainer);
    }

    // Clear & populate Features & Benefits
    const fbContainer = document.getElementById('fb-rows-container');
    if (fbContainer) {
      fbContainer.innerHTML = '';
      if (Array.isArray(p.featuresAndBenefits) && p.featuresAndBenefits.length > 0) {
        p.featuresAndBenefits.forEach(fb => addFbRow(fb.feature, fb.benefit));
      } else {
        addFbRow('', '');
      }
      flashHighlight(fbContainer);
    }

    // Why Buy & Buying Guide
    const wybAdv = document.getElementById('wyb-adv');
    const wybUse = document.getElementById('wyb-use');
    const bgWho = document.getElementById('bg-who');
    const bgConsider = document.getElementById('bg-consider');

    if (wybAdv && p.whyBuy?.advantages) { wybAdv.value = p.whyBuy.advantages; flashHighlight(wybAdv); }
    if (wybUse && p.whyBuy?.useCases) { wybUse.value = p.whyBuy.useCases; flashHighlight(wybUse); }
    if (bgWho && p.buyingGuide?.whoShouldBuy) { bgWho.value = p.buyingGuide.whoShouldBuy; flashHighlight(bgWho); }
    if (bgConsider && p.buyingGuide?.considerations) { bgConsider.value = p.buyingGuide.considerations; flashHighlight(bgConsider); }

    // FAQs
    const faqContainer = document.getElementById('faq-rows-container');
    if (faqContainer) {
      faqContainer.innerHTML = '';
      if (Array.isArray(p.faqs) && p.faqs.length > 0) {
        p.faqs.forEach(f => addFaqRow(f.question, f.answer));
      } else {
        addFaqRow('', '');
      }
      flashHighlight(faqContainer);
    }

    // Pros & Cons
    const prosEl = document.getElementById('p-pros-input');
    const consEl = document.getElementById('p-cons-input');
    if (prosEl && Array.isArray(p.pros)) { prosEl.value = p.pros.join('\n'); flashHighlight(prosEl); }
    if (consEl && Array.isArray(p.cons)) { consEl.value = p.cons.join('\n'); flashHighlight(consEl); }

    const fvEl = document.getElementById('fv-rec');
    if (fvEl && p.finalVerdict) { fvEl.value = p.finalVerdict; flashHighlight(fvEl); }

    // 3. Step 3: Specifications Key-Values
    const specContainer = document.getElementById('spec-rows-container');
    if (specContainer) {
      specContainer.innerHTML = '';
      let addedSpecCount = 0;

      // Handle Array format: [{ key: 'Material', value: 'Cotton' }, ...]
      if (Array.isArray(p.specifications) && p.specifications.length > 0) {
        p.specifications.forEach(item => {
          if (item && typeof item === 'object') {
            const k = item.key || item.name || item.attribute || item.title || Object.keys(item)[0] || '';
            const v = item.value !== undefined ? item.value : (item.val || item.description || (item[k] !== undefined ? item[k] : ''));
            if (k && v !== undefined && typeof v !== 'object') {
              addSpecRow(k, String(v));
              addedSpecCount++;
            }
          } else if (typeof item === 'string' && item.includes(':')) {
            const [k, ...rest] = item.split(':');
            addSpecRow(k.trim(), rest.join(':').trim());
            addedSpecCount++;
          }
        });
      } 
      // Handle Object format: { "Material": "100% Cotton", "Color": "White" }
      else if (p.specifications && typeof p.specifications === 'object') {
        Object.entries(p.specifications).forEach(([k, v]) => {
          if (k && v !== undefined && typeof v !== 'object') {
            addSpecRow(k, String(v));
            addedSpecCount++;
          } else if (k && typeof v === 'object' && v !== null) {
            const subVal = v.value || v.val || JSON.stringify(v);
            addSpecRow(k, String(subVal));
            addedSpecCount++;
          }
        });
      }

      // If specifications were missing, provide contextual defaults
      if (addedSpecCount === 0) {
        const cat = (p.category || '').toLowerCase();
        if (cat.includes('men') || cat.includes('women') || cat.includes('fashion') || cat.includes('clothing')) {
          addSpecRow('Material / Fabric', '100% Pure Breathable Cotton / Premium Blend');
          addSpecRow('Fit Type', 'Regular Comfort Fit');
          addSpecRow('Care Instructions', 'Machine Wash / Gentle Hand Wash');
          addSpecRow('Country of Origin', 'India');
        } else if (cat.includes('electronics')) {
          addSpecRow('Connectivity', 'Bluetooth / Wireless / USB-C');
          addSpecRow('Warranty', '1 Year Brand Warranty');
          addSpecRow('Country of Origin', 'India');
        } else {
          addSpecRow('Category', p.category ? p.category.replace(/-/g, ' ').toUpperCase() : 'Lifestyle');
          addSpecRow('Quality Standard', '100% Quality Inspected');
          addSpecRow('Country of Origin', 'India');
        }
      }
      flashHighlight(specContainer);
    }

    // 4. Step 4: SEO & Meta
    autoGenerateSlug();
    const slugEl = document.getElementById('p-slug');
    if (slugEl) flashHighlight(slugEl);

    const metaTitleEl = document.getElementById('p-meta-title');
    if (metaTitleEl) {
      metaTitleEl.value = (p.metaTitle || `${p.name} | Best Price & Reviews`).slice(0, 60);
      flashHighlight(metaTitleEl);
    }

    const focusKwEl = document.getElementById('p-focus-keywords');
    if (focusKwEl) {
      focusKwEl.value = p.focusKeywords || `${p.name.toLowerCase()}, ${p.category?.replace(/-/g, ' ')}, buy online`;
      flashHighlight(focusKwEl);
    }

    const metaDescEl = document.getElementById('p-meta-desc');
    if (metaDescEl) {
      metaDescEl.value = (p.metaDescription || p.shortDescription || '').slice(0, 160);
      flashHighlight(metaDescEl);
    }

    const ogTitleEl = document.getElementById('p-og-title');
    if (ogTitleEl) {
      ogTitleEl.value = (p.name || '').slice(0, 60);
      flashHighlight(ogTitleEl);
    }

    const ogDescEl = document.getElementById('p-og-desc');
    if (ogDescEl) {
      ogDescEl.value = (p.metaDescription || p.shortDescription || '').slice(0, 160);
      flashHighlight(ogDescEl);
    }

    const ogImgEl = document.getElementById('p-og-image');
    if (ogImgEl && uploadedImages.length > 0) {
      ogImgEl.value = uploadedImages[0];
      flashHighlight(ogImgEl);
    }

    initCharCounters();

    // 5. Step 5: Affiliate CTA text & Flags
    if (p.ctaText) {
      const ctaEl = document.getElementById('p-cta-text');
      if (ctaEl) { ctaEl.value = p.ctaText; flashHighlight(ctaEl); }
    }
    if (typeof p.isTrending === 'boolean') {
      const trendEl = document.getElementById('p-is-trending');
      if (trendEl) trendEl.checked = p.isTrending;
    }
    if (typeof p.hotDeal === 'boolean') {
      const hotEl = document.getElementById('p-is-hotdeal');
      if (hotEl) hotEl.checked = p.hotDeal;
    }

    // Success feedback
    showToast('✨ AI Magic: All 5 steps successfully populated in Indian English!');
    if (statusText) statusText.textContent = 'Completed! All 5 steps filled in Indian English.';

  } catch (err) {
    console.error('AI Auto-Fill error:', err);
    showToast(`AI Auto-Fill error: ${err.message || 'Check server connection'}`, 'error');
    if (statusText) statusText.textContent = `Failed: ${err.message || 'Error occurred'}`;
  } finally {
    aiIsLoading = false;
    if (generateBtn) generateBtn.disabled = false;
    if (step3AiBtn) step3AiBtn.disabled = false;
    if (btnText) btnText.textContent = '✨ Generate All Details with AI (Indian English)';
    setTimeout(() => {
      if (!aiIsLoading && statusContainer) {
        statusContainer.classList.add('hidden');
      }
    }, 4000);
  }
}

function flashHighlight(element) {
  if (!element) return;
  element.classList.add('ring-2', 'ring-emerald-400', 'bg-emerald-50/50');
  setTimeout(() => {
    element.classList.remove('ring-2', 'ring-emerald-400', 'bg-emerald-50/50');
  }, 1800);
}

// Load existing product
async function loadProductForEditing(id) {
  try {
    let product = null;
    if (id.startsWith('sample-')) {
      const parts = id.split('-');
      const idx = parseInt(parts[parts.length - 1], 10) || 0;
      product = SAMPLE_PRODUCTS[idx] || SAMPLE_PRODUCTS[0];
    } else {
      const snap = await getDoc(doc(db, 'products', id));
      if (snap.exists()) {
        product = snap.data();
      }
    }

    if (!product) {
      showToast('Product not found for editing', 'error');
      return;
    }

    // Update Headings & Breadcrumb
    const heading = document.getElementById('page-heading-title');
    const breadcrumbAction = document.getElementById('breadcrumb-current-action');
    const publishLabel = document.getElementById('header-publish-label');

    if (heading) heading.textContent = `Edit: ${product.name}`;
    if (breadcrumbAction) breadcrumbAction.textContent = `Edit Product: ${product.name}`;
    if (publishLabel) publishLabel.textContent = 'Update Product';

    // Step 1: Basic Info
    document.getElementById('p-name').value = product.name || '';
    
    if (product.category) {
      document.getElementById('p-category').value = product.category;
    }
    
    populateProductTypeSelect(product.category, product.productType);
    populateBrandSelect(product.brand);

    document.getElementById('p-rating').value = product.rating || 4.8;
    document.getElementById('p-price').value = product.price || '';
    document.getElementById('p-old-price').value = product.oldPrice || '';
    document.getElementById('p-short-desc').value = product.shortDescription || product.description || '';

    // Step 2: Content & Specs
    document.getElementById('p-description').value = product.description || '';
    
    // Clear & populate Features
    const featContainer = document.getElementById('feature-rows-container');
    if (featContainer) featContainer.innerHTML = '';
    (product.features || []).forEach(f => addFeatureRow(f));
    if (!product.features || product.features.length === 0) addFeatureRow('');

    // Clear & populate FB
    const fbContainer = document.getElementById('fb-rows-container');
    if (fbContainer) fbContainer.innerHTML = '';
    (product.featuresAndBenefits || []).forEach(fb => addFbRow(fb.feature, fb.benefit));
    if (!product.featuresAndBenefits || product.featuresAndBenefits.length === 0) addFbRow('', '');

    // Why buy & guide
    const wyb = product.whyBuy || {};
    const bg = product.buyingGuide || {};
    document.getElementById('wyb-adv').value = wyb.advantages || '';
    document.getElementById('wyb-use').value = wyb.useCases || '';
    document.getElementById('bg-who').value = bg.whoShouldBuy || '';
    document.getElementById('bg-consider').value = bg.considerations || '';

    // FAQs
    const faqContainer = document.getElementById('faq-rows-container');
    if (faqContainer) faqContainer.innerHTML = '';
    (product.faqs || []).forEach(f => addFaqRow(f.question, f.answer));
    if (!product.faqs || product.faqs.length === 0) addFaqRow('', '');

    // Pros & Cons
    const pros = product.prosAndCons?.pros || [];
    const cons = product.prosAndCons?.cons || [];
    document.getElementById('p-pros-input').value = pros.join('\n');
    document.getElementById('p-cons-input').value = cons.join('\n');
    document.getElementById('fv-rec').value = product.finalVerdict?.recommendation || '';

    // Step 3: Images & Specs
    uploadedImages = (product.images && product.images.length > 0) ? [...product.images] : [];
    renderImagesGrid();

    const specContainer = document.getElementById('spec-rows-container');
    if (specContainer) {
      specContainer.innerHTML = '';
      let addedSpecCount = 0;
      if (Array.isArray(product.specifications)) {
        product.specifications.forEach(item => {
          if (item && typeof item === 'object') {
            const k = item.key || item.name || Object.keys(item)[0] || '';
            const v = item.value !== undefined ? item.value : (item[k] || '');
            if (k && v) { addSpecRow(k, v); addedSpecCount++; }
          }
        });
      } else if (product.specifications && typeof product.specifications === 'object') {
        Object.entries(product.specifications).forEach(([k, v]) => {
          if (k && v) { addSpecRow(k, typeof v === 'object' ? JSON.stringify(v) : v); addedSpecCount++; }
        });
      }
      if (addedSpecCount === 0) addSpecRow('', '');
    }

    // Step 4: SEO
    document.getElementById('p-slug').value = product.slug || '';
    document.getElementById('p-meta-title').value = product.metaTitle || '';
    document.getElementById('p-focus-keywords').value = product.focusKeywords || '';
    document.getElementById('p-meta-desc').value = product.metaDescription || '';
    document.getElementById('p-og-title').value = product.ogTitle || '';
    document.getElementById('p-og-image').value = product.ogImage || '';
    document.getElementById('p-og-desc').value = product.ogDescription || '';
    initCharCounters();

    // Step 5: Affiliate
    const affUrl = product.affiliateUrl || '';
    document.getElementById('p-affiliate-url').value = affUrl;
    const aiAffInput = document.getElementById('ai-affiliate-url-input');
    if (aiAffInput) aiAffInput.value = affUrl;

    document.getElementById('p-platform').value = product.affiliatePlatform || 'Amazon';
    document.getElementById('p-cta-text').value = product.ctaText || 'Check Price on Amazon';
    document.getElementById('p-stock-status').value = product.stockStatus || 'In Stock';
    document.getElementById('p-publish-status').value = product.status || 'published';
    document.getElementById('p-is-trending').checked = Boolean(product.isTrending);
    document.getElementById('p-is-hotdeal').checked = Boolean(product.hotDeal);
    document.getElementById('p-disclosure').value = product.affiliateDisclosure || '';

    // Show and wire up Delete Product Button in header
    const delBtn = document.getElementById('header-delete-btn');
    const delModal = document.getElementById('delete-confirm-modal');
    const delMsg = document.getElementById('delete-confirm-message');
    const cancelDelBtn = document.getElementById('cancel-delete-modal-btn');
    const confirmDelBtn = document.getElementById('confirm-delete-modal-btn');

    if (cancelDelBtn && delModal) {
      cancelDelBtn.onclick = () => delModal.classList.add('hidden');
    }
    if (delModal) {
      delModal.onclick = (e) => {
        if (e.target === delModal) delModal.classList.add('hidden');
      };
    }

    if (delBtn) {
      delBtn.classList.remove('hidden');
      delBtn.onclick = () => {
        if (delMsg) {
          delMsg.innerHTML = `Are you sure you want to permanently delete <strong>"${escapeHtml(product.name || 'this product')}"</strong> from your store?`;
        }
        if (delModal) {
          delModal.classList.remove('hidden');
        } else {
          executeDeleteProductInEditMode();
        }
      };
    }

    if (confirmDelBtn) {
      confirmDelBtn.onclick = () => executeDeleteProductInEditMode();
    }

    async function executeDeleteProductInEditMode() {
      if (delModal) delModal.classList.add('hidden');
      try {
        showToast('Deleting product...', 'info');

        // Delete from Firestore
        if (editingProductId && !editingProductId.startsWith('sample-')) {
          await deleteDoc(doc(db, 'products', editingProductId));
        }

        // Track deleted ID in localStorage
        const deletedIds = JSON.parse(localStorage.getItem('tariqu_deleted_product_ids') || '[]');
        if (!deletedIds.includes(editingProductId)) {
          deletedIds.push(editingProductId);
          localStorage.setItem('tariqu_deleted_product_ids', JSON.stringify(deletedIds));
        }

        showToast('Product deleted successfully');
        setTimeout(() => {
          window.location.href = 'admin.html';
        }, 800);
      } catch (delErr) {
        console.error('Error deleting product:', delErr);
        const deletedIds = JSON.parse(localStorage.getItem('tariqu_deleted_product_ids') || '[]');
        if (!deletedIds.includes(editingProductId)) {
          deletedIds.push(editingProductId);
          localStorage.setItem('tariqu_deleted_product_ids', JSON.stringify(deletedIds));
        }
        showToast('Product deleted locally', 'info');
        setTimeout(() => {
          window.location.href = 'admin.html';
        }, 800);
      }
    }

  } catch (err) {
    console.error('Error loading product for editing:', err);
    showToast('Failed to load product details', 'error');
  }
}

// Collect All Form Data
function collectFormData(publishNow = true) {
  // Features
  const featureInputs = document.querySelectorAll('.feature-item-input');
  const features = Array.from(featureInputs).map(i => i.value.trim()).filter(Boolean);

  // Features & Benefits
  const fbCards = document.querySelectorAll('#fb-rows-container > div');
  const featuresAndBenefits = Array.from(fbCards).map(card => {
    const f = card.querySelector('.fb-feature-input')?.value.trim();
    const b = card.querySelector('.fb-benefit-input')?.value.trim();
    return (f && b) ? { feature: f, benefit: b } : null;
  }).filter(Boolean);

  // Specs
  const specCards = document.querySelectorAll('#spec-rows-container > div');
  const specifications = {};
  specCards.forEach(card => {
    const k = card.querySelector('.spec-key-input')?.value.trim();
    const v = card.querySelector('.spec-val-input')?.value.trim();
    if (k && v) specifications[k] = v;
  });

  // FAQs
  const faqCards = document.querySelectorAll('#faq-rows-container > div');
  const faqs = Array.from(faqCards).map(card => {
    const q = card.querySelector('.faq-q-input')?.value.trim();
    const a = card.querySelector('.faq-a-input')?.value.trim();
    return (q && a) ? { question: q, answer: a } : null;
  }).filter(Boolean);

  // Pros & Cons
  const prosText = document.getElementById('p-pros-input')?.value || '';
  const consText = document.getElementById('p-cons-input')?.value || '';
  const pros = prosText.split('\n').map(s => s.trim()).filter(Boolean);
  const cons = consText.split('\n').map(s => s.trim()).filter(Boolean);

  const name = document.getElementById('p-name')?.value.trim() || 'Untitled Product';
  const category = document.getElementById('p-category')?.value || 'men';
  const productType = document.getElementById('p-product-type')?.value.trim() || '';
  const brand = document.getElementById('p-brand')?.value.trim() || '';
  const price = document.getElementById('p-price')?.value.trim() || '₹0';
  const shortDescription = document.getElementById('p-short-desc')?.value.trim() || '';

  const fallbackImages = uploadedImages.length > 0 
    ? uploadedImages 
    : ['https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=800&q=80'];

  return {
    name,
    slug: document.getElementById('p-slug')?.value.trim() || name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    category,
    productType,
    brand,
    rating: parseFloat(document.getElementById('p-rating')?.value) || 4.8,
    price,
    oldPrice: document.getElementById('p-old-price')?.value.trim() || '',
    shortDescription,
    description: document.getElementById('p-description')?.value.trim() || shortDescription,
    features,
    featuresAndBenefits,
    specifications,
    whyBuy: {
      advantages: document.getElementById('wyb-adv')?.value.trim() || '',
      useCases: document.getElementById('wyb-use')?.value.trim() || '',
      useful: 'Combines aesthetic beauty with practical utility.'
    },
    buyingGuide: {
      whoShouldBuy: document.getElementById('bg-who')?.value.trim() || '',
      whatToCheck: 'Check size and variant options on merchant checkout page.',
      sizeCompatibility: 'Standard sizing format.',
      considerations: document.getElementById('bg-consider')?.value.trim() || ''
    },
    customerPerspective: {
      appreciated: 'Customers consistently love the build quality and swift merchant delivery.',
      complaints: 'Double check dimensions before placing order.',
      sentiment: '95% Positive customer satisfaction.'
    },
    prosAndCons: { pros, cons },
    faqs,
    finalVerdict: {
      bestFor: 'Daily use, personal care, and thoughtful gifting.',
      notIdealFor: 'Ultra-budget basic alternatives.',
      recommendation: document.getElementById('fv-rec')?.value.trim() || 'Highly recommended!'
    },
    images: fallbackImages,
    affiliateUrl: document.getElementById('p-affiliate-url')?.value.trim() || 'https://amazon.in?tag=apnamart-21',
    affiliatePlatform: document.getElementById('p-platform')?.value || 'Amazon',
    ctaText: document.getElementById('p-cta-text')?.value.trim() || 'Check Price on Amazon',
    stockStatus: document.getElementById('p-stock-status')?.value || 'In Stock',
    status: publishNow ? (document.getElementById('p-publish-status')?.value || 'published') : 'draft',
    isTrending: document.getElementById('p-is-trending')?.checked || false,
    hotDeal: document.getElementById('p-is-hotdeal')?.checked || false,
    affiliateDisclosure: document.getElementById('p-disclosure')?.value.trim() || 'We earn a commission from qualifying purchases through merchant links.',
    metaTitle: document.getElementById('p-meta-title')?.value.trim() || `${name} | Best Price & Reviews`,
    metaDescription: document.getElementById('p-meta-desc')?.value.trim() || shortDescription,
    focusKeywords: document.getElementById('p-focus-keywords')?.value.trim() || '',
    ogTitle: document.getElementById('p-og-title')?.value.trim() || name,
    ogDescription: document.getElementById('p-og-desc')?.value.trim() || shortDescription,
    ogImage: document.getElementById('p-og-image')?.value.trim() || (fallbackImages[0] || ''),
    updatedAt: new Date().toISOString()
  };
}

// Save Product to Firestore
async function saveProduct(publishNow = true) {
  if (publishNow) {
    if (!validateStep(1)) { goToStep(1); return; }
    if (!validateStep(4)) { goToStep(4); return; }
    if (!validateStep(5)) { goToStep(5); return; }
  }

  const payload = collectFormData(publishNow);

  try {
    showToast(publishNow ? 'Publishing product...' : 'Saving draft...', 'info');

    if (editingProductId && !editingProductId.startsWith('sample-')) {
      await updateDoc(doc(db, 'products', editingProductId), {
        ...payload,
        updatedAt: serverTimestamp()
      });
      showToast('Product updated successfully!');
    } else {
      await addDoc(collection(db, 'products'), {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      showToast('Product saved successfully!');
    }

    setTimeout(() => {
      window.location.href = 'admin.html';
    }, 1200);

  } catch (err) {
    console.error('Error saving product:', err);
    showToast(`Save failed: ${err.message || 'Check database permissions'}`, 'error');
  }
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
