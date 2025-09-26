from flask import Flask, render_template, request, jsonify
import json
import os
from datetime import datetime, timedelta
import threading
import time
from gpio_controller import SimpleGPIOController

app = Flask(__name__)
app.config["SECRET_KEY"] = "scent-controller-secret-key"

# Initialize GPIO controller
gpio_controller = SimpleGPIOController()


def load_pin_mapping():
    """Load GPIO pin mapping from JSON file"""
    default_mapping = {"formulas": {"yellow": 18,  "green": 19,  "red": 20,  "blue": 21}}

    try:
        if os.path.exists("pin_mapping.json"):
            with open("pin_mapping.json", "r") as f:
                return json.load(f)
        else:
            # Create default mapping file
            with open("pin_mapping.json", "w") as f:
                json.dump(default_mapping, f, indent=2)
            return default_mapping
    except Exception as e:
        app.logger.error(f"Error loading pin mapping: {e}")
        return default_mapping


def load_schedules():
    """Load scheduled items from JSON file"""
    default_schedules = {"schedules": []}

    try:
        if os.path.exists("schedules.json"):
            with open("schedules.json", "r") as f:
                return json.load(f)
        else:
            # Create default schedules file
            with open("schedules.json", "w") as f:
                json.dump(default_schedules, f, indent=2)
            return default_schedules
    except Exception as e:
        app.logger.error(f"Error loading schedules: {e}")
        return default_schedules


def save_schedules(schedules_data):
    """Save schedules to JSON file"""
    try:
        with open("schedules.json", "w") as f:
            json.dump(schedules_data, f, indent=2)
        return True
    except Exception as e:
        app.logger.error(f"Error saving schedules: {e}")
        return False


# Load configurations
pin_mapping = load_pin_mapping()
gpio_controller.set_pin_mapping(pin_mapping["formulas"])


@app.route("/")
def selection():
    """Main selection menu page"""
    return render_template("selection.html")


@app.route("/schedule")
def schedule():
    """Time scheduling page"""
    return render_template("schedule.html")


@app.route("/quiz")
def quiz():
    """Scent preference quiz page"""
    return render_template("quiz.html")


@app.route("/information")
def information():
    """Scent information and controls page"""
    return render_template("information.html")


@app.route("/api/activate", methods=["POST"])
def activate_formula():
    """Activate formula with configuration"""
    try:
        data = request.get_json()
        color = data.get("color")
        cycle_time = data.get("cycle_time", 60)
        duration = data.get("duration", 10)

        if color not in ["red", "blue", "yellow", "green"]:
            return jsonify({"error": "Invalid color"}), 400

        # Manual activation - this will override any scheduled formula
        success = gpio_controller.activate_formula(
            color,
            cycle_time,
            duration,
            is_scheduled=False,  # This is a manual activation
            activation_duration=None,  # Manual activations run indefinitely until stopped
        )

        if success:
            return jsonify(
                {
                    "status": "success",
                    "active_formula": color,
                    "cycle_time": cycle_time,
                    "duration": duration,
                    "user_override": gpio_controller.user_override,
                }
            )
        else:
            return jsonify({"error": "Failed to activate formula"}), 500

    except Exception as e:
        app.logger.error(f"Error activating formula: {e}")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/api/deactivate", methods=["POST"])
def deactivate_all():
    """Deactivate all formulas"""
    try:
        gpio_controller.deactivate_all()
        return jsonify(
            {"status": "success", "active_formula": None, "user_override": False}
        )
    except Exception as e:
        app.logger.error(f"Error deactivating formulas: {e}")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/api/status", methods=["GET"])
def get_status():
    """Get current GPIO pin states"""
    try:
        status = gpio_controller.get_status()
        return jsonify(status)
    except Exception as e:
        app.logger.error(f"Error getting status: {e}")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/api/clear-override", methods=["POST"])
def clear_user_override():
    """Clear user override to allow schedules to resume"""
    try:
        gpio_controller.clear_user_override()
        return jsonify(
            {
                "status": "success",
                "user_override": False,
                "message": "User override cleared - schedules can now resume",
            }
        )
    except Exception as e:
        app.logger.error(f"Error clearing user override: {e}")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/api/reload-pin-mapping", methods=["POST"])
