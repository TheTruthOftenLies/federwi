/**
 * Federwi V2 - API Service
 * 
 * This module provides API services for the core modules:
 * - ToDo
 * - Notes
 * - Calendar
 */

import { TodoItem, NoteItem, CalendarEvent, RecurringPattern, DailyView } from './data-models.js';

// API configuration
const API_CONFIG = {
  baseUrl: '/api', // Will be replaced with actual API endpoint
  endpoints: {
    todos: '/todos',
    notes: '/notes',
    events: '/events',
    users: '/users'
  },
  headers: {
    'Content-Type': 'application/json'
  }
};

// For development fallback when API is unavailable
const USE_LOCAL_STORAGE = true;

/**
 * Generic API class for handling CRUD operations
 */
class ApiService {
  constructor(endpoint) {
    this.endpoint = endpoint;
    this.baseUrl = API_CONFIG.baseUrl;
    this.headers = API_CONFIG.headers;
  }

  /**
   * Get all items
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} - Array of items
   */
  async getAll(params = {}) {
    try {
      if (USE_LOCAL_STORAGE) {
        return this._getFromLocalStorage();
      }
      
      const queryParams = new URLSearchParams(params).toString();
      const url = `${this.baseUrl}${this.endpoint}${queryParams ? `?${queryParams}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.headers
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching data:', error);
      return this._getFromLocalStorage();
    }
  }

  /**
   * Get item by ID
   * @param {string} id - Item ID
   * @returns {Promise<Object>} - Item data
   */
  async getById(id) {
    try {
      if (USE_LOCAL_STORAGE) {
        const items = this._getFromLocalStorage();
        return items.find(item => item.id === id);
      }
      
      const url = `${this.baseUrl}${this.endpoint}/${id}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.headers
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching item ${id}:`, error);
      const items = this._getFromLocalStorage();
      return items.find(item => item.id === id);
    }
  }

  /**
   * Create new item
   * @param {Object} data - Item data
   * @returns {Promise<Object>} - Created item
   */
  async create(data) {
    try {
      if (USE_LOCAL_STORAGE) {
        return this._saveToLocalStorage(data);
      }
      
      const url = `${this.baseUrl}${this.endpoint}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating item:', error);
      return this._saveToLocalStorage(data);
    }
  }

  /**
   * Update item
   * @param {string} id - Item ID
   * @param {Object} data - Updated data
   * @returns {Promise<Object>} - Updated item
   */
  async update(id, data) {
    try {
      if (USE_LOCAL_STORAGE) {
        return this._updateInLocalStorage(id, data);
      }
      
      const url = `${this.baseUrl}${this.endpoint}/${id}`;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: this.headers,
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error updating item ${id}:`, error);
      return this._updateInLocalStorage(id, data);
    }
  }

  /**
   * Delete item
   * @param {string} id - Item ID
   * @returns {Promise<boolean>} - Success status
   */
  async delete(id) {
    try {
      if (USE_LOCAL_STORAGE) {
        return this._deleteFromLocalStorage(id);
      }
      
      const url = `${this.baseUrl}${this.endpoint}/${id}`;
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: this.headers
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return true;
    } catch (error) {
      console.error(`Error deleting item ${id}:`, error);
      return this._deleteFromLocalStorage(id);
    }
  }

  // Local storage helpers for development
  _getStorageKey() {
    return `federwi_${this.endpoint.replace('/', '_')}`;
  }

  _getFromLocalStorage() {
    const data = localStorage.getItem(this._getStorageKey());
    
    // Initialize empty array if no data exists
    if (!data) {
      localStorage.setItem(this._getStorageKey(), JSON.stringify([]));
      return [];
    }
    
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('Error parsing data from localStorage:', error);
      localStorage.setItem(this._getStorageKey(), JSON.stringify([]));
      return [];
    }
  }

  _saveToLocalStorage(data) {
    const items = this._getFromLocalStorage();
    const newItem = { ...data, id: data.id || crypto.randomUUID() };
    items.push(newItem);
    localStorage.setItem(this._getStorageKey(), JSON.stringify(items));
    return newItem;
  }

  _updateInLocalStorage(id, data) {
    const items = this._getFromLocalStorage();
    const index = items.findIndex(item => item.id === id);
    
    if (index !== -1) {
      const updatedItem = { ...items[index], ...data, lastModifiedTimestamp: new Date().toISOString() };
      items[index] = updatedItem;
      localStorage.setItem(this._getStorageKey(), JSON.stringify(items));
      return updatedItem;
    }
    
    return null;
  }

  _deleteFromLocalStorage(id) {
    const items = this._getFromLocalStorage();
    const filteredItems = items.filter(item => item.id !== id);
    localStorage.setItem(this._getStorageKey(), JSON.stringify(filteredItems));
    return true;
  }
}

