const searchInput = document.getElementById('search-input');
const scriptList = document.getElementById('script-list');
const categoryNav = document.getElementById('category-nav');
const toast = document.getElementById('toast');
const recentList = document.getElementById('recent-list');
const themeToggle = document.getElementById('theme-toggle');
const favoritesPill = document.getElementById('favorites-pill');
const favoritesFab = document.getElementById('favorites-fab');
const backTop = document.getElementById('back-top');

const fallbackScripts = [
  {
    id: 'intro',
    title: 'Intro',
    category: 'Opening',
    content: 'Hi Dr. [NAME], this is [YOUR NAME] with [COMPANY]. I’m reaching out because we help practices improve follow-up and patient communication. I wanted to see if this is something your team would be open to exploring.',
    keywords: ['intro', 'doctor', 'practice', 'call'],
    favorite: false,
  },
  {
    id: 'confirmation-steps',
    title: 'Confirmation Steps',
    category: 'Closing',
    content: 'Thanks for your time today. Before we wrap up, I want to make sure I captured everything correctly. I’ll send you a quick recap and follow up with the next step.',
    keywords: ['confirmation', 'wrap up', 'follow up'],
    favorite: false,
  },
  {
    id: 'im-not-interested',
    title: 'I\'m Not Interested',
    category: 'Objections',
    content: 'I understand. I’m not trying to force anything. I’m simply reaching out because we help practices with a better outbound process. If it ever becomes relevant, I’d be happy to revisit it later.',
    keywords: ['not interested', 'revisit', 'later'],
    favorite: false,
  },
  {
    id: 'social-media-referral-network',
    title: 'Social Media Referral Network',
    category: 'Objections',
    content: 'That makes sense. We’re not looking to replace anything you’re already doing. We’re simply offering another referral channel that can support your existing efforts.',
    keywords: ['social media', 'referral', 'network'],
    favorite: false,
  },
  {
    id: 'im-not-interested-2',
    title: 'I\'m Not Interested (Second Time)',
    category: 'Objections',
    content: 'I hear you. I’ll leave it here for now. If your priorities change, feel free to reach out and I’ll be happy to share more.',
    keywords: ['second time', 'leave it here', 'future'],
    favorite: false,
  },
  {
    id: 'paid-thing',
    title: 'Paid Thing',
    category: 'Objections',
    content: 'I understand. We do not ask for any upfront payment or long-term commitment to get started. We simply want to show you the value first.',
    keywords: ['paid', 'cost', 'upfront'],
    favorite: false,
  },
  {
    id: 'send-me-an-email',
    title: 'Send Me an Email',
    category: 'Objections',
    content: 'Absolutely, I can send over a short overview. I’ll send it to you now so you can review it at your convenience.',
    keywords: ['email', 'send', 'overview'],
    favorite: false,
  },
  {
    id: 'not-doing-anything-until-you-send-something',
    title: 'I\'m Not Doing Anything Until You Send Something',
    category: 'Objections',
    content: 'That’s fair. I can send a short summary right away so you have something concrete to review.',
    keywords: ['send something', 'summary', 'review'],
    favorite: false,
  },
  {
    id: 'office-manager',
    title: 'Office Manager',
    category: 'Objections',
    content: 'Totally understand. If the office manager is the right contact, I’m happy to speak with them directly and keep it brief.',
    keywords: ['office manager', 'contact', 'brief'],
    favorite: false,
  },
  {
    id: 'how-does-it-work',
    title: 'How Does It Work',
    category: 'Objections',
    content: 'The process is simple. We identify opportunities, start with a light introduction, and then let the team decide if it’s a fit.',
    keywords: ['how does it work', 'process', 'simple'],
    favorite: false,
  },
  {
    id: 'why-are-you-doing-this',
    title: 'Why Are You Doing This',
    category: 'Objections',
    content: 'We’re reaching out because we help practices streamline outreach and create better conversations with patients and referral partners.',
    keywords: ['why', 'doing this', 'reach out'],
    favorite: false,
  },
  {
    id: 'how-did-you-select-me',
    title: 'How Did You Select Me',
    category: 'Objections',
    content: 'We generally look for practices that are growing, have a strong patient base, and are open to exploring smarter ways to stay in front of new opportunities.',
    keywords: ['select me', 'criteria', 'growing'],
    favorite: false,
  },
  {
    id: 'five-point-metric-system',
    title: '5 Point Metric System',
    category: 'Objections',
    content: 'We use a simple five-point metric system to measure fit and relevance so we only bring forward opportunities that make sense.',
    keywords: ['5 point', 'metric', 'system'],
    favorite: false,
  },
  {
    id: 'cell-phone-number',
    title: 'Cell Phone Number',
    category: 'Objections',
    content: 'I understand. I can send the information to your office number or direct it to your preferred contact method.',
    keywords: ['cell phone', 'number', 'contact'],
    favorite: false,
  },
  {
    id: 'already-have-facebook',
    title: 'I Already Have Facebook',
    category: 'Objections',
    content: 'That’s great. We’re not trying to replace your current channels. We’re simply adding another layer of visibility and referral support.',
    keywords: ['facebook', 'social', 'visible'],
    favorite: false,
  },
  {
    id: 'call-me-in-two-weeks',
    title: 'Call Me in Two Weeks',
    category: 'Objections',
    content: 'That’s fair. I can circle back in two weeks and keep the conversation light. If it’s useful, I’ll check in then.',
    keywords: ['two weeks', 'call me back', 'later'],
    favorite: false,
  },
  {
    id: 'healthcare-research-division',
    title: 'Healthcare Research Division',
    category: 'Objections',
    content: 'Understood. We work with practices and healthcare teams that want more efficient outreach and stronger visibility in the market.',
    keywords: ['healthcare', 'research', 'division'],
    favorite: false,
  },
  {
    id: 'driving-during-interview',
    title: 'Driving During Interview',
    category: 'Objections',
    content: 'I understand. I can keep this brief and send the information over so you can review it when it’s convenient.',
    keywords: ['driving', 'interview', 'brief'],
    favorite: false,
  },
  {
    id: 'are-you-facebook-or-third-party',
    title: 'Are You Facebook or Third Party',
    category: 'Objections',
    content: 'We’re not a social media platform and we’re not a third-party lead vendor. We’re a service that helps practices improve outreach and conversion opportunities.',
    keywords: ['facebook', 'third party', 'vendor'],
    favorite: false,
  },
  {
    id: 'other-practices',
    title: 'Other Practices',
    category: 'Objections',
    content: 'We work with many practices, but we always tailor the conversation based on your current goals and the opportunities you’re trying to unlock.',
    keywords: ['other practices', 'tailored', 'goals'],
    favorite: false,
  },
  {
    id: 'how-do-you-make-money',
    title: 'How Do You Make Money',
    category: 'Objections',
    content: 'We make money through a simple service model that aligns with the outcomes we help deliver. We’re focused on value and results, not pressure.',
    keywords: ['make money', 'business model', 'value'],
    favorite: false,
  },
  {
    id: 'call-me-back',
    title: 'Call Me Back',
    category: 'Objections',
    content: 'Absolutely. I’ll note your preference and follow up at the time you requested so it’s convenient for you.',
    keywords: ['call me back', 'follow up', 'preference'],
    favorite: false,
  },
  {
    id: 'purpose-of-the-call',
    title: 'Purpose of the Call',
    category: 'Opening',
    content: 'The purpose of my call is simple: to introduce a service that helps practices improve visibility and reach prospects in a more effective way.',
    keywords: ['purpose', 'call', 'introduce'],
    favorite: false,
  },
  {
    id: 'we-dont-accept-new-patients',
    title: 'We Don\'t Accept New Patients',
    category: 'Objections',
    content: 'Understood. In that case, this may not be the right fit. I appreciate your time and will leave you with the information we have available.',
    keywords: ['new patients', 'not a fit', 'appreciate'],
    favorite: false,
  },
  {
    id: 'how-patients-find-practices',
    title: 'How Patients Find Practices',
    category: 'Objections',
    content: 'We help practices improve the way patients discover them and how they stay visible in a crowded market.',
    keywords: ['patients', 'find', 'discover'],
    favorite: false,
  },
  {
    id: 'holiday-script',
    title: 'Holiday Script',
    category: 'Opening',
    content: 'Hi Dr. [NAME], I wanted to reach out during the holiday season to introduce a simple idea that may be useful for your practice in the new year.',
    keywords: ['holiday', 'season', 'new year'],
    favorite: false,
  },
  {
    id: 'website',
    title: 'Website',
    category: 'Closing',
    content: 'Absolutely, I can send you the website link directly so you can review it when you have a moment.',
    keywords: ['website', 'link', 'review'],
    favorite: false,
  },
];