def reload_pin_mapping():
    """Reload pin mapping from JSON file without restarting the app"""
    try:
        # Deactivate all current formulas first
        gpio_controller.deactivate_all()
        
        # Reload pin mapping from file
        new_pin_mapping = load_pin_mapping()
        gpio_controller.set_pin_mapping(new_pin_mapping["formulas"])
        
        return jsonify(
            {
                "status": "success",
                "message": "Pin mapping reloaded successfully",
                "pin_mapping": new_pin_mapping["formulas"]
            }
        )
    except Exception as e:
        app.logger.error(f"Error reloading pin mapping: {e}")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/api/schedule-status", methods=["GET"])
def get_schedule_status():
    """Get detailed schedule status including next upcoming schedule"""
    try:
        schedules_data = load_schedules()
        current_time = datetime.now().strftime("%H:%M")

        # Find currently active schedule
        active_schedule = find_active_schedule_for_time(schedules_data, current_time)

        # Find next upcoming schedule
        next_schedule = None
        current_datetime = datetime.now()

        for schedule in schedules_data.get("schedules", []):
            if (
                schedule.get("enabled")
                and should_activate_schedule(schedule)
                and schedule.get("start_time")
            ):

                # Parse start time for today
                start_time = datetime.strptime(schedule["start_time"], "%H:%M").time()
                start_datetime = datetime.combine(current_datetime.date(), start_time)

                # If start time has passed today, check tomorrow
                if start_datetime <= current_datetime:
                    start_datetime += timedelta(days=1)

                if not next_schedule or start_datetime < next_schedule["datetime"]:
                    next_schedule = {"schedule": schedule, "datetime": start_datetime}

        return jsonify(
            {
                "current_time": current_time,
                "active_schedule": active_schedule,
                "next_schedule": next_schedule["schedule"] if next_schedule else None,
                "next_schedule_time": (
                    next_schedule["datetime"].strftime("%H:%M")
                    if next_schedule
                    else None
                ),
                "gpio_status": gpio_controller.get_status(),
            }
        )
    except Exception as e:
        app.logger.error(f"Error getting schedule status: {e}")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/api/schedules", methods=["GET"])
def get_schedules():
    """Get all scheduled items"""
    try:
        schedules_data = load_schedules()
        return jsonify(schedules_data)
    except Exception as e:
        app.logger.error(f"Error getting schedules: {e}")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/api/schedules", methods=["POST"])
def create_schedule():
    """Create new scheduled item"""
    try:
        data = request.get_json()

        # Validate schedule data
        validation_error = validate_schedule_data(data)
        if validation_error:
            return jsonify({"error": validation_error}), 400

        schedules_data = load_schedules()

        # Create new schedule object
        max_id = max([s.get("id", 0) for s in schedules_data["schedules"]], default=0)
        new_schedule = {
            "id": max_id + 1,
            "start_time": data.get("start_time"),
            "end_time": data.get("end_time"),
            "formula": data.get("formula"),
            "cycle_time": data.get("cycle_time", 60),
            "duration": data.get("duration", 10),
            "recurrence": data.get("recurrence", "daily"),
            "enabled": True,
        }

        # Check for overlapping schedules
        overlapping = find_overlapping_schedules(
            new_schedule, schedules_data["schedules"]
        )
        if overlapping:
            overlap_details = []
            for schedule in overlapping:
                overlap_details.append(
                    {
                        "id": schedule["id"],
                        "formula": schedule["formula"],
                        "time_range": f"{schedule['start_time']}-{schedule['end_time']}",
                        "recurrence": schedule["recurrence"],
                    }
                )

            return (
                jsonify(
                    {
                        "error": "Schedule overlaps with existing schedules",
                        "overlapping_schedules": overlap_details,
                        "message": "Please choose a different time slot or disable the conflicting schedules.",
                    }
                ),
                409,
            )  # 409 Conflict

        # Add the new schedule
        schedules_data["schedules"].append(new_schedule)

        if save_schedules(schedules_data):
            return jsonify(new_schedule)
        else:
            return jsonify({"error": "Failed to save schedule"}), 500

    except Exception as e:
        app.logger.error(f"Error creating schedule: {e}")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/api/schedules/<int:schedule_id>", methods=["PUT"])
