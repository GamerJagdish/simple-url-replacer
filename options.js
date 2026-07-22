const elements = {
  fromInput: document.getElementById("fromInput"),
  toInput: document.getElementById("toInput"),
  regexFromInput: document.getElementById("regexFromInput"),
  regexToInput: document.getElementById("regexToInput"),
  regexTestInput: document.getElementById("regexTestInput"),
  regexTestResult: document.getElementById("regexTestResult"),
  addBtn: document.getElementById("addBtn"),
  ruleList: document.getElementById("ruleList"),
  emptyMsg: document.getElementById("emptyMsg"),
  advancedToggle: document.getElementById("advancedToggle"),
  simpleInputs: document.getElementById("simpleInputs"),
  advancedInputs: document.getElementById("advancedInputs"),
  toast: document.getElementById("toast"),
  undoBtn: document.getElementById("undoBtn"),
  cancelEditBtn: document.getElementById("cancelEditBtn"),
  exportBtn: document.getElementById("exportBtn"),
  importBtn: document.getElementById("importBtn"),
  importFile: document.getElementById("importFile")
};

function loadRules() {
  chrome.storage.sync.get(["rules"], (data) => {
    const rules = Array.isArray(data.rules) ? data.rules : [];
    renderRuleList(rules, elements, loadRules);
  });
}

if (elements.exportBtn) {
  elements.exportBtn.addEventListener("click", () => {
    chrome.storage.sync.get(["rules"], (data) => {
      const rules = Array.isArray(data.rules) ? data.rules : [];
      const blob = new Blob([JSON.stringify(rules, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "redirect_rules.json";
      a.click();
      URL.revokeObjectURL(url);
    });
  });
}

if (elements.importBtn && elements.importFile) {
  elements.importBtn.addEventListener("click", () => elements.importFile.click());
  elements.importFile.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const newRules = JSON.parse(event.target.result);
        if (Array.isArray(newRules)) {
          saveRules(newRules, loadRules);
          if (elements.toast) {
            elements.toast.style.display = "flex";
            const toastMsg = document.getElementById("toastMsg");
            if (toastMsg) toastMsg.textContent = "Rules imported successfully.";
            if (elements.undoBtn) elements.undoBtn.style.display = "none";
            setTimeout(() => {
              hideToast(elements.toast);
              if (elements.undoBtn) elements.undoBtn.style.display = "block";
              if (toastMsg) toastMsg.textContent = "Rule deleted.";
            }, 3000);
          }
        } else {
          alert("Invalid rules format");
        }
      } catch (err) {
        alert("Invalid JSON file");
      }
      elements.importFile.value = "";
    };
    reader.readAsText(file);
  });
}

if (elements.cancelEditBtn) {
  elements.cancelEditBtn.addEventListener("click", () => resetEditMode(elements));
}

if (elements.advancedToggle) {
  elements.advancedToggle.addEventListener("change", () => {
    elements.simpleInputs.style.display = elements.advancedToggle.checked ? "none" : "grid";
    elements.advancedInputs.style.display = elements.advancedToggle.checked ? "grid" : "none";
  });
}

if (elements.addBtn) {
  elements.addBtn.addEventListener("click", () => addRuleFromInputs(elements, loadRules));
}

if (elements.regexFromInput) elements.regexFromInput.addEventListener("input", () => validateRegexInputs(elements));
if (elements.regexToInput) elements.regexToInput.addEventListener("input", () => validateRegexInputs(elements));
if (elements.regexTestInput) elements.regexTestInput.addEventListener("input", () => validateRegexInputs(elements));

[elements.fromInput, elements.toInput, elements.regexFromInput, elements.regexToInput].forEach((input) => {
  if (input) {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") addRuleFromInputs(elements, loadRules);
    });
  }
});

setupUndoButton(elements, loadRules);

document.addEventListener("DOMContentLoaded", loadRules);
chrome.storage.onChanged.addListener(loadRules);
