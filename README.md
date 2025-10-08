# Institutional Attendance Management System

A web-based application for managing student attendance in educational institutions.

## Features

- Student management (Add, View, Update, Delete)
- Course management
- Attendance tracking
- Reports generation
- Responsive design for all devices

## Prerequisites

- Python 3.7+
- pip (Python package manager)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd attendance-management-system
   ```

2. Create a virtual environment (recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install the required packages:
   ```bash
   pip install -r requirements.txt
   ```

## Configuration

1. Set up your environment variables in a `.env` file:
   ```
   FLASK_APP=app.py
   FLASK_ENV=development
   SECRET_KEY=your-secret-key-here
   ```

## Running the Application

1. Initialize the database:
   ```bash
   flask shell
   >>> from app import db
   >>> db.create_all()
   >>> exit()
   ```

2. Run the development server:
   ```bash
   flask run
   ```

3. Open your browser and navigate to:
   ```
   http://127.0.0.1:5000/
   ```

## Project Structure

```
attendance-management-system/
├── app.py                # Main application file
├── requirements.txt      # Python dependencies
├── instance/
│   └── attendance.db     # SQLite database (created after first run)
└── templates/            # HTML templates
    ├── base.html         # Base template
    ├── index.html        # Dashboard
    ├── students.html     # Student listing
    └── add_student.html  # Add student form
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
