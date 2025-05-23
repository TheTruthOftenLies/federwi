/**
 * Base Component Class
 * Provides core functionality for all UI components
 */
export class BaseComponent {
  constructor(element) {
    if (typeof element === 'string') {
      this.element = document.querySelector(element);
    } else {
      this.element = element;
    }
    
    if (!this.element) {
      throw new Error(`Element not found: ${element}`);
    }
  }

  /**
   * Render the component
   * @abstract
   */
  render() {
    throw new Error('render() method must be implemented');
  }

  /**
   * Update the component's state and re-render
   * @param {Object} newState - New state to merge with current state
   */
  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.render();
  }

  /**
   * Add event listener to the component's element
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   */
  addEventListener(event, handler) {
    this.element.addEventListener(event, handler);
  }

  /**
   * Remove event listener from the component's element
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   */
  removeEventListener(event, handler) {
    this.element.removeEventListener(event, handler);
  }

  /**
   * Create a child element within the component
   * @param {string} tag - HTML tag name
   * @param {Object} attributes - Element attributes
   * @param {string|Array} content - Element content
   * @returns {HTMLElement} - Created element
   */
  createElement(tag, attributes = {}, content = '') {
    const element = document.createElement(tag);
    
    // Set attributes
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'className') {
        element.className = value;
      } else if (key === 'style' && typeof value === 'object') {
        Object.assign(element.style, value);
      } else if (key.startsWith('on') && typeof value === 'function') {
        const eventName = key.substring(2).toLowerCase();
        element.addEventListener(eventName, value);
      } else {
        element.setAttribute(key, value);
      }
    });
    
    // Add content
    if (Array.isArray(content)) {
      content.forEach(item => {
        if (item instanceof HTMLElement) {
          element.appendChild(item);
        } else if (item) {
          element.appendChild(document.createTextNode(String(item)));
        }
      });
    } else if (content) {
      element.textContent = String(content);
    }
    
    return element;
  }

  /**
   * Destroy the component and clean up resources
   */
  destroy() {
    // Remove all event listeners
    this.element.replaceWith(this.element.cloneNode(true));
  }
} 