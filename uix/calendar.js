/**
 * Calendar Overlay System
 *
 * MyDayHub - Calendar Events Management
 *
 * @version 8.0 Herradura
 * @author Alex & Gemini & Claude & Cursor
 */

// Global calendar state
let currentCalendarMonth = new Date();
let calendarEvents = [];
let calendarPreferences = {};

/**
 * Initialize calendar overlay system
 */
async function initCalendarOverlay() {
    // Set up event listeners first
    setupCalendarEventListeners();
    
    // Load calendar preferences and wait for completion
    await loadCalendarPreferences();
    
    // Load today's events for badge indicator
    await loadTodayEvents();
}

/**
 * Set up event listeners for calendar functionality
 */
function setupCalendarEventListeners() {
	// Setup calendar event listeners
    
    // Calendar badge click
    const calendarBadge = document.getElementById('btn-calendar-badge');
    if (calendarBadge) {
        // Calendar badge found
        calendarBadge.addEventListener('click', openCalendarOverlayModal);
    } else {
        console.error('Calendar badge not found!');
    }
    
    // Settings button click
    const settingsBtn = document.getElementById('btn-calendar-overlays');
    if (settingsBtn) {
        // Calendar Overlays settings button found
        settingsBtn.addEventListener('click', openCalendarOverlayModal);
    } else {
        console.error('Calendar Overlays settings button not found!');
    }
    
    // Calendar overlay modal close
    const closeBtn = document.getElementById('calendar-overlay-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeCalendarOverlayModal);
    }
    
    // Calendar tabs
    const calendarTabs = document.querySelectorAll('.calendar-tab');
    calendarTabs.forEach(tab => {
        tab.addEventListener('click', () => switchCalendarTab(tab.dataset.tab));
    });
    
    // Calendar navigation
    const prevBtn = document.getElementById('btn-prev-month');
    const nextBtn = document.getElementById('btn-next-month');
    if (prevBtn) prevBtn.addEventListener('click', () => navigateCalendar(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => navigateCalendar(1));
    
    // Add event button
    const addEventBtn = document.getElementById('btn-add-event');
    if (addEventBtn) {
        addEventBtn.addEventListener('click', openAddEventModal);
    }
    
    // Import JSON button
    const importJsonBtn = document.getElementById('btn-import-json');
    if (importJsonBtn) {
        importJsonBtn.addEventListener('click', openJsonImportModal);
    }
    
    // Event form
    const eventForm = document.getElementById('event-form');
    if (eventForm) {
        eventForm.addEventListener('submit', handleEventFormSubmit);
    }
    
    // Event modal close
    const eventCloseBtn = document.getElementById('event-modal-close-btn');
    const eventCancelBtn = document.getElementById('btn-event-cancel');
    const eventDeleteBtn = document.getElementById('btn-event-delete');
    
    if (eventCloseBtn) eventCloseBtn.addEventListener('click', closeEventModal);
    if (eventCancelBtn) eventCancelBtn.addEventListener('click', closeEventModal);
    if (eventDeleteBtn) eventDeleteBtn.addEventListener('click', handleDeleteEvent);
    
    // Preference checkboxes
    const prefCheckboxes = document.querySelectorAll('.preference-item input[type="checkbox"]');
    prefCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', handlePreferenceChange);
    });
    
    // JSON Import modal
    const jsonImportCloseBtn = document.getElementById('json-import-modal-close-btn');
    const jsonImportCancelBtn = document.getElementById('btn-import-cancel');
    const jsonImportPreviewBtn = document.getElementById('btn-import-preview');
    const jsonImportExecuteBtn = document.getElementById('btn-import-execute');
    const jsonFileInput = document.getElementById('json-file-input');
    
    if (jsonImportCloseBtn) jsonImportCloseBtn.addEventListener('click', closeJsonImportModal);
    if (jsonImportCancelBtn) jsonImportCancelBtn.addEventListener('click', closeJsonImportModal);
    if (jsonImportPreviewBtn) jsonImportPreviewBtn.addEventListener('click', previewJsonImport);
    if (jsonImportExecuteBtn) jsonImportExecuteBtn.addEventListener('click', executeJsonImport);
    if (jsonFileInput) jsonFileInput.addEventListener('change', handleFileSelection);
    
    // Event type filter
    const typeFilter = document.getElementById('event-type-filter');
    if (typeFilter) {
        typeFilter.addEventListener('change', filterEventsList);
    }
}