def update_schedule(schedule_id):
    """Update existing scheduled item"""
    try:
        data = request.get_json()
        schedules_data = load_schedules()

        # Find the schedule to update
        target_schedule = None
        for schedule in schedules_data["schedules"]:
            if schedule.get("id") == schedule_id:
                target_schedule = schedule
                break

        if not target_schedule:
            return jsonify({"error": "Schedule not found"}), 404

        # Create updated schedule data for validation
        updated_schedule = {
            "start_time": data.get("start_time", target_schedule.get("start_time")),
            "end_time": data.get("end_time", target_schedule.get("end_time")),
            "formula": data.get("formula", target_schedule.get("formula")),
            "cycle_time": data.get("cycle_time", target_schedule.get("cycle_time", 60)),
            "duration": data.get("duration", target_schedule.get("duration", 10)),
            "recurrence": data.get(
                "recurrence", target_schedule.get("recurrence", "daily")
            ),
            "enabled": data.get("enabled", target_schedule.get("enabled", True)),
        }

        # Validate the updated schedule data
        validation_error = validate_schedule_data(updated_schedule)
        if validation_error:
            return jsonify({"error": validation_error}), 400

        # Check for overlapping schedules (excluding the current schedule)
        overlapping = find_overlapping_schedules(
            updated_schedule, schedules_data["schedules"], exclude_id=schedule_id
        )
        if overlapping:
            overlap_details = []
            for schedule in overlapping:
                overlap_details.append(
                    {
                        "id": schedule["id"],
                        "formula": schedule["formula"],
                        "time_range": f"{schedule['start_time']}-{schedule['end_time']}",
                        "recurrence": schedule["recurrence"],
                    }
                )

            return (
                jsonify(
                    {
                        "error": "Updated schedule would overlap with existing schedules",
                        "overlapping_schedules": overlap_details,
                        "message": "Please choose a different time slot or disable the conflicting schedules.",
                    }
                ),
                409,
            )  # 409 Conflict

        # Update the schedule
        target_schedule.update(updated_schedule)

        if save_schedules(schedules_data):
            return jsonify(target_schedule)
        else:
            return jsonify({"error": "Failed to save schedule"}), 500

    except Exception as e:
        app.logger.error(f"Error updating schedule: {e}")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/api/schedules/check-overlap", methods=["POST"])
def check_schedule_overlap():
    """Check if a schedule would overlap with existing schedules without creating it"""
    try:
        data = request.get_json()

        # Validate schedule data
        validation_error = validate_schedule_data(data)
        if validation_error:
            return jsonify({"error": validation_error, "valid": False}), 400

        schedules_data = load_schedules()

        # Create temporary schedule object for overlap checking
        temp_schedule = {
            "start_time": data.get("start_time"),
            "end_time": data.get("end_time"),
            "formula": data.get("formula"),
            "recurrence": data.get("recurrence", "daily"),
            "enabled": True,
        }

        # Check for overlaps (exclude schedule if editing)
        exclude_id = data.get("exclude_id")  # For edit operations
        overlapping = find_overlapping_schedules(
            temp_schedule, schedules_data["schedules"], exclude_id=exclude_id
        )

        if overlapping:
            overlap_details = []
            for schedule in overlapping:
                overlap_details.append(
                    {
                        "id": schedule["id"],
                        "formula": schedule["formula"],
                        "time_range": f"{schedule['start_time']}-{schedule['end_time']}",
                        "recurrence": schedule["recurrence"],
                    }
                )

            return jsonify(
                {
                    "valid": False,
                    "has_overlap": True,
                    "overlapping_schedules": overlap_details,
                    "message": "This schedule would overlap with existing schedules.",
                }
            )
        else:
            return jsonify(
                {
                    "valid": True,
                    "has_overlap": False,
                    "message": "No overlaps detected. Schedule can be created.",
                }
            )

    except Exception as e:
        app.logger.error(f"Error checking schedule overlap: {e}")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/api/schedules/<int:schedule_id>", methods=["DELETE"])
def delete_schedule(schedule_id):
    """Delete scheduled item"""
    try:
        schedules_data = load_schedules()
        schedules_data["schedules"] = [
            s for s in schedules_data["schedules"] if s.get("id") != schedule_id
        ]

        if save_schedules(schedules_data):
            return jsonify({"status": "success"})
        else:
            return jsonify({"error": "Failed to save schedules"}), 500

    except Exception as e:
        app.logger.error(f"Error deleting schedule: {e}")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/api/quiz-result", methods=["POST"])
