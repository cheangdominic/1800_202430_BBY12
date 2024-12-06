document.addEventListener("DOMContentLoaded", function () {
    const welcomeAlert = document.getElementById("welcomeAlert"); // Get the welcome alert element

    if (sessionStorage.getItem("welcomeAlertDismissed")) {
        welcomeAlert.style.display = "none"; // Hide the alert if it has been dismissed
    }

    document.querySelector("#welcomeAlert .btn-close").addEventListener("click", () => {
        sessionStorage.setItem("welcomeAlertDismissed", "true"); // Store that the alert has been dismissed in sessionStorage
    });
});
