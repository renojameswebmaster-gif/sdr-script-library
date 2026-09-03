const searchInput = document.getElementById("search-input");
const scriptContainer = document.getElementById("scripts-container");
const navButtons = document.querySelectorAll(".nav-btn");
const toast = document.getElementById("toast");
const copyToastBtn = document.getElementById("copy-toast");
const voiceTriggerBtn = document.getElementById("voice-trigger");
const voiceSuggestionsEl = document.getElementById("voice-suggestions");
const appointmentTriggerBtn = document.getElementById("appointment-trigger");
const appointmentCloseBtn = document.getElementById("appointment-close");
const appointmentSection = document.getElementById("appointment");
const timezoneTriggerBtn = document.getElementById("timezone-trigger");
const timezoneCloseBtn = document.getElementById("timezone-close");
const timezoneSection = document.getElementById("timezone-checker");
const ringcentralTriggerBtn = document.getElementById("ringcentral-trigger");
const ringcentralCloseBtn = document.getElementById("ringcentral-close");
const ringcentralSection = document.getElementById("ringcentral");
const slackTriggerBtn = document.getElementById("slack-trigger");
const slackCloseBtn = document.getElementById("slack-close");
const slackSection = document.getElementById("slack");

let state = {
  scripts: [],
  searchQuery: "",
  selectedCategory: "all",
  openCardId: null,
  expandAll: false,
  collapsedIds: new Set(),
  lastCopiedText: "",
  isListening: false,
  suggestions: [],
  autoListen: false
};

let recognition = null;

document.querySelectorAll("[data-app-launch]").forEach((link) => {
  link.addEventListener("click", () => {
    const appName = link.getAttribute("data-app-launch");
    link.textContent = `Opening ${appName} in new tab...`;
    link.classList.add("is-loading");
    link.setAttribute("aria-busy", "true");
  });
});

async function loadScripts() {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const response = await fetch(`./scripts.json?t=${timestamp}`);
    if (!response.ok) throw new Error("Failed to load scripts");
    const data = await response.json();
    return data.scripts || [];
  } catch (error) {
    console.error(error);
    return [];
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2000);
}

function renderVoiceSuggestions(matches) {
  state.suggestions = matches;

  if (!matches.length) {
    voiceSuggestionsEl.classList.add("hidden");
    voiceSuggestionsEl.innerHTML = "";
    return;
  }

  const [topMatch] = matches;

  voiceSuggestionsEl.classList.remove("hidden");
  voiceSuggestionsEl.innerHTML = `
    <button class="suggestion-item compact" data-id="${topMatch.script.id}">
      <span class="suggestion-label">Top Match</span>
      <strong>${topMatch.script.title}</strong>
    </button>
  `;

  voiceSuggestionsEl.querySelectorAll(".suggestion-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const script = state.scripts.find((item) => item.id === id);
      if (script) {
        state.openCardId = id;
        renderScripts();
        showToast("Opened: " + script.title);
      }
    });
  });
}

