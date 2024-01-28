async function showSavePrompt() {
  let picker = await showSaveFilePicker().catch(() => null);
  if (!picker) return null;
  return picker;
}

