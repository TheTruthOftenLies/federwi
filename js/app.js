/**
 * Federwi V2 - Main JavaScript
 */

import { todoService, notesService, calendarService, dailyViewService } from './api-service.js';
import { formatDate, formatTime, formatDateTime, getRelativeTimeString } from './utils.js';
import { Todo } from './components/Todo.js';
import { store } from './store/Store.js';

/**
 * Main Application Class
 */
class FederwiApp {
  constructor() {
    this.init();
  }

  /**
   * Initialize the application
   */
  init() {
    // Initialize modules based on current page
    this.initModules();
    
    // Subscribe to store changes
    store.subscribe(this.handleStoreChange.bind(this));
  }

  /**
   * Initialize modules based on current page
   */
  initModules() {
    const path = window.location.pathname;
    
    if (path.includes('todo.html')) {
      // Initialize Todo component
      const appContainer = document.getElementById('app');
      if (appContainer) {
        new Todo(appContainer);
        console.log('Todo module initialized');
      }
    } else if (path.includes('notes.html')) {
      // Initialize Notes component
      this.initNotesModule();
    } else if (path.includes('calendar.html')) {
      // Initialize Calendar component
      this.initCalendarModule();
    }
  }

  /**
   * Initialize the Notes module
   */
  initNotesModule() {
    console.log('Initializing Notes Module');
    const appContainer = document.getElementById('app');
    if (!appContainer) return;
    
    // Add notes container to app if it doesn't exist
    if (!document.getElementById('notes-list')) {
      appContainer.innerHTML = `
        <div class="container py-5">
          <div class="row">
            <div class="col-lg-8 mx-auto">
              <div class="card shadow-lg mb-4">
                <div class="card-header">
                  <h4 class="m-0">Add New Note</h4>
                </div>
                <div class="card-body">
                  <form id="note-form">
                    <div class="mb-3">
                      <input type="text" class="form-control" id="note-title" placeholder="Title" required>
                    </div>
                    <div class="mb-3">
                      <textarea class="form-control" id="note-content" rows="4" placeholder="Write your note here..." required></textarea>
                    </div>
                    <div class="d-flex justify-content-between">
                      <div>
                        <button type="button" class="btn btn-outline-secondary me-2">
                          <i class="material-icons">attach_file</i>
                        </button>
                        <button type="button" class="btn btn-outline-secondary">
                          <i class="material-icons">format_list_bulleted</i>
                        </button>
                      </div>
                      <button type="submit" class="btn btn-primary">Save Note</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
          
          <div class="row">
            <div class="col-12 mb-4">
              <div class="d-flex justify-content-between align-items-center">
                <h2>My Notes</h2>
                <div class="input-group w-auto">
                  <input type="text" class="form-control" placeholder="Search notes...">
                  <button class="btn btn-primary" type="button">
                    <i class="material-icons">search</i>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div class="row" id="notes-list">
            <!-- Notes will be rendered here -->
          </div>
        </div>
      `;
    }
    
    // Initialize Notes functionality
    this.initializeNotesHandlers();
    this.loadNotes();
  }

