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
    let filteredCardData; // Arena data filtered by class/mechanic
    
    // Used for calculating stats/odds
    let totalStats;
    let totalMinions;
    
    // Filter for when browsing all arena cards
    let filter = {
        cost: '',
        type: '',
        tribe: '',
        keyword: '',
        search: ''
    };

    const version = 0.3;
    const rotation = ['CORE', 'GANGS', 'UNGORO', 'ICECROWN', 'DALARAN', 'BLACK_TEMPLE', 'STORMWIND'];
    
    /*  CORE,NAXX,GVG,BRM,TGT,LOE,OG,KARA,GANGS:gadgetzan,UNGORO,ICECROWN:kotft,LOOTAPALOOZA:kobolds,
        GILNEAS:witchwood,BOOMSDAY,TROLL:rastakhan,DALARAN:ros,ULDUM,DRAGONS,YEAR_OF_THE_DRAGON:galakrond,
        BLACK_TEMPLE:outland,SCHOLOMANCE,DARKMOON_FAIRE,THE_BARRENS,STORMWIND
    */
    /*********************************************************
    **************************UTILS***************************
    *********************************************************/
    
    /*********************************************************
    **************************INIT****************************
    *********************************************************/
    // Create arena only data and sort it by cost
    function createArenaCardData() {
        for (let c in cardData) {
            let card = cardData[c];
            
            if (rotation.includes(card.set) && !card.id.includes('HERO'))
                arenaCardData.push(card);
        }
        
        arenaCardData.sort(function(a, b) {
                return a.cost === b.cost ?
                       a.name.localeCompare(b.name) :
                       a.cost - b.cost;
        });
    }
    
    // Create class data used when viewing all arena cards
    function createClassCardData(cardClass) {
        filteredCardData = [];
        
        for (let c in arenaCardData) {
            let card = arenaCardData[c];
            
            if (cardClass === 'ALL' ||
               (card.cardClass === cardClass && card.classes === undefined) ||
               (card.classes !== undefined && card.classes.includes(cardClass)))
                filteredCardData.push(card);
        }
    }
    
    // Create filtered data used when viewing stats
    // type = AVERAGE or any mechanic (TAUNT, RUSH etc)
    function createfilteredCardData(type) {
        filteredCardData = [];
        totalStats = {};
        totalMinions = {};
        
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
            } else if (card.mechanics !== undefined && card.mechanics.includes(type)) {
                if (totalStats[card.cost] === undefined)
                    totalStats[card.cost] = { attack: 0, health: 0, minions: 0 };
                totalStats[card.cost].attack += card.attack;
                totalStats[card.cost].health += card.health;
                totalStats[card.cost].minions++;
            } else continue;

            filteredCardData.push(card);
        }
    }
    
    // Menu event listeners
    function initEventListeners() {
        document.querySelector('.nav__list-rotation a').addEventListener('click', function() {
            clearStats();
            clearCards();
            clearFilter();
            toggleRotation(this);
        });
        
        document.querySelectorAll('.nav__list-stats a').forEach(e => 
            e.addEventListener('click', function() {
                let type = this.innerHTML.split(' ')[0].toUpperCase();
                createfilteredCardData(type);
                createStatsMenu(type);
                toggleStats(this);
                clearCards();
            }));
            
        document.querySelectorAll('.nav__list-classes a').forEach(e => 
            e.addEventListener('click', function() {
                createClassCardData(this.getAttribute('data-json'));
                setClass(this);
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
                setSearch(this.value);
                clearCards();
                displayCards();
            }
        });
    }
    /*********************************************************
    **********************LOCAL STORAGE***********************
    *********************************************************/

    /*********************************************************
    **********************CARD FUNCTIONS**********************
    *********************************************************/
    // Get card data from Hearthstone API
    async function getCardData() {
        const url = 'https://api.hearthstonejson.com/v1/latest/enUS/cards.collectible.json';
        
        try {
            let request = await fetch(url);
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
    
    function setSearch(input) {
        filter.search = input;
    }
    
    function clearFilter() {
        filteredCardData = [];
        
        filter = {
                cost: '',
                type: '',
                tribe: '',
                keyword: '',
                search: ''
        };
        
        deselectList('nav__list-type');
        deselectList('nav__list-cost');
    }    
    
    function isCardIncluded(card) {
        if (filter.cost !== '') {
            if ((filter.cost !== 10 && card.cost !== filter.cost) || (filter.cost === 10 && card.cost < 10))
                return false;
        }
        if (filter.type !== '') {
            if (filter.type !== card.type)
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
        document.querySelector('.input-search').value = '';
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
    }
    
    function deselectList(filterList) {
        let selected = document.querySelector('.' + filterList + ' a.selected');
        if (selected !== null)
            selected.classList.remove('selected');
        
        return selected;
    }
    
    function displayCards(cost) {
        let grid = document.querySelector('.card-container');
        
        for (let c in filteredCardData) {
            let card = filteredCardData[c];
            
            if (cost === undefined && !isCardIncluded(card))
                continue;
            else if (cost !== undefined && card.cost !== cost)
                continue;
            
            grid.appendChild(createCardImage(card));
        }
    }
    
    function createCardImage(card) {
        let div = document.createElement('div');
        let img = document.createElement('img');
        /*img.setAttribute('src', 'https://art.hearthstonejson.com/v1/render/latest/enUS/256x/' +
            averagearenaCardData[card].id + '.png');*/
        img.setAttribute('src', 'images-cards/' + card.id + '.png');
        img.setAttribute('alt', card.name);
        img.setAttribute('width', '256');
        img.setAttribute('height', '387');
        img.setAttribute('loading', 'lazy');
        div.appendChild(img);
        
        return div;
    }
    
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
                clearCards();
                displayCards(parseInt(this.querySelector('div').innerHTML));
            });
        }
    }
    /*********************************************************
    **********************HTML TEMPLATES**********************
    *********************************************************/
    function displayMain() {
        let template = document.getElementById('template-stats').innerHTML;
        document.querySelector('.container').innerHTML = template;
        
        createArenaCardData();
        initEventListeners();
        document.querySelector('.version').style.opacity = '1';
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