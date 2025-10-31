/**
 * Navbar Loader and Manager
 * Handles dynamic loading of navbar HTML and active link highlighting
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    navbarMountId: 'navbar',
    navbarPath: 'partials/navbar.html',
    activeClass: 'active'
  };

  /**
   * Loads and injects the navbar HTML
   */
  async function loadNavbar() {
    const mount = document.getElementById(CONFIG.navbarMountId);
    if (!mount) {
      console.warn('Navbar mount element not found');
      return;
    }

    try {
      const res = await fetch(CONFIG.navbarPath);
      if (!res.ok) {
        throw new Error(`Failed to load navbar: ${res.status} ${res.statusText}`);
      }
      
      const html = await res.text();
      mount.innerHTML = html;

      // Initialize navbar functionality after injection
      initializeNavbar(mount);
    } catch (err) {
      console.error('Navbar injection error:', err);
      // Fallback: show a simple navbar if fetch fails
      mount.innerHTML = createFallbackNavbar();
      initializeNavbar(mount);
    }
  }

  /**
   * Initialize navbar features (active links, mobile menu, etc.)
   */
  function initializeNavbar(container) {
    highlightActiveLink(container);
    setupMobileMenu(container);
    setupSmoothScrolling(container);
    checkAuthState(container);
  }

  /**
   * Checks authentication state and updates navbar accordingly
   */
  async function checkAuthState(container) {
    // Check if Firebase is available
    if (typeof firebase === 'undefined' || !firebase.auth) {
      // Try to check localStorage token as fallback
      const token = localStorage.getItem('cc_idToken');
      if (token) {
        updateNavbarForAuth(container, true);
      }
      return;
    }

    try {
      const auth = firebase.auth();
      
      // Check current user
      const currentUser = auth.currentUser;
      if (currentUser) {
        updateNavbarForAuth(container, true, currentUser);
        return;
      }

      // Listen for auth state changes
      auth.onAuthStateChanged((user) => {
        if (user) {
          updateNavbarForAuth(container, true, user);
        } else {
          updateNavbarForAuth(container, false);
        }
      });

      // Also check localStorage as fallback
      const token = localStorage.getItem('cc_idToken');
      if (token && !currentUser) {
        // Token exists but no current user - might be in transition
        updateNavbarForAuth(container, true);
      }
    } catch (err) {
      console.warn('Auth state check failed:', err);
      // Fallback to localStorage check
      const token = localStorage.getItem('cc_idToken');
      updateNavbarForAuth(container, !!token);
    }
  }

  /**
   * Updates navbar to show/hide login button and show logout/profile
   */
  function updateNavbarForAuth(container, isLoggedIn, user = null) {
    const loginBtn = container.querySelector('.login-btn:not(.logout-btn)');
    const navLinks = container.querySelector('.nav-links');
    
    if (!navLinks) return;

    if (isLoggedIn) {
      // Hide login button (only if it's not already a logout button)
      if (loginBtn && !loginBtn.classList.contains('logout-btn')) {
        loginBtn.style.display = 'none';
      }

      // Check if logout button already exists
      let logoutBtn = navLinks.querySelector('.logout-btn');
      if (!logoutBtn) {
        // Create logout button
        logoutBtn = document.createElement('a');
        logoutBtn.href = '#';
        logoutBtn.className = 'login-btn logout-btn';
        logoutBtn.textContent = 'Logout';
        logoutBtn.setAttribute('role', 'menuitem');
        logoutBtn.addEventListener('click', handleLogout);
        navLinks.appendChild(logoutBtn);
      }

      // Optionally add profile button
      let profileBtn = navLinks.querySelector('.profile-btn-nav');
      if (!profileBtn && user) {
        profileBtn = document.createElement('a');
        profileBtn.href = 'profile.html';
        profileBtn.className = 'profile-btn-nav';
        profileBtn.textContent = user.displayName || user.email || 'Profile';
        profileBtn.setAttribute('role', 'menuitem');
        navLinks.insertBefore(profileBtn, logoutBtn);
      }
    } else {
      // Show login button
      if (loginBtn) {
        loginBtn.style.display = '';
      }

      // Remove logout button
      const logoutBtn = navLinks.querySelector('.logout-btn');
      if (logoutBtn) {
        logoutBtn.remove();
      }

      // Remove profile button
      const profileBtn = navLinks.querySelector('.profile-btn-nav');
      if (profileBtn) {
        profileBtn.remove();
      }
    }
  }

  /**
   * Handles logout action
   */
  async function handleLogout(e) {
    e.preventDefault();
    
    try {
      // Clear localStorage
      localStorage.removeItem('cc_idToken');
      
      // Sign out from Firebase if available
      if (typeof firebase !== 'undefined' && firebase.auth) {
        const auth = firebase.auth();
        await auth.signOut();
      }

      // Redirect to home or login page
      window.location.href = 'index.html';
    } catch (err) {
      console.error('Logout failed:', err);
      // Still redirect even if logout fails
      localStorage.removeItem('cc_idToken');
      window.location.href = 'index.html';
    }
  }

  /**
   * Highlights the active navigation link based on current page
   */
  function highlightActiveLink(container) {
    const links = container.querySelectorAll('.nav-links a');
    if (links.length === 0) return;

    const currentPath = window.location.pathname;
    const currentFile = currentPath.split('/').pop() || 'index.html';

    links.forEach(link => {
      link.classList.remove(CONFIG.activeClass);
      
      const href = link.getAttribute('href');
      if (!href) return;

      // Remove query string and hash from href
      const linkFile = href.split('?')[0].split('#')[0];
      
      // Check if current page matches this link
      if (linkFile === currentFile || 
          (currentFile === '' && linkFile === 'index.html') ||
          (currentFile === 'index.html' && linkFile === 'index.html')) {
        link.classList.add(CONFIG.activeClass);
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  /**
   * Sets up mobile menu toggle functionality
   */
  function setupMobileMenu(container) {
    const toggle = container.querySelector('.nav-toggle');
    const navLinks = container.querySelector('.nav-links');

    if (!toggle || !navLinks) return;

    toggle.addEventListener('click', () => {
      const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', !isExpanded);
      navLinks.classList.toggle('active');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!container.contains(e.target) && navLinks.classList.contains('active')) {
        toggle.setAttribute('aria-expanded', 'false');
        navLinks.classList.remove('active');
      }
    });

    // Close menu when clicking on a link (mobile)
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          toggle.setAttribute('aria-expanded', 'false');
          navLinks.classList.remove('active');
        }
      });
    });
  }

  /**
   * Sets up smooth scrolling for anchor links
   */
  function setupSmoothScrolling(container) {
    container.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });
  }

  /**
   * Creates a fallback navbar if the HTML file cannot be loaded
   */
  function createFallbackNavbar() {
    return `
      <nav class="navbar" role="navigation" aria-label="Main navigation">
        <div class="nav-container">
          <a href="index.html" class="logo">Cadet's Compass</a>
          <div class="nav-links">
            <a href="about.html">About</a>
            <a href="contact.html">Contact</a>
            <a href="nda.html">NDA</a>
            <a href="cds.html">CDS</a>
            <a href="ssb.html">SSB</a>
            <a href="mocktests.html">Mock Tests</a>
            <a href="login.html" class="login-btn">Login</a>
          </div>
        </div>
      </nav>
    `;
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadNavbar);
  } else {
    loadNavbar();
  }
})();

