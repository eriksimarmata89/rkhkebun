document.addEventListener("DOMContentLoaded", () => {
  // Inisialisasi modal dengan pengecekan keamanan
  let detailModal;
  try {
    const modalElement = document.getElementById('detailModal');
    if (modalElement) {
      detailModal = new bootstrap.Modal(modalElement);
    }
  } catch (e) {
    console.error("Gagal menginisialisasi modal:", e);
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
          batch_id: batchId,
          kebun: keluhanForm.kebun.value,
          divisi: keluhanForm.divisi.value,
          blok: keluhanForm.blok.value,
          pemanen: keluhanForm.pemanen.value,
          pp: keluhanForm.pp.value,
          status: document.getElementById('status').value, // 'keluhan' atau 'perbaikan'
          keluhans: []
        };
  
        // Proses setiap kelompok keluhan
        const groups = document.querySelectorAll('.perbaikan-group');
        
        for (let i = 0; i < groups.length; i++) {
          const group = groups[i];
          const keluhanData = {
            keluhan: group.querySelector('textarea[name="keluhan"]').value,
            tanggal_keluhan: group.querySelector('input[name="tanggal"]').value,
            perbaikan: group.querySelector('textarea[name="perbaikan[]"]').value || null,
            tanggal_perbaikan: group.querySelector('input[name="tanggal_perbaikan[]"]').value || null
          };
  
          // Proses foto keluhan
          const fotoKeluhan = group.querySelector('input[name="foto_keluhan"]').files[0];
          if (fotoKeluhan) {
            keluhanData.foto_keluhan = await toBase64(fotoKeluhan);
            keluhanData.foto_keluhan_name = fotoKeluhan.name;
          }
  
          // Proses foto perbaikan (jika ada)
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

  // Fungsi untuk konversi file ke base64
  function toBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = error => reject(error);
    });
  }

  // ==== LAPORAN KELUHAN ====
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
            tbody.innerHTML = `<tr><td colspan="6" class="text-center">Tidak ada data ditemukan</td></tr>`;
            progressWrapper.style.display = "none";
            return;
          }

          data.forEach((item, index) => {
            const percent = Math.floor(((index + 1) / data.length) * 100);
            progressBar.style.width = `${percent}%`;
            progressBar.textContent = `${percent}%`;
            progressBar.setAttribute("aria-valuenow", percent);
            
            // Format tanggal
            const tanggal = new Date(item.tanggal);
            const tanggalFormatted = tanggal.toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric"
            });

            // Potong teks keluhan jika terlalu panjang
            const keluhanShort = item.keluhan.length > 50 
              ? item.keluhan.substring(0, 50) + "..." 
              : item.keluhan;

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

          // Event untuk tombol Lihat
          document.querySelectorAll(".btn-lihat").forEach(button => {
            button.addEventListener("click", () => {
              const index = button.getAttribute("data-index");
              const item = data[index];
              
              // Format tanggal
              const tanggal = new Date(item.tanggal);
              const tanggalFormatted = tanggal.toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric"
              });
              
              // Set data ke modal
              document.getElementById("detail-tanggal").textContent = tanggalFormatted;
              document.getElementById("detail-kebun").textContent = item.kebun || "-";
              document.getElementById("detail-divisi").textContent = item.divisi || "-";
              document.getElementById("detail-blok").textContent = item.blok || "-";
              document.getElementById("detail-pemanen").textContent = item.pemanen || "-";
              document.getElementById("detail-pp").textContent = item.pp || "-";
              
              // Tampilkan status dengan badge
              const statusClass = item.status === 'Open' ? 'badge-open' : 'badge-close';
              const statusElement = document.getElementById("detail-status");
              statusElement.textContent = item.status;
              statusElement.className = `badge badge-status ${statusClass}`;
              
              document.getElementById("detail-keluhan").textContent = item.keluhan || "-";
              document.getElementById("detail-perbaikan").textContent = item.perbaikan || "-";
              document.getElementById("detail-tanggal-perbaikan").textContent = 
                item.tanggal_perbaikan ? new Date(item.tanggal_perbaikan).toLocaleDateString("id-ID") : "-";
              
              // Set foto keluhan
              const fotoKeluhanContainer = document.getElementById("detail-foto-keluhan");
              fotoKeluhanContainer.innerHTML = "";
              if (item.foto_keluhan) {
                const img = document.createElement("img");
                img.src = item.foto_keluhan;
                img.alt = "Foto Keluhan";
                img.style.maxWidth = "100%";
                img.style.maxHeight = "300px";
                fotoKeluhanContainer.appendChild(img);
              } else {
                fotoKeluhanContainer.textContent = "Tidak ada foto";
              }
              
              // Set foto perbaikan
              const fotoPerbaikanContainer = document.getElementById("detail-foto-perbaikan");
              fotoPerbaikanContainer.innerHTML = "";
              if (item.foto_perbaikan) {
                const img = document.createElement("img");
                img.src = item.foto_perbaikan;
                img.alt = "Foto Perbaikan";
                img.style.maxWidth = "100%";
                img.style.maxHeight = "300px";
                fotoPerbaikanContainer.appendChild(img);
              } else {
                fotoPerbaikanContainer.textContent = "Tidak ada foto";
              }
              
              // Tampilkan modal
              detailModal.show();
            });
          });

          // Event untuk tombol Edit
          document.querySelectorAll(".btn-edit").forEach(button => {
            button.addEventListener("click", () => {
              const index = button.getAttribute("data-index");
              const item = data[index];
              showToast("Fitur edit akan segera tersedia", "info");
              // Implementasi edit bisa ditambahkan di sini
            });
          });

          // Event untuk tombol Hapus
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
