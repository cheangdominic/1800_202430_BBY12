document.addEventListener("DOMContentLoaded", function () {
    const welcomeAlert = document.getElementById("welcomeAlert");

    if (sessionStorage.getItem("welcomeAlertDismissed")) {
        welcomeAlert.style.display = "none";
    }

    document.querySelector("#welcomeAlert .btn-close").addEventListener("click", () => {
        sessionStorage.setItem("welcomeAlertDismissed", "true");
    });
});
