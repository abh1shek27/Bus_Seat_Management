// Global variables
let seats = [];
let students = [];
let routes = [];
let selectedRouteFilter = '';

// Helper function to get auth headers
function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// DOM elements
const seatGrid = document.getElementById('seatGrid');
const studentsList = document.getElementById('studentsList');
const routesList = document.getElementById('routesList');
const routeFilter = document.getElementById('routeFilter');
const totalSeatsEl = document.getElementById('totalSeats');
const occupiedSeatsEl = document.getElementById('occupiedSeats');
const availableSeatsEl = document.getElementById('availableSeats');

// Modal elements
const studentModal = document.getElementById('studentModal');
const routeModal = document.getElementById('routeModal');
const seatModal = document.getElementById('seatModal');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }
    
    initializeApp();
    setupEventListeners();
});

// Initialize the application
async function initializeApp() {
    try {
        await loadData();

        // Apply route filter immediately after loading
        if (selectedRouteFilter) {
            seats = seats.filter(seat => getId(seat.routeId) === selectedRouteFilter);
        }

        renderSeats();
        renderStudents();
        renderRoutes();
        updateStats();
        populateRouteFilter();
    } catch (error) {
        console.error('Error initializing app:', error);
        showMessage('Error loading data. Please refresh the page.', 'error');
    }
}


// Helper to normalize id fields (_id vs id)
function getId(obj) {
    if (!obj) return null;
    if (typeof obj === 'string') return obj;
    if (obj.$oid) return obj.$oid; // For Mongo ObjectId objects
    if (obj._id && obj._id.$oid) return obj._id.$oid;
    return obj._id || obj.id || null;
}

// Load data from server
async function loadData() {
    try {
        const [seatsResponse, studentsResponse, routesResponse] = await Promise.all([
            fetch('/api/seats', { headers: getAuthHeaders() }),
            fetch('/api/students', { headers: getAuthHeaders() }),
            fetch('/api/routes', { headers: getAuthHeaders() })
        ]);

        // Check if any response is unauthorized
        if (seatsResponse.status === 401 || studentsResponse.status === 401 || routesResponse.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
            return;
        }

        seats = await seatsResponse.json();
        students = await studentsResponse.json();
        routes = await routesResponse.json();

        // Ensure each seat has a displayNumber:
        // - Prefer seat.number or seat.seatNumber if provided by backend
        // - Otherwise assign sequential numbers 1..N in the order returned
        const hasNumberField = seats.some(s => s.number !== undefined || s.seatNumber !== undefined);
        if (hasNumberField) {
            seats = seats.map((s, idx) => ({
                ...s,
                displayNumber: s.number ?? s.seatNumber ?? (idx + 1)
            }));
        } else {
            seats = seats.map((s, idx) => ({
                ...s,
                displayNumber: idx + 1
            }));
        }
    } catch (error) {
        console.error('Error loading data:', error);
        throw error;
    }
}

// Setup event listeners
function setupEventListeners() {
    // Modal buttons
    document.getElementById('addStudentBtn').addEventListener('click', () => openModal(studentModal));
    document.getElementById('addRouteBtn').addEventListener('click', () => openModal(routeModal));
    
    // Form submissions
    document.getElementById('studentForm').addEventListener('submit', handleAddStudent);
    document.getElementById('routeForm').addEventListener('submit', handleAddRoute);
    
    // Modal close buttons
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => closeAllModals());
    });
    
    // Cancel buttons
    document.getElementById('cancelStudent').addEventListener('click', () => closeAllModals());
    document.getElementById('cancelRoute').addEventListener('click', () => closeAllModals());
    
    // Action buttons
    document.getElementById('resetSeatsBtn').addEventListener('click', handleResetSeats);
    document.getElementById('exportBtn').addEventListener('click', handleExportData);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Route filter
    routeFilter.addEventListener('change', handleRouteFilterChange);
    
    // Close modals when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) {
            closeAllModals();
        }
    });
}

// Render seats grid
// Render seat grid
function renderSeats() {
    seatGrid.innerHTML = '';

    // Filter seats by selected route if any
    const filteredSeats = selectedRouteFilter
        ? seats.filter(seat => getId(seat.routeId) === selectedRouteFilter)
        : seats;

    filteredSeats.forEach(seat => {
        const seatEl = createSeatElement(seat);
        seatGrid.appendChild(seatEl);
    });
}

