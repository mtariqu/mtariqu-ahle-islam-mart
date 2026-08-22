// Admin Dedicated Product Wizard Logic (5 Steps with Strict Validation, SEO Sync & Media)

import { 
  db, 
  doc, 
  getDoc, 
  collection, 
  addDoc, 
  updateDoc, 
  serverTimestamp 
} from './firebase-config.js';
import { requireAdminAuth } from './auth.js';
import { SAMPLE_PRODUCTS } from './seed-data.js';
import { CATEGORIES } from './app.js';

let currentStep = 1;
const TOTAL_STEPS = 5;
let editingProductId = null;
let uploadedImages = [];

// Master Product Type Mappings for all 25 Categories
const CATEGORY_PRODUCT_TYPES = {
  'islamic-clothing': ['Men\'s Kurta', 'Thobe / Jubba', 'Sherwani', 'Pathani Suit', 'Islamic Waistcoat', 'Kaftan', 'Cotton Pyjama', 'Islamic Shawl'],
  'hijab-modest-wear': ['Chiffon Hijab', 'Georgette Hijab', 'Designer Abaya', 'Khimar', 'Niqab', 'Modest Maxi Dress', 'Modest Kimono', 'Hijab Underscarf / Cap'],
  'islamic-books': ['The Holy Quran (Arabic / English / Urdu)', 'Tafseer Quran Book', 'Sahih Hadith Collection', 'Seerah of Prophet Muhammad (PBUH)', 'Islamic History Book', 'Dua & Azkar Collection', 'Children Islamic Story Book'],
  'quran-accessories': ['Carved Wooden Rehal (Quran Stand)', 'Velvet Quran Storage Box', 'Quran Reading Pointer (Khizana)', 'Luxury Bookmark Set', 'Quran Magnifier / Lamp'],
  'prayer-essentials': ['Velvet Sajadah / Janamaz', 'Orthopedic Memory Foam Prayer Mat', 'Embroidered Prayer Cap (Topi / Kufi)', 'Digital Azan Alarm Clock', 'Qibla Direction Compass'],
  'islamic-wall-art': ['Ayatul Kursi Metal Wall Art', 'Bismillah Canvas Frame', '99 Names of Allah Wall Decor', 'Surah Al-Ikhlas Acrylic Hanging', 'Islamic Geometric Clock Wall Art'],
  'islamic-home-decor': ['Moroccan Brass Lantern', 'Crescent Moon & Star LED Lamp', 'Mabkhara Oud Incense Burner', 'Islamic Tabletop Calligraphy Frame', 'Islamic Door Hanger'],
  'ramadan-essentials': ['Ramadan Countdown Calendar', 'Iftar Serving Tray Set', 'Ramadan Fairy String Lights', 'Suhoor & Iftar Dua Platter', 'Ramadan Mubarak Banner'],
  'hajj-umrah-essentials': ['Seamless White Ihram Towel Set', 'Anti-Theft Secure Ihram Belt', 'Tawaf Soft Shoe Slippers', 'Hajj / Umrah Guide Pocketbook', 'Luggage Tag & Travel Pouch'],
  'islamic-gifts': ['Luxury Quran & Tasbih Gift Hamper', 'Personalized Islamic Gift Set', 'Nikah Special Pen & Box', 'Eid Mubarak Gift Box', 'Crystal Kaaba Replica'],
  'tasbih-zikr': ['99 Beads Natural Olive Wood Tasbih', 'Natural Gemstone Misbaha', 'Digital LED Finger Tally Counter', 'Electronic Zikr Ring Counter', 'Automatic Vibration Zikr Bead'],
  'islamic-kids-products': ['Interactive Arabic Alphabet Puzzle', 'Islamic Story & Coloring Book', 'Salah Learning Activity Set', 'Kids Dua Flashcards', 'Wooden Toy Mosque Set'],
  'muslim-kids-clothing': ['Boy\'s Cotton Kurta Pyjama', 'Girl\'s Modest Kids Abaya', 'Kids Eid Party Outfit', 'Junior White Prayer Cap'],
  'islamic-stationery': ['Islamic Daily Goals Planner', 'Bismillah Hardcover Notebook', 'Arabic Calligraphy Sticker Sheets', 'Motivational Islamic Bookmarks'],
  'islamic-learning': ['Learn Quran with Tajweed Guide', 'Arabic Calligraphy Practice Workbook', 'Interactive Audio Salah Learning Mat', 'Noorani Qaida Educational Kit'],
  'arabic-calligraphy': ['Traditional Qalam Calligraphy Pen Set', 'Arabic Ink & Inkwell Kit', 'Calligraphy Practice Paper Pad', 'Gold Leaf Calligraphy Art Supplies'],
  'modest-accessories': ['Snag-free Magnetic Hijab Pins', 'Luxury Crystal Brooches', 'Modest Arm Sleeve Covers', 'Breathable Underscarf Band', 'Hijab Organizer Hanger'],
  'islamic-travel-essentials': ['Pocket Foldable Waterproof Prayer Mat', 'Portable Wudu Water Sprayer (Lota / Bottle)', 'Compact Travel Qibla Compass', 'Pocket Travel Quran with Velvet Pouch'],
  'muslim-lifestyle': ['Non-Alcoholic Premium Attar Perfume Oil', 'Natural Miswak Sticks Set', 'Organic Sunnah Beard Oil & Balm', 'Halal Certified Skincare Essentials'],
  'islamic-wedding-gifts': ['Luxury Velvet Nikahnama Frame', 'Bride & Groom Islamic Gift Hamper', 'Crystal Quran & Stand Gift Set', 'Engraved Dua Keepsake Plaque'],
  'men': ['Men\'s Traditional Festive Kurta', 'Arabic Sandal', 'Leather Khuffain (Socks)', 'Casual Modest Shirt'],
  'women': ['Designer Silk Kaftan', 'Embroidered Modest Gown', 'Floral Casual Abaya', 'Pleated Premium Hijab'],
  'islamic': ['Traditional Rehal', 'Smart Quran Audio Cube Speaker', 'Digital Azan Clock', 'Velvet Janamaz'],
  'electronics': ['Smart Bluetooth Quran Speaker', 'Digital Finger Tasbih with Display', 'Automated Azan Clock with Audio', 'Electronic Qibla Compass'],
  'kitchen': ['Halal Certified Cookware Set', 'Islamic Geometric Serving Platter', 'Zamzam Water Glass Flask Set', 'Ramadan Date & Sweet Bowl']
};

