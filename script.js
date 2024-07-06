document.addEventListener("DOMContentLoaded", function () {
  const generateBtn = document.getElementById("generate-btn");
  const printBtn = document.getElementById("print-btn");
  const saveBtn = document.getElementById("save-btn");
  const qrCodeDiv = document.getElementById("qr-code");
  const itemNameDiv = document.getElementById("item-name");
  const excelFileInput = document.getElementById("excel-file");
  const openCameraBtn = document.getElementById("open-camera-btn");
  const closeCameraBtn = document.getElementById("close-camera-btn");
  const cameraContainer = document.getElementById('camera-container');
  let workbook; // Declare workbook variable outside
  let html5QrCode;

  generateBtn.addEventListener("click", generateQRCode);
  printBtn.addEventListener("click", printQRCode);
  saveBtn.addEventListener("click", saveQRCode);
  openCameraBtn.addEventListener('click', openCamera);
  closeCameraBtn.addEventListener('click', closeCamera);

  // Initialize HTML5 QR Code Scanner
  html5QrCode = new Html5Qrcode("reader");

  function openCamera() {
    cameraContainer.style.display = 'block'; // Show the camera container
    html5QrCode.start(
      { facingMode: "environment" }, // Use rear camera
      {
        fps: 30, // Optional, frames per second for qr code scanning
        qrbox: { width: 250, height: 250 }, // Optional, if you want bounded box UI
        aspectRatio: 0.9, // Optional, adjust aspect ratio for better detection
        delay: 150, // Optional, delay in milliseconds between each scan attempt
        disableFlip: false // Optional, disable flipping of the video feed
      },
      qrCodeMessage => {
        alert('Scanned: ' + qrCodeMessage);
        // Here you can handle the scanned content, such as generating a QR code or barcode
        html5QrCode.stop().then(ignore => {
          cameraContainer.style.display = 'none'; // Hide the camera container
        }).catch(err => {
          console.error('Failed to stop camera:', err);
        });
      },
      errorMessage => {
        console.warn(`QR Code no longer in front of camera.`);
      }
    ).catch(err => {
      console.error('Unable to start scanning:', err);
    });
  }

  function closeCamera() {
    html5QrCode.stop().then(ignore => {
      cameraContainer.style.display = 'none'; // Hide the camera container
    }).catch(err => {
      console.error('Failed to stop camera:', err);
    });
  }

  function generateQRCode() {
    const file = excelFileInput.files[0];
    if (!file) {
      alert("Please select an Excel file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      const data = new Uint8Array(e.target.result);
      workbook = XLSX.read(data, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Clear previous QR code and item name
      qrCodeDiv.innerHTML = "";
      itemNameDiv.textContent = "";

      // Prepare HTML content for displaying QR codes vertically
      let qrCodesHTML = "";

      // Loop through each row (starting from A2) to generate QR codes
      for (let i = 1; i < jsonData.length; i++) {
        const itemName = jsonData[i][0];
        const dataValue = jsonData[i][3]; // Assuming data is in column D

        if (!itemName || !dataValue) {
          continue; // Skip rows with missing data
        }

        const qrCodeImageSrc = `https://quickchart.io/qr?text=${encodeURIComponent(dataValue)}`;

        qrCodesHTML += `
          <div class="qr-code-container">
            <div class="qr-code">
              <img src="${qrCodeImageSrc}" alt="QR Code">
            </div>
            <div class="item-name">${itemName}</div>
          </div>
        `;
      }

      // Display generated QR codes vertically
      qrCodeDiv.innerHTML = qrCodesHTML;

      // Open a new window/tab to display QR codes vertically
      const qrWindow = window.open("", "_blank");
      qrWindow.document.write(`
        <html>
        <head>
          <title>Generated QR Codes</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .qr-code-container { margin-bottom: 20px; }
            .qr-code { width: 150px; height: 150px; margin: 0 auto; }
            .item-name { text-align: center; margin-top: -10px; font-size: 10px; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1 style="text-align: center;"></h1>
          <div class="qr-codes-container">
            ${qrCodesHTML}
          </div>
        </body>
        </html>
      `);
      qrWindow.document.close();
    };
    reader.readAsArrayBuffer(file);
  }

  function printQRCode() {
    // Not needed for vertical display, can be implemented if required
  }

  function saveQRCode() {
    // Not needed for vertical display, can be implemented if required
  }
});
