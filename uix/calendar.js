/**
 * Calendar Overlay System
 *
 * MyDayHub - Calendar Events Management
 *
 * @version 8.5 Avellanas
 * @author Alex & Gemini & Claude & Cursor
 */

// Global calendar state
let currentCalendarMonth = new Date();
let calendarEvents = [];
let calendarPreferences = {};

/**
 * Calculate theme-derived calendar event color
 * Returns a washed-down, darker version of the accent color
 */
function getCalendarEventColor() {
    // Get accent color from CSS variable or default
    const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim() || '#22c55e';
    
    // Convert hex to RGB
    const hex = accentColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Darken and desaturate: reduce brightness by 30% and saturation by 40%
    const darkenedR = Math.round(r * 0.7);
    const darkenedG = Math.round(g * 0.7);
    const darkenedB = Math.round(b * 0.7);
    
    // Desaturate by mixing with grey
    const grey = Math.round((darkenedR + darkenedG + darkenedB) / 3);
    const desaturatedR = Math.round(darkenedR * 0.6 + grey * 0.4);
    const desaturatedG = Math.round(darkenedG * 0.6 + grey * 0.4);
    const desaturatedB = Math.round(darkenedB * 0.6 + grey * 0.4);
    
    // Convert back to hex
    const toHex = (n) => {
        const hex = Math.max(0, Math.min(255, n)).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    
    return '#' + toHex(desaturatedR) + toHex(desaturatedG) + toHex(desaturatedB);
}

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
    
    // Import method tabs
    const importMethodTabs = document.querySelectorAll('.import-method-tab');
    importMethodTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const method = tab.dataset.method;
            switchImportMethod(method);
        });
    });
    
    // Paste JSON input handler
    const jsonPasteInput = document.getElementById('json-paste-input');
    if (jsonPasteInput) {
        jsonPasteInput.addEventListener('input', handlePasteInput);
    }
    
    // Calendar name input handler - re-check form readiness when changed
    const calendarNameInput = document.getElementById('import-calendar-name');
    if (calendarNameInput) {
        calendarNameInput.addEventListener('input', checkImportFormReady);
    }
    
    // Calendar Export modal
    const exportCloseBtn = document.getElementById('calendar-export-modal-close-btn');
    const exportCloseBtnAlt = document.getElementById('btn-export-close');
    const copyExportBtn = document.getElementById('btn-copy-export-json');
    const exportOverlay = document.getElementById('calendar-export-modal-overlay');
    
    if (exportCloseBtn) exportCloseBtn.addEventListener('click', closeCalendarExportModal);
    if (exportCloseBtnAlt) exportCloseBtnAlt.addEventListener('click', closeCalendarExportModal);
    if (copyExportBtn) copyExportBtn.addEventListener('click', copyExportJson);
    if (exportOverlay) {
        exportOverlay.addEventListener('click', (e) => {
            if (e.target === exportOverlay) {
                closeCalendarExportModal();
            }
        });
    }
}

/**
 * Open calendar overlay modal
 */