  /**
   * Initialize the Calendar module
   */
  initCalendarModule() {
    console.log('Initializing Calendar Module');
    const appContainer = document.getElementById('app');
    if (!appContainer) return;
    
    // Initialize Calendar functionality
    this.initializeCalendarHandlers();
    this.loadEvents();
    
    // Fix white text on white background for Add Event button
    const addEventBtn = document.querySelector('[data-bs-target="#addEventModal"]');
    if (addEventBtn) {
      addEventBtn.classList.remove('btn-light');
      addEventBtn.classList.add('btn-primary');
      
      // Make sure it's visible
      addEventBtn.style.color = 'white';
      addEventBtn.style.backgroundColor = 'var(--accent-color, #6366f1)';
    }
    
    // Ensure event form has proper IDs
    const eventForm = document.getElementById('event-form') || document.querySelector('form[data-bs-target="#addEventModal"]');
    if (eventForm) {
      eventForm.id = 'event-form';
      
      const titleInput = eventForm.querySelector('input[type="text"]');
      if (titleInput) titleInput.id = 'event-title';
      
      const dateInput = eventForm.querySelector('input[type="date"]');
      if (dateInput) dateInput.id = 'event-date';
      
      const startTimeInput = eventForm.querySelector('input[type="time"]:first-of-type');
      if (startTimeInput) startTimeInput.id = 'event-start-time';
      
      const endTimeInput = eventForm.querySelector('input[type="time"]:last-of-type');
      if (endTimeInput) endTimeInput.id = 'event-end-time';
      
      const locationInput = eventForm.querySelector('input[placeholder*="Location"]');
      if (locationInput) locationInput.id = 'event-location';
      
      const descriptionInput = eventForm.querySelector('textarea');
      if (descriptionInput) descriptionInput.id = 'event-description';
    }
  }

