let activeFetch = 0;
let picker;
let urls = [];
let dataIdx = 0;
let lastCid = 0;
let activeDownload = 0;
let downloadedChunks = [];


async function showSavePrompt() {
  let picker = await showSaveFilePicker().catch(() => null);
  if (!picker) return null;
  return picker;
}

startDownloadBtn.onclick = async () => {
  picker = await showSavePrompt();
  lockState(true);
  resetDownload();
  chunkCount = Math.ceil(disc.size / chunkSize);
  startTime = Date.now();
  setupProgress();
  updateTimeTask = setInterval(updateProgressTime, 100);
  for (let i = 0; i < maxFetch; i++) {
    startGetInfo();
  }
  for (let i = 0; i < maxChunks; i++) {
    // await startUpload();
  }
};

function startGetInfo() {
  if (dataIdx >= disc.data.length) return;
  getInfo(disc.data[dataIdx]);
  dataIdx++;
}


async function getInfo(data) {
  let cid = Number(data.split('@')[0]) + 1;
  let webhook = `https://discord.com/api/webhooks/${disc.webhooks[cid - 1]}`;
  let msgId = data.split('@')[1];

  let progress = document.createElement('div');
  let info = document.createElement('span');
  let state = document.createElement('span');

  info.textContent = `CHUNK #${String(cid).padStart(3, '0')}`;
  state.textContent = 'INFO';
  progress.append(info, state);
  progress.style.setProperty('--progress', '0%');
  progress.classList.add('idle');
  progressBars.append(progress);


  await fetch(`${webhook}/messages/${msgId}`)
    .then(x => {
      if (!x.ok) throw new Error();
      return x.json();
    }).then(x => {
      progress.style.setProperty('--progress', '100%');
      progress.classList.add('load');
      state.textContent = 'LOAD';
      urls.push([cid, x.attachments[0].url]);
      activeFetch--;
      if (activeFetch < maxFetch) startGetInfo();
      startDownload();
      
      setTimeout(() => {
        progress.style.height = 0;
        progress.style.opacity = 0;
        setTimeout(() => progress.remove(), 300);
      }, 500);
    }).catch(() => {
      state.textContent = 'ERR';
      progress.classList.remove('load');
      progress.classList.add('err');
      setTimeout(() => {
        progress.style.height = 0;
        progress.style.opacity = 0;
        setTimeout(() => progress.remove(), 300);
        getInfo(data);
      }, downloadRetryDelay);
    });
}

async function getFile(cid, url) {
  let progress = document.createElement('div');
  let info = document.createElement('span');
  let state = document.createElement('span');

  info.textContent = `CHUNK #${String(cid).padStart(3, '0')}`;
  state.textContent = 'IDLE';
  progress.append(info, state);
  progress.style.setProperty('--progress', '0%');
  progress.classList.add('idle');
  progressBars.append(progress);

  let xhr = new XMLHttpRequest();
  xhr.onprogress = (ev) => {
    let p = ev.loaded / ev.total;
    setProgress(cid, p);
    progress.style.setProperty('--progress', `${p * 100}%`);
    state.textContent = `${Math.floor(p * 100)}%`;
  };
  xhr.onloadstart = () => {
    progress.classList.remove('idle');
    state.textContent = '0%';
  };
  xhr.onloadend = async () => {
    setProgress(cid, 1);
    progress.style.setProperty('--progress', '100%');
    progress.classList.add('load');
    state.textContent = 'LOAD';

    if (xhr.status != 200) return err();
    downloadedChunks.push([cid, xhr.response]);
    progress.style.height = 0;
    progress.style.opacity = 0;
    setTimeout(() => progress.remove(), 300);
    startDownload();
    setProgress(cid, 1);
  };
  xhr.onabort = err;
  xhr.open('GET', url);
  xhr.send();

  function err() {
    state.textContent = 'ERR';
    progress.classList.remove('load');
    progress.classList.add('err');
    setProgress(cid, 0);
    setTimeout(() => {
      progress.style.height = 0;
      progress.style.opacity = 0;
      setTimeout(() => progress.remove(), 300);
      getFile(cid, url);
    }, downloadRetryDelay);
  }
}


function resetDownload() {
  activeFetch = 0;
  picker = null;
  urls = [];
  dataIdx = 0;
  activeDownload = 0;
  lastCid = 0;
  downloadedChunks = [];
  resetUpload();
}

function startDownload(){
  if (lastCid >= chunkCount) return;
  if(activeDownload >= maxChunks) return;
  activeDownload ++;
  let downloadUrl = urls.sort((a,b) => a[0] - b[0])[0];
  urls.splice(urls.indexOf(downloadUrl), 1);
  getFile(downloadUrl[0], downloadUrl[1]);
}