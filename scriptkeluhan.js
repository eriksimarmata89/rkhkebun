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

  // === TAMBAH KELUHAN BARU (DENGAN PERBAIKAN OTOMATIS) ===
  document.getElementById("btn-tambah-keluhan")?.addEventListener("click", () => {
    const wrapper = document.getElementById("keluhan-wrapper");
    const keluhanCount = document.querySelectorAll('.keluhan-group').length;
    
    const newKeluhan = document.createElement('div');
    newKeluhan.className = 'keluhan-group border rounded p-3 mb-3 alert alert-primary';
    newKeluhan.innerHTML = `
      <div class="mb-3">
        <label class="form-label">Keluhan</label>
        <textarea name="keluhan[]" class="form-control" rows="3" required></textarea>
      </div>
      <div class="mb-3">
        <label class="form-label">Tanggal Keluhan</label>
        <input type="date" name="tanggal_keluhan[]" class="form-control" required>
      </div>
      <div class="mb-3">
        <label class="form-label">Foto Keluhan</label>
        <input type="file" name="foto_keluhan[]" class="form-control" accept="image/*">
      </div>
      
      <!-- Perbaikan otomatis dibuat saat keluhan ditambah -->
      <div class="perbaikan-wrapper">
        <div class="perbaikan-group border rounded p-3 mb-3 bg-light">
          <div class="mb-2">
            <label>Deskripsi Perbaikan</label>
            <textarea name="perbaikan[${keluhanCount}][]" class="form-control" rows="2" required></textarea>
          </div>
          <div class="mb-2">
            <label>Tanggal Perbaikan</label>
            <input type="date" name="tanggal_perbaikan[${keluhanCount}][]" class="form-control" required>
          </div>
          <div class="mb-2">
            <label>Foto Perbaikan</label>
            <input type="file" name="foto_perbaikan[${keluhanCount}][]" class="form-control" accept="image/*">
          </div>
          <button type="button" class="btn btn-sm btn-outline-danger btn-hapus-perbaikan">Hapus Perbaikan</button>
        </div>
      </div>
      
      <button type="button" class="btn btn-sm btn-danger btn-hapus-keluhan">Hapus Keluhan</button>
    `;
    
    wrapper.appendChild(newKeluhan);
  });

  // === HAPUS PERBAIKAN ===
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("btn-hapus-perbaikan")) {
      const perbaikanGroup = e.target.closest('.perbaikan-group');
      if (perbaikanGroup.parentElement.querySelectorAll('.perbaikan-group').length > 1) {
        perbaikanGroup.remove();
      } else {
        showToast("Minimal 1 perbaikan harus ada", "error");
      }
    }
  });

  // === HAPUS KELUHAN ===
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("btn-hapus-keluhan")) {
      const keluhanGroup = e.target.closest('.keluhan-group');
      if (document.querySelectorAll('.keluhan-group').length > 1) {
        keluhanGroup.remove();
      } else {
        showToast("Minimal 1 keluhan harus ada", "error");
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
        const baseData = {
          kebun: keluhanForm.kebun.value,
          divisi: keluhanForm.divisi.value,
          blok: keluhanForm.blok.value,
          pemanen: keluhanForm.pemanen.value,
          pp: keluhanForm.pp.value
        };

        const allData = [];
        const keluhanGroups = document.querySelectorAll('.keluhan-group');

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

          const perbaikanGroups = group.querySelectorAll('.perbaikan-group');
          for (let j = 0; j < perbaikanGroups.length; j++) {
            const perbaikanGroup = perbaikanGroups[j];
            keluhanData.perbaikan.push(perbaikanGroup.querySelector(`textarea[name="perbaikan[${i}][]"]`).value);
            keluhanData.tanggal_perbaikan.push(perbaikanGroup.querySelector(`input[name="tanggal_perbaikan[${i}][]"]`).value);
            
            const fotoFile = perbaikanGroup.querySelector(`input[name="foto_perbaikan[${i}][]"]`).files[0];
            keluhanData.foto_perbaikan.push(fotoFile ? await toBase64(fotoFile) : null);
            keluhanData.foto_perbaikan_names.push(fotoFile?.name || '');
          }

          allData.push(keluhanData);
        }

        // Kirim data ke server
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
          // Reset ke 1 keluhan dengan 1 perbaikan
          document.getElementById("keluhan-wrapper").innerHTML = `
            <div class="keluhan-group border rounded p-3 mb-3 alert alert-primary">
              <div class="mb-3">
                <label class="form-label">Keluhan</label>
                <textarea name="keluhan[]" class="form-control" rows="3" required></textarea>
              </div>
              <div class="mb-3">
                <label class="form-label">Tanggal Keluhan</label>
                <input type="date" name="tanggal_keluhan[]" class="form-control" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Foto Keluhan</label>
                <input type="file" name="foto_keluhan[]" class="form-control" accept="image/*">
              </div>
              
              <div class="perbaikan-wrapper">
                <div class="perbaikan-group border rounded p-3 mb-3 bg-light">
                  <div class="mb-2">
                    <label>Deskripsi Perbaikan</label>
                    <textarea name="perbaikan[0][]" class="form-control" rows="2" required></textarea>
                  </div>
                  <div class="mb-2">
                    <label>Tanggal Perbaikan</label>
                    <input type="date" name="tanggal_perbaikan[0][]" class="form-control" required>
                  </div>
                  <div class="mb-2">
                    <label>Foto Perbaikan</label>
                    <input type="file" name="foto_perbaikan[0][]" class="form-control" accept="image/*">
                  </div>
                  <button type="button" class="btn btn-sm btn-outline-danger btn-hapus-perbaikan">Hapus Perbaikan</button>
                </div>
              </div>
              
              <button type="button" class="btn btn-sm btn-danger btn-hapus-keluhan">Hapus Keluhan</button>
            </div>
          `;
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

  // Fungsi toBase64 tetap sama
  function toBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = error => reject(error);
    });
  }
  
});
