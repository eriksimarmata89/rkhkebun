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

  // === SUBMIT FORM KELUHAN ===
  if (keluhanForm) {
    keluhanForm.addEventListener("submit", async function(e) {
      e.preventDefault();
      
      // Tampilkan loading indicator
      const submitBtn = keluhanForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = "Menyimpan...";
      
      try {
        // Konversi file ke base64
        const fotoKeluhan = document.getElementById('foto_keluhan').files[0];
        const fotoKeluhanBase64 = fotoKeluhan ? await toBase64(fotoKeluhan) : null;
        
        // Konversi semua foto perbaikan
        const fotoPerbaikanInputs = document.querySelectorAll('input[name="foto_perbaikan[]"]');
        const fotoPerbaikanPromises = Array.from(fotoPerbaikanInputs).map(input => 
          input.files[0] ? toBase64(input.files[0]) : Promise.resolve(null)
        );
        const fotoPerbaikanBase64 = await Promise.all(fotoPerbaikanPromises);
        
        // Siapkan data form
        const formData = {
          kebun: keluhanForm.kebun.value,
          divisi: keluhanForm.divisi.value,
          blok: keluhanForm.blok.value,
          pemanen: keluhanForm.pemanen.value,
          pp: keluhanForm.pp.value,
          tanggal: keluhanForm.tanggal.value,
          keluhan: keluhanForm.keluhan.value,
          foto_keluhan: fotoKeluhanBase64,
          foto_keluhan_name: fotoKeluhan?.name || '',
          perbaikan: Array.from(document.querySelectorAll('textarea[name="perbaikan[]"]')).map(el => el.value),
          tanggal_perbaikan: Array.from(document.querySelectorAll('input[name="tanggal_perbaikan[]"]')).map(el => el.value),
          foto_perbaikan: fotoPerbaikanBase64,
          foto_perbaikan_names: Array.from(fotoPerbaikanInputs).map(input => input.files[0]?.name || '')
        };
        
        // Kirim data ke server
        const response = await fetch("https://script.google.com/macros/s/AKfycbzpf3tKfxTKMLUH_JN5zG0OiqgVlXzY2MER40uQGCgCSptjsSsazHhdLF8FTNyTdKJlTw/exec", {
          method: "POST",
          body: JSON.stringify(formData),
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        const result = await response.json();
        showToast(result.message || "Keluhan berhasil disimpan", "success");
        keluhanForm.reset();
      } catch (err) {
        showToast("Gagal menyimpan keluhan: " + err.message, "error");
        console.error(err);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Simpan";
      }
    });
  }
  
  // Fungsi untuk konversi file ke base64
  function toBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = error => reject(error);
    });
  }
});
