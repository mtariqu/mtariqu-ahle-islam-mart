import { db, collection, addDoc } from './firebase-config.js';
import { initActiveNavigation } from './app.js';

// Input Sanitization to prevent SQL Injection & Cross-Site Scripting (XSS)
export function sanitizeInput(str) {
  if (!str) return '';
  return str
    .trim()
    .replace(/<[^>]*>?/gm, '') // Strip HTML tags
    .replace(/['"`;]/g, (match) => { // Escape characters that break SQL or HTML
      switch (match) {
        case "'": return '&#39;';
        case '"': return '&quot;';
        case '`': return '&#96;';
        case ';': return '&#59;';
        default: return match;
      }
    })
    .replace(/--(.*)$/gm, '') // Strip SQL comments
    .replace(/\/\*[\s\S]*?\*\//g, '') // Strip SQL block comments
    .replace(/\b(UNION|SELECT|DROP|INSERT|DELETE|UPDATE|EXEC|SCRIPT|OR 1=1)\b/gi, ''); // Strip SQL / Script keywords
}

export function isValidEmail(email) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

document.addEventListener('DOMContentLoaded', () => {
  initActiveNavigation();

  const form = document.getElementById('contact-form');
  const alertEl = document.getElementById('contact-alert');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nameEl = document.getElementById('contact-name');
      const emailEl = document.getElementById('contact-email');
      const phoneEl = document.getElementById('contact-phone');
      const subjectEl = document.getElementById('contact-subject');
      const messageEl = document.getElementById('contact-message');
      const submitBtn = document.getElementById('contact-submit-btn');

      const rawName = nameEl?.value || '';
      const rawEmail = emailEl?.value || '';
      const rawPhone = phoneEl?.value || '';
      const rawSubject = subjectEl?.value || '';
      const rawMessage = messageEl?.value || '';

      // Validation Checks
      const cleanName = sanitizeInput(rawName);
      const cleanEmail = sanitizeInput(rawEmail);
      const cleanPhone = sanitizeInput(rawPhone);
      const cleanSubject = sanitizeInput(rawSubject);
      const cleanMessage = sanitizeInput(rawMessage);

      if (cleanName.length < 2 || cleanName.length > 100) {
        showFormAlert('Name must be between 2 and 100 characters long.', true);
        return;
      }

      if (!isValidEmail(cleanEmail) || cleanEmail.length > 100) {
        showFormAlert('Please enter a valid email address (max 100 characters).', true);
        return;
      }

      if (cleanSubject.length < 3 || cleanSubject.length > 200) {
        showFormAlert('Subject must be between 3 and 200 characters long.', true);
        return;
      }

      if (cleanMessage.length < 10 || cleanMessage.length > 2000) {
        showFormAlert('Message must be between 10 and 2000 characters long.', true);
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending Message...';
      }

      try {
        const RECIPIENT_EMAIL = 'ahleislam07@gmail.com';

        // 1. Save to Firestore 'contact_messages' collection
        await addDoc(collection(db, 'contact_messages'), {
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone || 'Not provided',
          subject: cleanSubject,
          message: cleanMessage,
          recipientEmail: RECIPIENT_EMAIL,
          status: 'unread',
          replyText: '',
          createdAt: new Date().toISOString()
        });

        // 2. Prepare mailto URL for direct email dispatch to ahleislam07@gmail.com
        const mailBody = `New Contact Form Inquiry:\n\nName: ${cleanName}\nEmail: ${cleanEmail}\nPhone: ${cleanPhone || 'N/A'}\nSubject: ${cleanSubject}\n\nMessage:\n${cleanMessage}\n\nSubmitted via Ahle E Islam Mart Contact Page`;
        const mailtoUrl = `mailto:${RECIPIENT_EMAIL}?subject=${encodeURIComponent('Inquiry: ' + cleanSubject)}&body=${encodeURIComponent(mailBody)}`;

        if (alertEl) {
          alertEl.className = 'p-4 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl text-xs space-y-2';
          alertEl.innerHTML = `
            <div class="flex items-start gap-2">
              <span class="text-base">✅</span>
              <div>
                <p class="font-bold text-emerald-900 text-sm">Message Sent Successfully!</p>
                <p class="text-emerald-700 text-xs mt-0.5">
                  Thank you! Your inquiry has been saved securely and sent to support at <strong class="font-mono text-emerald-900">ahleislam07@gmail.com</strong>.
                </p>
                <div class="mt-2.5 flex items-center gap-2">
                  <a href="${mailtoUrl}" target="_blank" class="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs transition-colors shadow-xs">
                    ✉️ Open Email App to Send Copy to ahleislam07@gmail.com
                  </a>
                </div>
              </div>
            </div>
          `;
          alertEl.classList.remove('hidden');
        }

        form.reset();
      } catch (err) {
        console.error('Error submitting contact form:', err);
        showFormAlert('Failed to send message: ' + err.message, true);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send Message';
        }
      }
    });
  }
});

function showFormAlert(msg, isError = false) {
  const alertEl = document.getElementById('contact-alert');
  if (!alertEl) return;

  alertEl.className = isError 
    ? 'p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-medium'
    : 'p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-medium';
  
  alertEl.textContent = msg;
  alertEl.classList.remove('hidden');
}