const state = {
  scripts: [],
  searchQuery: '',
  openId: null,
  favorites: new Set(),
  recent: [],
  darkMode: false,
};

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightText(text, query) {
  if (!query) return text;
  const safeQuery = escapeRegExp(query.trim());
  const regex = new RegExp(safeQuery, 'gi');
  return text.replace(regex, (match) => `<mark>${match}</mark>`);
}

function loadTheme() {
  const stored = localStorage.getItem('sdr-theme');
  if (stored === 'dark') {
    state.darkMode = true;
  } else if (stored === 'light') {
    state.darkMode = false;
  } else {
    state.darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  document.body.classList.toggle('dark', state.darkMode);
  themeToggle.textContent = state.darkMode ? '🌙' : '☀️';
}

function saveTheme() {
  localStorage.setItem('sdr-theme', state.darkMode ? 'dark' : 'light');
  themeToggle.textContent = state.darkMode ? '🌙' : '☀️';
}

function loadFavorites() {
  try {
    const saved = JSON.parse(localStorage.getItem('sdr-favorites') || '[]');
    saved.forEach((id) => state.favorites.add(id));
  } catch (error) {
    console.error(error);
  }
}

function saveFavorites() {
  localStorage.setItem('sdr-favorites', JSON.stringify([...state.favorites]));
}

function loadRecent() {
  try {
    const saved = JSON.parse(localStorage.getItem('sdr-recent') || '[]');
    state.recent = saved;
  } catch (error) {
    console.error(error);
  }
}

function saveRecent() {
  localStorage.setItem('sdr-recent', JSON.stringify(state.recent));
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timeoutId);
  showToast.timeoutId = window.setTimeout(() => toast.classList.remove('show'), 1800);
}

