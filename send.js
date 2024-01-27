const progressBars = $('progress');
const uploadBtn = $('upload-btn');
const startBtn = $('start-btn');
const chunkSize = 20 * 1024 * 1024;

let webhookUsage = [];
let result = [];
let totalProgress = [];
let totalProgressBar;
let totalProgressBarState;

let limit = 10;
let active = 0;

let nextChunk;
let file;
let chunkCount;

uploadBtn.onclick = async () => {
  let iconElem = uploadBtn.firstElementChild;
  let textElem = uploadBtn.lastElementChild;
  if (file) {
    file = null;
    iconElem.innerHTML = '&#xe9fc;';
    textElem.textContent = 'SELECT';
    $('filename-label').textContent = '';
    $('filesize-label').textContent = '';
    $('chunkcount-label').textContent = '';
    startBtn.toggleAttribute('disabled', true);
    return;
  }
  const picker = document.createElement('input');
  picker.type = 'file';
  picker.oninput = (f) => {
    file = f.target.files[0];
    iconElem.innerHTML = '&#xf74f;';
    textElem.textContent = 'REMOVE';
    $('filename-label').textContent = file.name;
    $('filesize-label').textContent = parseSize(file.size);
    $('chunkcount-label').textContent = `${Math.ceil(file.size / chunkSize)} CHUNKS`;
    startBtn.toggleAttribute('disabled', false);
  };
  picker.click();
};

$('start-btn').onclick = async () => {
  lockState(true);
  resetUpload();
  nextChunk = await parseFile(file);
  chunkCount = Math.ceil(file.size / chunkSize);
  setupProgress();
  for (let i = 0; i < limit; i++) {
    await startUpload();
    await new Promise((r) => setTimeout(r, 500));
  }
};


async function parseFile(file) {
  let fileSize = file.size;
  let offset = 0;
  let cid = 0;

  return function chunk() {
    if (offset >= fileSize) return null;
    return new Promise((resolve, reject) => {
      let r = new FileReader();
      let blob = file.slice(offset, chunkSize + offset);
      r.onload = async () => {
        if (!r.error) {
          offset += r.result.byteLength;
          resolve([r.result, ++cid]);
        } else {
          lockState(false);
          console.log("Read error: " + r.error);
          reject(r.error);
        }
      };
      r.readAsArrayBuffer(blob);
    });
  }
}


function sendFile(file, cid) {
  let progress = document.createElement('div');
  let info = document.createElement('span');
  let state = document.createElement('span');

  info.textContent = `CHUNK #${String(cid).padStart(3, '0')}`;
  state.textContent = 'IDLE';
  progress.append(info, state);
  progress.style.setProperty('--progress', '0%');
  progress.classList.add('idle');
  progressBars.append(progress);

  let formData = new FormData();
  formData.append('file', new Blob([file]), 'data');

  let xhr = new XMLHttpRequest();
  xhr.upload.onprogress = (ev) => {
    let p = ev.loaded / file.byteLength;
    setProgress(cid, p);
    progress.style.setProperty('--progress', `${p * 100}%`);
    state.textContent = `${Math.floor(p * 100)}%`;
  };
  xhr.upload.onloadend = () => {
    setProgress(cid, 1);
    progress.style.setProperty('--progress', '100%');
    progress.classList.add('load');
    state.textContent = 'LOAD';
  };
  xhr.onloadstart = () => {
    progress.classList.remove('idle');
    state.textContent = '0%';
  };
  xhr.onloadend = () => {
    if (xhr.status != 200) return err();
    result.push(xhr.response);
    progress.remove();
    active--;
    if (active < limit) startUpload();
  };
  xhr.onabort = err;
  xhr.open('POST', getWebhook());
  xhr.send(formData);

  function err() {
    state.textContent = 'ERR';
    progress.classList.remove('load');
    progress.classList.add('err');
    setProgress(cid, 0);
    setTimeout(() => {
      progress.remove();
      sendFile(file, cid);
    }, 3000);
  }
}

async function startUpload() {
  let c = await nextChunk();
  if (!c) return lockState(false);
  active++;
  sendFile(c[0], c[1]);
}

function resetUpload() {
  webhookUsage = webhooks.map(x => [0, x]);
  result = [];
  progressBars.innerHTML = '';
  totalProgress = [];
}

function getWebhook() {
  let w = webhookUsage.sort((a, b) => a[0] - b[0])[0];
  w[0]++;
  return w[1];
}

function setupProgress() {
  totalProgressBar = document.createElement('div');
  let info = document.createElement('span');
  totalProgressBarState = document.createElement('span');

  info.textContent = 'TOTAL';
  totalProgressBarState.textContent = '0%';
  totalProgressBar.append(info, totalProgressBarState);
  totalProgressBar.style.setProperty('--progress', '0%');
  totalProgressBar.classList.add('total');
  progressBars.append(totalProgressBar);
}

function setProgress(cid, progress) {
  let p = totalProgress.filter(x => x[0] == cid);
  if (p.length == 0) totalProgress.push([cid, progress]);
  else p[0][1] = progress;
  let total = totalProgress.reduce((a, b) => a + b[1], 0);
  totalProgressBar.style.setProperty('--progress', `${total / chunkCount * 100}%`);
  totalProgressBarState.textContent = `${Math.floor(total / chunkCount * 100)}%`;
}