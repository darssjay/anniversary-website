// SUPABASE CONNECTION
const SUPABASE_URL = "https://tvkatciqdmivgecpfuhc.supabase.co";
const SUPABASE_KEY = "sb_publishable_dC_0EF0wSave_sISkhKC4w_sOXV_Jku";

const memoriesDB = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

// TEST DATABASE CONNECTION
async function testMemoriesConnection() {
  const { data, error } = await memoriesDB
    .from("memories")
    .select("id")
    .limit(1);

  if (error) {
    console.error("Memories connection error:", error.message);
    return;
  }

  console.log("SUCCESS! Supabase database connected.", data);
}

testMemoriesConnection();

// ADMIN AUTHENTICATION
const MEMORY_ADMIN_UID = "cb35be0c-89b6-432b-9f4e-111519b32ca1";

const adminOverlay = document.getElementById("memoryAdminOverlay");
const loginPanel = document.getElementById("memoryLoginPanel");
const uploadPanel = document.getElementById("memoryUploadPanel");
const loginForm = document.getElementById("memoryLoginForm");

const loginStatus = document.getElementById("memoryLoginStatus");

let memoryAdminActive = false;
window.memoryAdminActive = false;
let editingMemory = null;


function showMemoryLogin(message = "") {
  loginPanel.hidden = false;
  uploadPanel.hidden = true;
  loginStatus.textContent = message;
}

function showMemoryUpload() {
  loginPanel.hidden = true;
  uploadPanel.hidden = false;
}

async function checkMemoryAdmin() {
  const { data: { user }, error } = await memoriesDB.auth.getUser();

  if (error || !user || user.id !== MEMORY_ADMIN_UID) {
    showMemoryLogin();
    return false;
  }

  memoryAdminActive = true;
  window.memoryAdminActive = true;
  window.updateLightboxAdminActions?.();
  showMemoryUpload();
  document.querySelectorAll(".memory-admin-actions").forEach(el => {
    el.hidden = false;
  });
  return true;
}

// OPEN ADMIN PANEL
document.getElementById("addMemoryBtn").addEventListener("click", async () => {
  adminOverlay.hidden = false;
  showMemoryLogin("Checking admin session...");

  const isAdmin = await checkMemoryAdmin();

  if (!isAdmin) loginStatus.textContent = "Login muna para makapagdagdag ng memories. ♥";
});

// CLOSE ADMIN PANEL
document.getElementById("closeMemoryAdmin").addEventListener("click", () => {
  adminOverlay.hidden = true;
});

adminOverlay.addEventListener("click", event => {
  if (event.target === adminOverlay) {
    adminOverlay.hidden = true;
  }
});

// ADMIN LOGIN
loginForm.addEventListener("submit", async event => {
  event.preventDefault();

  const email = document.getElementById("memoryAdminEmail").value.trim();
  const password = document.getElementById("memoryAdminPassword").value;

  loginStatus.textContent = "Logging in...";

  const { data, error } = await memoriesDB.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    loginStatus.textContent = "Login failed. Check your email and password.";
    return;
  }

  if (!data.user || data.user.id !== MEMORY_ADMIN_UID) {
    await memoriesDB.auth.signOut();
    loginStatus.textContent = "This account is not authorized as admin.";
    return;
  }

  loginForm.reset();
  memoryAdminActive = true;
  window.memoryAdminActive = true;
  window.updateLightboxAdminActions?.();
  showMemoryUpload();
  document.querySelectorAll(".memory-admin-actions").forEach(el => {
    el.hidden = false;
  });
  document.getElementById("memoryUploadStatus").textContent =
    "Welcome back! You can now add memories. ♥";
});

// ADMIN LOGOUT
document.getElementById("memoryLogoutBtn").addEventListener("click", async () => {
  const { error } = await memoriesDB.auth.signOut();

  if (error) {
    document.getElementById("memoryUploadStatus").textContent =
      "Logout failed. Please try again.";
    return;
  }

  memoryAdminActive = false;
  window.memoryAdminActive = false;
  window.updateLightboxAdminActions?.();
  editingMemory = null;

  document.querySelectorAll(".memory-admin-actions").forEach(el => {
    el.hidden = true;
  });

  showMemoryLogin("You have logged out.");
});

console.log("Memory admin login is ready.");

