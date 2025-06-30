// Library Management System JavaScript

// Application data and state
let currentUser = null;
let currentUserType = null;
let seats = {};
let sessions = [];
let reservations = [];
let selectedSeat = null;
let updateInterval = null;

// Application data from JSON
const appData = {
  "students": [
    {"id": "STU001", "name": "John Smith", "email": "john.smith@university.edu", "password": "student123", "currentSession": null},
    {"id": "STU002", "name": "Emma Johnson", "email": "emma.johnson@university.edu", "password": "student123", "currentSession": null},
    {"id": "STU003", "name": "Michael Brown", "email": "michael.brown@university.edu", "password": "student123", "currentSession": null},
    {"id": "STU004", "name": "Sarah Davis", "email": "sarah.davis@university.edu", "password": "student123", "currentSession": null}
  ],
  "staff": [
    {"id": "STAFF001", "name": "Dr. Alice Wilson", "email": "alice.wilson@university.edu", "password": "staff123", "role": "Head Librarian"},
    {"id": "STAFF002", "name": "Bob Thompson", "email": "bob.thompson@university.edu", "password": "staff123", "role": "Assistant Librarian"}
  ],
  "studyAreas": {
    "quietStudy": {"name": "Quiet Study Area", "totalSeats": 40, "seats": []},
    "groupStudy": {"name": "Group Study Area", "totalSeats": 20, "seats": []},
    "computerLab": {"name": "Computer Lab", "totalSeats": 15, "seats": []},
    "studyRooms": {"name": "Study Rooms", "totalRooms": 5, "seatsPerRoom": 4, "rooms": []}
  },
  "seatStatuses": ["available", "occupied", "reserved"],
  "sessionDurations": [1, 2, 3, 4, 5, 6],
  "libraryStats": {
    "totalCapacity": 95,
    "currentOccupancy": 42,
    "peakHours": ["10:00-12:00", "14:00-16:00", "19:00-21:00"],
    "averageSessionDuration": 2.5,
    "popularAreas": ["Quiet Study", "Computer Lab", "Group Study"]
  }
};

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeSeats();
    setupEventListeners();
    showPage('loginPage');
});

// Initialize seat data
function initializeSeats() {
    // Initialize Quiet Study Area seats
    for (let i = 1; i <= 40; i++) {
        const seatId = `QS${i.toString().padStart(3, '0')}`;
        seats[seatId] = {
            id: seatId,
            area: 'quietStudy',
            status: Math.random() < 0.6 ? 'available' : 'occupied',
            userId: null,
            sessionId: null
        };
    }

    // Initialize Group Study Area seats
    for (let i = 1; i <= 20; i++) {
        const seatId = `GS${i.toString().padStart(3, '0')}`;
        seats[seatId] = {
            id: seatId,
            area: 'groupStudy',
            status: Math.random() < 0.4 ? 'available' : 'occupied',
            userId: null,
            sessionId: null
        };
    }

    // Initialize Computer Lab seats
    for (let i = 1; i <= 15; i++) {
        const seatId = `CL${i.toString().padStart(3, '0')}`;
        seats[seatId] = {
            id: seatId,
            area: 'computerLab',
            status: Math.random() < 0.5 ? 'available' : 'occupied',
            userId: null,
            sessionId: null
        };
    }

    // Initialize Study Rooms seats
    for (let room = 1; room <= 5; room++) {
        for (let seat = 1; seat <= 4; seat++) {
            const seatId = `SR${room}${seat}`;
            seats[seatId] = {
                id: seatId,
                area: 'studyRooms',
                room: room,
                status: Math.random() < 0.8 ? 'available' : 'occupied',
                userId: null,
                sessionId: null
            };
        }
    }

    // Create some sample reservations
    const availableSeats = Object.values(seats).filter(seat => seat.status === 'available');
    for (let i = 0; i < 8 && i < availableSeats.length; i++) {
        availableSeats[i].status = 'reserved';
        reservations.push({
            id: `RES${Date.now()}${i}`,
            seatId: availableSeats[i].id,
            userId: appData.students[i % appData.students.length].id,
            duration: 2,
            startTime: new Date(Date.now() + Math.random() * 3600000), // Random time within next hour
            createdAt: new Date()
        });
    }
}