  /**
   * Initialize event handlers for the Notes module
   */
  initializeNotesHandlers() {
    // Form submission
    const form = document.getElementById('note-form');
    if (form) {
      form.addEventListener('submit', this.handleAddNote.bind(this));
    }
    
    // Delete buttons
    document.querySelectorAll('.delete-note').forEach(button => {
      const noteId = button.dataset.id;
      if (noteId) {
        button.addEventListener('click', () => this.handleDeleteNote(noteId));
      }
    });
    
    // Search functionality
    const searchInput = document.querySelector('input[placeholder="Search notes..."]');
    const searchButton = searchInput?.nextElementSibling;
    if (searchInput && searchButton) {
      searchButton.addEventListener('click', () => {
        this.searchNotes(searchInput.value.trim());
      });
      
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.searchNotes(searchInput.value.trim());
        }
      });
    }
  }

  /**
   * Handle adding a new note
   * @param {Event} e - Form submit event
   */
  async handleAddNote(e) {
    e.preventDefault();
    
    const title = document.getElementById('note-title').value.trim();
    const content = document.getElementById('note-content').value.trim();
    
    if (!title || !content) return;
    
    try {
      const noteData = {
        title,
        content,
        date: new Date().toISOString(),
        type: 'daily'
      };
      
      const newNote = await notesService.createNote(noteData);
      
      // Manually add to store
      store.addNote(newNote);
      
      document.getElementById('note-title').value = '';
      document.getElementById('note-content').value = '';
      
      // Render notes immediately
      this.renderNotes(store.getState().notes);
    } catch (error) {
      console.error('Error adding note:', error);
      this.showError('Failed to save note. Please try again.');
    }
  }

  /**
   * Handle note deletion
   * @param {string} id - Note ID
   */
  async handleDeleteNote(id) {
    try {
      await notesService.delete(id);
      await this.loadNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
      this.showError('Failed to delete note. Please try again.');
    }
  }

  /**
   * Search notes by query
   * @param {string} query - Search query
   */
  async searchNotes(query) {
    if (!query) {
      return this.loadNotes();
    }
    
    try {
      const notes = await notesService.searchNotes(query);
      this.renderNotes(notes);
    } catch (error) {
      console.error('Error searching notes:', error);
      this.showError('Failed to search notes. Please try again.');
    }
  }

  /**
   * Load all notes
   */
  async loadNotes() {
    try {
      const notes = await notesService.getAll();
      store.setNotes(notes);
      this.renderNotes(notes);
    } catch (error) {
      console.error('Error loading notes:', error);
      this.showError('Failed to load notes. Please try again.');
    }
  }

  /**
   * Render notes to the UI
   * @param {Array} notes - Array of note items
   */
  renderNotes(notes) {
    const notesList = document.getElementById('notes-list');
    if (!notesList) return;
    
    notesList.innerHTML = '';
    
    if (notes.length === 0) {
      notesList.innerHTML = '<div class="col-12 text-center py-5"><p class="text-muted">No notes found. Create your first note above.</p></div>';
      return;
    }
    
    notes.forEach(note => {
      const createdDate = new Date(note.creationTimestamp).toLocaleDateString();
      
      const noteElement = document.createElement('div');
      noteElement.className = 'col-md-4 mb-4';
      noteElement.innerHTML = `
        <div class="card h-100">
          <div class="card-body">
            <h5 class="card-title">${note.title}</h5>
            <p class="card-text">${note.content}</p>
          </div>
          <div class="card-footer d-flex justify-content-between">
            <small class="text-muted">Created ${createdDate}</small>
            <button class="btn btn-sm btn-outline-danger delete-note" data-id="${note.id}">
              <i class="material-icons">delete</i>
            </button>
          </div>
        </div>
      `;
      
      notesList.appendChild(noteElement);
    });
    
    // Re-attach event handlers
    this.initializeNotesHandlers();
  }

  /**
   * Initialize event handlers for the Calendar module
   */
  initializeCalendarHandlers() {
    // Navigation buttons
    const prevButton = document.querySelector('.btn-outline-light i.material-icons.chevron_left');
    const nextButton = document.querySelector('.btn-outline-light i.material-icons.chevron_right');
    
    if (prevButton?.parentElement) {
      prevButton.parentElement.addEventListener('click', () => this.navigateCalendar(-1));
    }
    
    if (nextButton?.parentElement) {
      nextButton.parentElement.addEventListener('click', () => this.navigateCalendar(1));
    }
    
    // Add event button
    const addEventButton = document.querySelector('[data-bs-target="#addEventModal"]');
    if (addEventButton) {
      const form = document.getElementById('event-form');
      if (form) {
        form.addEventListener('submit', this.handleAddEvent.bind(this));
      }
    }
  }

  /**
   * Navigate calendar by month
   * @param {number} direction - Navigation direction (1 for next, -1 for previous)
   */
  navigateCalendar(direction) {
    const currentMonthHeader = document.querySelector('.card-header h4');
    if (!currentMonthHeader) return;
    
    const [monthName, year] = currentMonthHeader.textContent.split(' ');
    const monthIndex = new Date(`${monthName} 1, ${year}`).getMonth();
    const currentYear = parseInt(year);
    
    let newMonthIndex = monthIndex + direction;
    let newYear = currentYear;
    
    if (newMonthIndex < 0) {
      newMonthIndex = 11;
      newYear--;
    } else if (newMonthIndex > 11) {
      newMonthIndex = 0;
      newYear++;
    }
    
    const newDate = new Date(newYear, newMonthIndex, 1);
    const newMonthName = newDate.toLocaleString('default', { month: 'long' });
    
    currentMonthHeader.textContent = `${newMonthName} ${newYear}`;
    
    this.renderCalendar(newDate);
  }

  /**
   * Handle adding a new event
   * @param {Event} e - Form submit event
   */
  async handleAddEvent(e) {
    e.preventDefault();
    
    const form = e.target;
    const title = document.getElementById('event-title')?.value || form.querySelector('input[type="text"]').value;
    const startDate = document.getElementById('event-date')?.value || form.querySelector('input[type="date"]').value;
    const startTime = document.getElementById('event-start-time')?.value || form.querySelector('input[type="time"]:first-of-type').value;
    const endTime = document.getElementById('event-end-time')?.value || form.querySelector('input[type="time"]:last-of-type').value;
    const location = document.getElementById('event-location')?.value || '';
    const description = document.getElementById('event-description')?.value || '';
    
    if (!title || !startDate || !startTime) {
      this.showError('Please fill in the required fields (title, date, start time)');
      return;
    }
    
    try {
      const startDateTime = new Date(`${startDate}T${startTime}`).toISOString();
      const endDateTime = endTime 
        ? new Date(`${startDate}T${endTime}`).toISOString()
        : new Date(`${startDate}T${startTime}`).toISOString();
      
      const eventData = {
        title,
        startDateTime,
        endDateTime,
        location: location || '',
        description: description || '',
        source: 'manual'
      };
      
      const newEvent = await calendarService.createEvent(eventData);
      
      // Manually add to store
      store.addEvent(newEvent);
      
      form.reset();
      
      // Hide modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('addEventModal'));
      if (modal) {
        modal.hide();
      }
      
      // Render calendar immediately
      this.renderCalendar(new Date(startDate));
      
      console.log('Event created successfully:', newEvent);
    } catch (error) {
      console.error('Error adding event:', error);
      this.showError('Failed to save event. Please try again.');
    }
  }

  /**
   * Load calendar events
   */
  async loadEvents() {
    try {
      const currentMonthHeader = document.querySelector('.card-header h4');
      if (!currentMonthHeader) return;
      
      const [monthName, year] = currentMonthHeader.textContent.split(' ');
      const monthIndex = new Date(`${monthName} 1, ${year}`).getMonth();
      const currentYear = parseInt(year);
      
      const events = await calendarService.getEventsForMonth(currentYear, monthIndex);
      store.setEvents(events);
      
      this.renderCalendar(new Date(currentYear, monthIndex, 1));
    } catch (error) {
      console.error('Error loading events:', error);
      this.showError('Failed to load events. Please try again.');
    }
  }

  /**
   * Render calendar for specified month
   * @param {Date} date - Date object for month to render
   */
  renderCalendar(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // Get first day of month and last day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Get day of week for first day (0 = Sunday, 6 = Saturday)
    const firstDayOfWeek = firstDay.getDay();
    
    // Get days from previous month
    const daysFromPreviousMonth = firstDayOfWeek;
    
    // Get total days in current month
    const daysInMonth = lastDay.getDate();
    
    // Calculate total days needed (previous month + current month + next month)
    const totalDays = Math.ceil((daysFromPreviousMonth + daysInMonth) / 7) * 7;
    
    // Get days from next month
    const daysFromNextMonth = totalDays - (daysFromPreviousMonth + daysInMonth);
    
    // Get events for this month
    const events = store.getState().events;
    
    // Create calendar HTML
    let calendarHtml = '';
    
    // Create weeks
    let dayCounter = 1 - daysFromPreviousMonth;
    
    for (let week = 0; week < totalDays / 7; week++) {
      calendarHtml += '<div class="row">';
      
      for (let day = 0; day < 7; day++) {
        const currentDate = new Date(year, month, dayCounter);
        const isCurrentMonth = currentDate.getMonth() === month;
        const isToday = new Date().toDateString() === currentDate.toDateString();
        
        // Find events for this day
        const dayEvents = events.filter(event => {
          const eventDate = new Date(event.startDateTime);
          return eventDate.toDateString() === currentDate.toDateString();
        });
        
        calendarHtml += `
          <div class="col calendar-day ${isCurrentMonth ? '' : 'other-month'} ${isToday ? 'today' : ''}">
            <div class="day-number">${currentDate.getDate()}</div>
            ${dayEvents.map(event => `
              <div class="calendar-event" title="${event.title}">
                ${formatTime(new Date(event.startDateTime))} ${event.title}
              </div>
            `).join('')}
          </div>
        `;
        
        dayCounter++;
      }
      
      calendarHtml += '</div>';
    }
    
    // Update calendar in DOM
    const calendarContainer = document.querySelector('.card-body');
    if (calendarContainer) {
      const headerRow = document.querySelector('.calendar-header');
      calendarContainer.innerHTML = '';
      calendarContainer.appendChild(headerRow);
      calendarContainer.insertAdjacentHTML('beforeend', calendarHtml);
    }
  }

  /**
   * Handle store changes
   * @param {Object} state - New state
   */
  handleStoreChange(state) {
    // Update UI based on state changes
    if (state.error) {
      this.showError(state.error);
    }
  }

  /**
   * Show error message
   * @param {string} message - Error message
   */
  showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3';
    errorDiv.style.zIndex = '9999';
    errorDiv.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    document.body.appendChild(errorDiv);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
  }
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
  new FederwiApp();
}); 