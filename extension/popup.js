document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('clipper-form');
  const titleInput = document.getElementById('title');
  const urlInput = document.getElementById('url');
  const notesInput = document.getElementById('notes');
  const statusMessage = document.getElementById('status-message');
  const submitBtn = document.getElementById('submit-btn');
  const closeBtn = document.getElementById('close-btn');

  // Check if we're in an injected iframe
  const urlParams = new URLSearchParams(window.location.search);
  const isInjected = urlParams.get('injected') === 'true';

  if (isInjected) {
    document.body.classList.add('injected');
    // In iframe, we get title and URL from the parent window via postMessage
    // Wait for the parent to send the data
    window.addEventListener('message', (event) => {
      if (event.data.type === 'INIT_CLIPPER') {
        titleInput.value = event.data.title || '';
        urlInput.value = event.data.url || '';
      }
    });

    closeBtn.addEventListener('click', () => {
      window.parent.postMessage({ type: 'CLOSE_CLIPPER' }, '*');
    });
  } else {
    // In extension popup, query the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (activeTab) {
        titleInput.value = activeTab.title || '';
        urlInput.value = activeTab.url || '';
      }
    });
  }

  function showStatus(message, isError = false) {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${isError ? 'error' : 'success'}`;
    statusMessage.classList.remove('hidden');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';
    statusMessage.classList.add('hidden');

    const payload = {
      title: titleInput.value,
      url: urlInput.value,
      notes: notesInput.value
    };

    try {
      // Use local dev server by default (running on 3001 in this environment)
      const apiUrl = 'http://localhost:3001/api/documents/clipper';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to save: ${response.statusText}`);
      }

      showStatus('Saved successfully!');
      
      // Clear notes after success
      notesInput.value = '';
      
      // Auto close after 2 seconds if injected
      if (isInjected) {
        setTimeout(() => {
          window.parent.postMessage({ type: 'CLOSE_CLIPPER' }, '*');
        }, 2000);
      } else {
        setTimeout(() => {
          window.close();
        }, 2000);
      }
    } catch (error) {
      console.error('Error saving clip:', error);
      showStatus(error.message || 'Failed to save. Make sure Revision Master is running.', true);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Save to Revision Master';
    }
  });
});
