# Apna Mart — Affiliate Catalogue Website

**Apna Mart** is a lightweight, responsive, and fast affiliate e-commerce website designed for Vercel static hosting and Firebase Firestore persistence.

It features no customer signups, no shopping cart, and no order processing—focusing purely on product discovery, rich product information, AdSense readiness, and affiliate merchant redirection ("BUY NOW").

---

## 🚀 Key Features

* **Single Product Details Template (`product.html`):** One common design that dynamically loads product data from Firestore using URL parameter `product.html?id=PRODUCT_ID`.
* **Category Filtering (`category.html`):** Dynamic category showcase (`category.html?category=men`, `women`, `islamic`, `electronics`, `home`) with sorting.
* **Firebase Firestore:** Live product database storage with clean security rules.
* **Firebase Authentication:** Secure admin panel login at `/admin.html`.
* **Cloudinary Multi-Image Upload:** Support for uploading multiple product images directly to Cloudinary with drag-and-drop, primary image selection, and reordering.
* **AdSense Ready:** Clean `.ad-placeholder` components placed strategically across home, category, and product detail pages.
* **SEO & Compliance:** Dynamic page titles, Open Graph descriptions, FTC Affiliate Disclosures, Privacy Policy, Terms, and Contact forms.

---

## 🛠️ Technology Stack

* **Frontend:** HTML5, CSS3, Vanilla JavaScript / ESM, Tailwind CSS 4, Vite
* **Database:** Firebase Firestore
* **Auth:** Firebase Authentication
* **Image Delivery:** Cloudinary Unsigned Upload API
* **Hosting:** Vercel (or Cloud Run / GitHub Pages)

---

## 📂 Project Structure

```text
tariqu-ecommerce/
│
├── index.html                   # Homepage
├── category.html                # Category Page Template
├── product.html                 # Common Product Details Template
│
├── admin-login.html             # Admin Authentication
├── admin.html                   # Admin Dashboard & Product CRUD
│
├── about.html                   # About Us
├── contact.html                 # Contact Support
├── privacy.html                 # Privacy Policy
├── affiliate-disclosure.html   # Affiliate Disclosure
├── terms.html                   # Terms of Service
│
├── css/
│   ├── style.css                # Tailwind CSS + AdSense Placeholders
│   └── admin.css                # Admin custom styles
│
├── js/
│   ├── firebase-config.js       # Firebase initialization & SDK exports
│   ├── app.js                   # Homepage, Navbar, Search & Utilities
│   ├── category.js              # Category filtering & sorting logic
│   ├── product.js               # Dynamic product page loader & gallery
│   ├── auth.js                  # Firebase Auth handlers
│   ├── admin.js                 # Admin dashboard, Cloudinary upload & CRUD
│   └── seed-data.js             # Initial sample product seed
│
├── firebase-applet-config.json  # Firebase credentials
├── firestore.rules              # Firestore security rules
└── README.md
```

---

## 🔐 1. Firebase Setup

### Firestore Setup
1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Create or select a project (e.g. `valued-limiter-r6shk`).
3. Enable **Firestore Database** in production mode.
4. Deploy the security rules from `firestore.rules`:
   ```rules
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /products/{productId} {
         allow read: if resource == null || resource.data.status == 'published' || request.auth != null;
         allow write: if request.auth != null;
       }
       match /{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

### Firebase Authentication Setup
1. In Firebase Console, navigate to **Build > Authentication**.
2. Click **Get Started** and enable **Email/Password** as a Sign-in provider.
3. Open `/admin-login.html` on your site and click **"Register Admin Account"** to create your primary admin credentials.

---

## ☁️ 2. Cloudinary Upload Configuration

To allow uploading product images directly from the Admin Panel:

1. Create a free account at [Cloudinary](https://cloudinary.com/).
2. Copy your **Cloud Name** from the Cloudinary Dashboard.
3. Go to **Settings > Upload > Add Upload Preset**.
4. Set **Signing Mode** to **Unsigned** and name your preset (e.g., `tariqu_preset`).
5. In your Admin Panel (`/admin.html`), click **"Cloudinary Config"** in the header and save your **Cloud Name** and **Upload Preset**.

*Note:* If Cloudinary is not configured yet, the Admin Panel also allows adding direct image URLs or converting local files to Base64 preview strings!

---

## 🛒 3. Adding Your First Product (Admin Workflow)

1. Open `/admin-login.html` and sign in.
2. Click **`+ ADD PRODUCT`**.
3. Fill in the product details:
   * **Name:** Product title (e.g., *Pure Cotton Men's Islamic Kurta*)
   * **Category:** Choose Men, Women, Islamic, Electronics, or Home
   * **Price:** e.g., `₹999` (Old Price: `₹1,499`)
   * **Features:** Click *+ Add Feature* to add bullet highlights
   * **Specifications:** Key/value pairs (e.g., *Material: Cotton*)
   * **Images:** Drag & drop images or click to select files (uploads directly to Cloudinary)
   * **Affiliate URL:** Enter your merchant link (e.g. Amazon affiliate link)
   * **Status:** Select *Published*
4. Click **Save Product**.
5. The product automatically appears on the public website home and category pages!

---

## 📢 4. Inserting Google AdSense Code

When approved by Google AdSense:

1. Open `index.html`, `category.html`, and `product.html`.
2. Locate the `.ad-placeholder` divs:
   ```html
   <div class="ad-placeholder">
       <div class="ad-placeholder-content">
           Advertisement
       </div>
   </div>
   ```
3. Replace the placeholder inner text with your official Google AdSense script code:
   ```html
   <ins class="adsbygoogle"
        style="display:block"
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
        data-ad-slot="XXXXXXXXXX"
        data-ad-format="auto"
        data-full-width-responsive="true"></ins>
   <script>
        (adsbygoogle = window.adsbygoogle || []).push({});
   </script>
   ```

---

## 💻 5. Running Locally & Deploying to Vercel

### Run Locally
```bash
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

### Deploying to Vercel via GitHub
1. Create a new GitHub repository named `tariqu-ecommerce`.
2. Push your code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Apna Mart"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/tariqu-ecommerce.git
   git push -u origin main
   ```
3. Go to [Vercel](https://vercel.com/) and click **Add New Project**.
4. Import your `tariqu-ecommerce` GitHub repository.
5. Keep default Framework Preset (**Vite**) and click **Deploy**.
6. Your site will be live at `https://tariqu-ecommerce.vercel.app`.
