# JavaScript Best Practices

## Core Philosophy

**Product-First Native JavaScript Development**: Focus on delivering immediate product value through pure native JavaScript that works without build processes.

## Key Principles

### 1. Zero Build Process

- **No Dependencies**: Avoid npm, webpack, babel, or any build tools
- **Direct Deployment**: Write code that can be deployed immediately
- **Browser Compatibility**: Support modern browsers (2022+) with native ES6+ features
- **Pure JavaScript**: Use only native JavaScript APIs and features

### 2. Shadow DOM Encapsulation

- **Complete Isolation**: All components must use Shadow DOM for encapsulation
- **Closed Shadow DOM**: Use `attachShadow({mode: 'closed'})` for maximum isolation
- **Style Encapsulation**: All CSS must be defined within Shadow DOM
- **Event Isolation**: All event listeners registered within Shadow DOM

### 3. Class-Based Architecture

- **Object-Oriented Design**: All functionality encapsulated in JavaScript classes
- **Getter/Setter Pattern**: All properties must have getter/setter methods
- **Chainable Methods**: All setters must return `this` for method chaining
- **Safe Value Return**: All getters must return safe copies of values

### 4. Product-Focused Development

- **User Experience First**: Prioritize code that enhances user experience
- **Performance Optimization**: Use debounce, throttle, and lazy loading
- **Error Resilience**: Graceful error handling without breaking user experience
- **Progressive Enhancement**: Ensure functionality works without JavaScript

## Implementation Standards

### Class Structure

```javascript
class ProductComponent {
  constructor(config = {}) {
    this._config = { ...this._defaultConfig, ...config };
    this._debug = this._config.debug || false;
    this._init();
  }

  // Getters and Setters
  get debug() {
    return this._debug;
  }
  set debug(value) {
    this._debug = Boolean(value);
    return this;
  }

  // Batch Configuration
  setConfig(config) {
    this._config = { ...this._config, ...config };
    return this;
  }

  // Reset Functionality
  reset() {
    this._config = { ...this._defaultConfig };
    return this;
  }

  // Validation
  validate() {
    // Implementation specific validation
    return this;
  }

  // Execution
  execute() {
    if (this._debug) console.log("Executing component...");
    // Implementation
    return this;
  }
}
```

### Shadow DOM Implementation

```javascript
class EncapsulatedComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "closed" });
    this._init();
  }

  _init() {
    const style = document.createElement("style");
    style.textContent = `
      :host {
        display: block;
        /* Component styles */
      }
      :host([theme="dark"]) {
        /* Theme variations */
      }
    `;

    const template = document.createElement("template");
    template.innerHTML = `
      <div class="component-container">
        <!-- Component content -->
      </div>
    `;

    this.shadowRoot.appendChild(style);
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }
}
```

### Error Handling

```javascript
class ErrorResilientComponent {
  constructor() {
    this._setupErrorHandling();
  }

  _setupErrorHandling() {
    // Global error handling
    window.addEventListener("error", this._handleError.bind(this));
    window.addEventListener(
      "unhandledrejection",
      this._handlePromiseRejection.bind(this)
    );
  }

  _handleError(error) {
    if (this._debug) console.error("Component error:", error);
    // Graceful degradation
  }

  _handlePromiseRejection(event) {
    if (this._debug) console.error("Promise rejection:", event.reason);
    // Handle async errors
  }
}
```

## Performance Guidelines

### 1. Event Optimization

```javascript
// Debounce for frequent events
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle for continuous events
function throttle(func, limit) {
  let inThrottle;
  return function () {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
```

### 2. DOM Optimization

```javascript
// Use DocumentFragment for batch operations
function batchDOMUpdates(elements) {
  const fragment = document.createDocumentFragment();
  elements.forEach((element) => fragment.appendChild(element));
  document.body.appendChild(fragment);
}

// Lazy loading for non-critical features
function lazyLoad(feature) {
  return new Promise((resolve) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => resolve(feature));
    } else {
      resolve(feature);
    }
  });
}
```

## Debugging and Logging

### 1. Debug Mode

```javascript
class DebuggableComponent {
  constructor(debug = false) {
    this._debug = debug;
  }

  _log(message, level = "info") {
    if (!this._debug) return;

    const timestamp = new Date().toISOString();
    const prefix = `[${this.constructor.name}]`;

    switch (level) {
      case "error":
        console.error(`${prefix} ${timestamp}: ${message}`);
        break;
      case "warn":
        console.warn(`${prefix} ${timestamp}: ${message}`);
        break;
      default:
        console.log(`${prefix} ${timestamp}: ${message}`);
    }
  }
}
```

### 2. Performance Monitoring

```javascript
class PerformanceMonitor {
  static measure(name, fn) {
    const start = performance.now();
    const result = fn();
    const end = performance.now();

    if (this._debug) {
      console.log(`Performance [${name}]: ${(end - start).toFixed(2)}ms`);
    }

    return result;
  }
}
```

## Security Guidelines

### 1. Input Validation

```javascript
class SecureComponent {
  validateInput(input, type) {
    switch (type) {
      case "string":
        return typeof input === "string" && input.trim().length > 0;
      case "number":
        return typeof input === "number" && !isNaN(input);
      case "email":
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
      default:
        return false;
    }
  }
}
```

### 2. XSS Prevention

```javascript
function sanitizeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
```

## Testing Strategy

### 1. Unit Testing

```javascript
class TestableComponent {
  // Expose internal methods for testing
  _exposeForTesting() {
    return {
      _config: this._config,
      _validate: this._validate.bind(this),
      _execute: this._execute.bind(this),
    };
  }
}
```

### 2. Integration Testing

```javascript
// Test component integration
function testComponentIntegration(component, dependencies) {
  return new Promise((resolve, reject) => {
    try {
      const result = component.execute();
      resolve(result);
    } catch (error) {
      reject(error);
    }
  });
}
```

## Documentation Standards

### 1. JSDoc Comments

```javascript
/**
 * Product-focused component for user interaction
 * @class UserInteractionComponent
 * @extends HTMLElement
 */
class UserInteractionComponent extends HTMLElement {
  /**
   * Creates a new UserInteractionComponent
   * @param {Object} config - Configuration object
   * @param {string} config.apiUrl - API endpoint URL
   * @param {number} config.timeout - Request timeout in milliseconds
   * @param {boolean} config.debug - Enable debug mode
   */
  constructor(config = {}) {
    super();
    this._config = config;
  }

  /**
   * Sets the API URL for the component
   * @param {string} url - The API URL to set
   * @returns {UserInteractionComponent} This component for chaining
   */
  setApiUrl(url) {
    this._config.apiUrl = url;
    return this;
  }
}
```

## Version Information

- **Version**: 1.0.0
- **Last Updated**: 2024
- **Browser Support**: Modern browsers (2022+)
- **ES Version**: ES6+ with native features only
