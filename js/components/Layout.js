import { BaseComponent } from './BaseComponent.js';

/**
 * Layout Component
 * Handles common layout elements (navigation, footer, etc.)
 */
export class Layout extends BaseComponent {
  constructor(element) {
    super(element);
    this.state = {
      currentPage: this.getCurrentPage(),
      user: null
    };
    this.init();
  }

  /**
   * Initialize the layout
   */
  init() {
    this.render();
    this.setupEventListeners();
  }

  /**
   * Get the current page from the URL
   * @returns {string} - Current page name
   */
  getCurrentPage() {
    const path = window.location.pathname;
    if (path === '/' || path.endsWith('index.html')) {
      return 'home';
    }
    return path.split('/').pop().replace('.html', '');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Mobile menu toggle
    const menuToggle = this.element.querySelector('.navbar-toggler');
    if (menuToggle) {
      menuToggle.addEventListener('click', () => {
        const navbarCollapse = this.element.querySelector('.navbar-collapse');
        navbarCollapse.classList.toggle('show');
      });
    }
  }

  /**
   * Render the layout
   */
  render() {
    this.element.innerHTML = `
      <!-- Navigation -->
      <nav class="navbar navbar-expand-lg navbar-dark fixed-top">
        <div class="container">
          <a class="navbar-brand" href="/index.html">
            <img src="/img/federwi_logo.svg" alt="Federwi" height="30" class="me-2">
            Federwi V2
          </a>
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav ms-auto">
              <li class="nav-item">
                <a class="nav-link ${this.state.currentPage === 'home' ? 'active' : ''}" href="/index.html">Home</a>
              </li>
              <li class="nav-item">
                <a class="nav-link ${this.state.currentPage === 'todo' ? 'active' : ''}" href="/pages/todo.html">To Do</a>
              </li>
              <li class="nav-item">
                <a class="nav-link ${this.state.currentPage === 'notes' ? 'active' : ''}" href="/pages/notes.html">Notes</a>
              </li>
              <li class="nav-item">
                <a class="nav-link ${this.state.currentPage === 'calendar' ? 'active' : ''}" href="/pages/calendar.html">Calendar</a>
              </li>
              <li class="nav-item">
                <a class="nav-link ${this.state.currentPage === 'profile' ? 'active' : ''}" href="/pages/profile.html">Profile</a>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <!-- Main Content -->
      <div class="floating-content">
        <slot name="content"></slot>
      </div>

      <!-- Footer -->
      <footer class="py-2">
        <div class="container">
          <div class="row">
            <div class="col-md-6 text-center text-md-start">
              <p class="mb-0">
                <img src="/img/federwi_wordmark.svg" alt="Federwi" height="20" class="me-2">
                © ${new Date().getFullYear()}
              </p>
            </div>
            <div class="col-md-6 text-center text-md-end">
              <a href="#" class="me-3">Privacy Policy</a>
              <a href="#">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    `;
  }

  /**
   * Update the user state
   * @param {Object} user - User data
   */
  setUser(user) {
    this.setState({ user });
  }
} 