// Simple Schedule Manager with working edit functionality

class SimpleScheduleManager {
    constructor() {
        this.schedules = [];
        this.editingId = null;
        this.currentView = 'daily';
        this.currentDate = new Date();

        // Wait for DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        console.log('Initializing SimpleScheduleManager');
        this.bindEvents();
        this.setupStrengthSlider();
        this.loadSchedules();
        // Start with daily view and render immediately
        this.switchView('daily');
        this.renderCalendarView();
    }

    bindEvents() {
        // Add schedule button
        const addBtn = document.getElementById('add-schedule-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.showAddModal());
        }

        // Modal close buttons
        const modalClose = document.getElementById('modal-close');
        const cancelBtn = document.getElementById('cancel-btn');
        const deleteBtn = document.getElementById('delete-btn');

        if (modalClose) modalClose.addEventListener('click', () => this.hideModal());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.hideModal());
        if (deleteBtn) deleteBtn.addEventListener('click', () => this.handleDelete());

        // Form submission
        const form = document.getElementById('schedule-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSubmit();
            });
        }

        // Modal backdrop click
        const modal = document.getElementById('schedule-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.hideModal();
            });
        }

        // View selector buttons
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchView(e.target.dataset.view);
            });
        });
        
        // Calendar navigation
        const prevBtn = document.getElementById('prev-period');
        const nextBtn = document.getElementById('next-period');
        const todayBtn = document.getElementById('today-btn');
        
        if (prevBtn) prevBtn.addEventListener('click', () => this.navigatePrevious());
        if (nextBtn) nextBtn.addEventListener('click', () => this.navigateNext());
        if (todayBtn) todayBtn.addEventListener('click', () => this.goToToday());
        
        // Global click handler for schedule events and time slots
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('time-slot')) {
                const hour = parseInt(e.target.dataset.hour);
                this.handleTimeSlotClick(hour);
            } else if (e.target.classList.contains('schedule-event') || e.target.closest('.schedule-event')) {
                // Handle clicks on schedule events
                const eventElement = e.target.classList.contains('schedule-event') ? e.target : e.target.closest('.schedule-event');
                if (eventElement && eventElement.dataset.id) {
                    const scheduleId = parseInt(eventElement.dataset.id);
                    this.editSchedule(scheduleId);
                }
            } else if (e.target.classList.contains('schedule-indicator') || e.target.closest('.schedule-indicator')) {
                // Handle clicks on weekly view schedule indicators
                const indicatorElement = e.target.classList.contains('schedule-indicator') ? e.target : e.target.closest('.schedule-indicator');
                if (indicatorElement && indicatorElement.dataset.id) {
                    const scheduleId = parseInt(indicatorElement.dataset.id);
                    this.editSchedule(scheduleId);
                }
            } else if (e.target.classList.contains('week-day-slot')) {
                // Handle clicks on empty week day slots
                const hour = parseInt(e.target.dataset.hour);
                const day = parseInt(e.target.dataset.day);
                this.handleWeekSlotClick(hour, day, e.target.dataset.date);
            }
        });


    }

    setupStrengthSlider() {
        const strengthSlider = document.getElementById('strength-slider');
        const strengthValue = document.getElementById('strength-seconds');
        
        if (strengthSlider && strengthValue) {
            strengthSlider.addEventListener('input', (e) => {
                strengthValue.textContent = e.target.value;
            });
        }

        // Handle recurrence change to show/hide date field
        const recurrenceSelect = document.getElementById('recurrence');
        const dateGroup = document.getElementById('date-group');
        const dateInput = document.getElementById('schedule-date');
        
        if (recurrenceSelect && dateGroup && dateInput) {
            recurrenceSelect.addEventListener('change', (e) => {
                if (e.target.value === 'once') {
                    dateGroup.style.display = 'block';
                    dateInput.required = true;
                    // Set default to today
                    const today = new Date().toISOString().split('T')[0];
                    dateInput.value = today;
                } else {
                    dateGroup.style.display = 'none';
                    dateInput.required = false;
                    dateInput.value = '';
                }
            });
        }
    }

    showAddModal() {
        console.log('Showing add modal');
        this.editingId = null;
        this.resetForm();

        document.getElementById('modal-title').textContent = 'Add New Schedule';
        document.getElementById('submit-btn').textContent = 'Add Schedule';
        document.getElementById('delete-btn').classList.add('hidden');
        document.getElementById('schedule-modal').classList.remove('hidden');
        document.getElementById('start-time').focus();
    }

    editSchedule(id) {
        console.log('Editing schedule with ID:', id);
        const schedule = this.schedules.find(s => s.id === id);
        if (!schedule) {
            console.error('Schedule not found:', id);
            window.notifications.error('Schedule not found');
            return;
        }

        this.editingId = id;
        this.populateForm(schedule);

        const modalTitle = document.getElementById('modal-title');
        const submitBtn = document.getElementById('submit-btn');
        const deleteBtn = document.getElementById('delete-btn');
        const modal = document.getElementById('schedule-modal');
        const startTimeInput = document.getElementById('start-time');

        if (modalTitle) modalTitle.textContent = 'Edit Schedule';
        if (submitBtn) submitBtn.textContent = 'Update Schedule';
        if (deleteBtn) deleteBtn.classList.remove('hidden');
        if (modal) modal.classList.remove('hidden');
        if (startTimeInput) startTimeInput.focus();

        console.log('Edit modal opened for schedule:', schedule);
    }

    populateForm(schedule) {
        console.log('Populating form with:', schedule);

        document.getElementById('schedule-id').value = schedule.id;
        document.getElementById('start-time').value = schedule.start_time || schedule.time || '';
        document.getElementById('end-time').value = schedule.end_time || '';
        document.getElementById('formula').value = schedule.formula || '';
        document.getElementById('recurrence').value = schedule.recurrence || 'daily';
        
        // Handle date field for one-time events
        const dateGroup = document.getElementById('date-group');
        const dateInput = document.getElementById('schedule-date');
        if (schedule.recurrence === 'once') {
            if (dateGroup && dateInput) {
                dateGroup.style.display = 'block';
                dateInput.required = true;
                dateInput.value = schedule.schedule_date || '';
            }
        } else {
            if (dateGroup && dateInput) {
                dateGroup.style.display = 'none';
                dateInput.required = false;
                dateInput.value = '';
            }
        }
        
        const strengthSlider = document.getElementById('strength-slider');
        const strengthValue = document.getElementById('strength-seconds');
        if (strengthSlider && strengthValue) {
            strengthSlider.value = schedule.duration || 10;
            strengthValue.textContent = schedule.duration || 10;
        }
    }

    resetForm() {
        document.getElementById('schedule-form').reset();
        document.getElementById('schedule-id').value = '';
        document.getElementById('recurrence').value = 'daily';
        
        // Hide date field
        const dateGroup = document.getElementById('date-group');
        const dateInput = document.getElementById('schedule-date');
        if (dateGroup && dateInput) {
            dateGroup.style.display = 'none';
            dateInput.required = false;
            dateInput.value = '';
        }
        
        const strengthSlider = document.getElementById('strength-slider');
        const strengthValue = document.getElementById('strength-seconds');
        if (strengthSlider && strengthValue) {
            strengthSlider.value = 10;
            strengthValue.textContent = 10;
        }
    }

    hideModal() {
        document.getElementById('schedule-modal').classList.add('hidden');
        this.editingId = null;
    }

    handleDelete() {
        if (this.editingId) {
            this.deleteSchedule(this.editingId);
            this.hideModal();
        }
    }

    async handleSubmit() {
        const formData = this.getFormData();

        if (!this.validateForm(formData)) {
            return;
        }

        try {
            if (this.editingId) {
                await this.updateSchedule(this.editingId, formData);
            } else {
                await this.createSchedule(formData);
            }

            this.hideModal();
            this.loadSchedules();

        } catch (error) {
            console.error('Error saving schedule:', error);
            window.notifications.error('Failed to save schedule: ' + error.message);
        }
    }

    getFormData() {
        const strengthSlider = document.getElementById('strength-slider');
        const recurrence = document.getElementById('recurrence').value;
        const data = {
            start_time: document.getElementById('start-time').value,
            end_time: document.getElementById('end-time').value,
            formula: document.getElementById('formula').value,
            recurrence: recurrence,
            cycle_time: 60, // Fixed at 60 seconds
            duration: parseInt(strengthSlider ? strengthSlider.value : 10)
        };
        
        // Add date for one-time events
        if (recurrence === 'once') {
            data.schedule_date = document.getElementById('schedule-date').value;
        }
        
        return data;
    }

    validateForm(data) {
        if (!data.start_time || !data.end_time || !data.formula) {
            window.notifications.warning('Please fill in all required fields');
            return false;
        }

        if (data.start_time >= data.end_time) {
            window.notifications.warning('End time must be after start time');
            return false;
        }

        return true;
    }

    async createSchedule(data) {
        console.log('Creating schedule:', data);

        const response = await fetch('/api/schedules', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create schedule');
        }

        const newSchedule = await response.json();
        console.log('Schedule created:', newSchedule);

        window.notifications.success(
            `Schedule created: ${this.getFormulaName(data.formula)} from ${this.formatTime(data.start_time)} to ${this.formatTime(data.end_time)}`
        );
    }

    async updateSchedule(id, data) {
        console.log('Updating schedule:', id, data);

        const response = await fetch(`/api/schedules/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update schedule');
        }

        const updatedSchedule = await response.json();
        console.log('Schedule updated:', updatedSchedule);

        window.notifications.success(
            `Schedule updated: ${this.getFormulaName(data.formula)} from ${this.formatTime(data.start_time)} to ${this.formatTime(data.end_time)}`
        );
    }

    async deleteSchedule(id) {
        const schedule = this.schedules.find(s => s.id === id);
        if (!schedule) return;

        const confirmed = confirm(
            `Delete schedule for ${this.getFormulaName(schedule.formula)} from ${this.formatTime(schedule.start_time || schedule.time)} to ${this.formatTime(schedule.end_time)}?`
        );

        if (!confirmed) return;

        try {
            const response = await fetch(`/api/schedules/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete schedule');
            }

            this.loadSchedules();
            window.notifications.success('Schedule deleted');

        } catch (error) {
            console.error('Error deleting schedule:', error);
            window.notifications.error('Failed to delete schedule: ' + error.message);
        }
    }

    async loadSchedules() {
        try {
            const response = await fetch('/api/schedules');
            const data = await response.json();
            this.schedules = data.schedules || [];
            
            // Always render calendar view after loading schedules
            this.renderCalendarView();

        } catch (error) {
            console.error('Error loading schedules:', error);
            window.notifications.error('Failed to load schedules: ' + error.message);
        }
    }

    renderSchedules() {
        const container = document.getElementById('schedule-list');
        if (!container) return;

        if (this.schedules.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No Schedules</h3>
                    <p>Click "Add Schedule" to create your first automated scent activation</p>
                </div>
            `;
            return;
        }

        // Sort schedules by start time
        const sortedSchedules = [...this.schedules].sort((a, b) => {
            const timeA = a.start_time || a.time || '';
            const timeB = b.start_time || b.time || '';
            return timeA.localeCompare(timeB);
        });

        container.innerHTML = sortedSchedules.map(schedule => this.renderScheduleItem(schedule)).join('');
    }

    renderScheduleItem(schedule) {
        const startTime = schedule.start_time || schedule.time || '';
        const endTime = schedule.end_time || '';

        return `
            <div class="schedule-item">
                <div class="schedule-main">
                    <div class="schedule-time">
                        ${this.formatTime(startTime)} - ${this.formatTime(endTime)}
                    </div>
                    <div class="schedule-formula ${schedule.formula}">
                        ${this.getFormulaName(schedule.formula)}
                    </div>
                </div>
                
                <div class="schedule-details">
                    <span class="schedule-recurrence">
                        ${this.getRecurrenceName(schedule.recurrence)}
                        ${schedule.recurrence === 'once' && schedule.schedule_date ? ` - ${this.formatDate(schedule.schedule_date)}` : ''}
                    </span>
                    <span class="schedule-params">Strength: ${schedule.duration || 10}s of 60s</span>
                </div>
                
                <div class="schedule-actions">
                    <button class="edit-btn" data-id="${schedule.id}" title="Edit">✏️</button>
                    <button class="delete-btn" data-id="${schedule.id}" title="Delete">🗑️</button>
                </div>
            </div>
        `;
    }

    formatTime(timeString) {
        if (!timeString) return '';
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    }

    getFormulaName(formula) {
        const names = {
            red: 'Crimson',
            blue: 'Azure',
            yellow: 'Amber',
            green: 'Sage'
        };
        return names[formula] || formula;
    }

    getRecurrenceName(recurrence) {
        const names = {
            once: 'One Time',
            daily: 'Daily',
            weekdays: 'Weekdays',
            weekends: 'Weekends',
            monday: 'Mondays',
            tuesday: 'Tuesdays',
            wednesday: 'Wednesdays',
            thursday: 'Thursdays',
            friday: 'Fridays',
            saturday: 'Saturdays',
            sunday: 'Sundays'
        };
        return names[recurrence] || recurrence;
    }

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // Calendar functionality
    switchView(view) {
        this.currentView = view;
        
        // Update view buttons
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        
        // Show/hide appropriate containers
        const scheduleList = document.getElementById('schedule-list');
        const calendarContainer = document.getElementById('calendar-container');
        const calendarNav = document.getElementById('calendar-navigation');
        
        if (view === 'list') {
            if (scheduleList) scheduleList.style.display = 'flex';
            if (calendarContainer) calendarContainer.style.display = 'none';
            if (calendarNav) calendarNav.style.display = 'none';
            this.renderSchedules();
        } else {
            if (scheduleList) scheduleList.style.display = 'none';
            if (calendarContainer) calendarContainer.style.display = 'block';
            if (calendarNav) calendarNav.style.display = 'flex';
            
            // Force render calendar view after a short delay to ensure DOM is ready
            setTimeout(() => {
                this.renderCalendarView();
            }, 50);
        }
    }
    
    navigatePrevious() {
        switch (this.currentView) {
            case 'daily':
                this.currentDate.setDate(this.currentDate.getDate() - 1);
                break;
            case 'weekly':
                this.currentDate.setDate(this.currentDate.getDate() - 7);
                break;
            case 'monthly':
                this.currentDate.setMonth(this.currentDate.getMonth() - 1);
                break;
        }
        this.renderCalendarView();
    }
    
    navigateNext() {
        switch (this.currentView) {
            case 'daily':
                this.currentDate.setDate(this.currentDate.getDate() + 1);
                break;
            case 'weekly':
                this.currentDate.setDate(this.currentDate.getDate() + 7);
                break;
            case 'monthly':
                this.currentDate.setMonth(this.currentDate.getMonth() + 1);
                break;
        }
        this.renderCalendarView();
    }
    
    goToToday() {
        this.currentDate = new Date();
        this.renderCalendarView();
    }
    
    renderCalendarView() {
        console.log('Rendering calendar view:', this.currentView);
        this.updatePeriodText();
        
        // Show appropriate calendar view
        document.querySelectorAll('.calendar-view').forEach(view => {
            view.classList.toggle('active', view.id === `${this.currentView}-view`);
        });
        
        switch (this.currentView) {
            case 'daily':
                console.log('Rendering daily view');
                this.renderDailyView();
                break;
            case 'weekly':
                console.log('Rendering weekly view');
                this.renderWeeklyView();
                break;
            case 'monthly':
                console.log('Rendering monthly view');
                this.renderMonthlyView();
                break;
        }
    }
    
    updatePeriodText() {
        const periodText = document.getElementById('current-period-text');
        if (!periodText) return;
        
        let text = '';
        switch (this.currentView) {
            case 'daily':
                text = this.currentDate.toLocaleDateString('en-US', { 
                    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' 
                });
                break;
            case 'weekly':
                const weekStart = this.getWeekStart(this.currentDate);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);
                text = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
                break;
            case 'monthly':
                text = this.currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
                break;
        }
        periodText.textContent = text;
    }
    
    renderDailyView() {
        const timeLabels = document.querySelector('#daily-view .time-labels');
        const timeSlots = document.querySelector('#daily-view .time-slots');
        
        if (!timeLabels || !timeSlots) return;
        
        timeLabels.innerHTML = '';
        timeSlots.innerHTML = '';
        
        // Generate 24-hour time slots
        for (let hour = 0; hour < 24; hour++) {
            const timeLabel = document.createElement('div');
            timeLabel.className = 'time-label';
            timeLabel.textContent = this.formatHour(hour);
            timeLabels.appendChild(timeLabel);
            
            const timeSlot = document.createElement('div');
            timeSlot.className = 'time-slot';
            timeSlot.dataset.hour = hour;
            timeSlots.appendChild(timeSlot);
            
            // Add schedules for this hour
            this.addSchedulesToTimeSlot(timeSlot, hour);
        }
    }
    
    renderWeeklyView() {
        const weekGrid = document.querySelector('#weekly-view .week-grid');
        if (!weekGrid) return;
        
        weekGrid.innerHTML = '';
        
        const weekStart = this.getWeekStart(this.currentDate);
        
        // Generate time slots for each hour
        for (let hour = 0; hour < 24; hour++) {
            // Time label
            const timeLabel = document.createElement('div');
            timeLabel.className = 'week-time-label';
            timeLabel.textContent = this.formatHour(hour);
            weekGrid.appendChild(timeLabel);
            
            // Day slots for this hour
            for (let day = 0; day < 7; day++) {
                const daySlot = document.createElement('div');
                daySlot.className = 'week-day-slot';
                daySlot.dataset.hour = hour;
                daySlot.dataset.day = day;
                
                const slotDate = new Date(weekStart);
                slotDate.setDate(slotDate.getDate() + day);
                daySlot.dataset.date = slotDate.toISOString().split('T')[0];
                
                weekGrid.appendChild(daySlot);
                
                // Add schedules for this day/hour
                this.addSchedulesToWeekSlot(daySlot, hour, slotDate);
            }
        }
    }
    
    renderMonthlyView() {
        const monthGrid = document.querySelector('#monthly-view .month-grid');
        if (!monthGrid) return;
        
        monthGrid.innerHTML = '';
        
        const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        const startDate = this.getWeekStart(firstDay);
        
        // Generate 6 weeks (42 days)
        for (let i = 0; i < 42; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            
            const dateEl = document.createElement('div');
            dateEl.className = 'month-date';
            dateEl.dataset.date = date.toISOString().split('T')[0];
            
            if (date.getMonth() !== this.currentDate.getMonth()) {
                dateEl.classList.add('other-month');
            }
            
            if (this.isToday(date)) {
                dateEl.classList.add('today');
            }
            
            const dateNumber = document.createElement('div');
            dateNumber.className = 'date-number';
            dateNumber.textContent = date.getDate();
            dateEl.appendChild(dateNumber);
            
            monthGrid.appendChild(dateEl);
            
            // Add schedules for this date
            this.addSchedulesToDate(dateEl, date);
        }
    }
    
    handleTimeSlotClick(hour) {
        this.showAddModal();
        const startTime = `${hour.toString().padStart(2, '0')}:00`;
        const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
        document.getElementById('start-time').value = startTime;
        document.getElementById('end-time').value = endTime;
    }

    handleWeekSlotClick(hour, day, dateString) {
        this.showAddModal();
        const startTime = `${hour.toString().padStart(2, '0')}:00`;
        const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
        document.getElementById('start-time').value = startTime;
        document.getElementById('end-time').value = endTime;
        
        // Set recurrence based on the day clicked
        const date = new Date(dateString);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        const recurrenceSelect = document.getElementById('recurrence');
        if (recurrenceSelect) {
            recurrenceSelect.value = dayName;
        }
    }


    
    addSchedulesToTimeSlot(slot, hour) {
        const daySchedules = this.getSchedulesForDate(this.currentDate);
        const hourSchedules = daySchedules.filter(s => {
            const startTime = s.start_time || s.time || '';
            const endTime = s.end_time || '';
            
            if (!startTime) return false;
            
            const startHour = parseInt(startTime.split(':')[0]);
            const endHour = endTime ? parseInt(endTime.split(':')[0]) : startHour + 1;
            
            return hour >= startHour && hour < endHour;
        });
        
        hourSchedules.forEach(schedule => {
            const event = this.createScheduleEvent(schedule);
            slot.appendChild(event);
        });
    }
    
    addSchedulesToWeekSlot(slot, hour, date) {
        const daySchedules = this.getSchedulesForDate(date);
        const hourSchedules = daySchedules.filter(s => {
            const startTime = s.start_time || s.time || '';
            const endTime = s.end_time || '';
            
            if (!startTime) return false;
            
            const startHour = parseInt(startTime.split(':')[0]);
            const endHour = endTime ? parseInt(endTime.split(':')[0]) : startHour + 1;
            
            return hour >= startHour && hour < endHour;
        });
        
        if (hourSchedules.length > 0) {
            const schedule = hourSchedules[0];
            const indicator = document.createElement('div');
            indicator.className = `schedule-indicator ${schedule.formula}`;
            indicator.dataset.id = schedule.id;
            indicator.style.cursor = 'pointer';
            
            // Create more detailed tooltip
            const startTime = schedule.start_time || schedule.time || '';
            const endTime = schedule.end_time || '';
            const formulaName = this.getFormulaName(schedule.formula);
            
            indicator.title = `${formulaName}: ${this.formatTime(startTime)}-${this.formatTime(endTime)}${hourSchedules.length > 1 ? ` (+${hourSchedules.length - 1} more)` : ''}`;
            
            // Add text content for better visibility
            const timeOnly = this.formatTime(startTime).split(' ')[0]; // Get just the time part
            indicator.innerHTML = `
                <div class="indicator-content">
                    <div class="indicator-time">${timeOnly}</div>
                    <div class="indicator-formula">${formulaName}</div>
                </div>
            `;
            
            slot.appendChild(indicator);
        }
    }
    
    addSchedulesToDate(dateEl, date) {
        const daySchedules = this.getSchedulesForDate(date);
        
        daySchedules.slice(0, 3).forEach(schedule => {
            const event = this.createScheduleEvent(schedule, true);
            dateEl.appendChild(event);
        });
        
        if (daySchedules.length > 3) {
            const moreEl = document.createElement('div');
            moreEl.className = 'schedule-more';
            moreEl.textContent = `+${daySchedules.length - 3} more`;
            dateEl.appendChild(moreEl);
        }
    }
    
    createScheduleEvent(schedule, compact = false) {
        const event = document.createElement('div');
        event.className = `schedule-event ${schedule.formula}`;
        event.dataset.id = schedule.id;
        event.style.cursor = 'pointer';
        event.title = 'Click to edit schedule';
        
        const startTime = schedule.start_time || schedule.time || '';
        const endTime = schedule.end_time || '';
        
        if (compact) {
            event.innerHTML = `
                <div class="schedule-event-time">${this.formatTime(startTime)}</div>
                <div class="schedule-event-formula">${this.getFormulaName(schedule.formula)}</div>
            `;
        } else {
            event.innerHTML = `
                <div class="schedule-event-time">${this.formatTime(startTime)}-${this.formatTime(endTime)}</div>
                <div class="schedule-event-formula">${this.getFormulaName(schedule.formula)}</div>
            `;
        }
        
        return event;
    }
    
    getSchedulesForDate(date) {
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        
        return this.schedules.filter(schedule => {
            if (!schedule.enabled) return false;
            
            const recurrence = schedule.recurrence || 'daily';
            
            switch (recurrence) {
                case 'daily':
                    return true;
                case 'weekdays':
                    return ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(dayName);
                case 'weekends':
                    return ['saturday', 'sunday'].includes(dayName);
                default:
                    return recurrence === dayName;
            }
        });
    }
    
    formatHour(hour) {
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour} ${ampm}`;
    }
    
    getWeekStart(date) {
        const start = new Date(date);
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
        start.setDate(diff);
        return start;
    }
    
    isToday(date) {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }
}

// Initialize the schedule manager
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM loaded, creating SimpleScheduleManager');
    window.scheduleManager = new SimpleScheduleManager();
});