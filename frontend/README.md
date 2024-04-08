# Covey.Town Frontend App

Please see the `README.md` in the repository base for information about this project.

This frontend is created using the [nextjs](https://nextjs.org) toolchain. You
can start a development server by running `npm run dev`. To create a production build, run
`npm run build`.

Because of the implementation of the hospital area, popup, and its behavior, automated testing is not feasible. Here is a discussion of our manual testing strategy:

For the hospital interactive area on the map:

Boundary testing
- Verify that the map boundaries are correctly defined after resizing the map.
- Ensure that tiles can be placed within the extended boundaries without any issues.
- Check for any graphical glitches or irregularities at the edges of the map.

Tile placement testing
- Test various tile placement scenarios, including single tile placement, continuous drawing, and filling areas with tiles.
- Verify that tiles are placed accurately and aligned correctly with the grid.
- Check for any overlaps or gaps between tiles.

Tileset and tile properties testing
- Ensure that all tiles from the selected tileset can be placed on the map without errors.
- Verify that any custom properties associated with tiles behave as expected (e.g., collision properties, trigger properties).

Layer testing
- Test tile placement on different layers to ensure that tiles are rendered in the correct order.
- Verify that layers can be reordered, hidden, or locked without affecting tile placement.

Map properties testing
- Verify that changes to map properties (e.g., width, height) are reflected accurately.
- Test the behavior of the map when exporting to different formats (e.g., JSON, XML).


Manual testing script:
Below is a basic script that a future developer could follow to manually test the feature of expanding the map size in Tiled:

- Open Tiled and load a map that needs its size expanded.
- Go to the "Map" menu and select "Resize Map."
- Increase both the width and height of the map by a significant amount (e.g., +10 tiles in each direction).
- Verify that the map boundaries have extended correctly without any graphical artifacts.
- Use the tile placement tools to add tiles to the newly expanded areas of the map.
- Test different scenarios of tile placement, including single placement, continuous drawing, and filling areas with tiles.



For the hospital interactive behavior and popup:

Functionality testing
- Treatment Selection: Manually verify that each treatment button (Hunger Check-up, Health Check-up, Happiness Check-up) can be selected.
- Error Handling: Test error handling by submitting the form without selecting a treatment and verify that the appropriate error message is displayed.
- Treatment Submission: Test the submission of treatments and ensure that the loading progress screen is displayed, progresses, and disappears after treatment completion.
- Modal Closure: Verify that the modal closes correctly when clicking the Done button after treatment completion.
- Pausing and Unpausing: Ensure that the town controller is correctly paused when the hospital area is opened and unpaused when the modal is closed.

UI/UX testing
- Modal Appearance: Check the appearance of the modal dialog, including the header, treatment options, progress bars, and buttons.
- Image Display: Verify that the images associated with each treatment option (feed, play, clean) are displayed correctly.
- Progress Bars: Ensure that the progress bars reflect the correct progress values for each treatment.
- Error Message Display: Verify that error messages are displayed correctly and have the appropriate styling.
- Loading Screen: Test the appearance and behavior of the loading progress screen, ensuring it is displayed during treatment submission and disappears after completion.

Integration Testing
- Town Controller Interaction: Manually verify that the HospitalAreaPopup component interacts correctly with the town controller, pausing and unpausing as expected.
- Pet Stats Update: Ensure that pet stats are correctly updated in response to treatment submission and reflect the changes in the UI.

Edge Cases Testing
- Test edge cases, such as extreme values for pet stats and treatment submissions, to ensure the component handles them gracefully without crashing or producing unexpected behavior.
- Stress test the component by repeatedly submitting treatments and verifying that it remains responsive and functional.