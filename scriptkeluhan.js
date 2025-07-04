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

  // Ganti bagian submit form dengan ini:
  if (keluhanForm) {
    keluhanForm.addEventListener("submit", async function(e) {
      e.preventDefault();
      
      const submitBtn = keluhanForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = "Menyimpan...";
      
      try {
        // Ambil data dasar
        const baseData = {
          kebun: keluhanForm.kebun.value,
          divisi: keluhanForm.divisi.value,
          blok: keluhanForm.blok.value,
          pemanen: keluhanForm.pemanen.value,
          pp: keluhanForm.pp.value
        };
  
        // Proses setiap keluhan
        const keluhanGroups = document.querySelectorAll('.keluhan-group');
        const allData = [];
  
        for (let i = 0; i < keluhanGroups.length; i++) {
          const group = keluhanGroups[i];
          const keluhanData = {
            ...baseData,
            keluhan: group.querySelector('textarea[name="keluhan[]"]').value,
            tanggal_keluhan: group.querySelector('input[name="tanggal_keluhan[]"]').value,
            foto_keluhan: group.querySelector('input[name="foto_keluhan[]"]').files[0] 
              ? await toBase64(group.querySelector('input[name="foto_keluhan[]"]').files[0]) 
              : null,
            foto_keluhan_name: group.querySelector('input[name="foto_keluhan[]"]').files[0]?.name || '',
            perbaikan: [],
            tanggal_perbaikan: [],
            foto_perbaikan: [],
            foto_perbaikan_names: []
          };
  
          // Proses perbaikan untuk keluhan ini
          const perbaikanGroups = group.querySelectorAll('.perbaikan-group');
          for (let j = 0; j < perbaikanGroups.length; j++) {
            const perbaikanGroup = perbaikanGroups[j];
            keluhanData.perbaikan.push(perbaikanGroup.querySelector('textarea[name="perbaikan[0][]"]').value);
            keluhanData.tanggal_perbaikan.push(perbaikanGroup.querySelector('input[name="tanggal_perbaikan[0][]"]').value);
            
            const fotoFile = perbaikanGroup.querySelector('input[name="foto_perbaikan[0][]"]').files[0];
            keluhanData.foto_perbaikan.push(fotoFile ? await toBase64(fotoFile) : null);
            keluhanData.foto_perbaikan_names.push(fotoFile?.name || '');
          }
  
          allData.push(keluhanData);
        }
  
        // Kirim semua data
        const response = await fetch("https://script.google.com/macros/s/AKfycbzpf3tKfxTKMLUH_JN5zG0OiqgVlXzY2MER40uQGCgCSptjsSsazHhdLF8FTNyTdKJlTw/exec", {
          method: "POST",
          body: JSON.stringify(allData),
          headers: {
            'Content-Type': 'text/plain'
          },
          mode: 'no-cors'
        });
  
        showToast("Keluhan berhasil dikirim", "success");
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
