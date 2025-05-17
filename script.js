import { books, authors, genres, BOOKS_PER_PAGE } from './data.js';

const state = {
  page: 1,
  matches: null,
};

// This function creates a preview button for a book (shows cover, title, and author)
function createBookPreview({ author, id, image, title }, authors) {
    const element = document.createElement('button');
    element.classList = 'preview';
    element.setAttribute('data-preview', id);
    element.setAttribute('role', 'button');
    element.setAttribute('aria-label', `View details for ${title}`);
  
    element.innerHTML = `
      <img class="preview__image" src="${image}" alt="Cover of ${title}" />
      <div class="preview__info">
        <h3 class="preview__title">${title}</h3>
        <div class="preview__author">${authors[author] || 'Unknown Author'}</div>
      </div>
    `;
  
    return element;
  }
  
  // This function adds book previews to the page inside the given container (start and end for pagination)
  function appendBookPreviews(books, container, authors, start = 0, end = BOOKS_PER_PAGE) {
    const fragment = document.createDocumentFragment();
    for (const book of books.slice(start, end)) {
      fragment.appendChild(createBookPreview(book, authors));
    }
    container.appendChild(fragment);
  }
  
  // This function fills a select dropdown with options (like genres or authors)
  function populateSelect(options, container, defaultOption = { value: 'any', text: 'All' }) {
    const fragment = document.createDocumentFragment();
    const defaultElement = document.createElement('option');
    defaultElement.value = defaultOption.value;
    defaultElement.innerText = defaultOption.text;
    fragment.appendChild(defaultElement);
  
    for (const [id, name] of Object.entries(options)) {
      const element = document.createElement('option');
      element.value = id;
      element.innerText = name;
      fragment.appendChild(element);
    }
  
    container.appendChild(fragment);
  }
  
  // This function applies the theme (night or day) by changing CSS variables on the page
  function applyTheme(theme) {
    const themes = {
      night: { '--color-dark': '255, 255, 255', '--color-light': '10, 10, 20' },
      day: { '--color-dark': '10, 10, 20', '--color-light': '255, 255, 255' },
    };
  
    const selectedTheme = themes[theme] || themes.day;
    for (const [property, value] of Object.entries(selectedTheme)) {
      document.documentElement.style.setProperty(property, value);
    }
  }
  
  // This function updates the "Show More" button (how many books left to show)
  function updateShowMoreButton() {
    const listButton = document.querySelector('[data-list-button]');
    if (!listButton) {
      console.error('Element [data-list-button] not found');
      return;
    }
  
    const remaining = Math.max(0, state.matches.length - state.page * BOOKS_PER_PAGE);
    listButton.innerHTML = `
      <span>Show more</span>
      <span class="list__remaining"> (${remaining})</span>
    `;
    listButton.disabled = remaining < 1;
  }
  
  // This is the main function to set up the page when it loads (adds books, dropdowns, theme, etc.)
  function initializeApp() {
    state.matches = books;
  
    const listItems = document.querySelector('[data-list-items]');
    if (listItems) {
      appendBookPreviews(state.matches, listItems, authors);
    } else {
      console.error('Element [data-list-items] not found');
    }
  
    const searchGenres = document.querySelector('[data-search-genres]');
    if (searchGenres) {
      populateSelect(genres, searchGenres, { value: 'any', text: 'All Genres' });
    } else {
      console.error('Element [data-search-genres] not found');
    }
  
    const searchAuthors = document.querySelector('[data-search-authors]');
    if (searchAuthors) {
      populateSelect(authors, searchAuthors, { value: 'any', text: 'All Authors' });
    } else {
      console.error('Element [data-search-authors] not found');
    }
  
    const themeElement = document.querySelector('[data-settings-theme]');
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    const initialTheme = prefersDark ? 'night' : 'day';
  
    if (themeElement) {
      themeElement.value = initialTheme;
      applyTheme(initialTheme);
    } else {
      console.error('Element [data-settings-theme] not found');
    }
  
    updateShowMoreButton();
  }
  
  // This function handles searching when the user submits the search form (filters books based on title, author, genre)
  function handleSearchSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const filters = Object.fromEntries(formData);
    const result = [];
  
    for (const book of books) {
      let genreMatch = filters.genre === 'any';
      for (const singleGenre of book.genres) {
        if (genreMatch) break;
        if (singleGenre === filters.genre) genreMatch = true;
      }
  
      if (
        (filters.title.trim() === '' || book.title.toLowerCase().includes(filters.title.toLowerCase())) &&
        (filters.author === 'any' || book.author === filters.author) &&
        genreMatch
      ) {
        result.push(book);
      }
    }
  
    state.page = 1;
    state.matches = result;
  
    const listMessage = document.querySelector('[data-list-message]');
    const listItems = document.querySelector('[data-list-items]');
    if (listMessage && listItems) {
      listMessage.classList.toggle('list__message_show', result.length < 1);
      listItems.innerHTML = '';
      appendBookPreviews(result, listItems, authors);
    } else {
      console.error('Element [data-list-message] or [data-list-items] not found');
    }
  
    updateShowMoreButton();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.querySelector('[data-search-overlay]').open = false;
  }
  
  // This function adds more books when user clicks "Show More"
  function handleShowMore() {
    const listItems = document.querySelector('[data-list-items]');
    if (listItems) {
      appendBookPreviews(state.matches, listItems, authors, state.page * BOOKS_PER_PAGE, (state.page + 1) * BOOKS_PER_PAGE);
      state.page += 1;
      updateShowMoreButton();
    } else {
      console.error('Element [data-list-items] not found');
    }
  }
  
  // This function shows the book details when a book preview is clicked
  function handleBookPreviewClick(event) {
    const pathArray = Array.from(event.composedPath?.() || [event.target]);
    let active = null;
  
    for (const node of pathArray) {
      if (node?.dataset?.preview) {
        active = books.find(book => book.id === node.dataset.preview);
        break;
      }
    }
  
    if (active) {
      const listActive = document.querySelector('[data-list-active]');
      if (listActive) {
        listActive.open = true;
        document.querySelector('[data-list-blur]').src = active.image;
        document.querySelector('[data-list-image]').src = active.image;
        document.querySelector('[data-list-title]').innerText = active.title;
        document.querySelector('[data-list-subtitle]').innerText = `${authors[active.author] || 'Unknown Author'} (${new Date(active.published).getFullYear()})`;
        document.querySelector('[data-list-description]').innerText = active.description;
      } else {
        console.error('Element [data-list-active] not found');
      }
    }
  }
  
  // This function handles theme change form submit (applies selected theme)
  function handleThemeSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const { theme } = Object.fromEntries(formData);
    applyTheme(theme);
    document.querySelector('[data-settings-overlay]').open = false;
  }
  
  // This function adds all event listeners for buttons, forms, etc.
  function setupEventListeners() {
    const selectors = {
      searchCancel: '[data-search-cancel]',
      settingsCancel: '[data-settings-cancel]',
      headerSearch: '[data-header-search]',
      headerSettings: '[data-header-settings]',
      listClose: '[data-list-close]',
      searchForm: '[data-search-form]',
      settingsForm: '[data-settings-form]',
      listButton: '[data-list-button]',
      listItems: '[data-list-items]',
    };
  
    const elements = Object.fromEntries(
      Object.entries(selectors).map(([key, selector]) => [key, document.querySelector(selector)])
    );
  
    if (elements.searchCancel) {
      elements.searchCancel.addEventListener('click', () => {
        document.querySelector('[data-search-overlay]').open = false;
      });
    }
  
    if (elements.settingsCancel) {
      elements.settingsCancel.addEventListener('click', () => {
        document.querySelector('[data-settings-overlay]').open = false;
      });
    }
  
    if (elements.headerSearch) {
      elements.headerSearch.addEventListener('click', () => {
        const searchOverlay = document.querySelector('[data-search-overlay]');
        if (searchOverlay) {
          searchOverlay.open = true;
          document.querySelector('[data-search-title]')?.focus();
        }
      });
    }
  
    if (elements.headerSettings) {
      elements.headerSettings.addEventListener('click', () => {
        document.querySelector('[data-settings-overlay]').open = true;
      });
    }
  
    if (elements.listClose) {
      elements.listClose.addEventListener('click', () => {
        document.querySelector('[data-list-active]').open = false;
      });
    }
  
    if (elements.searchForm) {
      elements.searchForm.addEventListener('submit', handleSearchSubmit);
    }
  
    if (elements.settingsForm) {
      elements.settingsForm.addEventListener('submit', handleThemeSubmit);
    }
  
    if (elements.listButton) {
      elements.listButton.addEventListener('click', handleShowMore);
    }
  
    if (elements.listItems) {
      elements.listItems.addEventListener('click', handleBookPreviewClick);
    }
  
    const myButton = document.querySelector('button');
    if (myButton) {
      myButton.addEventListener('click', () => {
        console.log('Button clicked!');
      });
    } else {
      console.warn('Element button not found');
    }
  }

  fetch('http://localhost:5500/api/prompts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      // your data here
    }),
  });
  
  // This runs everything when the page finishes loading (initializes app and events)
  document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
  });
  