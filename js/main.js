/*  main.js
    Hearthstone Arena Info
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
    
    let version = 0.1;
    
    // Filter for when browsing all arena cards
    let filter = {
        cost: '',
        type: '',
        tribe: '',
        keyword: ''
    };

    const rotation = ['CORE', 'EXPERT1', 'DEMON_HUNTER_INITIATE', 'KARA',
                      'UNGORO', 'BOOMSDAY', 'BLACK_TEMPLE', 'SCHOLOMANCE', 'DARKMOON_FAIRE'];
    
    /*      'CORE': setsEnum.basic,
            'EXPERT1': setsEnum.classic,
            'DEMON_HUNTER_INITIATE': setsEnum.dh,
            'HOF': setsEnum.hof,
            'NAXX': setsEnum.naxxramas,
            'GVG': setsEnum.gvg,
            'BRM': setsEnum.blackrock,
            'TGT': setsEnum.tgt,
            'LOE': setsEnum.loe,
            'OG': setsEnum.wotog,
            'KARA': setsEnum.onik,
            'GANGS': setsEnum.msog,
            'UNGORO': setsEnum.ungoro,
            'ICECROWN': setsEnum.kotft,
            'LOOTAPALOOZA': setsEnum.kobolds,
            'GILNEAS': setsEnum.witchwood,
            'BOOMSDAY': setsEnum.boomsday,
            'TROLL': setsEnum.rastakhan,
            'DALARAN': setsEnum.ros,
            'ULDUM': setsEnum.uldum,
            'DRAGONS': setsEnum.dragons,
            'YEAR_OF_THE_DRAGON': setsEnum.galakrond,
            'BLACK_TEMPLE': setsEnum.outland,
            'SCHOLOMANCE': setsEnum.scholomance,
            'DARKMOON_FAIRE': setsEnum.darkmoon */
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
                    totalStats[card.cost] = 0;
                totalStats[card.cost]++;
            } else continue;

            filteredCardData.push(card);
        }
    }
    
    // Event listeners for menu buttons
    function initEventListeners() {
        document.querySelectorAll('.nav__list-classes a').forEach(e => 
            e.addEventListener('click', function() {
                createClassCardData(this.getAttribute('data-json'));
                displayCards();
            }));
            
        document.querySelectorAll('.mana-bar a').forEach(e => 
            e.addEventListener('click', function() {
                toggleCost(parseInt(this.innerHTML), this);
                displayCards();
            }));
            
        document.querySelectorAll('.nav__list-stats a').forEach(e => 
            e.addEventListener('click', function() {
                let type = this.innerHTML.toUpperCase();
                createfilteredCardData(type);
                createStatsMenu(type);
                // CLEAR CARDS displayCards();
            }));
    }
    /*********************************************************
    **********************LOCAL STORAGE***********************
    *********************************************************/

    /*********************************************************
    **********************CARD FUNCTIONS**********************
    *********************************************************/
    const url = 'https://api.hearthstonejson.com/v1/latest/enUS/cards.collectible.json';
    
    // Get card data from Hearthstone API
    async function getCardData() {
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
    function toggleCost(mana, el) {
        if (filter.cost === mana)
            filter.cost = '';
        else filter.cost = mana;
        
        let selected = document.querySelector('.mana-bar a.selected');
        if (selected !== null && selected !== el)
            selected.classList.remove('selected');
        
        el.classList.toggle('selected');
    }
    
    function isCardIncluded(card) {
        return (filter.cost === '' ? true : filter.cost === 10 ? card.cost >= 10 : card.cost === filter.cost);
    }
    /*********************************************************
    *************************DISPLAY**************************
    *********************************************************/
    function displayCards(cost) {
        let grid = document.querySelector('.card-container');
        grid.innerHTML = '';
        
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
        //img.setAttribute('src', 'https://art.hearthstonejson.com/v1/render/latest/enUS/256x/' + averagearenaCardData[card].id + '.png');
        img.setAttribute('src', 'images/' + card.id + '.png');
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
            let div2 = document.createElement('div');
            
            if (type !== 'AVERAGE')
                div2.innerHTML = ((totalStats[cost] / totalMinions[cost]) * 100).toFixed(1) + '%';
            else div2.innerHTML = '<img src="attack.png">' + (totalStats[cost].attack / totalMinions[cost]).toFixed(1) +
                                 ' <img src="health.png">' + (totalStats[cost].health / totalMinions[cost]).toFixed(1);
            
            a.appendChild(div);
            a.appendChild(div2);
            li.appendChild(a);
            ul.appendChild(li);
            
            li.addEventListener('click', function() { displayCards(parseInt(this.querySelector('div').innerHTML)); });
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
    }    
    /*********************************************************
    ************************COLLECTION************************
    *********************************************************/

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
                        });
                }
                else cardData = JSON.parse(localStorage.getItem('cardData'));
                
                displayMain();
            }
        }
    };
})();
window.onload = HSArenaInfo.init();