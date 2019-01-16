const express = require("express"),
	request = require("request"),
	cheerio = require("cheerio"),
	mailurl = "https://hiverhq.com/",
	app = express();

app.get("/heartbeat", function (req, res) {
	res.json({ message: "Server is working fine." });
})


app.get("/scrape", function (req, res) {
	var mainWords = {},
		urlArray = [];

	request(mailurl, function (error, response, body) {
		if (error) {
			res.status(500).json({ message: "Internal server error." });
			return;
		}

		// load the page into cheerio
		var $page = cheerio.load(body),
			text = $page("body").text();

		// throw away extra whitespace and non-alphanumeric characters
		text = text.replace(/\s+/g, " ")
			.replace(/[^a-zA-Z ]/g, "")
			.toLowerCase();

		// split on spaces for a list of all the words on that page and 
		// loop through that list
		text.split(" ").forEach(function (word) {
			// we don't want to include very short or long words, as they're 
			// probably bad data
			if (word.length < 4 || word.length > 20) {
				return;
			}

			if (mainWords[word]) {
				// if this word is already in our "mainWords", our collection
				// of terms, increase the count by one
				mainWords[word]++;
			} else {
				// otherwise, say that we've found one of that word so far
				mainWords[word] = 1;
			}
		});

		// and when our request is completed, call the callback to wrap up!
		createArrayFromObject();
	});


	function createArrayFromObject() {

		var wordArray = [];

		// stick all words in an array
		for (key in mainWords) {
			wordArray.push({
				word: key,
				count: mainWords[key]
			});
		}

		// sort array based on how often they occur
		wordArray.sort(function (a, b) {
			return b.count - a.count;
		});

		// finally, log the first fifty most popular words
		wordArray = wordArray.slice(0, 5);

		res.json(wordArray)
	}

})


const port = 3000;
app.listen(port);

console.log("Node server is running on port:", port);