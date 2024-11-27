let timer;
let isPaused = true;
let remainingTime = 25 * 60;
let progressBar = document.getElementById('progress-bar-filled');
let totalTime = 25 * 60; // 25 minutes
let timeLeft = totalTime;
let workDuration = 25 * 60; // Default: 25 minutes
let shortBreakDuration = 5 * 60; // Default: 5 minutes
let longBreakDuration = 15 * 60; // Default: 15 minutes

//format time as MM:SS
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Update timer display
function updateDisplay() {
    document.getElementById('timer').innerText = formatTime(remainingTime);
}

// Start timer
function startTimer() {
    if (isPaused) {
        isPaused = false;
        toggleButtons('start');
        timer = setInterval(() => {
            if (remainingTime > 0) {
                remainingTime--;
                updateDisplay();
                updateProgressBar(); // Update the progress bar
            } else {
                clearInterval(timer);
                alert('Time is up!');
                toggleButtons('reset');
            }
        }, 1000);
    }
}

// Resume timer
function resumeTimer() {
    if (isPaused) {
        isPaused = false;
        toggleButtons('resume');
        timer = setInterval(() => {
            if (remainingTime > 0) {
                remainingTime--;
                updateDisplay();
                updateProgressBar(); // Update the progress bar
            } else {
                clearInterval(timer);
                alert('Time is up!');
                toggleButtons('reset');
            }
        }, 1000);
    }
}

// Pause timer
function pauseTimer() {
    isPaused = true;
    clearInterval(timer);
    toggleButtons('pause');
}

// Reset timer
function resetTimer() {
    isPaused = true;
    clearInterval(timer);
    remainingTime = workDuration; // Use the custom work duration
    updateDisplay();
    updateProgressBar(); // If using a progress bar or ring
    toggleButtons('reset');
}

// Update progress bar
function updateProgressBar() {
    const progress = (remainingTime / totalTime) * 100;
    progressBar.style.width = progress + '%';
}

// Toggle button visibility
function toggleButtons(action) {
    const startButton = document.getElementById('start');
    const pauseButton = document.getElementById('pause');
    const resumeButton = document.getElementById('resume');
    const resetButton = document.getElementById('reset');

    if (action === 'start') {
        startButton.style.display = 'none';
        pauseButton.style.display = 'inline';
        resumeButton.style.display = 'none';
        resetButton.style.display = 'inline';
    } else if (action === 'pause') {
        startButton.style.display = 'none';
        pauseButton.style.display = 'none';
        resumeButton.style.display = 'inline';
    } else if (action === 'resume') {
        startButton.style.display = 'none';
        pauseButton.style.display = 'inline';
        resumeButton.style.display = 'none';
    } else if (action === 'reset') {
        startButton.style.display = 'inline';
        pauseButton.style.display = 'none';
        resumeButton.style.display = 'none';
        resetButton.style.display = 'none';
    }
}

// Toggle custom duration visibility
document.getElementById('edit-duration-button').addEventListener('click', function() {
    const durationForm = document.getElementById('custom-duration-form');
    // Toggle display: If hidden, show it; if shown, hide it
    if (durationForm.style.display === 'none') {
        durationForm.style.display = 'flex';
        this.innerText = "Hide Durations"; // Change button text
    } else {
        durationForm.style.display = 'none';
        this.innerText = "Edit Durations"; // Change button text back
    }
});

// Save custom durations
function saveDurations() {
    workDuration = parseInt(document.getElementById('work-duration').value, 10) * 60;
    shortBreakDuration = parseInt(document.getElementById('short-break-duration').value, 10) * 60;
    longBreakDuration = parseInt(document.getElementById('long-break-duration').value, 10) * 60;

    remainingTime = workDuration; // Set remainingTime to reflect the new work duration
    totalTime = workDuration;

    alert('Durations updated successfully!');
    updateDisplay(); // Immediately update the timer display
    updateProgressBar();

    // Hide the custom duration form after saving
    document.getElementById('custom-duration-form').style.display = 'none';
    document.getElementById('edit-duration-button').innerText = "Edit Durations"; // Reset button text
}

// Event listener to save durations
document.getElementById('save-durations').addEventListener('click', saveDurations);

// Attach event listeners to buttons
document.getElementById('start').addEventListener('click', startTimer);
document.getElementById('pause').addEventListener('click', pauseTimer);
document.getElementById('resume').addEventListener('click', resumeTimer);
document.getElementById('reset').addEventListener('click', resetTimer);

// Initialize the display
updateDisplay();
updateProgressBar();