// Setup event listeners
function setupEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Logout buttons
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    document.getElementById('staffLogoutBtn').addEventListener('click', handleLogout);
    
    // Navigation buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const section = this.dataset.section;
            showSection(section);
            updateNavigation(this);
        });
    });

    // Quick action buttons
    document.querySelectorAll('[data-section]').forEach(btn => {
        if (!btn.classList.contains('nav-btn')) {
            btn.addEventListener('click', function() {
                const section = this.dataset.section;
                showSection(section);
                updateNavigationBySection(section);
            });
        }
    });

    // Reservation form
    document.getElementById('findSeatsBtn').addEventListener('click', findAvailableSeats);
    document.getElementById('areaSelect').addEventListener('change', resetSeatSelection);
    
    // Modal buttons
    document.getElementById('confirmReservation').addEventListener('click', confirmReservation);
    document.getElementById('cancelReservation').addEventListener('click', closeModal);
    document.getElementById('simulateCheckin').addEventListener('click', handleCheckin);
    document.getElementById('cancelCheckin').addEventListener('click', closeModal);
    
    // Session actions
    document.getElementById('checkoutBtn').addEventListener('click', handleCheckout);
    document.getElementById('extendSession').addEventListener('click', extendSession);
}

// Authentication
function handleLogin(e) {
    e.preventDefault();
    
    const userType = document.getElementById('userType').value;
    const userId = document.getElementById('userId').value.trim();
    const password = document.getElementById('password').value.trim();
    
    let user = null;
    
    if (userType === 'student') {
        user = appData.students.find(s => s.id === userId && s.password === password);
    } else {
        user = appData.staff.find(s => s.id === userId && s.password === password);
    }
    
    if (user) {
        currentUser = user;
        currentUserType = userType;
        
        if (userType === 'student') {
            document.getElementById('currentUser').textContent = `Welcome, ${user.name}`;
            showPage('studentDashboard');
            renderFloorPlan();
            updateDashboardStats();
            loadSessionHistory();
            startRealTimeUpdates();
        } else {
            document.getElementById('currentStaff').textContent = `Welcome, ${user.name}`;
            showPage('staffDashboard');
            updateStaffDashboard();
            startRealTimeUpdates();
        }
        
        showNotification('Login successful!', 'success');
    } else {
        showNotification('Invalid credentials. Please try again.', 'error');
    }
}

function handleLogout() {
    currentUser = null;
    currentUserType = null;
    selectedSeat = null;
    stopRealTimeUpdates();
    
    // Reset forms
    document.getElementById('loginForm').reset();
    
    showPage('loginPage');
    showNotification('Logged out successfully', 'info');
}

// Page and section management
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
}

function showSection(sectionId) {
    const currentPage = currentUserType === 'student' ? 'studentDashboard' : 'staffDashboard';
    
    document.querySelectorAll(`#${currentPage} .section`).forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // Update content based on section
        if (sectionId === 'floorplan') {
            renderFloorPlan();
        } else if (sectionId === 'sessions') {
            loadSessionHistory();
        } else if (sectionId === 'reserve') {
            resetReservationForm();
        }
    }
}

function updateNavigation(activeBtn) {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    activeBtn.classList.add('active');
}

function updateNavigationBySection(sectionId) {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.section === sectionId) {
            btn.classList.add('active');
        }
    });
}

// Floor plan rendering
function renderFloorPlan() {
    renderAreaSeats('quietStudy', 'quietStudySeats', 8); // 8 columns
    renderAreaSeats('groupStudy', 'groupStudySeats', 5); // 5 columns
    renderAreaSeats('computerLab', 'computerLabSeats', 5); // 5 columns
    renderStudyRooms();
}