/**
 * Open calendar overlay modal
 */
function openCalendarOverlayModal() {
    console.log('openCalendarOverlayModal called');
    const overlay = document.getElementById('calendar-overlay-modal-overlay');
    if (overlay) {
        console.log('Calendar overlay modal found, opening...');
        overlay.classList.remove('hidden');
        
        // Register with modal stack
        window.registerModal('calendar-overlay-modal', closeCalendarOverlayModal);
        
        // Load calendar data
        loadCalendarData();
        
        // Switch to view tab by default
        switchCalendarTab('view');
    } else {
        console.error('Calendar overlay modal not found!');
    }
}

/**
 * Close calendar overlay modal
 */
function closeCalendarOverlayModal() {
    const overlay = document.getElementById('calendar-overlay-modal-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
        
        // Unregister from modal stack
        window.unregisterModal('calendar-overlay-modal');
    }
}

/**
 * Switch calendar tab
 */
function switchCalendarTab(tabName) {
    // Update tab buttons
    const tabs = document.querySelectorAll('.calendar-tab');
    tabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.tab === tabName) {
            tab.classList.add('active');
        }
    });
    
    // Update tab content
    const contents = document.querySelectorAll('.calendar-tab-content');
    contents.forEach(content => {
        content.classList.remove('active');
        if (content.id === `calendar-tab-${tabName}`) {
            content.classList.add('active');
        }
    });
    
    // Load appropriate data
    switch (tabName) {
        case 'view':
            renderCalendarGrid();
            loadTodayEvents();
            break;
        case 'manage':
            loadEventsList();
            break;
        case 'calendars':
            loadCalendarsList();
            break;
        case 'preferences':
            loadPreferencesUI();
            break;
    }
}

/**
 * Load calendar data
 */
async function loadCalendarData() {
    try {
        // Load preferences
        await loadCalendarPreferences();
        
        // Load events for current month
        await loadCalendarEvents();
        
    } catch (error) {
        console.error('Error loading calendar data:', error);
        showToast({ message: 'Error loading calendar data', type: 'error' });
    }
}

/**
 * Load calendar preferences
 */
async function loadCalendarPreferences() {
    try {
        const response = await apiFetch({
            module: 'calendar_preferences',
            action: 'getPreferences'
        });
        
        if (response.success) {
            calendarPreferences = response.data;
            updateCalendarBadge();
        }
    } catch (error) {
        console.error('Error loading calendar preferences:', error);
    }
}

/**
 * Load calendar events for current month
 */
async function loadCalendarEvents() {
    try {
        const startDate = new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth(), 1);
        const endDate = new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth() + 1, 0);
        
        const response = await apiFetch({
            module: 'calendar_events',
            action: 'getEvents',
            data: {
                start_date: formatDate(startDate),
                end_date: formatDate(endDate)
            }
        });
        
        if (response.success) {
            calendarEvents = response.data;
            updateCalendarBadge();
        }
    } catch (error) {
        console.error('Error loading calendar events:', error);
    }
}

/**
 * Load today's events for badge indicator
 */
async function loadTodayEvents() {
    try {
        const today = new Date();
        
        const response = await apiFetch({
            module: 'calendar_events',
            action: 'getEvents',
            data: {
                start_date: formatDate(today),
                end_date: formatDate(today)
            }
        });
        
        if (response.success) {
            const todayEvents = response.data;
            
            // Update calendar events array with today's events
            todayEvents.forEach(event => {
                if (!calendarEvents.find(e => e.id === event.id)) {
                    calendarEvents.push(event);
                }
            });
            
            updateCalendarBadge(todayEvents.length > 0);
            
            // Update today's events list
            renderTodayEvents(todayEvents);
        }
    } catch (error) {
        console.error('Error loading today\'s events:', error);
    }
}

/**
 * Update calendar badge indicator
 */
