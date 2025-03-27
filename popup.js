document.addEventListener('DOMContentLoaded', async function() {
  // Initialize CodeMirror
  const editor = CodeMirror.fromTextArea(document.getElementById('cssInput'), {
    mode: 'css',
    theme: 'monokai',
    lineNumbers: true,
    autoCloseBrackets: true,
    matchBrackets: true,
    indentUnit: 4,
    tabSize: 4,
    lineWrapping: true,
    extraKeys: {
      "Tab": "indentMore",
      "Shift-Tab": "indentLess"
    }
  });

  const domainSelect = document.getElementById('domainSelect');
  const applyButton = document.getElementById('applyButton');
  const saveButton = document.getElementById('saveButton');
  const deleteButton = document.getElementById('deleteButton');

  // Get current tab's domain
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const currentDomain = new URL(tab.url).hostname;

  // Load saved domains into select
  const { savedDomains = [] } = await chrome.storage.local.get('savedDomains');
  savedDomains.forEach(domain => {
    if (domain !== 'global' && domain !== currentDomain) {
      const option = document.createElement('option');
      option.value = domain;
      option.textContent = domain;
      domainSelect.appendChild(option);
    }
  });

  // Load CSS for current domain
  const { css = {} } = await chrome.storage.local.get('css');
  if (css[currentDomain]) {
    editor.setValue(css[currentDomain]);
  } else {
    editor.setValue(`/* Enter your CSS here */
body {
  /* Your styles */
}`);
  }

  // Handle domain selection change
  domainSelect.addEventListener('change', async () => {
    const selectedDomain = domainSelect.value;
    const { css = {} } = await chrome.storage.local.get('css');
    editor.setValue(css[selectedDomain] || `/* Enter your CSS here */
body {
  /* Your styles */
}`);
  });

  // Save CSS
  saveButton.addEventListener('click', async () => {
    const selectedDomain = domainSelect.value;
    const cssContent = editor.getValue();
    
    const { css = {}, savedDomains = [] } = await chrome.storage.local.get(['css', 'savedDomains']);
    
    // Update CSS storage
    css[selectedDomain] = cssContent;
    await chrome.storage.local.set({ css });

    // Update saved domains list if needed
    if (!savedDomains.includes(selectedDomain)) {
      savedDomains.push(selectedDomain);
      await chrome.storage.local.set({ savedDomains });
      
      // Add to select if it's not already there
      if (selectedDomain !== 'current' && selectedDomain !== 'global') {
        const option = document.createElement('option');
        option.value = selectedDomain;
        option.textContent = selectedDomain;
        domainSelect.appendChild(option);
      }
    }
  });

  // Delete CSS
  deleteButton.addEventListener('click', async () => {
    const selectedDomain = domainSelect.value;
    if (selectedDomain === 'current' || selectedDomain === 'global') return;

    const { css = {}, savedDomains = [] } = await chrome.storage.local.get(['css', 'savedDomains']);
    
    // Remove CSS for selected domain
    delete css[selectedDomain];
    await chrome.storage.local.set({ css });

    // Remove from saved domains
    const newSavedDomains = savedDomains.filter(d => d !== selectedDomain);
    await chrome.storage.local.set({ savedDomains: newSavedDomains });

    // Remove from select
    const option = domainSelect.querySelector(`option[value="${selectedDomain}"]`);
    if (option) option.remove();

    // Reset editor
    editor.setValue(`/* Enter your CSS here */
body {
  /* Your styles */
}`);
  });

  // Apply CSS
  applyButton.addEventListener('click', async () => {
    const css = editor.getValue();
    
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
      args: [css]
    });
  });
}); 