def quiz_result():
    """Calculate quiz result and return recommended scent"""
    try:
        data = request.get_json()
        answers = data.get("answers", [])
        
        if len(answers) != 10:
            return jsonify({"error": "Invalid number of answers"}), 400
        
        # Count answers for each scent formula
        scent_counts = {"red": 0, "blue": 0, "yellow": 0, "green": 0}
        
        for answer in answers:
            if answer in scent_counts:
                scent_counts[answer] += 1
        
        # Find the scent with the most votes
        recommended_scent = max(scent_counts, key=scent_counts.get)
        
        # Scent descriptions and names
        scent_info = {
            "red": {
                "name": "CRIMSON",
                "description": "Bold and energizing - perfect for motivation and passion",
                "mood": "Energetic and passionate"
            },
            "blue": {
                "name": "AZURE", 
                "description": "Cool and refreshing - ideal for relaxation and tranquility",
                "mood": "Calm and peaceful"
            },
            "yellow": {
                "name": "AMBER",
                "description": "Warm and inviting - great for comfort and coziness",
                "mood": "Warm and welcoming"
            },
            "green": {
                "name": "SAGE",
                "description": "Fresh and clarifying - excellent for focus and clarity",
                "mood": "Fresh and focused"
            }
        }
        
        return jsonify({
            "status": "success",
            "recommended_scent": recommended_scent,
            "scent_info": scent_info[recommended_scent],
            "score_breakdown": scent_counts
        })
        
    except Exception as e:
        app.logger.error(f"Error processing quiz result: {e}")
        return jsonify({"error": "Internal server error"}), 500


def should_activate_schedule(schedule):
    """Check if schedule should activate based on recurrence pattern"""
    now = datetime.now()
    current_day = now.strftime("%A").lower()

    recurrence = schedule.get("recurrence", "daily")

    if recurrence == "daily":
        return True
    elif recurrence == "weekdays" and current_day in [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
    ]:
        return True
    elif recurrence == "weekends" and current_day in ["saturday", "sunday"]:
        return True
    elif recurrence == current_day:
        return True

    return False


def is_time_in_range(current_time, start_time, end_time):
    """Check if current time is within the scheduled time range"""
    current = datetime.strptime(current_time, "%H:%M").time()
    start = datetime.strptime(start_time, "%H:%M").time()
    end = datetime.strptime(end_time, "%H:%M").time()

    if start <= end:
        return start <= current < end  # Changed <= to < for end time
    else:  # Handle overnight ranges like 23:00-01:00
        return current >= start or current < end  # Changed <= to < for end time


def calculate_schedule_duration(start_time, end_time):
    """Calculate duration in seconds between start and end time"""
    try:
        start = datetime.strptime(start_time, "%H:%M").time()
        end = datetime.strptime(end_time, "%H:%M").time()

        # Convert to datetime objects for today
        today = datetime.now().date()
        start_dt = datetime.combine(today, start)
        end_dt = datetime.combine(today, end)

        # Handle overnight schedules
        if end < start:
            end_dt = end_dt + timedelta(days=1)

        duration = (end_dt - start_dt).total_seconds()
        return max(duration, 60)  # Minimum 1 minute
    except Exception as e:
        app.logger.error(f"Error calculating schedule duration: {e}")
        return 3600  # Default to 1 hour


def schedules_overlap(schedule1, schedule2):
    """Check if two schedules have overlapping time ranges on the same days"""
    # Check if they share any recurrence days
    if not recurrence_patterns_overlap(
        schedule1.get("recurrence"), schedule2.get("recurrence")
    ):
        return False

    # Check if time ranges overlap
    return time_ranges_overlap(
        schedule1.get("start_time"),
        schedule1.get("end_time"),
        schedule2.get("start_time"),
        schedule2.get("end_time"),
    )


def recurrence_patterns_overlap(recurrence1, recurrence2):
    """Check if two recurrence patterns have overlapping days"""
    days_of_week = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
    ]
    weekdays = ["monday", "tuesday", "wednesday", "thursday", "friday"]
    weekends = ["saturday", "sunday"]

    def get_active_days(recurrence):
        if recurrence == "daily":
            return set(days_of_week)
        elif recurrence == "weekdays":
            return set(weekdays)
        elif recurrence == "weekends":
            return set(weekends)
        elif recurrence in days_of_week:
            return {recurrence}
        else:
            return set()

    days1 = get_active_days(recurrence1)
    days2 = get_active_days(recurrence2)

    return bool(days1.intersection(days2))


