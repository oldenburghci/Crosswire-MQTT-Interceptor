<div align="center">
  <img src="UOL_Logo.png" width="300">
</div>

# **Crosswire: A MQTT Message Interceptor for simulating malfunctions in Smart Home Ecosystems**

🔗 Go directly to the [Installation Guide](#installation-guide-linux-ubuntu)

<!-- # **Why Deploy Crosswire?** -->

# Crosswire
 
Crosswire is an open-source toolkit for systematically inducing failures in operational smart home environments. It operates as a transparent MQTT proxy between connected devices and a Home Assistant hub, intercepting the message flow that constitutes the system's observable behaviour — without modifying device firmware or hub configuration.
 
The toolkit was developed to address a methodological gap in smart home research: realistic failures are difficult to reproduce on demand, and existing workarounds (Wizard-of-Oz setups, software simulators, firmware modification) compromise either the environment's realism or the failure's realism. Crosswire brings controlled, reproducible fault injection into the same physical environments where smart home technology is actually deployed.


## How it works
 
Crosswire sits transparently on the path between smart home devices and Home Assistant. Both sides of the proxy behave as though connected directly, which makes Crosswire deployable on top of existing installations without reconfiguring devices or rewriting automations.
 
From this position, it supports two complementary intervention modes:
 
**MQTT-level interventions** manipulate messages in transit to simulate device- and network-level faults. Three primitives are available:
- *Suppression* — drops messages matching a topic pattern, making the device appear unresponsive from the hub's perspective (equivalent to a flat battery, radio out of range, or crashed firmware).
- *Mutation* — rewrites payloads in transit, covering faults such as miscalibrated sensor readings, stuck contact states, or state desynchronisation between device and hub.
- *Delay* — holds messages for a configurable interval before forwarding them, simulating intermittent network conditions or hub backpressure.
**Automation-level interventions** modify Home Assistant rule definitions via its REST API, simulating the misconfigurations that emerge in real installations: stale rules whose target devices no longer exist, off-by-one thresholds, or trigger conditions that no longer match the user's intent.
 
The two modes compose. A scenario can layer a suppressed sensor with a stale automation, or combine a delayed device with a dependent rule — reproducing the ambiguous, multi-cause failures that are hardest to study in isolation.


## Scenarios and reproducibility
 
Individual interventions are grouped into *scenarios*: named, persisted collections of rules that are deployed and reverted as a unit. Deploying a scenario activates all constituent interventions simultaneously; undoing it restores the smart home to its exact baseline state in a single operation, ready for the next participant or session.
 
Scenarios are serialised as JSON and stored on disk. They are portable across Crosswire deployments, editable in any text editor, and version-controllable alongside other study materials. A scenario library distributed with a published protocol functions as a shareable artefact that supports replication and meta-analysis.
 
## Use cases
We envision Crosswire to become useful for the following applications: 
- **Smart Home end-user research** — our tool was developed to assist researchers in studying failure scenarios with real users and consumer-level systems, enabling scientific rigour to studies without sacrificing ecological validity of real deployments. 
- **Industrial UX research** — evaluating how a product behaves within heterogeneous device ecosystems rather than in isolation, by injecting ecosystem-level failures against the product under test.
- **Administrator training** — exposing trainees to a curated library of realistic faults in a controlled environment, with the ability to deploy, replay, and revert scenarios for cohort comparison or second attempts.

We're looking forward to discovering other applications of Crosswire you may find. 

## Implementation

The middleware is written in Go and decomposed into three services: a gateway handling routing and client connections, an injection engine implementing the fault logic, and a user-management component backing the experimenter UI. The configuration frontend is a JavaScript single-page application. The stack is orchestrated by a single Podman Compose file and deploys alongside an existing Home Assistant installation with one command.
 
Crosswire currently targets Home Assistant with Zigbee (via Zigbee2MQTT) and other MQTT-connected devices. The injection engine handles JSON payloads natively; support for proprietary binary formats and non-MQTT bridges is a known limitation.

## **License & Citation**

Crosswire is released under the **Apache 2.0 License**. If you use this toolkit in your work, we kindly ask you to **cite the original paper** and/or **link to this repository** to support its development and visibility. 

This repository will be maintained as a part of the ongoing research project, managed by Carl von Ossietzky Universität Oldenburg. For any alterations or additions to the interceptor, please either implement them yourself or fork this repository to add your changes, so others can benefit.

Should you have any questions, you're welcome to contact our current project lead: 

(June 2026 -- current) Mikołaj P. Woźniak, mikolaj.wozniak@uni-oldenburg.de





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
10. [Step 9: Adding a long-lived token to the interceptor (optional)](#step-9-adding-a-long-lived-token-to-the-interceptor-optional)
11. [Step 10: Suppress a Zigbee Device](#step-10-suppress-a-zigbee-device)
12. [Notes](#notes)

---

## Prerequisites
- Linux Ubuntu distribution
- Zigbee USB Coordinator (e.g., `/dev/ttyUSB0`)
- Downloaded this entire Github repository to the host machine

---

## Step 1: Identify the Zigbee Coordinator Path
1. Check the correct path for your Zigbee coordinator:
   ```bash
   ls -l /dev/serial/by-id/
   ```
2. Replace `/dev/ttyUSB0` in the provided `compose.local.yml` file in the `deploy` directory with the correct path for your device.

---

## Step 2: Install Podman Desktop and Enable Docker Compatibility
1. Install Podman Desktop.
2. Follow the installation description for both Podman and Podman-Compose.
3. Enable Docker compatibility in Podman Desktop.

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
2. Navigate to the `deploy` directory containing the `compose.local.yml` file.
3. Open a CLI window in the directory and enter the command:
   ```bash
   podman-compose -f compose.local.yml build
   ```
4. After the containerfiles have been built, enter the command:
   ```bash
   podman-compose -f compose.local.yml up -d
   ```
5. Verify that 7 containers are running in Podman Desktop.

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
4. Complete the onboarding process for Zigbee2MQTT. Ensure the coordinator is recognized, select the appropriate settings for the cordintor, and enable Home Assistant during the onboarding process.
5. Verify the logs in Podman Desktop for the message:
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
6. When sucessful, a Zigbee2MQTT bridge should appear, allowing to toggle i.e. the permit join function through the integration.

---

## Step 9: Adding a long-lived token to the interceptor (optional)
1. Create a long-lived token under **Profile -> Security**.
2. Copy the token and replace the default `SHH_Token` in the `compose.local.yml` file.
3. Add the following code block to the `configuration.yaml` file of Home Assistant:
```
   http:
     use_x_forwarded_for: true
     trusted_proxies:
      - {Subnet of the gateway container}
```
4. Check the subnet of the gateway container with the following CLI command:
```bash
   podman exec {Name of the exact gateway container} ip a
   ```
> **Info:** The first two address areas of the IPv4 address should suffice as trusted proxies.
5. After the token and proxies have been added, restart the container with:
```bash
   podman-compose -f compose.local.yml up -d
```

and ensure the token has been added with:

```bash
   podman exec {Name of the exact gateway container} env | grep -i SHH_
```
5. If the token shown is the long-lived token and **not** the default `change_me` token, the long-lived token has been correctly added.

> **Info:** For me information regarding the `trusted_proxies` see the [documentation of Home Assistant](https://www.home-assistant.io/integrations/http/#apis).

---

## Step 10: Suppress a Zigbee Device
1. Access the interceptor at:
   ```
   https://localhost:3000
   ```
2. Accept the self-signed certificate warning.
3. Click **Login** (no credentials required).
4. Add a new configuration and select **Edit**. 
5. Navigate to the **Error Configuration** tab and scan the network.
6. Select the device to suppress and click ∅. 
7. Go back to the configuration and select **Run**, then **Deploy all**.
8. To lift the suppression, click **Undo all**. 

---

## Notes

> **Warning:** When deleting or renaming automations in Home Assistant, **ensure** beforehand that the to-be automation is **not** currently affliated with any configuration over at the interceptor (https://localhost:3000). Otherwise the interceptor will show a blank page and cannot interact with anymore unless the browser cache and cookies will be deleted.

- Using Docker Desktop is strongly discouraged as the coordinator was never properly passed through when preparing this installation guide.
- Do **not** run a container application and a VM with Home Assistant at the same time as this will complicate the virtualization process for both.
- Replace placeholders (e.g., `VendorID`, `ProductID`) with actual values.
- The {name of the exact gateway container} can be seen in Podman Desktop
- Ensure the Zigbee coordinator is properly connected and recognized by the system and Home Assistant.
- The interceptor runs under **https** and not **http** as well as uses a self-signed certificate.
- To use and ultilize the automations created in Home Assistant a long-lived token has to be added to the interceptor as described in [Step 9](#step-9-adding-a-long-lived-token-to-the-interceptor-optional). This is not necessary if MQTT messages should merely be intercepted.
- After changing automations through the interceptor, to revert these automations back to their original versions go to Edit -> Automation Rule -> ↻.