// CREATE A MEMORY CARD
function createSavedMemoryCard(memory) {
  const gallery = document.getElementById("gallery");

  if (gallery.querySelector(`[data-memory-id="${memory.id}"]`)) return;

  const photoUrl = memoriesDB.storage
    .from("memories")
    .getPublicUrl(memory.image_url).data.publicUrl;

  const card = document.createElement("div");
  card.className = "photo reveal memory-card";
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", "Tap to reveal this memory");
  card.dataset.memoryId = memory.id;

  const inner = document.createElement("div");
  inner.className = "memory-card-inner";

  const front = document.createElement("div");
  front.className = "memory-front";

  const img = document.createElement("img");
  img.src = photoUrl;
  img.alt = memory.title;
  img.loading = "lazy";

  const caption = document.createElement("div");
  caption.className = "caption";
  caption.textContent = "♥ " + memory.title;

  front.append(img, caption);

  const back = document.createElement("div");
  back.className = "memory-back";

  const heart = document.createElement("span");
  heart.className = "memory-heart";
  heart.textContent = "♥";

  const title = document.createElement("strong");
  title.textContent = memory.title;

  const message = document.createElement("p");
  message.textContent = memory.message;

  const viewButton = document.createElement("button");
  viewButton.type = "button";
  viewButton.className = "view-memory-photo";
  viewButton.textContent = "View photo";

  const hint = document.createElement("small");
  hint.textContent = "Tap the card to flip back";

  back.append(heart, title, message, viewButton, hint);
  inner.append(front, back);
  card.append(inner);

  card._memoryRecord = memory;

  card.addEventListener("click", () => openMemoryViewer(card));
  card.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openMemoryViewer(card);
    }
  });

  gallery.appendChild(card);

  // Make dynamically added memory cards visible immediately
  requestAnimationFrame(() => {
    card.classList.add("visible");
  });
}

// LOAD SAVED MEMORIES
async function loadSavedMemories() {
  const { data, error } = await memoriesDB
    .from("memories")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Could not load memories:", error.message);
    return;
  }

  data.forEach(createSavedMemoryCard);
}

// ADD OR UPDATE A MEMORY
document.getElementById("memoryUploadForm").addEventListener("submit", async event => {
  event.preventDefault();

  if (!memoryAdminActive) return;

  const form = event.currentTarget;
  const status = document.getElementById("memoryUploadStatus");
  const title = document.getElementById("memoryTitle").value.trim();
  const date = document.getElementById("memoryDate").value || null;
  const message = document.getElementById("memoryMessage").value.trim();
  const file = document.getElementById("memoryPhoto").files[0];
  const submitButton = document.getElementById("memorySaveBtn");
  const isEditing = Boolean(editingMemory);

  if (!title || !message || (!isEditing && !file)) {
    status.textContent = "Please complete all required fields.";
    return;
  }

  if (file && !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    status.textContent = "Please use JPG, PNG, or WEBP photos only.";
    return;
  }

  if (file && file.size > 5 * 1024 * 1024) {
    status.textContent = "Maximum photo size is 5 MB.";
    return;
  }

  submitButton.disabled = true;
  status.textContent = isEditing ? "Updating your memory... ♥" : "Uploading your memory... ♥";

  let imagePath = isEditing ? editingMemory.image_url : null;
  let uploadedNewPhoto = false;

  if (file) {
    const extension = file.type === "image/jpeg" ? "jpg" :
      file.type === "image/png" ? "png" : "webp";

    const uniqueId = crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    imagePath = `${uniqueId}.${extension}`;

    const { error: uploadError } = await memoriesDB.storage
      .from("memories")
      .upload(imagePath, file, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      status.textContent = "Photo upload failed: " + uploadError.message;
      submitButton.disabled = false;
      return;
    }

    uploadedNewPhoto = true;
  }

  const memoryData = {
    title,
    memory_date: date,
    message,
    image_url: imagePath
  };

  let savedMemory;
  let saveError;

  if (isEditing) {
    const result = await memoriesDB
      .from("memories")
      .update(memoryData)
      .eq("id", editingMemory.id)
      .select()
      .single();

    savedMemory = result.data;
    saveError = result.error;
  } else {
    const result = await memoriesDB
      .from("memories")
      .insert(memoryData)
      .select()
      .single();

    savedMemory = result.data;
    saveError = result.error;
  }

  if (saveError) {
    if (uploadedNewPhoto) {
      await memoriesDB.storage.from("memories").remove([imagePath]);
    }

    status.textContent = "Could not save memory: " + saveError.message;
    submitButton.disabled = false;
    return;
  }

  if (isEditing) {
    const oldImagePath = editingMemory.image_url;

    const oldCard = document.querySelector(
      `[data-memory-id="${editingMemory.id}"]`
    );

    if (oldCard) oldCard.remove();

    createSavedMemoryCard(savedMemory);

    if (uploadedNewPhoto && oldImagePath !== imagePath) {
      const { error: cleanupError } = await memoriesDB.storage
        .from("memories")
        .remove([oldImagePath]);

      if (cleanupError) {
        console.error("Old photo cleanup failed:", cleanupError.message);
      }
    }
  } else {
    createSavedMemoryCard(savedMemory);
  }

  editingMemory = null;
  form.reset();

  document.getElementById("memoryFormHeading").textContent = "Add a memory ♥";
  document.getElementById("memoryFormDescription").textContent =
    "Upload a photo and write the story behind it.";
  document.getElementById("memoryPhoto").required = true;
  document.getElementById("memoryPhotoHint").textContent =
    "Choose a photo (required for new memories).";
  document.getElementById("memorySaveBtn").textContent = "Save memory";
  document.getElementById("memoryCancelEditBtn").hidden = true;

  status.textContent = isEditing
    ? "Memory updated successfully! ♥"
    : "Memory saved! ♥";

  showMemoryToast(
    isEditing
      ? "Memory updated successfully! ♥"
      : "Memory saved successfully! ♥"
  );

  submitButton.disabled = false;
});

