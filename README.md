# School Bus Seat Allotment System

A modern web application for managing school bus seat assignments with a beautiful, responsive interface built with HTML, CSS, JavaScript, and Node.js.

## Features

### 🚌 **Bus Layout Management**
- Visual 5x8 seat grid (40 seats total)
- Real-time seat status (available/occupied)
- Interactive seat assignment
- Route-based filtering

### 👥 **Student Management**
- Add new students with name, grade, and route
- View all students with their current seat assignments
- Track which students are assigned to seats

### 🛣️ **Route Management**
- Create and manage bus routes
- Set route capacities
- View route statistics and assignments

### 📊 **Real-time Statistics**
- Total seats count
- Occupied vs available seats
- Route-wise assignment tracking

### 🎯 **Key Functionality**
- **Seat Assignment**: Click on any seat to assign/unassign students
- **Route Filtering**: Filter seats by specific routes
- **Data Export**: Export all data as JSON file
- **Reset Functionality**: Clear all seat assignments
- **Responsive Design**: Works on desktop, tablet, and mobile

## Installation

### Prerequisites
- Node.js (version 14 or higher)
- npm (comes with Node.js)

### Setup Instructions

1. **Clone or download the project**
   ```bash
   # If you have the files, navigate to the project directory
   cd "bus seat"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```
   
   Or for development with auto-restart:
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## Usage Guide

### Getting Started

1. **View the Bus Layout**
   - The main interface shows a 5x8 grid representing bus seats
   - Green seats are available, red seats are occupied
   - Click any seat to interact with it

2. **Add Students**
   - Click "Add Student" in the sidebar
   - Fill in the student's name, grade, and route
   - Students will appear in the students list

3. **Add Routes**
   - Click "Add Route" in the sidebar
   - Enter route name and capacity
   - Routes will be available for student assignment

4. **Assign Seats**
   - Click on any available (green) seat
   - Select a student from the dropdown
   - Click "Assign Seat" to confirm

5. **Manage Assignments**
   - Click on occupied (red) seats to view details
   - Remove assignments if needed
   - Use the route filter to focus on specific routes

### Advanced Features

#### Route Filtering
- Use the "Filter by Route" dropdown to show only seats for a specific route
- This helps manage multiple bus routes efficiently

#### Data Export
- Click "Export Data" to download all current data as a JSON file
- Useful for backups or data analysis

#### Reset All Seats
- Use "Reset All Seats" to clear all assignments
- Confirmation dialog prevents accidental resets

## Project Structure

```
bus seat/
├── package.json          # Node.js dependencies and scripts
├── server.js            # Express.js server and API endpoints
├── public/              # Frontend files
│   ├── index.html       # Main HTML file
│   ├── styles.css       # CSS styling
│   └── script.js        # JavaScript functionality
└── README.md           # This file
```

## API Endpoints

The backend provides these REST API endpoints:

- `GET /api/seats` - Get all seats
- `GET /api/students` - Get all students
- `GET /api/routes` - Get all routes
- `POST /api/assign-seat` - Assign student to seat
- `POST /api/remove-seat` - Remove seat assignment
- `POST /api/students` - Add new student
- `POST /api/routes` - Add new route
- `POST /api/reset-seats` - Reset all seat assignments
- `GET /api/seats/route/:routeId` - Get seats by route

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **Styling**: Custom CSS with responsive design
- **Icons**: Font Awesome
- **Fonts**: Google Fonts (Inter)

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Development

### Running in Development Mode
```bash
npm run dev
```
This uses nodemon for automatic server restart on file changes.

### Customization

#### Adding More Seats
Edit the `initializeData()` function in `server.js`:
```javascript
// Change the loop parameters to add more rows/columns
for (let row = 1; row <= 6; row++) {  // 6 rows instead of 5
    for (let seat = 1; seat <= 10; seat++) {  // 10 seats instead of 8
        // ... seat creation
    }
}
```

#### Styling Changes
Modify `public/styles.css` to customize colors, layout, or animations.

#### Adding New Features
- Backend: Add new routes in `server.js`
- Frontend: Add new UI elements in `public/index.html` and corresponding JavaScript in `public/script.js`

## Troubleshooting

### Common Issues

1. **Port already in use**
   - Change the port in `server.js`: `const PORT = process.env.PORT || 3001;`

2. **Dependencies not installed**
   - Run `npm install` again

3. **Server not starting**
   - Check if Node.js is installed: `node --version`
   - Ensure you're in the correct directory

4. **Page not loading**
   - Check browser console for errors
   - Ensure server is running on the correct port

### Error Messages

- **"Error loading data"**: Check if server is running
- **"Failed to assign seat"**: Student or seat not found
- **"Seat is already occupied"**: Try a different seat

## Contributing

1. Fork the project
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the browser console for error messages
3. Ensure all dependencies are properly installed

---

**Happy Seat Management! 🚌✨** 