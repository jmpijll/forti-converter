# FortiConverter Project Specification

## Project Overview
A modern web application for converting FortiAnalyzer traffic logs into FortiGate CLI configuration scripts, with real-time filtering and processing capabilities.

## Tech Stack
- Frontend: Svelte + Tailwind CSS
  - Modern, reactive framework with excellent performance
  - Tailwind for rapid UI development and dark/light mode support
  - SvelteKit for routing and server-side capabilities

- Backend: Node.js/Express
  - Efficient stream processing for large files
  - Fast CSV parsing capabilities
  - RESTful API endpoints

## Core Features
1. File Upload & Processing
   - Support for large CSV files (>5GB)
   - Stream-based processing to handle memory efficiently
   - Progress tracking and status updates

2. Data Processing
   - Unique destination IP/port combination extraction
   - Source IP grouping
   - Real-time filtering capabilities
   - CLI script generation for:
     - Address objects
     - Service objects
     - Firewall policies

3. User Interface
   - Modern, responsive design
   - Dark/light mode toggle
   - Simple and advanced modes
   - Real-time preview of generated scripts
   - Filter controls with immediate feedback

## Project Structure
```
forti-converter/
├── src/
│   ├── components/         # Svelte components
│   ├── lib/               # Shared utilities
│   ├── routes/            # SvelteKit routes
│   └── stores/            # State management
├── server/
│   ├── api/              # Express API endpoints
│   ├── processors/       # Data processing modules
│   └── generators/       # CLI script generators
├── public/               # Static assets
└── tests/               # Test suites
```

## Code Quality Standards
1. File Size Limit: Maximum 500 lines per file
2. Modular Design: Each component/processor should have a single responsibility
3. Error Handling: Comprehensive error handling and user feedback
4. Performance: Optimized for large file processing
5. Testing: Unit tests for core functionality

## Processing Pipeline
1. CSV Upload & Validation
2. Stream-based Processing
   - Parse CSV entries
   - Group by destination IP/port
   - Aggregate source IPs
3. Filter Application
4. CLI Script Generation
   - Address objects
   - Service objects
   - Firewall policies

## UI/UX Requirements
1. Modern, Clean Interface
   - Dark/light mode support
   - Responsive design
   - Clear visual hierarchy
2. Two Operation Modes
   - Simple: Basic upload and conversion
   - Advanced: Detailed filtering and configuration
3. Real-time Updates
   - Live preview of generated scripts
   - Immediate filter feedback
4. Progress Indicators
   - Upload progress
   - Processing status
   - Generation progress

## Performance Considerations
1. Stream Processing
   - Handle large files without memory issues
   - Progress tracking
2. Efficient Data Structures
   - Optimized for quick lookups and updates
3. Caching
   - Intermediate results
   - Filtered data sets

## Security Considerations
1. File Validation
   - CSV format verification
   - Size limits
2. Input Sanitization
   - Prevent injection attacks
3. Error Handling
   - Graceful failure handling
   - User-friendly error messages

## Development Workflow
1. Setup Phase
   - Project initialization
   - Dependencies installation
   - Development environment setup
2. Core Development
   - Backend processing logic
   - Frontend components
   - API integration
3. Testing & Optimization
   - Performance testing
   - Memory usage optimization
   - User experience refinement
4. Deployment
   - Production build
   - Performance optimization
   - Documentation

## Dependencies
- Frontend:
  - Svelte/SvelteKit
  - Tailwind CSS
  - CSV parsing library
- Backend:
  - Express.js
  - Stream processing utilities
  - CSV parsing library

## Future Enhancements
1. Export Formats
   - Additional CLI formats
   - JSON/XML output
2. Advanced Filtering
   - Time-based filtering
   - Protocol-based filtering
3. Batch Processing
   - Multiple file processing
   - Scheduled conversions
4. User Management
   - Authentication
   - Saved configurations 