function updateCalendarBadge(hasEvents = null) {
    const badge = document.getElementById('btn-calendar-badge');
    const indicator = document.getElementById('calendar-indicator');
    
    if (!badge) {
        return;
    }
    
    if (hasEvents === null) {
        // Check if there are events for today
        const today = formatDate(new Date());
        
        const todayEvents = calendarEvents.filter(event => 
            event.start_date <= today && event.end_date >= today &&
            calendarPreferences[event.event_type] !== false
        );
        
        hasEvents = todayEvents.length > 0;
    }
    
    if (hasEvents) {
        // Get today's events
        const today = formatDate(new Date());
        const todayEvents = calendarEvents.filter(event => 
            event.start_date <= today && event.end_date >= today &&
            calendarPreferences[event.event_type] !== false
        );
        
        if (todayEvents.length > 0) {
            const firstEvent = todayEvents[0];
            const eventColor = firstEvent.color || '#22c55e';
            
            // Use CSS class with CSS custom property for color
            badge.className = 'calendar-badge event-badge';
            badge.style.setProperty('--event-color', eventColor);
            badge.style.display = 'inline-flex';
            
            // Update badge content
            badge.innerHTML = `
                <span>${firstEvent.label}</span>
                ${todayEvents.length > 1 ? `<span style="margin-left: 0.5rem; opacity: 0.8;">+${todayEvents.length - 1}</span>` : ''}
            `;
        }
    } else {
        // Hide badge when no events
        badge.style.display = 'none';
    }
}

/**
 * Render calendar grid
 */
function renderCalendarGrid() {
    const grid = document.getElementById('calendar-grid');
    if (!grid) return;
    
    const year = currentCalendarMonth.getFullYear();
    const month = currentCalendarMonth.getMonth();
    const today = new Date();
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    // Clear grid
    grid.innerHTML = '';
    
    // Add day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.textContent = day;
        grid.appendChild(header);
    });
    
    // Add calendar days - only 6 weeks (42 days) for better performance
    const currentDate = new Date(startDate);
    for (let i = 0; i < 42; i++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        if (currentDate.getMonth() !== month) {
            dayElement.classList.add('other-month');
        }
        
        if (currentDate.toDateString() === today.toDateString()) {
            dayElement.classList.add('today');
        }
        
        dayElement.innerHTML = `
            <div class="calendar-day-number">${currentDate.getDate()}</div>
            <div class="calendar-day-events"></div>
        `;
        
        // Add events for this day (optimized filtering)
        const dateStr = formatDate(currentDate);
        const dayEvents = calendarEvents.filter(event => {
            // Only show events that are visible based on user preferences
            if (!calendarPreferences[event.event_type]) return false;
            return event.start_date <= dateStr && event.end_date >= dateStr;
        });
        
        // Show event text labels instead of dots
        dayEvents.forEach((event, index) => {
            const eventElement = document.createElement('div');
            eventElement.className = 'calendar-event-label';
            eventElement.style.backgroundColor = event.color;
            eventElement.style.color = 'white';
            eventElement.style.padding = '0.125rem 0.25rem';
            eventElement.style.borderRadius = '0.25rem';
            eventElement.style.fontSize = '0.625rem';
            eventElement.style.fontWeight = '500';
            eventElement.style.marginBottom = '0.125rem';
            eventElement.style.cursor = 'pointer';
            eventElement.style.transition = 'all 0.2s ease';
            eventElement.style.maxWidth = '100%';
            eventElement.style.overflow = 'hidden';
            eventElement.style.textOverflow = 'ellipsis';
            eventElement.style.whiteSpace = 'nowrap';
            eventElement.textContent = event.label;
            eventElement.title = `${event.label} (${event.event_type})`;
            
            // Add hover effect
            eventElement.addEventListener('mouseenter', () => {
                eventElement.style.transform = 'scale(1.05)';
                eventElement.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
            });
            eventElement.addEventListener('mouseleave', () => {
                eventElement.style.transform = 'scale(1)';
                eventElement.style.boxShadow = 'none';
            });
            
            dayElement.querySelector('.calendar-day-events').appendChild(eventElement);
        });
        
        // Show "+" indicator if there are too many events for the day
        if (dayEvents.length > 2) {
            const moreIndicator = document.createElement('div');
            moreIndicator.className = 'calendar-more-events';
            moreIndicator.style.backgroundColor = 'var(--text-secondary)';
            moreIndicator.style.color = 'var(--card-bg)';
            moreIndicator.style.padding = '0.125rem 0.25rem';
            moreIndicator.style.borderRadius = '0.25rem';
            moreIndicator.style.fontSize = '0.625rem';
            moreIndicator.style.fontWeight = '500';
            moreIndicator.style.textAlign = 'center';
            moreIndicator.textContent = `+${dayEvents.length - 2} more`;
            moreIndicator.title = `${dayEvents.length - 2} more events`;
            dayElement.querySelector('.calendar-day-events').appendChild(moreIndicator);
        }
        
        grid.appendChild(dayElement);
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Update month/year display
    const monthYear = document.getElementById('current-month-year');
    if (monthYear) {
        monthYear.textContent = currentCalendarMonth.toLocaleDateString('en-US', { 
            month: 'long', 
            year: 'numeric' 
        });
    }
}

