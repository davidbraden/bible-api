var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var raml2html = require('raml2html');
var path = require('path');

var VERSE_REGEX = /(\d+)\s(.*)/;

var configWithDefaultTemplates = raml2html.getDefaultConfig();
var router = express.Router();

router.get('/passage/:translation/:book/:chapter', function(req, res, next) {
	var translation = req.params.translation;
	var book = req.params.book;
	var chapter = req.params.chapter;


	var biblegatewayUrl = 'https://www.biblegateway.com/passage/?search=' + book + '+' + chapter + '&version=' + translation;
	request(biblegatewayUrl, function(error, response, body) {

		if (error) {
			res.status(500);
			res.send('Error calling bible gateway: ' + error);
		} else {
			$ = cheerio.load(body);
			var verse = {
				verse: 0,
				lines: []
			};
			var verses = $('.passage-text .text').map(function(i, el) {
				var text = $(el).text();
				var isPoetry = $(el).parents('.poetry').length > 0;
				var match = VERSE_REGEX.exec(text);
				if (match) {
					verse = {
						verse: verse.verse + 1,
						lines: [{
							text: match[2],
							indented: isPoetry,
						}]
					};
					return verse;
				} else {
					verse.lines.push({
						text: text,
						indented: isPoetry,
					});
					return;
				}
			}).get();

			var json = {
				translation: translation,
				book: book,
				chapter: chapter,
				verses: verses
			};
			res.json(json);
		}
	});
});


router.get('/docs', function(req, res, next) {
	var ramlFile = path.join(__dirname, '..', 'docs.raml');
	raml2html.render(ramlFile, configWithDefaultTemplates).then(function(result) {
		res.send(result);
	}, function(error) {
			res.status(500);
			res.send('Error generating docs: ' + error);
	});
});

module.exports = router;