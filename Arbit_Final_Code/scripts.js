document.addEventListener('DOMContentLoaded', function () {
  // 1. Main Navigation Handling
  const mainNavLinks = document.querySelectorAll('.nav-links a');
  const currentPath = window.location.pathname;

  // Function to determine which main section we're in
  const determineCurrentSection = () => {
    // Default to 'home' if no match
    let currentSection = 'home';

    // Check if we're in categories section
    if (
      currentPath.includes('categories') ||
      currentPath.includes('bestsellers') ||
      currentPath.includes('award-winners') ||
      currentPath.includes('new-releases') ||
      currentPath.includes('new-arrivals') ||
      currentPath.includes('coming-soon') ||
      currentPath.includes('deals')
    ) {
      currentSection = 'categories';
    } else if (currentPath.includes('about')) {
      currentSection = 'about';
    }

    return currentSection;
  };

  // Set active state for main navigation
  const updateMainNavigation = () => {
    const currentSection = determineCurrentSection();

    // Remove active class from all main nav links
    mainNavLinks.forEach((link) => {
      link.classList.remove('active');
      // Remove any existing indicators
      const existingIndicator = link.querySelector('.page-indicator');
      if (existingIndicator) {
        existingIndicator.remove();
      }
    });

    // Add active class and indicator to current section
    mainNavLinks.forEach((link) => {
      const linkHref = link.getAttribute('href');

      if (
        (currentSection === 'home' &&
          (linkHref === 'UserDashboard.html' ||
            linkHref === '/' ||
            linkHref === '#')) ||
        (currentSection === 'categories' && linkHref === 'categories.html') ||
        (currentSection === 'about' && linkHref === 'about.html')
      ) {
        link.classList.add('active');

        // Add underscore indicator for categories
        if (currentSection === 'categories') {
          const indicator = document.createElement('span');
          indicator.className = 'page-indicator';
          indicator.textContent = '_';
          link.appendChild(indicator);
        }
      }
    });

    // Show/hide sliders based on section
    const sliders = document.querySelectorAll('.book-slider');
    if (currentSection === 'home') {
      sliders.forEach((slider) => (slider.style.display = 'block'));
    } else {
      sliders.forEach((slider) => (slider.style.display = 'none'));
    }
  };

  // 2. Category Tabs Handling
  const categoryTabs = document.querySelectorAll('.category-tabs .tab');

  // Set active tab within categories
  const setActiveTab = (activeTab) => {
    // First save which main nav section we're in
    const currentSection = determineCurrentSection();

    // Remove active class from all tabs
    categoryTabs.forEach((tab) => {
      tab.classList.remove('active');
    });

    // Add active class to clicked tab
    activeTab.classList.add('active');

    // Store selected tab in session storage
    sessionStorage.setItem('activeTabHref', activeTab.getAttribute('href'));

    // Make sure the main navigation still shows we're in the categories section
    if (currentSection === 'categories') {
      updateMainNavigation();
    }
  };

  // Set initial active tab based on URL or stored preference
  const initializeCategoryTabs = () => {
    if (categoryTabs.length === 0) return;

    const storedActiveTabHref = sessionStorage.getItem('activeTabHref');
    let activeTabFound = false;

    // First try to match the current URL path
    categoryTabs.forEach((tab) => {
      const tabPath = tab.getAttribute('href');
      if (currentPath.endsWith(tabPath)) {
        setActiveTab(tab);
        activeTabFound = true;
      }
    });

    // If no match by URL, try the stored tab
    if (!activeTabFound && storedActiveTabHref) {
      categoryTabs.forEach((tab) => {
        if (tab.getAttribute('href') === storedActiveTabHref) {
          setActiveTab(tab);
          activeTabFound = true;
        }
      });
    }

    // If still no match, default to first tab
    if (!activeTabFound) {
      setActiveTab(categoryTabs[0]);
    }
  };

  // Add click events to category tabs
  categoryTabs.forEach((tab) => {
    tab.addEventListener('click', function (e) {
      setActiveTab(this);
    });
  });

  // Add click events to main navigation
  mainNavLinks.forEach((link) => {
    link.addEventListener('click', function (e) {
      // Clear the active class from all main nav links
      mainNavLinks.forEach((l) => l.classList.remove('active'));

      // Add active class to clicked link
      this.classList.add('active');

      // If it's the categories link, ensure proper handling
      if (this.getAttribute('href') === 'categories.html') {
        // Reset active tab to "All Books" when clicking Categories in main nav
        if (categoryTabs.length > 0) {
          setActiveTab(categoryTabs[0]);
        }
      }
    });
  });

  // Add styles for navigation and tabs
  const addStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
            /* Main navigation styling */
            .nav-links a {
                position: relative;
                transition: color 0.3s ease;
            }
            
            .nav-links a.active {
                color: var(--primary-color, #1c7ed6);
                font-weight: bold;
            }
            
            .nav-links a.active::after {
                content: '';
                position: absolute;
                bottom: -5px;
                left: 0;
                width: 100%;
                height: 2px;
                background-color: var(--primary-color, #1c7ed6);
            }
            
            .page-indicator {
                display: inline-block;
                font-weight: bold;
                margin-left: 5px;
                color: var(--primary-color, #1c7ed6);
            }
            
            /* Category tabs styling */
            .category-tabs .tab {
                position: relative;
                padding: 12px 20px;
                margin: 0 5px;
                font-weight: 400;
                color: #555;
                text-decoration: none;
                transition: all 0.3s ease;
                border-bottom: 2px solid transparent;
            }
            
            .category-tabs .tab:hover {
                color: var(--primary-color, #1c7ed6);
            }
            
           .category-tabs .tab.active {
            color: #f4f4f4;
            font-weight: 600;
        }
            
            .category-tabs .tab:not(.active)::after {
                content: '';
                position: absolute;
                bottom: -2px;
                left: 0;
                width: 0;
                height: 2px;
                background-color: var(--primary-color, #1c7ed6);
                transition: width 0.3s ease;
            }
            
            .category-tabs .tab:not(.active):hover::after {
                width: 100%;
            }
            
            /* Responsive tabs */
            @media (max-width: 768px) {
                .category-tabs .tabs-container {
                    display: flex;
                    flex-wrap: nowrap;
                    overflow-x: auto;
                    -webkit-overflow-scrolling: touch;
                    scrollbar-width: none;
                    padding-bottom: 5px;
                }
                
                .category-tabs .tabs-container::-webkit-scrollbar {
                    display: none;
                }
                
                .category-tabs .tab {
                    flex: 0 0 auto;
                    white-space: nowrap;
                }
            }
        `;
    document.head.appendChild(style);
  };

  // Make tabs horizontally scrollable on mobile
  const setupMobileScrolling = () => {
    const tabsContainer = document.querySelector('.tabs-container');
    if (!tabsContainer) return;

    const scrollToActiveTab = () => {
      const activeTab = document.querySelector('.category-tabs .tab.active');
      if (activeTab && window.innerWidth <= 768) {
        const containerWidth = tabsContainer.offsetWidth;
        const tabWidth = activeTab.offsetWidth;
        const tabLeft = activeTab.offsetLeft;
        const scrollPosition = tabLeft - containerWidth / 2 + tabWidth / 2;

        tabsContainer.scrollTo({
          left: Math.max(0, scrollPosition),
          behavior: 'smooth'
        });
      }
    };

    scrollToActiveTab();
    window.addEventListener('resize', scrollToActiveTab);
  };

  // Breadcrumb functionality to show current path
  const addBreadcrumbs = () => {
    // Create breadcrumbs if not exists
    if (!document.querySelector('.breadcrumbs')) {
      const currentSection = determineCurrentSection();
      let breadcrumbHTML = '';

      // Only create breadcrumbs for category pages
      if (currentSection === 'categories') {
        const breadcrumbsDiv = document.createElement('div');
        breadcrumbsDiv.className = 'breadcrumbs';

        // Get active category tab
        let categoryName = 'All Books'; // default
        const activeTab = document.querySelector('.category-tabs .tab.active');
        if (activeTab) {
          categoryName = activeTab.textContent;
        }

        breadcrumbHTML = `
                    <div class="container">
                        <nav aria-label="breadcrumb">
                            <ol class="breadcrumb">
                                <li class="breadcrumb-item"><a href="UserDashboard.html">Home</a></li>
                                <li class="breadcrumb-item"><a href="categories.html">Categories</a></li>
                                <li class="breadcrumb-item active" aria-current="page">${categoryName}</li>
                            </ol>
                        </nav>
                    </div>
                `;

        breadcrumbsDiv.innerHTML = breadcrumbHTML;

        // Insert after header or after category-tabs
        const categoryTabs = document.querySelector('.category-tabs');
        if (categoryTabs) {
          categoryTabs.parentNode.insertBefore(
            breadcrumbsDiv,
            categoryTabs.nextSibling
          );
        } else {
          const header = document.querySelector('header');
          if (header) {
            header.parentNode.insertBefore(breadcrumbsDiv, header.nextSibling);
          }
        }

        // Add breadcrumb styles
        const style = document.createElement('style');
        style.textContent = `
                    .breadcrumbs {
                        background-color: #f8f9fa;
                        padding: 10px 0;
                        margin-bottom: 20px;
                    }
                    
                    .breadcrumb {
                        display: flex;
                        flex-wrap: wrap;
                        padding: 0;
                        margin-bottom: 0;
                        list-style: none;
                    }
                    
                    .breadcrumb-item {
                        color: #6c757d;
                    }
                    
                    .breadcrumb-item + .breadcrumb-item::before {
                        display: inline-block;
                        padding: 0 8px;
                        color: #6c757d;
                        content: "/";
                    }
                    
                    .breadcrumb-item a {
                        color: #1c7ed6;
                        text-decoration: none;
                    }
                    
                    .breadcrumb-item a:hover {
                        text-decoration: underline;
                    }
                    
                    .breadcrumb-item.active {
                        color: #495057;
                        font-weight: 500;
                    }
                `;
        document.head.appendChild(style);
      }
    }
  };

  // Initialize everything
  addStyles();
  updateMainNavigation();
  initializeCategoryTabs();
  setupMobileScrolling();

  // Add breadcrumbs for better navigation context
  addBreadcrumbs();

  // Update breadcrumbs when category tabs change
  categoryTabs.forEach((tab) => {
    tab.addEventListener('click', function () {
      // Remove existing breadcrumbs
      const existingBreadcrumbs = document.querySelector('.breadcrumbs');
      if (existingBreadcrumbs) {
        existingBreadcrumbs.remove();
      }

      // Re-add with updated info
      setTimeout(addBreadcrumbs, 50);
    });
  });
});