/**
 * TodoService - Handles todo operations
 */
class TodoService extends ApiService {
  constructor() {
    super(API_CONFIG.endpoints.todos);
  }

  /**
   * Create a new todo
   * @param {Object} todoData - Todo data
   * @returns {Promise<TodoItem>} - Created todo item
   */
  async createTodo(todoData) {
    const todo = new TodoItem(todoData);
    const result = await this.create(todo);
    return new TodoItem(result);
  }

  /**
   * Get todos by status
   * @param {string} status - Status filter (all, active, completed)
   * @returns {Promise<Array<TodoItem>>} - Filtered todos
   */
  async getTodosByStatus(status = 'all') {
    const todos = await this.getAll();
    
    switch (status) {
      case 'active':
        return todos.filter(todo => todo.completionStatus === 'incomplete');
      case 'completed':
        return todos.filter(todo => todo.completionStatus === 'complete');
      default:
        return todos;
    }
  }

  /**
   * Get todos by category
   * @param {string} category - Category filter (short-term, medium-term, long-term)
   * @returns {Promise<Array<TodoItem>>} - Filtered todos
   */
  async getTodosByCategory(category) {
    const todos = await this.getAll();
    return todos.filter(todo => todo.category === category);
  }

  /**
   * Get todos for a specific date
   * @param {Date} date - Target date
   * @returns {Promise<Array<TodoItem>>} - Todos for the date
   */
  async getTodosForDate(date) {
    const todos = await this.getAll();
    const dateString = new Date(date).toISOString().split('T')[0];
    
    return todos.filter(todo => {
      const todoDate = new Date(todo.currentDate).toISOString().split('T')[0];
      return todoDate === dateString;
    });
  }

  /**
   * Add a subtask to a parent task
   * @param {string} parentId - Parent task ID
   * @param {Object} subtaskData - Subtask data
   * @returns {Promise<TodoItem>} - Created subtask
   */
  async addSubtask(parentId, subtaskData) {
    const parent = await this.getById(parentId);
    
    if (!parent) {
      throw new Error('Parent task not found');
    }
    
    const subtask = new TodoItem({
      ...subtaskData,
      parentTaskId: parentId
    });
    
    const createdSubtask = await this.create(subtask);
    
    // Update parent's subtasks array
    const updatedSubtasks = [...parent.subtasks, createdSubtask.id];
    await this.update(parentId, { subtasks: updatedSubtasks });
    
    return createdSubtask;
  }

  /**
   * Roll over incomplete tasks to the next day
   * @param {Date} fromDate - Source date
   * @param {Date} toDate - Target date
   * @returns {Promise<Array<TodoItem>>} - Rolled over tasks
   */
  async rolloverIncompleteTasks(fromDate, toDate) {
    const tasks = await this.getTodosForDate(fromDate);
    const incompleteTasks = tasks.filter(task => 
      task.completionStatus === 'incomplete' || task.completionStatus === 'partial'
    );
    
    const rolledOverTasks = [];
    
    for (const task of incompleteTasks) {
      // Mark original as rolled over
      await this.update(task.id, { isRolledOver: true });
      
      // Create new instance for next day
      const newTask = new TodoItem({
        ...task,
        id: null, // Will generate new ID
        currentDate: toDate.toISOString(),
        originalDate: task.originalDate || fromDate.toISOString(),
        isRolledOver: false
      });
      
      const createdTask = await this.create(newTask);
      rolledOverTasks.push(createdTask);
    }
    
    return rolledOverTasks;
  }