// Create individual seat element
function createSeatElement(seat) {
    const seatDiv = document.createElement('div');
    seatDiv.className = `seat ${seat.isOccupied ? 'occupied' : 'available'}`;
    seatDiv.dataset.seatId = getId(seat);

    const student = students.find(s => getId(s._id) === getId(seat.studentId));
    const displayNumber = seat.displayNumber || seat.seatNumber || getId(seat);

    seatDiv.innerHTML = `
        <div class="seat-number">${displayNumber}</div>
        ${seat.isOccupied && student ? `<div class="student-name">${student.name}</div>` : ''}
    `;

    seatDiv.addEventListener('click', () => handleSeatClick(seat));

    return seatDiv;
}



// Handle seat click
function handleSeatClick(seat) {
    const displayNumber = seat.displayNumber || seat.seatNumber || getId(seat);
    const student = students.find(s => getId(s._id) === getId(seat.studentId));
    const route = routes.find(r => getId(r._id) === getId(seat.routeId));
    const modalContent = document.getElementById('seatModalContent');

    if (seat.isOccupied) {
        modalContent.innerHTML = `
            <div class="seat-assignment">
                <h4>Seat ${displayNumber}</h4>
                <p><strong>Occupied by:</strong> ${student ? student.name : 'Unknown'}</p>
                <p><strong>Grade:</strong> ${student ? student.grade : 'N/A'}</p>
                <p><strong>Route:</strong> ${route ? route.name : 'N/A'}</p>
                <button class="btn btn-danger" onclick="handleRemoveSeat('${getId(seat)}')">Remove Assignment</button>
                <button class="btn btn-secondary" onclick="closeAllModals()">Cancel</button>
            </div>
        `;
    } else {
        // Only students from the same route or unassigned students
        const availableStudents = students.filter(s => {
            const studentHasSeat = seats.some(se => getId(se.studentId) === getId(s._id));
            const sameRoute = getId(s.routeId) === getId(seat.routeId);
            return !studentHasSeat && sameRoute;
        });

        if (availableStudents.length === 0) {
            modalContent.innerHTML = `
                <div class="seat-assignment">
                    <h4>Seat ${displayNumber}</h4>
                    <p>No available students to assign for this route.</p>
                    <button class="btn btn-secondary" onclick="closeAllModals()">Close</button>
                </div>
            `;
        } else {
            const options = availableStudents.map(s => {
                return `<option value="${getId(s._id)}">${s.name} (${s.grade})</option>`;
            }).join('');

            modalContent.innerHTML = `
                <div class="seat-assignment">
                    <h4>Seat ${displayNumber}</h4>
                    <label for="studentSelect">Select Student:</label>
                    <select id="studentSelect">${options}</select>
                    <button class="btn btn-primary" onclick="handleAssignSeat('${getId(seat)}')">Assign Seat</button>
                    <button class="btn btn-secondary" onclick="closeAllModals()">Cancel</button>
                </div>
            `;
        }
    }

    openModal(seatModal);
}

// Handle seat assignment
async function handleAssignSeat(seatId) {
    const studentSelect = document.getElementById('studentSelect');
    const studentId = studentSelect.value;

    if (!studentId) {
        showMessage('Please select a student.', 'error');
        return;
    }

    const seat = seats.find(s => getId(s) === seatId);
    if (!seat) return showMessage('Seat not found', 'error');

    try {
        const response = await fetch('/api/assign-seat', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                seatId: seatId,
                studentId: studentId,
                routeId: seat.routeId
            })
        });

        const result = await response.json();
        if (response.ok && result.success) {
            await loadData();
            renderSeats();
            renderStudents();
            renderRoutes();
            updateStats();
            closeAllModals();
            showMessage('Seat assigned successfully!', 'success');
        } else {
            showMessage(result.error || 'Failed to assign seat.', 'error');
        }
    } catch (err) {
        console.error(err);
        showMessage('Error assigning seat. Please try again.', 'error');
    }
}


// Handle seat removal
async function handleRemoveSeat(seatId) {
    try {
        const response = await fetch('/api/remove-seat', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ seatId })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            await loadData();
            renderSeats();
            renderStudents();
            updateStats();
            renderRoutes();
            closeAllModals();
            showMessage('Seat assignment removed successfully!', 'success');
        } else {
            showMessage(result.error || 'Failed to remove seat assignment.', 'error');
        }
    } catch (error) {
        console.error('Error removing seat:', error);
        showMessage('Error removing seat assignment. Please try again.', 'error');
    }
}

