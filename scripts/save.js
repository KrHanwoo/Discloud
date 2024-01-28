let activeFetch = 0;
let picker;
let urls = [];
let dataIdx = 0;


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
      urls.push(x.attachments[0].url);
      activeFetch--;
      if (activeFetch < maxFetch) startGetInfo();
      
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


function resetDownload() {
  activeFetch = 0;
  picker = null;
  urls = [];
  dataIdx = 0;
  resetUpload();
}