/**
 * Render today's events
 */
function renderTodayEvents(events) {
    const container = document.getElementById('today-events-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (events.length === 0) {
        container.innerHTML = '<div class="today-event-item"><span class="today-event-label">No events today</span></div>';
        return;
    }
    
    events.forEach(event => {
        const eventElement = document.createElement('div');
        eventElement.className = 'today-event-item';
        eventElement.innerHTML = `
            <div class="today-event-dot" style="background-color: ${event.color}"></div>
            <div class="today-event-label">${event.label}</div>
        `;
        container.appendChild(eventElement);
    });
}

/**
 * Navigate calendar month
 */
function navigateCalendar(direction) {
    currentCalendarMonth.setMonth(currentCalendarMonth.getMonth() + direction);
    loadCalendarEvents().then(() => {
        renderCalendarGrid();
    });
}

/**
 * Load events list for management
 */
async function loadEventsList() {
    try {
        const response = await apiFetch({
            module: 'calendar_events',
            action: 'getEvents'
        });
        
        if (response.success) {
            renderEventsList(response.data);
        }
    } catch (error) {
        console.error('Error loading events list:', error);
        showToast({ message: 'Error loading events list', type: 'error' });
    }
}

/**
 * Render events list
 */
function renderEventsList(events) {
    const container = document.getElementById('events-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (events.length === 0) {
        container.innerHTML = '<div class="event-item"><span>No events found</span></div>';
        return;
    }
    
    events.forEach(event => {
        const eventElement = document.createElement('div');
        eventElement.className = 'event-item';
        eventElement.innerHTML = `
            <div class="event-item-info">
                <div class="event-item-dot" style="background-color: ${event.color}"></div>
                <div class="event-item-details">
                    <div class="event-item-label">${event.label}</div>
                    <div class="event-item-dates">${event.start_date} - ${event.end_date}</div>
                </div>
            </div>
            <div class="event-item-actions">
                <button class="btn btn-sm" onclick="editEvent(${event.id})">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteEvent(${event.id})">Delete</button>
            </div>
        `;
        container.appendChild(eventElement);
    });
}

/**
 * Filter events list
 */
function filterEventsList() {
    const filter = document.getElementById('event-type-filter').value;
    // Implementation for filtering events
    loadEventsList();
}

/**
 * Open add event modal
 */
function openAddEventModal() {
    const overlay = document.getElementById('event-modal-overlay');
    if (overlay) {
        overlay.classList.remove('hidden');
        
        // Register with modal stack
        window.registerModal('event-modal', closeEventModal);
        
        // Reset form
        const form = document.getElementById('event-form');
        form.reset();
        document.getElementById('event-id').value = '';
        document.getElementById('event-modal-title').textContent = 'Add Event';
        document.getElementById('btn-event-delete').style.display = 'none';
        
        // Set default values
        document.getElementById('event-type').value = 'custom';
        document.getElementById('event-color').value = '#22c55e';
        document.getElementById('event-public').checked = false;
        
        // Set default dates
        const today = new Date();
        document.getElementById('event-start-date').value = formatDate(today);
        document.getElementById('event-end-date').value = formatDate(today);
        
        // Focus on label field
        setTimeout(() => {
            document.getElementById('event-label').focus();
        }, 100);
    }
}

/**
 * Edit event
 */
