**Scenario setup**

For this scenario, you're exchanging all MQTT messages the presence sensor sends to Home Assistant with messages that read {presence: false}. This will make Home Assistant believe that no presence is detected in the room even when the participant is present, moves, and interacts with devices in the room. But since no presence is detected, automations with the trigger/condition of a detected presence will never trigger. This can be used to simulate a device which run out off electricity or is outright broken.

**Scenario outline/setting**

It's 8:00 PM. You notice the roller shutter is still open, even though the system is supposed to close it at 7:30 PM when someone is present.

Using the tablet interface, your task is to figure out what might be wrong. You're not expected to fix anything, but please try to determine:

- What kind of issue it is (e.g., device not responding, communication issue, configuration error)
- Which device(s) are affected

Let us know your diagnosis once you're ready.