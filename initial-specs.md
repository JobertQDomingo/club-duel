I need to create a web app that has multiple users

Story:
We will be having Pickleball Interclub tournament Captains mode, I want to create a app for this so that we will not do the drafting, selecting player for each court, recording score and wins, tally/tabulation, match viewing for audience view, etc...
So this is the setup of the tournament
for each club(Club A vs Club B) they will have a 1 captain and N number of players
we agreed for a rule that a pair should not repeat twice

the flow I have in mind:
An Tournament Admin will create a match, inputs: Club A name, Club B name, Number of courts, Club A players, Club B players(we will add fields later if we identify we need more information that needed to the match).
After the match is created it will generate a link for each captains.
In the captains page, they can edit player list or edit the club name. then the main section of the page should be the draft pick: the captain will pick players that he/she want to assign in each court the player name will be in a card component but it is not revealed yet unless the admin will start the game of a certain court that the captain is done drafting.
After the game ends for a certain court, the admin will click "Match end"(or other term that meant to say match done time to record who wins and each team score) the buttons to declare who wins and each team score.
Also I want a section that will show top players who has the most wins, most likely a live ranking
Even the game is already started the admin should still can edit any information like club name, player list, add or remove court, etc...
When all the games are done, the admin can end the tournament to reveal the Winning club. also I want to display the detailed tabulation or matches information showing how did the winning club gets the Victory, then I want an extra details for player special awards like who is the player wins the most and other special awards.

Rules:
ideally the players pairing should not be repeated twice but it will depend to admin if he allow it, if the captain drafted the two players but those player is already paired in the previous games a warning UI should show that "this players is already paired once" but it should not prevent the captain to draft it, then in the admin side the admin should also see that warning but still can start the game. it should not preventive it should only show warning.
The winning club is determined strictly by the highest total cumulative actual points scored across all matches and rounds. Individual match wins do not dictate the winner; every point scored by every player contributes directly to their club's overall score.


this is the official tournament overview:
The Pickleball Club Duel is an inter-club team friendly match between two clubs fielding 16 players each (10mens and 6womens). The winning club is determined strictly by the highest total cumulative actual points scored across all matches and rounds. Individual match wins do not dictate the winner; every point scored by every player contributes directly to their club's overall score.

ROSTER MANAGEMENT (16-PLAYER FORMAT)

Each round consists of 7 Doubles matches.

CAPTAIN'S MODE AND BLIND LINEUP SUBMISSIONS
Lineups are submitted blind before every round to allow strategy and matchup tactics.

Prior to each round, both captains independently write down their lineup card (assigning Pairs 1 to 7).

Captains submit their lineup cards to the tournament director or swap them simultaneously without prior knowledge of the opponent's order.

Lineups automatically pair against the corresponding seed from the opposing club:
Doubles Match 1: Club A Pair 1 vs Club B Pair 1
Doubles Match 2: Club A Pair 2 vs Club B Pair 2
Doubles Match 3: Club A Pair 3 vs Club B Pair 3
Doubles Match 4: Club A Pair 4 vs Club B Pair 4
Doubles Match 5: Club A Pair 5 vs Club B Pair 5
Doubles Match 6: Club A Pair 6 vs Club B Pair 6
Doubles Match 7: Club A Pair 7 vs Club B Pair 7

Captains can change player pairings, switch seed order assignments between rounds. However, players who have already paired together in a previous round cannot pair together again in any subsequent round. Every doubles team fielded across the duel must be a unique pairing.