function editEvent(eventId) {
    const event = calendarEvents.find(e => e.id === eventId);
    if (!event) return;
    
    const overlay = document.getElementById('event-modal-overlay');
    if (overlay) {
        overlay.classList.remove('hidden');
        
        // Register with modal stack
        window.registerModal('event-modal', closeEventModal);
        
        // Populate form
        document.getElementById('event-id').value = event.id;
        document.getElementById('event-type').value = event.event_type;
        document.getElementById('event-label').value = event.label;
        document.getElementById('event-start-date').value = event.start_date;
        document.getElementById('event-end-date').value = event.end_date;
        document.getElementById('event-color').value = event.color;
        document.getElementById('event-public').checked = event.is_public;
        
        document.getElementById('event-modal-title').textContent = 'Edit Event';
        document.getElementById('btn-event-delete').style.display = 'inline-block';
    }
}

/**
 * Close event modal
 */
function closeEventModal() {
    const overlay = document.getElementById('event-modal-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
        
        // Unregister from modal stack
        window.unregisterModal('event-modal');
    }
}

/**
 * Handle event form submission
 */
async function handleEventFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const eventData = {
        event_type: formData.get('event_type'),
        label: formData.get('label'),
        start_date: formData.get('start_date'),
        end_date: formData.get('end_date'),
        color: formData.get('color'),
        is_public: formData.has('is_public')
    };
    
    // Validate form data
    if (!eventData.label || eventData.label.trim().length === 0) {
        showToast({ message: 'Please enter an event label', type: 'error' });
        document.getElementById('event-label').focus();
        return;
    }
    
    if (!eventData.start_date || !eventData.end_date) {
        showToast({ message: 'Please select start and end dates', type: 'error' });
        return;
    }
    
    if (eventData.start_date > eventData.end_date) {
        showToast({ message: 'Start date cannot be after end date', type: 'error' });
        document.getElementById('event-start-date').focus();
        return;
    }
    
    const eventId = formData.get('id');
    
    // Show loading state
    const saveBtn = document.getElementById('btn-event-save');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = 'Saving...';
    saveBtn.disabled = true;
    
    try {
        let response;
        if (eventId) {
            // Update existing event
            eventData.id = eventId;
            response = await apiFetch({
                module: 'calendar_events',
                action: 'updateEvent',
                data: eventData
            });
        } else {
            // Create new event
            response = await apiFetch({
                module: 'calendar_events',
                action: 'createEvent',
                data: eventData
            });
        }
        
        if (response.success) {
            showToast({ message: eventId ? 'Event updated successfully' : 'Event created successfully', type: 'success' });
            closeEventModal();
            loadCalendarData();
        } else {
            showToast({ message: response.error || 'Error saving event', type: 'error' });
        }
    } catch (error) {
        console.error('Error saving event:', error);
        showToast({ message: 'Error saving event', type: 'error' });
    } finally {
        // Reset button state
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
    }
}

/**
 * Handle delete event
 */
async function handleDeleteEvent() {
    const eventId = document.getElementById('event-id').value;
    if (!eventId) return;
    
    if (!confirm('Are you sure you want to delete this event?')) {
        return;
    }
    
    try {
        const response = await apiFetch({
            module: 'calendar_events',
            action: 'deleteEvent',
            data: { id: eventId }
        });
        
        if (response.success) {
            showToast({ message: 'Event deleted successfully', type: 'success' });
            closeEventModal();
            loadCalendarData();
        } else {
            showToast({ message: response.error || 'Error deleting event', type: 'error' });
        }
    } catch (error) {
        console.error('Error deleting event:', error);
        showToast({ message: 'Error deleting event', type: 'error' });
    }
}

/**
 * Load preferences UI
 */
function loadPreferencesUI() {
    Object.keys(calendarPreferences).forEach(type => {
        const checkbox = document.getElementById(`pref-${type}`);
        if (checkbox) {
            checkbox.checked = calendarPreferences[type];
        }
    });
}

/**
 * Handle preference change
 */
