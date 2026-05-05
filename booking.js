document.addEventListener('DOMContentLoaded', () => {
    const WEB3FORMS_KEY = '9a7c5878-9777-40a3-95b8-8faac6537dfa';
    const PER_MILE = 2.50;

    let calculatedData = {};
    let stopCount = 0;
    let fareCalculated = false;

    // Elements
    const pickupInput     = document.getElementById('pickup-input');
    const dropoffInput    = document.getElementById('dropoff-input');
    const stopsContainer  = document.getElementById('stops-container');
    const addStopBtn      = document.getElementById('add-stop-btn');
    const mainBtn         = document.getElementById('main-btn');
    const resultContainer = document.getElementById('calculator-result');
    const resultDistance  = document.getElementById('result-distance');
    const resultTime      = document.getElementById('result-time');
    const resultFare      = document.getElementById('result-fare');
    const rideDate        = document.getElementById('ride-date');
    const rideTime        = document.getElementById('ride-time');
    const customerName    = document.getElementById('customer-name');
    const customerPhone   = document.getElementById('customer-phone');
    const stepCalculator  = document.getElementById('step-calculator');
    const stepThankyou    = document.getElementById('step-thankyou');

    rideDate.min = new Date().toISOString().split('T')[0];

    // --- Navbar ---
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        navbar.style.background = window.scrollY > 50
            ? 'rgba(0, 0, 0, 0.95)'
            : 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)';
        navbar.style.padding = window.scrollY > 50 ? '20px 40px' : '30px 40px';
    });

    // --- Mobile menu ---
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks   = document.querySelector('.nav-links');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            const open = navLinks.style.display === 'flex';
            navLinks.style.display = open ? 'none' : 'flex';
            if (!open) {
                Object.assign(navLinks.style, {
                    flexDirection: 'column', position: 'absolute',
                    top: '100%', left: '0', width: '100%',
                    background: 'rgba(0,0,0,0.95)', padding: '20px'
                });
            }
        });
    }

    // --- Reset fare when locations change ---
    const resetFare = () => {
        if (!fareCalculated) return;
        fareCalculated = false;
        resultContainer.classList.add('hidden');
        mainBtn.textContent = 'Calculate Fare';
    };

    pickupInput.addEventListener('input', resetFare);
    dropoffInput.addEventListener('input', resetFare);

    // --- Add Stop (uses createElement so gmp-place-autocomplete initialises properly) ---
    addStopBtn.addEventListener('click', () => {
        stopCount++;
        const id = `stop-${stopCount}`;

        const group = document.createElement('div');
        group.className = 'input-group stop-group';
        group.id = id;

        const icon = document.createElement('span');
        icon.className = 'input-group-icon';
        icon.setAttribute('aria-hidden', 'true');
        icon.innerHTML = '<i data-lucide="map-pin"></i>';

        const autocomplete = document.createElement('gmp-place-autocomplete');
        autocomplete.setAttribute('placeholder', 'Add a stop');
        autocomplete.setAttribute('country-restrictions', 'us');
        autocomplete.classList.add('stop-input');
        autocomplete.addEventListener('input', resetFare);

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'stop-remove-btn';
        removeBtn.setAttribute('aria-label', 'Remove stop');
        removeBtn.textContent = '✕';
        removeBtn.addEventListener('click', () => { group.remove(); resetFare(); });

        group.appendChild(icon);
        group.appendChild(autocomplete);
        group.appendChild(removeBtn);
        stopsContainer.appendChild(group);
        lucide.createIcons();
    });

    // --- Single button: Calculate → Confirm ---
    const initCalculator = () => {
        if (typeof google === 'undefined' || !google.maps) {
            setTimeout(initCalculator, 300);
            return;
        }

        mainBtn.addEventListener('click', async () => {
            if (!fareCalculated) {
                runCalculation();
            } else {
                runBooking();
            }
        });
    };

    initCalculator();

    function runCalculation() {
        const origin      = pickupInput.value.trim();
        const destination = dropoffInput.value.trim();
        const stopInputs  = Array.from(document.querySelectorAll('.stop-input'));
        const waypoints   = stopInputs
            .map(el => el.value.trim())
            .filter(v => v)
            .map(location => ({ location, stopover: true }));

        if (!origin || !destination) {
            alert('Please enter both pickup and drop-off locations.');
            return;
        }

        mainBtn.textContent = 'Calculating...';
        mainBtn.disabled = true;

        new google.maps.DirectionsService().route({
            origin,
            destination,
            waypoints,
            travelMode: google.maps.TravelMode.DRIVING,
            unitSystem: google.maps.UnitSystem.IMPERIAL,
        }, (result, status) => {
            mainBtn.disabled = false;

            if (status !== 'OK') {
                mainBtn.textContent = 'Calculate Fare';
                alert('Could not calculate route. Please check your locations and try again.');
                return;
            }

            let totalMeters  = 0;
            let totalSeconds = 0;
            result.routes[0].legs.forEach(leg => {
                totalMeters  += leg.distance.value;
                totalSeconds += leg.duration.value;
            });

            const miles        = totalMeters / 1609.344;
            const hrs          = Math.floor(totalSeconds / 3600);
            const mins         = Math.round((totalSeconds % 3600) / 60);
            const distanceText = miles.toFixed(1) + ' mi';
            const timeText     = hrs > 0 ? `${hrs} hr ${mins} min` : `${mins} min`;
            const fare         = (miles * PER_MILE).toFixed(2);

            resultDistance.textContent = distanceText;
            resultTime.textContent     = timeText;
            resultFare.textContent     = '$' + fare;
            resultContainer.classList.remove('hidden');

            calculatedData = {
                pickup:   origin,
                stops:    stopInputs.map(el => el.value.trim()).filter(v => v),
                dropoff:  destination,
                distance: distanceText,
                duration: timeText,
                fare:     '$' + fare,
            };

            fareCalculated = true;
            mainBtn.textContent = 'Confirm Booking';
        });
    }

    async function runBooking() {
        const name  = customerName.value.trim();
        const phone = customerPhone.value.trim();

        if (!name || !phone) {
            alert('Please enter your name and phone number.');
            return;
        }

        const date = rideDate.value;
        const time = rideTime.value;
        const scheduled = date && time
            ? new Date(`${date}T${time}`).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })
            : date
            ? new Date(date + 'T12:00').toLocaleDateString('en-US', { dateStyle: 'full' })
            : 'ASAP';

        const stopsLine = calculatedData.stops.length > 0
            ? calculatedData.stops.map((s, i) => `Stop ${i + 1}: ${s}`).join('\n')
            : 'None';

        mainBtn.textContent = 'Sending...';
        mainBtn.disabled = true;

        const formData = new FormData();
        formData.append('access_key',  WEB3FORMS_KEY);
        formData.append('subject',     `New Booking from ${name}`);
        formData.append('from_name',   '5 Star Rides Booking');
        formData.append('name',        name);
        formData.append('phone',       phone);
        formData.append('pickup',      calculatedData.pickup);
        formData.append('stops',       stopsLine);
        formData.append('dropoff',     calculatedData.dropoff);
        formData.append('distance',    calculatedData.distance);
        formData.append('duration',    calculatedData.duration);
        formData.append('fare',        calculatedData.fare);
        formData.append('scheduled',   scheduled);

        try {
            const response = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();

            if (response.ok) {
                const stopsHtml = calculatedData.stops.length > 0
                    ? calculatedData.stops.map((s, i) => `<div><span>Stop ${i + 1}</span><span>${s}</span></div>`).join('')
                    : '';

                document.getElementById('booking-confirmation').innerHTML = `
                    <div><span>Name</span><span>${name}</span></div>
                    <div><span>Phone</span><span>${phone}</span></div>
                    <div class="confirmation-divider"></div>
                    <div><span>Pickup</span><span>${calculatedData.pickup}</span></div>
                    ${stopsHtml}
                    <div><span>Drop-off</span><span>${calculatedData.dropoff}</span></div>
                    <div class="confirmation-divider"></div>
                    <div><span>Distance</span><span>${calculatedData.distance}</span></div>
                    <div><span>Est. Time</span><span>${calculatedData.duration}</span></div>
                    <div><span>Scheduled</span><span>${scheduled}</span></div>
                    <div class="confirmation-fare"><span>Estimated Fare</span><span>${calculatedData.fare}</span></div>
                `;

                stepCalculator.classList.add('hidden');
                stepThankyou.classList.remove('hidden');
                lucide.createIcons();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                alert('Error: ' + data.message);
                mainBtn.textContent = 'Confirm Booking';
                mainBtn.disabled = false;
            }
        } catch {
            alert('Something went wrong. Please call us at 541-450-3693.');
            mainBtn.textContent = 'Confirm Booking';
            mainBtn.disabled = false;
        }
    }
});
