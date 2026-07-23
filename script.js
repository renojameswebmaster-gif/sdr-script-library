const searchInput = document.getElementById("search-input");
const scriptContainer = document.getElementById("scripts-container");
const navButtons = document.querySelectorAll(".nav-btn");
const toast = document.getElementById("toast");
const backTopBtn = document.getElementById("back-top");
const copyToastBtn = document.getElementById("copy-toast");

let state = {
  scripts: [],
  searchQuery: "",
  selectedCategory: "all",
  openCardId: null,
  lastCopiedText: ""
};

async function loadScripts() {
  try {
    const response = await fetch("./scripts.json?v=1");
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

  scriptContainer.innerHTML = filtered
    .map((script) => {
      const isOpen = state.openCardId === script.id;
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

  // Scroll opened card into view and center it
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
        if (state.openCardId === id) {
          state.openCardId = null;
        } else {
          state.openCardId = id; // This automatically closes any other open card
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
      state.openCardId = null;
      renderScripts();
    });
  });
}

function init() {
  loadScripts().then((scripts) => {
    state.scripts = scripts;
    renderScripts();

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
        renderScripts();
      });
    });

    // Back to top
    backTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
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