// Render students list
function renderStudents() {
    studentsList.innerHTML = '';

    students.forEach(student => {
        const studentId = getId(student._id);
        const routeId = getId(student.routeId);

        // Find assigned seat
        const assignedSeat = seats.find(seat => getId(seat.studentId) === studentId);

        // Find route
        const route = routes.find(r => getId(r._id) === routeId);

        const studentDiv = document.createElement('div');
        studentDiv.className = 'list-item';
        studentDiv.innerHTML = `
            <div class="item-info">
                <div class="item-name">${student.name}</div>
                <div class="item-details">
                    ${student.grade} • ${route ? route.name : 'No Route'}
                    ${assignedSeat ? ` • Seat ${assignedSeat.displayNumber ?? assignedSeat.seatNumber}` : ' • No seat assigned'}
                </div>
            </div>
        `;

        studentsList.appendChild(studentDiv);
    });
}


// Render routes list
function renderRoutes() {
    routesList.innerHTML = '';

    routes.forEach(route => {
        const routeId = getId(route._id);

        // All students assigned to this route
        const routeStudents = students.filter(s => getId(s.routeId) === routeId);

        // Students with assigned seats
        const assignedStudents = routeStudents.filter(s =>
            seats.some(seat => getId(seat.studentId) === getId(s._id))
        );

        const routeDiv = document.createElement('div');
        routeDiv.className = 'list-item';
        routeDiv.innerHTML = `
            <div class="item-info">
                <div class="item-name">${route.name}</div>
                <div class="item-details">
                    ${assignedStudents.length}/${routeStudents.length} students assigned
                </div>
            </div>
        `;

        routesList.appendChild(routeDiv);
    });
}

// Populate route filter
function populateRouteFilter() {
    routeFilter.innerHTML = ''; // clear existing options
    
    routes.forEach(route => {
        const option = document.createElement('option');
        option.value = route._id || route.id;
        option.textContent = route.name;
        routeFilter.appendChild(option);
    });

    // Restore previously selected route from localStorage
    const savedRoute = localStorage.getItem('selectedRouteFilter');
    if (savedRoute && routes.some(r => getId(r._id) === savedRoute)) {
        selectedRouteFilter = savedRoute;
    } else if (routes.length > 0) {
        selectedRouteFilter = getId(routes[0]._id); // only default if no saved route
    }

    // Set the dropdown value to match selectedRouteFilter
    routeFilter.value = selectedRouteFilter;

    // Render seats and stats for the selected route
    renderSeats();
    updateStats();
}

// Handle route filter change
function handleRouteFilterChange() {
    selectedRouteFilter = routeFilter.value;
    localStorage.setItem('selectedRouteFilter', selectedRouteFilter); // persist selected route
    renderSeats();
    updateStats();
}

// Update statistics
function updateStats() {
    // Only consider seats of the selected route
    const filteredSeats = selectedRouteFilter
        ? seats.filter(seat => getId(seat.routeId) === selectedRouteFilter)
        : seats;

    const total = filteredSeats.length;
    const occupied = filteredSeats.filter(s => s.isOccupied).length;
    const available = total - occupied;

    totalSeatsEl.textContent = total;
    occupiedSeatsEl.textContent = occupied;
    availableSeatsEl.textContent = available;
}

// Handle add student
async function handleAddStudent(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const studentData = {
        name: formData.get('studentName') || document.getElementById('studentName').value,
        grade: formData.get('studentGrade') || document.getElementById('studentGrade').value,
        routeId: formData.get('studentRoute') || document.getElementById('studentRoute').value
    };
    
    if (!studentData.name || !studentData.grade || !studentData.routeId) {
        showMessage('Please fill in all fields.', 'error');
        return;
    }
    
    if (studentData.routeId === 'undefined' || studentData.routeId === '') {
        showMessage('Please select a valid route. If no routes are available, add a route first.', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/students', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(studentData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            await loadData();
            renderStudents();
            populateRouteFilter();
            closeAllModals();
            event.target.reset();
            showMessage('Student added successfully!', 'success');
        } else {
            showMessage(result.error || 'Failed to add student.', 'error');
        }
    } catch (error) {
        console.error('Error adding student:', error);
        showMessage('Error adding student. Please try again.', 'error');
    }
}

