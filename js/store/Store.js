/**
 * Application Store
 * Manages global application state
 */
export class Store {
  constructor() {
    this.state = {
      user: null,
      todos: [],
      notes: [],
      events: [],
      categories: [],
      loading: false,
      error: null
    };
    
    this.listeners = new Set();
  }

  /**
   * Get the current state
   * @returns {Object} - Current state
   */
  getState() {
    return this.state;
  }

  /**
   * Subscribe to state changes
   * @param {Function} listener - Callback function
   * @returns {Function} - Unsubscribe function
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of state changes
   */
  notify() {
    this.listeners.forEach(listener => listener(this.state));
  }

  /**
   * Update the state
   * @param {Object} newState - New state to merge
   */
  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.notify();
  }

  /**
   * Set loading state
   * @param {boolean} loading - Loading state
   */
  setLoading(loading) {
    this.setState({ loading });
  }

  /**
   * Set error state
   * @param {Error|null} error - Error object or null
   */
  setError(error) {
    this.setState({ error });
  }

  /**
   * Set user data
   * @param {Object|null} user - User data or null
   */
  setUser(user) {
    this.setState({ user });
  }

  /**
   * Set todos
   * @param {Array} todos - Array of todo items
   */
  setTodos(todos) {
    this.setState({ todos });
  }

  /**
   * Add a todo
   * @param {Object} todo - Todo item
   */
  addTodo(todo) {
    this.setState({
      todos: [...this.state.todos, todo]
    });
  }

  /**
   * Update a todo
   * @param {string} id - Todo ID
   * @param {Object} updates - Todo updates
   */
  updateTodo(id, updates) {
    this.setState({
      todos: this.state.todos.map(todo =>
        todo.id === id ? { ...todo, ...updates } : todo
      )
    });
  }

  /**
   * Delete a todo
   * @param {string} id - Todo ID
   */
  deleteTodo(id) {
    this.setState({
      todos: this.state.todos.filter(todo => todo.id !== id)
    });
  }

  /**
   * Set notes
   * @param {Array} notes - Array of note items
   */
  setNotes(notes) {
    this.setState({ notes });
  }

  /**
   * Add a note
   * @param {Object} note - Note item
   */
  addNote(note) {
    this.setState({
      notes: [...this.state.notes, note]
    });
  }

  /**
   * Update a note
   * @param {string} id - Note ID
   * @param {Object} updates - Note updates
   */
  updateNote(id, updates) {
    this.setState({
      notes: this.state.notes.map(note =>
        note.id === id ? { ...note, ...updates } : note
      )
    });
  }

  /**
   * Delete a note
   * @param {string} id - Note ID
   */
  deleteNote(id) {
    this.setState({
      notes: this.state.notes.filter(note => note.id !== id)
    });
  }

  /**
   * Set events
   * @param {Array} events - Array of event items
   */
  setEvents(events) {
    this.setState({ events });
  }

  /**
   * Add an event
   * @param {Object} event - Event item
   */
  addEvent(event) {
    this.setState({
      events: [...this.state.events, event]
    });
  }

  /**
   * Update an event
   * @param {string} id - Event ID
   * @param {Object} updates - Event updates
   */
  updateEvent(id, updates) {
    this.setState({
      events: this.state.events.map(event =>
        event.id === id ? { ...event, ...updates } : event
      )
    });
  }

  /**
   * Delete an event
   * @param {string} id - Event ID
   */
  deleteEvent(id) {
    this.setState({
      events: this.state.events.filter(event => event.id !== id)
    });
  }

  /**
   * Set categories
   * @param {Array} categories - Array of category items
   */
  setCategories(categories) {
    this.setState({ categories });
  }

  /**
   * Add a category
   * @param {Object} category - Category item
   */
  addCategory(category) {
    this.setState({
      categories: [...this.state.categories, category]
    });
  }

  /**
   * Update a category
   * @param {string} id - Category ID
   * @param {Object} updates - Category updates
   */
  updateCategory(id, updates) {
    this.setState({
      categories: this.state.categories.map(category =>
        category.id === id ? { ...category, ...updates } : category
      )
    });
  }

  /**
   * Delete a category
   * @param {string} id - Category ID
   */
  deleteCategory(id) {
    this.setState({
      categories: this.state.categories.filter(category => category.id !== id)
    });
  }
}

// Create and export a singleton instance
export const store = new Store(); 