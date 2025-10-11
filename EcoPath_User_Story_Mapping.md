# EcoPath User Story Mapping & Use Cases

## Overview
This document outlines the user stories and acceptance criteria for the EcoPath application, focusing on climate awareness, personal sustainability actions, and user engagement features.

---

## Epic 1: Climate Awareness & Information

### User Story 1.1: Live Climate News Updates

**As a** user  
**I want to** easily access short and meaningful climate news updates,  
**So that** I can quickly understand what is happening and how it may affect people like me.

#### Acceptance Criteria
- **Given** the user is on the Homepage
- **When** the user scrolls down to the Live Climate News section
- **Then** a list of recent climate news cards is displayed (≥1 card)
- **And** each card shows a headline, short summary, and a visual label (e.g., "Critical")

- **When** the user clicks on a news card
- **Then** the card flips to show an AI-generated insight
- **And** the insight provides a clear summary or interpretation of the news topic

- **When** the user clicks again (or taps "Back")
- **Then** the card flips back to the headline view

#### Effort Estimation
- Front-end: Display news cards on homepage - **Medium effort / Medium complexity / Small uncertainty**
- Interactive flip (headline ↔ AI insight) - **Medium effort / Medium complexity / Small uncertainty**
- Content integration: Fetch live climate news - **Medium effort / Medium complexity / Medium uncertainty**
- AI-generated insight integration (mocked or rule-based for MVP) - **Medium effort / Large complexity / Medium uncertainty**

#### Test Cases
- **TC-1.1.1** – Display News Cards on Scroll
  - *Preconditions*: User is on Homepage; network connection available
  - *Steps*: Scroll down until the Live Climate News section is visible
  - *Expected*: A list of ≥1 recent climate news card is displayed

- **TC-1.1.2** – News Card Content
  - *Preconditions*: At least one news card is visible
  - *Steps*: Observe the first visible card
  - *Expected*: Each card shows headline, summary, visual label

- **TC-1.1.3** – Flip Card to AI Insight
  - *Preconditions*: A news card is visible
  - *Steps*: Click on the card
  - *Expected*: The card flips, showing an AI-generated insight

- **TC-1.1.4** – Flip Back to Headline View
  - *Preconditions*: Card is showing AI insight
  - *Steps*: Click the flipped card again (or press "Back")
  - *Expected*: The card flips back to headline + summary + label view

---

### User Story 1.2: Climate Timeline Exploration

**As a** user  
**I want to** explore what major environmental events happened in different historical periods,  
**So that** I can better understand the context and urgency of today's climate challenges.

#### Acceptance Criteria
- **Given** the user is on the Homepage
- **When** the user scrolls down to the Climate Timeline section
- **Then** five historical time periods are displayed (e.g., 1880–1950, 1951–1980, etc.)

- **When** the user selects a time period
- **Then** the timeline updates to show the key climate-related events of that era
- **And** the selected period is visually indicated as active

- **When** the user switches to another period
- **Then** the new period's events load, and the previous selection loses active state

#### Effort Estimation
- Front-end: Display timeline with 5 historical periods - **Medium effort / Medium complexity / Small uncertainty**
- Interactive selection (click period → update timeline, active state) - **Medium effort / Medium complexity / Small uncertainty**
- Content integration: Load climate events for each period - **Medium effort / Medium complexity / Medium uncertainty**

#### Test Cases
- **TC-1.2.1** – Display Historical Periods on Scroll
  - *Preconditions*: User is on Homepage; timeline section available
  - *Steps*: Scroll down until the Climate Timeline section is visible
  - *Expected*: Timeline shows 5 historical periods

- **TC-1.2.2** – Select Period to View Events
  - *Preconditions*: Timeline with periods is visible
  - *Steps*: Click on a period (e.g., 1951–1980)
  - *Expected*: Timeline updates to show events for that period

- **TC-1.2.3** – Selected Period Highlighted
  - *Preconditions*: A period is selected
  - *Steps*: Observe the selected period
  - *Expected*: Selected period is visually highlighted (e.g., bold, underline, shaded)

- **TC-1.2.4** – Switching Periods Updates Content
  - *Preconditions*: Timeline is visible, events shown for one period
  - *Steps*: Select another period
  - *Expected*: New period's events load; previous selection loses highlight

