document.addEventListener("DOMContentLoaded", function() {
  const vibrateBtn = document.getElementById("vibrate-btn");

  vibrateBtn.addEventListener("click", function() {
    navigator.vibrate(200); // Test vibration for 200 milliseconds
  });
});
