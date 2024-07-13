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

// Refactored function to toggle UI elements based on language
function toggleLanguage(lang) {
    const labels = {
        amount: { en: 'Enter Amount', ar: 'أدخل المبلغ' },
        percentage: { en: 'Enter Percentage', ar: 'أدخل النسبة المئوية' },
        operation: { en: 'Choose Operation', ar: 'اختر العملية' }
    };

    const operations = {
        en: {
            extract: 'Extract Percentage Only',
            subtract: 'Extract and Subtract Percentage',
            add: 'Extract and Add Percentage'
        },
        ar: {
            extract: 'استخراج النسبة من المبلغ فقط',
            subtract: 'استخراج النسبة وطرحها من المبلغ',
            add: 'استخراج النسبة واضافتها إلى المبلغ'
        }
    };

    const buttons = {
        en: { calculate: 'Calculate', back: 'Back to Home Page' },
        ar: { calculate: 'احسب', back: 'الرجوع إلى الصفحة الرئيسية' }
    };

    document.getElementById('language-toggle-btn').textContent = lang === 'en' ? 'تبديل إلى العربية' : 'Switch to English';
    document.getElementById('back-btn').textContent = buttons[lang].back;
    document.getElementById('percentageForm').querySelector('label[for="amount"]').textContent = labels.amount[lang];
    document.getElementById('percentageForm').querySelector('label[for="percentage"]').textContent = labels.percentage[lang];
    document.getElementById('percentageForm').querySelector('label[for="operation"]').textContent = labels.operation[lang];
    document.getElementById('percentageForm').querySelectorAll('option').forEach(option => {
        option.textContent = operations[lang][option.value];
    });
    document.getElementById('percentageForm').querySelector('button[type="submit"]').textContent = buttons[lang].calculate;
}
