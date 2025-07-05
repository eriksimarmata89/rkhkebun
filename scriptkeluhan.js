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
  
  // Helper function to convert Google Drive URL to direct image URL
  function convertToDirectImageUrl(url) {
    if (!url) return null;
    if (url.includes('uc?export=view')) return url;
  
    const match = url.match(/\/file\/d\/([^\/]+)\//) ||
                  url.match(/id=([^&]+)/) ||
                  url.match(/\/d\/([^\/?]+)/);
  
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    }
  
    return url;
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

  // === SUBMIT FORM ===
  if (keluhanForm) {
    keluhanForm.addEventListener("submit", async function(e) {
      e.preventDefault();
      
      const submitBtn = keluhanForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = "Menyimpan...";
      
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
          status: document.getElementById('status').value,
          keluhans: []
        };
  
        // Process each complaint group
        const groups = document.querySelectorAll('.perbaikan-group');
        
        for (let i = 0; i < groups.length; i++) {
          const group = groups[i];
          const keluhanData = {
            keluhan: group.querySelector('textarea[name="keluhan"]').value,
            tanggal_keluhan: group.querySelector('input[name="tanggal"]').value,
            perbaikan: group.querySelector('textarea[name="perbaikan[]"]').value || null,
            tanggal_perbaikan: group.querySelector('input[name="tanggal_perbaikan[]"]').value || null
          };
  
          // Process complaint photo
          const fotoKeluhan = group.querySelector('input[name="foto_keluhan"]').files[0];
          if (fotoKeluhan) {
            keluhanData.foto_keluhan = await toBase64(fotoKeluhan);
            keluhanData.foto_keluhan_name = fotoKeluhan.name;
          }
  
          // Process repair photo (if exists)
          const fotoPerbaikan = group.querySelector('input[name="foto_perbaikan[]"]').files[0];
          if (fotoPerbaikan) {
            keluhanData.foto_perbaikan = await toBase64(fotoPerbaikan);
            keluhanData.foto_perbaikan_name = fotoPerbaikan.name;
          }
  
          formData.keluhans.push(keluhanData);
        }
  
        // Send data to server
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
      const bulan = bulanInput.value;
      const mulai = tanggalMulaiInput.value;
      const akhir = tanggalAkhirInput.value;

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
            const tanggal = new Date(item.tanggal);
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

            tbody.innerHTML += `
              <tr>
                <td class="text-center">${tanggalFormatted}</td>
                <td class="text-center">${item.kebun || "-"}</td>
                <td class="text-center">${item.divisi || "-"}</td>
                <td class="text-center">${item.blok || "-"}</td>
                <td>${keluhanShort}</td>
                <td class="text-center">
                  <span class="badge badge-status ${statusClass}">${statusText}</span>
                </td>
                <td class="text-center">
                  <button class="btn btn-sm btn-info btn-action btn-lihat" data-index="${index}">Lihat</button>
                  <button class="btn btn-sm btn-warning btn-action btn-edit" data-index="${index}">Edit</button>
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
              
              // Format date
              const tanggal = new Date(item.tanggal);
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
              fotoKeluhanContainer.innerHTML = "";
              
              if (item.foto_keluhan) {
                const directUrl = convertToDirectImageUrl(item.foto_keluhan);
                const img = document.createElement("img");
                img.src = directUrl;
                img.alt = "Foto Keluhan";
                img.classList.add("img-fluid", "mb-2", "border");
                img.style.maxHeight = "300px";
                fotoKeluhanContainer.appendChild(img);
              } else {
                fotoKeluhanContainer.textContent = "Tidak ada foto";
              }
              
              // Set repair photo with improved handling
              const fotoPerbaikanContainer = document.getElementById("detail-foto-perbaikan");
              fotoPerbaikanContainer.innerHTML = "";
              
              if (item.foto_perbaikan) {
                const img = document.createElement("img");
                const directUrl = convertToDirectImageUrl(item.foto_perbaikan);
                console.log("Direct URL Keluhan:", directUrl);
                img.src = directUrl;
                img.alt = "Foto Perbaikan";
                img.style.maxWidth = "100%";
                img.style.maxHeight = "300px";
                img.style.objectFit = "contain";
                img.onerror = () => {
                  fotoPerbaikanContainer.innerHTML = `
                    <div class="alert alert-warning">
                      Gagal memuat foto perbaikan. 
                      <a href="${item.foto_perbaikan}" target="_blank" class="alert-link">
                        Coba buka di tab baru
                      </a>
                    </div>`;
                };
                fotoPerbaikanContainer.appendChild(img);
              } else {
                fotoPerbaikanContainer.textContent = "Tidak ada foto";
              }
              
              // Show modal
              if (detailModal) {
                detailModal.show();
              } else {
                console.error("Modal not initialized");
              }
            });
          });

          // Edit button event
          document.querySelectorAll(".btn-edit").forEach(button => {
            button.addEventListener("click", () => {
              const index = button.getAttribute("data-index");
              const item = data[index];
              showToast("Fitur edit akan segera tersedia", "info");
            });
          });

          // Delete button event
          document.querySelectorAll(".btn-hapus").forEach(button => {
            button.addEventListener("click", () => {
              const index = button.getAttribute("data-index");
              
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
