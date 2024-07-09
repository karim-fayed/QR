document.addEventListener("DOMContentLoaded", function () {
  const generateBtn = document.getElementById("generate-btn");
  const printBtn = document.getElementById("print-btn");
  const saveBtn = document.getElementById("save-btn");
  const qrCodeDiv = document.getElementById("qr-code");
  const itemNameDiv = document.getElementById("item-name");
  const excelFileInput = document.getElementById("excel-file");
  const openCameraBtn = document.getElementById("open-camera-btn");
  const cameraContainer = document.getElementById('camera-container');
  const percentageCalculatorBtn = document.getElementById("percentage-calculator-btn");
  const languageToggleBtn = document.getElementById("language-toggle-btn");
  const itemSelect = document.getElementById("item-select");
  let workbook;
  let html5QrCode;

  const langEn = {
    selectFileAlert: 'Please select a file.',
    selectItem: 'Select an item...'
  };

  const langAr = {
    selectFileAlert: 'الرجاء اختيار ملف.',
    selectItem: 'اختر عنصراً...'
  };

  // Load language preference from localStorage
  let currentLanguage = localStorage.getItem("currentLanguage") || "en";
  toggleLanguage(currentLanguage);

  generateBtn.addEventListener("click", generateQRCode);
  printBtn.addEventListener("click", printQRCode);
  saveBtn.addEventListener("click", saveQRCode);
  openCameraBtn.addEventListener('click', openCamera);
  percentageCalculatorBtn.addEventListener("click", function() {
    window.location.href = "percentage_calculator.html";
  });

  languageToggleBtn.addEventListener("click", function() {
    currentLanguage = currentLanguage === "en" ? "ar" : "en";
    localStorage.setItem("currentLanguage", currentLanguage);
    toggleLanguage(currentLanguage);
  });

function openCamera() {
  cameraContainer.style.display = 'block';

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    console.error('getUserMedia is not supported in this browser');
    return;
  }

  html5QrCode = new Html5Qrcode("reader");

    // الحصول على التيار من الكاميرا الخلفية
  navigator.mediaDevices.getUserMedia({ video: { facingMode: { exact: 'environment' } } })
    .then(stream => {
      const videoElement = document.querySelector('video');
      videoElement.srcObject = stream;
      videoElement.onloadedmetadata = () => {
        videoElement.play();
        //الحصول على التيار من الكاميرا الامامية
  //navigator.mediaDevices.getUserMedia({ video: true })
   // .then(stream => {
   //   const videoElement = document.querySelector('video');
    //  videoElement.srcObject = stream;
    //  videoElement.onloadedmetadata = () => {
    //    videoElement.play();
        html5QrCode.start(
          { videoSource: stream },
          {
            fps: 90,
            qrbox: { width: 300, height: 300 },
            aspectRatio: 2
          },
          qrCodeMessage => {
            navigator.vibrate(250);
            alert('Scanned: ' + qrCodeMessage);
            html5QrCode.stop().then(ignore => {
              cameraContainer.style.display = 'none';
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
      };
    })
    .catch(err => {
      console.error('Error accessing camera:', err);
    });
}


  function generateQRCode() {
    const file = excelFileInput.files[0];
    if (!file) {
      alert(getTextByLanguage('selectFileAlert'));
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      const data = new Uint8Array(e.target.result);
      workbook = XLSX.read(data, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      qrCodeDiv.innerHTML = "";
      itemNameDiv.textContent = "";

      populateDropdown(jsonData);

      const selectedItem = itemSelect.value.trim();

      if (selectedItem) {
        generateSingleQRCode(selectedItem, jsonData);
      } else {
        generateAllQRCodes(jsonData);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function populateDropdown(jsonData) {
    itemSelect.innerHTML = "";

    const defaultOption = document.createElement('option');
    defaultOption.text = getTextByLanguage('selectItem');
    defaultOption.value = "";
    itemSelect.appendChild(defaultOption);

    for (let i = 1; i < jsonData.length; i++) {
      const itemName = jsonData[i][0];
      if (itemName) {
        const option = document.createElement('option');
        option.text = itemName;
        option.value = itemName;
        itemSelect.appendChild(option);
      }
    }
  }

  function generateSingleQRCode(selectedItem, jsonData) {
    const filteredData = jsonData.filter(row => row[0] === selectedItem);
    
    let qrCodesHTML = filteredData.map(row => {
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
    }).join("");

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
  }

  function generateAllQRCodes(jsonData) {
    let qrCodesHTML = "";

    for (let i = 1; i < jsonData.length; i++) {
      const itemName = jsonData[i][0];
      const dataValue = jsonData[i][3]; // Assuming data is in column D

      if (!itemName || !dataValue) {
        continue;
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
  }

  function printQRCode() {
    // Not implemented for vertical display
  }

  function saveQRCode() {
    // Not implemented for vertical display
  }

  function getTextByLanguage(textKey) {
    if (currentLanguage === 'en') {
      return langEn[textKey];
    } else if (currentLanguage === 'ar') {
      return langAr[textKey];
    }
  }


  function toggleLanguage(lang) {
    if (lang === 'en') {
      document.getElementById('language-toggle-btn').textContent = 'تبديل إلى العربية';
      generateBtn.textContent = 'Generate QR Code';
      printBtn.textContent = 'Print QR Code';
      saveBtn.textContent = 'Save QR Code';
      openCameraBtn.textContent = 'Open Camera';
      percentageCalculatorBtn.textContent = 'Calculate percentage';
    } else if (lang === 'ar') {
      document.getElementById('language-toggle-btn').textContent = 'Switch to English';
      generateBtn.textContent = 'إنشاء رمز الاستجابة السريعة';
      printBtn.textContent = 'طباعة رمز الاستجابة السريعة';
      saveBtn.textContent = 'حفظ رمز الاستجابة السريعة';
      openCameraBtn.textContent = 'فتح الكاميرا';
      percentageCalculatorBtn.textContent = 'حساب النسبة المئوية';
    }
  }

  function getTextByLanguage(textKey) {
    if (currentLanguage === 'en') {
      return langEn[textKey];
    } else if (currentLanguage === 'ar') {
      return langAr[textKey];
    }
  }
});