async function openCalendarOverlayModal() {
    console.log('openCalendarOverlayModal called');
    const overlay = document.getElementById('calendar-overlay-modal-overlay');
    if (overlay) {
        console.log('Calendar overlay modal found, opening...');
        overlay.classList.remove('hidden');
        
        // Register with modal stack
        window.registerModal('calendar-overlay-modal', closeCalendarOverlayModal);
        
        // Switch to view tab by default
        switchCalendarTab('view');
        
        // Load calendar data after switching to view tab
        await loadCalendarData();
        
        // Re-render calendar grid after events are loaded
        renderCalendarGrid();
        loadTodayEvents();
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
            // Ensure events are loaded before rendering
            if (calendarEvents && calendarEvents.length >= 0) {
                renderCalendarGrid();
                loadTodayEvents();
            } else {
                // If events not loaded yet, load them first
                loadCalendarEvents().then(() => {
                    renderCalendarGrid();
                    loadTodayEvents();
                });
            }
            break;
        case 'manage':
            loadEventsList();
            break;
        case 'calendars':
            loadCalendarsList();
            break;
        case 'public':
            loadPublicCalendars();
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
        // Load events for the full range visible in the calendar grid (6 weeks)
        // Start from the first day of the calendar grid (which might be from previous month)
        const year = currentCalendarMonth.getFullYear();
        const month = currentCalendarMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay()); // Go back to Sunday
        
        // End date is 6 weeks (42 days) from start
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 41); // 42 days total (0-41)
        
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
            event.start_date <= today && event.end_date >= today
        );
        
        hasEvents = todayEvents.length > 0;
    }
    
    if (hasEvents) {
        // Get today's events
        const today = formatDate(new Date());
        const todayEvents = calendarEvents.filter(event => 
            event.start_date <= today && event.end_date >= today
        );
        
        if (todayEvents.length > 0) {
            // Use theme-derived color instead of stored color
            const eventColor = getCalendarEventColor();
            
            // Use CSS class with CSS custom property for color
            badge.className = 'calendar-badge event-badge';
            badge.style.setProperty('--event-color', eventColor);
            badge.style.display = 'inline-flex';
            
            // Update badge content
            badge.innerHTML = `
                <span>${todayEvents[0].label}</span>
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
            // All events are custom type now, no need to filter by type
            return event.start_date <= dateStr && event.end_date >= dateStr;
        });
        
        // Show event text labels instead of dots
        dayEvents.forEach((event, index) => {
            const eventElement = document.createElement('div');
            eventElement.className = 'calendar-event-label';
            // Use theme-derived color instead of stored color
            const eventColor = getCalendarEventColor();
            eventElement.style.backgroundColor = eventColor;
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
            eventElement.title = event.label;
            
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
        // Use theme-derived color instead of stored color
        const eventColor = getCalendarEventColor();
        eventElement.innerHTML = `
            <div class="today-event-dot" style="background-color: ${eventColor}"></div>
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
        // Use theme-derived color instead of stored color
        const eventColor = getCalendarEventColor();
        
        // Check if user owns this event (is_subscribed === 0 means it's their own calendar)
        const isOwned = event.is_subscribed === 0 || event.is_subscribed === false;
        
        // Build actions HTML - only show edit/delete for owned events
        let actionsHTML = '';
        if (isOwned) {
            actionsHTML = `
                <div class="event-item-actions">
                    <button class="btn btn-sm" onclick="editEvent(${event.id})">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteEvent(${event.id})">Delete</button>
                </div>
            `;
        } else {
            // Show owner info for subscribed events
            const ownerInfo = event.owner_username ? `<span class="event-item-owner">by ${event.owner_username}</span>` : '';
            actionsHTML = `
                <div class="event-item-actions">
                    ${ownerInfo}
                    <span class="event-item-subscribed-badge">Subscribed Calendar</span>
                </div>
            `;
        }
        
        eventElement.innerHTML = `
            <div class="event-item-info">
                <div class="event-item-dot" style="background-color: ${eventColor}"></div>
                <div class="event-item-details">
                    <div class="event-item-label">${event.label}</div>
                    <div class="event-item-dates">${event.start_date} - ${event.end_date}</div>
                </div>
            </div>
            ${actionsHTML}
        `;
        container.appendChild(eventElement);
    });
}

/**
 * Filter events list (no longer filters by type - all events are custom)
 */
