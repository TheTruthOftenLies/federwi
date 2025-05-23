/**
 * Federwi V2 - Data Models
 * 
 * This module defines the data structures for the application's core modules:
 * - ToDo
 * - Notes
 * - Calendar
 * 
 * These models are designed for backend integration with persistent storage.
 */

/**
 * TodoItem model - extended to support the three-tier categorization system
 */
class TodoItem {
  constructor(data = {}) {
    this.id = data.id || crypto.randomUUID();
    this.title = data.title || '';
    this.description = data.description || '';
    this.category = data.category || 'short-term'; // short-term, medium-term, long-term
    this.completionStatus = data.completionStatus || 'incomplete'; // incomplete, partial, complete
    this.dueDate = data.dueDate || null;
    this.priorityLevel = data.priorityLevel || 'normal'; // low, normal, high
    this.parentTaskId = data.parentTaskId || null;
    this.subtasks = data.subtasks || [];
    this.originalDate = data.originalDate || new Date().toISOString();
    this.currentDate = data.currentDate || new Date().toISOString();
    this.isRolledOver = data.isRolledOver || false;
    this.isRecurring = data.isRecurring || false;
    this.recurringPattern = data.recurringPattern || null;
    this.tags = data.tags || [];
    this.creationTimestamp = data.creationTimestamp || new Date().toISOString();
    this.lastModifiedTimestamp = data.lastModifiedTimestamp || new Date().toISOString();
    this.completedAt = data.completedAt || null;
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      category: this.category,
      completionStatus: this.completionStatus,
      dueDate: this.dueDate,
      priorityLevel: this.priorityLevel,
      parentTaskId: this.parentTaskId,
      subtasks: this.subtasks,
      originalDate: this.originalDate,
      currentDate: this.currentDate,
      isRolledOver: this.isRolledOver,
      isRecurring: this.isRecurring,
      recurringPattern: this.recurringPattern,
      tags: this.tags,
      creationTimestamp: this.creationTimestamp,
      lastModifiedTimestamp: this.lastModifiedTimestamp,
      completedAt: this.completedAt
    };
  }
}

/**
 * RecurringPattern model for recurring tasks
 */
class RecurringPattern {
  constructor(data = {}) {
    this.type = data.type || 'daily'; // daily, weekly, monthly, yearly
    this.interval = data.interval || 1;
    this.daysOfWeek = data.daysOfWeek || null; // [0, 1, 2, 3, 4, 5, 6] (Sunday = 0)
    this.dayOfMonth = data.dayOfMonth || null;
    this.endDate = data.endDate || null;
    this.maxOccurrences = data.maxOccurrences || null;
  }

  toJSON() {
    return {
      type: this.type,
      interval: this.interval,
      daysOfWeek: this.daysOfWeek,
      dayOfMonth: this.dayOfMonth,
      endDate: this.endDate,
      maxOccurrences: this.maxOccurrences
    };
  }
}

/**
 * NoteItem model - extended to support daily and task-related notes
 */
class NoteItem {
  constructor(data = {}) {
    this.id = data.id || crypto.randomUUID();
    this.title = data.title || '';
    this.content = data.content || '';
    this.date = data.date || new Date().toISOString();
    this.type = data.type || 'daily'; // daily, task-related
    this.relatedTaskId = data.relatedTaskId || null;
    this.categories = data.categories || [];
    this.tags = data.tags || [];
    this.creationTimestamp = data.creationTimestamp || new Date().toISOString();
    this.lastModifiedTimestamp = data.lastModifiedTimestamp || new Date().toISOString();
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      content: this.content,
      date: this.date,
      type: this.type,
      relatedTaskId: this.relatedTaskId,
      categories: this.categories,
      tags: this.tags,
      creationTimestamp: this.creationTimestamp,
      lastModifiedTimestamp: this.lastModifiedTimestamp
    };
  }
}

/**
 * CalendarEvent model - extended to support various event sources
 */
class CalendarEvent {
  constructor(data = {}) {
    this.id = data.id || crypto.randomUUID();
    this.title = data.title || '';
    this.description = data.description || '';
    this.startDateTime = data.startDateTime || new Date().toISOString();
    this.endDateTime = data.endDateTime || new Date().toISOString();
    this.location = data.location || '';
    this.attendees = data.attendees || [];
    this.source = data.source || 'manual'; // google, outlook, apple, caldav, manual
    this.externalId = data.externalId || null;
    this.recurrenceRule = data.recurrenceRule || null;
    this.alertReminders = data.alertReminders || [];
    this.category = data.category || '';
    this.creationTimestamp = data.creationTimestamp || new Date().toISOString();
    this.lastModifiedTimestamp = data.lastModifiedTimestamp || new Date().toISOString();
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      startDateTime: this.startDateTime,
      endDateTime: this.endDateTime,
      location: this.location,
      attendees: this.attendees,
      source: this.source,
      externalId: this.externalId,
      recurrenceRule: this.recurrenceRule,
      alertReminders: this.alertReminders,
      category: this.category,
      creationTimestamp: this.creationTimestamp,
      lastModifiedTimestamp: this.lastModifiedTimestamp
    };
  }
}

/**
 * DailyView model for integrating tasks, events, and notes for a specific date
 */
class DailyView {
  constructor(data = {}) {
    this.date = data.date || new Date().toISOString();
    this.isWeekend = data.isWeekend || false;
    this.tasks = data.tasks || {
      shortTerm: [],
      mediumTerm: [],
      longTerm: []
    };
    this.calendarEvents = data.calendarEvents || [];
    this.notes = data.notes || [];
    this.completedTasks = data.completedTasks || [];
  }

  toJSON() {
    return {
      date: this.date,
      isWeekend: this.isWeekend,
      tasks: this.tasks,
      calendarEvents: this.calendarEvents,
      notes: this.notes,
      completedTasks: this.completedTasks
    };
  }
}

export { TodoItem, NoteItem, CalendarEvent, RecurringPattern, DailyView }; 