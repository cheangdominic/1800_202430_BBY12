document.addEventListener("DOMContentLoaded", function () {  // Wait until the DOM is fully loaded
    const startDateInput = document.getElementById('playdate-datetime');  // Get the input element for the playdate datetime
    const now = new Date();  // Get the current date and time

    const year = now.getFullYear();  // Get the current year
    const month = String(now.getMonth() + 1).padStart(2, '0');  // Get the current month (1-based index)
    const day = String(now.getDate() + 1).padStart(2, '0');  // Get tomorrow's date (current date + 1)
    const hours = String(now.getHours()).padStart(2, '0');  // Get the current hour
    const minutes = String(now.getMinutes()).padStart(2, '0');  // Get the current minute
    const minDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;  // Construct the minimum datetime for the input (tomorrow's date)

    const maxYear = now.getFullYear() + 1;  // Set the maximum year to one year from now
    const maxDateTime = `${maxYear}-${month}-${day}T${hours}:${minutes}`;  // Construct the maximum datetime for the input (next year)

    startDateInput.min = minDateTime;  // Set the input's minimum date and time
    startDateInput.max = maxDateTime;  // Set the input's maximum date and time
    
    startDateInput.addEventListener('input', function () {  // Add an event listener for input changes
        if (startDateInput.value < minDateTime) {  // If the input value is less than the minimum datetime
            startDateInput.value = minDateTime;  // Set the value to the minimum datetime
        }
    });
});
