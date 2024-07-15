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
    cameraContainer.style.display = "block"; // Show the camera container

    // Initialize HTML5 QR Code Scanner
    html5QrCode = new Html5Qrcode("reader");

    html5QrCode
      .start(
        { facingMode: "environment" }, // Use rear camera
        {
          fps: 120, // Optional, frames per second for qr code scanning
          qrbox: { width: 250, height: 250 }, // Optional, if you want bounded box UI
          aspectRatio: 1 // Set aspect ratio to 1 for zoom effect (width equals height)
        },
        (qrCodeMessage) => {
          navigator.vibrate(350); // Vibrate for 350 milliseconds
          setTimeout(() => {
            alert("Scanned: " + qrCodeMessage);
            html5QrCode
              .stop()
              .then((ignore) => {
                cameraContainer.style.display = "none"; // Hide the camera container
              })
              .catch((err) => {
                console.error("Failed to stop camera:", err);
              });
          }, 300); // Delay the alert by 200 milliseconds
        },
        (errorMessage) => {
          console.warn(`QR Code no longer in front of camera.`);
        }
      )
      .catch((err) => {
        console.error("Unable to start scanning:", err);
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
      populateDropdown(jsonData);
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

  document.getElementById("item-select").addEventListener("change", function () {
    const selectedItem = this.value; // Get the selected item value from the dropdown
    console.log("Selected item:", selectedItem);
    generateSingleQRCode(selectedItem, jsonData); // Call the function with the selected item and JSON data
  });

  function generateSingleQRCode(selectedItem, jsonData) {
    console.log("JSON Data:", jsonData);
    const filteredData = jsonData.filter((row) => row[0] === selectedItem);
    console.log("Filtered Data:", filteredData);

    let qrCodesHTML = filteredData
      .map((row) => {
        const itemName = row[0];
        const dataValue = row[3]; // Assuming data is in column D
        const qrCodeImageSrc = `https://quickchart.io/qr?text=${encodeURIComponent(dataValue)}`;
        return `
          <div class="qr-code-container">
            <div class="qr-code">
              <img src="${qrCodeImageSrc}" alt="QR Code">
            </div>
            <div class="item-name">${itemName}</div>
          </div>
        `;
      })
      .join("");

    document.getElementById("qrCodeContainer").innerHTML = qrCodesHTML; // Set the generated HTML in the container
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