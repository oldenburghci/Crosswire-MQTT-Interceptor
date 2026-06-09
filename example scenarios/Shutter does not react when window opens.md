**Scenario setup**

The window sensor, which is reporting to Home Assistant whether it is closed or open, can be intercepted to immitate a device error or stale status. The sensor is, e.g., stuck in the closed state and therefore the automation for when the window is opened and the roller shutter should move up but the automation never triggers.

**Scenario outline/setting**

You open the window, expecting the roller shutter to open automatically -- but this time, nothing happens. The roller shutter stays closed and collides with the window.

From your understanding, the roller shutter should open automatically when both the window is open and someone's presence in the room is detected.

Using the tablet interface, your task is to figure out what might be wrong. You're not expected to fix anything, but please try to determine:

- What kind of issue it is (e.g., device not responding, communication issue, configuration error)
- Which device(s) are affected

Let us know your diagnosis once you're ready.