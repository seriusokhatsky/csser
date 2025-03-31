document.addEventListener('DOMContentLoaded', async function() {
  // Initialize CodeMirror with minimal configuration
  const editor = CodeMirror.fromTextArea(document.getElementById('cssInput'), {
    mode: 'css',
    theme: 'monokai',
    lineNumbers: true,
    indentUnit: 4,
    tabSize: 4,
    lineWrapping: true,
    indentWithTabs: false,
    smartIndent: true,
    matchBrackets: true,
    autoCloseBrackets: true,
    gutters: ["CodeMirror-linenumbers"]
  });

  // Add custom styles for line numbers
  const style = document.createElement('style');
  style.textContent = `
    .cm-lineNumbers {
      color: #666;
      padding: 0 8px;
      min-width: 20px;
    }
    .cm-gutters {
      border-right: 1px solid #333;
      background-color: #1e1e1e;
    }
    .cm-content {
      padding: 0 4px;
    }
  `;
  document.head.appendChild(style);

  try {
    // Get current tab's domain
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentDomain = new URL(tab.url).hostname;

    // Load saved CSS for current domain
    const storage = await chrome.storage.local.get('css');
    const css = storage.css || {};
    if (css[currentDomain]) {
      editor.setValue(css[currentDomain]);
    } else {
      editor.setValue('');
    }

    // Function to apply CSS
    async function applyCSS(cssContent) {
      try {
        // Remove any existing injected CSS
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: () => {
            const existingStyle = document.getElementById('custom-css-injector');
            if (existingStyle) {
              existingStyle.remove();
            }
          }
        });

        // Inject new CSS
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: (cssToInject) => {
            const style = document.createElement('style');
            style.id = 'custom-css-injector';
            style.textContent = cssToInject;
            document.head.appendChild(style);
          },
          args: [cssContent]
        });
      } catch (error) {
        console.error('Error applying CSS:', error);
      }
    }

    // Function to save CSS
    async function saveCSS(cssContent) {
      try {
        const storage = await chrome.storage.local.get('css');
        const css = storage.css || {};
        css[currentDomain] = cssContent;
        await chrome.storage.local.set({ css });
      } catch (error) {
        console.error('Error saving CSS:', error);
      }
    }

    // Debounce function to limit how often we apply and save CSS
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

    // Debounced versions of applyCSS and saveCSS
    const debouncedApplyCSS = debounce(applyCSS, 300);
    const debouncedSaveCSS = debounce(saveCSS, 300);

    // Listen for changes in the editor
    editor.on('change', (cm) => {
      const cssContent = cm.getValue();
      debouncedApplyCSS(cssContent);
      debouncedSaveCSS(cssContent);
    });

    // Apply initial CSS
    const initialCSS = editor.getValue();
    await applyCSS(initialCSS);

  } catch (error) {
    console.error('Error initializing extension:', error);
    editor.setValue('');
  }
}); 