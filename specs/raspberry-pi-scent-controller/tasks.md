# Implementation Plan

- [x] 1. Set up project structure and configuration files


  - Create Raspberry_V1 directory with Flask project structure
  - Create pin_mapping.json with default GPIO pin assignments for red, blue, yellow, green formulas
  - Create schedules.json file for storing enhanced schedule configurations with start/end times and recurrence
  - _Requirements: 3.1, 3.3_



- [ ] 2. Implement simplified GPIO controller
  - Create SimpleGPIOController class with single formula activation logic
  - Implement activate_formula method that deactivates other pins before activating selected pin
  - Add timing control for cycle duration and on-duration parameters


  - Include mock GPIO support for development environment
  - _Requirements: 11.1, 11.2, 11.3, 3.4_

- [ ] 3. Create Flask application with core routes
  - Set up Flask app with basic configuration and error handling


  - Implement route for selection menu page (GET /)
  - Implement route for schedule page (GET /schedule)
  - Add configuration loading functions for pin mapping and schedules
  - _Requirements: 1.1, 4.1, 3.1, 3.2_



- [ ] 4. Build circular selection interface
  - Create HTML template for selection page with circular button layout
  - Implement CSS Grid layout for four formula buttons arranged in circle
  - Add center "off" button with proper positioning
  - Style selected button with green border highlighting


  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 5. Add configuration controls to selection interface
  - Create configuration bar with cycle time dropdown (10s, 30s, 60s, 120s, 180s)
  - Add duration time selector with options for 5s and 10s


  - Implement JavaScript to capture and validate configuration selections
  - Set default values for timing parameters when no selection is made
  - _Requirements: 2.1, 2.2, 2.3, 2.6_

- [x] 6. Implement formula activation API endpoints


  - Create POST /api/activate endpoint to activate selected formula with timing parameters
  - Create POST /api/deactivate endpoint to turn off all GPIO pins
  - Add GET /api/status endpoint to return current GPIO pin states
  - Implement proper error handling and JSON response formatting
  - _Requirements: 1.5, 2.4, 2.5, 11.4_



- [ ] 7. Add JavaScript functionality for selection interface
  - Implement click handlers for formula buttons with visual feedback
  - Add AJAX calls to activation API endpoints
  - Create real-time status updates showing current active formula


  - Handle configuration parameter changes and validation
  - _Requirements: 1.3, 1.4, 2.4, 2.5_

- [ ] 8. Create enhanced schedule management HTML template
  - Build HTML template with multi-view calendar interface (daily, weekly, monthly)
  - Add view selector buttons and calendar navigation controls


  - Create modal form for schedule creation/editing with start/end times and recurrence patterns
  - Implement responsive layout for different calendar views
  - _Requirements: 4.1, 4.2, 5.1, 6.1, 7.1, 8.1_

- [ ] 9. Implement enhanced schedule management API endpoints
  - Update GET /api/schedules endpoint to handle enhanced schedule format


  - Modify POST /api/schedules endpoint for creating schedules with start/end times and recurrence
  - Add PUT /api/schedules/<id> endpoint for updating existing schedules
  - Update DELETE /api/schedules/<id> endpoint with proper validation
  - _Requirements: 4.4, 9.1, 9.2, 9.4_

- [x] 10. Build daily calendar view functionality


  - Create JavaScript class to render 24-hour timeline with time slots
  - Implement schedule event rendering within appropriate time slots
  - Add click handlers for empty time slots to create new schedules
  - Handle schedule event clicks for editing existing schedules
  - Implement schedule overlap handling with stacked display
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.6_



- [ ] 11. Build weekly calendar view functionality
  - Create 7-day grid layout with hours as rows and days as columns
  - Implement schedule indicator rendering for week view
  - Add click handlers for day/time cells to create schedules with pre-filled date/time
  - Handle multiple schedules in same cell with count indicators


  - Implement week navigation and date context management
  - _Requirements: 6.1, 6.2, 6.3, 6.5, 6.6_

- [ ] 12. Build monthly calendar view functionality
  - Create traditional calendar grid showing all days of the month
  - Implement schedule event rendering on date cells with color coding


  - Add click handlers for dates to show day details or create schedules
  - Handle multiple schedules per date with "+X more" indicators
  - Implement month navigation and proper date boundary handling
  - _Requirements: 7.1, 7.2, 7.3, 7.5, 7.6_

- [x] 13. Implement calendar navigation and view switching


  - Create navigation controls for previous/next period navigation
  - Add "Today" button to return to current date in any view
  - Implement view switching while maintaining date context
  - Update period text display for current date range
  - Handle date context preservation across view changes
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_



- [ ] 14. Add comprehensive schedule validation and user feedback
  - Implement client-side form validation for schedule creation/editing
  - Add success/error notification system for schedule operations
  - Create confirmation dialogs for schedule deletion
  - Implement real-time calendar updates after schedule modifications


  - Add proper error handling for API failures with user-friendly messages
  - _Requirements: 9.1, 9.2, 9.3, 9.5, 9.6, 9.7_

- [ ] 15. Enhance automatic schedule execution system
  - Update background thread to handle start/end time ranges and recurrence patterns
  - Implement schedule conflict resolution for overlapping time periods




  - Add proper GPIO state management for scheduled vs manual operations
  - Create schedule activation/deactivation logging
  - Handle schedule cleanup on application shutdown
  - _Requirements: 4.5, 10.1, 10.2, 10.3, 10.5_

- [ ] 16. Implement GPIO safety for scheduled operations
  - Add conflict detection between manual and scheduled activations
  - Implement priority system for overlapping schedules
  - Create safe GPIO state transitions during schedule changes
  - Add error recovery for GPIO failures during scheduled operations
  - Ensure proper cleanup of scheduled operations on shutdown
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 11.5_

- [ ] 17. Create comprehensive CSS styling for calendar views
  - Style daily view time grid with proper spacing and visual hierarchy
  - Create responsive weekly view grid with clear day/hour boundaries
  - Design monthly view calendar with proper date cell sizing
  - Add color coding for different formula types across all views
  - Implement hover states and interactive feedback for all calendar elements
  - _Requirements: 5.2, 6.2, 7.2_

- [ ] 18. Add notification system and user feedback
  - Create notification component for success/error/warning messages
  - Implement toast notifications for schedule operations
  - Add loading states for API operations
  - Create confirmation dialogs with proper styling
  - Implement notification auto-dismiss and manual close functionality
  - _Requirements: 9.3, 9.6_

- [ ] 19. Create comprehensive test suite
  - Write unit tests for enhanced schedule management API endpoints
  - Add tests for calendar view rendering and navigation
  - Create integration tests for schedule CRUD operations across all views
  - Test schedule execution system with various recurrence patterns
  - Add tests for GPIO safety and conflict resolution
  - _Requirements: All requirements validation_

- [ ] 20. Add application startup and configuration
  - Create main application entry point with proper initialization
  - Implement configuration file loading with error handling and defaults
  - Add application logging configuration
  - Create startup script for Raspberry Pi deployment
  - Add graceful shutdown handling for scheduled operations
  - _Requirements: 3.1, 3.2, 3.3, 11.2, 10.5_