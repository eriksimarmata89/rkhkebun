document.addEventListener("DOMContentLoaded", () => {
  // Initialize modal with safety checks
  let detailModal = null;
  
  try {
    const modalElement = document.getElementById('detailModal');
    if (modalElement) {
      // Check if Bootstrap is available
      if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        detailModal = new bootstrap.Modal(modalElement);
      } else {
        console.warn("Bootstrap is not loaded. Using fallback modal.");
        // Simple fallback modal implementation
        modalElement.style.display = 'none';
        const closeBtn = modalElement.querySelector('.btn-close');
        if (closeBtn) {
          closeBtn.addEventListener('click', () => {
            modalElement.style.display = 'none';
          });
        }
        detailModal = {
          show: () => modalElement.style.display = 'block',
          hide: () => modalElement.style.display = 'none'
        };
      }
    }
  } catch (e) {
    console.error("Failed to initialize modal:", e);
  }

  const keluhanForm = document.getElementById("form-keluhan");
  const toast = document.getElementById("toast");
  const toastIcon = toast?.querySelector(".toast-icon");
  const toastMessage = toast?.querySelector(".toast-message");
  const progressWrapper = document.getElementById("progress-wrapper");
  const progressBar = document.getElementById("progress-bar");

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
  
    // Validasi foto keluhan di grup terakhir sebelum menambah baru
    const fotoKeluhan = lastGroup.querySelector('input[name="foto_keluhan"]');
    if (!fotoKeluhan.files || fotoKeluhan.files.length === 0) {
      showToast("Harap isi foto keluhan terlebih dahulu", "error");
      fotoKeluhan.classList.add('is-invalid');
      const errorDiv = document.createElement('div');
      errorDiv.className = 'invalid-feedback';
      errorDiv.textContent = 'Foto keluhan wajib diisi';
      fotoKeluhan.parentNode.appendChild(errorDiv);
      return;
    }
  
    // Lanjutkan dengan cloning jika validasi berhasil
    const clone = lastGroup.cloneNode(true);
    clone.querySelectorAll("input").forEach(input => input.value = "");
    clone.querySelectorAll("textarea").forEach(textarea => textarea.value = "");
    
    // Hapus class invalid jika ada
    clone.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
    clone.querySelectorAll('.invalid-feedback').forEach(el => el.remove());
    
    // ... (kode styling warna grup yang sudah ada)
    
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
      
      // Validasi foto keluhan di setiap grup
      const groups = document.querySelectorAll('.perbaikan-group');
      let isValid = true;
      
      groups.forEach((group, index) => {
        const fotoKeluhan = group.querySelector('input[name="foto_keluhan"]');
        if (!fotoKeluhan.files || fotoKeluhan.files.length === 0) {
          isValid = false;
          // Tambahkan class error dan pesan
          fotoKeluhan.classList.add('is-invalid');
          const errorDiv = document.createElement('div');
          errorDiv.className = 'invalid-feedback';
          errorDiv.textContent = 'Foto keluhan wajib diisi';
          fotoKeluhan.parentNode.appendChild(errorDiv);
          
          // Scroll ke grup yang error
          if (index === 0) {
            group.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      });
      
      if (!isValid) {
        showToast("Harap lengkapi semua foto keluhan", "error");
        return;
      }
      
      const submitBtn = keluhanForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = "Sedang menyimpan...";
      
      try {
        // Generate unique ID for this data batch
        const batchId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
        
        // Prepare base data
        const formData = {
          batch_id: batchId,
          kebun: keluhanForm.kebun.value,
          divisi: keluhanForm.divisi.value,
          blok: keluhanForm.blok.value,
          pemanen: keluhanForm.pemanen.value,
          pp: keluhanForm.pp.value,
          keluhans: []
        };
  
        // Process each complaint group
        for (let i = 0; i < groups.length; i++) {
          const group = groups[i];
          const keluhanData = {
            keluhan: group.querySelector('textarea[name="keluhan"]').value,
            tanggal_keluhan: group.querySelector('input[name="tanggal"]').value,
            perbaikan: group.querySelector('textarea[name="perbaikan[]"]').value || null,
            tanggal_perbaikan: group.querySelector('input[name="tanggal_perbaikan[]"]').value || null
          };
  
          // Process complaint photo (wajib ada)
          const fotoKeluhan = group.querySelector('input[name="foto_keluhan"]').files[0];
          keluhanData.foto_keluhan = await toBase64(fotoKeluhan);
          keluhanData.foto_keluhan_name = fotoKeluhan.name;
  
          // Process repair photo (optional)
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
  
        showToast("Data berhasil dikirim", "success");
        setTimeout(() => {
          keluhanForm.reset();
        }, 2000);
        
      } catch (err) {
        showToast("Gagal menyimpan data: " + err.message, "error");
        console.error(err);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Simpan";
      }
    });
  }

  // Function to convert file to base64
  function toBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = error => reject(error);
    });
  }

  // === COMPLAINT REPORT ===
  const btnCari = document.getElementById("btn-cari");
  const bulanInput = document.getElementById("bulan");
  const tanggalMulaiInput = document.getElementById("tanggalMulai");
  const tanggalAkhirInput = document.getElementById("tanggalAkhir");
  const tbody = document.querySelector("#tabel-laporan tbody");
  
  if (btnCari && tbody) {
    btnCari.addEventListener("click", () => {
      // Panggil fungsi pengecekan kapasitas
      checkDriveSpace();
      const bulan = bulanInput.value;
      let mulai = tanggalMulaiInput.value;
      let akhir = tanggalAkhirInput.value;

      // Format tanggal ke YYYY-MM-DD jika belum
      if (mulai) {
        const dateMulai = new Date(mulai);
        mulai = dateMulai.toISOString().split('T')[0];
      }
      
      if (akhir) {
        const dateAkhir = new Date(akhir);
        akhir = dateAkhir.toISOString().split('T')[0];
      }

      let url = "";

      if (mulai && akhir && !bulan) {
        url = `https://script.google.com/macros/s/AKfycbzpf3tKfxTKMLUH_JN5zG0OiqgVlXzY2MER40uQGCgCSptjsSsazHhdLF8FTNyTdKJlTw/exec?tanggal_mulai=${mulai}&tanggal_akhir=${akhir}`;
      } else if (bulan && !mulai && !akhir) {
        url = `https://script.google.com/macros/s/AKfycbzpf3tKfxTKMLUH_JN5zG0OiqgVlXzY2MER40uQGCgCSptjsSsazHhdLF8FTNyTdKJlTw/exec?bulan=${bulan}`;
      } else if (!bulan && (!mulai || !akhir)) {
        showToast("Silakan pilih bulan atau rentang tanggal dengan lengkap", "error");
        return;
      } else {
        url = `https://script.google.com/macros/s/AKfycbzpf3tKfxTKMLUH_JN5zG0OiqgVlXzY2MER40uQGCgCSptjsSsazHhdLF8FTNyTdKJlTw/exec?tanggal_mulai=${mulai}&tanggal_akhir=${akhir}`;
      }

      progressWrapper.style.display = "block";
      progressBar.style.width = "0%";
      progressBar.textContent = "0%";
      progressBar.setAttribute("aria-valuenow", "0");

      fetch(url)
        .then(res => res.json())
        .then(data => {
          tbody.innerHTML = "";

          if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center">Tidak ada data ditemukan</td></tr>`;
            progressWrapper.style.display = "none";
            return;
          }

          data.forEach((item, index) => {
            const percent = Math.floor(((index + 1) / data.length) * 100);
            progressBar.style.width = `${percent}%`;
            progressBar.textContent = `${percent}%`;
            progressBar.setAttribute("aria-valuenow", percent);
            
            // Format date
            const tanggal = new Date(item.timestamp); // Ubah dari item.tanggal ke item.timestamp
            const tanggalFormatted = tanggal.toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric"
            });

            // Shorten complaint text if too long
            const keluhanShort = item.keluhan.length > 50 
              ? item.keluhan.substring(0, 50) + "..." 
              : item.keluhan;

            // Determine status class and text
            const statusClass = item.status === 'Open' ? 'badge-open' : 'badge-close';
            const statusText = item.status === 'Open' ? 'Open' : 'Close';

            tbody.innerHTML += 
              `<tr>
                <td class="text-center">${tanggalFormatted}</td>
                <td class="text-center">${item.kebun || "-"}</td>
                <td class="text-center">${item.divisi || "-"}</td>
                <td class="text-center">${item.blok || "-"}</td>
                <td>${keluhanShort}</td>
                <td class="text-center">
                  <span class="badge badge-status ${statusClass}">${statusText}</span>
                </td>
                <td class="text-center">
                  <button class="btn btn-sm btn-info btn-action btn-lihat" data-index="${index}">Lihat Detail</button>
                  <button class="btn btn-sm btn-warning btn-action btn-edit" data-index="${index}">Update Perbaikan</button>
                  <button class="btn btn-sm btn-danger btn-action btn-hapus" data-index="${index}">Hapus</button>
                </td>
              </tr>`;
          });

          setTimeout(() => {
            progressWrapper.style.display = "none";
          }, 400);

          // View button event
          document.querySelectorAll(".btn-lihat").forEach(button => {
            button.addEventListener("click", () => {
              const index = button.getAttribute("data-index");
              const item = data[index];
              
              // Format date menggunakan timestamp
              const tanggal = new Date(item.timestamp); // Ubah dari item.tanggal
              const tanggalFormatted = tanggal.toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric"
              });
              
              // Set data to modal
              document.getElementById("detail-tanggal").textContent = tanggalFormatted;
              document.getElementById("detail-kebun").textContent = item.kebun || "-";
              document.getElementById("detail-divisi").textContent = item.divisi || "-";
              document.getElementById("detail-blok").textContent = item.blok || "-";
              document.getElementById("detail-pemanen").textContent = item.pemanen || "-";
              document.getElementById("detail-pp").textContent = item.pp || "-";
              
              // Show status with badge
              const statusClass = item.status === 'Open' ? 'badge-open' : 'badge-close';
              const statusElement = document.getElementById("detail-status");
              statusElement.textContent = item.status || 'Open';
              statusElement.className = `badge badge-status ${statusClass}`;
              
              document.getElementById("detail-keluhan").textContent = item.keluhan || "-";
              document.getElementById("detail-perbaikan").textContent = item.perbaikan || "-";
              document.getElementById("detail-tanggal-perbaikan").textContent = 
                item.tanggal_perbaikan ? new Date(item.tanggal_perbaikan).toLocaleDateString("id-ID") : "-";
              
              // Set complaint photo
              const fotoKeluhanContainer = document.getElementById("detail-foto-keluhan");
              fotoKeluhanContainer.innerHTML = '<div class="photo-placeholder">Tidak ada foto keluhan</div>';
              
              if (item.foto_keluhan) {
                const embedUrl = convertToDriveEmbedUrl(item.foto_keluhan);
                const iframe = document.createElement("iframe");
                iframe.src = embedUrl;
                iframe.style.width = "100%";
                iframe.style.height = "100%";
                iframe.frameBorder = "0";
                iframe.allowFullscreen = true;
                fotoKeluhanContainer.innerHTML = '';
                fotoKeluhanContainer.appendChild(iframe);
              }
              
              // Set repair photo
              const fotoPerbaikanContainer = document.getElementById("detail-foto-perbaikan");
              fotoPerbaikanContainer.innerHTML = '<div class="photo-placeholder">Belum ada foto perbaikan</div>';
              
              if (item.foto_perbaikan) {
                const embedUrl = convertToDriveEmbedUrl(item.foto_perbaikan);
                const iframe = document.createElement("iframe");
                iframe.src = embedUrl;
                iframe.style.width = "100%";
                iframe.style.height = "100%";
                iframe.frameBorder = "0";
                iframe.allowFullscreen = true;
                fotoPerbaikanContainer.innerHTML = '';
                fotoPerbaikanContainer.appendChild(iframe);
              }
              
              // Show modal
              if (detailModal) {
                detailModal.show();
              } else {
                console.error("Modal not initialized");
              }
            });
          });

          function convertToDriveEmbedUrl(url) {
            if (!url) return '';
            const match = url.match(/\/file\/d\/([^\/]+)/) || url.match(/id=([^&]+)/);
            if (match && match[1]) {
              return `https://drive.google.com/file/d/${match[1]}/preview`;
            }
            return url;
          }

          // Edit button event - Ganti yang lama dengan ini
          document.querySelectorAll(".btn-edit").forEach(button => {
            button.addEventListener("click", () => {
              const index = button.getAttribute("data-index");
              const item = data[index];
              
              // Isi form edit dengan data yang ada
              document.getElementById("edit-id").value = item.timestamp;
              document.getElementById("edit-keluhan").value = item.keluhan;
              document.getElementById("edit-tanggal-keluhan").value = new Date(item.timestamp).toISOString().split('T')[0]; 
              document.getElementById("edit-perbaikan").value = item.perbaikan || "";
              document.getElementById("edit-tanggal-perbaikan").value = item.tanggal_perbaikan || "";
              
              // Tampilkan foto keluhan yang sudah ada
              const fotoKeluhanPreview = document.getElementById("edit-foto-keluhan-preview");
              fotoKeluhanPreview.innerHTML = "";
              if (item.foto_keluhan) {
                const embedUrl = convertToDriveEmbedUrl(item.foto_keluhan);
                const iframe = document.createElement("iframe");
                iframe.src = embedUrl;
                iframe.style.width = "100%";
                iframe.style.height = "400px";
                iframe.frameBorder = "0";
                iframe.allowFullscreen = true;
                fotoKeluhanPreview.appendChild(iframe);
              } else {
                fotoKeluhanPreview.textContent = "Tidak ada foto keluhan";
              }
              
              // Tampilkan modal edit
              const editModal = new bootstrap.Modal(document.getElementById('editModal'));
              editModal.show();
            });
          });
          
          // Handle submit form edit
          document.getElementById("form-edit").addEventListener("submit", async function(e) {
            e.preventDefault();
            
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = "Sedang menyimpan...";
            
            // Tambahkan flag untuk mencegah multiple submit
            if (this.isSubmitting) {
              return;
            }
            this.isSubmitting = true;
            
            try {
              const formData = new FormData(this);
              const fotoPerbaikan = document.getElementById("edit-foto-perbaikan").files[0];
              
              const dataToSend = {
                id: formData.get("id"),
                perbaikan: formData.get("perbaikan"),
                tanggal_perbaikan: formData.get("tanggal_perbaikan"),
                status: "perbaikan"
              };
              
              if (fotoPerbaikan) {
                // Validasi ukuran file (max 5MB)
                if (fotoPerbaikan.size > 5 * 1024 * 1024) {
                  throw new Error("Ukuran file terlalu besar. Maksimal 5MB");
                }
                
                dataToSend.foto_perbaikan = await toBase64(fotoPerbaikan);
                dataToSend.foto_perbaikan_name = fotoPerbaikan.name;
              }
              
              // Kirim data hanya sekali
              const response = await fetch("https://script.google.com/macros/s/AKfycbzpf3tKfxTKMLUH_JN5zG0OiqgVlXzY2MER40uQGCgCSptjsSsazHhdLF8FTNyTdKJlTw/exec", {
                method: "POST",
                body: JSON.stringify(dataToSend),
                headers: {
                  'Content-Type': 'text/plain'
                },
                mode: 'no-cors'
              });
              
              showToast("Data perbaikan berhasil disimpan", "success");
              bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
              btnCari.click();
              
            } catch (err) {
              showToast("Gagal menyimpan perbaikan: " + err.message, "error");
              console.error(err);
            } finally {
              this.isSubmitting = false;
              submitBtn.disabled = false;
              submitBtn.textContent = originalText;
            }
          });

          // Delete button event
          document.querySelectorAll(".btn-hapus").forEach(button => {
            button.addEventListener("click", () => {
              const index = button.getAttribute("data-index");
              const bulan = bulanInput.value;
              const mulai = tanggalMulaiInput.value;
              const akhir = tanggalAkhirInput.value;
              
              showToast("Tekan disini untuk konfirmasi hapus data", "confirm", () => {
                let hapusUrl = "";

                if (mulai && akhir && (!bulan || bulan === "")) {
                  hapusUrl = `https://script.google.com/macros/s/AKfycbzpf3tKfxTKMLUH_JN5zG0OiqgVlXzY2MER40uQGCgCSptjsSsazHhdLF8FTNyTdKJlTw/exec?hapus_tanggal=${mulai}&akhir=${akhir}&index=${index}`;
                } else if (bulan && (!mulai || !akhir)) {
                  hapusUrl = `https://script.google.com/macros/s/AKfycbzpf3tKfxTKMLUH_JN5zG0OiqgVlXzY2MER40uQGCgCSptjsSsazHhdLF8FTNyTdKJlTw/exec?hapus=${bulan}&index=${index}`;
                } else {
                  hapusUrl = `https://script.google.com/macros/s/AKfycbzpf3tKfxTKMLUH_JN5zG0OiqgVlXzY2MER40uQGCgCSptjsSsazHhdLF8FTNyTdKJlTw/exec?hapus_tanggal=${mulai}&akhir=${akhir}&index=${index}`;
                }

                fetch(hapusUrl)
                  .then(res => res.text())
                  .then(msg => {
                    showToast(msg, "success");
                    btnCari.click(); // Refresh data
                  })
                  .catch(err => {
                    console.error("Gagal menghapus data:", err);
                    showToast("Terjadi kesalahan saat menghapus", "error");
                  });
              });
            });
          });
        })
        .catch(err => {
          console.error("Gagal mengambil data:", err);
          showToast("Terjadi kesalahan saat mengambil data", "error");
          progressWrapper.style.display = "none";
        });
    });
  }
});

