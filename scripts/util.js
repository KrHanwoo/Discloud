const $ = id => document.getElementById(id);
let locked = false;

let startDelay = 500;
let maxTasks = 3;
let uploadRetryDelay = 3000;

let maxFetch = 5;
let maxChunks = 3;
let downloadRetryDelay = 3000;

const progressBars = $('progress');
const progressTop = $('progress-top');
const webhookInput = $('webhook-input');

const uploadSelectBtn = $('upload-select-btn');
const startUploadBtn = $('start-upload-btn');
const uploadOptions = $('upload-options');

const downloadSelectBtn = $('download-select-btn');
const startDownloadBtn = $('start-download-btn');
const downloadOptions = $('download-options');

registerSlider('delay-range', (v, elem) => {
  startDelay = v;
  elem.textContent = `STARTING DELAY: ${(v / 1000).toFixed(1)}s`;
});

registerSlider('tasks-range', (v, elem) => {
  maxTasks = v;
  elem.textContent = `TASKS: ${v}`;
});

registerSlider('upload-err-range', (v, elem) => {
  uploadRetryDelay = v;
  elem.textContent = `RETRY DELAY: ${(v / 1000).toFixed(1)}s`;
});

registerSlider('fetch-range', (v, elem) => {
  maxFetch = v;
  elem.textContent = `FETCH TASKS: ${v}`;
});

registerSlider('chunks-range', (v, elem) => {
  maxChunks = v;
  elem.textContent = `CACHED CHUNKS: ${v}`;
});

registerSlider('download-err-range', (v, elem) => {
  downloadRetryDelay = v;
  elem.textContent = `RETRY DELAY: ${(v / 1000).toFixed(1)}s`;
});

function lockState(flag) {
  locked = flag;
  webhookInput.toggleAttribute('disabled', flag);
  uploadSelectBtn.toggleAttribute('disabled', flag);
  startUploadBtn.toggleAttribute('disabled', flag);
  downloadSelectBtn.toggleAttribute('disabled', flag);
  startDownloadBtn.toggleAttribute('disabled', flag);
  Array.from($('webhook-list').querySelectorAll('button')).forEach(x => x.toggleAttribute('disabled', flag));
  Array.from($('webhook-list').querySelectorAll('div')).forEach(x => x.classList.toggle('disabled', flag));
  Array.from(document.querySelectorAll('input[type="range"]')).forEach(x => x.toggleAttribute('disabled', flag));
}

function parseSize(bytes) {
  const thresh = 1024;
  if (bytes < thresh) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let u = -1;
  const r = 10 ** 2;
  do {
    bytes /= thresh;
    ++u;
  } while (Math.round(bytes * r) / r >= thresh && u < units.length - 1);
  return `${bytes.toFixed(2)} ${units[u]}`;
}

function registerSlider(id, cb) {
  let target = $(id);
  target.oninput = () => {
    target.style.setProperty('--value', `${target.valueAsNumber / Number(target.max) * 100}%`);
    cb(target.valueAsNumber, target.nextElementSibling);
  };
  target.oninput();
}

function download(filename, text) {
  let element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);
  element.click();
}

async function parseDisc(disc) {
  try {
    let dec = decodeURIComponent(atob(await disc.text()));
    return JSON.parse(dec);
  } catch (e) {
    return null;
  }
}