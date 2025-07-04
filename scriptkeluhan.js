document.addEventListener("DOMContentLoaded", () => {
  const keluhanForm = document.getElementById("form-keluhan");
  const toast = document.getElementById("toast");
  const toastIcon = toast?.querySelector(".toast-icon");
  const toastMessage = toast?.querySelector(".toast-message");

  // Fungsi toast notification
  function showToast(message, type = "success", onClick = null) {
    if (!toast) return;
    toastMessage.textContent = message;
    toastIcon.textContent = type === "success" ? "✔️" : type === "error" ? "❌" : "⚠️";
    toast.className = "toast show " + type;

    if (onClick) {
      toast.onclick = () => {
        toast.classList.remove("show");
        onClick();
        toast.onclick = null;
      };
    } else {
      setTimeout(() => {
        toast.classList.add("hide");
        setTimeout(() => toast.className = "toast " + type, 400);
      }, 4000);
    }
  }

  // Fungsi untuk menambah input perbaikan
  document.getElementById("btn-tambah")?.addEventListener("click", () => {
    const wrapper = document.getElementById("perbaikan-wrapper");
    const lastGroup = wrapper?.querySelector(".perbaikan-group:last-child");
    
    if (!lastGroup) {
      showToast("Tidak ada entri yang bisa digandakan!", "error");
      return;
    }

    const clone = lastGroup.cloneNode(true);
    clone.querySelectorAll("input, textarea").forEach(el => el.value = "");

    const colors = ["alert-primary", "alert-success", "alert-info", "alert-danger", "alert-warning"];
    const colorIndex = wrapper.querySelectorAll(".perbaikan-group").length % colors.length;
    
    clone.classList.remove(...clone.classList);
    clone.classList.add("perbaikan-group", "border", "rounded", "p-3", "mb-3", "alert", colors[colorIndex]);

    wrapper.appendChild(clone);
  });

  // Fungsi untuk menghapus input perbaikan
  document.getElementById("perbaikan-wrapper")?.addEventListener("click", (e) => {
    if (e.target.classList.contains("btn-hapus-input")) {
      const groups = document.querySelectorAll(".perbaikan-group");
      if (groups.length > 1) {
        e.target.closest(".perbaikan-group").remove();
      } else {
        showToast("Minimal 1 perbaikan harus ada", "error");
      }
    }
  });

  // Fungsi untuk upload file ke Google Drive
  async function uploadFile(file) {
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch("https://script.google.com/macros/s/AKfycbzpf3tKfxTKMLUH_JN5zG0OiqgVlXzY2MER40uQGCgCSptjsSsazHhdLF8FTNyTdKJlTw/exec?action=upload", {
        method: "POST",
        mode: 'no-cors',
        body: formData
      });
      
      // Karena mode no-cors, kita tidak bisa membaca response
      // Return URL default
      return "https://drive.google.com/drive/folders/1EoVzVuEn0N9ak9r_Ix1Y6AzOurpoFP_a?usp=drive_link";
    } catch (err) {
      console.error("Upload error:", err);
      return "";
    }
  }

  // Fungsi untuk submit form keluhan
  if (keluhanForm) {
    keluhanForm.addEventListener("submit", async function(e) {
      e.preventDefault();
      showToast("Mengunggah data...", "info");
      
      try {
        const formData = new FormData(keluhanForm);
        
        // Upload foto keluhan
        const fotoKeluhanFile = formData.get("foto_keluhan");
        let fotoKeluhanUrl = fotoKeluhanFile && fotoKeluhanFile.size > 0 
          ? await uploadFile(fotoKeluhanFile) 
          : "";
        
        // Upload foto perbaikan
        const fotoPerbaikanUrls = [];
        const fotoPerbaikanFiles = formData.getAll("foto_perbaikan[]");
        
        for (const file of fotoPerbaikanFiles) {
          fotoPerbaikanUrls.push(file && file.size > 0 ? await uploadFile(file) : "");
        }
        
        // Siapkan data untuk dikirim
        const data = {
          kebun: formData.get("kebun"),
          divisi: formData.get("divisi"),
          blok: formData.get("blok"),
          pemanen: formData.get("pemanen"),
          pp: formData.get("pp"),
          tanggal: formData.get("tanggal"),
          keluhan: formData.get("keluhan"),
          foto_keluhan: fotoKeluhanUrl,
          perbaikan: formData.getAll("perbaikan[]"),
          tanggal_perbaikan: formData.getAll("tanggal_perbaikan[]"),
          foto_perbaikan: fotoPerbaikanUrls
        };
        
        // Kirim data ke Google Apps Script
        const response = await fetch("https://script.google.com/macros/s/AKfycbzpf3tKfxTKMLUH_JN5zG0OiqgVlXzY2MER40uQGCgCSptjsSsazHhdLF8FTNyTdKJlTw/exec", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });
        
        const result = await response.json();
        if (result.success) {
          showToast("Keluhan berhasil disimpan", "success");
          keluhanForm.reset();
        } else {
          showToast(result.message || "Gagal menyimpan keluhan", "error");
        }
      } catch (err) {
        console.error("Error:", err);
        showToast("Gagal menyimpan keluhan: " + err.message, "error");
      }
    });
  }
});
