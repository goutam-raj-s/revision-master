document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('clipper-form');
  const titleInput = document.getElementById('title');
  const urlInput = document.getElementById('url');
  const notesInput = document.getElementById('notes');
  const tagsInput = document.getElementById('tags');
  const terminologyInput = document.getElementById('terminology');
  const actionIfExistsInput = document.getElementById('actionIfExists');
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

  // Restore drafted values if any
  try {
    const draft = await chrome.storage.local.get(['draft_notes', 'draft_tags', 'draft_terminology', 'draft_action']);
    if (draft.draft_notes) notesInput.value = draft.draft_notes;
    if (draft.draft_tags) tagsInput.value = draft.draft_tags;
    if (draft.draft_terminology) terminologyInput.value = draft.draft_terminology;
    if (draft.draft_action) actionIfExistsInput.value = draft.draft_action;
  } catch (e) {
    console.error("Could not load drafts:", e);
  }

  // Live save inputs
  const saveDraft = () => {
    chrome.storage.local.set({
      draft_notes: notesInput.value,
      draft_tags: tagsInput.value,
      draft_terminology: terminologyInput.value,
      draft_action: actionIfExistsInput.value
    });
  };

  notesInput.addEventListener('input', saveDraft);
  tagsInput.addEventListener('input', saveDraft);
  terminologyInput.addEventListener('input', saveDraft);
  actionIfExistsInput.addEventListener('change', saveDraft);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';
    statusMessage.classList.add('hidden');

    const payload = {
      title: titleInput.value,
      url: urlInput.value,
      notes: notesInput.value,
      tags: tagsInput.value,
      terminology: terminologyInput.value,
      actionIfExists: actionIfExistsInput.value
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
      tagsInput.value = '';
      terminologyInput.value = '';
      
      // Clear drafts
      await chrome.storage.local.remove(['draft_notes', 'draft_tags', 'draft_terminology', 'draft_action']);
      
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
