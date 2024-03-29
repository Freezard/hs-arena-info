# HSArena Info (Discontinued)
A desktop web app dedicated to Hearthstone Arena with helpful (and nerdy) info.
 
## FEATURES
- Browse the current arena pool and quickly search for specific cards
  - Turn on Discover Mode to see the discover pool of a class including neutral cards
- Card win and draft rates shows off which cards are doing well and which ones to play around
  - Understand a card's power level easier by turning on win rates relative to the win rate of the class
- Recently nerfed or buffed cards are marked and also have their win rate change displayed
- See helpful transform data (for example when evolving a minion)
  - Average minion attack/health for each mana pool
  - Chances of a minion having Taunt, Rush etc
  - List all possible minions to compare strengths for different mana pools

## USAGE
### Current Cards
![Site overview](images/readme/rotation.jpg)
>The default view (Current Cards button) shows the current arena cards. Click on a class and use the filters for more detailed results. Filters include card cost, type, race and so on. You can also search for specific card names or texts.

>Right-clicking on a class will enable Discover Mode, which includes neutral cards and displays their win/draft rates based on the selected class.
### Transformation Odds

![Odds](images/readme/odds.jpg)
>Transformation odds are helpful when needing immediate survival as it lists the best chances for getting Taunt, Rush etc when transforming a minion with a certain cost (for example with Evolve). It also lists the average attack/health with the chosen mechanic for each mana pool. Clicking on a mana pool will display all the possible minions. Average Stats includes every minion.
>- Banned minions are included when transforming
>- Dormant minions are excluded for mechanics since you usually want a minion that has immediate Rush etc
>- Colossal minions are excluded since they can't be transformed into

### Win/Draft Rates
![Card win/draft rates](images/readme/card.jpg)
>There's two numbers below each card, the first one is the deck win rate and the second number is the draft rate of the card. The draft rate in particular helps determine whether to play around a card, and which Secret is the most likely to be played. This data is taken from HSReplay.net and includes games from the last 14 days.
### Relative Win Rates
![Relative win rates](images/readme/relativewinrates.jpg)
>Turn on the Relative Win Rates option to see a card's win rate compared to the class win rate. For example, if a class has a 45% win rate and a card has 47% then it will display +2%.

### Win Rate Tracking For Changed Cards
![Changed cards tracking](images/readme/tracking.jpg)
>Recently buffed or nerfed cards will have their win rate increase/decrease since their change tracked and displayed in parantheses. These changed cards will have a yellow background.

## PLANNED FEATURES
- Mark banned cards, add setting for hiding them
- Add discover odds
- Add customized transformation odds
