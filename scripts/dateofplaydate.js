document.addEventListener("DOMContentLoaded", function () {
    const startDateInput = document.getElementById('playdate-datetime');
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const currentDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;

    const maxDate = new Date(now);
    maxDate.setFullYear(now.getFullYear() + 1);
    const maxYear = maxDate.getFullYear();
    const maxMonth = String(maxDate.getMonth() + 1).padStart(2, '0');
    const maxDay = String(maxDate.getDate()).padStart(2, '0');
    const maxDateTime = `${maxYear}-${maxMonth}-${maxDay}T${hours}:${minutes}`;

    startDateInput.value = currentDateTime;
    startDateInput.min = currentDateTime;
    startDateInput.max = maxDateTime;
});
