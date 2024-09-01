let db;
const request = indexedDB.open('remindersDB', 1);

request.onupgradeneeded = (event) => {
    db = event.target.result;
    const objectStore = db.createObjectStore('reminders', { keyPath: 'id', autoIncrement: true });
    objectStore.createIndex('time', 'time', { unique: false });
};

request.onsuccess = (event) => {
    db = event.target.result;
    displayReminders();
};

request.onerror = (event) => {
    console.error('Database error:', event.target.errorCode);
};

function saveReminder() {
    const date = document.getElementById('datePicker').value;
    const hours = document.getElementById('hours').value.padStart(2, '0');
    const minutes = document.getElementById('minutes').value.padStart(2, '0');
    const seconds = document.getElementById('seconds').value.padStart(2, '0');

    const time = `${date} ${hours}:${minutes}:${seconds}`;
    const transaction = db.transaction(['reminders'], 'readwrite');
    const objectStore = transaction.objectStore('reminders');
    const reminder = { time: time };

    const request = objectStore.add(reminder);

    request.onsuccess = () => {
        displayReminders();
        clearInputs();
    };

    request.onerror = (event) => {
        console.error('Error adding reminder:', event.target.errorCode);
    };
}

function displayReminders() {
    const transaction = db.transaction(['reminders'], 'readonly');
    const objectStore = transaction.objectStore('reminders');

    let output = '<table><tr><th>Time</th><th>Actions</th></tr>';
    objectStore.openCursor().onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
            output += `<tr>
                <td>${cursor.value.time}</td>
                <td>
                    <button onclick="editReminder(${cursor.key})" class="btn btn-secondary">Edit</button>
                    <button onclick="deleteReminder(${cursor.key})" class="btn btn-secondary">Delete</button>
                </td>
            </tr>`;
            cursor.continue();
        } else {
            output += '</table>';
            document.getElementById('reminderList').innerHTML = output;
        }
    };
}

function editReminder(id) {
    const transaction = db.transaction(['reminders'], 'readwrite');
    const objectStore = transaction.objectStore('reminders');
    const request = objectStore.get(id);

    request.onsuccess = (event) => {
        const reminder = request.result;
        const [datePart, timePart] = reminder.time.split(' ');
        const [hours, minutes, seconds] = timePart.split(':');
        
        document.getElementById('datePicker').value = datePart;
        document.getElementById('hours').value = hours;
        document.getElementById('minutes').value = minutes;
        document.getElementById('seconds').value = seconds;

        deleteReminder(id);
    };
}

function deleteReminder(id) {
    const transaction = db.transaction(['reminders'], 'readwrite');
    const objectStore = transaction.objectStore('reminders');
    const request = objectStore.delete(id);

    request.onsuccess = () => {
        displayReminders();
    };
}

function clearInputs() {
    document.getElementById('datePicker').value = '';
    document.getElementById('hours').value = '';
    document.getElementById('minutes').value = '';
    document.getElementById('seconds').value = '';
}

function startCountdown() {
    const now = new Date();
    const date = document.getElementById('datePicker').value;
    const hours = parseInt(document.getElementById('hours').value) || 0;
    const minutes = parseInt(document.getElementById('minutes').value) || 0;
    const seconds = parseInt(document.getElementById('seconds').value) || 0;

    const targetDate = new Date(date);
    targetDate.setHours(hours, minutes, seconds);
    let totalSeconds = Math.floor((targetDate - now) / 1000);

    if (totalSeconds <= 0) {
        alert('The countdown time is in the past or invalid!');
        return;
    }

    function updateCountdown() {
        if (totalSeconds > 0) {
            totalSeconds--;
            const displayHours = Math.floor(totalSeconds / 3600);
            const displayMinutes = Math.floor((totalSeconds % 3600) / 60);
            const displaySeconds = totalSeconds % 60;
            document.getElementById('countdownDisplay').innerText =
                `${String(displayHours).padStart(2, '0')}:${String(displayMinutes).padStart(2, '0')}:${String(displaySeconds).padStart(2, '0')}`;
        } else {
            clearInterval(interval);
            document.getElementById('countdownDisplay').innerText = "Time's up!";
            playAlarmSound();
        }
    }

    const interval = setInterval(updateCountdown, 1000);
}

function playAlarmSound() {
    const alarmSound = new Audio('https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg');
    alarmSound.play();
}