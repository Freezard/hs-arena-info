/*  main.js
    HSArena Info
*/
let HSArenaInfo = (function() {
    'use strict';
    /*********************************************************
    ***************************MODEL**************************
    *********************************************************/
    let cardData; // Raw JSON data
    let arenaCardData = []; // Arena only data
    let filteredCardData = []; // Arena data filtered by class/mechanic
    
    let classWinRates = {};
    let winDraftRates = {}; // Card win/draft rates
    // Win rate of changed cards right before their change
    const changedCards = {};
    // List of changed cards by name, used by function generateChangedCards
    const changedCardsRaw = [];
            
    // Used for calculating stats/odds
    let totalStats;
    let totalMinions;
    
    // Filter for when browsing all arena cards
    let filter = {
        cost: '',
        type: '',
        race: '',
        keyword: '',
        rarity: '',
        set: '',
        school: '',
        search: '',
        discover: false,
        recentlyChanged: false
    };
    
    let settings = {
        relativeWinRates: false,
    };    

    const version = 1.17;
    const rotation = ['CORE', 'BOOMSDAY', 'DRAGONS', 'THE_BARRENS', 'STORMWIND', 'ALTERAC_VALLEY', 'THE_SUNKEN_CITY', 'TAVERNS_OF_TIME'];
    /*  CORE,NAXX,GVG,BRM,TGT,LOE,OG,KARA,GANGS:gadgetzan,UNGORO,ICECROWN:kotft,LOOTAPALOOZA:kobolds,
        GILNEAS:witchwood,BOOMSDAY,TROLL:rastakhan,DALARAN:ros,ULDUM,DRAGONS,YEAR_OF_THE_DRAGON:galakrond,
        BLACK_TEMPLE:outland,SCHOLOMANCE,DARKMOON_FAIRE,THE_BARRENS,STORMWIND,ALTERAC_VALLEY,THE_SUNKEN_CITY,
        TAVERNS_OF_TIME
    */
    const tavernsOfTime = [{"attack":5,"cardClass":"NEUTRAL","cost":4,"dbfId":50256,"elite":true,"health":5,"id":"TOT_030","mechanics":["BATTLECRY"],"name":"Chromie","set":"TAVERNS_OF_TIME","text":"<b>Battlecry:</b> Shuffle four Historical Epochs \ninto your deck.","type":"MINION"},{"attack":5,"cardClass":"NEUTRAL","cost":5,"dbfId":50823,"health":5,"id":"TOT_056","mechanics":["BATTLECRY"],"name":"Wildlands Adventurer","set":"TAVERNS_OF_TIME","text":"<b>Battlecry:</b> Add a random card from the Hall of Fame to your hand.","type":"MINION"},{"attack":2,"cardClass":"NEUTRAL","cost":1,"dbfId":50969,"health":2,"id":"TOT_067","mechanics":["BATTLECRY"],"name":"Infinite Murloc","race":"MURLOC","set":"TAVERNS_OF_TIME","text":"<b>Battlecry:</b> Shuffle an Infinite Murloc into your deck.\n[x]Your future Infinite Murlocs[x]\n get +1/+1.","type":"MINION"},{"cardClass":"PALADIN","cost":0,"dbfId":50973,"id":"TOT_069","name":"Blessing of Aeons","set":"TAVERNS_OF_TIME","spellSchool":"HOLY","text":"Give a minion \"At the end of your turn, gain +1/+1.\"","type":"SPELL"},{"attack":7,"cardClass":"WARLOCK","cost":7,"dbfId":51044,"health":7,"id":"TOT_102","mechanics":["BATTLECRY","DEATHRATTLE"],"name":"Rift Warden","race":"DRAGON","set":"TAVERNS_OF_TIME","text":"[x]<b>Battlecry:</b> Discard a \nrandom minion.\n <b>Deathrattle:</b> Summon it.","type":"MINION"},{"cardClass":"WARLOCK","cost":4,"dbfId":51042,"id":"TOT_103","name":"Grasp the Future","set":"TAVERNS_OF_TIME","text":"Draw 2 cards.\nThey cost (2) less.","type":"SPELL"},{"cardClass":"DRUID","cost":2,"dbfId":51046,"id":"TOT_105","name":"Flash Forward","set":"TAVERNS_OF_TIME","text":"Each player gains two Mana Crystals and draws two cards.","type":"SPELL"},{"attack":4,"cardClass":"ROGUE","cost":3,"dbfId":51048,"health":3,"id":"TOT_107","mechanics":["BATTLECRY"],"name":"Thief of Futures","set":"TAVERNS_OF_TIME","text":"<b>Battlecry:</b> Add a copy of the top card of your opponent's deck to your hand.","type":"MINION"},{"cardClass":"ROGUE","cost":0,"dbfId":51049,"id":"TOT_108","mechanics":["DISCOVER"],"name":"Déjà Vu","set":"TAVERNS_OF_TIME","text":"<b>Discover</b> a copy of a spell you played this game.","type":"SPELL"},{"attack":10,"cardClass":"NEUTRAL","cost":6,"dbfId":51050,"health":10,"id":"TOT_109","mechanics":["RUSH"],"name":"Stasis Dragon","race":"DRAGON","set":"TAVERNS_OF_TIME","text":"Starts dormant.\nThis awakens with <b>Rush</b> after two turns.","type":"MINION"},{"attack":8,"cardClass":"NEUTRAL","cost":15,"dbfId":51067,"health":8,"id":"TOT_110","name":"Timebound Giant","set":"TAVERNS_OF_TIME","text":"Costs (1) less for each card you've drawn.","type":"MINION"},{"attack":2,"cardClass":"NEUTRAL","cost":3,"dbfId":51068,"health":4,"id":"TOT_111","mechanics":["TRIGGER_VISUAL"],"name":"Timeline Witness","referencedTags":["DISCOVER"],"set":"TAVERNS_OF_TIME","text":"Instead of drawing your normal card each turn, <b>Discover</b> a card from your deck.","type":"MINION"},{"attack":4,"cardClass":"NEUTRAL","cost":4,"dbfId":51071,"health":6,"id":"TOT_112","mechanics":["BATTLECRY"],"name":"Possibility Seeker","race":"DRAGON","set":"TAVERNS_OF_TIME","text":"<b>Battlecry:</b> Shuffle your hand into your deck. Draw that many cards.","type":"MINION"},{"attack":6,"cardClass":"NEUTRAL","cost":5,"dbfId":51087,"health":3,"id":"TOT_116","mechanics":["BATTLECRY"],"name":"Timeway Wanderer","referencedTags":["DISCOVER"],"set":"TAVERNS_OF_TIME","text":"<b>Battlecry:</b> <b>Discover</b> a spell. Reduce its cost by (5) then put it on top of your deck.","type":"MINION"},{"attack":5,"cardClass":"HUNTER","cost":3,"dbfId":51089,"health":5,"id":"TOT_117","mechanics":["RUSH","TRIGGER_VISUAL"],"name":"Infinite Wolf","race":"BEAST","set":"TAVERNS_OF_TIME","text":"<b>Rush</b>. After this attacks,\nshuffle it into your deck and give future Infinite Wolves +2/+2.","type":"MINION"},{"attack":3,"cardClass":"SHAMAN","cost":4,"dbfId":51143,"health":5,"id":"TOT_118","mechanics":["BATTLECRY"],"name":"Stasis Elemental","race":"ELEMENTAL","referencedTags":["FREEZE"],"set":"TAVERNS_OF_TIME","targetingArrowText":"Freeze a minion.","text":"<b>Battlecry:</b> <b>Freeze</b> a minion until this leaves the battlefield.","type":"MINION"},{"attack":1,"cardClass":"MAGE","cost":2,"dbfId":51029,"health":3,"id":"TOT_308","mechanics":["TRIGGER_VISUAL"],"name":"Cavern Dreamer","set":"TAVERNS_OF_TIME","text":"At the end of your turn, add a random spell that costs (2) or less to your hand.","type":"MINION"},{"attack":5,"cardClass":"SHAMAN","cost":6,"dbfId":51070,"health":8,"id":"TOT_313","mechanics":["TRIGGER_VISUAL"],"name":"Master of Realities","set":"TAVERNS_OF_TIME","text":"[x]After you summon a minion,\n transform it into a random\n minion that costs (2) more.","type":"MINION"},{"attack":6,"cardClass":"WARRIOR","cost":6,"dbfId":51072,"health":6,"id":"TOT_316","mechanics":["BATTLECRY","DISCOVER"],"name":"Draconic Herald","race":"DRAGON","set":"TAVERNS_OF_TIME","text":"<b>Battlecry:</b> <b>Discover</b> a minion.\nGive it +3/+3 then put it on top of your deck.","type":"MINION"},{"attack":6,"cardClass":"DRUID","cost":6,"dbfId":51076,"health":7,"id":"TOT_320","mechanics":["TRIGGER_VISUAL"],"name":"Harbinger of Catastrophe","race":"DRAGON","set":"TAVERNS_OF_TIME","text":"At the start of your turn, summon the highest-cost minion from each player's deck.","type":"MINION"},{"attack":6,"cardClass":"PALADIN","cost":5,"dbfId":51013,"health":6,"id":"TOT_330","mechanics":["TOPDECK"],"name":"Bronze Broodmother","race":"DRAGON","set":"TAVERNS_OF_TIME","text":"When you draw this, summon a 1/1 Wee Whelp.","type":"MINION"},{"attack":6,"cardClass":"NEUTRAL","cost":7,"dbfId":51108,"elite":true,"health":6,"id":"TOT_332","mechanics":["BATTLECRY"],"name":"Murozond","race":"DRAGON","set":"TAVERNS_OF_TIME","text":"[x]<b>Battlecry:</b> From now on, your\n turns are 15 seconds and\n you draw 2 extra cards.","type":"MINION"},{"attack":2,"cardClass":"NEUTRAL","cost":2,"dbfId":51127,"health":3,"id":"TOT_334","mechanics":["TOPDECK"],"name":"Temporal Anomaly","race":"ELEMENTAL","set":"TAVERNS_OF_TIME","text":"When you draw this, add a random spell to your hand <i>(from your class).</i>","type":"MINION"},{"cardClass":"HUNTER","cost":2,"dbfId":51145,"id":"TOT_340","name":"Chronoshot","set":"TAVERNS_OF_TIME","text":"Return an enemy minion to your opponent's hand. It costs (2) more.","type":"SPELL"},{"cardClass":"MAGE","cost":3,"dbfId":51146,"id":"TOT_341","name":"Consider the Past","set":"TAVERNS_OF_TIME","text":"Add 3 random spells from the past to your hand.","type":"SPELL"},{"attack":4,"cardClass":"WARRIOR","cost":4,"dbfId":51147,"durability":2,"id":"TOT_342","mechanics":["TRIGGER_VISUAL"],"name":"Fatecleaver","set":"TAVERNS_OF_TIME","text":"[x]After this kills a minion,\ndestroy all copies of it\n<i>(wherever they are).</i>","type":"WEAPON"},{"cardClass":"PRIEST","cost":2,"dbfId":51148,"id":"TOT_343","name":"Reminisce","set":"TAVERNS_OF_TIME","spellSchool":"SHADOW","text":"Add two random cards your opponent played this game to your hand.","type":"SPELL"},{"cardClass":"PRIEST","cost":1,"dbfId":51151,"id":"TOT_345","mechanics":["DISCOVER"],"name":"Ripple in Time","referencedTags":["ECHO"],"set":"TAVERNS_OF_TIME","spellSchool":"SHADOW","text":"<b>Discover</b> a minion. If you play it this turn, it has <b>Echo</b>.","type":"SPELL"}];
    /*********************************************************
    **************************UTILS***************************
    *********************************************************/
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    
    // Helper function for populating changedCards
    function generateChangedCards() {
        let result = {};
        
        changedCardsRaw.forEach((name) => {
            let dbfId = getDBFID(name);
            result[dbfId] = {};
           
            for (let cardClass in winDraftRates) {
                if (winDraftRates[cardClass][dbfId]) {
                    result[dbfId][cardClass] = {};
                    result[dbfId][cardClass].winrate = winDraftRates[cardClass][dbfId].included_winrate;
                    result[dbfId][cardClass].draftrate = winDraftRates[cardClass][dbfId].included_popularity;
                }
            }
        });
        
        console.log(JSON.stringify(result));
        
        function getDBFID(name) {
            let dbfId;
            arenaCardData.forEach((card) => {
                if (card.name === name) {
                    dbfId = card.dbfId;
                    return;
                }
            });
            return dbfId;
        }
    }
    /*********************************************************
    **************************INIT****************************
    *********************************************************/
    // Create arena only data and sort it by cost
    function createArenaCardData() {
        arenaCardData = cardData.filter(card => 
            rotation.includes(card.set) && !card.id.includes('HERO'));
            
        if (rotation.includes('TAVERNS_OF_TIME'))
            arenaCardData = arenaCardData.concat(tavernsOfTime);
        
        arenaCardData.sort(function(a, b) {
            return a.cost === b.cost ?
                   a.name.localeCompare(b.name) :
                   a.cost - b.cost;
        });
        
        // Remove duplicates that exist in both Core and their own set
        arenaCardData = arenaCardData.filter((card, index) => {
            let nextCard = arenaCardData[index + 1];
            let previousCard = arenaCardData[index - 1];
            
            if (nextCard !== undefined && card.name === nextCard.name && card.set !== 'CORE')
                return false;
            else if (previousCard !== undefined && card.name === previousCard.name && card.set !== 'CORE')
                return false;
            else return true;
        });
    }
    
    // Create class data used when viewing all arena cards
    function createClassCardData(cardClass) {
        filteredCardData = arenaCardData.filter(card => 
            cardClass === 'ALL' ||
            (filter.discover && card.cardClass === 'NEUTRAL' && card.classes === undefined) ||
            (card.cardClass === cardClass && card.classes === undefined) ||
            (card.classes !== undefined && card.classes.includes(cardClass)));
    }
    
    /* Create data used when viewing transformation stats
       type = AVERAGE or any mechanic (TAUNT, RUSH etc)
       Can contain multiple mechanics in a sequence like RUSH,CHARGE+LIFESTEAL,WINDFURY
       This means any card that has either RUSH OR CHARGE as well as LIFESTEAL AND WINDFURY
    */
    function createStatsCardData(type) {
        filteredCardData = [];
        totalStats = {};
        totalMinions = {};
        let any = type.split('+')[0].split(',');
        let all = type.split('+')[1] !== undefined ? type.split('+')[1].split(',') : [];

        // TODO: Simplify
        for (let c in arenaCardData) {
            let card = arenaCardData[c];

            if (card.type !== 'MINION')
                continue;

            if (totalMinions[card.cost] === undefined)
                totalMinions[card.cost] = 0;
            totalMinions[card.cost]++;
            
            // Transforming into Colossal minions is not possible
            if (card.mechanics !== undefined && card.mechanics.includes('COLOSSAL'))
                continue;
            
            if (type === 'AVERAGE') {
                if (totalStats[card.cost] === undefined)
                    totalStats[card.cost] = { attack: 0, health: 0 };
                
                totalStats[card.cost].attack += card.attack;
                totalStats[card.cost].health += card.health;
            } else if (card.mechanics !== undefined) {
                if ((!any.some(x => card.mechanics.indexOf(x) >= 0 && all.every(x => card.mechanics.indexOf(x) >= 0))))
                    continue;
                else if (card.text !== undefined && (card.text.startsWith('<b>Dormant</b>') || card.text.includes('Starts <b>Dormant</b>'))) // Also add can't attack?
                    continue;

                if (totalStats[card.cost] === undefined)
                    totalStats[card.cost] = { attack: 0, health: 0, minions: 0 };

                totalStats[card.cost].attack += card.attack;
                totalStats[card.cost].health += card.health;
                totalStats[card.cost].minions++;
            } else continue;

            filteredCardData.push(card);
        }
    }
    
    // Get win and draft rates from HSReplay.net and create object
    async function createWinDraftRates() {
        try {
            let request = await fetch('/cardRates');
            let data = await request.json();
            
            for (let cardClass in data.series.data) {
                if (winDraftRates[cardClass] === undefined)
                    if (cardClass === 'ALL')
                        winDraftRates.NEUTRAL = {};
                    else winDraftRates[cardClass] = {};
                
                for (let card of data.series.data[cardClass])
                    if (cardClass === 'ALL')
                        winDraftRates.NEUTRAL[card.dbf_id] =
                        {
                            included_winrate : card.included_winrate,
                            included_popularity : card.included_popularity
                        }
                    else winDraftRates[cardClass][card.dbf_id] =
                         {
                             included_winrate : card.included_winrate,
                             included_popularity : card.included_popularity
                         }
            }
        }
        catch (error) {
            console.log(error);
        }
    }
    
    // Get class win rates from HSReplay.net and create object
    async function createClassWinRates() {
        try {
            let request = await fetch('/classRates');
            let data = await request.json();
            
            for (let cardClass in data.series.data) {
                if (classWinRates[cardClass] === undefined)
                    classWinRates[cardClass] = {};
                
                classWinRates[cardClass] = data.series.data[cardClass][1].win_rate;
            }
        }
        catch (error) {
            console.log(error);
        }
    }

    function initEventListeners() {
        document.querySelector('.menu').addEventListener('click', function() {
            document.querySelector('.news-container').style.display = 'none';
        });
        
        document.querySelector('[name="relativeWinRates"]').addEventListener('click', function() {
            settings.relativeWinRates = !settings.relativeWinRates;
            clearCards();
            displayCards();
        });

        document.querySelector('.nav__list-rotation a').addEventListener('click', function() {
            clearStats();
            clearCards();
            clearFilter();
            toggleRotation(this);
        });
        
        document.querySelectorAll('.nav__list-stats a').forEach(e => 
            e.addEventListener('click', function() {
                let type = this.getAttribute('data-json');
                createStatsCardData(type);
                createStatsMenu(type);
                toggleStats(this);
                clearCards();
            }));
            
        document.querySelectorAll('.nav__list-classes a').forEach(e => 
            e.addEventListener('click', function() {
                filter.discover = false;
                createClassCardData(this.getAttribute('data-json'));
                setClass(this);
                clearCards();
                displayCards();
            }));
            
        document.querySelectorAll('.nav__list-classes a:not([data-json="ALL"]):not([data-json="NEUTRAL"])').forEach(e => 
            e.addEventListener('contextmenu', ev => {
                ev.preventDefault();
                
                filter.discover = true;
                createClassCardData(e.getAttribute('data-json'));
                setClass(e);
                clearCards();
                displayCards();
            }));            
            
        document.querySelectorAll('.nav__list-cost a').forEach(e => 
            e.addEventListener('click', function() {
                setCost(parseInt(this.innerHTML), this);
                clearCards();
                displayCards();
            }));
            
        document.querySelectorAll('.nav__list-type a').forEach(e => 
            e.addEventListener('click', function() {
                setType(this.innerHTML.toUpperCase(), this);
                clearCards();
                displayCards();
            }));
            
        document.querySelector('.input-search').addEventListener('input', function() {
            if (!this.validity.tooShort) {
                if (filteredCardData.length === 0) {
                setClass(document.querySelector('[data-json="ALL"]'));
                    createClassCardData('ALL');
                }
                setFilter('search', this.value);
                clearCards();
                displayCards();
            }
        });
        
        document.querySelectorAll('.dropdown').forEach(e => 
            e.addEventListener('click', function() {
                let active = e.classList.contains('active');
                hideActiveDropdowns(e);
                if (!active) {
                    e.classList.add('active');
                    e.querySelector('.dropdown-content').style.display = 'block';
                }
            }));
            
        document.querySelectorAll('.dropdown-content a').forEach(e => 
            e.addEventListener('click', function() {
                let dropdownButton = e.parentNode.previousElementSibling;
                let filterName = dropdownButton.getAttribute('data-name');
                let selected = e.classList.contains('selected');
                
                e.parentNode.querySelector('a.selected').classList.remove('selected');
                
                if (e.innerHTML === 'Any' || selected) {
                    if (filterName === 'special')
                        setFilter('recentlyChanged', false);
                    else setFilter(filterName, '');
                    dropdownButton.classList.remove('selected');
                    dropdownButton.innerHTML = capitalizeFirstLetter(filterName);
                    e.parentNode.querySelector('a').classList.add('selected');
                } else {
                    if (filterName === 'special') {
                        setFilter('recentlyChanged', false);
                        setFilter(e.getAttribute('data-json'), true);
                    }
                    else if (filterName === 'set')
                        setFilter(filterName, e.getAttribute('data-json'));
                    else setFilter(filterName, e.innerHTML.toUpperCase().replace(/ /g,'_'));
                    dropdownButton.classList.add('selected');
                    dropdownButton.innerHTML = e.innerHTML;
                    e.classList.add('selected');
                }
                clearCards();
                displayCards();
            }));
            
        window.onclick = function(e) {
            let dropdown = e.target.parentNode;
            
            if (dropdown.classList === undefined || !dropdown.classList.contains('dropdown'))
                hideActiveDropdowns();
        };
    }
    /*********************************************************
    **********************CARD FUNCTIONS**********************
    *********************************************************/
    // Get card data from Hearthstone API
    async function getCardData() {
        try {
            let request = await fetch('/cardData');
            let arenaCardData = await request.json();
            return arenaCardData;
        }
        catch (error) {
            console.log(error);
        }
    }
    /*********************************************************
    *************************FILTER***************************
    *********************************************************/    
    function setCost(mana, el) {
        if (filter.cost === mana)
            filter.cost = '';
        else filter.cost = mana;
        
        if (deselectList('nav__list-cost') !== el)
            el.classList.toggle('selected');
    }
    
    function setType(type, el) {
        if (filter.type === type)
            filter.type = '';
        else filter.type = type;
        
        if (deselectList('nav__list-type') !== el)
            el.classList.toggle('selected');
    }
    
    function setFilter(type, value) {
        if (filter[type] === value)
            filter[type] = '';
        else filter[type] = value;
    }
    
    function clearFilter() {
        filteredCardData = [];
        
        for (let value in filter)
            filter[value] = '';
        
        deselectList('nav__list-type');
        deselectList('nav__list-cost');
        deselectDropdowns();
        document.querySelector('.input-search').value = '';
    }
    
    function isCardIncluded(card) {
        if (filter.cost !== '') {
            if ((filter.cost !== 10 && card.cost !== filter.cost) || (filter.cost === 10 && card.cost < 10))
                return false;
        }
        if (filter.type !== '') {
            if (filter.type !== 'SECRET' && filter.type !== card.type)
                return false;
            else if (filter.type === 'SECRET' && (card.mechanics === undefined || !card.mechanics.includes('SECRET')))
                return false;
        }
        if (filter.race !== '') {
            if (card.race !== 'ALL') {
                if (filter.race !== 'MECH' && filter.race !== card.race)
                    return false;
                else if (filter.race === 'MECH' && card.race !== 'MECHANICAL')
                    return false;
            }
        }
        if (filter.set !== '') {
            if (filter.set !== card.set)
                return false;
        }
        if (filter.rarity !== '') {
            if (filter.rarity !== card.rarity)
                return false;
        }
        if (filter.school !== '') {
            if (filter.school !== card.spellSchool)
                return false;
        }
        if (filter.keyword !== '') {
            let keyword = filter.keyword;
            let mechanics = card.mechanics;
            let tags = card.referencedTags;
            
            if (keyword === 'SPELL_DAMAGE' && card.spellDamage === undefined)
                return false;
            else if (keyword !== 'SPELL_DAMAGE' &&
                (mechanics === undefined || (mechanics !== undefined && !mechanics.includes(keyword))) &&
                (tags === undefined || (tags !== undefined && !tags.includes(keyword))))
                return false;
        }
        if (filter.search !== '') {
            let search = filter.search.toLowerCase();
            let name = card.name.toLowerCase();
            let text = card.text ? card.text.toLowerCase().replace(/[^\x00-\x7F]/g, ' ').replace(/\s+/g, ' ') : '';
                        
            if (!name.includes(search) && !text.includes(search))
                return false;
        }
        if (filter.recentlyChanged) {
            if (!changedCardsRaw.includes(card.name))
                return false;
        }
        
        return true;
    }
    /*********************************************************
    *************************DISPLAY**************************
    *********************************************************/
    function clearCards() {
        document.querySelector('.card-container').innerHTML = '';
    }
    
    function clearStats() {
        document.querySelector('.menu-stats').innerHTML = '';
    }
    
    function toggleRotation(el) {
        deselectList('nav__list-stats');
        deselectList('nav__list-classes');
        el.classList.add('selected');
        
        document.querySelector('.nav__row-classes').style.display = 'flex';
        document.querySelector('.nav__row-filters').style.display = 'flex';
    }
    
    function toggleStats(el) {
        deselectList('nav__list-rotation');
        deselectList('nav__list-stats');
        el.classList.add('selected');
        
        document.querySelector('.nav__row-classes').style.display = 'none';
        document.querySelector('.nav__row-filters').style.display = 'none';
    }
    
    function setClass(el) {
        deselectList('nav__list-classes');
        el.classList.add('selected');
        
        if (filter.discover)
            el.classList.add('discover');
    }
    
    function deselectList(filterList) {
        let selected = document.querySelector('.' + filterList + ' a.selected');
        if (selected !== null) {
            selected.classList.remove('selected');
            selected.classList.remove('discover');
        }
        
        return selected;
    }
    
    function deselectDropdowns() {
        document.querySelectorAll('.dropdown-content a').forEach(e => {
            let dropdownButton = e.parentNode.previousElementSibling;
            let filterName = dropdownButton.getAttribute('data-name');
                
            dropdownButton.classList.remove('selected');
            dropdownButton.innerHTML = capitalizeFirstLetter(filterName);
                
            e.parentNode.querySelectorAll('a').forEach(e => {
                e.classList.remove('selected');
            });
            
            // Set first option as selected
            e.parentNode.querySelector('a').classList.add('selected');
        });
    }
    
    function hideActiveDropdowns() {
        let dropdown = document.querySelector('.dropdown.active');
        
        if (dropdown !== null) {
            dropdown.classList.remove('active');
            dropdown.querySelector('.dropdown-content').style.display = 'none';
        }
    }
    
    // Cost is only used when displaying odds
    function displayCards(cost) {
        let grid = document.querySelector('.card-container');
        
        // Get rid of vertical gap when viewing odds
        if (cost === undefined && Object.keys(winDraftRates).length !== 0)
            grid.style.gridAutoRows = '240px';
        else grid.style.gridAutoRows = '212px';
        
        // Only load images when they are in the viewport
        const observer = new IntersectionObserver((items, observer) => {
            items.forEach((item) => {
                if(item.isIntersecting) {
                    item.target.setAttribute('src', item.target.getAttribute('data-src'));
                    observer.unobserve(item.target);
                }
            });
        });
        
        for (let card of filteredCardData) {
            if (cost === undefined && !isCardIncluded(card) || cost !== undefined && card.cost !== cost)
                continue;
            
            let cardDiv = createCardDiv(card, cost)
            observer.observe(cardDiv.querySelector('img'));
            grid.appendChild(cardDiv);
        }
    }
    
    // Creates the card div containing the image and win/draft rates
    // If cost is undefined, create the rates bar
    function createCardDiv(card, cost) {
        let div = document.createElement('div');
        let img = document.createElement('img');
        img.setAttribute('data-src', 'https://art.hearthstonejson.com/v1/render/latest/enUS/256x/' +
            card.id + '.png');
        img.setAttribute('alt', card.name);
        img.setAttribute('width', '256');
        img.setAttribute('height', '388');
        div.appendChild(img);
        
        let cardChanged = changedCards[card.dbfId];
        
        // Mark card if changed recently
        if (cardChanged)
            div.classList.add('changed');
        
        if (cost === undefined && Object.keys(winDraftRates).length !== 0)
            div.appendChild(createRatesBar(card, cardChanged));
        
        return div;
    }
    
    // Creates the win/draft rates bar
    function createRatesBar(card, cardChanged) {
        let div = document.createElement('div');
        div.classList.add('card-stats');
        
        let cardStats;
        let currentClass = document.querySelector('.nav__list-classes a.selected').getAttribute('data-json');
        let appliedClass;

        // Make sure multi-class cards get the right data if relevant class is selected
        // TODO: Simplify
        if (card.classes !== undefined && currentClass !== 'ALL')
            appliedClass = currentClass;
        else if (filter.discover && !["ALL","NEUTRAL"].includes(currentClass)) // NEEDED IF ADDING SEPARATE DISCOVER FUNCTION
            appliedClass = currentClass;
        else appliedClass = card.cardClass;
        cardStats = winDraftRates[appliedClass][card.dbfId];
        
        let winRate;
        let draftRate = cardStats ? Math.round(cardStats.included_popularity * 10) / 10 : 'N/A';
        
        if (settings.relativeWinRates && appliedClass !== 'NEUTRAL')
            winRate = cardStats ? Math.round((cardStats.included_winrate - classWinRates[appliedClass]) * 10) / 10 : 'N/A';
        else winRate = cardStats ? Math.round(cardStats.included_winrate * 10) / 10 : 'N/A';
        
        let div2 = document.createElement('div');
        div2.setAttribute('title', 'Deck win rate');
        div2.innerHTML = '';
                
        if (settings.relativeWinRates && appliedClass !== 'NEUTRAL') {
            let sign = winRate >= 0 ? '+' : '';
            div2.innerHTML += sign;
            div2.setAttribute('title', 'Deck win rate (relative to class win rate)');
        }
        
        div2.innerHTML += cardStats ? winRate + '%' : 'N/A';
        
        if (cardChanged) {
            let difference = Math.round((cardStats.included_winrate - cardChanged[appliedClass].winrate) * 10) / 10;
            let sign = difference >= 0 ? '+' : '';
            div2.innerHTML += ' (' + sign + difference + '%)';
        }
        
        if (settings.relativeWinRates && appliedClass !== 'NEUTRAL') {
            if (winRate < -2 )
                div2.classList.add('card-stats--negative');
            else if (winRate >= -2 && winRate < 2 )
                div2.classList.add('card-stats--neutral');
            else if (winRate >= 2)
                div2.classList.add('card-stats--positive');
        } else {
            if (winRate < 49 )
                div2.classList.add('card-stats--negative');
            else if (winRate >= 49 && winRate < 51 )
                div2.classList.add('card-stats--neutral');
            else if (winRate >= 51)
                div2.classList.add('card-stats--positive');
        }
        
        let div3 = document.createElement('div');
        div3.setAttribute('title', 'Draft rate');
        div3.innerHTML = cardStats ? draftRate + '%' : 'N/A';
        if (draftRate < 10 )
            div3.classList.add('card-stats--negative');
        else if (draftRate >= 10 && draftRate < 30 )
            div3.classList.add('card-stats--neutral');
        else if (draftRate >= 30)
            div3.classList.add('card-stats--positive');
        
        div.appendChild(div2);
        div.appendChild(div3);
        
        return div;
    }
    
    // Creates the stats menu used for averages/odds
    function createStatsMenu(type) {
        let ul = document.querySelector('.menu-stats');
        ul.innerHTML = '';
        
        for (let cost in totalStats) {
            let li = document.createElement('li');
            let a = document.createElement('a');
            let div = document.createElement('div');
            div.innerHTML = cost;
            div.classList.add('menu-stats__cost');
            let div2 = document.createElement('div');
            let div3 = document.createElement('div');
            
            if (type !== 'AVERAGE') {
                div2.innerHTML = ((totalStats[cost].minions / totalMinions[cost]) * 100).toFixed(1) + '%';
                div3.innerHTML = '<img src="images/attack.png">' + (totalStats[cost].attack / totalStats[cost].minions).toFixed(1) +
                                 '<img src="images/health.png">' + (totalStats[cost].health / totalStats[cost].minions).toFixed(1);
            }
            else div2.innerHTML = '<img src="images/attack.png">' + (totalStats[cost].attack / totalMinions[cost]).toFixed(1) +
                                  '<img src="images/health.png">' + (totalStats[cost].health / totalMinions[cost]).toFixed(1);
            
            a.appendChild(div);
            a.appendChild(div2);
            if (type !== 'AVERAGE')
                a.appendChild(div3);
            li.appendChild(a);
            ul.appendChild(li);
            
            li.addEventListener('click', function() {
                deselectList('menu-stats');
                a.classList.add('selected');
                clearCards();
                displayCards(parseInt(this.querySelector('div').innerHTML));
            });
        }
    }
    /*********************************************************
    **********************HTML TEMPLATES**********************
    *********************************************************/
    function displayMain() {
        document.querySelector('.version').style.opacity = '1';
        
        createWinDraftRates().then(() => {
            createClassWinRates().then(() => {
                let template = document.getElementById('template-stats').innerHTML;
                document.querySelector('.container').innerHTML = template;
                createArenaCardData();
                initEventListeners();
                //generateChangedCards();
            });
        });
    }
    /*********************************************************
    ***********************MAIN FUNCTION**********************
    *********************************************************/
    return {
        init: function() {
            //console.log(JSON.stringify(localStorage).length);
            // Check for HTML5 storage support
            if (typeof(Storage) !== 'undefined') {
                // If first visit or new version
                if (localStorage.getItem('version') != version) {
                        getCardData().then((data) => {
                            cardData = data;
                            localStorage.setItem('cardData', JSON.stringify(cardData));
                            localStorage.setItem('version', version);
                            displayMain();
                            document.querySelector('.version').style.transition = 'opacity 2s';
                        });
                }
                else {
                    cardData = JSON.parse(localStorage.getItem('cardData'));
                    displayMain();
                }
            }
        }
    };
})();
window.onload = HSArenaInfo.init();