function renderAreaSeats(areaId, containerId, columns) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    const areaSeats = Object.values(seats).filter(seat => seat.area === areaId);
    
    areaSeats.forEach(seat => {
        const seatElement = document.createElement('div');
        seatElement.className = `seat ${seat.status}`;
        seatElement.textContent = seat.id.slice(-2); // Show last 2 digits
        seatElement.title = `Seat ${seat.id} - ${seat.status}`;
        
        if (seat.status === 'available') {
            seatElement.addEventListener('click', () => selectSeat(seat.id));
        }
        
        container.appendChild(seatElement);
    });
}

function renderStudyRooms() {
    const container = document.getElementById('studyRoomsSeats');
    container.innerHTML = '';
    
    for (let room = 1; room <= 5; room++) {
        const roomElement = document.createElement('div');
        roomElement.className = 'room';
        
        const roomTitle = document.createElement('h5');
        roomTitle.textContent = `Room ${room}`;
        roomElement.appendChild(roomTitle);
        
        const seatGrid = document.createElement('div');
        seatGrid.className = 'seat-grid';
        
        for (let seat = 1; seat <= 4; seat++) {
            const seatId = `SR${room}${seat}`;
            const seatData = seats[seatId];
            
            const seatElement = document.createElement('div');
            seatElement.className = `seat ${seatData.status}`;
            seatElement.textContent = seat;
            seatElement.title = `${seatId} - ${seatData.status}`;
            
            if (seatData.status === 'available') {
                seatElement.addEventListener('click', () => selectSeat(seatId));
            }
            
            seatGrid.appendChild(seatElement);
        }
        
        roomElement.appendChild(seatGrid);
        container.appendChild(roomElement);
    }
}

// Seat selection and reservation
function selectSeat(seatId) {
    if (currentUser.currentSession) {
        showNotification('You already have an active session', 'warning');
        return;
    }
    
    selectedSeat = seats[seatId];
    showReservationModal();
}

function showReservationModal() {
    const modal = document.getElementById('reservationModal');
    const details = document.getElementById('reservationDetails');
    
    const areaNames = {
        'quietStudy': 'Quiet Study Area',
        'groupStudy': 'Group Study Area', 
        'computerLab': 'Computer Lab',
        'studyRooms': 'Study Rooms'
    };
    
    details.innerHTML = `
        <p><strong>Seat:</strong> ${selectedSeat.id}</p>
        <p><strong>Area:</strong> ${areaNames[selectedSeat.area]}</p>
        <p><strong>Duration:</strong> 2 hours (default)</p>
        <p><strong>Status:</strong> Available</p>
    `;
    
    modal.classList.remove('hidden');
}

function confirmReservation() {
    if (!selectedSeat) return;
    
    const reservationId = `RES${Date.now()}`;
    const startTime = new Date();
    
    // Create reservation
    const reservation = {
        id: reservationId,
        seatId: selectedSeat.id,
        userId: currentUser.id,
        duration: 2,
        startTime: startTime,
        createdAt: new Date()
    };
    
    reservations.push(reservation);
    seats[selectedSeat.id].status = 'reserved';
    
    closeModal();
    showCheckinModal();
    renderFloorPlan();
    updateDashboardStats();
    
    showNotification(`Seat ${selectedSeat.id} reserved successfully!`, 'success');
}

function showCheckinModal() {
    const modal = document.getElementById('checkinModal');
    modal.classList.remove('hidden');
}

