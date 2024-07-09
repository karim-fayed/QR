const path = require('path');

module.exports = {
  entry: './scripts.js', // مسار ملف الإدخال الخاص بك
  output: {
    filename: 'bundle.js', // اسم ملف الإخراج الذي سيتم إنشاؤه
    path: path.resolve(__dirname, 'dist') // المجلد الذي سيتم حفظ ملف الإخراج فيه
  }
};