---

## Epic 2: Personal Sustainability Actions

### User Story 2.1: Browse Eco-Friendly Pledges

**As a** user,  
**I want to** browse a list of simple and actionable eco-friendly pledges,  
**So that** I can easily discover small, practical steps to begin my sustainability journey.

#### Acceptance Criteria
- **Given** the user is on the My Pledge page
- **When** the page loads
- **Then** a list of public pledges is displayed

- **When** the user scrolls
- **Then** more public pledges remain visible without error

#### Effort Estimation
- Front-end: Display list of public pledges - **Small effort / Small complexity / Small uncertainty**
- Scrolling functionality (keep pledges visible without error) - **Small effort / Small complexity / Small uncertainty**

#### Test Cases
- **TC-2.1.1** – Display Public Pledges on Page Load
  - *Preconditions*: User is on the My Pledge page
  - *Steps*: Load the My Pledge page
  - *Expected Result*: A list of public eco-friendly pledges is displayed (≥1 item)

- **TC-2.1.2** – Verify Each Pledge is Simple and Actionable
  - *Preconditions*: Public pledges list is visible
  - *Steps*: Observe the first few pledges in the list
  - *Expected Result*: Each pledge is written as a short, practical action (e.g., "Turn off lights when not in use")

- **TC-2.1.3** – Scroll Down to Load/Reveal More Pledges
  - *Preconditions*: Public pledges list is visible and has multiple items
  - *Steps*: Scroll down the list of pledges
  - *Expected Result*: Additional public pledges remain visible without error (no blank space, crash, or layout break)

- **TC-2.1.4** – Continuous Scrolling Stability
  - *Preconditions*: Public pledges list has more items than one screen height
  - *Steps*: Scroll repeatedly to the bottom of the list
  - *Expected Result*: The list continues to show pledges without interruption; no duplicate items, missing items, or infinite loading loops occur

---

### User Story 2.2: AI-Powered Personalized Recommendations

**As a** user who has entered my carbon footprint data,  
**I want to** receive tailored eco-friendly actions,  
**So that** I can get recommendations that match my lifestyle.

#### Acceptance Criteria
- **Given** the user is on My Pledge page
- **When** the user clicks the AI Suggestions tab
- **Then** a list of AI-suggested pledges is displayed

- **When** AI-suggested pledges are displayed
- **Then** each pledge includes a short explanation of why it was recommended

- **When** no AI-suggested pledges are available
- **Then** a message explains why and prompts the user to complete or update their quiz

#### Effort Estimation
- Front-end: Add AI Suggestions tab & show pledge list - **Medium effort / Medium complexity / Small uncertainty**
- Show explanation text for each suggestion - **Small effort / Small complexity / Small uncertainty**
- Handle empty state (no suggestions → show message & prompt quiz) - **Small effort / Small complexity / Small uncertainty**

#### Test Cases
- **TC-2.2.1** – Display AI-Suggested Pledges on Tab Click
  - *Preconditions*: User is on My Pledge page with carbon footprint data available
  - *Steps*: Click on the AI Suggestions tab
  - *Expected Result*: A list of AI-suggested pledges is displayed

- **TC-2.2.2** – Each Suggested Pledge Shows Explanation
  - *Preconditions*: AI-suggested pledges are visible
  - *Steps*: Observe each pledge in the list
  - *Expected Result*: Each pledge includes a short explanation of why it was recommended (e.g., "Based on your high electricity usage, we suggest switching to LED lights")

- **TC-2.2.3** – No Suggestions Available
  - *Preconditions*: User has not completed the quiz or data is insufficient
  - *Steps*: Click on the AI Suggestions tab
  - *Expected Result*: No pledges are displayed; a message explains why (e.g., "We couldn't generate recommendations"); the message prompts user to complete or update their quiz

- **TC-2.2.4** – Switching Back to Other Tabs
  - *Preconditions*: AI Suggestions tab is active and showing pledges
  - *Steps*: Click back to the Public Pledges tab
  - *Expected Result*: Public pledges list is displayed correctly; AI Suggestions view is hidden

---

### User Story 2.3: Select Personal Pledges

