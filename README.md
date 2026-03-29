# MQTT Message Interceptor for simulating MITM attacks

Welcome to our repository for the interceptor to simulate Man-in-the-middle (MITM) attacks for Smart Home devices. With this you can see what happens when a MQTT Message from either a Smart Home device or an Smart Home Hub will be intercepted and altered or blocked altogether, never reaching the recipient it was intended for. This software was also used in the scientific paper XXX by Wozniak and further use cases can be seen in that paper.

If you're interested in deploying this software for yourself, please follow the installation guide below. As this was an artifact for the paper by Wozniak, this repository will **not** be actively maintained. For any alterations or additions to the interceptor, please either implement it yourself or fork this repository with your added implementations.

# Installation Guide (Linux Ubuntu)

This guide provides step-by-step instructions for setting up the MQTT interceptor, Zigbee2MQTT, and Home Assistant on a Linux Ubuntu system using Podman. Follow these steps to ensure a smooth installation and configuration process.


---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Step 1: Identify the Zigbee Coordinator Path](#step-1-identify-the-zigbee-coordinator-path)
3. [Step 2: Install Podman and Enable Docker Compatibility](#step-2-install-podman-and-enable-docker-compatibility)
4. [Step 3: Add User to the `dialout` Group](#step-3-add-user-to-the-dialout-group)
5. [Step 4: Configure Container Registries](#step-4-configure-container-registries)
6. [Step 5: Set Up Udev Rules for the Zigbee Coordinator](#step-5-set-up-udev-rules-for-the-zigbee-coordinator)
7. [Step 6: Run the Containers](#step-6-run-the-containers)
8. [Step 7: Onboarding for Home Assistant and Zigbee2MQTT](#step-7-onboarding-for-home-assistant-and-zigbee2mqtt)
9. [Step 8: Configure MQTT Broker in Home Assistant](#step-8-configure-mqtt-broker-in-home-assistant)
10. [Step 9: Suppress a Zigbee Device](#step-9-suppress-a-zigbee-device)
11. [Notes](#notes)

---

## Prerequisites
- Linux Ubuntu distribution
- Zigbee USB Coordinator (e.g., `/dev/ttyUSB0`)
- Podman and Podman Compose installed
- Docker compatibility enabled in Podman

---

## Step 1: Identify the Zigbee Coordinator Path
1. Check the correct path for your Zigbee coordinator:
   ```bash
   ls -l /dev/serial/by-id/
   ```
2. Replace `/dev/ttyUSB0` in the provided `docker-compose.yml` file with the correct path for your device.

---

## Step 2: Install Podman and Enable Docker Compatibility
1. Install Podman:
   ```bash
   sudo apt install podman
   ```
2. Enable Docker compatibility in Podman Desktop.

---

## Step 3: Add User to the `dialout` Group
1. Add the active user to the `dialout` group:
   ```bash
   sudo usermod -aG dialout $USER
   ```
2. Log out and log back in for the changes to take effect.
3. Verify group membership:
   ```bash
   groups
   ```

---

## Step 4: Configure Container Registries
1. Open the registries configuration file:
   ```bash
   sudo nano /etc/containers/registries.conf
   ```
2. Add the following lines:
   ```ini
   [registries.search]
   registries = ["docker.io"]
   ```

---

## Step 5: Set Up Udev Rules for the Zigbee Coordinator
1. Create a udev rule file:
   ```bash
   sudo nano /etc/udev/rules.d/99-zigbee-coord.rules
   ```
2. Insert the following line, replacing `VendorID` and `ProductID` with the actual IDs from `lsusb`:
   ```ini
   SUBSYSTEM=="tty", ATTRS{idVendor}=="VendorID", ATTRS{idProduct}=="ProductID", SYMLINK+="zigbee", MODE="0666", GROUP="dialout"
   ```
3. Find the Vendor and Product IDs:
   ```bash
   lsusb
   ```
> **Info:** If the result of `lsusb` is `Bus 001 Device 004: ID 10c4:ea60 Silicon Labs CP210x UART Bridge`, the vendor ID would be `10c4` and the product ID would be `ea60`.
4. Save the file and set the correct permissions:
   ```bash
   sudo chmod 644 /etc/udev/rules.d/99-zigbee-coord.rules
   ```
5. Reload and trigger udev rules:
   ```bash
   sudo udevadm control --reload-rules
   sudo udevadm trigger
   ```
> **Info:** `sudo chmod 666` gives a file read-and-write privileges. `sudo chmod 644` makes a file readable by udev.

---

## Step 6: Run the Containers
1. Install `podman-compose`:
   ```bash
   sudo apt install podman-compose
   ```
2. Navigate to the directory containing the `docker-compose.yml` file.
3. Start the containers:
   ```bash
   podman-compose up -d
   ```
4. Verify that 8 containers are running in Podman Desktop.

---

## Step 7: Onboarding for Home Assistant and Zigbee2MQTT
1. Access Home Assistant at:
   ```
   http://localhost:8123
   ```
2. Complete the onboarding process for Home Assistant.
3. Access Zigbee2MQTT at:
   ```
   http://0.0.0.0:8080
   ```
4. Complete the onboarding process for Zigbee2MQTT. Ensure the coordinator is recognized and select the appropriate settings.
5. Enable Home Assistant integration in Zigbee2MQTT.
6. Verify the logs in Podman Desktop for the message:
   ```
   z2m: Connected to MQTT server
   ```

---

## Step 8: Configure MQTT Broker in Home Assistant
1. Navigate to **Settings -> Devices and Services** in Home Assistant.
2. Add the **MQTT** integration.
3. Enter the IP address of the machine running the Zigbee2MQTT container (use `ifconfig` to find it).
4. Ensure port `1883` is selected.
5. No username or password is required.

---

## Step 9: Suppress a Zigbee Device
1. Access the interceptor at:
   ```
   https://localhost:3000
   ```
2. Accept the self-signed certificate warning.
3. Click **Login** (no credentials required).
4. Add a new configuration and select **Edit**. 
5. Navigate to the **Error Configuration** tab and scan the network.
6. Select the device to suppress and click ⃠. 
7. Go back to the configuration and select **Run**, then **Deploy all**.
7. To lift the suppression, click **Undo all**. 

---

## Notes
- Using Docker Desktop is strongly discouraged as the coordinator was never properly passed through when preparing this installation guide.
- Do **not** run Docker and a VM with Home Assistant at the same time as this will complicate the virtualization process for both.
- Replace placeholders (e.g., `VendorID`, `ProductID`) with actual values.
- Ensure the Zigbee coordinator is properly connected and recognized by the system.
- The interceptor uses a self-signed certificate; proceed with caution.
