document.addEventListener("DOMContentLoaded", function () {
  const generateBtn = document.getElementById("generate-btn");
  const printBtn = document.getElementById("print-btn");
  const saveBtn = document.getElementById("save-btn");
  const qrCodeDiv = document.getElementById("qr-code");
  const itemNameDiv = document.getElementById("item-name");
  const excelFileInput = document.getElementById("excel-file");
  const openCameraBtn = document.getElementById("open-camera-btn");
  const cameraContainer = document.getElementById("camera-container");
  const percentageCalculatorBtn = document.getElementById("percentage-calculator-btn");
  const languageToggleBtn = document.getElementById("language-toggle-btn");
  const itemSelect = document.getElementById("item-select");
  let workbook;
  let html5QrCode;

  // Load language preference from localStorage
  let currentLanguage = localStorage.getItem("currentLanguage") || "en";
  toggleLanguage(currentLanguage);

  generateBtn.addEventListener("click", generateQRCode);
  printBtn.addEventListener("click", printQRCode);
  saveBtn.addEventListener("click", saveQRCode);
  openCameraBtn.addEventListener("click", openCamera);
  percentageCalculatorBtn.addEventListener("click", function () {
    window.location.href = "percentage_calculator.html";
  });
  languageToggleBtn.addEventListener("click", function () {
    currentLanguage = currentLanguage === "en" ? "ar" : "en";
    localStorage.setItem("currentLanguage", currentLanguage);
    toggleLanguage(currentLanguage);
  });

  const cameraConfig = {
    facingMode: "environment", // 'user' for front camera
    zoom: 10, // Increase zoom level
    width: 640, // Image width
    height: 480 // Image height
  };

  function openCamera() {
    // Show camera container
    cameraContainer.style.display = 'block';

    // Check if Html5Qrcode instance already exists
    if (!html5QrCode) {
        // Create new Html5Qrcode instance
        html5QrCode = new Html5Qrcode("reader");
    } else {
        // Stop previous scanning if it's active
        if (scanningActive) {
            html5QrCode.stop().then(() => {
                console.log('Previous scanning stopped successfully.');
            }).catch(err => {
                console.error('Failed to stop previous scanning:', err);
            });
        }
    }

    // Check for getUserMedia support in the browser
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('getUserMedia is not supported in this browser');
        alert('getUserMedia is not supported in this browser');
        return;
    }

    // Prepare camera configuration object
    const cameraConfig = {
        facingMode: 'environment' // Use 'environment' for rear-facing camera
    };

    // Flag to track if scanning is active
    let scanningActive = true;

    navigator.mediaDevices.getUserMedia({ video: cameraConfig })
        .then(function (stream) {
            // Start QR code scanning if scanningActive is true
            if (scanningActive) {
                html5QrCode.start(
                    cameraConfig, // Pass camera configuration object
                    {
                        fps: 120, // Increase FPS for better scanning sensitivity
                        qrbox: { width: 280, height: 280 },
                        aspectRatio: 1,
                        zoom: 5 // Increase zoom level to 1.5
                    },
                    qrCodeMessage => {
                        // Check if scanning is still active
                        if (scanningActive) {
                            navigator.vibrate(350); // Vibrate to signal QR code scan
                            alert('QR Code scanned: ' + qrCodeMessage);

                            // Stop scanning after successful scan
                            html5QrCode.stop().then(ignore => {
                                cameraContainer.style.display = 'none'; // Hide container after completion
                                scanningActive = false; // Set scanningActive to false
                            }).catch(err => {
                                console.error('Failed to stop camera:', err);
                            });
                        }
                    },
                    errorMessage => {
                        console.warn('No QR Code found in front of the camera.');
                        scanningActive = false; // Set scanningActive to false on error
                    }
                ).catch(err => {
                    console.error('Failed to start scanning:', err);
                });
            }
        })
        .catch(err => {
            console.error('Error accessing camera:', err);
            if (err.name === 'NotAllowedError') {
                alert('Permission to access the camera was denied. Please allow access to use the camera.');
            } else if (err.name === 'NotFoundError') {
                alert('No camera found. Please ensure your device has a camera.');
            } else {
                alert('Error accessing the camera: ' + err.message);
            }
        });
}



  function generateQRCode() {
    const file = excelFileInput.files[0];
    if (!file) {
      alert("Please select an Excel file.");
      return;
    }
    readExcelFile(file);
  }

  function readExcelFile(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const data = new Uint8Array(e.target.result);
      let workbook;
      try {
        workbook = XLSX.read(data, { type: "array" });
      } catch (error) {
        console.error("Error reading Excel file:", error);
        return;
      }
  
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
      // Clear previous QR code and item name
      qrCodeDiv.innerHTML = "";
      itemNameDiv.textContent = "";
  
      const selectedItem = itemSelect.value;
  
      populateDropdown(jsonData);
  
      if (selectedItem) {
        // If an item is selected, generate QR code for the selected item
        generateSingleQRCode(selectedItem, jsonData);
      } else {
        // If no item is selected, generate QR codes for all items
        generateAllQRCodes(jsonData);
      }
    };
    reader.readAsArrayBuffer(file);
  }
  
  
  function populateDropdown(jsonData) {
    itemSelect.innerHTML = "";

    const defaultOption = document.createElement("option");
    defaultOption.text = getTextByLanguage("selectItem");
    defaultOption.value = "";
    itemSelect.appendChild(defaultOption);

    for (let i = 1; i < jsonData.length; i++) {
      const itemName = jsonData[i][0];
      if (itemName) {
        const option = document.createElement("option");
        option.text = itemName;
        option.value = itemName;
        itemSelect.appendChild(option);
      }
    }
  }

  function generateSingleQRCode(selectedItem, jsonData) {
    const filteredData = jsonData.filter(row => {
        const itemName = row[0]?.toString(); // Use optional chaining to avoid error
        return itemName && itemName.includes(selectedItem);
    });

    if (filteredData.length > 0) {
        const itemName = filteredData[0][0];
        const dataValue = filteredData[0][7]; // Assuming data is in column D

        const qrCodeImageSrc = `https://quickchart.io/qr?text=${encodeURIComponent(dataValue)}`;

        const qrWindow = window.open("", "_blank");
        qrWindow.document.write(`
            <html>
            <head>
                <title>Generated QR Code</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; text-align: center; }
                    .qr-code { width: 150px; height: 150px; padding-top: 30px; margin: auto; }
                    .item-name { text-align: center; margin-top: -10px; font-size: 10px; font-weight: bold; }
                </style>
            </head>
            <body>
                
                <div class="qr-code">
                    <img src="${qrCodeImageSrc}" alt="QR Code">
                </div>
                <div class="item-name">${itemName}</div>
            </body>
            </html>
        `);
        qrWindow.document.close();
    } else {
        console.error(`Item not found: ${selectedItem}`);
        alert(`Item not found: ${selectedItem}`);
    }
}

  function generateAllQRCodes(jsonData) {
    let qrCodesHTML = "";

    for (let i = 1; i < jsonData.length; i++) {
      const itemName = jsonData[i][0];
      const dataValue = jsonData[i][7]; // Assuming data is in column D

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

    const qrWindow = window.open("", "_blank");
    qrWindow.document.write(`
      <html>
      <head>
        <title>Generated QR Codes</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .qr-code-container { margin-bottom: 20px; text-align: center; }
          .qr-code { width: 150px; height: 150px; margin: 0 auto; }
          .item-name { text-align: center; margin-top: -10px; font-size: 10px; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1 style="text-align: center;">Generated QR Codes</h1>
        <div class="qr-codes-container">
          ${qrCodesHTML}
        </div>
      </body>
      </html>
    `);
    qrWindow.document.close();
  }

  function printQRCode() {
    html2canvas(qrCodeDiv).then((canvas) => {
      const imageData = canvas.toDataURL("image/png");

      // Create a new img element for printing
      const printImg = new Image();
      printImg.src = imageData;

      // Open print window and print the image
      const printWindow = window.open();
      printWindow.document.write("<img src='" + printImg.src + "' />");
      printWindow.document.close();
      printWindow.print();
    });
  }

  function saveQRCode() {
    html2canvas(qrCodeDiv).then((canvas) => {
      const imageData = canvas.toDataURL("image/png");

      // Create a download link for the image
      const downloadLink = document.createElement("a");
      downloadLink.href = imageData;
      downloadLink.download = "QRCode.png";
      downloadLink.click();
    });
  }

  const langEn = {
    selectFileAlert: "Please select a file.",
    selectItem: "--Select an item--"
  };

  const langAr = {
    selectFileAlert: "الرجاء اختيار ملف.",
    selectItem: "--اختر عنصراً--"
  };

  function toggleLanguage(lang) {
    if (lang === "en") {
      document.getElementById("language-toggle-btn").textContent = "تبديل إلى العربية";
      generateBtn.textContent = "Generate QR Code";
      printBtn.textContent = "Print QR Code";
      saveBtn.textContent = "Save QR Code";
      openCameraBtn.textContent = "Open Camera";
      percentageCalculatorBtn.textContent = "Calculate percentage";
    } else if (lang === "ar") {
      document.getElementById("language-toggle-btn").textContent = "Switch to English";
      generateBtn.textContent = "إنشاء رمز الاستجابة السريعة";
      printBtn.textContent = "طباعة رمز الاستجابة السريعة";
      saveBtn.textContent = "حفظ رمز الاستجابة السريعة";
      openCameraBtn.textContent = "فتح الكاميرا";
      percentageCalculatorBtn.textContent = "حساب النسبة المئوية";
    }
  }

  function getTextByLanguage(textKey) {
    if (currentLanguage === "en") {
      return langEn[textKey];
    } else if (currentLanguage === "ar") {
      return langAr[textKey];
    }
  }
});
