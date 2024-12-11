# pomodoro-project
#### Video Demo:  <https://youtu.be/58dSXzgDtEQ>
#### Description:
A simple and intuitive Timer Web app based on Pomodoro technique, built using JavaScript, HTML, and CSS to help people manage their time effectively and boost productivity.

### Features:
- **Customizable Timer:** Set focus session and break intervals according to your preference.
- **Pause, Resume & Reset:** User can pause the session, resume it or reset it With a simple click.
- **Visual Timer Display:** A dynamic progress bar to keep track of the remaining time.
- **Notifications:** Alert to notify you when it's time to work or to take a break and responsive sounds on buttons.
- **Auto-Pause After Sessions:** You can choose to pause the timer from automatically starting the next session after completion.
- **Enable or Disable Sounds** If you like to keep it silent you can do that by just a click.

### How It Works:
1. Start by setting your desired focus and break durations, or keep them default.
2. Hit the "Start" button to begin your Pomodoro Session.
3. Get notified when it's time to switch between focus or break sessions.

### Languages Used:
- **HTML** for the structure.
- **CSS** for styling and visual elements.
- **JavaScript** for interactivity and timer functionality.

### Complications Faced:
1. **Redesigning the Options-Menu** Initially, I placed it directly below the timer container. While this seemed like a straightforward design choice, it turned out to be a poor decision for both aesthetics and functionality. The layout felt crowded, limiting the number of options I could add and affecting the overall user experience. This mistake cost me significant time as I had to completely rethink the menu's placement. After much deliberation, I decided to rebuild it as a sidebar. This shift required rewriting a significant portion of my JavaScript, HTML and CSS to integrate the new design seamlessly. While the sidebar eventually improved the usability of the app, the process of transitioning from the old layout to the new one was time-consuming and challenging.

2. **Javascript Functions** After completing the initial base structure of the app, the code did not work as expected. Debugging and fixing these issues required a complete rebuild of many functions, as the original logic was either flawed or incompatible with the changes I had made during development. Rewriting these functions was a slow process, required an additional week of work, debugging session revealed new issues, but through careful analysis. I managed to make the functionality stable and reliable. This taught me the importance of modular code and frequent testing during development.

3. **Sidebar Implementation** Many of the Javascript functions I had written for the previous layout were no longer compatible with the new sidebar structure. Adapting these functions to work with the sidebar required changes to the codebase. For instance, event listeners needed to be updated, and DOM manipulations had to account for the new element hierarchy. This process took nearly a week of trial and error, as I tested various approaches to integrate the sidebar without breaking the app's core functionality.

4. **Buttons and Color Scheme Adjustment** Struggled to create animations that would make the buttons appear and disappear at the right time, ensuring a smooth user experience. To address this, I built a toggle visibility function in JavaScript, which allowed me to control when buttons should be shown or hidden dynamically. Additionally, choosing the right colors for the buttons was a meticulous process, as they needed to complement the app's overall color scheme.

5. **Progress-bar** Implementing the progress bar was one of the most time-talking tasks in this project. It took me almost a week to get it working as intended. Initially, the progress bar would extend beyond its container when I set longer timer durations. Debugging this issue was particularly challenging, as it involved understanding how CSS and JavaScript interacted in real-time. After extensive testing and adjustments, I managed to fix the problem by refining the Javascript logic responsible for updating the bar's width. Additionally, I enhanced its appearance with a CSS gradient, which added a polished and professional touch to the app's design.

### Inspiration
This project is inspired by my own struggle with focus during studies, By using this technique I managed to study better.