// SHOW CLOUD MEMORIES TO ALL VISITORS
loadSavedMemories();

// START EDITING A SAVED MEMORY
function startMemoryEdit(memory) {
  if (!memoryAdminActive) return;

  editingMemory = memory;

  document.getElementById("memoryFormHeading").textContent = "Edit memory ♥";
  document.getElementById("memoryFormDescription").textContent =
    "Update your photo or change the story behind it.";
  document.getElementById("memoryTitle").value = memory.title;
  document.getElementById("memoryDate").value = memory.memory_date || "";
  document.getElementById("memoryMessage").value = memory.message;
  document.getElementById("memoryPhoto").required = false;
  document.getElementById("memoryPhotoHint").textContent =
    "Choose a new photo only if you want to replace the current one.";
  document.getElementById("memorySaveBtn").textContent = "Update memory";
  document.getElementById("memoryCancelEditBtn").hidden = false;

  document.getElementById("memoryUploadStatus").textContent =
    "Editing: " + memory.title;
  showMemoryToast("Editing: " + memory.title + " ♥");

  adminOverlay.hidden = false;
  showMemoryUpload();
}

// CANCEL EDITING
document.getElementById("memoryCancelEditBtn").addEventListener("click", () => {
  editingMemory = null;
  document.getElementById("memoryUploadForm").reset();
  document.getElementById("memoryFormHeading").textContent = "Add a memory ♥";
  document.getElementById("memoryFormDescription").textContent =
    "Upload a photo and write the story behind it.";
  document.getElementById("memoryPhoto").required = true;
  document.getElementById("memoryPhotoHint").textContent =
    "Choose a photo (required for new memories).";
  document.getElementById("memorySaveBtn").textContent = "Save memory";
  document.getElementById("memoryCancelEditBtn").hidden = true;
  document.getElementById("memoryUploadStatus").textContent = "";
});

// CUSTOM ROMANTIC POPUP AND NOTIFICATIONS
function showMemoryDialog({ title, message, confirmText = "Confirm", cancelText = "Cancel", icon = "♥" }) {
  return new Promise(resolve => {
    const overlay = document.getElementById("memoryDialogOverlay");
    const heading = document.getElementById("memoryDialogTitle");
    const description = document.getElementById("memoryDialogMessage");
    const iconElement = document.getElementById("memoryDialogIcon");
    const confirmButton = document.getElementById("memoryDialogConfirm");
    const cancelButton = document.getElementById("memoryDialogCancel");

    if (!overlay || !heading || !description || !confirmButton || !cancelButton) {
      resolve(window.confirm(message));
      return;
    }

    heading.textContent = title;
    description.textContent = message;
    iconElement.textContent = icon;
    confirmButton.textContent = confirmText;
    cancelButton.textContent = cancelText;
    overlay.hidden = false;

    function finish(value) {
      overlay.hidden = true;
      confirmButton.removeEventListener("click", onConfirm);
      cancelButton.removeEventListener("click", onCancel);
      overlay.removeEventListener("click", onOutside);
      document.removeEventListener("keydown", onKey);
      resolve(value);
    }

    function onConfirm() { finish(true); }
    function onCancel() { finish(false); }
    function onOutside(event) {
      if (event.target === overlay) finish(false);
    }
    function onKey(event) {
      if (event.key === "Escape") finish(false);
    }

    confirmButton.addEventListener("click", onConfirm);
    cancelButton.addEventListener("click", onCancel);
    overlay.addEventListener("click", onOutside);
    document.addEventListener("keydown", onKey);
  });
}