async function handlePreferenceChange(e) {
    const type = e.target.id.replace('pref-', '');
    calendarPreferences[type] = e.target.checked;
    
    try {
        const response = await apiFetch({
            module: 'calendar_preferences',
            action: 'updatePreferences',
            data: { preferences: calendarPreferences }
        });
        
        if (response.success) {
            showToast({ message: 'Preferences updated', type: 'success' });
            loadCalendarData(); // Reload to reflect changes
        } else {
            showToast({ message: 'Error updating preferences', type: 'error' });
        }
    } catch (error) {
        console.error('Error updating preferences:', error);
        showToast({ message: 'Error updating preferences', type: 'error' });
    }
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

/**
 * Delete event (called from events list)
 */
function deleteEvent(eventId) {
    if (!confirm('Are you sure you want to delete this event?')) {
        return;
    }
    
    apiFetch({
        module: 'calendar_events',
        action: 'deleteEvent',
        data: { id: eventId }
    }).then(response => {
        if (response.success) {
            showToast({ message: 'Event deleted successfully', type: 'success' });
            loadEventsList();
            loadCalendarData();
        } else {
            showToast({ message: response.error || 'Error deleting event', type: 'error' });
        }
    }).catch(error => {
        console.error('Error deleting event:', error);
        showToast({ message: 'Error deleting event', type: 'error' });
    });
}

/**
 * JSON Import functionality
 */
let importData = null;

/**
 * Open JSON import modal
 */
function openJsonImportModal() {
    const overlay = document.getElementById('json-import-modal-overlay');
    if (overlay) {
        overlay.classList.remove('hidden');
        
        // Register with modal stack
        window.registerModal('json-import-modal', closeJsonImportModal);
        
        // Reset form
        resetJsonImportForm();
    }
}

/**
 * Close JSON import modal
 */
function closeJsonImportModal() {
    const overlay = document.getElementById('json-import-modal-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
        
        // Unregister from modal stack
        window.unregisterModal('json-import-modal');
        
        // Reset form
        resetJsonImportForm();
    }
}

/**
 * Reset JSON import form
 */
function resetJsonImportForm() {
    const fileInput = document.getElementById('json-file-input');
    const preview = document.getElementById('import-preview');
    const previewBtn = document.getElementById('btn-import-preview');
    const executeBtn = document.getElementById('btn-import-execute');
    
    if (fileInput) fileInput.value = '';
    if (preview) preview.classList.add('hidden');
    if (previewBtn) previewBtn.disabled = true;
    if (executeBtn) executeBtn.disabled = true;
    
    importData = null;
}

/**
 * Handle file selection
 */
function handleFileSelection(e) {
    const file = e.target.files[0];
    const previewBtn = document.getElementById('btn-import-preview');
    const executeBtn = document.getElementById('btn-import-execute');
    
    if (file && file.type === 'application/json') {
        if (previewBtn) previewBtn.disabled = false;
        if (executeBtn) executeBtn.disabled = false;
        
        // Auto-parse the file to enable direct import
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const jsonData = JSON.parse(e.target.result);
                
                // Validate JSON structure
                if (!Array.isArray(jsonData)) {
                    showToast({ message: 'JSON must be an array of events', type: 'error' });
                    if (executeBtn) executeBtn.disabled = true;
                    return;
                }
                
                if (jsonData.length === 0) {
                    showToast({ message: 'JSON file is empty', type: 'error' });
                    if (executeBtn) executeBtn.disabled = true;
                    return;
                }
                
                // Validate first event structure
                const firstEvent = jsonData[0];
                if (!firstEvent.startDate || !firstEvent.endDate || !firstEvent.label) {
                    showToast({ message: 'Invalid JSON structure. Events must have startDate, endDate, and label', type: 'error' });
                    if (executeBtn) executeBtn.disabled = true;
                    return;
                }
                
                importData = jsonData;
                console.log(`JSON file loaded with ${jsonData.length} events`);
                
            } catch (error) {
                console.error('JSON parsing error:', error);
                showToast({ message: 'Invalid JSON file: ' + error.message, type: 'error' });
                if (executeBtn) executeBtn.disabled = true;
            }
        };
        
        reader.readAsText(file);
    } else {
        if (previewBtn) previewBtn.disabled = true;
        if (executeBtn) executeBtn.disabled = true;
        showToast({ message: 'Please select a valid JSON file', type: 'error' });
    }
}

/**
 * Preview JSON import
 */
