// Hide Vercel Toolbar and Analytics Script
(function() {
  'use strict';
  
  // Function to remove Vercel elements
  function removeVercelElements() {
    // Remove Vercel toolbar elements
    const vercelSelectors = [
      '[data-vercel-toolbar]',
      '[data-vercel-speed-insights]',  
      '[data-vercel-analytics]',
      '.vercel-toolbar',
      '.vercel-speed-insights',
      '.vercel-analytics',
      '._vercel_toolbar',
      '._vercel_speed_insights',
      '._vercel_analytics',
      'iframe[src*="vercel"]',
      'iframe[src*="speedinsights"]',
      'iframe[src*="analytics"]'
    ];
    
    vercelSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        element.remove();
      });
    });
    
    // Remove script tags related to Vercel
    const scripts = document.querySelectorAll('script');
    scripts.forEach(script => {
      if (script.src && (
        script.src.includes('vercel') ||
        script.src.includes('speedinsights') ||
        script.src.includes('analytics')
      )) {
        script.remove();
      }
    });
    
    // Remove link tags related to Vercel
    const links = document.querySelectorAll('link');
    links.forEach(link => {
      if (link.href && (
        link.href.includes('vercel') ||
        link.href.includes('speedinsights') ||
        link.href.includes('analytics')
      )) {
        link.remove();
      }
    });
  }
  
  // Run immediately
  removeVercelElements();
  
  // Run after DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', removeVercelElements);
  }
  
  // Run after window loads
  window.addEventListener('load', removeVercelElements);
  
  // Create a MutationObserver to watch for dynamically added elements
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if the added node is a Vercel element
            const element = node;
            if (element.dataset && (
              element.dataset.vercelToolbar !== undefined ||
              element.dataset.vercelSpeedInsights !== undefined ||
              element.dataset.vercelAnalytics !== undefined
            )) {
              element.remove();
            }
            
            // Check for class names
            if (element.className && typeof element.className === 'string') {
              if (element.className.includes('vercel')) {
                element.remove();
              }
            }
            
            // Check for iframes
            if (element.tagName === 'IFRAME' && element.src) {
              if (element.src.includes('vercel') || 
                  element.src.includes('speedinsights') ||
                  element.src.includes('analytics')) {
                element.remove();
              }
            }
          }
        });
      }
    });
  });
  
  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Override console methods to prevent Vercel logging
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;
  
  console.log = function(...args) {
    const message = args.join(' ');
    if (!message.toLowerCase().includes('vercel')) {
      originalLog.apply(console, args);
    }
  };
  
  console.warn = function(...args) {
    const message = args.join(' ');
    if (!message.toLowerCase().includes('vercel')) {
      originalWarn.apply(console, args);
    }
  };
  
  console.error = function(...args) {
    const message = args.join(' ');
    if (!message.toLowerCase().includes('vercel')) {
      originalError.apply(console, args);
    }
  };
  
})();
