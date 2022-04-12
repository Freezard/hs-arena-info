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
    let winDraftRates = {};
    
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
        school: '',
        search: '',
        discover: false
    };

    const version = 1.1;
    const rotation = ['CORE', 'LOE', 'OG', 'TGT', 'STORMWIND', 'ALTERAC_VALLEY', 'THE_SUNKEN_CITY'];
    
    /*  CORE,NAXX,GVG,BRM,TGT,LOE,OG,KARA,GANGS:gadgetzan,UNGORO,ICECROWN:kotft,LOOTAPALOOZA:kobolds,
        GILNEAS:witchwood,BOOMSDAY,TROLL:rastakhan,DALARAN:ros,ULDUM,DRAGONS,YEAR_OF_THE_DRAGON:galakrond,
        BLACK_TEMPLE:outland,SCHOLOMANCE,DARKMOON_FAIRE,THE_BARRENS,STORMWIND,ALTERAC_VALLEY,THE_SUNKEN_CITY
    */
    /*********************************************************
    **************************UTILS***************************
    *********************************************************/
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    /*********************************************************
    **************************INIT****************************
    *********************************************************/
    // Create arena only data and sort it by cost
    function createArenaCardData() {
        arenaCardData = cardData.filter(card => 
            rotation.includes(card.set) && !card.id.includes('HERO'));
        
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
        
        for (let c in arenaCardData) {
            let card = arenaCardData[c];

            if (card.type !== 'MINION')
                continue;

            if (totalMinions[card.cost] === undefined)
                totalMinions[card.cost] = 0;
            totalMinions[card.cost]++;
            
            if (type === 'AVERAGE') {
                if (totalStats[card.cost] === undefined)
                    totalStats[card.cost] = { attack: 0, health: 0 };
                totalStats[card.cost].attack += card.attack;
                totalStats[card.cost].health += card.health;
            } else if (card.mechanics !== undefined) {
                if ((!any.some(x => card.mechanics.indexOf(x) >= 0 && all.every(x => card.mechanics.indexOf(x) >= 0))))
                    continue;
                else if (card.text !== undefined && card.text.startsWith('<b>Dormant</b>')) // Also add can't attack?
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
            
            for (let HSClass in data.series.data) {
                if (winDraftRates[HSClass] === undefined)
                    if (HSClass === 'ALL')
                        winDraftRates.NEUTRAL = {};
                    else winDraftRates[HSClass] = {};
                
                for (let card of data.series.data[HSClass])
                    if (HSClass === 'ALL')
                        winDraftRates.NEUTRAL[card.dbf_id] =
                        {
                            included_winrate : card.included_winrate,
                            included_popularity : card.included_popularity
                        }
                    else winDraftRates[HSClass][card.dbf_id] =
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

    function initEventListeners() {
        document.querySelector('.menu').addEventListener('click', function() {
            document.querySelector('.news-container').style.display = 'none';
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
                    setFilter(filterName, '');
                    dropdownButton.classList.remove('selected');
                    dropdownButton.innerHTML = capitalizeFirstLetter(filterName);
                    e.parentNode.querySelector('a').classList.add('selected');
                } else {
                    setFilter(filterName, e.innerHTML.toUpperCase().replace(/ /g,'_'));
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
    **********************LOCAL STORAGE***********************
    *********************************************************/

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
            else if (filter.type === 'SECRET' && (card.text === undefined || !card.text.startsWith('<b>Secret:</b>')))
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
            grid.style.gridAutoRows = '242px';
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
        
        if (cost === undefined && Object.keys(winDraftRates).length !== 0)
            div.appendChild(createRatesBar(card));
        
        return div;
    }
    
    // Creates the win/draft rates bar
    function createRatesBar(card) {
        let div = document.createElement('div');
        div.classList.add('card-stats');
        
        let cardStats;
        let currentClass = document.querySelector('.nav__list-classes a.selected').getAttribute('data-json');

        // Make sure multi-class cards get the right data if relevant class is selected
        if (card.classes !== undefined && currentClass !== 'ALL')
            cardStats = winDraftRates[currentClass][card.dbfId];
        else if (filter.discover && !["ALL","NEUTRAL"].includes(currentClass)) // NEEDED IF ADDING SEPARATE DISCOVER FUNCTION
            cardStats = winDraftRates[currentClass][card.dbfId];
        else cardStats = winDraftRates[card.cardClass][card.dbfId];
        
        let winRate = cardStats ? Math.round(cardStats.included_winrate * 10) / 10 : 'N/A';
        let draftRate = cardStats ? Math.round(cardStats.included_popularity * 10) / 10 : 'N/A';
        
        let div2 = document.createElement('div');
        div2.setAttribute('title', 'Deck win rate');
        div2.innerHTML = cardStats ? winRate + '%' : 'N/A';
        if (winRate < 49 )
            div2.classList.add('card-stats--negative');
        else if (winRate >= 49 && winRate < 51 )
            div2.classList.add('card-stats--neutral');
        else if (winRate >= 51)
            div2.classList.add('card-stats--positive');
        
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
            let template = document.getElementById('template-stats').innerHTML;
            document.querySelector('.container').innerHTML = template;
            createArenaCardData();
            initEventListeners();
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