function previewJsonImport() {
    const fileInput = document.getElementById('json-file-input');
    const file = fileInput.files[0];
    
    if (!file) {
        showToast({ message: 'Please select a JSON file first', type: 'error' });
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const jsonData = JSON.parse(e.target.result);
            
            // Validate JSON structure
            if (!Array.isArray(jsonData)) {
                showToast('JSON must be an array of events', 'error');
                return;
            }
            
            if (jsonData.length === 0) {
                showToast('JSON file is empty', 'error');
                return;
            }
            
            // Validate first event structure
            const firstEvent = jsonData[0];
            if (!firstEvent.startDate || !firstEvent.endDate || !firstEvent.label) {
                showToast('Invalid JSON structure. Events must have startDate, endDate, and label', 'error');
                return;
            }
            
            importData = jsonData;
            displayImportPreview(jsonData);
            
        } catch (error) {
            console.error('JSON parsing error:', error);
            showToast('Invalid JSON file: ' + error.message, 'error');
        }
    };
    
    reader.readAsText(file);
}

/**
 * Display import preview
 */
function displayImportPreview(events) {
    const preview = document.getElementById('import-preview');
    const previewContent = document.getElementById('preview-content');
    const executeBtn = document.getElementById('btn-import-execute');
    
    if (!preview || !previewContent) return;
    
    // Show first 10 events as preview
    const previewEvents = events.slice(0, 10);
    
    previewContent.innerHTML = '';
    
    previewEvents.forEach((event, index) => {
        const previewItem = document.createElement('div');
        previewItem.className = 'preview-item';
        previewItem.innerHTML = `
            <span>${event.label}</span>
            <span>${event.startDate} - ${event.endDate}</span>
        `;
        previewContent.appendChild(previewItem);
    });
    
    if (events.length > 10) {
        const moreItem = document.createElement('div');
        moreItem.className = 'preview-item';
        moreItem.innerHTML = `<span>... and ${events.length - 10} more events</span>`;
        previewContent.appendChild(moreItem);
    }
    
    preview.classList.remove('hidden');
    if (executeBtn) executeBtn.disabled = false;
}

/**
 * Execute JSON import
 */
async function executeJsonImport() {
    if (!importData) {
        showToast({ message: 'No import data available', type: 'error' });
        return;
    }
    
    const calendarName = document.getElementById('import-calendar-name').value.trim();
    const eventType = document.getElementById('import-event-type').value;
    const color = document.getElementById('import-event-color').value;
    const replaceExisting = document.getElementById('import-replace-existing').checked;
    
    if (!calendarName) {
        showToast({ message: 'Please enter a calendar name', type: 'error' });
        return;
    }
    
    const executeBtn = document.getElementById('btn-import-execute');
    if (executeBtn) {
        executeBtn.textContent = 'Importing...';
        executeBtn.disabled = true;
    }
    
    try {
        const response = await apiFetch({
            module: 'calendar_events',
            action: 'bulk_import',
            data: {
                events: importData,
                calendar_name: calendarName,
                event_type: eventType,
                color: color,
                replace_existing: replaceExisting
            }
        });
        
        if (response.success) {
            const data = response.data;
            let message = `Successfully imported ${data.imported_count} of ${data.total_events} events`;
            
            if (data.errors && data.errors.length > 0) {
                message += `. ${data.errors.length} errors occurred.`;
                console.warn('Import errors:', data.errors);
            }
            
            showToast({ message: message, type: 'success' });
            closeJsonImportModal();
            loadCalendarData();
        } else {
            showToast({ message: response.error || 'Import failed', type: 'error' });
        }
    } catch (error) {
        console.error('Import error:', error);
        showToast({ message: 'Import failed: ' + error.message, type: 'error' });
    } finally {
        if (executeBtn) {
            executeBtn.textContent = 'Import Events';
            executeBtn.disabled = false;
        }
    }
}

/**
 * Load and display calendars list
 */
async function loadCalendarsList() {
    try {
        const response = await apiFetch({
            module: 'calendar_events',
            action: 'getCalendars'
        });
        
        if (response.success) {
            renderCalendarsList(response.data);
        } else {
            console.error('Error loading calendars:', response.error);
        }
    } catch (error) {
        console.error('Error loading calendars:', error);
    }
}

/**
 * Render calendars list in the management tab
 */