function filterEventsList() {
    // All events are custom type now, so just reload the list
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
        document.getElementById('event-label').value = '';
        document.getElementById('event-start-date').value = '';
        document.getElementById('event-end-date').value = '';
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
    
    // Prevent editing events from subscribed calendars
    if (event.is_subscribed === 1 || event.is_subscribed === true) {
        showToast({ message: 'You can only edit events from your own calendars', type: 'error' });
        return;
    }
    
    const overlay = document.getElementById('event-modal-overlay');
    if (overlay) {
        overlay.classList.remove('hidden');
        
        // Register with modal stack
        window.registerModal('event-modal', closeEventModal);
        
        // Populate form
        document.getElementById('event-id').value = event.id;
        document.getElementById('event-label').value = event.label;
        document.getElementById('event-start-date').value = event.start_date;
        document.getElementById('event-end-date').value = event.end_date;
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
        id: formData.get('id') || null,
        event_type: 'custom', // All events are custom type
        label: formData.get('label'),
        start_date: formData.get('start_date'),
        end_date: formData.get('end_date'),
        color: getCalendarEventColor(), // Use theme-derived color
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
    
    // Show loading state
    const saveBtn = document.getElementById('btn-event-save');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = 'Saving...';
    saveBtn.disabled = true;
    
    try {
        let response;
        if (eventData.id) {
            // Update existing event
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
            showToast({ message: eventData.id ? 'Event updated successfully' : 'Event created successfully', type: 'success' });
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
 * Format date as YYYY-MM-DD
 */
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

/**
 * Delete event (called from events list)
 */
function deleteEvent(eventId) {
    const event = calendarEvents.find(e => e.id === eventId);
    if (!event) {
        showToast({ message: 'Event not found', type: 'error' });
        return;
    }
    
    // Prevent deleting events from subscribed calendars
    if (event.is_subscribed === 1 || event.is_subscribed === true) {
        showToast({ message: 'You can only delete events from your own calendars', type: 'error' });
        return;
    }
    
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
    const pasteInput = document.getElementById('json-paste-input');
    const preview = document.getElementById('import-preview');
    const previewBtn = document.getElementById('btn-import-preview');
    const executeBtn = document.getElementById('btn-import-execute');

    if (fileInput) fileInput.value = '';
    if (pasteInput) pasteInput.value = '';
    if (preview) preview.classList.add('hidden');
    if (previewBtn) previewBtn.disabled = true;
    if (executeBtn) executeBtn.disabled = true;
    
    importData = null;
    
    // Reset to file upload method
    switchImportMethod('file');
}

/**
 * Switch between file upload and paste JSON methods
 */
function switchImportMethod(method) {
    const fileSection = document.getElementById('import-file-section');
    const pasteSection = document.getElementById('import-paste-section');
    const fileTab = document.querySelector('.import-method-tab[data-method="file"]');
    const pasteTab = document.querySelector('.import-method-tab[data-method="paste"]');
    const previewBtn = document.getElementById('btn-import-preview');
    const executeBtn = document.getElementById('btn-import-execute');
    
    if (method === 'file') {
        fileSection.classList.add('active');
        fileSection.classList.remove('hidden');
        pasteSection.classList.add('hidden');
        pasteSection.classList.remove('active');
        fileTab.classList.add('active');
        pasteTab.classList.remove('active');
        
        // Reset paste input
        const pasteInput = document.getElementById('json-paste-input');
        if (pasteInput) pasteInput.value = '';
        
        // Check if file is selected
        const fileInput = document.getElementById('json-file-input');
        if (fileInput && fileInput.files.length > 0) {
            // Will be enabled by handleFileSelection after validation
        } else {
            if (previewBtn) previewBtn.disabled = true;
            if (executeBtn) executeBtn.disabled = true;
        }
    } else {
        pasteSection.classList.add('active');
        pasteSection.classList.remove('hidden');
        fileSection.classList.add('hidden');
        fileSection.classList.remove('active');
        pasteTab.classList.add('active');
        fileTab.classList.remove('active');
        
        // Reset file input
        const fileInput = document.getElementById('json-file-input');
        if (fileInput) fileInput.value = '';
        
        // Check if paste input has content
        const pasteInput = document.getElementById('json-paste-input');
        if (pasteInput && pasteInput.value.trim().length > 0) {
            // Will be enabled by handlePasteInput after validation
        } else {
            if (previewBtn) previewBtn.disabled = true;
            if (executeBtn) executeBtn.disabled = true;
        }
    }
    
    // Clear import data when switching methods
    importData = null;
    const preview = document.getElementById('import-preview');
    if (preview) preview.classList.add('hidden');
    
    // Re-check form readiness after switching
    checkImportFormReady();
}

/**
 * Check if import form is ready and enable/disable buttons accordingly
 */
function checkImportFormReady() {
    const previewBtn = document.getElementById('btn-import-preview');
    const executeBtn = document.getElementById('btn-import-execute');
    const calendarName = document.getElementById('import-calendar-name');
    const activeMethod = document.querySelector('.import-method-tab.active')?.dataset.method;
    
    const hasValidData = importData !== null && Array.isArray(importData) && importData.length > 0;
    const hasCalendarName = calendarName && calendarName.value.trim().length > 0;
    
    const canProceed = hasValidData && hasCalendarName;
    
    if (previewBtn) previewBtn.disabled = !hasValidData;
    if (executeBtn) executeBtn.disabled = !canProceed;
}

/**
 * Sanitize JSON string before parsing
 * Removes problematic control characters, normalizes whitespace, and fixes common quote issues
 */
function sanitizeJsonString(jsonString) {
    // Replace curly/smart quotes with straight quotes
    // Handles various Unicode quote characters commonly found in rich text
    let sanitized = jsonString
        .replace(/[\u201C\u201D]/g, '"')  // Replace curly double quotes (left and right) with straight quotes
        .replace(/[\u2018\u2019]/g, "'")  // Replace curly single quotes (left and right) with straight quotes
        .replace(/[\u00AB\u00BB]/g, '"')  // Replace guillemets (« ») with straight quotes
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control chars except \n, \r, \t
        .replace(/\r\n/g, '\n') // Normalize line endings
        .replace(/\r/g, '\n');
    
    return sanitized;
}

/**
 * Handle paste JSON input
 */
function handlePasteInput(e) {
    const pasteInput = e.target;
    const previewBtn = document.getElementById('btn-import-preview');
    const executeBtn = document.getElementById('btn-import-execute');
    
    const jsonText = pasteInput.value.trim();
    
    if (jsonText.length === 0) {
        if (previewBtn) previewBtn.disabled = true;
        if (executeBtn) executeBtn.disabled = true;
        importData = null;
        const preview = document.getElementById('import-preview');
        if (preview) preview.classList.add('hidden');
        return;
    }
    
    try {
        // Sanitize JSON string before parsing
        const sanitizedJson = sanitizeJsonString(jsonText);
        const jsonData = JSON.parse(sanitizedJson);
        
        // Validate JSON structure
        if (!Array.isArray(jsonData)) {
            showToast({ message: 'JSON must be an array of events', type: 'error', duration: 5000 });
            if (previewBtn) previewBtn.disabled = true;
            if (executeBtn) executeBtn.disabled = true;
            importData = null;
            return;
        }
        
        if (jsonData.length === 0) {
            showToast({ message: 'JSON array is empty', type: 'error', duration: 5000 });
            if (previewBtn) previewBtn.disabled = true;
            if (executeBtn) executeBtn.disabled = true;
            importData = null;
            return;
        }
        
        // Validate first event structure
        const firstEvent = jsonData[0];
        if (!firstEvent.startDate || !firstEvent.endDate || !firstEvent.label) {
            showToast({ message: 'Invalid JSON structure. Events must have startDate, endDate, and label fields.', type: 'error', duration: 5000 });
            if (previewBtn) previewBtn.disabled = true;
            if (executeBtn) executeBtn.disabled = true;
            importData = null;
            return;
        }
        
        // Warn if old format with 'name' field is detected (but don't block)
        if (firstEvent.name) {
            console.warn('JSON contains "name" field in events. This field is ignored - use the Calendar Name field instead.');
        }
        
        importData = jsonData;
        if (previewBtn) previewBtn.disabled = false;
        if (executeBtn) executeBtn.disabled = false;
        console.log(`JSON data loaded with ${jsonData.length} events`);
        
        // Re-check form readiness (includes calendar name check)
        checkImportFormReady();
        
    } catch (error) {
        console.error('JSON parsing error:', error);
        // Show helpful error message
        let errorMessage = 'Invalid JSON format. ';
        if (error.message.includes('Bad control character')) {
            errorMessage += 'The JSON contains invalid characters. Please check for special characters or formatting issues.';
        } else if (error.message.includes('Unexpected token')) {
            errorMessage += 'There\'s a syntax error in your JSON. Please check for missing commas, brackets, or quotes.';
        } else {
            errorMessage += error.message;
        }
        
        showToast({ message: errorMessage, type: 'error', duration: 6000 });
        if (previewBtn) previewBtn.disabled = true;
        if (executeBtn) executeBtn.disabled = true;
        importData = null;
    }
}

/**
 * Handle file selection
 */
function handleFileSelection(e) {
    const file = e.target.files[0];
    
    if (file && file.type === 'application/json') {
        // Auto-parse the file to enable direct import
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                // Sanitize JSON string before parsing
                const sanitizedJson = sanitizeJsonString(e.target.result);
                const jsonData = JSON.parse(sanitizedJson);
                
                // Validate JSON structure
                if (!Array.isArray(jsonData)) {
                    showToast({ message: 'JSON must be an array of events', type: 'error' });
                    checkImportFormReady();
                    return;
                }
                
                if (jsonData.length === 0) {
                    showToast({ message: 'JSON file is empty', type: 'error' });
                    checkImportFormReady();
                    return;
                }
                
                // Validate first event structure
                const firstEvent = jsonData[0];
                if (!firstEvent.startDate || !firstEvent.endDate || !firstEvent.label) {
                    showToast({ message: 'Invalid JSON structure. Events must have startDate, endDate, and label fields. The name field is not needed - it will be entered separately.', type: 'error' });
                    checkImportFormReady();
                    return;
                }
                
                // Warn if old format with 'name' field is detected (but don't block)
                if (firstEvent.name) {
                    console.warn('JSON contains "name" field in events. This field is ignored - use the Calendar Name field instead.');
                }
                
                importData = jsonData;
                console.log(`JSON file loaded with ${jsonData.length} events`);
                
                // Re-check form readiness (includes calendar name check)
                checkImportFormReady();
                
            } catch (error) {
                console.error('JSON parsing error:', error);
                let errorMessage = 'Invalid JSON file. ';
                if (error.message.includes('Bad control character')) {
                    errorMessage += 'The JSON contains invalid characters. Please check for special characters or formatting issues.';
                } else if (error.message.includes('Unexpected token')) {
                    errorMessage += 'There\'s a syntax error in your JSON. Please check for missing commas, brackets, or quotes.';
                } else {
                    errorMessage += error.message;
                }
                showToast({ message: errorMessage, type: 'error', duration: 6000 });
                checkImportFormReady();
            }
        };
        
        reader.readAsText(file);
    } else {
        checkImportFormReady();
        if (!file) {
            showToast({ message: 'Please select a valid JSON file', type: 'error' });
        }
    }
}

/**
 * Preview JSON import
 */
function previewJsonImport() {
    const activeMethod = document.querySelector('.import-method-tab.active').dataset.method;
    
    if (activeMethod === 'file') {
        const fileInput = document.getElementById('json-file-input');
        const file = fileInput?.files[0];
        
        if (!file) {
            showToast({ message: 'Please select a JSON file first', type: 'error' });
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                // Sanitize JSON string before parsing
                const sanitizedJson = sanitizeJsonString(e.target.result);
                const jsonData = JSON.parse(sanitizedJson);
                validateAndSetImportData(jsonData);
                if (importData) {
                    displayImportPreview(importData);
                }
            } catch (error) {
                console.error('JSON parsing error:', error);
                let errorMessage = 'Invalid JSON file. ';
                if (error.message.includes('Bad control character')) {
                    errorMessage += 'The JSON contains invalid characters. Please check for special characters or formatting issues.';
                } else if (error.message.includes('Unexpected token')) {
                    errorMessage += 'There\'s a syntax error in your JSON. Please check for missing commas, brackets, or quotes.';
                } else {
                    errorMessage += error.message;
                }
                showToast({ message: errorMessage, type: 'error', duration: 6000 });
            }
        };
        
        reader.readAsText(file);
    } else {
        // Paste method
        const pasteInput = document.getElementById('json-paste-input');
        const jsonText = pasteInput?.value.trim();
        
        if (!jsonText || jsonText.length === 0) {
            showToast({ message: 'Please paste JSON data first', type: 'error' });
            return;
        }
        
        try {
            // Sanitize JSON string before parsing
            const sanitizedJson = sanitizeJsonString(jsonText);
            const jsonData = JSON.parse(sanitizedJson);
            validateAndSetImportData(jsonData);
            if (importData) {
                displayImportPreview(importData);
            }
        } catch (error) {
            console.error('JSON parsing error:', error);
            let errorMessage = 'Invalid JSON format. ';
            if (error.message.includes('Bad control character')) {
                errorMessage += 'The JSON contains invalid characters. Please check for special characters or formatting issues.';
            } else if (error.message.includes('Unexpected token')) {
                errorMessage += 'There\'s a syntax error in your JSON. Please check for missing commas, brackets, or quotes.';
            } else {
                errorMessage += error.message;
            }
            showToast({ message: errorMessage, type: 'error', duration: 6000 });
        }
    }
}

/**
 * Validate and set import data (shared validation logic)
 */
function validateAndSetImportData(jsonData) {
    // Validate JSON structure
    if (!Array.isArray(jsonData)) {
        showToast({ message: 'JSON must be an array of events', type: 'error' });
        importData = null;
        return;
    }
    
    if (jsonData.length === 0) {
        showToast({ message: 'JSON array is empty', type: 'error' });
        importData = null;
        return;
    }
    
    // Validate first event structure
    const firstEvent = jsonData[0];
    if (!firstEvent.startDate || !firstEvent.endDate || !firstEvent.label) {
        showToast({ message: 'Invalid JSON structure. Events must have startDate, endDate, and label fields. The name field is not needed - it will be entered separately.', type: 'error' });
        importData = null;
        return;
    }
    
    // Warn if old format with 'name' field is detected (but don't block)
    if (firstEvent.name) {
        console.warn('JSON contains "name" field in events. This field is ignored - use the Calendar Name field instead.');
    }
    
    importData = jsonData;
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
    // Re-check form readiness (includes calendar name check)
    checkImportFormReady();
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
                event_type: 'custom', // All imports are custom type
                color: getCalendarEventColor(), // Use theme-derived color
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
    
    // Separate own calendars from subscribed calendars
    const ownCalendars = calendars.filter(cal => !cal.is_subscribed || cal.is_subscribed === 0);
    const subscribedCalendars = calendars.filter(cal => cal.is_subscribed === 1);
    
    let html = '';
    
    // Render own calendars
    if (ownCalendars.length > 0) {
        html += '<div class="calendar-section"><h6>My Calendars</h6>';
        
        // Group calendars by name
        const calendarGroups = {};
        ownCalendars.forEach(cal => {
            if (!calendarGroups[cal.calendar_name]) {
                calendarGroups[cal.calendar_name] = [];
            }
            calendarGroups[cal.calendar_name].push(cal);
        });
        
        html += Object.keys(calendarGroups).map(calendarName => {
            const group = calendarGroups[calendarName];
            const primaryCalendar = group[0];
            const totalEvents = group.reduce((sum, cal) => sum + parseInt(cal.event_count), 0);
            const dateRange = `${primaryCalendar.first_event} to ${primaryCalendar.last_event}`;
            const isPublic = primaryCalendar.is_public === 1;
            const isVisible = primaryCalendar.is_visible !== undefined ? primaryCalendar.is_visible === 1 : true;
            
            return `
                <div class="calendar-item" data-calendar-name="${calendarName}">
                    <div class="calendar-item-header">
                        <div class="calendar-item-info">
                            <h6>${calendarName} ${!isVisible ? '<span class="calendar-hidden-badge">(Hidden)</span>' : ''}</h6>
                            <div class="calendar-item-meta">
                                <span>${totalEvents} events</span>
                                <span>${dateRange}</span>
                                <span class="calendar-item-priority">Priority ${primaryCalendar.priority}</span>
                                <span class="calendar-item-status ${isPublic ? 'public' : 'private'}">${isPublic ? 'Public' : 'Private'}</span>
                            </div>
                        </div>
                        <div class="calendar-item-actions">
                            <button onclick="toggleCalendarPublic('${calendarName}', ${isPublic ? 'false' : 'true'})" 
                                    title="${isPublic ? 'Make Private' : 'Make Public'}" 
                                    class="btn-toggle-public">
                                ${isPublic ? '🔒 Make Private' : '🌐 Make Public'}
                            </button>
                            <button onclick="toggleCalendarVisible('${calendarName}', ${isVisible ? 'false' : 'true'})" 
                                    title="${isVisible ? 'Hide from View' : 'Show in View'}" 
                                    class="btn-toggle-visible">
                                ${isVisible ? '👁️ Hide' : '👁️‍🗨️ Show'}
                            </button>
                            <button onclick="setCalendarPriority('${calendarName}', ${primaryCalendar.priority + 1})" title="Increase Priority">
                                ↑ Priority
                            </button>
                            ${primaryCalendar.priority > 1 ? `
                            <button onclick="setCalendarPriority('${calendarName}', ${primaryCalendar.priority - 1})" title="Decrease Priority">
                                ↓ Priority
                            </button>
                            ` : ''}
                            <button onclick="exportCalendar('${calendarName}')" class="btn-export" title="Export Calendar as JSON">
                                📤 Export
                            </button>
                            <button onclick="deleteCalendar('${calendarName}')" class="btn-danger" title="Delete Calendar">
                                Delete
                            </button>
                        </div>
                    </div>
                    <div class="calendar-item-details">
                        <div class="calendar-detail-item">
                            <span class="calendar-detail-label">Created</span>
                            <span class="calendar-detail-value">${new Date(primaryCalendar.first_event).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        html += '</div>';
    }
    
    // Render subscribed calendars
    if (subscribedCalendars.length > 0) {
        html += '<div class="calendar-section"><h6>Subscribed Calendars</h6>';
        
        // Group calendars by owner and name
        const calendarGroups = {};
        subscribedCalendars.forEach(cal => {
            const key = `${cal.owner_id}_${cal.calendar_name}`;
            if (!calendarGroups[key]) {
                calendarGroups[key] = [];
            }
            calendarGroups[key].push(cal);
        });
        
        html += Object.keys(calendarGroups).map(key => {
            const group = calendarGroups[key];
            const primaryCalendar = group[0];
            const totalEvents = group.reduce((sum, cal) => sum + parseInt(cal.event_count), 0);
            const dateRange = `${primaryCalendar.first_event} to ${primaryCalendar.last_event}`;
            
            return `
                <div class="calendar-item subscribed" data-calendar-name="${primaryCalendar.calendar_name}" data-owner-id="${primaryCalendar.owner_id}">
                    <div class="calendar-item-header">
                        <div class="calendar-item-info">
                            <h6>${primaryCalendar.calendar_name} <span class="calendar-owner">by ${primaryCalendar.owner_username}</span></h6>
                            <div class="calendar-item-meta">
                                <span>${totalEvents} events</span>
                                <span>${dateRange}</span>
                                <span class="calendar-item-status public">Public</span>
                            </div>
                        </div>
                        <div class="calendar-item-actions">
                            <button onclick="unsubscribeFromCalendar(${primaryCalendar.owner_id}, '${primaryCalendar.calendar_name}')" 
                                    class="btn-danger" title="Unsubscribe">
                                Unsubscribe
                            </button>
                        </div>
                    </div>
                    <div class="calendar-item-details">
                        <div class="calendar-detail-item">
                            <span class="calendar-detail-label">Owner</span>
                            <span class="calendar-detail-value">${primaryCalendar.owner_username}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        html += '</div>';
    }
    
    if (ownCalendars.length === 0 && subscribedCalendars.length === 0) {
        html = '<p class="no-calendars">No calendar imports found. Import some calendars to manage them here.</p>';
    }
    
    calendarsList.innerHTML = html;
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

/**
 * Toggle calendar visibility for owner (hide/show from own view)
 */
async function toggleCalendarVisible(calendarName, makeVisible) {
    try {
        const response = await apiFetch({
            module: 'calendar_events',
            action: 'setCalendarVisible',
            data: { 
                calendar_name: calendarName,
                is_visible: makeVisible
            }
        });
        
        if (response.success) {
            showToast({ message: response.message, type: 'success' });
            loadCalendarsList(); // Refresh the list
            loadCalendarData(); // Refresh calendar view
        } else {
            showToast({ message: response.error || 'Failed to update calendar visibility', type: 'error' });
        }
    } catch (error) {
        console.error('Error updating calendar visibility:', error);
        showToast({ message: 'Failed to update calendar visibility', type: 'error' });
    }
}

/**
 * Toggle calendar public/private status
 */
async function toggleCalendarPublic(calendarName, makePublic) {
    try {
        const response = await apiFetch({
            module: 'calendar_events',
            action: 'setCalendarPublic',
            data: { 
                calendar_name: calendarName,
                is_public: makePublic
            }
        });
        
        if (response.success) {
            showToast({ message: response.message, type: 'success' });
            loadCalendarsList(); // Refresh the list
            loadPublicCalendars(); // Refresh public calendars list if open
        } else {
            showToast({ message: response.error || 'Failed to update calendar status', type: 'error' });
        }
    } catch (error) {
        console.error('Error updating calendar public status:', error);
        showToast({ message: 'Failed to update calendar status', type: 'error' });
    }
}

/**
 * Subscribe to a public calendar
 */
async function subscribeToCalendar(ownerId, calendarName) {
    try {
        const response = await apiFetch({
            module: 'calendar_events',
            action: 'subscribeToCalendar',
            data: { 
                owner_id: ownerId,
                calendar_name: calendarName
            }
        });
        
        if (response.success) {
            showToast({ message: response.message, type: 'success' });
            loadCalendarsList(); // Refresh calendars list
            loadPublicCalendars(); // Refresh public calendars list
            loadCalendarData(); // Refresh calendar view
        } else {
            showToast({ message: response.error || 'Failed to subscribe to calendar', type: 'error' });
        }
    } catch (error) {
        console.error('Error subscribing to calendar:', error);
        showToast({ message: 'Failed to subscribe to calendar', type: 'error' });
    }
}

/**
 * Unsubscribe from a public calendar
 */
async function unsubscribeFromCalendar(ownerId, calendarName) {
    try {
        const response = await apiFetch({
            module: 'calendar_events',
            action: 'unsubscribeFromCalendar',
            data: { 
                owner_id: ownerId,
                calendar_name: calendarName
            }
        });
        
        if (response.success) {
            showToast({ message: response.message, type: 'success' });
            loadCalendarsList(); // Refresh calendars list
            loadPublicCalendars(); // Refresh public calendars list
            loadCalendarData(); // Refresh calendar view
        } else {
            showToast({ message: response.error || 'Failed to unsubscribe from calendar', type: 'error' });
        }
    } catch (error) {
        console.error('Error unsubscribing from calendar:', error);
        showToast({ message: 'Failed to unsubscribe from calendar', type: 'error' });
    }
}

/**
 * Load and display public calendars available for subscription
 */
async function loadPublicCalendars() {
    try {
        const response = await apiFetch({
            module: 'calendar_events',
            action: 'listPublicCalendars'
        });
        
        if (response.success) {
            renderPublicCalendars(response.data);
        } else {
            console.error('Error loading public calendars:', response.error);
        }
    } catch (error) {
        console.error('Error loading public calendars:', error);
    }
}

/**
 * Render public calendars list
 */
function renderPublicCalendars(calendars) {
    const publicCalendarsList = document.getElementById('public-calendars-list');
    if (!publicCalendarsList) return;
    
    if (calendars.length === 0) {
        publicCalendarsList.innerHTML = '<p class="no-calendars">No public calendars available for subscription.</p>';
        return;
    }
    
    // Group calendars by owner and name
    const calendarGroups = {};
    calendars.forEach(cal => {
        const key = `${cal.owner_id}_${cal.calendar_name}`;
        if (!calendarGroups[key]) {
            calendarGroups[key] = [];
        }
        calendarGroups[key].push(cal);
    });
    
    publicCalendarsList.innerHTML = Object.keys(calendarGroups).map(key => {
        const group = calendarGroups[key];
        const primaryCalendar = group[0];
        const totalEvents = group.reduce((sum, cal) => sum + parseInt(cal.event_count), 0);
        const dateRange = `${primaryCalendar.first_event} to ${primaryCalendar.last_event}`;
        const isSubscribed = primaryCalendar.is_subscribed === 1;
        
        return `
            <div class="calendar-item public-calendar" data-calendar-name="${primaryCalendar.calendar_name}" data-owner-id="${primaryCalendar.owner_id}">
                <div class="calendar-item-header">
                    <div class="calendar-item-info">
                        <h6>${primaryCalendar.calendar_name} <span class="calendar-owner">by ${primaryCalendar.owner_username}</span></h6>
                        <div class="calendar-item-meta">
                            <span>${totalEvents} events</span>
                            <span>${dateRange}</span>
                            <span class="calendar-item-status public">Public</span>
                        </div>
                    </div>
                    <div class="calendar-item-actions">
                        ${isSubscribed ? `
                            <button onclick="unsubscribeFromCalendar(${primaryCalendar.owner_id}, '${primaryCalendar.calendar_name}')" 
                                    class="btn-danger" title="Unsubscribe">
                                Unsubscribe
                            </button>
                        ` : `
                            <button onclick="subscribeToCalendar(${primaryCalendar.owner_id}, '${primaryCalendar.calendar_name}')" 
                                    class="btn-primary" title="Subscribe">
                                Subscribe
                            </button>
                        `}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Export calendar as JSON
 */
async function exportCalendar(calendarName, ownerId = null) {
    try {
        const response = await apiFetch({
            module: 'calendar_events',
            action: 'exportCalendar',
            data: {
                calendar_name: calendarName,
                owner_id: ownerId
            }
        });
        
        if (response.success) {
            openCalendarExportModal(calendarName, response.data);
        } else {
            showToast({ message: response.error || 'Failed to export calendar', type: 'error' });
        }
    } catch (error) {
        console.error('Error exporting calendar:', error);
        showToast({ message: 'Failed to export calendar', type: 'error' });
    }
}

/**
 * Open calendar export modal
 */
function openCalendarExportModal(calendarName, jsonData) {
    const overlay = document.getElementById('calendar-export-modal-overlay');
    const modal = document.getElementById('calendar-export-modal-container');
    const nameSpan = document.getElementById('export-calendar-name');
    const jsonTextarea = document.getElementById('calendar-export-json');
    
    if (!overlay || !modal || !nameSpan || !jsonTextarea) {
        console.error('Export modal elements not found');
        return;
    }
    
    nameSpan.textContent = calendarName;
    jsonTextarea.value = JSON.stringify(jsonData, null, 2);
    
    overlay.classList.remove('hidden');
    modal.classList.add('show');
    
    // Register modal for ESC key handling
    if (typeof registerModal === 'function') {
        registerModal('calendar-export-modal-overlay');
    }
}

/**
 * Close calendar export modal
 */
function closeCalendarExportModal() {
    const overlay = document.getElementById('calendar-export-modal-overlay');
    const modal = document.getElementById('calendar-export-modal-container');
    
    if (overlay && modal) {
        overlay.classList.add('hidden');
        modal.classList.remove('show');
        
        // Unregister modal
        if (typeof unregisterModal === 'function') {
            unregisterModal('calendar-export-modal-overlay');
        }
    }
}

/**
 * Copy export JSON to clipboard
 */
async function copyExportJson() {
    const jsonTextarea = document.getElementById('calendar-export-json');
    if (!jsonTextarea) {
        showToast({ message: 'Export textarea not found', type: 'error' });
        return;
    }
    
    try {
        await navigator.clipboard.writeText(jsonTextarea.value);
        showToast({ message: 'Calendar JSON copied to clipboard!', type: 'success' });
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        // Fallback: select the text
        jsonTextarea.select();
        jsonTextarea.setSelectionRange(0, 99999); // For mobile devices
        try {
            document.execCommand('copy');
            showToast({ message: 'Calendar JSON copied to clipboard!', type: 'success' });
        } catch (fallbackError) {
            showToast({ message: 'Failed to copy. Please select and copy manually.', type: 'error' });
        }
    }
}

// Calendar overlay will be initialized by app.js after tasks view is ready
