document.addEventListener("DOMContentLoaded", function () {
    const startDateInput = document.getElementById('playdate-datetime');
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate() + 1).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const minDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;

    const maxYear = now.getFullYear() + 1;
    const maxDateTime = `${maxYear}-${month}-${day}T${hours}:${minutes}`;

    startDateInput.min = minDateTime;
    startDateInput.max = maxDateTime;
    
    startDateInput.addEventListener('input', function () {
        if (startDateInput.value < minDateTime) {
            startDateInput.value = minDateTime;
        }
    });
});