  /**
   * Update task completion status and handle parent-child relationships
   * @param {string} taskId - Task ID
   * @param {string} status - New status (incomplete, partial, complete)
   * @returns {Promise<TodoItem>} - Updated task
   */
  async updateTaskStatus(taskId, status) {
    const task = await this.getById(taskId);
    
    if (!task) {
      throw new Error('Task not found');
    }
    
    const updates = { 
      completionStatus: status,
      lastModifiedTimestamp: new Date().toISOString()
    };
    
    if (status === 'complete') {
      updates.completedAt = new Date().toISOString();
    }
    
    const updatedTask = await this.update(taskId, updates);
    
    // If this is a subtask, update parent task status
    if (task.parentTaskId) {
      await this.updateParentTaskStatus(task.parentTaskId);
    }
    
    return updatedTask;
  }

  /**
   * Update parent task status based on subtask statuses
   * @param {string} parentId - Parent task ID
   * @returns {Promise<TodoItem>} - Updated parent task
   */
  async updateParentTaskStatus(parentId) {
    const parent = await this.getById(parentId);
    
    if (!parent || !parent.subtasks.length) {
      return parent;
    }
    
    // Get all subtasks
    const subtasks = [];
    for (const subtaskId of parent.subtasks) {
      const subtask = await this.getById(subtaskId);
      if (subtask) {
        subtasks.push(subtask);
      }
    }
    
    // Calculate new status
    const completedCount = subtasks.filter(st => st.completionStatus === 'complete').length;
    const totalCount = subtasks.length;
    
    let newStatus = 'incomplete';
    if (completedCount === totalCount) {
      newStatus = 'complete';
    } else if (completedCount > 0) {
      newStatus = 'partial';
    }
    
    // Update parent
    return await this.update(parentId, { 
      completionStatus: newStatus,
      lastModifiedTimestamp: new Date().toISOString(),
      completedAt: newStatus === 'complete' ? new Date().toISOString() : null
    });
  }
}

/**
 * NotesService - Handles notes operations
 */
class NotesService extends ApiService {
  constructor() {
    super(API_CONFIG.endpoints.notes);
  }

  /**
   * Create a new note
   * @param {Object} noteData - Note data
   * @returns {Promise<NoteItem>} - Created note item
   */
  async createNote(noteData) {
    const note = new NoteItem(noteData);
    const result = await this.create(note);
    return new NoteItem(result);
  }

  /**
   * Get notes by category
   * @param {string} category - Category filter
   * @returns {Promise<Array<NoteItem>>} - Filtered notes
   */
  async getNotesByCategory(category) {
    const notes = await this.getAll();
    return notes.filter(note => note.categories.includes(category));
  }

  /**
   * Get notes for a specific date
   * @param {Date} date - Target date
   * @returns {Promise<Array<NoteItem>>} - Notes for the date
   */
  async getNotesForDate(date) {
    const notes = await this.getAll();
    const dateString = new Date(date).toISOString().split('T')[0];
    
    return notes.filter(note => {
      const noteDate = new Date(note.date).toISOString().split('T')[0];
      return noteDate === dateString;
    });
  }

  /**
   * Get notes related to a specific task
   * @param {string} taskId - Task ID
   * @returns {Promise<Array<NoteItem>>} - Related notes
   */
  async getNotesForTask(taskId) {
    const notes = await this.getAll();
    return notes.filter(note => note.relatedTaskId === taskId);
  }

  /**
   * Search notes by content
   * @param {string} query - Search query
   * @returns {Promise<Array<NoteItem>>} - Matched notes
   */
  async searchNotes(query) {
    const notes = await this.getAll();
    const searchTerm = query.toLowerCase();
    
    return notes.filter(note => 
      note.title.toLowerCase().includes(searchTerm) || 
      note.content.toLowerCase().includes(searchTerm)
    );
  }
}

