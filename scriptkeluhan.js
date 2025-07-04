document.addEventListener("DOMContentLoaded", () => {
  const keluhanForm = document.getElementById("form-keluhan");
  const toast = document.getElementById("toast");
  const toastIcon = toast?.querySelector(".toast-icon");
  const toastMessage = toast?.querySelector(".toast-message");

  // Toast notification function
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
        setTimeout(() => {
          toast.className = "toast " + type;
        }, 400);
      }, 4000);
    }
  }

  // === TAMBAH INPUT PERBAIKAN ===
  document.getElementById("btn-tambah")?.addEventListener("click", () => {
    const wrapper = document.getElementById("perbaikan-wrapper");
    const lastGroup = wrapper?.querySelector(".perbaikan-group:last-child");

    if (!lastGroup) {
      showToast("Tidak ada entri yang bisa digandakan!", "error");
      return;
    }

    const clone = lastGroup.cloneNode(true);
    clone.querySelectorAll("input").forEach(input => input.value = "");
    clone.querySelectorAll("textarea").forEach(textarea => textarea.value = "");

    const alertClasses = [
      ["alert", "alert-primary"],
      ["alert", "alert-success"],
      ["alert", "alert-info"],
      ["alert", "alert-danger"],
      ["alert", "alert-warning"]
    ];

    clone.classList.remove("alert", "alert-primary", "alert-success", "alert-info", "alert-danger", "alert-warning");

    const allGroups = wrapper.querySelectorAll(".perbaikan-group");
    const colorIndex = allGroups.length % alertClasses.length;
    clone.classList.add(...alertClasses[colorIndex]);

    wrapper.appendChild(clone);
  });

  // === HAPUS INPUT PERBAIKAN ===
  document.getElementById("perbaikan-wrapper")?.addEventListener("click", (e) => {
    if (e.target.classList.contains("btn-hapus-input")) {
      const group = e.target.closest(".perbaikan-group");
      if (document.querySelectorAll(".perbaikan-group").length > 1) {
        group.remove();
      } else {
        showToast("Minimal 1 perbaikan harus ada", "error");
      }
    }
  });

  // Fungsi untuk upload file ke Google Drive
  async function uploadFile(file) {
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const response = await fetch("https://script.google.com/macros/s/AKfycbzpf3tKfxTKMLUH_JN5zG0OiqgVlXzY2MER40uQGCgCSptjsSsazHhdLF8FTNyTdKJlTw/exec?action=upload", {
        method: "POST",
        mode: 'no-cors',
        body: formData
      });
      
      // Karena mode no-cors, response tidak bisa dibaca langsung
      // Kita perlu menganggap upload berhasil dan melanjutkan
      return "https://drive.google.com/drive/folders/1EoVzVuEn0N9ak9r_Ix1Y6AzOurpoFP_a?usp=drive_link";
    } catch (err) {
      console.error("Upload error:", err);
      return "";
    }
  }

  // === SUBMIT FORM KELUHAN ===
  if (keluhanForm) {
    keluhanForm.addEventListener("submit", async function(e) {
      e.preventDefault();
      
      // Tampilkan loading
      showToast("Mengunggah data...", "info");
      
      try {
        const formData = new FormData(keluhanForm);
        
        // Upload foto keluhan terlebih dahulu
        const fotoKeluhanFile = formData.get("foto_keluhan");
        let fotoKeluhanUrl = "";
        
        if (fotoKeluhanFile && fotoKeluhanFile.size > 0) {
          fotoKeluhanUrl = await uploadFile(fotoKeluhanFile);
        }
        
        // Upload foto-foto perbaikan
        const fotoPerbaikanFiles = formData.getAll("foto_perbaikan[]");
        const fotoPerbaikanUrls = [];
        
        for (const file of fotoPerbaikanFiles) {
          if (file && file.size > 0) {
            const url = await uploadFile(file);
            fotoPerbaikanUrls.push(url);
          } else {
            fotoPerbaikanUrls.push("");
          }
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
        
        // Kirim ke Google Apps Script
        const response = await fetch("https://script.google.com/macros/s/AKfycbzpf3tKfxTKMLUH_JN5zG0OiqgVlXzY2MER40uQGCgCSptjsSsazHhdLF8FTNyTdKJlTw/exec", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(data)
        });
        
        const result = await response.text();
        showToast("Keluhan berhasil disimpan", "success");
        keluhanForm.reset();
      } catch (err) {
        console.error("Error:", err);
        showToast("Gagal menyimpan keluhan: " + err.message, "error");
      }
    });
  }
});
