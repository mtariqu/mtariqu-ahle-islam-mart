import { db, doc, getDoc, collection, getDocs } from './firebase-config.js';
import { renderProductGrid, initActiveNavigation, shuffleArray } from './app.js';

document.addEventListener('DOMContentLoaded', async () => {
  initActiveNavigation();
  initSocialSharing();
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');

  if (!productId) {
    showErrorState('No product specified');
    return;
  }

  await loadProductDetails(productId);
});

function initSocialSharing() {
  const currentUrl = window.location.href;
  const pageTitle = document.title || 'Check out this product on Apna Mart';

  const waBtn = document.getElementById('share-whatsapp-btn');
  const fbBtn = document.getElementById('share-facebook-btn');
  const twBtn = document.getElementById('share-twitter-btn');
  const copyBtn = document.getElementById('share-copy-btn');
  const copyText = document.getElementById('copy-btn-text');

  if (waBtn) {
    waBtn.addEventListener('click', () => {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(pageTitle + ' ' + currentUrl)}`, '_blank');
    });
  }

  if (fbBtn) {
    fbBtn.addEventListener('click', () => {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`, '_blank');
    });
  }

  if (twBtn) {
    twBtn.addEventListener('click', () => {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(pageTitle)}&url=${encodeURIComponent(currentUrl)}`, '_blank');
    });
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(currentUrl);
        if (copyText) copyText.textContent = 'Copied! ✅';
        setTimeout(() => {
          if (copyText) copyText.textContent = 'Copy Link';
        }, 2500);
      } catch (e) {
        prompt('Copy this link:', currentUrl);
      }
    });
  }
}

async function loadProductDetails(productId) {
  const loadingContainer = document.getElementById('product-loading');
  const detailsContainer = document.getElementById('product-container');
  const errorContainer = document.getElementById('product-error');

  try {
    let product = null;

    try {
      const docRef = doc(db, 'products', productId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        product = { id: docSnap.id, ...docSnap.data() };
      } else {
        // Try searching by slug
        const snapshot = await getDocs(collection(db, 'products'));
        const allDocs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        product = allDocs.find(p => p.id === productId || p.slug === productId) || null;
      }
    } catch (err) {
      console.warn('Doc fetch warning:', err);
    }

    if (!product) {
      showErrorState('Product Not Found');
      return;
    }

    document.title = `${product.name} | Apna Mart`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.content = product.shortDescription || product.description || '';

    // Render 21 Sections
    renderProductPage(product);

    if (loadingContainer) loadingContainer.classList.add('hidden');
    if (detailsContainer) detailsContainer.classList.remove('hidden');

    // Load related products
    loadRelatedProducts(product.category, product.id);

  } catch (err) {
    console.error('Error fetching product details:', err);
    showErrorState('Failed to load product details');
  }
}

function showErrorState(message) {
  const loadingContainer = document.getElementById('product-loading');
  const detailsContainer = document.getElementById('product-container');
  const errorContainer = document.getElementById('product-error');

  if (loadingContainer) loadingContainer.classList.add('hidden');
  if (detailsContainer) detailsContainer.classList.add('hidden');
  if (errorContainer) {
    errorContainer.innerHTML = `
      <div class="max-w-md mx-auto text-center py-16 px-4 bg-white rounded-2xl border border-gray-200">
        <div class="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-2xl">!</div>
        <h2 class="text-2xl font-bold text-gray-900 mb-2">${message}</h2>
        <p class="text-gray-500 mb-6 text-sm">The product you are looking for may have been removed or is temporarily unavailable.</p>
        <a href="index.html" class="inline-flex items-center justify-center bg-emerald-600 text-white font-medium px-6 py-2.5 rounded-lg hover:bg-emerald-700 transition-colors">
          Back to Home
        </a>
      </div>
    `;
    errorContainer.classList.remove('hidden');
  }
}

function renderProductPage(product) {
  // 2. Top Banner Ad Text
  const topAdTextEl = document.getElementById('top-ad-text');
  if (topAdTextEl) {
    topAdTextEl.textContent = product.topAdText || `🔥 Verified Deal: Save big on ${product.name} — Limited stock on merchant page!`;
  }

  // 3. Breadcrumbs
  const bcCat = document.getElementById('bc-category');
  const bcName = document.getElementById('bc-name');
  if (bcCat) {
    bcCat.textContent = product.category || 'Category';
    bcCat.href = `category.html?category=${encodeURIComponent(product.category || 'men')}`;
  }
  if (bcName) bcName.textContent = product.name;

  // 4. Product Hero
  const titleEl = document.getElementById('p-title');
  const catEl = document.getElementById('p-category');
  const ratingEl = document.getElementById('p-rating');
  const priceEl = document.getElementById('p-price');
  const oldPriceEl = document.getElementById('p-old-price');
  const discountEl = document.getElementById('p-discount');
  const shortDescEl = document.getElementById('p-short-desc');
  const heroHighlightsEl = document.getElementById('p-hero-highlights');

  if (titleEl) titleEl.textContent = product.name;
  if (catEl) {
    catEl.textContent = product.category;
    catEl.href = `category.html?category=${encodeURIComponent(product.category || 'men')}`;
  }

  if (ratingEl) {
    const stars = '★'.repeat(Math.floor(product.rating || 5)) + '☆'.repeat(5 - Math.floor(product.rating || 5));
    ratingEl.innerHTML = `<span class="text-amber-500 text-sm font-bold">${stars}</span> <span class="text-gray-600 text-xs font-semibold ml-1">(${product.rating || 4.8} / 5.0 • 120+ Merchant Reviews)</span>`;
  }

  if (priceEl) priceEl.textContent = product.price;
  if (oldPriceEl) {
    if (product.oldPrice) {
      oldPriceEl.textContent = product.oldPrice;
      oldPriceEl.classList.remove('hidden');
    } else {
      oldPriceEl.classList.add('hidden');
    }
  }

  if (discountEl && product.price && product.oldPrice) {
    const numPrice = parseFloat(product.price.replace(/[^0-9.]/g, ''));
    const numOld = parseFloat(product.oldPrice.replace(/[^0-9.]/g, ''));
    if (numOld > numPrice) {
      const pct = Math.round(((numOld - numPrice) / numOld) * 100);
      discountEl.textContent = `${pct}% OFF`;
      discountEl.classList.remove('hidden');
    } else {
      discountEl.classList.add('hidden');
    }
  }

  if (shortDescEl) shortDescEl.textContent = product.shortDescription || product.description || '';

  // Hero highlights
  if (heroHighlightsEl) {
    const featuresList = product.features && product.features.length > 0
      ? product.features.slice(0, 4)
      : ['High Quality Craftsmanship & Premium Material', 'Durable, Ergonomic & Long-lasting Design', 'Trusted Merchant Certified Product', 'Fast Direct Shipping & Easy Returns'];

    heroHighlightsEl.innerHTML = featuresList.map(item => `
      <li class="flex items-center gap-2">
        <svg class="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" /></svg>
        <span>${item}</span>
      </li>
    `).join('');
  }

  // Helper: Normalize external URL
  function normalizeAffiliateUrl(url) {
    if (!url || typeof url !== 'string' || url.trim() === '' || url === '#') {
      return 'https://amazon.in?tag=apnamart-21';
    }
    let trimmed = url.trim();
    if (!/^https?:\/\//i.test(trimmed)) {
      trimmed = 'https://' + trimmed;
    }
    return trimmed;
  }

  // Buy buttons & Dynamic Admin CTA Text
  const buyBtn = document.getElementById('p-buy-btn');
  const bottomBuyBtn = document.getElementById('p-bottom-buy-btn');
  const targetUrl = normalizeAffiliateUrl(product.affiliateUrl || product.buyUrl || product.affiliateLink);

  const rawCtaText = (product.ctaText && typeof product.ctaText === 'string' && product.ctaText.trim()) 
    ? product.ctaText.trim() 
    : 'CHECK PRICE / BUY NOW';

  const attachBuyAction = (btn, isBottom = false) => {
    if (!btn) return;
    btn.href = targetUrl;
    btn.target = '_blank';
    btn.rel = 'nofollow sponsored noopener noreferrer';

    if (isBottom) {
      btn.innerHTML = `
        <span class="inline-flex items-center justify-center gap-2">
          <svg class="w-5 h-5 text-emerald-700 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
          <span class="uppercase tracking-wide font-extrabold">${escapeHtml(rawCtaText)}</span>
        </span>
      `;
    } else {
      btn.innerHTML = `
        <span class="inline-flex items-center justify-center gap-2">
          <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
          <span class="uppercase tracking-wide font-black">${escapeHtml(rawCtaText)}</span>
        </span>
        <svg class="w-5 h-5 group-hover:translate-x-1 transition-transform ml-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
      `;
    }

    btn.onclick = (e) => {
      // Allow default href navigation if possible, fallback to window.open for iframe safety
      try {
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
      } catch (err) {
        window.location.href = targetUrl;
      }
    };
  };

  attachBuyAction(buyBtn, false);
  attachBuyAction(bottomBuyBtn, true);

  // Multiple Product Images
  renderGallery(product.images || []);

  // 5. Trust / Quick Information
  const qiType = document.getElementById('qi-type');
  const qiBrand = document.getElementById('qi-brand');
  const qiUpdated = document.getElementById('qi-updated');

  if (qiType) qiType.textContent = product.productType || `${capitalize(product.category)} Essential`;
  if (qiBrand) qiBrand.textContent = product.brand || 'Apna Mart Choice';
  if (qiUpdated) {
    let dateFormatted = 'August 2026';
    try {
      if (product.updatedAt) {
        if (typeof product.updatedAt.toDate === 'function') {
          dateFormatted = product.updatedAt.toDate().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
        } else if (product.updatedAt.seconds) {
          dateFormatted = new Date(product.updatedAt.seconds * 1000).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
        } else {
          const parsed = new Date(product.updatedAt);
          if (!isNaN(parsed.getTime())) {
            dateFormatted = parsed.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
          }
        }
      }
    } catch (e) {
      dateFormatted = 'August 2026';
    }
    qiUpdated.textContent = `Verified ${dateFormatted}`;
  }

  // 6. Features & Benefits Table
  renderFeaturesAndBenefits(product);

  // 7. Why Should You Buy This?
  renderWhyBuy(product);

  // 8. Detailed Product Overview
  const fullDescEl = document.getElementById('p-full-desc');
  if (fullDescEl) {
    fullDescEl.textContent = product.description || product.shortDescription || 'No detailed overview available for this product.';
  }

  // 9. Key Features
  renderKeyFeatures(product);

  // 10. Specifications Table
  renderSpecifications(product);

  // 11. What's Included
  renderWhatsIncluded(product);

  // 12. Buying Guide
  renderBuyingGuide(product);

  // 13. Real Customer Perspective
  renderCustomerPerspective(product);

  // 14. Pros & Considerations
  renderProsAndCons(product);

  // 16. FAQs
  renderFAQs(product);

  // 17. Final Verdict
  renderFinalVerdict(product);
}

// Gallery renderer
function renderGallery(images) {
  const mainImg = document.getElementById('p-main-img');
  const thumbsContainer = document.getElementById('p-thumbs-grid');

  const imgs = (images && images.length > 0) 
    ? images 
    : ['https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=800&q=80'];

  if (mainImg) {
    mainImg.src = imgs[0];
    mainImg.onerror = function() {
      this.onerror = null;
      this.src = '/apna_mart_logo.png';
    };
  }

  if (thumbsContainer) {
    if (imgs.length <= 1) {
      thumbsContainer.innerHTML = '';
      thumbsContainer.classList.add('hidden');
      return;
    }

    thumbsContainer.classList.remove('hidden');
    thumbsContainer.innerHTML = imgs.map((img, idx) => `
      <button 
        type="button" 
        class="thumb-btn border-2 ${idx === 0 ? 'border-emerald-600 shadow-xs scale-105' : 'border-gray-200 opacity-80 hover:opacity-100'} rounded-xl overflow-hidden h-16 w-16 shrink-0 focus:outline-none transition-all cursor-pointer"
        data-src="${img}"
      >
        <img src="${img}" onerror="this.onerror=null; this.src='/apna_mart_logo.png';" alt="Thumbnail ${idx + 1}" class="w-full h-full object-cover" loading="lazy" />
      </button>
    `).join('');

    const buttons = thumbsContainer.querySelectorAll('.thumb-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => {
          b.classList.replace('border-emerald-600', 'border-gray-200');
          b.classList.remove('scale-105');
        });
        btn.classList.replace('border-gray-200', 'border-emerald-600');
        btn.classList.add('scale-105');
        if (mainImg) mainImg.src = btn.getAttribute('data-src');
      });
    });
  }
}

// 6. Features & Benefits Table Generator
function renderFeaturesAndBenefits(product) {
  const tbody = document.getElementById('p-features-benefits-tbody');
  if (!tbody) return;

  let pairs = product.featuresAndBenefits || [];

  if (!pairs || pairs.length === 0) {
    // Generate intelligent fallbacks from features or defaults
    const features = product.features || [];
    if (features.length > 0) {
      pairs = features.map(f => {
        const lower = f.toLowerCase();
        let benefit = 'Provides superior performance and long-lasting user satisfaction.';
        if (lower.includes('cotton') || lower.includes('fabric')) benefit = 'Highly comfortable, breathable, and soft on skin.';
        else if (lower.includes('lightweight')) benefit = 'Easy and effortless to wear or carry anywhere.';
        else if (lower.includes('foam') || lower.includes('padded')) benefit = 'Reduces joint & knee discomfort for serene experience.';
        else if (lower.includes('pocket')) benefit = 'Convenient storage for phone, keys & small personal items.';
        else if (lower.includes('wood') || lower.includes('metal')) benefit = 'Solid construction ensuring sturdy long-term durability.';
        else if (lower.includes('led') || lower.includes('light')) benefit = 'Soft eye-comfortable lighting for soothing ambiance.';
        return { feature: f, benefit };
      });
    } else {
      pairs = [
        { feature: 'Premium Build Material', benefit: 'Ensures exceptional comfort, durability and luxury feel.' },
        { feature: 'Ergonomic Tailored Design', benefit: 'Easy and comfortable to use during daily routine.' },
        { feature: 'Quality Checked & Verified', benefit: 'Guarantees reliable performance and high customer value.' }
      ];
    }
  }

  tbody.innerHTML = pairs.map(p => `
    <tr class="hover:bg-gray-50/80 transition-colors">
      <td class="py-3 px-5 font-semibold text-gray-800 bg-gray-50/50 flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
        <span>${p.feature}</span>
      </td>
      <td class="py-3 px-5 text-gray-600">${p.benefit}</td>
    </tr>
  `).join('');
}

// 7. Why Buy Generator
function renderWhyBuy(product) {
  const advEl = document.getElementById('wyb-advantages');
  const ucEl = document.getElementById('wyb-usecases');
  const ufEl = document.getElementById('wyb-useful');

  const wyb = product.whyBuy || {};

  if (advEl) {
    advEl.textContent = wyb.advantages || `Provides superior premium quality at competitive pricing. Highly praised for its excellent craftsmanship and attention to functional details.`;
  }
  if (ucEl) {
    ucEl.textContent = wyb.useCases || `Perfect for daily personal use, special family occasions, religious gatherings, and thoughtful gift presentations for loved ones.`;
  }
  if (ufEl) {
    ufEl.textContent = wyb.useful || `Combines aesthetic beauty with practical utility, making your everyday routine more comfortable, organized, and rewarding.`;
  }
}

// 9. Key Features
function renderKeyFeatures(product) {
  const listEl = document.getElementById('p-key-features-list');
  if (!listEl) return;

  const features = (product.features && product.features.length > 0)
    ? product.features
    : [
        'Crafted with premium grade high-durability materials.',
        'Ergonomic, modern design suitable for versatile everyday use.',
        'Quality-inspected to meet strict merchant standards.',
        'Lightweight and comfortable construction.',
        'Easy maintenance and long-term reliability.'
      ];

  listEl.innerHTML = features.map(f => `
    <li class="flex items-start gap-2.5 text-sm text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100">
      <svg class="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
      </svg>
      <span class="font-medium">${f}</span>
    </li>
  `).join('');
}

// 10. Specifications Table
function renderSpecifications(product) {
  const tbody = document.getElementById('p-specs-table');
  if (!tbody) return;

  let rows = [];

  if (Array.isArray(product.specifications) && product.specifications.length > 0) {
    product.specifications.forEach(item => {
      if (item && typeof item === 'object') {
        const k = item.key || item.name || Object.keys(item)[0] || '';
        const v = item.value !== undefined ? item.value : (item[k] || '');
        if (k && v) rows.push({ key: k, value: v });
      }
    });
  } else if (product.specifications && typeof product.specifications === 'object') {
    Object.entries(product.specifications).forEach(([k, v]) => {
      if (k && v) rows.push({ key: k, value: typeof v === 'object' ? JSON.stringify(v) : v });
    });
  }

  if (rows.length === 0) {
    rows = [
      { key: "Category", value: capitalize(product.category || 'General') },
      { key: "Quality Standard", value: "Premium Grade Verified" },
      { key: "Merchant Rating", value: `${product.rating || 4.8} / 5.0 Stars` },
      { key: "Availability", value: "In Stock" }
    ];
  }

  tbody.innerHTML = rows.map(r => `
    <tr class="border-b border-gray-100 last:border-0 hover:bg-gray-50/60 transition-colors">
      <td class="py-3 px-5 font-bold text-gray-600 w-1/3 bg-gray-50/80">${r.key}</td>
      <td class="py-3 px-5 text-gray-800 font-medium">${r.value}</td>
    </tr>
  `).join('');
}

// 11. What's Included
function renderWhatsIncluded(product) {
  const listEl = document.getElementById('p-whats-included-list');
  if (!listEl) return;

  let items = product.whatsIncluded || [];
  if (!items || items.length === 0) {
    items = [
      `1x Main ${product.name}`,
      `1x Merchant Protective Packaging`,
      `1x Authenticity & Care Inspection Slip`
    ];
  }

  listEl.innerHTML = items.map(item => `
    <li class="flex items-center gap-2.5 bg-gray-50 p-3 rounded-xl border border-gray-100 font-semibold text-gray-800">
      <span class="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0"></span>
      <span>${item}</span>
    </li>
  `).join('');
}

// 12. Buying Guide
function renderBuyingGuide(product) {
  const bg = product.buyingGuide || {};

  const whoEl = document.getElementById('bg-who');
  const checkEl = document.getElementById('bg-check');
  const sizeEl = document.getElementById('bg-size');
  const considerEl = document.getElementById('bg-considerations');

  if (whoEl) whoEl.textContent = bg.whoShouldBuy || `Ideal for buyers seeking high quality, authentic durability, and elegant design for personal use or gifting.`;
  if (checkEl) checkEl.textContent = bg.whatToCheck || `Verify price deals, verify image details, and choose your preferred variant or sizing before placing your order on seller site.`;
  if (sizeEl) sizeEl.textContent = bg.sizeCompatibility || `Standard sizing / specifications. Refer to seller chart on merchant site for exact measurements.`;
  if (considerEl) considerEl.textContent = bg.considerations || `Check color availability and promotional coupon codes available on merchant checkout page.`;
}

// 13. Customer Perspective
function renderCustomerPerspective(product) {
  const cp = product.customerPerspective || {};

  const appEl = document.getElementById('rc-appreciated');
  const compEl = document.getElementById('rc-complaints');
  const sentEl = document.getElementById('rc-sentiment');

  if (appEl) appEl.textContent = cp.appreciated || `Customers consistently highlight the high material feel, true-to-description appearance, and fast merchant delivery.`;
  if (compEl) compEl.textContent = cp.complaints || `Few customers recommend double-checking size charts before purchase to ensure perfect fitting.`;
  if (sentEl) sentEl.textContent = cp.sentiment || `Over 92% positive customer feedback across verified seller reviews with high re-purchase interest.`;
}

// 14. Pros & Considerations
function renderProsAndCons(product) {
  const prosEl = document.getElementById('p-pros-list');
  const consEl = document.getElementById('p-cons-list');

  let pros = (product.prosAndCons && product.prosAndCons.pros)
    ? product.prosAndCons.pros
    : [
        'Exceptional build quality & durable finish',
        'Comfortable & easy to use in daily life',
        'Verified seller with transparent return options',
        'Great value for money price tag'
      ];

  let cons = (product.prosAndCons && product.prosAndCons.cons)
    ? product.prosAndCons.cons
    : [
        'High demand product — stock sells out quickly',
        'Slight color variation possible depending on display settings'
      ];

  if (prosEl) {
    prosEl.innerHTML = pros.map(p => `
      <li class="flex items-start gap-2">
        <span class="text-emerald-600 font-bold shrink-0">✓</span>
        <span>${p}</span>
      </li>
    `).join('');
  }

  if (consEl) {
    consEl.innerHTML = cons.map(c => `
      <li class="flex items-start gap-2">
        <span class="text-amber-600 font-bold shrink-0">⚠</span>
        <span>${c}</span>
      </li>
    `).join('');
  }
}

// 16. FAQs
function renderFAQs(product) {
  const container = document.getElementById('p-faq-container');
  if (!container) return;

  let faqs = product.faqs || [];

  if (!faqs || faqs.length === 0) {
    faqs = [
      {
        question: `Is ${product.name} suitable for everyday use?`,
        answer: `Yes, it is specifically designed with durable high-quality materials to ensure daily comfort and long-lasting performance.`
      },
      {
        question: `How do I buy or order this product?`,
        answer: `Click on the "BUY NOW" button to open the verified merchant page where you can safely select quantities and complete checkout.`
      },
      {
        question: `What material is used in this product?`,
        answer: `It is made from high-grade, tested materials tailored for comfort, strength, and aesthetic appeal.`
      },
      {
        question: `How should I choose the right size or variant?`,
        answer: `Refer to the detailed product specifications table above and check the sizing guide on the seller page.`
      }
    ];
  }

  container.innerHTML = faqs.map((faq, idx) => `
    <details class="group bg-gray-50 rounded-xl border border-gray-200 p-4 transition-all [&_summary::-webkit-details-marker]:hidden" ${idx === 0 ? 'open' : ''}>
      <summary class="flex items-center justify-between font-bold text-sm text-gray-900 cursor-pointer select-none">
        <span>Q: ${faq.question}</span>
        <span class="transition-transform group-open:rotate-180 text-emerald-600 font-bold text-lg ml-2">↓</span>
      </summary>
      <p class="mt-3 text-xs text-gray-600 leading-relaxed pt-2 border-t border-gray-200/60">
        ${faq.answer}
      </p>
    </details>
  `).join('');
}

// 17. Final Verdict
function renderFinalVerdict(product) {
  const fv = product.finalVerdict || {};

  const bestEl = document.getElementById('fv-bestfor');
  const notEl = document.getElementById('fv-notideal');
  const recEl = document.getElementById('fv-recommendation');

  if (bestEl) bestEl.textContent = fv.bestFor || `Anyone seeking high quality, elegant craftsmanship, and dependable utility at a fair value.`;
  if (notEl) notEl.textContent = fv.notIdealFor || `Users looking for basic ultra-budget disposable items without long-term durability.`;
  if (recEl) recEl.textContent = fv.recommendation || `Highly Recommended! A top-tier choice in ${capitalize(product.category)} category with outstanding customer satisfaction.`;
}

// Helper: load related products
async function loadRelatedProducts(category, currentId) {
  const container = document.getElementById('related-products-grid');
  if (!container) return;

  try {
    const snapshot = await getDocs(collection(db, 'products'));
    let products = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(p => p.status === 'published' && p.category === category && p.id !== currentId);

    if (products.length === 0) {
      products = SAMPLE_PRODUCTS
        .filter(p => p.category === category)
        .map((p, idx) => ({ id: `sample-${category}-${idx}`, ...p }))
        .filter(p => p.id !== currentId);
    }

    // Display randomized related products for organic discovery
    renderProductGrid(shuffleArray(products).slice(0, 4), container);
  } catch (err) {
    console.error('Error loading related products:', err);
  }
}

function capitalize(str) {
  if (!str) return '';
  return str.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
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

