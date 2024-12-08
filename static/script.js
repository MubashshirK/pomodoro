let timer;
let isPaused = true;
let remainingTime = 25 * 60;
let progressBar = document.getElementById('progress-bar-filled');
let totalTime = 25 * 60;
let timeLeft = totalTime;
let workDuration = 25 * 60;
let shortBreakDuration = 5 * 60;
let longBreakDuration = 15 * 60;
let currentSession = 'work';
let workCount = 0;
let sessionHeading = document.getElementById('session-heading');
let autoPauseEnabled = false;
let soundEnabled = true;

// Select the sidebar and toggle button
const sidebar = document.getElementById('sidebar');
const toggleSidebarButton = document.getElementById('toggle-sidebar-button');
const saveButton = document.getElementById('save-durations');
const iconClosed = document.getElementById('icon-closed');
const iconOpened = document.getElementById('icon-opened');

// Toggle sidebar and icons
toggleSidebarButton.addEventListener('click', () => {
    const isOpen = sidebar.classList.toggle('open');

    // Toggle icon visibility
    if (isOpen) {
        iconClosed.classList.add('hidden');
        iconOpened.classList.remove('hidden');
    } else {
        iconClosed.classList.remove('hidden');
        iconOpened.classList.add('hidden');
    }
});

// Close sidebar when the save button is clicked
saveButton.addEventListener('click', () => {
    sidebar.classList.remove('open');
    iconClosed.classList.remove('hidden');
    iconOpened.classList.add('hidden');
});

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

// Notification
function showNotification(message) {
    const notification = document.getElementById('notification');
    notification.innerText = message;
    notification.style.display = 'block';
    notification.style.opacity = '1';

    // Hide notification
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 400);
    }, 4000);
}

// Start timer
function startTimer() {
    clearInterval(timer);

    if (isPaused) {
        isPaused = false;
        toggleButtons('start');
        timer = setInterval(() => {
            if (remainingTime > 0) {
                remainingTime--;
                updateDisplay();
                updateProgressBar();
            } else {
                clearInterval(timer);
                handleSessionEnd();
            }
        }, 1000);
    }
}

// Handle session end & transition
function handleSessionEnd() {
    clearInterval(timer);

    // Transition logic
    if (currentSession === 'work') {
        workCount++;
        if (workCount % 4 === 0) {
            // After 4 work sessions, start long break
            currentSession = 'longBreak';
            remainingTime = longBreakDuration;
            totalTime = longBreakDuration;
            showNotification('Time for a long break! 🛌');
        } else {
            // Otherwise, start a short break
            currentSession = 'shortBreak';
            remainingTime = shortBreakDuration;
            totalTime = shortBreakDuration;
            showNotification('Time for a short break! ☕');
        }
    } else {
        // After a break, return to a work session
        currentSession = 'work';
        remainingTime = workDuration;
        totalTime = workDuration;
        showNotification('Back to work! 💪');
    }

    // Reset and prepare for the new session
    isPaused = true;
    updateSessionHeading();
    updateDisplay();
    updateProgressBar();

    if (autoPauseEnabled) {
        isPaused = true;
        toggleButtons('reset');
    } else {
        startTimer()
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
                updateProgressBar();
            } else {
                clearInterval(timer);
                showNotification('Focus Session is Complete!🥳');
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
    currentSession = 'work';
    workCount = 0;
    remainingTime = workDuration;
    totalTime = workDuration;
    updateSessionHeading();
    updateDisplay();
    updateProgressBar();
    toggleButtons('reset');
}

// Update progress bar
function updateProgressBar() {
    const progress = (remainingTime / totalTime) * 100;
    progressBar.style.width = progress + '%';
}

// Load sound files
const workStartSound = new Audio('static/assets/sounds/work-start.mp3');
const breakStartSound = new Audio('static/assets/sounds/break-start.mp3');
const resumeSound = new Audio('static/assets/sounds/resume-session.mp3');
const sessionEndSound = new Audio('static/assets/sounds/session-end.mp3');

// Sound function
function playSound(sound) {
    if (soundEnabled) {
        sound.play();
    }
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
        playSound(workStartSound);
    } else if (action === 'pause') {
        startButton.style.display = 'none';
        pauseButton.style.display = 'none';
        resumeButton.style.display = 'inline';
        playSound(breakStartSound);
    } else if (action === 'resume') {
        startButton.style.display = 'none';
        pauseButton.style.display = 'inline';
        resumeButton.style.display = 'none';
        playSound(resumeSound);
    } else if (action === 'reset') {
        startButton.style.display = 'inline';
        pauseButton.style.display = 'none';
        resumeButton.style.display = 'none';
        resetButton.style.display = 'none';
        playSound(sessionEndSound)
    }
}

// Update session heading
function updateSessionHeading() {
    if (currentSession === 'work') {
        sessionHeading.innerText = 'Focus Session';
    } else if (currentSession === 'shortBreak') {
        sessionHeading.innerText = 'Short Break';
    } else if (currentSession === 'longBreak') {
        sessionHeading.innerText = 'Long Break';
    }
}

// Save custom durations
function saveDurations() {
    const newWorkDuration = parseInt(document.getElementById('work-duration').value, 10) * 60;
    const newShortBreakDuration = parseInt(document.getElementById('short-break-duration').value, 10) * 60;
    const newLongBreakDuration = parseInt(document.getElementById('long-break-duration').value, 10) * 60;

    // Update the durations
    workDuration = newWorkDuration || workDuration;
    shortBreakDuration = newShortBreakDuration || shortBreakDuration;
    longBreakDuration = newLongBreakDuration || longBreakDuration;

    // Reset the remainingTime only if it's the work session
    if (currentSession === 'work') {
        remainingTime = workDuration;
        totalTime = workDuration;
    } else if (currentSession === 'shortBreak') {
        remainingTime = shortBreakDuration;
        totalTime = shortBreakDuration;
    } else if (currentSession === 'longBreak') {
        remainingTime = longBreakDuration;
        totalTime = longBreakDuration;
    }

    showNotification('Changes Applied! 🔧');
    updateDisplay();
    updateProgressBar();
}

// Event listener to save durations
document.getElementById('save-durations').addEventListener('click', saveDurations);

// Attach event listeners to buttons
document.getElementById('start').addEventListener('click', startTimer);
document.getElementById('pause').addEventListener('click', pauseTimer);
document.getElementById('resume').addEventListener('click', resumeTimer);
document.getElementById('reset').addEventListener('click', resetTimer);

// Listen for Auto-Pause checkbox toggle
document.getElementById('auto-pause-toggle').addEventListener('change', (e) => {
    autoPauseEnabled = e.target.checked;
});

// Event listener to the sound toggle
document.getElementById('sound-toggle').addEventListener('change', (e) => {
    soundEnabled = e.target.checked;
});

// Initialize the display
updateDisplay();
updateSessionHeading();
updateProgressBar();
