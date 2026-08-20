# Event Booking & Scheduling Platform

A complete event booking and scheduling platform that allows users to discover events, manage their bookings, and schedule activities seamlessly. 

## Features
- **User Authentication:** Secure login and registration.
- **Event Discovery:** Browse available events and view detailed information.
- **Booking Management:** Book events, view booking history, and manage cancellations.
- **Scheduling Validation:** Prevents scheduling conflicts and overlapping bookings.


## Tech Stack
- **Frontend:** Vue 3 (Composition API), Vite, Vue Router, Axios
- **Backend:** Python, Django, Django REST Framework (DRF), SimpleJWT
- **Database:** SQLite (Development) / PostgreSQL (Production ready)

## Requirements
To run this project locally, you will need:
- **Python 3.10+** 
- **Node.js 18+**

*(Alternatively, you can run the entire stack using Docker and Docker Compose)*

## How to Run

### Backend Setup
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run database migrations and start the server:
   ```bash
   python manage.py migrate
   python manage.py runserver
   ```
   The backend API will be available at `http://127.0.0.1:8000`.

### Frontend Setup
1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   The frontend application will be available at `http://localhost:5173`.