**As a** user,  
**I want to** select the eco-friendly actions that matter to me,  
**So that** I can build a personal list of commitments I feel motivated to follow.

#### Acceptance Criteria
- **Given** the user is viewing the list of pledges
- **When** the user clicks the checkbox on a pledge
- **Then** the pledge is marked as selected

- **When** a pledge is selected
- **Then** it appears in the "Pledges selected" summary at the bottom of the page

- **When** the user deselects a pledge
- **Then** it is removed from the "Pledges selected" summary

- **When** the user clicks the Clean All
- **Then** the "Pledges selected" summary will all clean

#### Effort Estimation
- Checkbox interaction (select/deselect pledge) - **Small effort / Small complexity / Small uncertainty**
- Update "Pledges selected" summary at bottom - **Medium effort / Medium complexity / Small uncertainty**
- Implement Clean All function - **Small effort / Small complexity / Small uncertainty**

#### Test Cases
- **TC-2.3.1** – Select a Pledge
  - *Preconditions*: User is viewing the list of pledges
  - *Steps*: Click the checkbox on a pledge
  - *Expected Result*: The pledge is marked as selected (e.g., checkbox checked, visual highlight); the pledge appears in the "Pledges selected" summary at the bottom of the page

- **TC-2.3.2** – Deselect a Pledge
  - *Preconditions*: At least one pledge has been selected
  - *Steps*: Click again on the checkbox of a selected pledge
  - *Expected Result*: The pledge is deselected; it is removed from the "Pledges selected" summary

- **TC-2.3.3** – Multiple Pledges Selection
  - *Preconditions*: User is viewing the pledge list
  - *Steps*: Select 2 or more pledges
  - *Expected Result*: All selected pledges appear in the summary; the summary shows the correct count and list of selected pledges

- **TC-2.3.4** – Clean All Action
  - *Preconditions*: At least one pledge is selected and visible in the summary
  - *Steps*: Click the Clean All button
  - *Expected Result*: The "Pledges selected" summary becomes empty; all pledge checkboxes are unchecked in the main list

- **TC-2.3.5** – Persistence After Interaction (Optional)
  - *Preconditions*: User has selected pledges
  - *Steps*: Scroll the page or switch between tabs (Public / AI Suggestions)
  - *Expected Result*: The selected pledges remain checked and visible in the summary until explicitly deselected or cleared

---

### User Story 2.4: Set Reminder Frequency

**As a** user,  
**I want to** define how often I commit to each eco-friendly action (once, daily, weekly, or custom),  
**So that** the actions fit smoothly into my lifestyle.

#### Acceptance Criteria
- **Given** the Set Reminders window is open for the selected pledges
- **When** the user selects a frequency option (Once, Daily, Weekly, or Custom)
- **Then** the choice is saved for that pledge

- **When** the user enters an invalid custom date
- **Then** the system displays an error and does not save until corrected

- **When** the user removes a pledge from the window
- **Then** that pledge is removed from the reminders list

#### Effort Estimation
- Front-end: Add frequency selection options (Once, Daily, Weekly, Custom) - **Medium effort / Medium complexity / Small uncertainty**
- Validation: Handle invalid custom date input (show error, block save) - **Small effort / Medium complexity / Small uncertainty**
- Update reminders list when pledge is removed - **Small effort / Small complexity / Small uncertainty**

#### Test Cases
- **TC-2.4.1** – Select Frequency Option
  - *Preconditions*: Set Reminders window is open for at least one selected pledge
  - *Steps*: Choose a frequency option (Once / Daily / Weekly / Custom) for a pledge
  - *Expected Result*: The chosen frequency is saved for that pledge; selection is reflected immediately (e.g., dropdown shows "Weekly")

- **TC-2.4.2** – Save Custom Frequency (Valid Input)
  - *Preconditions*: Set Reminders window is open; pledge selected
  - *Steps*: Select Custom option; Enter a valid custom date/time
  - *Expected Result*: Custom frequency is saved successfully; pledge reminder updates to show the custom schedule

- **TC-2.4.3** – Invalid Custom Frequency Input
  - *Preconditions*: Set Reminders window is open; pledge selected
  - *Steps*: Select Custom option; Enter an invalid date/time (e.g., empty field, invalid format, past date)
  - *Expected Result*: System displays an error message; frequency is not saved until corrected

