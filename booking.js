/* Booking Logic with Firebase - Weekly View */
import { db } from './firebase-config.js';
import { collection, addDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements - Updated for Weekly View
    const calendarGrid = document.getElementById('calendar-grid');
    const selectedSlotInput = document.getElementById('selected-slot');
    const slotDisplay = document.getElementById('slot-display');
    const submitBtn = document.getElementById('submit-btn');
    const form = document.querySelector('form');
    const prevWeekBtn = document.getElementById('prev-week');
    const nextWeekBtn = document.getElementById('next-week');
    const currentWeekLabel = document.getElementById('current-week-label');

    // Identify Doctor
    const formName = form ? form.name : '';
    const doctorId = formName.includes('secondi') ? 'secondi' : 'capparelli';

    // Configuration
    const startHour = 8;
    const endHour = 17;
    const intervalMinutes = 20;

    // State
    let currentMonday = getNextMonday(new Date());

    // Init
    initCalendar();

    function initCalendar() {
        // Find next monday if today is weekend, or start from today if Monday, etc.
        // Actually, "Current Week" usually means the week containing today.
        // If today is Sat/Sun, maybe show next week? User said "Predeterminado la semana actual".
        const today = new Date();
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        currentMonday = new Date(today.setDate(diff));

        // If current Monday is in the past (e.g. today is Wed), that's fine, we disable past days.

        renderWeek(currentMonday);

        prevWeekBtn.addEventListener('click', () => changeWeek(-1));
        nextWeekBtn.addEventListener('click', () => changeWeek(1));
    }

    function getNextMonday(d) {
        d = new Date(d);
        var day = d.getDay(),
            diff = d.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
        return new Date(d.setDate(diff));
    }

    function changeWeek(offset) {
        currentMonday.setDate(currentMonday.getDate() + (offset * 7));
        renderWeek(currentMonday);
    }

    async function renderWeek(mondayDate) {
        // Update Label
        const fridayDate = new Date(mondayDate);
        fridayDate.setDate(mondayDate.getDate() + 4);

        const options = { day: 'numeric', month: 'numeric' };
        currentWeekLabel.textContent = `Semana del ${mondayDate.toLocaleDateString('es-AR', options)} al ${fridayDate.toLocaleDateString('es-AR', options)}`;

        // Clear Grid
        calendarGrid.innerHTML = '<div style="padding: 2rem; text-align: center; grid-column: 1/-1;">Cargando disponibilidad...</div>';

        // Fetch Data for the whole week
        // Note: Ideally query range date >= monday AND date <= friday
        // For simplicity with string dates YYYY-MM-DD, we can check specific dates or just load all for doctor (if few)
        // Let's generate the 5 string dates
        const weekDates = [];
        let tempDate = new Date(mondayDate);
        for (let i = 0; i < 5; i++) {
            weekDates.push(tempDate.toISOString().split('T')[0]);
            tempDate.setDate(tempDate.getDate() + 1);
        }

        // Fetch taken slots
        const takenSlotsMap = await getTakenSlotsForWeek(weekDates); // Returns object { "2026-02-01": ["10:00", "11:00"] }

        // Render Columns
        calendarGrid.innerHTML = '';

        const todayStr = new Date().toISOString().split('T')[0];

        weekDates.forEach(dateStr => {
            const dateObj = new Date(dateStr + 'T00:00:00');
            const dayName = dateObj.toLocaleDateString('es-AR', { weekday: 'long' });
            const dayNum = dateObj.getDate();

            const col = document.createElement('div');
            col.className = 'day-column';

            // Header
            const header = document.createElement('div');
            header.className = 'day-header';
            header.innerHTML = `<span>${capitalize(dayName)}</span><small>${dayNum}</small>`;
            col.appendChild(header);

            // Slots Container
            const slotsContainer = document.createElement('div');
            slotsContainer.className = 'slots-column';

            // Generate Slots
            let slotTime = new Date(dateStr + 'T00:00:00');
            slotTime.setHours(startHour, 0, 0, 0);
            const slotEndTime = new Date(dateStr + 'T00:00:00');
            slotEndTime.setHours(endHour, 0, 0, 0);

            const isPast = dateStr < todayStr;

            while (slotTime < slotEndTime) {
                const timeStr = slotTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

                const btn = document.createElement('div'); // Using div for styling, act as button
                btn.className = 'time-slot';
                btn.textContent = timeStr;

                const isTaken = takenSlotsMap[dateStr] && takenSlotsMap[dateStr].includes(timeStr);

                if (isPast || isTaken) {
                    btn.classList.add('taken');
                    // btn.title = isPast ? "Fecha pasada" : "Horario ocupado";
                } else {
                    btn.addEventListener('click', () => selectWeekSlot(btn, dateStr, timeStr));
                }

                slotsContainer.appendChild(btn);
                slotTime.setMinutes(slotTime.getMinutes() + intervalMinutes);
            }

            col.appendChild(slotsContainer);
            calendarGrid.appendChild(col);
        });
    }

    function capitalize(s) {
        return s && s[0].toUpperCase() + s.slice(1);
    }

    async function getTakenSlotsForWeek(dates) {
        // We can do a range query since 'dates' are sequential strings
        const startDate = dates[0];
        const endDate = dates[dates.length - 1];

        const q = query(
            collection(db, "appointments"),
            where("doctor", "==", doctorId),
            where("date", ">=", startDate),
            where("date", "<=", endDate)
        );

        const querySnapshot = await getDocs(q);
        const map = {};

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            // Assuming status 'confirmed' or 'blocked'
            if (!map[data.date]) {
                map[data.date] = [];
            }
            map[data.date].push(data.time);
        });

        return map;
    }

    function selectWeekSlot(btn, dateStr, timeStr) {
        // Remove active from all others
        document.querySelectorAll('.time-slot').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        selectedSlotInput.value = `${dateStr} ${timeStr}`;
        slotDisplay.textContent = `Turno seleccionado: ${dateStr} a las ${timeStr}hs`;
        submitBtn.disabled = false;

        // Clean values for DB
        form.dataset.date = dateStr;
        form.dataset.time = timeStr;
    }

    // --- SUBMISSION LOGIC (Same as before) ---
    if (form) {
        form.addEventListener('submit', async function (event) {
            event.preventDefault();
            const btn = document.getElementById('submit-btn');
            btn.disabled = true;
            btn.textContent = 'Procesando...';

            const formData = new FormData(form);
            const cleanDate = form.dataset.date;
            const cleanTime = form.dataset.time;

            try {
                // Check if slot was taken just now (Concurrency)
                const isTaken = await checkSlotTaken(cleanDate, cleanTime);
                if (isTaken) {
                    alert("Lo sentimos, este turno acaba de ser reservado por otra persona. Por favor elija otro.");
                    btn.disabled = false;
                    btn.textContent = 'Confirmar Solicitud';
                    renderWeek(currentMonday); // Refresh
                    return;
                }

                // 1. SAVE TO FIREBASE
                await addDoc(collection(db, "appointments"), {
                    doctor: doctorId,
                    date: cleanDate,
                    time: cleanTime,
                    patientName: formData.get('nombre') + ' ' + formData.get('apellido'),
                    patientEmail: formData.get('email'),
                    patientPhone: formData.get('telefono'),
                    insurance: formData.get('cobertura'),
                    status: 'confirmed',
                    timestamp: new Date()
                });

                // 2. SEND TO NETLIFY
                await fetch('/', {
                    method: 'POST',
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: new URLSearchParams(formData).toString()
                });

                // 3. SEND EMAIL
                const EMAILJS_PUBLIC_KEY = "yp2cTT12Ti6VmL4iN";
                const EMAILJS_SERVICE_ID = "service_0wgkq1l";
                const EMAILJS_TEMPLATE_ID = "template_zkapdb6";

                if (typeof emailjs !== 'undefined') {
                    emailjs.init(EMAILJS_PUBLIC_KEY);
                    const doctorNamePretty = doctorId === 'secondi' ? 'Dra. Secondi' : 'Dr. Capparelli';

                    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
                        email: formData.get('email'),
                        to_name: formData.get('nombre') + ' ' + formData.get('apellido'),
                        doctor_name: doctorNamePretty,
                        date_time: `${cleanDate} ${cleanTime}`
                    });
                }

                window.location.href = 'gracias.html';

            } catch (error) {
                console.error("Error booking:", error);
                alert("Hubo un error al procesar el turno.");
                btn.disabled = false;
                btn.textContent = 'Confirmar Solicitud';
            }
        });
    }

    async function checkSlotTaken(date, time) {
        const q = query(
            collection(db, "appointments"),
            where("doctor", "==", doctorId),
            where("date", "==", date),
            where("time", "==", time)
        );
        const snap = await getDocs(q);
        return !snap.empty;
    }
});
