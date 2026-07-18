const fromInput = document.getElementById("fromInput");
const toInput = document.getElementById("toInput");
const regexFromInput = document.getElementById("regexFromInput");
const regexToInput = document.getElementById("regexToInput");
const regexTestInput = document.getElementById("regexTestInput");
const regexTestResult = document.getElementById("regexTestResult");
const addBtn = document.getElementById("addBtn");
const ruleList = document.getElementById("ruleList");
const emptyMsg = document.getElementById("emptyMsg");
const advancedToggle = document.getElementById("advancedToggle");
const simpleInputs = document.getElementById("simpleInputs");
const advancedInputs = document.getElementById("advancedInputs");
const toast = document.getElementById("toast");
const undoBtn = document.getElementById("undoBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");
const importFile = document.getElementById("importFile");

if (exportBtn) {
  exportBtn.addEventListener("click", () => {
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

if (importBtn && importFile) {
  importBtn.addEventListener("click", () => importFile.click());
  importFile.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const newRules = JSON.parse(event.target.result);
        if (Array.isArray(newRules)) {
          saveRules(newRules);
          toast.style.display = "flex";
          document.getElementById("toastMsg").textContent = "Rules imported successfully.";
          undoBtn.style.display = "none";
          setTimeout(() => { hideToast(); undoBtn.style.display = "block"; document.getElementById("toastMsg").textContent = "Rule deleted."; }, 3000);
        } else {
          alert("Invalid rules format");
        }
      } catch (err) {
        alert("Invalid JSON file");
      }
      importFile.value = "";
    };
    reader.readAsText(file);
  });
}

let editingIndex = -1;
let undoTimeout = null;
let deletedRule = null;
let deletedIndex = -1;

undoBtn.addEventListener("click", () => {
  if (deletedRule) {
    chrome.storage.sync.get(["rules"], (data) => {
      const rules = Array.isArray(data.rules) ? data.rules : [];
      rules.splice(deletedIndex, 0, deletedRule);
      saveRules(rules);
      hideToast();
    });
  }
});

function showToast() {
  toast.style.display = "flex";
  clearTimeout(undoTimeout);
  undoTimeout = setTimeout(hideToast, 5000);
}

function hideToast() {
  toast.style.display = "none";
  deletedRule = null;
}

function resetEditMode() {
  editingIndex = -1;
  addBtn.textContent = "Add rule";
  cancelEditBtn.style.display = "none";
  fromInput.value = "";
  toInput.value = "";
  regexFromInput.value = "";
  regexFromInput.classList.remove("error");
  regexToInput.value = "";
  if (regexTestInput) regexTestInput.value = "";
  if (regexTestResult) {
    regexTestResult.textContent = "";
    regexTestResult.className = "test-result";
  }
}

cancelEditBtn.addEventListener("click", resetEditMode);

function cleanDomain(value) {
  return value
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/.*$/, "")
    .toLowerCase();
}

function loadRules() {
  chrome.storage.sync.get(["rules"], (data) => {
    const rules = Array.isArray(data.rules) ? data.rules : [];
    render(rules);
  });
}

function saveRules(rules) {
  chrome.storage.sync.set({ rules }, () => render(rules));
}

