// ============================================================
// Mobile nav toggle
// ============================================================
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

navToggle?.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
});

navLinks?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle?.setAttribute('aria-expanded', 'false');
  });
});

// ============================================================
// FAQ accordion
// ============================================================
document.querySelectorAll('.faq-item').forEach((item) => {
  const q = item.querySelector('.faq-q');
  q.addEventListener('click', () => {
    const wasOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach((openItem) => {
      if (openItem !== item) {
        openItem.classList.remove('open');
        openItem.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
      }
    });
    item.classList.toggle('open', !wasOpen);
    q.setAttribute('aria-expanded', String(!wasOpen));
  });
});

// ============================================================
// Contact: service picker + live email template generator
// ============================================================
const CONTACT_EMAIL = 'zendros.cloud@gmail.com';

const chips = document.querySelectorAll('.service-chip');
const projectInput = document.getElementById('projectDetails');
const nameInput = document.getElementById('senderName');
const companyInput = document.getElementById('senderCompany');
const preview = document.getElementById('templatePreview');
const copyBtn = document.getElementById('copyTemplateBtn');
const mailBtn = document.getElementById('mailTemplateBtn');
const gmailBtn = document.getElementById('gmailTemplateBtn');
const toast = document.getElementById('copyToast');

const selectedServices = new Set();
const subjectEl = document.getElementById('templateSubject');
const copySubjectBtn = document.getElementById('copySubjectBtn');

function buildSubject() {
  const name = nameInput.value.trim() || '[Your name]';
  const company = companyInput.value.trim();
  return 'New project inquiry \u2014 ' + (company || name);
}

function buildBody() {
  const name = nameInput.value.trim() || '[Your name]';
  const company = companyInput.value.trim();
  const details = projectInput.value.trim() || '[Briefly describe what you\u2019re building or what\u2019s breaking]';
  const services = selectedServices.size
    ? Array.from(selectedServices).join(', ')
    : '[Select the services you need above]';

  return [
    'Hi Amaan,',
    '',
    `I'm ${name}${company ? ' from ' + company : ''}, and I'm looking for help with:`,
    services,
    '',
    'What we need:',
    details,
    '',
    'Looking forward to hearing from you.',
  ].join('\n');
}

function refresh() {
  const subject = buildSubject();
  const body = buildBody();
  subjectEl.textContent = subject;
  preview.textContent = body;
  if (mailBtn) {
    mailBtn.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }
  if (gmailBtn) {
    gmailBtn.href = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(CONTACT_EMAIL)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }
}

chips.forEach((chip) => {
  chip.addEventListener('click', () => {
    const service = chip.dataset.service;
    const active = chip.classList.toggle('active');
    chip.setAttribute('aria-pressed', String(active));
    if (active) selectedServices.add(service);
    else selectedServices.delete(service);
    refresh();
  });
});

[projectInput, nameInput, companyInput].forEach((el) => {
  el?.addEventListener('input', refresh);
});

async function copyToClipboard(text, okMessage) {
  try {
    await navigator.clipboard.writeText(text);
    toast.textContent = okMessage;
  } catch (err) {
    toast.textContent = 'Could not copy automatically \u2014 select the text and copy it manually.';
  }
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3200);
}

copyBtn?.addEventListener('click', () => {
  copyToClipboard(buildBody(), 'Message copied \u2014 paste it into the email body.');
});
copySubjectBtn?.addEventListener('click', () => {
  copyToClipboard(buildSubject(), 'Subject copied \u2014 paste it into the subject line.');
});

refresh();

// ============================================================
// Footer year
// ============================================================
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