def time_ranges_overlap(start1, end1, start2, end2):
    """Check if two time ranges overlap, handling overnight schedules"""
    try:
        # Parse times
        s1 = datetime.strptime(start1, "%H:%M").time()
        e1 = datetime.strptime(end1, "%H:%M").time()
        s2 = datetime.strptime(start2, "%H:%M").time()
        e2 = datetime.strptime(end2, "%H:%M").time()

        # Convert to minutes since midnight for easier comparison
        def time_to_minutes(t):
            return t.hour * 60 + t.minute

        s1_min = time_to_minutes(s1)
        e1_min = time_to_minutes(e1)
        s2_min = time_to_minutes(s2)
        e2_min = time_to_minutes(e2)

        # Handle overnight schedules
        is_overnight_1 = e1_min <= s1_min
        is_overnight_2 = e2_min <= s2_min

        if is_overnight_1 and is_overnight_2:
            # Both are overnight - they overlap if either overlaps with the other
            # Check if range1 overlaps with range2's late part (start2 to midnight)
            overlap_late = (
                s1_min <= (24 * 60)
                and s2_min <= (24 * 60)
                and s1_min < (24 * 60)
                and s2_min < e1_min + (24 * 60)
            )
            # Check if range1 overlaps with range2's early part (midnight to end2)
            overlap_early = (s1_min + 24 * 60) < e2_min and s2_min < (e1_min + 24 * 60)
            return (
                overlap_late
                or overlap_early
                or (s1_min < e2_min and s2_min < e1_min + 24 * 60)
            )
        elif is_overnight_1:
            # Only schedule 1 is overnight
            # Check overlap with late part (s1 to midnight) and early part (midnight to e1)
            return (s2_min < (24 * 60) and s1_min < e2_min) or (s2_min < e1_min)
        elif is_overnight_2:
            # Only schedule 2 is overnight
            # Check overlap with late part (s2 to midnight) and early part (midnight to e2)
            return (s1_min < (24 * 60) and s2_min < e1_min) or (s1_min < e2_min)
        else:
            # Neither is overnight - standard overlap check
            return s1_min < e2_min and s2_min < e1_min

    except Exception as e:
        app.logger.error(f"Error checking time range overlap: {e}")
        return True  # Assume overlap on error to be safe


def find_overlapping_schedules(new_schedule, existing_schedules, exclude_id=None):
    """Find all existing schedules that would overlap with the new schedule"""
    overlapping = []

    for schedule in existing_schedules:
        # Skip the schedule being updated (for edit operations)
        if exclude_id and schedule.get("id") == exclude_id:
            continue

        # Skip disabled schedules
        if not schedule.get("enabled"):
            continue

        # Check for overlap
        if schedules_overlap(new_schedule, schedule):
            overlapping.append(schedule)

    return overlapping


def validate_schedule_data(data):
    """Validate schedule data and return error message if invalid"""
    # Check required fields
    required_fields = ["start_time", "end_time", "formula", "recurrence"]
    for field in required_fields:
        if not data.get(field):
            return f"Missing required field: {field}"

    # Validate and normalize time format
    def normalize_time(time_str):
        """Convert time string to HH:MM format"""
        try:
            # Try parsing as is
            time_obj = datetime.strptime(time_str, "%H:%M")
            return time_obj.strftime("%H:%M")
        except ValueError:
            try:
                # Try parsing H:MM format
                if ":" in time_str and len(time_str.split(":")[0]) == 1:
                    time_obj = datetime.strptime(f"0{time_str}", "%H:%M")
                    return time_obj.strftime("%H:%M")
                else:
                    raise ValueError("Invalid format")
            except ValueError:
                return None

    normalized_start = normalize_time(data["start_time"])
    normalized_end = normalize_time(data["end_time"])

    if not normalized_start or not normalized_end:
        return "Invalid time format. Use HH:MM or H:MM format (e.g., 09:00 or 9:00)."

    # Update data with normalized times
    data["start_time"] = normalized_start
    data["end_time"] = normalized_end

    # Check if start and end times are the same
    if data["start_time"] == data["end_time"]:
        return "Start time and end time cannot be the same."

    # Validate formula
    valid_formulas = ["red", "blue", "yellow", "green"]
    if data["formula"] not in valid_formulas:
        return f"Invalid formula. Must be one of: {', '.join(valid_formulas)}"

    # Validate recurrence
    valid_recurrences = [
        "daily",
        "weekdays",
        "weekends",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
    ]
    if data["recurrence"] not in valid_recurrences:
        return f"Invalid recurrence. Must be one of: {', '.join(valid_recurrences)}"

    # Validate cycle_time and duration
    cycle_time = data.get("cycle_time", 60)
    duration = data.get("duration", 10)

    if not isinstance(cycle_time, int) or cycle_time < 5:
        return "Cycle time must be an integer >= 5 seconds."

    if not isinstance(duration, int) or duration < 1:
        return "Duration must be an integer >= 1 second."

    if duration >= cycle_time:
        return "Duration must be less than cycle time."

    return None  # No errors


