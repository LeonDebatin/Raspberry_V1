# Requirements Document

## Introduction

This feature implements a simplified Raspberry Pi GPIO controller for managing scent dispensers through a web interface. The system provides two main interfaces: a selection menu for immediate control of four different scent formulas (red, blue, yellow, green) with configurable timing parameters, and a scheduling interface for automated time-based scent activation.

## Requirements

### Requirement 1

**User Story:** As a user, I want to select between four different scent formulas from a circular menu interface, so that I can quickly activate the desired scent dispenser.

#### Acceptance Criteria

1. WHEN the selection page loads THEN the system SHALL display four formula buttons (red, blue, yellow, green) arranged in a circle
2. WHEN the selection page loads THEN the system SHALL display an "off" button in the center of the circle
3. WHEN a user clicks on a formula button THEN the system SHALL highlight the selected button with a green border
4. WHEN a user clicks the "off" button THEN the system SHALL deactivate all GPIO pins and remove any selection highlighting
5. WHEN a formula is selected THEN the system SHALL activate the corresponding GPIO pin according to the pin mapping configuration

### Requirement 2

**User Story:** As a user, I want to configure the timing parameters for scent activation, so that I can control how long and how frequently the scent is dispensed.

#### Acceptance Criteria

1. WHEN the selection page loads THEN the system SHALL display a configuration bar with cycle time options
2. WHEN the configuration bar is displayed THEN the system SHALL provide cycle time options of 10s, 30s, 60s, 120s, and 180s
3. WHEN the configuration bar is displayed THEN the system SHALL provide duration time options of 5s and 10s
4. WHEN a user selects a cycle time THEN the system SHALL use that interval for repeating the scent activation cycle
5. WHEN a user selects a duration time THEN the system SHALL keep the GPIO pin active for that duration during each cycle
6. WHEN no configuration is selected THEN the system SHALL use default values for cycle and duration times

### Requirement 3

**User Story:** As a developer, I want the system to use a configurable GPIO pin mapping file, so that GPIO pin assignments can be modified without changing the application code.

#### Acceptance Criteria

1. WHEN the system starts THEN the system SHALL load GPIO pin mappings from a JSON configuration file
2. WHEN the JSON configuration file is read THEN the system SHALL map red, blue, yellow, and green formulas to specific GPIO pin numbers
3. WHEN the JSON configuration file is missing THEN the system SHALL use default GPIO pin assignments (red: 18, blue: 19, yellow: 20, green: 21)
4. WHEN a formula is activated THEN the system SHALL control the GPIO pin specified in the mapping configuration
5. IF the JSON configuration file contains invalid pin numbers THEN the system SHALL log an error and use default mappings

### Requirement 4

**User Story:** As a user, I want to access a comprehensive time scheduling interface with multiple calendar views, so that I can easily visualize and manage automatic scent activation schedules across different time periods.

#### Acceptance Criteria

1. WHEN a user navigates to the schedule page THEN the system SHALL display a scheduling interface with daily, weekly, and monthly view options
2. WHEN the schedule page loads THEN the system SHALL default to the daily view showing the current day
3. WHEN a user switches between views THEN the system SHALL maintain the current date context and update the display accordingly
4. WHEN creating a schedule entry THEN the system SHALL allow selection of start time, end time, scent formula, recurrence pattern, cycle time, and duration parameters
5. WHEN a scheduled time is reached THEN the system SHALL automatically activate the specified scent with the configured parameters for the duration of the scheduled time window

### Requirement 5

**User Story:** As a user, I want to view my schedules in a daily calendar format, so that I can see hour-by-hour scheduling details for a specific day.

#### Acceptance Criteria

1. WHEN the daily view is active THEN the system SHALL display a 24-hour timeline with hourly time slots
2. WHEN schedules exist for the current day THEN the system SHALL display them as colored blocks in their corresponding time slots
3. WHEN a user clicks on an empty time slot THEN the system SHALL open the add schedule modal with the selected time pre-filled
4. WHEN a user clicks on an existing schedule block THEN the system SHALL open the edit modal for that schedule
5. WHEN navigating between days THEN the system SHALL update the schedule display to show schedules for the selected day
6. WHEN multiple schedules overlap in time THEN the system SHALL display them in a stacked or side-by-side layout within the time slot

### Requirement 6

**User Story:** As a user, I want to view my schedules in a weekly calendar format, so that I can see scheduling patterns across an entire week.

#### Acceptance Criteria