function normalizeVoiceText(text) {
  return text
    .toLowerCase()
    .replace(/\bim\b/g, "i am")
    .replace(/\bwhat's\b/g, "what is")
    .replace(/\bwho's\b/g, "who is")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildPhraseAliases() {
  return {
    "not interested": ["i'm not interested", "not interested", "not interested second third time"],
    "how much": ["how much does this cost", "paid thing", "cost", "price"],
    "website": ["what's your website", "website"],
    "send me an email": ["send me an email", "email"],
    "facebook": ["facebook"],
    "office manager": ["office manager"],
    "schedule": ["call me back", "schedule"],
    "social media referral network": ["social media referral network", "referral network"]
  };
}

function scoreVoiceMatch(script, transcript) {
  const title = normalizeVoiceText(script.title);
  const content = normalizeVoiceText(script.content);
  const keywords = normalizeVoiceText(script.keywords.join(" "));
  const category = normalizeVoiceText(script.category);
  const transcriptText = normalizeVoiceText(transcript);

  let score = 0;

  if (!transcriptText) return 0;

  const aliases = buildPhraseAliases();

  Object.entries(aliases).forEach(([aliasKeyword, patterns]) => {
    if (patterns.some((pattern) => transcriptText.includes(pattern))) {
      if (title.includes(aliasKeyword) || title.includes(patterns[0])) score += 25;
      if (keywords.includes(aliasKeyword)) score += 18;
      if (content.includes(aliasKeyword)) score += 10;
    }
  });

  if (title.includes(transcriptText)) score += 40;
  if (keywords.includes(transcriptText)) score += 25;
  if (content.includes(transcriptText)) score += 12;
  if (category.includes(transcriptText)) score += 8;

  const transcriptWords = transcriptText.split(" ");
  const titleWords = title.split(" ");
  const keywordWords = keywords.split(" ");

  transcriptWords.forEach((word) => {
    if (word.length < 3) return;
    if (titleWords.includes(word)) score += 5;
    if (keywordWords.includes(word)) score += 3;
    if (content.includes(word)) score += 1;
  });

  return score;
}

function findBestVoiceMatch(transcript) {
  const normalizedTranscript = normalizeVoiceText(transcript);
  if (!normalizedTranscript) return [];

  const rankedMatches = state.scripts
    .map((script) => ({ script, score: scoreVoiceMatch(script, normalizedTranscript) }))
    .filter((entry) => entry.score >= 20)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return rankedMatches;
}

function openScriptByVoice(transcript) {
  const matches = findBestVoiceMatch(transcript);

  if (!matches.length) {
    showToast("No matching script found.");
    return;
  }

  const [bestMatch] = matches;
  state.searchQuery = "";
  state.selectedCategory = "all";
  state.openCardId = bestMatch.script.id;

  navButtons.forEach((b) => b.classList.toggle("active", b.getAttribute("data-category") === "all"));

  renderScripts();
  renderVoiceSuggestions(matches);
}

function setupVoiceRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    voiceTriggerBtn.disabled = true;
    voiceTriggerBtn.title = "Voice search not supported in this browser";
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = true;
  recognition.maxAlternatives = 3;
  recognition.continuous = true;

  recognition.onstart = () => {
    state.isListening = true;
    state.autoListen = true;
    voiceTriggerBtn.classList.add("active");
  };

  recognition.onresult = (event) => {
    const transcript = event.results[event.results.length - 1][0].transcript;
    const matched = findBestVoiceMatch(transcript);

    renderVoiceSuggestions(matched);

    if (event.results[event.results.length - 1].isFinal) {
      openScriptByVoice(transcript);
    }
  };

  recognition.onerror = () => {
    if (state.autoListen && state.isListening) {
      recognition.start();
    }
  };

  recognition.onend = () => {
    voiceTriggerBtn.classList.remove("active");
    if (state.autoListen && state.isListening) {
      recognition.start();
    } else {
      state.isListening = false;
    }
  };

  voiceTriggerBtn.addEventListener("click", () => {
    if (state.isListening) {
      state.autoListen = false;
      state.isListening = false;
      recognition.stop();
      return;
    }

    state.autoListen = true;
    state.isListening = true;
    recognition.start();
  });
}

function filterScripts() {
  return state.scripts.filter((script) => {
    const matchCategory =
      state.selectedCategory === "all" || script.category === state.selectedCategory;
    if (!matchCategory) return false;

    const query = state.searchQuery.toLowerCase();
    if (!query) return true;

    const searchText = `${script.title} ${script.content} ${script.category} ${script.keywords.join(" ")}`.toLowerCase();
    return searchText.includes(query);
  });
}

function renderScripts() {
  const filtered = filterScripts();

  if (filtered.length === 0) {
    scriptContainer.innerHTML =
      '<div class="empty-state">No scripts match your search. Try a different keyword or category.</div>';
    return;
  }

  const visibleScripts = state.openCardId && !state.expandAll
    ? filtered.filter((script) => script.id === state.openCardId)
    : filtered;

  scriptContainer.classList.toggle("focused", Boolean(state.openCardId));
  scriptContainer.classList.toggle("all-open", state.expandAll);

  scriptContainer.innerHTML = visibleScripts
    .map((script) => {
      const isOpen = state.expandAll
        ? !state.collapsedIds.has(script.id)
        : state.openCardId === script.id;
      return `
        <div class="script-card ${isOpen ? "open" : ""}" data-id="${script.id}">
          <div class="script-title">${script.title}</div>
          <div class="script-category">${script.category}</div>
          <div class="script-content">${script.content}</div>
          <div class="script-actions">
            <button class="action-btn copy-btn" data-id="${script.id}">📋 Copy</button>
            <button class="action-btn close-btn" data-id="${script.id}">✕ Close</button>
          </div>
        </div>
      `;
    })
    .join("");

  attachEventListeners();

  if (state.openCardId) {
    setTimeout(() => {
      const openCard = document.querySelector(`.script-card.open`);
      if (openCard) {
        openCard.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 0);
  }
}

function attachEventListeners() {
  // Card click to open - ONLY ONE AT A TIME
  document.querySelectorAll(".script-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (
        !e.target.closest(".action-btn") &&
        !e.target.closest(".copy-btn") &&
        !e.target.closest(".close-btn")
      ) {
        const id = card.getAttribute("data-id");
        // If clicking same card, close it; otherwise close all and open new one
        if (state.expandAll) {
          if (state.collapsedIds.has(id)) {
            state.collapsedIds.delete(id);
          } else {
            state.collapsedIds.add(id);
          }
        } else {
          state.openCardId = state.openCardId === id ? null : id;
        }
        renderScripts();
      }
    });
  });

  // Copy button
  document.querySelectorAll(".copy-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.getAttribute("data-id");
      const script = state.scripts.find((s) => s.id === id);
      if (script) {
        navigator.clipboard.writeText(script.content);
        state.lastCopiedText = script.title;
        showToast("✅ Copied: " + script.title);
      }
    });
  });

  // Close button
  document.querySelectorAll(".close-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.getAttribute("data-id");
      if (state.expandAll) {
        state.collapsedIds.add(id);
      } else {
        state.openCardId = null;
      }
      renderScripts();
    });
  });
}