// Handle add route
async function handleAddRoute(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const routeData = {
        name: formData.get('routeName') || document.getElementById('routeName').value,
        capacity: parseInt(formData.get('routeCapacity') || document.getElementById('routeCapacity').value, 10)
    };
    
    if (!routeData.name || !routeData.capacity || routeData.capacity <= 0) {
        showMessage('Please provide a valid route name and capacity.', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/routes', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(routeData)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            await loadData();           // reload routes, seats, students
            renderRoutes();             // render routes panel
            populateRouteFilter();      // update route filter dropdown
            closeAllModals();           // close the modal
            event.target.reset();       // reset the form
            showMessage(`Route added successfully with ${result.seatsCreated} seats!`, 'success');
        } else {
            showMessage(result.error || 'Failed to add route.', 'error');
        }
    } catch (error) {
        console.error('Error adding route:', error);
        showMessage('Error adding route. Please try again.', 'error');
    }
}

// Handle reset seats
async function handleResetSeats() {
    if (!confirm('Are you sure you want to reset all seat assignments? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch('/api/reset-seats', {
            method: 'POST',
            headers: getAuthHeaders()
        });
        
        const result = await response.json();
        
        if (response.ok) {
            await loadData();
            renderSeats();
            renderStudents();
            renderRoutes();
            updateStats();
            showMessage('All seats have been reset successfully!', 'success');
        } else {
            showMessage(result.error || 'Failed to reset seats.', 'error');
        }
    } catch (error) {
        console.error('Error resetting seats:', error);
        showMessage('Error resetting seats. Please try again.', 'error');
    }
}

// Handle export data
async function handleExportData() {
    try {
        // Import jsPDF
        const { jsPDF } = window.jspdf;

        // Create a new PDF instance
        const doc = new jsPDF();

        // Add title
        doc.setFontSize(16);
        doc.text("Bus Seat Allotment Data", 14, 20);

        // Add export date
        doc.setFontSize(10);
        doc.text(`Export Date: ${new Date().toLocaleString()}`, 14, 28);

        let y = 36; // starting y position for content

        // Routes
        doc.setFontSize(12);
        doc.text("Routes:", 14, y);
        y += 6;
        routes.forEach(r => {
            doc.text(`- ${r.name} (Capacity: ${r.capacity})`, 18, y);
            y += 6;
        });

        y += 4; // extra space

        // Students
        doc.text("Students:", 14, y);
        y += 6;
        students.forEach(s => {
            const route = routes.find(r => getId(r._id) === getId(s.routeId));
            const seat = seats.find(seat => getId(seat.studentId) === getId(s._id));
            doc.text(
                `- ${s.name} (${s.grade}) | Route: ${route ? route.name : 'N/A'} | Seat: ${seat ? seat.displayNumber : 'N/A'}`,
                18,
                y
            );
            y += 6;
            // Add new page if y exceeds page height
            if (y > 280) {
                doc.addPage();
                y = 20;
            }
        });

        y += 4;

        // Seats summary
        doc.text("Seats:", 14, y);
        y += 6;
        seats.forEach(seat => {
            const student = students.find(s => getId(s._id) === getId(seat.studentId));
            const route = routes.find(r => getId(r._id) === getId(seat.routeId));
            doc.text(
                `- Seat ${seat.displayNumber} | Route: ${route ? route.name : 'N/A'} | Assigned: ${seat.isOccupied && student ? student.name : 'Empty'}`,
                18,
                y
            );
            y += 6;
            if (y > 280) {
                doc.addPage();
                y = 20;
            }
        });

        // Save PDF
        doc.save(`bus-seat-data-${new Date().toISOString().split('T')[0]}.pdf`);

        showMessage('Data exported successfully as PDF!', 'success');

    } catch (error) {
        console.error(error);
        showMessage('Error exporting PDF. Please try again.', 'error');
    }
}

// Modal functions
function openModal(modal) {
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
    document.body.style.overflow = 'auto';
}

// Show message
function showMessage(message, type = 'success') {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    // Insert at the top of the container
    const container = document.querySelector('.container');
    container.insertBefore(messageDiv, container.firstChild);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

// Populate student route dropdown
function populateStudentRouteDropdown() {
    const studentRouteSelect = document.getElementById('studentRoute');
    studentRouteSelect.innerHTML = '<option value="">Select Route</option>';
    
    if (routes.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No routes available - Add a route first';
        option.disabled = true;
        studentRouteSelect.appendChild(option);
    } else {
        routes.forEach(route => {
            const option = document.createElement('option');
            option.value = route._id || route.id; // Handle both _id and id
            option.textContent = route.name;
            studentRouteSelect.appendChild(option);
        });
    }
}

// Update student route dropdown when modal opens
document.getElementById('addStudentBtn').addEventListener('click', () => {
    populateStudentRouteDropdown();
});

// Handle logout
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('token');
        window.location.href = '/login';
    }
}