let memoryToastTimer;
function showMemoryToast(message) {
  const toast = document.getElementById("memoryToast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(memoryToastTimer);
  memoryToastTimer = setTimeout(() => toast.classList.remove("show"), 3200);
}

// DELETE A SAVED MEMORY SAFELY
async function deleteSavedMemory(memory, card) {
  if (!memoryAdminActive) return;

  const confirmed = await showMemoryDialog({
    title: "Delete this memory?",
    message: `Are you sure you want to remove "${memory.title}"? This special moment and its photo will be permanently deleted.`,
    confirmText: "Yes, delete",
    cancelText: "Keep memory",
    icon: "♥"
  });

  if (!confirmed) return;

  const { error: deleteError } = await memoriesDB
    .from("memories")
    .delete()
    .eq("id", memory.id);

  if (deleteError) {
    showMemoryToast("Could not delete memory. Please try again.");
    return;
  }

  const { error: storageError } = await memoriesDB.storage
    .from("memories")
    .remove([memory.image_url]);

  card.remove();

  if (storageError) {
    showMemoryToast("Memory deleted, but photo cleanup needs attention.");
    console.error(storageError);
    return;
  }

  document.getElementById("memoryUploadStatus").textContent =
    "Memory deleted successfully.";
  showMemoryToast("Memory deleted successfully. ♥");
}

// EXPOSE ADMIN FUNCTIONS TO THE LIGHTBOX
window.startMemoryEdit = startMemoryEdit;
window.deleteSavedMemory = deleteSavedMemory;
window.updateLightboxAdminActions?.();

// IMPORT EXISTING STATIC GALLERY PHOTOS TO SUPABASE
const importExistingButton = document.getElementById("importExistingMemoriesBtn");

if (importExistingButton) {
  importExistingButton.addEventListener("click", async () => {
    if (!memoryAdminActive) return;

    const status = document.getElementById("memoryUploadStatus");
    const existingCards = Array.from(
      document.querySelectorAll("#gallery .memory-card:not([data-memory-id])")
    );

    if (!existingCards.length) {
      status.textContent = "All existing photos have already been imported. ♥";
      return;
    }

    const confirmed = await showMemoryDialog({
      title: "Import your memories?",
      message: `You're about to import ${existingCards.length} existing photos. After importing, you'll be able to edit and delete them from your admin panel.`,
      confirmText: "Yes, import",
      cancelText: "Cancel",
      icon: "📷"
    });

    if (!confirmed) return;

    importExistingButton.disabled = true;
    let imported = 0;
    let failed = 0;

    for (let i = 0; i < existingCards.length; i++) {
      const card = existingCards[i];
      const img = card.querySelector(".memory-front img");
      const title = card.querySelector(".memory-back strong");
      const message = card.querySelector(".memory-back p");

      status.textContent =
        `Importing photo ${i + 1} of ${existingCards.length}... ♥`;

      try {
        if (!img || !title || !message) {
          throw new Error("Missing photo or memory details.");
        }

        const response = await fetch(img.src);
        if (!response.ok) throw new Error("Could not load original photo.");

        const blob = await response.blob();

        if (!["image/jpeg", "image/png", "image/webp"].includes(blob.type)) {
          throw new Error("Unsupported photo format: " + blob.type);
        }

        if (blob.size > 5 * 1024 * 1024) {
          throw new Error("Photo is larger than 5 MB.");
        }

        const extension = blob.type === "image/jpeg" ? "jpg" :
          blob.type === "image/png" ? "png" : "webp";

        const uniqueId = crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

        const imagePath = `legacy-${uniqueId}.${extension}`;

        const { error: uploadError } = await memoriesDB.storage
          .from("memories")
          .upload(imagePath, blob, {
            contentType: blob.type,
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: savedMemory, error: saveError } = await memoriesDB
          .from("memories")
          .insert({
            title: title.textContent.trim(),
            memory_date: null,
            message: message.textContent.trim(),
            image_url: imagePath
          })
          .select()
          .single();

        if (saveError) {
          await memoriesDB.storage.from("memories").remove([imagePath]);
          throw saveError;
        }

        createSavedMemoryCard(savedMemory);
        card.remove();
        imported++;

      } catch (error) {
        console.error("Memory import failed:", error);
        failed++;
      }
    }

    status.textContent =
      `Import finished! ${imported} imported, ${failed} failed. ♥`;

    importExistingButton.disabled = false;
  });
}

