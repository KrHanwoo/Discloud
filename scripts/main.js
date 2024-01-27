let file;

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

startBtn.onclick = async () => {
  lockState(true);
  resetUpload();
  nextChunk = await parseFile(file);
  chunkCount = Math.ceil(file.size / chunkSize);
  startTime = Date.now();
  setupProgress();
  updateTimeTask = setInterval(updateProgressTime, 100);
  for (let i = 0; i < maxTasks; i++) {
    await startUpload();
    await new Promise((r) => setTimeout(r, startDelay));
  }
};
