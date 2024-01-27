const chunkSize = 20 * 1024 * 1024;

let result = [];
let totalProgress = [];
let totalProgressBar;
let totalProgressBarState;
let totalProgressBarInfo;
let startTime;
let updateTimeTask;

let active = 0;

let nextChunk;
let chunkCount;


async function parseFile(file) {
  let fileSize = file.size;
  let offset = 0;
  let cid = 0;

  return function chunk() {
    if (offset >= fileSize) return -1;
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


function sendFile(chunk, cid) {
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
  formData.append('file', new Blob([chunk]), 'data');

  let xhr = new XMLHttpRequest();
  xhr.upload.onprogress = (ev) => {
    let p = ev.loaded / chunk.byteLength;
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
  xhr.onloadend = async () => {
    if (xhr.status != 200) return err();
    result.push(xhr.response);
    progress.style.height = 0;
    progress.style.opacity = 0;
    setTimeout(() => progress.remove(), 300);
    active--;
    if (active < maxTasks) await startUpload();
    setProgress(cid, 1);
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
      progress.style.height = 0;
      progress.style.opacity = 0;
      setTimeout(() => progress.remove(), 300);
      sendFile(chunk, cid);
    }, retryDelay);
  }
}

async function startUpload() {
  let c = await nextChunk();
  if (c == -1) return;
  if (!c) {
    nextChunk = null;
    lockState(false);
    return;
  }
  active++;
  sendFile(c[0], c[1]);
}

function resetUpload() {
  webhookUsage = webhooks.filter(x => x[1]).map(x => [0, x[0]]);
  result = [];
  progressBars.innerHTML = '';
  progressTop.innerHTML = '';
  totalProgress = [];
  clearInterval(updateTimeTask);
}


function setupProgress() {
  totalProgressBar = document.createElement('div');
  totalProgressBarInfo = document.createElement('span');
  totalProgressBarState = document.createElement('span');

  totalProgressBarInfo.textContent = 'TOTAL [0.0s]';
  totalProgressBarState.textContent = '0%';
  totalProgressBar.append(totalProgressBarInfo, totalProgressBarState);
  totalProgressBar.style.setProperty('--progress', '0%');
  totalProgressBar.classList.add('total');
  progressTop.append(totalProgressBar);
}

function setProgress(cid, progress) {
  let p = totalProgress.filter(x => x[0] == cid);
  if (p.length == 0) totalProgress.push([cid, progress]);
  else p[0][1] = progress;
  let total = totalProgress.reduce((a, b) => a + b[1], 0);
  totalProgressBar.style.setProperty('--progress', `${total / chunkCount * 100}%`);
  totalProgressBarState.textContent = `${Math.floor(total / chunkCount * 100)}%`;

  if (active == 0 && total == chunkCount) endUpload();
}

function updateProgressTime() {
  totalProgressBarInfo.textContent = `TOTAL [${((Date.now() - startTime) / 1000).toFixed(1)}s]`;
}

function endUpload() {
  clearInterval(updateTimeTask);
  lockState(false);
}