function handleCheckin() {
    if (!selectedSeat) return;
    
    const sessionId = `SES${Date.now()}`;
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + (2 * 60 * 60 * 1000)); // 2 hours
    
    // Create session
    const session = {
        id: sessionId,
        seatId: selectedSeat.id,
        userId: currentUser.id,
        startTime: startTime,
        endTime: endTime,
        duration: 2,
        status: 'active'
    };
    
    sessions.push(session);
    currentUser.currentSession = session;
    seats[selectedSeat.id].status = 'occupied';
    seats[selectedSeat.id].userId = currentUser.id;
    seats[selectedSeat.id].sessionId = sessionId;
    
    // Remove reservation
    reservations = reservations.filter(res => res.seatId !== selectedSeat.id);
    
    closeModal();
    updateSessionDisplay();
    renderFloorPlan();
    updateDashboardStats();
    
    showNotification('Check-in successful! Session started.', 'success');
    selectedSeat = null;
}

function handleCheckout() {
    if (!currentUser.currentSession) return;
    
    const session = currentUser.currentSession;
    session.status = 'completed';
    session.actualEndTime = new Date();
    
    // Free up the seat
    seats[session.seatId].status = 'available';
    seats[session.seatId].userId = null;
    seats[session.seatId].sessionId = null;
    
    currentUser.currentSession = null;
    
    updateSessionDisplay();
    renderFloorPlan();
    updateDashboardStats();
    
    showNotification('Session ended successfully!', 'success');
}

function extendSession() {
    if (!currentUser.currentSession) return;
    
    const session = currentUser.currentSession;
    session.endTime = new Date(session.endTime.getTime() + (60 * 60 * 1000)); // Add 1 hour
    session.duration += 1;
    
    updateSessionDisplay();
    showNotification('Session extended by 1 hour', 'success');
}

// Reservation form
function findAvailableSeats() {
    const area = document.getElementById('areaSelect').value;
    const duration = document.getElementById('durationSelect').value;
    
    if (!area) {
        showNotification('Please select a study area', 'warning');
        return;
    }
    
    const availableSeats = Object.values(seats).filter(seat => 
        seat.area === area && seat.status === 'available'
    );
    
    if (availableSeats.length === 0) {
        showNotification('No available seats in this area', 'warning');
        return;
    }
    
    renderAvailableSeats(availableSeats, duration);
}