async function loadScripts() {
  try {
    const response = await fetch('./scripts.json');
    if (!response.ok) throw new Error('Fallback');
    const data = await response.json();
    return data.scripts || [];
  } catch (error) {
    return fallbackScripts;
  }
}

function getVisibleScripts() {
  const query = state.searchQuery.trim().toLowerCase();
  const filtered = state.scripts.filter((script) => {
    if (!query) return true;
    const haystack = `${script.title} ${script.content} ${script.keywords.join(' ')} ${script.category}`.toLowerCase();
    return haystack.includes(query);
  });

  const favoriteIds = new Set(state.favorites);
  return [...filtered].sort((a, b) => {
    const aFav = favoriteIds.has(a.id) ? 1 : 0;
    const bFav = favoriteIds.has(b.id) ? 1 : 0;
    if (aFav !== bFav) return bFav - aFav;
    return a.title.localeCompare(b.title);
  });
}

function groupByCategory(scripts) {
  const groups = new Map();
  scripts.forEach((script) => {
    if (!groups.has(script.category)) {
      groups.set(script.category, []);
    }
    groups.get(script.category).push(script);
  });
  return [...groups.entries()].map(([category, items]) => ({ category, items }));
}

function renderCategories() {
  const categories = [...new Set(state.scripts.map((script) => script.category))];
  categoryNav.innerHTML = categories
    .map((category) => `<button type="button" data-category="${category}">${category}</button>`)
    .join('');
}

function renderRecent() {
  if (!state.recent.length) {
    recentList.innerHTML = '<span class="chip">No scripts opened yet</span>';
    return;
  }

  recentList.innerHTML = state.recent
    .map((id) => {
      const script = state.scripts.find((item) => item.id === id);
      if (!script) return '';
      return `<button class="chip" type="button" data-id="${script.id}">${script.title}</button>`;
    })
    .join('');
}

function render() {
  const visible = getVisibleScripts();
  const groups = groupByCategory(visible);
  renderCategories();
  renderRecent();

  if (!visible.length) {
    scriptList.innerHTML = '<div class="empty-state">No scripts match your search yet. Try another keyword or clear the search.</div>';
    return;
  }

  scriptList.innerHTML = groups
    .map(({ category, items }) => {
      const sectionItems = items
        .map((script) => {
          const isOpen = state.openId === script.id;
          const isFavorite = state.favorites.has(script.id);
          const highlightedTitle = highlightText(script.title, state.searchQuery);
          const highlightedContent = highlightText(script.content, state.searchQuery);
          const highlightedKeywords = script.keywords.map((keyword) => highlightText(keyword, state.searchQuery)).join('');

          return `
            <article class="script-item ${isOpen ? 'open' : ''}">
              <button class="accordion-trigger" type="button" data-id="${script.id}" aria-expanded="${isOpen}">
                <span class="title-stack">
                  <span class="title">${highlightedTitle}</span>
                  <span class="meta">${script.category}</span>
                </span>
                <span class="favorite-pill" aria-label="Favorite">${isFavorite ? '★' : '☆'}</span>
              </button>
              <div class="accordion-content">
                <div class="script-body">
                  <div class="script-text">${highlightedContent}</div>
                  <div class="keyword-row">${highlightedKeywords ? `<span class="keyword">${highlightedKeywords}</span>` : ''}</div>
                  <div class="action-row">
                    <button class="action-btn" type="button" data-copy="${script.id}">📋 Copy Script</button>
                    <button class="action-btn" type="button" data-favorite="${script.id}">${isFavorite ? '★ Unfavorite' : '☆ Favorite'}</button>
                  </div>
                </div>
              </div>
            </article>
          `;
        })
        .join('');

      return `<section class="script-section"><h3>${category}</h3>${sectionItems}</section>`;
    })
    .join('');
}

