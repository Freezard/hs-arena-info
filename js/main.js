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
    const changedCards = {"76984":{"NEUTRAL":{"winrate":55.81,"draftrate":2.27},"DEMONHUNTER":{"winrate":58.42,"draftrate":2.57},"DRUID":{"winrate":47.7,"draftrate":2.34},"HUNTER":{"winrate":51.7,"draftrate":2.13},"MAGE":{"winrate":57.39,"draftrate":2.29},"PALADIN":{"winrate":58.78,"draftrate":2.14},"PRIEST":{"winrate":53.73,"draftrate":2.3},"ROGUE":{"winrate":53.27,"draftrate":2.85},"SHAMAN":{"winrate":54.22,"draftrate":1.99},"WARLOCK":{"winrate":56.93,"draftrate":2.21},"WARRIOR":{"winrate":47.65,"draftrate":2.05}},"78412":{"NEUTRAL":{"winrate":56.77,"draftrate":1.47},"HUNTER":{"winrate":56.77,"draftrate":23.69}},"78416":{"NEUTRAL":{"winrate":58.7,"draftrate":0.65},"HUNTER":{"winrate":58.7,"draftrate":10.56}},"78419":{"NEUTRAL":{"winrate":60.74,"draftrate":0.32},"HUNTER":{"winrate":60.74,"draftrate":5.3}},"78420":{"NEUTRAL":{"winrate":55,"draftrate":0.65},"HUNTER":{"winrate":55,"draftrate":10.52}}};
    // List of changed cards by name, used by function generateChangedCards
    const changedCardsRaw = ['Theotar, the Mad Duke', 'Spirit Poacher', 'Stag Charge', 'Wild Spirits', "Ara'lon"];
    
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

    const version = 1.22;
    const rotation = ['CORE', 'BRM', 'UNGORO', 'LOOTAPALOOZA', 'DALARAN', 'BLACK_TEMPLE', 'REVENDRETH'];
    const sets = {
        CORE: 'Core',
        NAXX: 'Naxxramas',
        GVG: 'GvG',
        BRM: 'Blackrock',
        TGT: 'TGT',
        LOE: 'LoE',
        OG: 'Core',
        KARA: 'Karazhan',
        GANGS: 'Gadgetzan',
        UNGORO: 'Un\'Goro',
        ICECROWN: 'Frozen Throne',
        LOOTAPALOOZA: 'Kobolds',
        GILNEAS: 'Witchwood',
        TAVERNS_OF_TIME: 'Taverns',
        BOOMSDAY: 'Boomsday',
        TROLL: 'Rastakhan',
        DALARAN: 'Rise of Shadows',
        ULDUM: 'Uldum',
        DRAGONS: 'Dragons',
        YEAR_OF_THE_DRAGON: 'Galakrond',
        BLACK_TEMPLE: 'Outland',
        SCHOLOMANCE: 'Scholomance',
        DARKMOON_FAIRE: 'Darkmoon',
        THE_BARRENS: 'Barrens',
        STORMWIND: 'Stormwind',
        ALTERAC_VALLEY: 'Alterac',
        THE_SUNKEN_CITY: 'Sunken',
        REVENDRETH: 'Nathria',
    }
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

            if (card.type !== 'MINION' || card.set === 'TAVERNS_OF_TIME')
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
        
        if (cardChanged && cardStats !== undefined) {
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