function init() {
  appointmentTriggerBtn.addEventListener("click", () => {
    timezoneSection.classList.add("hidden");
    ringcentralSection.classList.add("hidden");
    slackSection.classList.add("hidden");
    appointmentSection.classList.remove("hidden");
    appointmentSection.scrollTop = 0;
  });

  appointmentCloseBtn.addEventListener("click", () => {
    appointmentSection.classList.add("hidden");
  });

  timezoneTriggerBtn.addEventListener("click", () => {
    appointmentSection.classList.add("hidden");
    ringcentralSection.classList.add("hidden");
    slackSection.classList.add("hidden");
    timezoneSection.classList.remove("hidden");
    timezoneSection.scrollTop = 0;
  });

  timezoneCloseBtn.addEventListener("click", () => {
    timezoneSection.classList.add("hidden");
  });

  ringcentralTriggerBtn.addEventListener("click", () => {
    appointmentSection.classList.add("hidden");
    timezoneSection.classList.add("hidden");
    slackSection.classList.add("hidden");
    ringcentralSection.classList.remove("hidden");
    ringcentralSection.scrollTop = 0;
  });

  ringcentralCloseBtn.addEventListener("click", () => {
    ringcentralSection.classList.add("hidden");
  });

  slackTriggerBtn.addEventListener("click", () => {
    appointmentSection.classList.add("hidden");
    timezoneSection.classList.add("hidden");
    ringcentralSection.classList.add("hidden");
    slackSection.classList.remove("hidden");
    slackSection.scrollTop = 0;
  });

  slackCloseBtn.addEventListener("click", () => {
    slackSection.classList.add("hidden");
  });

  loadScripts().then((scripts) => {
    state.scripts = scripts;
    renderScripts();
    setupVoiceRecognition();

    // Search
    searchInput.addEventListener("input", (e) => {
      state.searchQuery = e.target.value;
      state.openCardId = null;
      renderScripts();
    });

    // Category navigation
    navButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        navButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        state.selectedCategory = btn.getAttribute("data-category");
        state.openCardId = null;
        state.expandAll = state.selectedCategory !== "all";
        state.collapsedIds.clear();
        renderScripts();
      });
    });

    // Copy toast button shows last copied
    copyToastBtn.addEventListener("click", () => {
      if (state.lastCopiedText) {
        showToast("Last: " + state.lastCopiedText);
      } else {
        showToast("No scripts copied yet");
      }
    });
  });
}

init();
