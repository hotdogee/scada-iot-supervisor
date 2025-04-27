# SCADA/IoT Supervisor System

> A modern, scalable SCADA/IoT Supervisor System for industrial monitoring and control, designed for research-grade and pilot-scale geothermal power generation deployments, leveraging open-source technologies and Industry 4.0 principles.

## Table of Contents

- [SCADA/IoT Supervisor System](#scadaiot-supervisor-system)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Features](#features)
  - [Architecture](#architecture)
  - [Technology Stack](#technology-stack)
    - [Hardware](#hardware)
    - [Software](#software)
    - [Communication Protocols](#communication-protocols)
  - [Case Study: Geothermal Power Monitoring (Yilan Qingshui Well No. 9)](#case-study-geothermal-power-monitoring-yilan-qingshui-well-no-9)
  - [Installation](#installation)
    - [Prerequisites](#prerequisites)
    - [Setup Steps](#setup-steps)
  - [License](#license)
  - [Contact](#contact)

## Overview

SCADA-IoT Supervisor integrates real-time data acquisition, remote monitoring, control, and data logging capabilities for industrial applications. It leverages open-source technologies and Industry 4.0 principles (Interoperability, Transparency, Assistance, Decentralization) to provide a flexible and cost-effective alternative to traditional Distributed Control Systems (DCS) and Supervisory Control and Data Acquisition (SCADA) systems.

Originally developed and proven in the context of monitoring and controlling a Total Flow Geothermal Power Generation system in Taiwan, the system is designed to be adaptable to various industrial monitoring and control scenarios requiring robust data handling and remote accessibility.

## Features

- **Cost-Effectiveness:**

  - Aims to reduce engineering time and hardware costs compared to traditional proprietary DCS/SCADA solutions.
  - Unified JavaScript language across the stack enables flexible placement of logic on the edge, server or client, and simplifies hiring.
  - Leverages open-source software components, minimizing licensing fees.
  - Utilizes readily available and cost-effective hardware as PLCs (Raspberry Pi, Arduino).

- **Real-time Monitoring & Control:**

  - Web and mobile dashboards for real-time data visualization.
  - Interactive charts for historical data discovery and analysis.

- **Modular & Scalable Architecture:**

  - Supports a diverse range of sensors (Temperature: PT100; Pressure: Absolute/Gauge; Flow: Magnetic, Coriolis, Vortex; Power: V, I, Freq, PF; Speed: Optical, Hall; pH; Environmental, etc.).
  - Interfaces with various actuators and alarms.
  - Horizontally scalable using containerized systems.

- **Data Acquisition & Management:**

  - Time-series database (MongoDB) optimized for high-frequency sensor data logging.
  - Comprehensive logging with filtering capabilities.
  - Data export for offline analysis (e.g., CSV, JSON).
  - Historical trend analysis and reporting tools.
  - No data loss even when working with a unreliable 4G connection.

- **Remote Access & Security:**

  - JWT based authentication and authorization for users and plc.

- **Open Standards & Protocols:**

  - Modbus-RTU (RS-485) for robust industrial device communication.
  - REST/WebSocket APIs for seamless frontend/backend integration and third-party access.

- **Cross-Platform Compatibility:**

  - Web interfaces compatible with modern browsers (Chrome, Firefox, Safari, Edge).
  - Progressive Web Apps (PWA) for Android and iOS devices.
  - Backend runs on standard server environments (Linux, Windows, macOS).

## Architecture

The core supervisor system backend is built using:

- **Runtime:** Node.js
- **Framework:** FeathersJS (Real-time API and application framework)
- **Database:** MongoDB (Time-series data, configuration, logs)
- **Process Management:** PM2 (Ensures the Node.js application is kept alive, manages logs)
- **Web Server / Proxy:** nginx

**Capabilities:**

- Real-time data acquisition from edge plcs.
- Data processing and transformation (thermal efficiency, well enthalpy, turbine torque).
- Persistent data logging to MongoDB with bucketing and statistics calculations.
- Real-time data streaming to clients via WebSockets.
- REST API for configuration and historical data retrieval.
- User authentication and authorization.
- System monitoring and process management using PM2.

## Technology Stack

### Hardware

- **Edge Controller:** Raspberry Pi serves as the main processing unit.
- **Remote Terminal Units (RTUs):** Industrial controllers interfacing with field devices.
- **Sensors:** Temperature (RTD PT100), Pressure (Danfoss MBS 3000), Electromagnetic Flowmeters (BMS, LDG), Coriolis Flowmeters (E+H, Micro Motion), Vortex Flowmeters (MIK-LUGB), pH Meters, Optical/Hall Effect RPM Sensors, Electrical (Voltage, Current, Frequency, Power), etc.
- **Actuators:** Valves, Alarms, and Inverters (ABB PVI-12.5-TL-OUTD).
- **Networking:** Ethernet Switches, WiFi Access Points, 4G/LTE Routers, USB-to-RS485/232 Converters.
- **Cameras:** IP Cameras with on-site NAS recording.
- **Power:** Mean Well Power Supplies (24VDC, 12VDC, 5VDC).
- **Analysis Tools:** Hioki Power Analyzers, FLIR Thermal Cameras, High-Speed Cameras.

### Software

- **Backend / PLC:** Node.js, FeathersJS (Supervisor)
- **Frontend:** VueJS, Quasar Framework, Highcharts
- **Database:** MongoDB
- **Message Queue:** RabbitMQ (AMQP)
- **Real-time Communication:** WebSockets (TCP/IP)
- **Industrial Communication:** MODBUS RTU (RS-485)
- **Hardware Platform (Edge):** Raspberry Pi OS / Linux
- **Process Management:** PM2
- **Web Server/Proxy:** Nginx

### Communication Protocols

- **MODBUS-RTU:** Used for robust communication with RTUs and other industrial devices connected to the custom I/O modules or directly.
- **WebSockets:** Enables real-time, bidirectional communication between the Node.js backend, the supervisory control system, and the user interface (UI).

## Case Study: Geothermal Power Monitoring (Yilan Qingshui Well No. 9)

This system was instrumental in the development and testing of a Total Flow geothermal power generation unit:

- **Monitored Parameters:** Wellhead pressure/temperature, flow rates (total, steam, brine), turbine inlet/outlet conditions, generator output (Voltage, Current, Frequency, Power Factor, kW, kVA), vibration, cooling system parameters, pH, ambient conditions.
- **Control:** Valve positioning for flow regulation, generator load control (via load banks or grid-tie inverters), emergency shutdown sequences.
- **Data Logging:** Captured high-frequency data during various test phases (load bank testing, grid synchronization trials) for performance analysis (e.g., Power vs. Pressure Drop curves, efficiency calculations).
- **Remote Operation:** Enabled remote monitoring of the unmanned test site via web dashboards and live camera feeds.

## Installation

### Prerequisites

- Node.js (v16.x or higher recommended)
- npm (v8.x or higher) or yarn
- MongoDB (v5.x or higher recommended)
- Git
- (Optional) Docker and Docker Compose for containerized deployment
- (Optional) Nginx for production reverse proxy

### Setup Steps

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/hotdogee/scada-iot-supervisor.git # Replace with actual repo URL
    cd scada-iot-supervisor
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Configure variables:**

    - Edit the `default.json` files in `config/` directories to set database connection strings, API endpoints, secret keys, communication port settings, etc.

4.  **Start development server:**

    - Ensure MongoDB is running.
      ```bash
      npm run dev
      ```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

- **Lanyang Geothermal Corp.**
- **Lead Developer:** Han Lin <hotdogee@gmail.com> (https://github.com/hotdogee)