1. WHEN the weekly view is active THEN the system SHALL display a 7-day grid with days as columns and hours as rows
2. WHEN schedules exist for the current week THEN the system SHALL display them as colored indicators in their corresponding day/time cells
3. WHEN a user clicks on an empty day/time cell THEN the system SHALL open the add schedule modal with the selected day and time pre-filled
4. WHEN a user clicks on a schedule indicator THEN the system SHALL open the edit modal for that schedule
5. WHEN navigating between weeks THEN the system SHALL update the display to show schedules for the selected week
6. WHEN multiple schedules exist for the same day/time THEN the system SHALL show a count indicator or stacked display

### Requirement 7

**User Story:** As a user, I want to view my schedules in a monthly calendar format, so that I can see scheduling patterns across an entire month and plan long-term.

#### Acceptance Criteria

1. WHEN the monthly view is active THEN the system SHALL display a traditional calendar grid showing all days of the month
2. WHEN schedules exist for days in the current month THEN the system SHALL display them as small colored events on the corresponding dates
3. WHEN a user clicks on a date THEN the system SHALL show a detailed view of schedules for that day or open the add schedule modal
4. WHEN a user clicks on a schedule event THEN the system SHALL open the edit modal for that schedule
5. WHEN navigating between months THEN the system SHALL update the display to show schedules for the selected month
6. WHEN a date has multiple schedules THEN the system SHALL show up to 3 events and display a "+X more" indicator for additional schedules

### Requirement 8

**User Story:** As a user, I want intuitive navigation controls for the calendar views, so that I can easily move between different time periods and return to the current date.

#### Acceptance Criteria

1. WHEN any calendar view is active THEN the system SHALL display previous/next navigation buttons
2. WHEN the previous button is clicked THEN the system SHALL navigate to the previous day/week/month based on the current view
3. WHEN the next button is clicked THEN the system SHALL navigate to the next day/week/month based on the current view
4. WHEN the "Today" button is clicked THEN the system SHALL navigate to the current date in the active view
5. WHEN navigating THEN the system SHALL update the period text to show the current date range being displayed
6. WHEN the view is changed THEN the system SHALL maintain the currently selected date as the focus point

### Requirement 9

**User Story:** As a user, I want robust schedule management capabilities, so that I can create, edit, and delete schedules with proper validation and feedback.

#### Acceptance Criteria

1. WHEN creating a new schedule THEN the system SHALL validate that end time is after start time
2. WHEN creating a new schedule THEN the system SHALL validate that all required fields are filled
3. WHEN a schedule is successfully created THEN the system SHALL show a success notification and refresh the calendar display
4. WHEN editing an existing schedule THEN the system SHALL pre-populate the form with current values
5. WHEN deleting a schedule THEN the system SHALL ask for confirmation before removal
6. WHEN any schedule operation fails THEN the system SHALL display a clear error message explaining the issue
7. WHEN schedules are modified THEN the system SHALL immediately update the calendar display to reflect changes

### Requirement 10

**User Story:** As a user, I want the system to manage GPIO pin states safely during scheduled operations, so that scheduled activations work reliably without conflicts.

#### Acceptance Criteria

1. WHEN a scheduled activation begins THEN the system SHALL deactivate any manually activated formulas before starting the scheduled formula
2. WHEN multiple schedules overlap in time THEN the system SHALL handle conflicts by using the most recently started schedule
3. WHEN a scheduled activation ends THEN the system SHALL deactivate the GPIO pins and return to idle state
4. WHEN the system detects a GPIO error during scheduled operation THEN the system SHALL log the error and attempt to continue with remaining schedules
5. WHEN the application shuts down THEN the system SHALL properly clean up any active scheduled operations and GPIO states

### Requirement 11

**User Story:** As a user, I want the system to manage GPIO pin states safely during manual operations, so that only one scent formula is active at a time and pins are properly controlled.

#### Acceptance Criteria

1. WHEN a new formula is selected manually THEN the system SHALL deactivate any currently active GPIO pins before activating the new selection
2. WHEN the system shuts down THEN the system SHALL ensure all GPIO pins are set to inactive state
3. WHEN a GPIO operation fails THEN the system SHALL log the error and continue operating with remaining functionality
4. WHEN the "off" button is pressed THEN the system SHALL immediately deactivate all GPIO pins including any scheduled operations
5. IF multiple activation requests occur simultaneously THEN the system SHALL process them sequentially to prevent conflicts