- **TC-2.4.4** – Remove Pledge from Reminders Window
  - *Preconditions*: Set Reminders window has ≥1 pledge scheduled
  - *Steps*: Click the "Remove" or "Delete" option for a pledge
  - *Expected Result*: The pledge is removed from the reminders list; it no longer shows any scheduled frequency

- **TC-2.4.5** – Multiple Pledges Frequency Setup
  - *Preconditions*: Set Reminders window has multiple pledges
  - *Steps*: Assign different frequency options to each pledge
  - *Expected Result*: Each pledge retains its individual frequency setting; no overlap or overwrite between different pledges' schedules

---

### User Story 2.5: Export to Calendar

**As a** user,  
**I want** my eco-friendly actions to appear in my personal calendar,  
**So that** I can get timely reminders and stay on track.

#### Acceptance Criteria
- **Given** the user on Set Reminders for Each Pledge page
- **When** the user clicks Save All Pledges
- **Then** an .ics file is generated

- **When** the file is generated
- **Then** it includes all selected pledges with their chosen frequency

- **When** the file is downloaded
- **Then** the user can import it into standard calendar apps (Google, Outlook, Apple)

- **When** the .ics file is opened in a calendar app
- **Then** each reminder shows the pledge name as the event title

- **When** the reminder notification appears
- **Then** the event description contains a short note about the pledge

- **When** multiple pledges are exported
- **Then** each pledge appears as a separate calendar entry

#### Effort Estimation
- Generate .ics file with pledge + frequency - **Medium effort / Medium complexity / Small uncertainty**
- Ensure file can be downloaded & imported into calendar apps - **Small effort / Small complexity / Small uncertainty**
- Format event details (title = pledge, description = note) - **Small effort / Small complexity / Small uncertainty**

#### Test Cases
- **TC-2.5.1** – Generate .ics File
  - *Preconditions*: User is on Set Reminders for Each Pledge page; ≥1 pledge selected with frequency set
  - *Steps*: Click Save All Pledges
  - *Expected Result*: An .ics file is generated successfully

- **TC-2.5.2** – .ics File Contains Selected Pledges
  - *Preconditions*: .ics file has been generated
  - *Steps*: Open the generated .ics file in a text/calendar viewer
  - *Expected Result*: File includes all selected pledges; each pledge has its assigned frequency stored

- **TC-2.5.3** – Import .ics File into Calendar Apps
  - *Preconditions*: .ics file has been downloaded
  - *Steps*: Import the file into Google Calendar, Outlook, Apple Calendar
  - *Expected Result*: File imports successfully in all standard calendar apps

- **TC-2.5.4** – Event Title Displays Pledge Name
  - *Preconditions*: .ics file imported into a calendar app
  - *Steps*: Open one of the events in the calendar
  - *Expected Result*: Event title matches the pledge name

- **TC-2.5.5** – Event Description Displays Note
  - *Preconditions*: .ics event exists in calendar app
  - *Steps*: Open the event details
  - *Expected Result*: Event description contains a short note about the pledge (e.g., "Turn off lights to save energy")

- **TC-2.5.6** – Multiple Pledges Exported Separately
  - *Preconditions*: Multiple pledges have been selected and exported
  - *Steps*: Open the calendar after import
  - *Expected Result*: Each pledge appears as a separate calendar entry; no pledges are merged into a single event

- **TC-2.5.7** – Reminder Notification Behavior
  - *Preconditions*: Calendar app notifications enabled
  - *Steps*: Wait until the event time
  - *Expected Result*: A reminder notification appears with pledge details; notification contains pledge name (title) and short note (description)

---

## Summary

This user story mapping covers the core functionality of EcoPath:

1. **Climate Awareness**: News updates and historical timeline
2. **Personal Actions**: Browse, select, and customize eco-friendly pledges
3. **AI Integration**: Personalized recommendations based on user data
4. **Calendar Integration**: Export reminders to personal calendars

Each user story includes detailed acceptance criteria, effort estimations, and comprehensive test cases to ensure successful implementation and quality assurance.

