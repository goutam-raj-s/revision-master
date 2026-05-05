// Inject floating button
function createFloatingButton() {
  const btn = document.createElement('div');
  btn.id = 'rm-clipper-fab';
  btn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
    </svg>
  `;
  btn.title = "Clip to Revision Master";
  document.body.appendChild(btn);

  btn.addEventListener('click', toggleIframe);
  return btn;
}

function createIframe() {
  const iframe = document.createElement('iframe');
  iframe.id = 'rm-clipper-iframe';
  iframe.src = chrome.runtime.getURL('popup.html?injected=true');
  iframe.allow = "clipboard-write";
  document.body.appendChild(iframe);

  // When iframe loads, send it the page title and URL
  iframe.onload = () => {
    iframe.contentWindow.postMessage({
      type: 'INIT_CLIPPER',
      title: document.title,
      url: window.location.href
    }, '*');
  };

  return iframe;
}

let fab = null;
let iframe = null;

function toggleIframe() {
  if (!iframe) {
    iframe = createIframe();
  }
  
  const isHidden = iframe.classList.contains('rm-hidden');
  
  if (isHidden || iframe.style.display === 'none' || iframe.style.display === '') {
    iframe.style.display = 'block';
    iframe.classList.remove('rm-hidden');
    // add small delay for transition
    setTimeout(() => {
      iframe.classList.add('rm-visible');
    }, 10);
  } else {
    iframe.classList.remove('rm-visible');
    iframe.classList.add('rm-hidden');
    setTimeout(() => {
      iframe.style.display = 'none';
    }, 300); // match transition time
  }
}

// Listen for messages from the iframe
window.addEventListener('message', (event) => {
  // We should verify origin in a real app, but chrome extension URL varies
  if (event.data && event.data.type === 'CLOSE_CLIPPER') {
    if (iframe) {
      iframe.classList.remove('rm-visible');
      iframe.classList.add('rm-hidden');
      setTimeout(() => {
        iframe.style.display = 'none';
      }, 300);
    }
  }
});

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    fab = createFloatingButton();
  });
} else {
  fab = createFloatingButton();
}
