document.addEventListener("DOMContentLoaded", function () {
  const generateBtn = document.getElementById("generate-btn");
  const printBtn = document.getElementById("print-btn");
  const saveBtn = document.getElementById("save-btn");
  const qrCodeDiv = document.getElementById("qr-code");
  const itemNameDiv = document.getElementById("item-name");
  const excelFileInput = document.getElementById("excel-file");
  let workbook; // Declare workbook variable outside
  let html5Qrcode;

  generateBtn.addEventListener("click", generateQRCode);
  printBtn.addEventListener("click", printQRCode);
  saveBtn.addEventListener("click", saveQRCode);

  // Initialize HTML5 QR Code Scanner
  html5Qrcode = new Html5Qrcode("qr-code");

  // Configure scanner options for sensitivity and speed
  const scannerConfig = { fps: 10, qrbox: 250 }; // Adjust as needed

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

        const qrCodeImageSrc = `https://quickchart.io/qr?text=${encodeURIComponent(
          dataValue
        )}`;

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
