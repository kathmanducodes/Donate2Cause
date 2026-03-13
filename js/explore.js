const Explore = {
  causes: [],
  categories: [],
  currentCategory: 'all',
  currentSort: 'featured',
  currentDateFilter: 'all',
  currentPage: 1,
  itemsPerPage: 9,
  filteredCauses: [],

  async init() {
    await this.loadData();
    this.parseUrlParams();
    this.renderCategoryFilters();
    this.renderCauses();
    this.initFilterSelects();
    this.bindEvents();
  },

  initFilterSelects() {
    const dateFilterSelect = document.getElementById('date-filter');
    const sortSelect = document.getElementById('sort-select');
    
    if (dateFilterSelect) {
      dateFilterSelect.value = this.currentDateFilter;
    }
    if (sortSelect) {
      sortSelect.value = this.currentSort;
    }
  },

  async loadData() {
    this.showLoader();
    try {
      const response = await fetch('data/causes.json?t=' + Date.now());
      const data = await response.json();
      this.causes = data.causes;
      this.categories = data.categories;
    } catch (error) {
      console.error('Error loading causes:', error);
    }
  },

  parseUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const category = params.get('category');
    const sort = params.get('sort');
    const dateFilter = params.get('date');
    const page = params.get('page');

    if (category && this.categories.find(c => c.id === category)) {
      this.currentCategory = category;
    }
    if (sort) {
      this.currentSort = sort;
    }
    if (dateFilter && ['all', 'ending-7', 'ending-30', 'new-this-week', 'new-this-month'].includes(dateFilter)) {
      this.currentDateFilter = dateFilter;
    }
    if (page) {
      this.currentPage = parseInt(page) || 1;
    }
  },

  showLoader() {
    const container = document.getElementById('causes-grid');
    if (!container) return;
    
    container.innerHTML = `
      <div class="col-span-full flex flex-col items-center justify-center py-20">
        <div class="relative">
          <div class="w-16 h-16 border-4 border-lime-200 border-t-lime-400 rounded-full animate-spin"></div>
          <div class="absolute inset-0 flex items-center justify-center">
            <iconify-icon icon="solar:hand-heart-bold" class="text-2xl text-lime-400 animate-pulse"></iconify-icon>
          </div>
        </div>
        <p class="mt-4 text-zinc-500">Loading causes...</p>
      </div>
    `;
  },

  getFilteredAndSortedCauses() {
    const now = new Date();
    
    this.filteredCauses = this.causes.filter(cause => {
      // Category filter
      if (this.currentCategory !== 'all' && cause.category !== this.currentCategory) {
        return false;
      }
      
      // Date filter
      switch (this.currentDateFilter) {
        case 'ending-7':
          if (cause.daysLeft > 7) return false;
          break;
        case 'ending-30':
          if (cause.daysLeft > 30) return false;
          break;
        case 'new-this-week':
          const createdWeekAgo = new Date(now);
          createdWeekAgo.setDate(createdWeekAgo.getDate() - 7);
          if (new Date(cause.createdAt) < createdWeekAgo) return false;
          break;
        case 'new-this-month':
          const createdMonthAgo = new Date(now);
          createdMonthAgo.setMonth(createdMonthAgo.getMonth() - 1);
          if (new Date(cause.createdAt) < createdMonthAgo) return false;
          break;
      }
      
      return true;
    });

    switch (this.currentSort) {
      case 'featured':
        this.filteredCauses.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        break;
      case 'newest':
        this.filteredCauses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'most-funded':
        this.filteredCauses.sort((a, b) => b.raisedAmount - a.raisedAmount);
        break;
      case 'ending-soon':
        this.filteredCauses.sort((a, b) => a.daysLeft - b.daysLeft);
        break;
    }

    return this.filteredCauses;
  },

  getPaginatedCauses() {
    const filtered = this.getFilteredAndSortedCauses();
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return filtered.slice(start, end);
  },

  getTotalPages() {
    return Math.ceil(this.filteredCauses.length / this.itemsPerPage);
  },

  formatCurrency(amount) {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
      maximumFractionDigits: 0
    }).format(amount).replace('NPR', 'Rs');
  },

  getProgressPercent(raised, goal) {
    return Math.min(Math.round((raised / goal) * 100), 100);
  },

  renderCategoryFilters() {
    const container = document.getElementById('category-filters');
    if (!container) return;

    container.innerHTML = this.categories.map(category => `
      <button 
        class="category-btn px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
          this.currentCategory === category.id 
            ? 'bg-lime-400 text-emerald-950 shadow-lg shadow-lime-400/25' 
            : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
        }"
        data-category="${category.id}"
      >
        <iconify-icon icon="${category.icon}" class="mr-2"></iconify-icon>
        ${category.name}
      </button>
    `).join('');
  },

  handleImageError(img) {
    img.onerror = null;
    img.src = 'data:image/svg+xml,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <rect fill="#18181b" width="100" height="100"/>
        <circle cx="50" cy="50" r="20" fill="#a3e635"/>
        <path d="M50 30 C40 30 35 40 35 50 C35 65 50 75 50 75 C50 75 65 65 65 50 C65 40 60 30 50 30 Z" fill="#18181b"/>
        <circle cx="42" cy="45" r="3" fill="#a3e635"/>
        <circle cx="58" cy="45" r="3" fill="#a3e635"/>
      </svg>
    `);
  },

  renderCauses() {
    const container = document.getElementById('causes-grid');
    if (!container) return;

    // Simulate loading delay for better UX
    setTimeout(() => {
      const paginatedCauses = this.getPaginatedCauses();

      if (this.filteredCauses.length === 0) {
        container.innerHTML = `
          <div class="col-span-full text-center py-16">
            <iconify-icon icon="solar:sad-outline" class="text-6xl text-zinc-300 mb-4"></iconify-icon>
            <p class="text-zinc-500 text-lg">No causes found matching your criteria.</p>
            <p class="text-zinc-400 text-sm mt-2">Try adjusting your filters or check back later.</p>
          </div>
        `;
        this.renderPagination();
        return;
      }

      container.innerHTML = paginatedCauses.map(cause => {
        const progress = this.getProgressPercent(cause.raisedAmount, cause.goalAmount);
        const categoryInfo = this.categories.find(c => c.id === cause.category);

        return `
          <a href="cause.html?id=${cause.id}" class="group block bg-white rounded-[2rem] overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
            <div class="relative h-56 overflow-hidden">
              <img 
                src="${cause.imageUrl}" 
                alt="${cause.title}" 
                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onerror="this.onerror=null; this.src='data:image/svg+xml,' + encodeURIComponent('<svg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 100 100\\'><rect fill=\\'%2318181b\\' width=\\'100\\' height=\\'100\\'/><circle cx=\\'50\\' cy=\\'50\\' r=\\'20\\' fill=\\'%23a3e635\\'/><path d=\\'M50 30 C40 30 35 40 35 50 C35 65 50 75 50 75 C50 75 65 65 65 50 C65 40 60 30 50 30 Z\\' fill=\\'%2318181b\\'/></svg>')"
              >
              <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              <span class="absolute top-4 left-4 rounded-full bg-lime-400/90 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-emerald-950 backdrop-blur">
                ${categoryInfo ? categoryInfo.name : cause.category}
              </span>
            </div>
            <div class="p-6">
              <h3 class="text-xl font-semibold text-zinc-900 mb-2 line-clamp-2 group-hover:text-emerald-800 transition-colors" style="font-family: 'Playfair Display', serif;">
                ${cause.title}
              </h3>
              <p class="text-zinc-500 text-sm mb-4 line-clamp-2">
                ${cause.shortDescription}
              </p>
              <div class="mb-4">
                <div class="h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <div class="h-full bg-lime-400 rounded-full transition-all duration-500" style="width: ${progress}%"></div>
                </div>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="font-semibold text-zinc-900">
                  ${this.formatCurrency(cause.raisedAmount)} <span class="font-normal text-zinc-400">of ${this.formatCurrency(cause.goalAmount)}</span>
                </span>
              </div>
              <div class="flex items-center justify-between mt-3 text-xs text-zinc-400">
                <span class="flex items-center gap-1">
                  <iconify-icon icon="solar:users-group-rounded" class="text-sm"></iconify-icon>
                  ${cause.donorCount} donors
                </span>
                <span class="flex items-center gap-1">
                  <iconify-icon icon="solar:clock-circle-outline" class="text-sm"></iconify-icon>
                  ${cause.daysLeft} days left
                </span>
              </div>
            </div>
          </a>
        `;
      }).join('');

      this.renderPagination();
    }, 300); // Small delay for loader visibility
  },

  renderPagination() {
    const totalPages = this.getTotalPages();
    const container = document.getElementById('pagination-container');
    if (!container) return;

    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    let paginationHtml = `
      <div class="flex items-center justify-center gap-2 mt-12">
    `;

    // Previous button
    if (this.currentPage > 1) {
      paginationHtml += `
        <button class="page-btn flex items-center gap-1 px-4 py-2 rounded-full border border-zinc-200 text-zinc-600 hover:border-lime-400 hover:text-lime-600 transition" data-page="${this.currentPage - 1}">
          <iconify-icon icon="solar:alt-arrow-left-linear"></iconify-icon>
          Previous
        </button>
      `;
    }

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= this.currentPage - 1 && i <= this.currentPage + 1)) {
        paginationHtml += `
          <button class="page-btn w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition ${
            i === this.currentPage 
              ? 'bg-lime-400 text-emerald-950' 
              : 'border border-zinc-200 text-zinc-600 hover:border-lime-400 hover:text-lime-600'
          }" data-page="${i}">
            ${i}
          </button>
        `;
      } else if (i === this.currentPage - 2 || i === this.currentPage + 2) {
        paginationHtml += `<span class="text-zinc-400">...</span>`;
      }
    }

    // Next button
    if (this.currentPage < totalPages) {
      paginationHtml += `
        <button class="page-btn flex items-center gap-1 px-4 py-2 rounded-full border border-zinc-200 text-zinc-600 hover:border-lime-400 hover:text-lime-600 transition" data-page="${this.currentPage + 1}">
          Next
          <iconify-icon icon="solar:alt-arrow-right-linear"></iconify-icon>
        </button>
      `;
    }

    paginationHtml += `</div>`;
    
    // Results count
    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(this.currentPage * this.itemsPerPage, this.filteredCauses.length);
    
    container.innerHTML = `
      <div class="text-center mt-8 text-sm text-zinc-500">
        Showing ${start}-${end} of ${this.filteredCauses.length} causes
      </div>
      ${paginationHtml}
    `;

    // Bind pagination click events
    container.querySelectorAll('.page-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentPage = parseInt(btn.dataset.page);
        this.renderCauses();
        this.updateUrl();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  },

  bindEvents() {
    const categoryContainer = document.getElementById('category-filters');
    const sortSelect = document.getElementById('sort-select');
    const dateFilterSelect = document.getElementById('date-filter');

    if (categoryContainer) {
      categoryContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.category-btn');
        if (btn) {
          this.currentCategory = btn.dataset.category;
          this.currentPage = 1; // Reset to page 1 on filter change
          this.showLoader();
          this.renderCategoryFilters();
          setTimeout(() => {
            this.renderCauses();
            this.updateUrl();
          }, 300);
        }
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.currentSort = e.target.value;
        this.currentPage = 1;
        this.showLoader();
        setTimeout(() => {
          this.renderCauses();
          this.updateUrl();
        }, 300);
      });
    }

    if (dateFilterSelect) {
      dateFilterSelect.addEventListener('change', (e) => {
        this.currentDateFilter = e.target.value;
        this.currentPage = 1;
        this.showLoader();
        setTimeout(() => {
          this.renderCauses();
          this.updateUrl();
        }, 300);
      });
    }
  },

  updateUrl() {
    const params = new URLSearchParams();
    if (this.currentCategory !== 'all') {
      params.set('category', this.currentCategory);
    }
    if (this.currentDateFilter !== 'all') {
      params.set('date', this.currentDateFilter);
    }
    if (this.currentSort !== 'featured') {
      params.set('sort', this.currentSort);
    }
    if (this.currentPage > 1) {
      params.set('page', this.currentPage);
    }

    const newUrl = params.toString() 
      ? `${window.location.pathname}?${params.toString()}` 
      : window.location.pathname;
    
    window.history.pushState({}, '', newUrl);
  }
};

const CauseDetail = {
  cause: null,

  async init() {
    const causeId = new URLSearchParams(window.location.search).get('id');
    
    if (!causeId) {
      console.log('No cause ID in URL');
      this.showError();
      return;
    }

    try {
      const response = await fetch('data/causes.json?t=' + Date.now());
      const data = await response.json();
      this.cause = data.causes.find(c => c.id === causeId);
      
      if (!this.cause) {
        console.log('Cause not found:', causeId);
        this.showError();
        return;
      }
      
      this.render();
    } catch (error) {
      console.error('Error loading cause:', error);
      this.showError();
    }
  },

  formatCurrency(amount) {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
      maximumFractionDigits: 0
    }).format(amount).replace('NPR', 'Rs');
  },

  getProgressPercent(raised, goal) {
    return Math.min(Math.round((raised / goal) * 100), 100);
  },

  formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },

  showError() {
    document.getElementById('cause-content').innerHTML = `
      <div class="text-center py-20">
        <iconify-icon icon="solar:sad-outline" class="text-8xl text-zinc-300 mb-6"></iconify-icon>
        <h2 class="text-2xl font-semibold text-zinc-900 mb-4">Cause Not Found</h2>
        <p class="text-zinc-500 mb-8">The cause you're looking for doesn't exist or has been removed.</p>
        <a href="explore.html" class="inline-flex items-center gap-2 rounded-full bg-lime-400 px-6 py-3 font-medium text-emerald-950 hover:bg-lime-300 transition">
          <iconify-icon icon="solar:arrow-left-linear"></iconify-icon>
          Browse All Causes
        </a>
      </div>
    `;
  },

  render() {
    const cause = this.cause;
    if (!cause) {
      this.showError();
      return;
    }
    
    const progress = this.getProgressPercent(cause.raisedAmount || 0, cause.goalAmount || 1);
    const categories = { medical: 'Medical', education: 'Education', community: 'Community', emergency: 'Emergency' };

    const titleEl = document.getElementById('cause-title');
    const imageEl = document.getElementById('cause-image');
    const categoryEl = document.getElementById('cause-category');
    const organizerEl = document.getElementById('cause-organizer');
    const raisedEl = document.getElementById('raised-amount');
    const goalEl = document.getElementById('goal-amount');
    const progressBar = document.getElementById('progress-bar');
    const progressPercent = document.getElementById('progress-percent');
    const donorCount = document.getElementById('donor-count');
    const daysLeft = document.getElementById('days-left');
    const storyEl = document.getElementById('cause-story');
    
    if (!titleEl || !imageEl || !categoryEl) {
      console.error('Required elements not found in DOM');
      return;
    }

    titleEl.textContent = cause.title || 'Cause';
    imageEl.src = cause.imageUrl || 'assets/medical_emergency.png';
    imageEl.onerror = function() {
      this.onerror = null;
      this.src = 'data:image/svg+xml,' + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
          <rect fill="#18181b" width="100" height="100"/>
          <circle cx="50" cy="50" r="20" fill="#a3e635"/>
          <path d="M50 30 C40 30 35 40 35 50 C35 65 50 75 50 75 C50 75 65 65 65 50 C65 40 60 30 50 30 Z" fill="#18181b"/>
          <circle cx="42" cy="45" r="3" fill="#a3e635"/>
          <circle cx="58" cy="45" r="3" fill="#a3e635"/>
        </svg>
      `);
    };
    categoryEl.textContent = categories[cause.category] || cause.category || 'Cause';

    const organizerName = cause.organizer?.name || 'Organizer';
    const organizerRelationship = cause.organizer?.relationship || '';
    const organizerVerified = cause.organizer?.verified 
      ? `<span class="flex items-center gap-1"><iconify-icon icon="solar:verified-check-bold" class="text-lime-500"></iconify-icon> Verified</span>`
      : '';

    if (organizerEl) {
      organizerEl.innerHTML = `
        Organized by ${organizerName}${organizerRelationship ? ` (${organizerRelationship})` : ''} ${organizerVerified}
      `;
    }

    if (raisedEl) raisedEl.textContent = this.formatCurrency(cause.raisedAmount || 0);
    if (goalEl) goalEl.textContent = `of ${this.formatCurrency(cause.goalAmount || 0)} goal`;
    if (progressBar) progressBar.style.width = `${progress}%`;
    if (progressPercent) progressPercent.textContent = `${progress}% funded`;
    if (donorCount) donorCount.textContent = `${cause.donorCount || 0} donors`;
    if (daysLeft) daysLeft.textContent = `${cause.daysLeft || 0} days left`;

    if (storyEl) storyEl.innerHTML = cause.fullStory || '<p>No description available.</p>';

    const updatesContainer = document.getElementById('cause-updates');
    if (updatesContainer) {
      if (cause.updates && cause.updates.length > 0) {
        updatesContainer.innerHTML = `
          <h3 class="text-xl font-semibold text-zinc-900 mb-6" style="font-family: 'Playfair Display', serif;">Updates</h3>
          <div class="space-y-6">
            ${cause.updates.map(update => `
              <div class="border-l-2 border-lime-400 pl-6 py-2">
                <div class="text-xs text-zinc-400 mb-1">${this.formatDate(update.date)}</div>
                <h4 class="font-semibold text-zinc-900 mb-2">${update.title}</h4>
                <p class="text-zinc-600 text-sm">${update.content}</p>
              </div>
            `).join('')}
          </div>
        `;
      } else {
        updatesContainer.innerHTML = '';
      }
    }

    const beneficiaryName = cause.beneficiary?.name || 'Beneficiary';
    const beneficiaryAge = cause.beneficiary?.age ? `${cause.beneficiary.age} years old` : '';
    const beneficiaryLocation = cause.beneficiary?.location || '';
    
    let beneficiaryInfo = beneficiaryLocation;
    if (beneficiaryAge && beneficiaryLocation) {
      beneficiaryInfo = `${beneficiaryAge} • ${beneficiaryLocation}`;
    } else if (beneficiaryAge) {
      beneficiaryInfo = beneficiaryAge;
    }
    
    const beneficiaryNameEl = document.getElementById('beneficiary-name');
    const beneficiaryInfoEl = document.getElementById('beneficiary-info');
    
    if (beneficiaryNameEl) beneficiaryNameEl.textContent = beneficiaryName;
    if (beneficiaryInfoEl) beneficiaryInfoEl.textContent = beneficiaryInfo;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('causes-grid')) {
    Explore.init();
  }
  if (document.getElementById('cause-content')) {
    CauseDetail.init();
  }
});