// Master Brands / Manufacturers List
const MASTER_BRANDS = [
  'Ahle E Islam Choice',
  'Darussalam Publishers',
  'Al-Karam Classic',
  'Al-Haramain Fragrances',
  'Al-Rehab Perfumes',
  'Noor Islamic Decor',
  'Goodword Books',
  'Ajmal Perfumes',
  'East Essence Modest Wear',
  'Modanisa Collection',
  'Qiswah Studio London',
  'IslamicArtCo',
  'Mecca Craft Heritage',
  'Sanisoly Premium Crafts',
  'An-Noor Publications',
  'Kashmiri Craft House',
  'Madinah Artisans Guild',
  'Handcrafted / Artisan Choice'
];

// LocalStorage helpers for custom user additions
function getCustomProductTypes() {
  try {
    const raw = localStorage.getItem('ahle_custom_product_types');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveCustomProductType(name, category = 'all') {
  const list = getCustomProductTypes();
  if (!list.some(item => (typeof item === 'string' ? item : item.name).toLowerCase() === name.toLowerCase())) {
    list.push({ name, category });
    localStorage.setItem('ahle_custom_product_types', JSON.stringify(list));
  }
}

function getCustomBrands() {
  try {
    const raw = localStorage.getItem('ahle_custom_brands');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveCustomBrand(name) {
  const list = getCustomBrands();
  if (!list.some(item => item.toLowerCase() === name.toLowerCase())) {
    list.push(name);
    localStorage.setItem('ahle_custom_brands', JSON.stringify(list));
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
    'General Islamic Lifestyle Item',
    'Clothing & Wearable',
    'Hardcover / Paperback Book',
    'Prayer Mat / Rug',
    'Fragrance / Perfume Oil',
    'Wall Art & Tapestry',
    'Handcrafted Gift Box'
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
    if (specContainer) specContainer.innerHTML = '';
    Object.entries(product.specifications || {}).forEach(([k, v]) => addSpecRow(k, v));
    if (Object.keys(product.specifications || {}).length === 0) addSpecRow('', '');

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
    document.getElementById('p-affiliate-url').value = product.affiliateUrl || '';
    document.getElementById('p-platform').value = product.affiliatePlatform || 'Amazon';
    document.getElementById('p-cta-text').value = product.ctaText || 'Check Price on Amazon';
    document.getElementById('p-stock-status').value = product.stockStatus || 'In Stock';
    document.getElementById('p-publish-status').value = product.status || 'published';
    document.getElementById('p-is-trending').checked = Boolean(product.isTrending);
    document.getElementById('p-is-hotdeal').checked = Boolean(product.hotDeal);
    document.getElementById('p-disclosure').value = product.affiliateDisclosure || '';

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
  const category = document.getElementById('p-category')?.value || 'islamic-clothing';
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
    affiliateUrl: document.getElementById('p-affiliate-url')?.value.trim() || 'https://amazon.in?tag=ahleeislam-21',
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