function render(rules) {
  ruleList.innerHTML = "";
  emptyMsg.style.display = rules.length === 0 ? "block" : "none";

  rules.forEach((rule, index) => {
    const li = document.createElement("li");
    li.className = "rule";

    const toggleWrap = document.createElement("label");
    toggleWrap.className = "mini-switch";
    const toggleInput = document.createElement("input");
    toggleInput.type = "checkbox";
    toggleInput.checked = rule.enabled !== false;
    toggleInput.addEventListener("change", () => {
      rule.enabled = toggleInput.checked;
      saveRules(rules);
    });
    const toggleSlider = document.createElement("span");
    toggleSlider.className = "mini-slider";
    toggleWrap.appendChild(toggleInput);
    toggleWrap.appendChild(toggleSlider);

    const fromTo = document.createElement("div");
    fromTo.className = "from-to";
    const fromEl = document.createElement("span");
    fromEl.className = "domain from";
    fromEl.textContent = rule.isRegex ? `Regex: ${rule.from}` : rule.from;
    fromEl.title = rule.from;
    const arrow = document.createElement("span");
    arrow.className = "arrow";
    arrow.textContent = "to";
    const toEl = document.createElement("span");
    toEl.className = "domain to";
    toEl.textContent = rule.isRegex ? `Subst: ${rule.to}` : rule.to;
    toEl.title = rule.to;
    fromTo.appendChild(fromEl);
    fromTo.appendChild(arrow);
    fromTo.appendChild(toEl);

    const editBtn = document.createElement("button");
    editBtn.className = "edit";
    editBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>';
    editBtn.title = "Edit rule";
    editBtn.addEventListener("click", () => {
      editingIndex = index;
      advancedToggle.checked = rule.isRegex;
      advancedToggle.dispatchEvent(new Event('change'));
      
      if (rule.isRegex) {
        regexFromInput.value = rule.from;
        regexToInput.value = rule.to;
      } else {
        fromInput.value = rule.from;
        toInput.value = rule.to;
      }
      addBtn.textContent = "Save edit";
      cancelEditBtn.style.display = "block";
    });

    const removeBtn = document.createElement("button");
    removeBtn.className = "remove";
    removeBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
    removeBtn.title = "Remove rule";
    removeBtn.addEventListener("click", () => {
      deletedRule = rules[index];
      deletedIndex = index;
      rules.splice(index, 1);
      saveRules(rules);
      showToast();
      
      if (editingIndex === index) {
        resetEditMode();
      } else if (editingIndex > index) {
        editingIndex--;
      }
    });

    li.appendChild(toggleWrap);
    li.appendChild(fromTo);
    li.appendChild(editBtn);
    li.appendChild(removeBtn);
    ruleList.appendChild(li);
  });
}

function addRule() {
  const isAdvanced = advancedToggle.checked;
  let from, to;

  if (isAdvanced) {
    try {
      new RegExp(regexFromInput.value);
    } catch(e) {
      return;
    }
    from = regexFromInput.value.trim();
    to = regexToInput.value.trim();
  } else {
    from = cleanDomain(fromInput.value);
    to = cleanDomain(toInput.value);
  }

  if (!from || !to) return;

  chrome.storage.sync.get(["rules"], (data) => {
    const rules = Array.isArray(data.rules) ? data.rules : [];
    
    if (editingIndex >= 0 && editingIndex < rules.length) {
      rules[editingIndex] = { from, to, enabled: rules[editingIndex].enabled, isRegex: isAdvanced };
    } else {
      rules.push({ from, to, enabled: true, isRegex: isAdvanced });
    }
    
    saveRules(rules);
    resetEditMode();
    if (!isAdvanced) {
      fromInput.focus();
    }
  });
}

advancedToggle.addEventListener("change", () => {
  simpleInputs.style.display = advancedToggle.checked ? "none" : "grid";
  advancedInputs.style.display = advancedToggle.checked ? "grid" : "none";
});

addBtn.addEventListener("click", addRule);

function validateRegex() {
  const pattern = regexFromInput.value;
  const testUrl = regexTestInput ? regexTestInput.value : "";
  let isValid = true;
  let regex = null;

  regexFromInput.classList.remove("error");
  if (regexTestResult) {
    regexTestResult.textContent = "";
    regexTestResult.className = "test-result";
  }

  if (!pattern) return;

  try {
    regex = new RegExp(pattern);
  } catch (e) {
    isValid = false;
    regexFromInput.classList.add("error");
    if (regexTestResult) {
      regexTestResult.textContent = "Invalid regular expression";
      regexTestResult.classList.add("no-match");
    }
    return;
  }

  if (testUrl && regexTestResult) {
    if (regex.test(testUrl)) {
      const toPattern = regexToInput.value;
      let replaced = "";
      try {
        replaced = testUrl.replace(regex, toPattern);
      } catch(e) {}
      regexTestResult.textContent = replaced ? `Match! -> ${replaced}` : "Match!";
      regexTestResult.classList.add("match");
    } else {
      regexTestResult.textContent = "No match";
      regexTestResult.classList.add("no-match");
    }
  }
}

regexFromInput.addEventListener("input", validateRegex);
regexToInput.addEventListener("input", validateRegex);
if (regexTestInput) {
  regexTestInput.addEventListener("input", validateRegex);
}

[fromInput, toInput, regexFromInput, regexToInput].forEach((input) => {
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addRule();
  });
});

document.addEventListener("DOMContentLoaded", loadRules);
