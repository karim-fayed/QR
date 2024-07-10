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
    // عرض كونتينر الكاميرا
    cameraContainer.style.display = 'block';

    // إنشاء Html5Qrcode جديد
    html5QrCode = new Html5Qrcode("reader");

    // التحقق من دعم getUserMedia في المتصفح
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error('getUserMedia is not supported in this browser');
      alert('getUserMedia is not supported in this browser');
      return;
    }

    navigator.mediaDevices.getUserMedia({ video: true })
      .then(function (stream) {
        // بدء فحص الـ QR
        html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 60, // زيادة FPS لزيادة حساسية القراءة
            qrbox: { width: 300, height: 300 },
            aspectRatio: 1,
            zoom: 1.5 // زيادة مستوى التكبير إلى 1.5
          },
          qrCodeMessage => {
            navigator.vibrate(250); // اهتزاز لإشارة مسح QR
            alert('تم المسح: ' + qrCodeMessage);

            // إيقاف الفحص عند الانتهاء
            html5QrCode.stop().then(ignore => {
              cameraContainer.style.display = 'none'; // إخفاء الكونتينر بعد الانتهاء
            }).catch(err => {
              console.error('فشل في إيقاف الكاميرا:', err);
            });
          },
          errorMessage => {
            console.warn(`لا يوجد QR Code أمام الكاميرا.`);
          }
        ).catch(err => {
          console.error('تعذر بدء الفحص:', err);
        });
      })
      .catch(err => {
        console.error('خطأ في الوصول إلى الكاميرا:', err);
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
        alert(getTextByLanguage('selectItem'));
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

    qrCodeDiv.innerHTML = qrCodesHTML;
  }

  function printQRCode() {
    // Not implemented for vertical display
  }

  function saveQRCode() {
    // Not implemented for vertical display
  }

  const langEn = {
    selectFileAlert: 'Please select a file.',
    selectItem: 'Select an item...'
  };

  const langAr = {
    selectFileAlert: 'الرجاء اختيار ملف.',
    selectItem: 'اختر عنصراً...'
  };

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
