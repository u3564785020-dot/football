// Search functionality for 4 World Cup matches
console.log('🔍 Search functionality loaded');

// Match data
const matches = [
  {
    id: 'match24',
    title: 'World Cup 2026 Tickets Match 24 | Mexico City Estadio Azteca, June 17',
    keywords: ['match 24', 'june 17', 'estadio azteca', 'mexico city', 'azteca'],
    url: '/products/fifa-world-cup-2026-match-24-mexico-city.html'
  },
  {
    id: 'match53',
    title: 'FIFA World Cup 2026 tickets Match 53 - Mexico vs. TBD - Estadio Azteca - June 24',
    keywords: ['match 53', 'june 24', 'estadio azteca', 'mexico vs tbd'],
    url: '/products/fifa-world-cup-2026-match-53-mexico-city.html'
  },
  {
    id: 'match28',
    title: 'FIFA World Cup 2026 tickets Match 28 - Mexico vs. TBD - Estadio Akron - June 18',
    keywords: ['match 28', 'june 18', 'estadio akron', 'guadalajara', 'akron'],
    url: '/'
  },
  {
    id: 'opening',
    title: 'FIFA World Cup 2026 Opening Match Tickets | Mexico vs TBD | Estadio Azteca',
    keywords: ['opening match', 'opening', 'estadio azteca', 'mexico vs tbd', 'first match'],
    url: '/products/fifa-world-cup-2026-match-1-mexico-estadio-azteca.html'
  }
];

// Create search modal HTML
function createSearchModal() {
  const modalHTML = `
    <div id="search-modal" class="search-modal" style="display: none;">
      <div class="search-modal-overlay"></div>
      <div class="search-modal-content">
        <button class="search-modal-close">&times;</button>
        <div class="search-input-wrapper">
          <input 
            type="text" 
            id="search-input" 
            class="search-input" 
            placeholder="Search matches (e.g., Match 24, Estadio Azteca, June 17)..."
            autocomplete="off"
          />
        </div>
        <div id="search-results" class="search-results"></div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  console.log('✅ Search modal created');
}

// Search function
function searchMatches(query) {
  if (!query || query.length < 2) {
    return [];
  }
  
  const lowerQuery = query.toLowerCase();
  
  return matches.filter(match => {
    // Search in title
    if (match.title.toLowerCase().includes(lowerQuery)) {
      return true;
    }
    
    // Search in keywords
    return match.keywords.some(keyword => 
      keyword.toLowerCase().includes(lowerQuery)
    );
  });
}

// Display search results
function displayResults(results) {
  const resultsContainer = document.getElementById('search-results');
  
  if (results.length === 0) {
    resultsContainer.innerHTML = '<div class="search-no-results">No matches found. Try "Match 24", "Estadio Azteca", or "June 17"</div>';
    return;
  }
  
  const resultsHTML = results.map(match => `
    <div class="search-result-item" data-url="${match.url}">
      <div class="search-result-title">${match.title}</div>
    </div>
  `).join('');
  
  resultsContainer.innerHTML = resultsHTML;
  
  // Add click handlers
  document.querySelectorAll('.search-result-item').forEach(item => {
    item.addEventListener('click', function() {
      const url = this.getAttribute('data-url');
      // Navigate to product page or homepage
      window.location.href = url;
    });
  });
}

// Open search modal
function openSearchModal() {
  const modal = document.getElementById('search-modal');
  if (modal) {
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Focus on input
    setTimeout(() => {
      const input = document.getElementById('search-input');
      if (input) {
        input.focus();
      }
    }, 100);
    
    console.log('🔍 Search modal opened');
  }
}

// Close search modal
function closeSearchModal() {
  const modal = document.getElementById('search-modal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = '';
    
    // Clear search
    const input = document.getElementById('search-input');
    const results = document.getElementById('search-results');
    if (input) input.value = '';
    if (results) results.innerHTML = '';
    
    console.log('❌ Search modal closed');
  }
}

// Initialize search functionality
function initSearch() {
  console.log('🚀 Initializing search functionality...');
  
  // Create modal
  createSearchModal();
  
  // Add event listeners
  const searchButtons = document.querySelectorAll('.search-trigger, #search-button, a[href*="search"]');
  searchButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      openSearchModal();
    });
  });
  if (searchButtons.length > 0) {
    console.log('✅ Search button listeners added');
  }
  
  // Close button
  const closeButton = document.querySelector('.search-modal-close');
  if (closeButton) {
    closeButton.addEventListener('click', closeSearchModal);
  }
  
  // Overlay click
  const overlay = document.querySelector('.search-modal-overlay');
  if (overlay) {
    overlay.addEventListener('click', closeSearchModal);
  }
  
  // Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeSearchModal();
    }
  });
  
  // Search input
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      const query = this.value;
      const results = searchMatches(query);
      displayResults(results);
    });
  }
  
  console.log('✅ Search functionality initialized');
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSearch);
} else {
  initSearch();
}