function openScript(id) {
  state.openId = id;
  if (!state.recent.includes(id)) {
    state.recent = [id, ...state.recent].slice(0, 5);
    saveRecent();
  } else {
    state.recent = [id, ...state.recent.filter((item) => item !== id)].slice(0, 5);
    saveRecent();
  }
  render();
  const target = document.querySelector(`[data-id="${id}"]`);
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function closeCurrent() {
  state.openId = null;
  render();
}

function toggleFavorite(id) {
  if (state.favorites.has(id)) {
    state.favorites.delete(id);
  } else {
    state.favorites.add(id);
  }
  saveFavorites();
  render();
}

function copyScript(id) {
  const script = state.scripts.find((item) => item.id === id);
  if (!script) return;
  navigator.clipboard.writeText(script.content).then(() => {
    showToast('✅ Script copied!');
  }).catch(() => {
    showToast('⚠️ Copy failed');
  });
}

function focusSearch() {
  searchInput.focus();
  searchInput.select();
}

function handleCategoryNav(event) {
  const button = event.target.closest('[data-category]');
  if (!button) return;
  const category = button.getAttribute('data-category');
  const section = Array.from(document.querySelectorAll('.script-section')).find((node) => node.querySelector('h3')?.textContent === category);
  if (section) {
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function handleScriptInteractions(event) {
  const trigger = event.target.closest('.accordion-trigger');
  if (trigger) {
    const id = trigger.getAttribute('data-id');
    if (state.openId === id) {
      closeCurrent();
    } else {
      openScript(id);
    }
    return;
  }

  const favoriteButton = event.target.closest('[data-favorite]');
  if (favoriteButton) {
    toggleFavorite(favoriteButton.getAttribute('data-favorite'));
    return;
  }

  const copyButton = event.target.closest('[data-copy]');
  if (copyButton) {
    copyScript(copyButton.getAttribute('data-copy'));
  }
}

function handleRecentClick(event) {
  const button = event.target.closest('[data-id]');
  if (!button) return;
  const id = button.getAttribute('data-id');
  const script = state.scripts.find((item) => item.id === id);
  if (script) {
    state.openId = id;
    render();
    const card = document.querySelector(`[data-id="${id}"]`);
    card?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function initEvents() {
  searchInput.addEventListener('input', (event) => {
    state.searchQuery = event.target.value;
    render();
  });

  scriptList.addEventListener('click', handleScriptInteractions);
  categoryNav.addEventListener('click', handleCategoryNav);
  recentList.addEventListener('click', handleRecentClick);

  themeToggle.addEventListener('click', () => {
    state.darkMode = !state.darkMode;
    document.body.classList.toggle('dark', state.darkMode);
    saveTheme();
  });

  favoritesPill.addEventListener('click', () => {
    const favoriteId = [...state.favorites][0];
    if (!favoriteId) {
      showToast('⭐ No favorites yet');
      return;
    }
    const script = state.scripts.find((item) => item.id === favoriteId);
    if (script) {
      state.openId = script.id;
      render();
      document.querySelector(`[data-id="${script.id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      showToast(`⭐ Opened ${script.title}`);
    }
  });

  favoritesFab.addEventListener('click', () => {
    const favoriteId = [...state.favorites][0];
    if (!favoriteId) {
      showToast('⭐ No favorites yet');
      return;
    }
    const script = state.scripts.find((item) => item.id === favoriteId);
    if (script) {
      state.openId = script.id;
      render();
      document.querySelector(`[data-id="${script.id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      showToast(`⭐ Opened ${script.title}`);
    }
  });

  backTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      focusSearch();
      return;
    }

    if (event.key === 'Escape' && state.openId) {
      closeCurrent();
    }
  });
}

async function init() {
  loadTheme();
  loadFavorites();
  loadRecent();
  state.scripts = await loadScripts();
  initEvents();
  render();
}

init();
