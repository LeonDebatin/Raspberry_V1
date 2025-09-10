from flask import Flask, render_template, request, jsonify
import json
import os
from datetime import datetime
import threading
import time
from gpio_controller import SimpleGPIOController

app = Flask(__name__)
app.config["SECRET_KEY"] = "scent-controller-secret-key"

# Initialize GPIO controller
gpio_controller = SimpleGPIOController()


def load_pin_mapping():
    """Load GPIO pin mapping from JSON file"""
    default_mapping = {"formulas": {"red": 18, "blue": 19, "yellow": 20, "green": 21}}

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

        success = gpio_controller.activate_formula(color, cycle_time, duration)

        if success:
            return jsonify(
                {
                    "status": "success",
                    "active_formula": color,
                    "cycle_time": cycle_time,
                    "duration": duration,
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
        return jsonify({"status": "success", "active_formula": None})
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
        schedules_data = load_schedules()

        # Generate new ID
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

        # Find and update the schedule
        for schedule in schedules_data["schedules"]:
            if schedule.get("id") == schedule_id:
                schedule.update(
                    {
                        "start_time": data.get(
                            "start_time", schedule.get("start_time")
                        ),
                        "end_time": data.get("end_time", schedule.get("end_time")),
                        "formula": data.get("formula", schedule.get("formula")),
                        "cycle_time": data.get(
                            "cycle_time", schedule.get("cycle_time", 60)
                        ),
                        "duration": data.get("duration", schedule.get("duration", 10)),
                        "recurrence": data.get(
                            "recurrence", schedule.get("recurrence", "daily")
                        ),
                        "enabled": data.get("enabled", schedule.get("enabled", True)),
                    }
                )

                if save_schedules(schedules_data):
                    return jsonify(schedule)
                else:
                    return jsonify({"error": "Failed to save schedule"}), 500

        return jsonify({"error": "Schedule not found"}), 404

    except Exception as e:
        app.logger.error(f"Error updating schedule: {e}")
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
        return start <= current <= end
    else:  # Handle overnight ranges like 23:00-01:00
        return current >= start or current <= end


def schedule_monitor():
    """Background thread to monitor scheduled activation times"""
    active_schedules = {}  # Track currently active schedules

    while True:
        try:
            current_time = datetime.now().strftime("%H:%M")
            schedules_data = load_schedules()

            for schedule in schedules_data["schedules"]:
                schedule_id = schedule.get("id")

                if (
                    schedule.get("enabled")
                    and should_activate_schedule(schedule)
                    and schedule.get("start_time")
                    and schedule.get("end_time")
                ):

                    should_be_active = is_time_in_range(
                        current_time, schedule["start_time"], schedule["end_time"]
                    )

                    is_currently_active = schedule_id in active_schedules

                    if should_be_active and not is_currently_active:
                        # Start the schedule
                        gpio_controller.activate_formula(
                            schedule["formula"],
                            schedule["cycle_time"],
                            schedule["duration"],
                            is_scheduled=True,
                            activation_duration=None,  # Will run until end time
                        )
                        active_schedules[schedule_id] = schedule
                        app.logger.info(
                            f"Started scheduled formula: {schedule['formula']} ({schedule['start_time']}-{schedule['end_time']})"
                        )

                    elif not should_be_active and is_currently_active:
                        # End the schedule
                        if gpio_controller.active_schedule == schedule["formula"]:
                            gpio_controller.deactivate_all()
                        del active_schedules[schedule_id]
                        app.logger.info(
                            f"Ended scheduled formula: {schedule['formula']} ({schedule['start_time']}-{schedule['end_time']})"
                        )

        except Exception as e:
            app.logger.error(f"Error in schedule monitor: {e}")

        time.sleep(60)  # Check every minute


# Start schedule monitor thread
schedule_thread = threading.Thread(target=schedule_monitor, daemon=True)
schedule_thread.start()

if __name__ == "__main__":
    try:
        app.run(host="0.0.0.0", port=5000, debug=True)
    finally:
        gpio_controller.cleanup()
