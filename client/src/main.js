const createView = document.getElementById('create-view');
const viewView = document.getElementById('view-view');
const createForm = document.getElementById('create-form');
const noteContent = document.getElementById('note-content');
const togglePassword = document.getElementById('toggle-password');
const passwordRow = document.getElementById('password-row');
const notePassword = document.getElementById('note-password');
const noteExpiration = document.getElementById('note-expiration');
const createStatus = document.getElementById('create-status');
const result = document.getElementById('result');
const resultUrl = document.getElementById('result-url');
const copyButton = document.getElementById('copy-button');

const viewPasswordRow = document.getElementById('view-password-row');
const viewPassword = document.getElementById('view-password');
const viewButton = document.getElementById('view-button');
const viewStatus = document.getElementById('view-status');
const noteOutput = document.getElementById('note-output');
const backHome = document.getElementById('back-home');

const setStatus = (el, msg, isError = false) => {
  el.textContent = msg;
  el.classList.toggle('error', isError);
};

const showView = (target) => {
  if (target === 'create') {
    createView.hidden = false;
    createView.classList.add('active');
    viewView.hidden = true;
    viewView.classList.remove('active');
  } else {
    viewView.hidden = false;
    viewView.classList.add('active');
    createView.hidden = true;
    createView.classList.remove('active');
  }
};

const getKeyFromPath = () => {
  const path = window.location.pathname.replace(/^\//, '');
  return path.length ? path : null;
};

const copyToClipboard = async (value) => {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const temp = document.createElement('textarea');
  temp.value = value;
  temp.setAttribute('readonly', '');
  temp.style.position = 'absolute';
  temp.style.left = '-9999px';
  document.body.appendChild(temp);
  temp.select();
  document.execCommand('copy');
  document.body.removeChild(temp);
};

const createNote = async (content, options) => {
  const response = await fetch('/api/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, ...options }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Unable to create note.');
  }
  return data;
};

const viewNote = async (key, password) => {
  const response = await fetch(`/api/notes/${encodeURIComponent(key)}/read`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(password ? { password } : {}),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Unable to read note.');
  }
  return data;
};

const resetResult = () => {
  result.hidden = true;
  resultUrl.value = '';
  setStatus(createStatus, '');
};

const resetViewState = () => {
  noteOutput.hidden = true;
  noteOutput.textContent = '';
  backHome.hidden = true;
  viewPassword.value = '';
  setStatus(viewStatus, '');
};

const handleCreateSubmit = async (event) => {
  event.preventDefault();
  resetResult();

  const content = noteContent.value.trim();
  if (!content) {
    setStatus(createStatus, 'Please write a note first.', true);
    return;
  }

  const options = {
    password: togglePassword.checked ? notePassword.value.trim() : undefined,
    expiration: noteExpiration.value,
  };

  try {
    setStatus(createStatus, 'Creating note...');
    const data = await createNote(content, options);
    const url = `${window.location.origin}/${data.key}`;
    resultUrl.value = url;
    result.hidden = false;
    setStatus(createStatus, 'Note created successfully.');
  } catch (error) {
    setStatus(createStatus, error.message, true);
  }
};

const handleReveal = async () => {
  const key = getKeyFromPath();
  if (!key) {
    return;
  }

  resetViewState();

  try {
    setStatus(viewStatus, 'Fetching note...');
    const data = await viewNote(key, viewPassword.value.trim());
    noteOutput.textContent = data.content || '';
    noteOutput.hidden = false;
    backHome.hidden = false;
    setStatus(viewStatus, 'Note revealed.');
  } catch (error) {
    const msg = error.message || 'Unable to read note.';
    setStatus(viewStatus, msg, true);
    if (msg.toLowerCase().includes('password')) {
      viewPasswordRow.hidden = false;
    }
  }
};

const initViewMode = () => {
  const key = getKeyFromPath();
  if (key) {
    showView('view');
    viewPasswordRow.hidden = true;
    handleReveal();
  } else {
    showView('create');
  }
};

togglePassword.addEventListener('change', () => {
  passwordRow.hidden = !togglePassword.checked;
  if (!togglePassword.checked) {
    notePassword.value = '';
  }
});

createForm.addEventListener('submit', handleCreateSubmit);

copyButton.addEventListener('click', async () => {
  if (!resultUrl.value) {
    return;
  }
  try {
    await copyToClipboard(resultUrl.value);
    copyButton.textContent = 'Copied';
    setTimeout(() => {
      copyButton.textContent = 'Copy';
    }, 1500);
  } catch (error) {
    setStatus(createStatus, 'Copy failed. Please copy manually.', true);
  }
});

viewButton.addEventListener('click', handleReveal);

backHome.addEventListener('click', () => {
  window.history.pushState({}, '', '/');
  resetViewState();
  showView('create');
});

window.addEventListener('popstate', () => {
  resetViewState();
  resetResult();
  initViewMode();
});

initViewMode();