function renderAvailableSeats(availableSeats, duration) {
    const container = document.getElementById('availableSeatsList');
    const wrapper = document.getElementById('availableSeatsContainer');
    
    container.innerHTML = '';
    
    availableSeats.forEach(seat => {
        const seatOption = document.createElement('div');
        seatOption.className = 'seat-option';
        seatOption.innerHTML = `
            <div>
                <strong>${seat.id}</strong>
                <br>
                <small>${duration} hours</small>
            </div>
        `;
        
        seatOption.addEventListener('click', function() {
            container.querySelectorAll('.seat-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            this.classList.add('selected');
            selectedSeat = seat;
        });
        
        container.appendChild(seatOption);
    });
    
    wrapper.classList.remove('hidden');
    
    // Add reserve button
    let reserveBtn = document.getElementById('reserveSelectedBtn');
    if (!reserveBtn) {
        reserveBtn = document.createElement('button');
        reserveBtn.id = 'reserveSelectedBtn';
        reserveBtn.className = 'btn btn--primary btn--full-width';
        reserveBtn.textContent = 'Reserve Selected Seat';
        reserveBtn.addEventListener('click', function() {
            if (selectedSeat) {
                showReservationModal();
            } else {
                showNotification('Please select a seat first', 'warning');
            }
        });
        wrapper.appendChild(reserveBtn);
    }
}

function resetSeatSelection() {
    selectedSeat = null;
    document.getElementById('availableSeatsContainer').classList.add('hidden');
}

function resetReservationForm() {
    document.getElementById('areaSelect').value = '';
    document.getElementById('durationSelect').value = '2';
    resetSeatSelection();
}

// Dashboard updates
function updateDashboardStats() {
    const totalSeats = Object.keys(seats).length;
    const occupiedSeats = Object.values(seats).filter(seat => seat.status === 'occupied').length;
    const reservedSeats = Object.values(seats).filter(seat => seat.status === 'reserved').length;
    const availableSeats = totalSeats - occupiedSeats - reservedSeats;
    const occupancyRate = Math.round((occupiedSeats / totalSeats) * 100);
    
    document.getElementById('availableSeats').textContent = availableSeats;
    document.getElementById('occupancyRate').textContent = `${occupancyRate}%`;
    document.getElementById('occupancyProgress').style.width = `${occupancyRate}%`;
}

function updateSessionDisplay() {
    const noSession = document.getElementById('noSession');
    const activeSession = document.getElementById('activeSession');
    
    if (currentUser.currentSession) {
        noSession.classList.add('hidden');
        activeSession.classList.remove('hidden');
        
        const session = currentUser.currentSession;
        const areaNames = {
            'quietStudy': 'Quiet Study Area',
            'groupStudy': 'Group Study Area',
            'computerLab': 'Computer Lab',
            'studyRooms': 'Study Rooms'
        };
        
        document.getElementById('currentSeat').textContent = session.seatId;
        document.getElementById('currentArea').textContent = areaNames[seats[session.seatId].area];
        
        updateSessionTimer();
    } else {
        noSession.classList.remove('hidden');
        activeSession.classList.add('hidden');
    }
}

function updateSessionTimer() {
    if (!currentUser.currentSession) return;
    
    const session = currentUser.currentSession;
    const now = new Date();
    const timeLeft = session.endTime - now;
    
    if (timeLeft <= 0) {
        document.getElementById('timeRemaining').textContent = 'Session expired';
        return;
    }
    
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    
    document.getElementById('timeRemaining').textContent = `${hours}h ${minutes}m`;
}

function loadSessionHistory() {
    const container = document.getElementById('sessionHistory');
    const userSessions = sessions.filter(session => session.userId === currentUser.id);
    
    if (userSessions.length === 0) {
        container.innerHTML = '<p class="text-center">No session history found.</p>';
        return;
    }
    
    container.innerHTML = '';
    
    userSessions.reverse().forEach(session => {
        const sessionItem = document.createElement('div');
        sessionItem.className = 'session-item';
        
        const endTime = session.actualEndTime || session.endTime;
        const duration = Math.round((endTime - session.startTime) / (1000 * 60 * 60 * 100)) / 10;
        
        sessionItem.innerHTML = `
            <div class="session-details">
                <h6>Seat ${session.seatId}</h6>
                <p>Date: ${session.startTime.toLocaleDateString()}</p>
                <p>Duration: ${duration} hours</p>
                <p>Status: <span class="status status--${session.status === 'active' ? 'success' : 'info'}">${session.status}</span></p>
            </div>
        `;
        
        container.appendChild(sessionItem);
    });
}

// Staff dashboard
function updateStaffDashboard() {
    updateAreaBreakdown();
    updateActiveSessionsList();
}

function updateAreaBreakdown() {
    const container = document.getElementById('areaBreakdown');
    
    const areas = {
        'quietStudy': 'Quiet Study',
        'groupStudy': 'Group Study', 
        'computerLab': 'Computer Lab',
        'studyRooms': 'Study Rooms'
    };
    
    container.innerHTML = '';
    
    Object.entries(areas).forEach(([areaId, areaName]) => {
        const areaSeats = Object.values(seats).filter(seat => seat.area === areaId);
        const occupied = areaSeats.filter(seat => seat.status === 'occupied').length;
        const total = areaSeats.length;
        const utilization = Math.round((occupied / total) * 100);
        
        const areaDiv = document.createElement('div');
        areaDiv.className = 'area-stat';
        areaDiv.innerHTML = `
            <h5>${areaName}</h5>
            <span class="stat-value">${occupied}/${total}</span>
            <small>${utilization}%</small>
        `;
        
        container.appendChild(areaDiv);
    });
}

function updateActiveSessionsList() {
    const container = document.getElementById('activeSessionsList');
    const activeSessions = sessions.filter(session => session.status === 'active');
    
    if (activeSessions.length === 0) {
        container.innerHTML = '<p class="text-center">No active sessions.</p>';
        return;
    }
    
    container.innerHTML = '';
    
    activeSessions.forEach(session => {
        const user = appData.students.find(s => s.id === session.userId);
        const timeElapsed = Math.round((new Date() - session.startTime) / (1000 * 60));
        
        const sessionItem = document.createElement('div');
        sessionItem.className = 'active-session-item';
        sessionItem.innerHTML = `
            <div class="session-user-info">
                <h6>${user ? user.name : 'Unknown User'}</h6>
                <p>Seat: ${session.seatId}</p>
                <p>Started: ${session.startTime.toLocaleTimeString()}</p>
                <p>Elapsed: ${timeElapsed} minutes</p>
            </div>
            <div class="session-actions">
                <button class="btn btn--outline btn--sm" onclick="endSessionAsStaff('${session.id}')">End Session</button>
            </div>
        `;
        
        container.appendChild(sessionItem);
    });
}

function endSessionAsStaff(sessionId) {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;
    
    session.status = 'completed';
    session.actualEndTime = new Date();
    
    // Free up the seat
    seats[session.seatId].status = 'available';
    seats[session.seatId].userId = null;
    seats[session.seatId].sessionId = null;
    
    // Update user's current session if it's this one
    const user = appData.students.find(s => s.id === session.userId);
    if (user && user.currentSession && user.currentSession.id === sessionId) {
        user.currentSession = null;
    }
    
    updateStaffDashboard();
    renderFloorPlan();
    updateDashboardStats();
    
    showNotification('Session ended by staff', 'info');
}

// Real-time updates
function startRealTimeUpdates() {
    updateInterval = setInterval(() => {
        // Simulate some seat status changes
        simulateRealTimeChanges();
        
        // Update displays
        if (currentUserType === 'student') {
            updateDashboardStats();
            updateSessionTimer();
        } else {
            updateStaffDashboard();
        }
        
        // Re-render floor plan if visible
        const floorplanSection = document.getElementById('floorplan');
        if (floorplanSection && floorplanSection.classList.contains('active')) {
            renderFloorPlan();
        }
    }, 30000); // Update every 30 seconds
}

function stopRealTimeUpdates() {
    if (updateInterval) {
        clearInterval(updateInterval);
        updateInterval = null;
    }
}

function simulateRealTimeChanges() {
    // Randomly change some seat statuses to simulate real-time activity
    const availableSeats = Object.values(seats).filter(seat => seat.status === 'available');
    const occupiedSeats = Object.values(seats).filter(seat => seat.status === 'occupied');
    
    // Sometimes make occupied seats available
    if (occupiedSeats.length > 0 && Math.random() < 0.1) {
        const randomSeat = occupiedSeats[Math.floor(Math.random() * occupiedSeats.length)];
        randomSeat.status = 'available';
        randomSeat.userId = null;
        randomSeat.sessionId = null;
    }
    
    // Sometimes make available seats occupied
    if (availableSeats.length > 0 && Math.random() < 0.05) {
        const randomSeat = availableSeats[Math.floor(Math.random() * availableSeats.length)];
        randomSeat.status = 'occupied';
    }
}

// Modal management
function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.add('hidden');
    });
    selectedSeat = null;
}

// Notification system
function showNotification(message, type = 'info', duration = 5000) {
    const container = document.getElementById('notifications');
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, duration);
}

// Global functions for inline event handlers
window.endSessionAsStaff = endSessionAsStaff;

// Initialize session timer update
setInterval(() => {
    if (currentUser && currentUser.currentSession) {
        updateSessionTimer();
    }
}, 60000); // Update every minute