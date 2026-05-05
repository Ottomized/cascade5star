document.addEventListener('DOMContentLoaded', () => {
    const WEB3FORMS_KEY = '9a7c5878-9777-40a3-95b8-8faac6537dfa';
    const PER_MILE = 2.50;

    // State
    let calculatedData = {};

    // Elements
    const pickupInput = document.getElementById('pickup-input');
    const dropoffInput = document.getElementById('dropoff-input');
    const calculateBtn = document.getElementById('calculate-btn');
    const resultContainer = document.getElementById('calculator-result');
    const resultDistance = document.getElementById('result-distance');
    const resultTime = document.getElementById('result-time');
    const resultFare = document.getElementById('result-fare');
    const stepCalculator = document.getElementById('step-calculator');
    const stepThankyou = document.getElementById('step-thankyou');
    const customerName = document.getElementById('customer-name');
    const customerPhone = document.getElementById('customer-phone');
    const confirmBtn = document.getElementById('confirm-btn');

    // Navbar scroll
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        navbar.style.background = window.scrollY > 50
            ? 'rgba(0, 0, 0, 0.95)'
            : 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)';
        navbar.style.padding = window.scrollY > 50 ? '20px 40px' : '30px 40px';
    });

    // Mobile menu
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
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

    // --- Step 1: Fare Calculator ---
    const initCalculator = () => {
        if (typeof google === 'undefined' || !google.maps) {
            setTimeout(initCalculator, 300);
            return;
        }

        calculateBtn.addEventListener('click', () => {
            const origin = pickupInput.value;
            const destination = dropoffInput.value;

            if (!origin || !destination) {
                alert('Please enter both pickup and drop-off locations.');
                return;
            }

            calculateBtn.textContent = 'Calculating...';
            calculateBtn.disabled = true;

            new google.maps.DistanceMatrixService().getDistanceMatrix({
                origins: [origin],
                destinations: [destination],
                travelMode: 'DRIVING',
                unitSystem: google.maps.UnitSystem.IMPERIAL,
            }, (response, status) => {
                calculateBtn.textContent = 'Calculate Fare';
                calculateBtn.disabled = false;

                if (status !== 'OK') {
                    alert('Error communicating with routing service. Please try again.');
                    return;
                }

                const result = response.rows[0].elements[0];
                if (result.status !== 'OK') {
                    alert('Could not calculate driving distance between these locations.');
                    return;
                }

                const distanceMiles = parseFloat(result.distance.text.replace(/[^0-9.]/g, ''));
                const fare = (distanceMiles * PER_MILE).toFixed(2);

                resultDistance.textContent = result.distance.text;
                resultTime.textContent = result.duration.text;
                resultFare.textContent = '$' + fare;
                resultContainer.classList.remove('hidden');

                calculatedData = {
                    pickup: origin,
                    dropoff: destination,
                    distance: result.distance.text,
                    duration: result.duration.text,
                    fare: '$' + fare,
                };
            });
        });
    };

    initCalculator();

    // --- Confirm & Send Email ---
    confirmBtn.addEventListener('click', async () => {
        const name = customerName.value.trim();
        const phone = customerPhone.value.trim();

        if (!name || !phone) {
            alert('Please enter your name and phone number.');
            return;
        }

        confirmBtn.textContent = 'Sending...';
        confirmBtn.disabled = true;

        const formData = new FormData();
        formData.append('access_key', WEB3FORMS_KEY);
        formData.append('subject', `New Booking Request from ${name}`);
        formData.append('from_name', '5 Star Rides');
        formData.append('name', name);
        formData.append('phone', phone);
        formData.append('pickup', calculatedData.pickup);
        formData.append('dropoff', calculatedData.dropoff);
        formData.append('distance', calculatedData.distance);
        formData.append('duration', calculatedData.duration);
        formData.append('fare', calculatedData.fare);

        try {
            const response = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();

            if (response.ok) {
                stepCalculator.classList.add('hidden');
                stepThankyou.classList.remove('hidden');
                lucide.createIcons();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                alert('Error: ' + data.message);
                confirmBtn.textContent = 'Confirm Booking';
                confirmBtn.disabled = false;
            }
        } catch {
            alert('Something went wrong. Please call us at 541-450-3693.');
            confirmBtn.textContent = 'Confirm Booking';
            confirmBtn.disabled = false;
        }
    });
});
