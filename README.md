Automated Tournament and League Manager (ATLM)
ATLM is an Object-Oriented Software Engineering (OOSE) project for managing round-robin football leagues and knockout cups. Organizers create competitions, generate fixtures, schedule matches, and enter scores. Team Managers register teams and maintain player rosters. Viewers follow fixtures, results, standings, and brackets. Recording a score updates the league table or advances the winner through the cup bracket.

This repository contains the frontend, built with Vue 3, JavaScript, Vite, Vue Router, Pinia, and Tailwind CSS. Select Open demo to explore sample competitions, or create a local test account to try a specific role. The frontend can also connect to an Express API for registration and sign-in.
Set up on Windows
Use Node.js 24 for the same runtime used to verify this project. Open the extracted ATLM-Frontend folder in VS Code and run these commands in its terminal.
npm ci
npm run dev
Open the local address printed by Vite, usually http://localhost:5173. Vite may use another port if that address is busy. To check the production build, run npm run build. Use npm run preview to serve that build locally.
Try registration and sign-in locally
Leave VITE_API_BASE_URL empty and open the Vite localhost URL. Choose Create an account, enter a test email and password, and select a Demo role. Then sign in with that email and password. Choose Organizer to create competitions, Team Manager to manage teams, or Viewer to browse standings.

Demo accounts stay on the browser and address where you created them. Sign in again after a refresh. Choose Open demo to use the sample workspace right away and switch between roles.
Try the competition screens
1. Choose Open demo on the sign-in page. Open Campus Football League. As Organizer, enter a 2–0 score for Phnom Penh Falcons against Tonle Rovers in Matchweek 3. Standings shows the Falcons on seven points.
2. Choose New competition. Switch to Team Manager and enter two or more teams. You can add players under Manage roster.
3. Switch back to Organizer, then generate fixtures and assign a date, time, and venue. Save a score to update the outcome.
4. Open Spring Cup to see the knockout bracket. A tied cup match requires a tiebreak winner. The winner advances to the next round.
5. Switch to Viewer to see the read-only screens.
The Demo role selector opens the starting page for each role. Sample competitions and changes are stored in the current browser using the key atlm-vue-demo-v1.
Connect registration and sign-in
Copy .env.example to .env.local. Set VITE_API_BASE_URL to the URL your teammate gives you. Match VITE_REGISTER_PATH, VITE_LOGIN_PATH, and VITE_PROFILE_PATH to the exact backend paths, then restart Vite. This switches registration and sign-in to the API. Register through that API to create a server account. If Express runs on a different origin, have your teammate allow your frontend's Vite origin in the backend CORS configuration.

On the sign-in page, choose Create an account. The frontend checks that the passwords match and sends { name, email, password } in a POST to the registration endpoint. It accepts a successful JSON response or HTTP 204 and then offers a link back to sign-in. The backend assigns the account role.

For sign-in, the adapter in src/services/auth.js sends a POST with { email, password }. It expects a JSON token or accessToken and uses it as a Bearer token on the profile request. The profile can be a user object or { user: { id, name, email, role } }. The ID can also be userId or sub. If your friend's contract differs, adjust the request or response mapping in this adapter.
Role from the profile	Starts on	Workspace controls
organizer	Overview	Create competitions, generate fixtures, schedule matches, and enter scores
manager or team_manager	Teams	Manage team rosters and register teams
viewer	Standings	Read fixtures, results, standings, and brackets


Profiles with a missing or unrecognized role open the Viewer workspace. The signed-in role is read from the profile, and the Demo role switch is available in demo mode. Account sign-in lasts until refresh or sign-out. The workspace displays sample league data while the ISL API is being built. Your teammate's API should enforce permissions for live records.
Switch the theme
Use Dark mode or Light mode in the top bar. On the first visit, ATLM follows your device preference. Once you choose a theme, the browser remembers it. The theme also applies to team cards, standings, the cup bracket, and score dialogs.

The entry file src/main.js imports ./assets/style.css and ./router/router.js and installs Pinia and Vue Router before mounting. If you are copying the theme into an existing ATLM project, copy src/assets/style.css and src/components/ThemeToggle.vue, then add the ThemeToggle import and button from src/App.vue to your existing top bar.
Source map
File or folder	Responsibility
src/assets/style.css	Shared light and dark palettes, Tailwind import, and responsive styles
src/views	Registration, sign-in, overview, team directory, fixtures, league standings, and bracket screens
src/components	Score and schedule dialogs, team badges, fixture rows, and standings table
src/router/router.js	Competition-specific navigation
src/stores/workspace.js	Shared workspace and demo role state
src/services/auth.js	Browser demo and API registration and sign-in
src/services/atlm.js	Data interface consumed by the store
src/demo	Browser demo accounts, sample league data, and competition rules


Connect your friend's API
Replace the demo calls in src/services/atlm.js once your team agrees on the API. The store supports asynchronous calls. Keep the interface below, or update its caller in src/stores/workspace.js at the same time.
Adapter method	Expected result
load()	Workspace object with teams and tournaments. Each tournament includes its registered team IDs, match list, and league standings or cup champion.
createTournament(fields)	The new tournament ID so the UI can open its Teams page.
Team and roster actions	Save changes and resolve. The store refreshes the workspace afterwards.
Registration, fixture, and score actions	Save changes and resolve, or reject with a readable error. The frontend displays the updated fixtures and outcome after a refresh.


The demo adapter shows the exact view fields the screens use. In the shared version, display the server's fixture and standings data using the signed-in account. Your friend can map the adapter methods to the API routes your team agrees on.

The project uses history-based URLs. If you host the build later, configure the host to serve index.html for frontend routes.