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

  // === TAMBAH INPUT KELUHAN DAN PERBAIKAN ===
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

  // === HAPUS INPUT KELUHAN DAN PERBAIKAN ===
  document.getElementById("perbaikan-wrapper")?.addEventListener("click", (e) => {
    if (e.target.classList.contains("btn-hapus-input")) {
      const group = e.target.closest(".perbaikan-group");
      if (document.querySelectorAll(".perbaikan-group").length > 1) {
        group.remove();
      } else {
        showToast("Minimal 1 keluhan dan perbaikan harus ada", "error");
      }
    }
  });

  // === SUBMIT FORM ===
  if (keluhanForm) {
    keluhanForm.addEventListener("submit", async function(e) {
      e.preventDefault();
      
      const submitBtn = keluhanForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = "Menyimpan...";
      
      try {
        // Generate unique ID untuk kelompok data ini
        const batchId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
        
        // Siapkan data dasar
        const formData = {
          batch_id: batchId, // ID unik untuk kelompok data ini
          kebun: keluhanForm.kebun.value,
          divisi: keluhanForm.divisi.value,
          blok: keluhanForm.blok.value,
          pemanen: keluhanForm.pemanen.value,
          pp: keluhanForm.pp.value,
          keluhans: []
        };
  
        // Proses setiap kelompok keluhan-perbaikan
        const groups = document.querySelectorAll('.perbaikan-group');
        
        for (let i = 0; i < groups.length; i++) {
          const group = groups[i];
          const keluhanData = {
            keluhan: group.querySelector('textarea[name="keluhan"]').value,
            tanggal_keluhan: group.querySelector('input[name="tanggal"]').value,
            perbaikan: group.querySelector('textarea[name="perbaikan[]"]').value,
            tanggal_perbaikan: group.querySelector('input[name="tanggal_perbaikan[]"]').value
          };
  
          // Proses foto keluhan
          const fotoKeluhan = group.querySelector('input[name="foto_keluhan"]').files[0];
          if (fotoKeluhan) {
            keluhanData.foto_keluhan = await toBase64(fotoKeluhan);
            keluhanData.foto_keluhan_name = fotoKeluhan.name;
          }
  
          // Proses foto perbaikan
          const fotoPerbaikan = group.querySelector('input[name="foto_perbaikan[]"]').files[0];
          if (fotoPerbaikan) {
            keluhanData.foto_perbaikan = await toBase64(fotoPerbaikan);
            keluhanData.foto_perbaikan_name = fotoPerbaikan.name;
          }
  
          formData.keluhans.push(keluhanData);
        }
  
        // Kirim data ke server
        const response = await fetch("https://script.google.com/macros/s/AKfycbzpf3tKfxTKMLUH_JN5zG0OiqgVlXzY2MER40uQGCgCSptjsSsazHhdLF8FTNyTdKJlTw/exec", {
          method: "POST",
          body: JSON.stringify(formData),
          headers: {
            'Content-Type': 'text/plain'
          },
          mode: 'no-cors'
        });
  
        showToast("Data keluhan berhasil dikirim", "success");
        setTimeout(() => {
          keluhanForm.reset();
        }, 2000);
        
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