def wait_for_next_minute():
    """Wait until the next minute begins (at :00 seconds)"""
    now = datetime.now()
    # Calculate seconds until next minute
    seconds_to_wait = 60 - now.second - (now.microsecond / 1000000.0)
    time.sleep(seconds_to_wait)


def find_active_schedule_for_time(schedules_data, current_time):
    """Find which schedule should be active at the given time"""
    for schedule in schedules_data.get("schedules", []):
        if (
            schedule.get("enabled")
            and should_activate_schedule(schedule)
            and schedule.get("start_time")
            and schedule.get("end_time")
            and schedule.get("start_time") != schedule.get("end_time")
        ):
            if is_time_in_range(
                current_time, schedule["start_time"], schedule["end_time"]
            ):
                return schedule
    return None


def schedule_monitor():
    """Background thread to monitor scheduled activation times - checks at exact minute changes"""
    active_schedules = {}  # Track currently active schedules
    last_active_schedule = None  # Track what was active in the previous minute

    # Wait for the first minute boundary
    wait_for_next_minute()

    while True:
        try:
            schedules_data = load_schedules()
            current_time = datetime.now().strftime("%H:%M")

            # Find which schedule should be active right now
            target_schedule = find_active_schedule_for_time(
                schedules_data, current_time
            )

            # Determine what action to take
            if target_schedule:
                schedule_id = target_schedule.get("id")
                target_formula = target_schedule.get("formula")

                # Check if this is a new schedule starting
                is_new_schedule = (
                    schedule_id not in active_schedules
                    or last_active_schedule != target_schedule.get("formula")
                )

                if is_new_schedule:
                    # Calculate how long this schedule should run
                    schedule_duration = calculate_schedule_duration(
                        target_schedule["start_time"], target_schedule["end_time"]
                    )

                    # NEW LOGIC: Start new schedule even if user override is active
                    # This handles session transitions automatically
                    if gpio_controller.user_override:
                        app.logger.info(
                            f"New schedule session starting - clearing user override for transition"
                        )
                        gpio_controller.user_override = False

                    success = gpio_controller.activate_formula(
                        target_formula,
                        target_schedule.get("cycle_time", 60),
                        target_schedule.get("duration", 10),
                        is_scheduled=True,
                        activation_duration=schedule_duration,
                    )

                    if success:
                        active_schedules[schedule_id] = target_schedule
                        last_active_schedule = target_formula
                        app.logger.info(
                            f"Started scheduled formula: {target_formula} ({target_schedule['start_time']}-{target_schedule['end_time']}) for {schedule_duration}s"
                        )
                    else:
                        app.logger.error(
                            f"Failed to start scheduled formula: {target_formula}"
                        )

                # If schedule is already running, just update tracking
                elif schedule_id not in active_schedules:
                    active_schedules[schedule_id] = target_schedule

            else:
                # No schedule should be active - check if we need to stop anything
                schedules_to_remove = []

                for schedule_id, schedule in active_schedules.items():
                    # This schedule is no longer in its time window
                    if (
                        gpio_controller.active_schedule == schedule["formula"]
                        and not gpio_controller.user_override
                    ):
                        gpio_controller.deactivate_all()
                        app.logger.info(
                            f"Ended scheduled formula: {schedule['formula']} ({schedule['start_time']}-{schedule['end_time']})"
                        )
                    schedules_to_remove.append(schedule_id)

                # Clean up inactive schedules
                for schedule_id in schedules_to_remove:
                    del active_schedules[schedule_id]

                last_active_schedule = None

        except Exception as e:
            app.logger.error(f"Error in schedule monitor: {e}")

        # Wait for the next minute boundary
        wait_for_next_minute()


# Start schedule monitor thread
schedule_thread = threading.Thread(target=schedule_monitor, daemon=True)
schedule_thread.start()

if __name__ == "__main__":
    try:
        app.run(host="0.0.0.0", port=5001, debug=True)
    finally:
        gpio_controller.cleanup()
