document.addEventListener('DOMContentLoaded', function() {
    const bookingForm = document.getElementById('bookingForm');
    const dateInput = document.getElementById('date');
    
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
    
    bookingForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(bookingForm);
        const selectedServices = Array.from(document.querySelectorAll('input[name="services"]:checked'))
            .map(cb => cb.value);
        
        const appointmentData = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            services: selectedServices,  // array of selected services
            date: formData.get('date'),
            time: formData.get('time')
        };
        
        if (!validateForm(appointmentData)) return;
        
        try {
            const submitBtn = document.querySelector('.submit-btn');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Booking...';
            submitBtn.disabled = true;
            
            const response = await fetch('/api/book', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(appointmentData)
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                showMessage('Appointment booked successfully! We will confirm your appointment soon.', 'success');
                bookingForm.reset();
            } else {
                showMessage(result.message || 'Failed to book appointment. Please try again.', 'error');
            }
            
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            
        } catch (error) {
            console.error('Error booking appointment:', error);
            showMessage('An error occurred. Please try again.', 'error');
            
            const submitBtn = document.querySelector('.submit-btn');
            submitBtn.textContent = 'Book Appointment';
            submitBtn.disabled = false;
        }
    });
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});


function validateForm(data) {
    // Check for empty fields
    for (const [key, value] of Object.entries(data)) {
        if (key === 'services') {
            if (!value || !Array.isArray(value) || value.length === 0) {
                showMessage('Please select at least one service.', 'error');
                return false;
            }
            continue;
        }
        if (!value || value.trim() === '') {
            showMessage(`Please fill in the ${key} field.`, 'error');
            return false;
        }
    }

    // Name validation: alphabets and spaces only
    const nameRegex = /^[A-Za-z\s]+$/;
    if (!nameRegex.test(data.name)) {
        showMessage('Name should contain only alphabets.', 'error');
        return false;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
        showMessage('Please enter a valid email address.', 'error');
        return false;
    }
    
    // Phone number validation: digits, spaces, +, -, parentheses; at least 10 digits
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(data.phone) || data.phone.replace(/\D/g, '').length < 10) {
        showMessage('Please enter a valid phone number.', 'error');
        return false;
    }

    // Date validation: must be today or in future
    const selectedDate = new Date(data.date);
    const today = new Date();
    today.setHours(0,0,0,0);
    if (selectedDate < today) {
        showMessage('Please select a future date.', 'error');
        return false;
    }
    
    return true;
}

function showMessage(message, type) {
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    const formContainer = document.querySelector('.booking-form-container');
    formContainer.parentNode.insertBefore(messageDiv, formContainer);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
    
    messageDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
