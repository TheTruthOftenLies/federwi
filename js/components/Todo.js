import { BaseComponent } from './BaseComponent.js';
import { store } from '../store/Store.js';
import { todoService } from '../api-service.js';

/**
 * Todo Component
 * Handles todo list functionality with three-tier categorization
 */
export class Todo extends BaseComponent {
  constructor(element) {
    super(element);
    this.state = {
      category: 'short-term', // short-term, medium-term, long-term
      filter: 'all', // all, active, completed
      newTodo: '',
      loading: false,
      error: null,
      selectedDate: new Date()
    };
    
    this.init();
  }

  /**
   * Initialize the component
   */
  init() {
    this.render();
    this.setupEventListeners();
    this.loadTodos();
    
    // Set today's date in the date picker
    const datePicker = this.element.querySelector('#todo-date');
    if (datePicker) {
      const today = new Date();
      datePicker.value = today.toISOString().split('T')[0];
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Form submission
    const form = this.element.querySelector('#todo-form');
    if (form) {
      form.addEventListener('submit', this.handleSubmit.bind(this));
    }
    
    // Subtask form submission
    const subtaskForm = this.element.querySelector('#subtask-form');
    if (subtaskForm) {
      subtaskForm.addEventListener('submit', this.handleSubmit.bind(this));
    }

    // Filter buttons
    const filterButtons = this.element.querySelectorAll('.todo-filters .btn');
    filterButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Remove active class from all buttons
        filterButtons.forEach(btn => btn.classList.remove('active'));
        // Add active class to clicked button
        button.classList.add('active');
        
        this.setState({ filter: button.dataset.filter });
        this.renderTodos();
      });
    });

    // Category buttons
    const categoryButtons = this.element.querySelectorAll('.category-filters .btn');
    categoryButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Remove active class from all buttons
        categoryButtons.forEach(btn => btn.classList.remove('active'));
        // Add active class to clicked button
        button.classList.add('active');
        
        this.setState({ category: button.dataset.category });
        this.renderTodos();
      });
    });

    // Date picker
    const datePicker = this.element.querySelector('#todo-date');
    if (datePicker) {
      datePicker.addEventListener('change', (e) => {
        this.setState({ selectedDate: new Date(e.target.value) });
        this.loadTodos();
      });
    }

    // Clear completed button
    const clearCompletedBtn = this.element.querySelector('.clear-completed');
    if (clearCompletedBtn) {
      clearCompletedBtn.addEventListener('click', this.handleClearCompleted.bind(this));
    }
    
    // Rollover button
    const rolloverBtn = this.element.querySelector('.rollover-tasks');
    if (rolloverBtn) {
      rolloverBtn.addEventListener('click', this.handleRollover.bind(this));
    }
  }

  /**
   * Load todos from the API
   */
  async loadTodos() {
    try {
      this.setState({ loading: true, error: null });
      
      // Get todos for the current date
      const todos = await todoService.getTodosForDate(this.state.selectedDate);
      store.setTodos(todos);
      
      this.renderTodos();
    } catch (error) {
      this.setState({ error: error.message });
      console.error('Error loading todos:', error);
    } finally {
      this.setState({ loading: false });
    }
  }

  /**
   * Handle form submission
   * @param {Event} e - Form submit event
   */
  async handleSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    
    const todoData = {
      title: formData.get('title'),
      description: formData.get('description') || '',
      category: formData.get('category') || this.state.category,
      priorityLevel: formData.get('priority') || 'normal',
      completionStatus: 'incomplete',
      currentDate: this.state.selectedDate.toISOString(),
      dueDate: formData.get('dueDate') || null,
      isRecurring: formData.get('isRecurring') === 'on',
      parentTaskId: formData.get('parentTaskId') || null
    };
    
    // Handle recurring pattern if task is recurring
    if (todoData.isRecurring) {
      todoData.recurringPattern = {
        type: formData.get('recurringType') || 'daily',
        interval: parseInt(formData.get('recurringInterval') || '1'),
        daysOfWeek: formData.getAll('recurringDays') || null,
        dayOfMonth: formData.get('recurringDayOfMonth') || null,
        endDate: formData.get('recurringEndDate') || null
      };
    }

    try {
      this.setState({ loading: true, error: null });
      
      let newTodo;
      // If this is a subtask, use addSubtask
      if (todoData.parentTaskId) {
        newTodo = await todoService.addSubtask(todoData.parentTaskId, todoData);
      } else {
        newTodo = await todoService.createTodo(todoData);
      }
      
      // Manually add to store to ensure UI updates
      store.addTodo(newTodo);
      
      form.reset();
      this.renderTodos(); // Render todos immediately
    } catch (error) {
      this.setState({ error: error.message });
      console.error('Error creating todo:', error);
    } finally {
      this.setState({ loading: false });
    }
  }

  /**
   * Handle todo completion toggle
   * @param {string} id - Todo ID
   * @param {string} currentStatus - Current completion status
   */
  async handleToggleComplete(id, currentStatus) {
    try {
      this.setState({ loading: true, error: null });
      
      // Determine next status
      let newStatus;
      switch (currentStatus) {
        case 'incomplete':
          newStatus = 'partial';
          break;
        case 'partial':
          newStatus = 'complete';
          break;
        case 'complete':
          newStatus = 'incomplete';
          break;
        default:
          newStatus = 'incomplete';
      }
      
      await todoService.updateTaskStatus(id, newStatus);
      await this.loadTodos();
    } catch (error) {
      this.setState({ error: error.message });
      console.error('Error updating todo:', error);
    } finally {
      this.setState({ loading: false });
    }
  }

  /**
   * Handle todo deletion
   * @param {string} id - Todo ID
   */
  async handleDelete(id) {
    try {
      this.setState({ loading: true, error: null });
      await todoService.delete(id);
      await this.loadTodos();
    } catch (error) {
      this.setState({ error: error.message });
      console.error('Error deleting todo:', error);
    } finally {
      this.setState({ loading: false });
    }
  }

  /**
   * Handle adding a subtask
   * @param {string} parentId - Parent task ID
   */
  handleAddSubtask(parentId) {
    // Show modal or expand form with parent ID set
    const subtaskForm = this.element.querySelector('#subtask-form');
    if (subtaskForm) {
      const parentIdInput = subtaskForm.querySelector('[name="parentTaskId"]');
      if (parentIdInput) {
        parentIdInput.value = parentId;
      }
      
      // Show subtask form
      const subtaskModal = new bootstrap.Modal(document.getElementById('subtask-modal'));
      subtaskModal.show();
    }
  }

  /**
   * Handle clearing completed todos
   */
  async handleClearCompleted() {
    try {
      this.setState({ loading: true, error: null });
      const completedTodos = store.getState().todos.filter(todo => todo.completionStatus === 'complete');
      
      for (const todo of completedTodos) {
        await todoService.delete(todo.id);
      }
      
      await this.loadTodos();
    } catch (error) {
      this.setState({ error: error.message });
      console.error('Error clearing completed todos:', error);
    } finally {
      this.setState({ loading: false });
    }
  }

  /**
   * Handle rolling over tasks to next day
   */
  async handleRollover() {
    try {
      this.setState({ loading: true, error: null });
      
      const currentDate = this.state.selectedDate;
      const nextDay = new Date(currentDate);
      nextDay.setDate(currentDate.getDate() + 1);
      
      await todoService.rolloverIncompleteTasks(currentDate, nextDay);
      
      // Update to show current day's tasks are now rolled over
      await this.loadTodos();
      
      // Show success message
      alert(`Tasks rolled over to ${nextDay.toLocaleDateString()}`);
    } catch (error) {
      this.setState({ error: error.message });
      console.error('Error rolling over tasks:', error);
    } finally {
      this.setState({ loading: false });
    }
  }

  /**
   * Render the todo list
   */
  renderTodos() {
    const todoList = this.element.querySelector('#todo-list');
    if (!todoList) return;

    const todos = store.getState().todos;
    const filteredTodos = this.filterTodos(todos);
    
    todoList.innerHTML = '';
    
    if (this.state.loading) {
      todoList.appendChild(
        this.createElement('div', { className: 'text-center py-3' }, 'Loading...')
      );
      return;
    }

    if (this.state.error) {
      todoList.appendChild(
        this.createElement('div', { className: 'alert alert-danger' }, this.state.error)
      );
      return;
    }

    if (filteredTodos.length === 0) {
      todoList.appendChild(
        this.createElement('div', { className: 'text-center py-3 text-muted' }, 'No todos found')
      );
      return;
    }

    // Group tasks by parent-child relationships
    const parentTasks = filteredTodos.filter(todo => !todo.parentTaskId);
    const childTasks = filteredTodos.filter(todo => todo.parentTaskId);
    
    // First render parent tasks
    parentTasks.forEach(task => {
      // Find children of this parent
      const children = childTasks.filter(child => child.parentTaskId === task.id);
      
      // Create task container
      const taskContainer = this.createElement('div', {
        className: 'task-container mb-3'
      });
      
      // Create parent task element
      const parentElement = this.createTaskElement(task, true, children.length > 0);
      taskContainer.appendChild(parentElement);
      
      // Create children container if there are subtasks
      if (children.length > 0) {
        const childrenContainer = this.createElement('div', {
          className: 'subtask-container ms-4 mt-2'
        });
        
        children.forEach(childTask => {
          childrenContainer.appendChild(this.createTaskElement(childTask, false));
        });
        
        taskContainer.appendChild(childrenContainer);
      }
      
      todoList.appendChild(taskContainer);
    });
    
    // Then render orphaned child tasks (if any, shouldn't happen in normal operation)
    const orphanedChildren = childTasks.filter(
      child => !parentTasks.some(parent => parent.id === child.parentTaskId)
    );
    
    if (orphanedChildren.length > 0) {
      const orphanContainer = this.createElement('div', {
        className: 'orphaned-tasks mt-4'
      });
      
      orphanContainer.appendChild(
        this.createElement('h6', { className: 'text-muted' }, 'Orphaned Subtasks')
      );
      
      orphanedChildren.forEach(task => {
        orphanContainer.appendChild(this.createTaskElement(task, false));
      });
      
      todoList.appendChild(orphanContainer);
    }

    // Update item count
    const itemCount = this.element.querySelector('.item-count');
    if (itemCount) {
      const activeCount = todos.filter(todo => todo.completionStatus !== 'complete').length;
      itemCount.textContent = `${activeCount} item${activeCount !== 1 ? 's' : ''} left`;
    }
  }

  /**
   * Create a task element
   * @param {Object} task - Task object
   * @param {boolean} isParent - Whether this is a parent task
   * @param {boolean} hasChildren - Whether this task has children
   * @returns {HTMLElement} - Task element
   */
  createTaskElement(task, isParent = false, hasChildren = false) {
    const taskItem = this.createElement('div', {
      className: `task-item ${task.isRolledOver ? 'rolled-over' : ''} card mb-2`
    });
    
    // Task card header
    const cardHeader = this.createElement('div', {
      className: `card-header d-flex justify-content-between align-items-center 
                  ${task.priorityLevel === 'high' ? 'bg-danger text-white' : 
                    task.priorityLevel === 'low' ? 'bg-info text-white' : ''}`
    });
    
    // Completion checkbox/status indicator
    const statusClasses = {
      'incomplete': 'btn-outline-secondary',
      'partial': 'btn-outline-warning',
      'complete': 'btn-success'
    };
    
    const statusBtn = this.createElement('button', {
      className: `btn btn-sm ${statusClasses[task.completionStatus]} me-2`,
      onClick: () => this.handleToggleComplete(task.id, task.completionStatus)
    }, [
      this.createElement('i', { 
        className: `material-icons ${task.completionStatus === 'complete' ? 'text-white' : ''}`
      }, task.completionStatus === 'complete' ? 'check_circle' : 
         task.completionStatus === 'partial' ? 'indeterminate_check_box' : 'radio_button_unchecked')
    ]);
    
    // Task title with category badge
    const titleContainer = this.createElement('div', { className: 'd-flex align-items-center flex-grow-1' });
    
    // Category badge
    const categoryColors = {
      'short-term': 'bg-primary',
      'medium-term': 'bg-warning',
      'long-term': 'bg-info'
    };
    
    const categoryBadge = this.createElement('span', {
      className: `badge ${categoryColors[task.category]} me-2`
    }, task.category);
    
    // Task title
    const title = this.createElement('h5', {
      className: 'card-title mb-0',
      style: task.completionStatus === 'complete' ? { textDecoration: 'line-through' } : {}
    }, task.title);
    
    titleContainer.appendChild(categoryBadge);
    titleContainer.appendChild(title);
    
    // Task actions
    const actionsContainer = this.createElement('div', { className: 'task-actions' });
    
    // Add subtask button (only for parent tasks)
    if (isParent) {
      const addSubtaskBtn = this.createElement('button', {
        className: 'btn btn-sm btn-outline-primary me-1',
        onClick: () => this.handleAddSubtask(task.id)
      }, [
        this.createElement('i', { className: 'material-icons' }, 'subdirectory_arrow_right')
      ]);
      actionsContainer.appendChild(addSubtaskBtn);
    }
    
    // Expand/collapse button (if has children)
    if (hasChildren) {
      const toggleBtn = this.createElement('button', {
        className: 'btn btn-sm btn-outline-secondary me-1',
        onClick: (e) => {
          const container = e.target.closest('.task-container');
          const subtaskContainer = container.querySelector('.subtask-container');
          if (subtaskContainer) {
            subtaskContainer.classList.toggle('d-none');
          }
        }
      }, [
        this.createElement('i', { className: 'material-icons' }, 'expand_more')
      ]);
      actionsContainer.appendChild(toggleBtn);
    }
    
    // Delete button
    const deleteBtn = this.createElement('button', {
      className: 'btn btn-sm btn-outline-danger',
      onClick: () => this.handleDelete(task.id)
    }, [
      this.createElement('i', { className: 'material-icons' }, 'delete')
    ]);
    actionsContainer.appendChild(deleteBtn);
    
    // Assemble card header
    cardHeader.appendChild(statusBtn);
    cardHeader.appendChild(titleContainer);
    cardHeader.appendChild(actionsContainer);
    taskItem.appendChild(cardHeader);
    
    // Task card body (only if has description)
    if (task.description) {
      const cardBody = this.createElement('div', { className: 'card-body' });
      cardBody.appendChild(
        this.createElement('p', { className: 'card-text' }, task.description)
      );
      taskItem.appendChild(cardBody);
    }
    
    // Task card footer (with metadata)
    const cardFooter = this.createElement('div', { className: 'card-footer d-flex justify-content-between text-muted small' });
    
    // Due date information
    let dateInfo = 'No due date';
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      
      if (dueDate.toDateString() === today.toDateString()) {
        dateInfo = 'Due today';
      } else if (dueDate.toDateString() === tomorrow.toDateString()) {
        dateInfo = 'Due tomorrow';
      } else {
        dateInfo = `Due ${dueDate.toLocaleDateString()}`;
      }
    }
    
    // Recurring indicator
    if (task.isRecurring) {
      dateInfo += ' (Recurring)';
    }
    
    cardFooter.appendChild(
      this.createElement('span', {}, dateInfo)
    );
    
    // Created date
    const createdDate = new Date(task.creationTimestamp).toLocaleDateString();
    cardFooter.appendChild(
      this.createElement('span', {}, `Created: ${createdDate}`)
    );
    
    taskItem.appendChild(cardFooter);
    
    return taskItem;
  }

  /**
   * Filter todos based on current filter and category
   * @param {Array} todos - Array of todos
   * @returns {Array} - Filtered todos
   */
  filterTodos(todos) {
    // First filter by category
    let filteredByCategory = todos;
    if (this.state.category !== 'all') {
      filteredByCategory = todos.filter(todo => todo.category === this.state.category);
    }
    
    // Then filter by completion status
    switch (this.state.filter) {
      case 'active':
        return filteredByCategory.filter(todo => todo.completionStatus !== 'complete');
      case 'completed':
        return filteredByCategory.filter(todo => todo.completionStatus === 'complete');
      default:
        return filteredByCategory;
    }
  }

  /**
   * Render the component
   */
  render() {
    // HTML template for the Todo component
    this.element.innerHTML = `
      <div class="container py-5">
        <div class="row">
          <div class="col-lg-8 mx-auto">
            <div class="card shadow-lg">
              <div class="card-header d-flex justify-content-between align-items-center">
                <h3 class="mb-0">Tasks</h3>
                <div class="d-flex">
                  <input type="date" id="todo-date" class="form-control form-control-sm me-2">
                  <button class="btn btn-sm btn-primary rollover-tasks">
                    <i class="material-icons">arrow_forward</i> Rollover
                  </button>
                </div>
              </div>
              
              <div class="card-body">
                <!-- Add Task Form -->
                <form id="todo-form" class="mb-4">
                  <div class="input-group mb-3">
                    <input type="text" name="title" class="form-control" placeholder="What needs to be done?" required>
                    <button class="btn btn-primary" type="submit">
                      <i class="material-icons">add</i>
                    </button>
                  </div>
                  
                  <div class="row g-3">
                    <div class="col-md-4">
                      <select name="category" class="form-select">
                        <option value="short-term">Today's Tasks</option>
                        <option value="medium-term">This Week</option>
                        <option value="long-term">Projects</option>
                      </select>
                    </div>
                    <div class="col-md-4">
                      <select name="priority" class="form-select">
                        <option value="normal">Normal Priority</option>
                        <option value="high">High Priority</option>
                        <option value="low">Low Priority</option>
                      </select>
                    </div>
                    <div class="col-md-4">
                      <input type="date" name="dueDate" class="form-control" placeholder="Due Date">
                    </div>
                    <div class="col-12">
                      <textarea name="description" class="form-control" rows="2" placeholder="Description (optional)"></textarea>
                    </div>
                    <div class="col-12">
                      <div class="form-check">
                        <input class="form-check-input" type="checkbox" name="isRecurring" id="isRecurring">
                        <label class="form-check-label" for="isRecurring">
                          Recurring task
                        </label>
                      </div>
                    </div>
                  </div>
                </form>
                
                <!-- Category Filters -->
                <div class="btn-group category-filters mb-3" role="group">
                  <button type="button" class="btn btn-outline-primary active" data-category="short-term">Today</button>
                  <button type="button" class="btn btn-outline-primary" data-category="medium-term">This Week</button>
                  <button type="button" class="btn btn-outline-primary" data-category="long-term">Projects</button>
                  <button type="button" class="btn btn-outline-primary" data-category="all">All</button>
                </div>
                
                <!-- Todo List -->
                <div id="todo-list" class="mb-3">
                  <!-- Todo items will be rendered here -->
                </div>
                
                <!-- Todo Filters -->
                <div class="d-flex justify-content-between align-items-center">
                  <span class="item-count">0 items left</span>
                  
                  <div class="btn-group todo-filters" role="group">
                    <button type="button" class="btn btn-outline-secondary active" data-filter="all">All</button>
                    <button type="button" class="btn btn-outline-secondary" data-filter="active">Active</button>
                    <button type="button" class="btn btn-outline-secondary" data-filter="completed">Completed</button>
                  </div>
                  
                  <button class="btn btn-outline-danger clear-completed">Clear completed</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Subtask Modal -->
      <div class="modal fade" id="subtask-modal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Add Subtask</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <form id="subtask-form">
                <input type="hidden" name="parentTaskId">
                <div class="mb-3">
                  <label class="form-label">Subtask Title</label>
                  <input type="text" name="title" class="form-control" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">Description</label>
                  <textarea name="description" class="form-control" rows="2"></textarea>
                </div>
                <div class="mb-3">
                  <label class="form-label">Priority</label>
                  <select name="priority" class="form-select">
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <button type="submit" class="btn btn-primary">Add Subtask</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;
  }
} 