function renderCalendarsList(calendars) {
    const calendarsList = document.getElementById('calendars-list');
    if (!calendarsList) return;
    
    if (calendars.length === 0) {
        calendarsList.innerHTML = '<p class="no-calendars">No calendar imports found. Import some calendars to manage them here.</p>';
        return;
    }
    
    // Group calendars by name
    const calendarGroups = {};
    calendars.forEach(cal => {
        if (!calendarGroups[cal.calendar_name]) {
            calendarGroups[cal.calendar_name] = [];
        }
        calendarGroups[cal.calendar_name].push(cal);
    });
    
    calendarsList.innerHTML = Object.keys(calendarGroups).map(calendarName => {
        const group = calendarGroups[calendarName];
        const primaryCalendar = group[0]; // Use first calendar for display info
        const totalEvents = group.reduce((sum, cal) => sum + parseInt(cal.event_count), 0);
        const dateRange = `${primaryCalendar.first_event} to ${primaryCalendar.last_event}`;
        
        return `
            <div class="calendar-item" data-calendar-name="${calendarName}">
                <div class="calendar-item-header">
                    <div class="calendar-item-info">
                        <h6>${calendarName}</h6>
                        <div class="calendar-item-meta">
                            <span>${totalEvents} events</span>
                            <span>${dateRange}</span>
                            <span class="calendar-item-priority">Priority ${primaryCalendar.priority}</span>
                        </div>
                    </div>
                    <div class="calendar-item-actions">
                        <button onclick="setCalendarPriority('${calendarName}', ${primaryCalendar.priority + 1})" title="Increase Priority">
                            ↑ Priority
                        </button>
                        <button onclick="deleteCalendar('${calendarName}')" class="btn-danger" title="Delete Calendar">
                            Delete
                        </button>
                    </div>
                </div>
                <div class="calendar-item-details">
                    <div class="calendar-detail-item">
                        <span class="calendar-detail-label">Event Type</span>
                        <span class="calendar-detail-value">${primaryCalendar.event_type}</span>
                    </div>
                    <div class="calendar-detail-item">
                        <span class="calendar-detail-label">Color</span>
                        <span class="calendar-detail-value">
                            <span style="display: inline-block; width: 12px; height: 12px; background-color: ${primaryCalendar.color}; border-radius: 2px; margin-right: 4px;"></span>
                            ${primaryCalendar.color}
                        </span>
                    </div>
                    <div class="calendar-detail-item">
                        <span class="calendar-detail-label">Created</span>
                        <span class="calendar-detail-value">${new Date(primaryCalendar.first_event).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Delete an entire calendar import
 */
async function deleteCalendar(calendarName) {
    // Use custom confirmation modal
    const confirmed = await showConfirm(
        `Are you sure you want to delete all events from the calendar "${calendarName}"? This action cannot be undone.`
    );
    
    if (!confirmed) {
        return;
    }
    
    try {
        const response = await apiFetch({
            module: 'calendar_events',
            action: 'deleteCalendar',
            data: { calendar_name: calendarName }
        });
        
        if (response.success) {
            showToast({ message: response.message, type: 'success' });
            loadCalendarsList(); // Refresh the list
            loadCalendarData(); // Refresh the calendar view
        } else {
            showToast({ message: response.error || 'Failed to delete calendar', type: 'error' });
        }
    } catch (error) {
        console.error('Error deleting calendar:', error);
        showToast({ message: 'Failed to delete calendar', type: 'error' });
    }
}

/**
 * Set priority for a calendar
 */
async function setCalendarPriority(calendarName, priority) {
    try {
        const response = await apiFetch({
            module: 'calendar_events',
            action: 'setCalendarPriority',
            data: { 
                calendar_name: calendarName,
                priority: priority
            }
        });
        
        if (response.success) {
            showToast({ message: response.message, type: 'success' });
            loadCalendarsList(); // Refresh the list
            loadTodayEvents(); // Refresh the title bar badge
        } else {
            showToast({ message: response.error || 'Failed to set calendar priority', type: 'error' });
        }
    } catch (error) {
        console.error('Error setting calendar priority:', error);
        showToast({ message: 'Failed to set calendar priority', type: 'error' });
    }
}

// Calendar overlay will be initialized by app.js after tasks view is ready
