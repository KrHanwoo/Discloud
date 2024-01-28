let file;
let disc;

uploadSelectBtn.onclick = async () => {
  let iconElem = uploadSelectBtn.firstElementChild;
  let textElem = uploadSelectBtn.lastElementChild;
  if (file) {
    file = null;
    iconElem.innerHTML = '&#xe9fc;';
    textElem.textContent = 'SELECT';
    $('upload-filename-label').textContent = '';
    $('upload-filesize-label').textContent = '';
    $('upload-chunkcount-label').textContent = '';
    startUploadBtn.toggleAttribute('disabled', true);
    return;
  }
  const picker = document.createElement('input');
  picker.type = 'file';
  picker.oninput = (f) => {
    setUploadFile(f.target.files[0]);
  };
  picker.click();
};

uploadOptions.ondragenter = () => {
  uploadOptions.previousElementSibling.classList.toggle('dragover', true);
};

uploadOptions.ondragleave = (e) => {
  uploadOptions.previousElementSibling.classList.toggle('dragover', false);
};

uploadOptions.ondragover = (e) => {
  e.preventDefault();
}

uploadOptions.ondrop = (e) => {
  uploadOptions.previousElementSibling.classList.toggle('dragover', false);
  if (!e.dataTransfer.files[0]) return;
  e.preventDefault();
  setUploadFile(e.dataTransfer.files[0]);
};

function setUploadFile(dragFile) {
  let iconElem = uploadSelectBtn.firstElementChild;
  let textElem = uploadSelectBtn.lastElementChild;
  file = dragFile;
  iconElem.innerHTML = '&#xf74f;';
  textElem.textContent = 'REMOVE';
  $('upload-filename-label').textContent = file.name;
  $('upload-filesize-label').textContent = parseSize(file.size);
  $('upload-chunkcount-label').textContent = `${Math.ceil(file.size / chunkSize)} CHUNKS`;
  startUploadBtn.toggleAttribute('disabled', false);
}


downloadSelectBtn.onclick = async () => {
  let iconElem = downloadSelectBtn.firstElementChild;
  let textElem = downloadSelectBtn.lastElementChild;
  if (file) {
    file = null;
    iconElem.innerHTML = '&#xe9fc;';
    textElem.textContent = 'SELECT';
    $('download-filename-label').textContent = '';
    $('download-filesize-label').textContent = '';
    $('download-webhooks-label').textContent = '';
    startDownloadBtn.toggleAttribute('disabled', true);
    return;
  }
  const picker = document.createElement('input');
  picker.type = 'file';
  picker.accept = '.disc';
  picker.oninput = (f) => {
    setDownloadFile(f.target.files[0]);
  };
  picker.click();
};

downloadOptions.ondragenter = () => {
  downloadOptions.previousElementSibling.classList.toggle('dragover', true);
};

downloadOptions.ondragleave = () => {
  downloadOptions.previousElementSibling.classList.toggle('dragover', false);
};

downloadOptions.ondragover = (e) => {
  e.preventDefault();
}

downloadOptions.ondrop = (e) => {
  downloadOptions.previousElementSibling.classList.toggle('dragover', false);
  if (!e.dataTransfer.files[0]) return;
  e.preventDefault();
  if (!isDiscFile(e.dataTransfer.files[0])) return;
  setDownloadFile(e.dataTransfer.files[0]);
};

async function setDownloadFile(dragFile) {
  let iconElem = downloadSelectBtn.firstElementChild;
  let textElem = downloadSelectBtn.lastElementChild;
  file = dragFile;
  let info = await parseDisc(file);
  disc = info;
  if(!info) return;
  iconElem.innerHTML = '&#xf74f;';
  textElem.textContent = 'REMOVE';
  $('download-filename-label').textContent = info.name;
  $('download-filesize-label').textContent = parseSize(info.size);
  $('download-webhooks-label').textContent = `${info.webhooks.length} WEBHOOKS`;
  startDownloadBtn.toggleAttribute('disabled', false);
}

const isDiscFile = (x) => x?.name?.endsWith('.disc');

let dragCount = 0;

document.ondragenter = () => {
  if (dragCount++ != 0) return;
  Array.from(downloadOptions.children).forEach(x => x.style.pointerEvents = 'none');
  Array.from(uploadOptions.children).forEach(x => x.style.pointerEvents = 'none');
};

document.ondragleave = () => {
  if (--dragCount != 0) return;
  Array.from(downloadOptions.children).forEach(x => x.style.pointerEvents = null);
  Array.from(uploadOptions.children).forEach(x => x.style.pointerEvents = null);
};

document.ondrop = () => {
  dragCount = 0;
  Array.from(downloadOptions.children).forEach(x => x.style.pointerEvents = null);
  Array.from(uploadOptions.children).forEach(x => x.style.pointerEvents = null);
};

launchQueue.setConsumer(async (launchParams) => {
  if(!launchParams.files) return;
  let file = await launchParams.files[0].getFile();
  setDownloadFile(file);
});