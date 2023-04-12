"use strict";

const express = require('express');
const path = require('path');
const fetch = require('node-fetch');
const favicon = require('serve-favicon')
const app = express();

const port = process.env.PORT || 3000;

app.use("/css",  express.static(__dirname + '/css'));
app.use("/js", express.static(__dirname + '/js'));
app.use("/images",  express.static(__dirname + '/images'));
//app.use(favicon(path.join(__dirname, 'images', 'favicon.ico')))

app.get('/', function(req, res) {
	res.sendFile(path.join(__dirname + '/index.html'));
});

app.get("/cardData", function(req, res) {
	const url = "https://api.hearthstonejson.com/v1/latest/enUS/cards.collectible.json";

    fetch(url)
        .then(res => res.json())
        .then(data => res.send(data));
});

app.get("/cardRates", function(req, res) {
	const url = "https://hsreplay.net/analytics/query/card_list_free/?GameType=ARENA&TimeRange=LAST_14_DAYS";

    fetch(url)
        .then(res => res.json())
        .then(data => res.send(data));
});

app.get("/classRates", function(req, res) {
	const url = "https://hsreplay.net/analytics/query/player_class_performance_summary/";

    fetch(url)
        .then(res => res.json())
        .then(data => res.send(data));
});

app.listen(port);

console.log('Server started.');

exports = module.exports = app;