/**
 * CalendarService - Handles calendar operations
 */
class CalendarService extends ApiService {
  constructor() {
    super(API_CONFIG.endpoints.events);
  }

  /**
   * Create a new event
   * @param {Object} eventData - Event data
   * @returns {Promise<CalendarEvent>} - Created event item
   */
  async createEvent(eventData) {
    const event = new CalendarEvent(eventData);
    const result = await this.create(event);
    return new CalendarEvent(result);
  }

  /**
   * Get events for a specific date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array<CalendarEvent>>} - Events in the range
   */
  async getEventsByDateRange(startDate, endDate) {
    const events = await this.getAll();
    const startTimestamp = new Date(startDate).getTime();
    const endTimestamp = new Date(endDate).getTime();
    
    return events.filter(event => {
      const eventStart = new Date(event.startDateTime).getTime();
      const eventEnd = new Date(event.endDateTime).getTime();
      
      return (
        (eventStart >= startTimestamp && eventStart <= endTimestamp) ||
        (eventEnd >= startTimestamp && eventEnd <= endTimestamp) ||
        (eventStart <= startTimestamp && eventEnd >= endTimestamp)
      );
    });
  }

  /**
   * Get events for a specific day
   * @param {Date} date - Target date
   * @returns {Promise<Array<CalendarEvent>>} - Events for the day
   */
  async getEventsForDay(date) {
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0);
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59);
    
    return await this.getEventsByDateRange(startOfDay, endOfDay);
  }

  /**
   * Get events for a specific month
   * @param {number} year - Year
   * @param {number} month - Month (0-11)
   * @returns {Promise<Array<CalendarEvent>>} - Events for the month
   */
  async getEventsForMonth(year, month) {
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);
    
    return await this.getEventsByDateRange(startOfMonth, endOfMonth);
  }
}

/**
 * DailyViewService - Handles integrated daily view operations
 */
class DailyViewService {
  constructor() {
    this.todoService = new TodoService();
    this.notesService = new NotesService();
    this.calendarService = new CalendarService();
  }

  /**
   * Get complete daily view for a specific date
   * @param {Date} date - Target date
   * @returns {Promise<DailyView>} - Complete daily view
   */
  async getDailyView(date) {
    const targetDate = new Date(date);
    const isWeekend = targetDate.getDay() === 0 || targetDate.getDay() === 6;
    
    // Get tasks by category
    const allTasks = await this.todoService.getTodosForDate(targetDate);
    const tasks = {
      shortTerm: allTasks.filter(task => task.category === 'short-term'),
      mediumTerm: allTasks.filter(task => task.category === 'medium-term'),
      longTerm: allTasks.filter(task => task.category === 'long-term')
    };
    
    // Get completed tasks
    const completedTasks = allTasks.filter(task => task.completionStatus === 'complete');
    
    // Get calendar events
    const calendarEvents = await this.calendarService.getEventsForDay(targetDate);
    
    // Get notes
    const notes = await this.notesService.getNotesForDate(targetDate);
    
    // Create and return daily view
    return new DailyView({
      date: targetDate.toISOString(),
      isWeekend,
      tasks,
      calendarEvents,
      notes,
      completedTasks
    });
  }

  /**
   * Roll over tasks from current day to next day
   * @param {Date} currentDate - Current date
   * @returns {Promise<DailyView>} - Updated next day's view
   */
  async rolloverToNextDay(currentDate) {
    const today = new Date(currentDate);
    const nextDay = new Date(today);
    nextDay.setDate(today.getDate() + 1);
    
    // Roll over incomplete tasks
    await this.todoService.rolloverIncompleteTasks(today, nextDay);
    
    // Return the updated daily view for the next day
    return await this.getDailyView(nextDay);
  }
}

// Create and export service instances
export const todoService = new TodoService();
export const notesService = new NotesService();
export const calendarService = new CalendarService();
export const dailyViewService = new DailyViewService(); 