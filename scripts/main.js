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
    setUploadFile(f.target.files[0]);
  };
  picker.click();
};

mainOptions.ondragenter = () => {
  mainOptions.previousElementSibling.classList.toggle('dragover', true);
};

mainOptions.ondragleave = (e) => {
  if (!(mainOptions.compareDocumentPosition(e.fromElement) & 8)) return;
  mainOptions.previousElementSibling.classList.toggle('dragover', false);
};

mainOptions.ondragover = (e) => {
  e.preventDefault();
}

mainOptions.ondrop = (e) => {
  mainOptions.previousElementSibling.classList.toggle('dragover', false);
  if (!e.dataTransfer.files[0]) return;
  e.preventDefault();
  setUploadFile(e.dataTransfer.files[0]);
};

function setUploadFile(dragFile) {
  let iconElem = uploadBtn.firstElementChild;
  let textElem = uploadBtn.lastElementChild;
  file = dragFile;
  iconElem.innerHTML = '&#xf74f;';
  textElem.textContent = 'REMOVE';
  $('filename-label').textContent = file.name;
  $('filesize-label').textContent = parseSize(file.size);
  $('chunkcount-label').textContent = `${Math.ceil(file.size / chunkSize)} CHUNKS`;
  startBtn.toggleAttribute('disabled', false);
}