document.addEventListener("DOMContentLoaded", function() {
    const amountInput = document.getElementById("amount");
    const percentageInput = document.getElementById("percentage");
    const operationSelect = document.getElementById("operation");

    // Load language preference from localStorage
    const currentLanguage = localStorage.getItem("currentLanguage") || "ar";
    toggleLanguage(currentLanguage);

    // Close dropdown on document click
    document.addEventListener("click", function(event) {
        if (!event.target.matches("#operation-arrow")) {
            operationSelect.size = 1; // Close the dropdown
        }
    });

    // Open dropdown on arrow click
    operationSelect.addEventListener("click", function(event) {
        if (event.target.matches("#operation-arrow")) {
            operationSelect.size = operationSelect.size === 1 ? operationSelect.length : 1;
        }
    });

    // Handle form submission for percentage calculation
    const percentageForm = document.getElementById("percentageForm");
    if (percentageForm) {
        percentageForm.addEventListener("submit", function(event) {
            event.preventDefault();
            console.log("Form submitted");

            // Retrieve form values
            let amount = parseFloat(amountInput.value);
            let percentage = parseFloat(percentageInput.value);
            let operation = operationSelect.value;
            let result = 0;

            // Validate inputs
            if (!isNaN(amount) && !isNaN(percentage)) {
                if (operation === "extract") {
                    result = (amount * percentage) / 100;
                } else if (operation === "subtract") {
                    result = amount - ((amount * percentage) / 100);
                } else if (operation === "add") {
                    result = amount + ((amount * percentage) / 100);
                }

                // Display the result
                const resultElement = document.getElementById("result");
                if (resultElement) {
                    resultElement.innerHTML = `<h3>النتيجة:</h3><p>${result.toFixed(2)}</p>`;
                }
            } else {
                // Alert for invalid inputs
                alert("الرجاء إدخال قيمة صحيحة لكل من المبلغ والنسبة المئوية.");
            }
        });
    }

    // Handle back button click
    const backBtn = document.getElementById("back-btn");
    if (backBtn) {
        backBtn.addEventListener("click", function(event) {
            event.preventDefault();
            console.log("Back button clicked");
            // Implement redirection or navigation logic here
            window.location.href = "index.html";
        });
    }

    // Language toggle button functionality
    const languageToggleBtn = document.getElementById("language-toggle-btn");
    if (languageToggleBtn) {
        languageToggleBtn.addEventListener("click", function() {
            const newLanguage = currentLanguage === "ar" ? "en" : "ar";

            // Save language preference
            localStorage.setItem("currentLanguage", newLanguage);

            // Reload the page to apply the new language
            window.location.reload();
        });
    }
});

// Function to toggle UI elements based on language
function toggleLanguage(lang) {
    if (lang === 'en') {
        document.getElementById('language-toggle-btn').textContent = 'تبديل إلى العربية';
        document.getElementById('back-btn').textContent = 'Back to Home Page';
        document.getElementById('percentageForm').querySelector('label[for="amount"]').textContent = 'Enter Amount';
        document.getElementById('percentageForm').querySelector('label[for="percentage"]').textContent = 'Enter Percentage';
        document.getElementById('percentageForm').querySelector('label[for="operation"]').textContent = 'Choose Operation';
        document.getElementById('percentageForm').querySelector('option[value="extract"]').textContent = 'Extract Percentage Only';
        document.getElementById('percentageForm').querySelector('option[value="subtract"]').textContent = 'Extract and Subtract Percentage';
        document.getElementById('percentageForm').querySelector('option[value="add"]').textContent = 'Extract and Add Percentage';
        document.getElementById('percentageForm').querySelector('button[type="submit"]').textContent = 'Calculate';
    } else if (lang === 'ar') {
        document.getElementById('language-toggle-btn').textContent = 'Switch to English';
        document.getElementById('back-btn').textContent = 'الرجوع إلى الصفحة الرئيسية';
        document.getElementById('percentageForm').querySelector('label[for="amount"]').textContent = 'أدخل المبلغ';
        document.getElementById('percentageForm').querySelector('label[for="percentage"]').textContent = 'أدخل النسبة المئوية';
        document.getElementById('percentageForm').querySelector('label[for="operation"]').textContent = 'اختر العملية';
        document.getElementById('percentageForm').querySelector('option[value="extract"]').textContent = 'استخراج النسبة من المبلغ فقط';
        document.getElementById('percentageForm').querySelector('option[value="subtract"]').textContent = 'استخراج النسبة وطرحها من المبلغ';
        document.getElementById('percentageForm').querySelector('option[value="add"]').textContent = 'استخراج النسبة واضافتها إلى المبلغ';
        document.getElementById('percentageForm').querySelector('button[type="submit"]').textContent = 'احسب';
    }
}