// Fungsi untuk memformat ukuran penyimpanan
function formatStorageSize(bytes) {
  const GB = 1024 * 1024 * 1024;
  const MB = 1024 * 1024;
  const KB = 1024;
  
  if (bytes >= GB) {
    return (bytes / GB).toFixed(2) + ' GB';
  } else if (bytes >= MB) {
    return (bytes / MB).toFixed(2) + ' MB';
  } else if (bytes >= KB) {
    return (bytes / KB).toFixed(2) + ' KB';
  }
  return bytes + ' bytes';
}

// Fungsi untuk mengambil info penyimpanan
async function checkDriveSpace() {
  try {
    const driveInfo = document.getElementById('drive-info');
    const driveSpace = document.getElementById('drive-space');
    
    driveInfo.style.display = 'block';
    driveSpace.textContent = 'Mengambil informasi penyimpanan...';
    
    const response = await fetch("https://script.google.com/macros/s/AKfycbzpf3tKfxTKMLUH_JN5zG0OiqgVlXzY2MER40uQGCgCSptjsSsazHhdLF8FTNyTdKJlTw/exec?getDriveUsage=1");
    const data = await response.json();
    
    if (data) {
      driveSpace.innerHTML = `
        <strong>Penyimpanan Google Drive:</strong><br>
        Total: ${data.quotaGB} GB | 
        Terpakai: ${data.usedGB} GB (${data.usedPercent}%) | 
        Sisa: ${data.remainingGB} GB
        <div class="progress mt-2" style="height: 20px;">
          <div class="progress-bar" role="progressbar" 
               style="width: ${data.usedPercent}%" 
               aria-valuenow="${data.usedPercent}" 
               aria-valuemin="0" 
               aria-valuemax="100">
            ${data.usedPercent}%
          </div>
        </div>
      `;
    } else {
      driveSpace.textContent = 'Gagal memuat informasi penyimpanan';
    }
  } catch (err) {
    console.error("Error checking drive space:", err);
    document.getElementById('drive-space').textContent = 'Error memuat informasi penyimpanan';
  }
}
