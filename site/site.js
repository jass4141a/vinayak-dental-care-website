(() => {
  'use strict';
  const $ = (s, root=document) => root.querySelector(s);
  const clinicApi = '/public-api';
  const form = $('#booking-form');
  const dateInput = $('#appointment-date');
  const timeSelect = $('#appointment-time');
  const slotArea = $('#slot-area');
  const submitButton = $('#submit-booking');
  const errorBox = $('#form-error');
  let clinic = null;
  let selectedSlot = '';

  const serviceIcons = [
    ['root canal', '✧'], ['clean', '✦'], ['scaling', '✦'], ['implant', '◈'],
    ['crown', '◇'], ['bridge', '◇'], ['orthodont', '⌁'], ['braces', '⌁'],
    ['extract', '＋'], ['whiten', '✧'], ['child', '♡'], ['paediatric', '♡'],
    ['consult', '⌕'], ['filling', '✚'], ['gum', '❋']
  ];
  function iconFor(name) {
    const lower = String(name || '').toLowerCase();
    const found = serviceIcons.find(([key]) => lower.includes(key));
    return found ? found[1] : '✧';
  }
  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function phoneLink(number) {
    const digits = String(number || '').replace(/\D/g, '');
    return digits ? 'tel:' + (digits.length === 10 ? '+91' + digits : '+' + digits) : 'tel:';
  }
  function setPhone(number, label) {
    const links = ['#top-call','#hero-call','#services-call','#booking-phone'];
    links.forEach(sel => { const a = $(sel); if (a) { a.href = phoneLink(number); if (label) a.textContent = label; } });
  }
  function showError(message) { errorBox.textContent = message; errorBox.hidden = false; }
  function clearError() { errorBox.textContent = ''; errorBox.hidden = true; }
  async function getJson(url) {
    const response = await fetch(url, {headers:{'Accept':'application/json'},credentials:'same-origin',cache:'no-store'});
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Unable to load clinic information.');
    return data;
  }
  async function postJson(url, body) {
    const response = await fetch(url, {method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},credentials:'same-origin',body:JSON.stringify(body)});
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Your request could not be sent. Please try again.');
    return data;
  }
  function renderServices(services) {
    const grid = $('#service-grid');
    const ranked = [...services].sort((a,b) => {
      const order = ['consult','clean','scaling','filling','root canal','extraction','crown','implant','orthodont'];
      const score = item => { const n=(item.name||'').toLowerCase(); const i=order.findIndex(k=>n.includes(k)); return i<0?99:i; };
      return score(a)-score(b) || a.name.localeCompare(b.name);
    });
    const visible = ranked.slice(0,6);
    grid.innerHTML = '';
    if (!visible.length) {
      grid.innerHTML = '<div class="loading-card">Please contact the clinic to ask about available dental treatments.</div>';
      return;
    }
    visible.forEach((service, i) => {
      const card = document.createElement('article');
      card.className = 'service-card';
      const price = Number(service.fee || 0) > 0 ? '₹' + Number(service.fee).toLocaleString('en-IN') : 'Ask the clinic';
      card.innerHTML = `<span class="service-price">${esc(price)}</span><div class="service-icon">${esc(iconFor(service.name))}</div><h3>${esc(service.name)}</h3><p>Discuss your needs with the dentist and understand the care options available.</p><a class="service-action" href="#book" data-service="${esc(service.name)}">Request this treatment <b>↗</b></a>`;
      grid.appendChild(card);
    });
    grid.querySelectorAll('[data-service]').forEach(a => a.addEventListener('click', () => {
      const select = $('#purpose-select');
      select.value = a.dataset.service;
      if (select.value !== a.dataset.service) {
        const opt = new Option(a.dataset.service, a.dataset.service, true, true);
        select.add(opt);
      }
    }));
  }
  function renderSpecialties(specialties) {
    const grid = $('#specialty-grid');
    if (!grid) return;
    if (!Array.isArray(specialties) || !specialties.length) return;
    grid.innerHTML = '';
    specialties.forEach(item => {
      const card = document.createElement('article'); card.className = 'specialty-card';
      const icon = document.createElement('span'); icon.className = 'specialty-icon'; icon.textContent = item.icon || '✧';
      const title = document.createElement('h3'); title.textContent = item.title || 'Dental care';
      const description = document.createElement('p'); description.textContent = item.description || '';
      card.append(icon, title, description); grid.appendChild(card);
    });
  }


  // Google review carousel. Data is supplied by the clinic-owned, paginated GBP sync utility.
  let reviewFeed = { reviews: [], total_review_count: 0, average_rating: null };
  let reviewPage = 0;
  let reviewResizeTimer = null;
  function reviewPageSize() {
    return window.matchMedia('(max-width:680px)').matches ? 1 : window.matchMedia('(max-width:1000px)').matches ? 2 : 3;
  }
  function reviewStars(value) {
    const n = Math.max(0, Math.min(5, Number(value || 0)));
    return '★'.repeat(n) + '☆'.repeat(5 - n);
  }
  function renderReviewPage() {
    const row = $('#reviews-row');
    if (!row) return;
    const reviews = Array.isArray(reviewFeed.reviews) ? reviewFeed.reviews : [];
    const size = reviewPageSize();
    const pages = Math.max(1, Math.ceil(reviews.length / size));
    reviewPage = Math.max(0, Math.min(reviewPage, pages - 1));
    const batch = reviews.slice(reviewPage * size, (reviewPage + 1) * size);
    row.replaceChildren();
    if (!reviews.length) {
      const empty = document.createElement('article'); empty.className = 'review-empty';
      const title = document.createElement('b'); title.textContent = 'Patient reviews from Google';
      const desc = document.createElement('p'); desc.textContent = 'Connect the clinic’s verified Google Business Profile to publish the complete review list here. You can read the latest reviews on Google in the meantime.';
      const link = document.createElement('a'); link.href = 'https://maps.app.goo.gl/MxyDbJQMkHZ755aL9'; link.target = '_blank'; link.rel = 'noopener'; link.textContent = 'Open Google reviews ↗';
      empty.append(title, desc, link); row.append(empty);
    } else {
      batch.forEach(review => {
        const card = document.createElement('article'); card.className = 'review-card';
        const top = document.createElement('div'); top.className = 'review-card-top';
        const author = document.createElement('div'); author.className = 'review-author';
        const avatar = document.createElement('span'); avatar.className = 'review-avatar'; avatar.textContent = String(review.author_name || 'G').trim().slice(0, 1).toUpperCase();
        const who = document.createElement('span'); who.className = 'review-who';
        const name = document.createElement('b'); name.textContent = review.author_name || 'Google reviewer';
        const date = document.createElement('small'); date.textContent = review.relative_time || review.date || 'Google review';
        who.append(name, date); author.append(avatar, who);
        const sourceMark = document.createElement('span'); sourceMark.className = 'review-google-mark'; sourceMark.textContent = 'Google';
        top.append(author, sourceMark);
        const rating = document.createElement('div'); rating.className = 'review-stars'; rating.textContent = reviewStars(review.rating); rating.setAttribute('aria-label', String(review.rating || 0) + ' out of 5 stars');
        const quote = document.createElement('p'); quote.className = 'review-quote'; quote.textContent = review.text || 'Rated on Google';
        const source = document.createElement('a'); source.className = 'review-source'; source.href = review.google_url || 'https://maps.app.goo.gl/MxyDbJQMkHZ755aL9'; source.target = '_blank'; source.rel = 'noopener'; source.textContent = 'View on Google ↗';
        card.append(top, rating, quote, source); row.append(card);
      });
    }
    const prev = $('#reviews-prev'), next = $('#reviews-next');
    if (prev) prev.disabled = !reviews.length || reviewPage === 0;
    if (next) next.disabled = !reviews.length || reviewPage >= pages - 1;
    const total = Number(reviewFeed.total_review_count || reviews.length || 0);
    const avg = Number(reviewFeed.average_rating || 0);
    const summary = $('#reviews-summary');
    if (summary) summary.textContent = total ? `${avg ? avg.toFixed(1) + ' out of 5 · ' : ''}${total} Google reviews · ${reviews.length} synced for display` : 'Patient feedback from the clinic’s Google Business Profile.';
    const note = $('#reviews-source-note');
    if (note) note.textContent = reviews.length ? 'Google reviews are shown with the reviewer’s name and a direct link to the source.' : 'The complete carousel will populate after the clinic owner connects the verified Google Business Profile.';
  }
  async function loadGoogleReviews() {
    try {
      const feed = await getJson('/public-api/reviews');
      reviewFeed = { ...reviewFeed, ...feed, reviews: Array.isArray(feed.reviews) ? feed.reviews : [] };
      reviewFeed.reviews.sort((a, b) => String(b.update_time || b.date || '').localeCompare(String(a.update_time || a.date || '')));
    } catch (_) {
      reviewFeed = { reviews: [], total_review_count: 0, average_rating: null };
    }
    reviewPage = 0; renderReviewPage();
  }

  function renderServiceOptions(services) {
    const select = $('#purpose-select');
    const defaultOption = select.options[0];
    select.innerHTML = '';
    select.appendChild(defaultOption);
    select.add(new Option('General consultation', 'General consultation'));
    services.forEach(s => select.add(new Option(s.name, s.name)));
  }
  function applyClinicInfo(data) {
    clinic = data;
    const c = data.clinic || {};
    const m = data.map_profile || {};
    const main = c.name_main || 'VINAYAK';
    const sub = c.name_sub || 'DENTAL CARE';
    const fullName = (main + ' ' + sub).trim();
    const publicName = m.business_name || fullName;
    const publicSub = m.business_name && m.business_name.toUpperCase().startsWith(main.toUpperCase())
      ? m.business_name.slice(main.length).trim() : sub;
    $('#brand-main').textContent = main;
    $('#brand-sub').textContent = publicSub;
    $('#footer-main').textContent = main;
    $('#footer-sub').textContent = publicSub;
    $('#footer-clinic').textContent = publicName;
    document.title = publicName + ' | Sargasan, Gandhinagar';
    $('#doctor-name').textContent = c.doctor || 'Dr. Nupur Patel';
    $('#doctor-qualification').textContent = c.qualification || 'Oral Surgeon Specialist';
    const doctorExperience = $('#doctor-experience'); if (doctorExperience) doctorExperience.textContent = m.doctor_experience || '7+ years of experience';
    const doctorPatients = $('#doctor-patients'); if (doctorPatients) doctorPatients.textContent = m.patients_treated || '2,000+ patients';
    const reg = String(c.reg_no || '').replace(/^\s*Reg\.?\s*no\.?\s*:?\s*/i, '').trim();
    $('#doctor-registration').textContent = reg ? 'Registration: ' + reg : '';
    $('#doctor-registration').hidden = !reg;
    const phoneParts = String(c.phones || '').match(/[+]?\d[\d\s()-]{7,}\d/g) || [];
    const firstPhone = m.phone || (phoneParts.length ? phoneParts[0].replace(/[^\d+]/g,'') : c.phone_digits || '');
    setPhone(firstPhone);
    $('#contact-phones').textContent = c.phones || m.phone || 'Please call the clinic for contact details.';
    $('#contact-call-link').href = phoneLink(firstPhone);
    $('#contact-call-link').textContent = firstPhone ? 'Call ' + firstPhone + ' ↗' : 'Call the clinic';
    $('#contact-hours').textContent = c.timings || 'Please call the clinic for current hours.';
    const address = String(c.address || m.address || '').trim();
    if (address) $('#contact-address').textContent = address;
    else $('#contact-address').textContent = 'Please call the clinic for directions.';
    const mapUrl = m.map_url || c.map_url || 'https://maps.app.goo.gl/MxyDbJQMkHZ755aL9';
    ['#map-link','#map-card-link','#google-hours-link','#profile-google-link','#hero-google-link'].forEach(sel => { const a=$(sel); if (a) a.href=mapUrl; });
    const lat = Number(m.latitude || c.map_latitude), lng = Number(m.longitude || c.map_longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      $('#clinic-map-frame').src = `https://www.google.com/maps?q=${lat},${lng}&z=17&output=embed`;
    }
    const businessName = m.business_name || fullName;
    $('#profile-business-name').textContent = businessName;
    $('#profile-business-location').textContent = (m.category || 'Dental clinic') + ' · The Sky Court · Sargasan, Gandhinagar';
    $('#hero-google-rating').textContent = Number(m.rating || 5).toFixed(1);
    $('#hero-google-reviews').textContent = (m.review_count || 93) + ' Google reviews';
    $('#profile-review-count').textContent = (m.review_count || 93) + ' reviews';
    $('#profile-review-count').title = 'Google listing snapshot checked ' + (m.rating_checked || '19 Nov 2026');
    $('#hero-google-rating').title = 'Google listing snapshot checked ' + (m.rating_checked || '19 Nov 2026');
    $('#profile-business-name').title = m.category || 'Dental clinic';
    $('#clinic-map-frame').title = 'Map showing ' + businessName + ' in Sargasan, Gandhinagar';
    renderSpecialties(m.specialties || []);
    const max = new Date(); max.setDate(max.getDate() + Number(data.max_days || 90));
    dateInput.min = data.today;
    dateInput.max = max.toISOString().slice(0,10);
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate()+1);
    dateInput.value = tomorrow.toISOString().slice(0,10) > dateInput.max ? data.today : tomorrow.toISOString().slice(0,10);
    renderServiceOptions(data.services || []);
    renderServices(data.services || []);
  }
  function renderSlots(slots) {
    slotArea.innerHTML = '';
    selectedSlot = '';
    timeSelect.innerHTML = '<option value="">Choose an available time</option>';
    timeSelect.disabled = !slots.length;
    if (!slots.length) {
      slotArea.innerHTML = '<div class="slot-empty">No available times on this date. Please choose another day or call the clinic.</div>';
      return;
    }
    const hint = document.createElement('span'); hint.className='slot-hint'; hint.textContent='Select a time:'; slotArea.appendChild(hint);
    slots.forEach(slot => {
      const option = new Option(slot, slot); timeSelect.add(option);
      const b = document.createElement('button'); b.type='button'; b.className='slot-button'; b.textContent=slot;
      b.addEventListener('click', () => {
        selectedSlot = slot; timeSelect.value = slot;
        slotArea.querySelectorAll('.slot-button').forEach(btn => btn.classList.toggle('selected', btn.textContent===slot));
      });
      slotArea.appendChild(b);
    });
  }
  async function loadAvailability() {
    clearError(); selectedSlot=''; slotArea.innerHTML='<span class="slot-hint">Checking available times…</span>';
    timeSelect.disabled=true; timeSelect.innerHTML='<option value="">Checking times…</option>';
    if (!dateInput.value) return;
    try {
      const d = await getJson(`${clinicApi}/availability?date=${encodeURIComponent(dateInput.value)}`);
      renderSlots(d.slots || []);
    } catch (e) {
      slotArea.innerHTML='<div class="slot-empty">'+esc(e.message)+'</div>';
      timeSelect.innerHTML='<option value="">Unavailable</option>';
    }
  }
  function formatDate(date) {
    return new Date(date+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
  }
  function showSuccess(data) {
    form.hidden = true;
    $('#booking-success').hidden = false;
    $('#success-reference').textContent = data.reference || 'REQUEST RECEIVED';
    $('#success-message').textContent = data.message || 'The clinic will review your appointment request.';
    $('#success-summary').textContent = `${data.name} · ${formatDate(data.date)} · ${data.time}`;
    $('#booking-success').scrollIntoView({behavior:'smooth',block:'center'});
  }
  form.addEventListener('submit', async event => {
    event.preventDefault(); clearError();
    if (!form.reportValidity()) return;
    const values = new FormData(form);
    const payload = {
      name: values.get('name'), phone: values.get('phone'), purpose: values.get('purpose'),
      date: values.get('date'), time: values.get('time'), notes: values.get('notes'),
      website: values.get('website')
    };
    if (!payload.time) { showError('Please choose one of the available appointment times.'); return; }
    submitButton.disabled = true; submitButton.classList.add('loading'); submitButton.innerHTML='Sending request…';
    try {
      const result = await postJson(`${clinicApi}/book`, payload);
      if (result.ok) showSuccess({...result, name: payload.name});
      else showError('Your request could not be completed. Please try again.');
    } catch (e) { showError(e.message); }
    finally { submitButton.disabled=false; submitButton.classList.remove('loading'); submitButton.innerHTML='Send appointment request <span>↗</span>'; }
  });
  if ($('#reviews-prev')) $('#reviews-prev').addEventListener('click', () => { reviewPage--; renderReviewPage(); });
  if ($('#reviews-next')) $('#reviews-next').addEventListener('click', () => { reviewPage++; renderReviewPage(); });
  window.addEventListener('resize', () => { clearTimeout(reviewResizeTimer); reviewResizeTimer = setTimeout(renderReviewPage, 140); });
  loadGoogleReviews();
  $('#new-booking').addEventListener('click', () => {
    $('#booking-success').hidden = true; form.hidden=false; form.reset(); selectedSlot=''; loadAvailability();
    $('#book').scrollIntoView({behavior:'smooth'});
  });
  dateInput.addEventListener('change', loadAvailability);
  $('#menu-toggle').addEventListener('click', () => {
    const nav=$('#main-nav'); const open=nav.classList.toggle('open'); $('#menu-toggle').setAttribute('aria-expanded',String(open));
  });
  $('#main-nav').querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{$('#main-nav').classList.remove('open');$('#menu-toggle').setAttribute('aria-expanded','false');}));
  $('#year').textContent = new Date().getFullYear();
  if (location.pathname.replace(/\/$/, '') === '/book' && !location.hash) {
    setTimeout(() => $('#book').scrollIntoView({behavior:'smooth',block:'start'}), 100);
  }
  getJson(`${clinicApi}/clinic`).then(async data => { applyClinicInfo(data); await loadAvailability(); }).catch(err => {
    $('#service-grid').innerHTML='<div class="loading-card">The clinic server is currently unavailable. Please refresh this page or call the clinic.</div>';
    showError(err.message);
  });
})();
