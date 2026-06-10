$(document).ready(function() {
	let url = new URL(window.location.href);
	let seed = url.searchParams.get("seed");
	if (seed) {
		$("#intro-screen").addClass("wants-to-play-seed");
		$("#seed-input").val(seed);
		$("#intro-scroll-container").scrollTop($(document).height());
	}

	$("#logo").load("img/logo/logo.svg", function() {
		$(this).contents().unwrap();
	});
});


// Game data
var Game;
class PlateGame {
	totalTime = 60;
	tiltExtreme = 1.5;

	constructor(kind, seedInput) {
		this.kind = kind;

		this.startTime = new Date();
		if (seedInput) {
			this.seedInput = seedInput;
			this.seed = new Math.seedrandom(seedInput);
		} else {
			let daysSinceEpoch = Math.floor(this.startTime / 86400000);
			this.seedInput = daysSinceEpoch;
			this.seed = new Math.seedrandom(daysSinceEpoch);
		}

		this.plateRNG = this.seed();
		this.wordRNG = this.seed();
		this.letter2RNG = this.seed();
		this.numRNG = this.seed();

		this.plate = plateList[Math.floor(this.plateRNG * plateList.length)];
		this.word = wordList[Math.floor(this.wordRNG * wordList.length)];

		this.letter1 = this.word.slice(0, 1);
		let wordMiddle = this.word.slice(1, -1);
		this.letter2 = wordMiddle.charAt(Math.floor(this.letter2RNG * wordMiddle.length));
		this.letter3 = this.word.slice(-1);
		this.alphaString = (this.letter1 + this.letter2 + this.letter3).toUpperCase();
		this.numString = Math.floor(this.numRNG * (10 ** this.plate.text.digits)).toString().padStart(this.plate.text.digits, "0");
		this.plateNumber = this.alphaString + this.numString;

		this.correctGuesses = [];
		this.score = 0;
		this.timeLeft = this.totalTime;
		this.timer = null;
	}

	startTimer() {
		this.timer = setInterval(() => {
			if (this.timeLeft > 1) {
				this.timeLeft--;
				$(".time-left").html(this.timeLeft);
			} else {
				$(".time-left").html("0");
				this.destroyTimer();
				wrapup();
			}
		}, 1000);
	}

	destroyTimer() {
		clearInterval(this.timer);
		this.timer = null;
	}
}

function initGameScreen() {
	// Big text
	$(".current-score").html(0);
	$(".time-left").html(Game.totalTime);

	$("#plate-background").attr("src", "img/plates/" + Game.plate.state + ".svg");

	// Apply CSS styles to plate
	$("#plate-number").css({
		"font-size": `calc(${Game.plate.text.size} * var(--plate-height))`,
		"margin-top": `calc(${Game.plate.text.offset} * var(--plate-height))`,
		"color": Game.plate.text.color
	});

	// Display letters and numbers onto plate
	$("#plate-chars1").html((Game.plate.text.reverse) ? Game.numString : Game.alphaString);
	$("#plate-chars2").html((Game.plate.text.reverse) ? Game.alphaString : Game.numString);

	// If plate has specified divider
	if (Game.plate.divider.svg) {
		$("#plate-divider").attr("src", "img/dividers/" + Game.plate.state + ".svg");
		$("#plate-divider").css({
			"height": `calc(${Game.plate.divider.width} * var(--plate-height))`,
			"margin-left": `calc(${Game.plate.divider.margin} * var(--plate-height))`,
			"margin-right": `calc(${Game.plate.divider.margin} * var(--plate-height))`
		});
	} else {
		$("#plate-divider").attr("src", "");
		$("#plate-divider").css({
			"height": "0",
			"margin-left": `calc(${Game.plate.divider.width / 2} * var(--plate-height))`,
			"margin-right": `calc(${Game.plate.divider.width / 2} * var(--plate-height))`
		});
	}

	// Randomly tilt plate
	let tilt = Math.floor(Math.random() * Game.tiltExtreme) + 1;
		tilt *= Math.round(Math.random()) ? 1 : -1;
	$("#license-plate").css("transform", "rotate(" + tilt + "deg)")
}

function waitForImg(img) {
	return new Promise(resolve => {
		if (img.complete) {
			resolve();
		} else {
			img.addEventListener("load", resolve, { once: true });
		}
	});
}

function wrapup() {
	$("#word-input").blur();

	let endMsg = "";
	if (Game.score >= 100) endMsg = "The DMV fears you";
	else if (Game.score >= 30) endMsg = "Nice drivin' kid!";
	else endMsg = "Keep drivin' kid";
	$("#end-title div").html(endMsg);

	$("#end-summary-num-words").html(Game.correctGuesses.length);
	$("#end-summary-score").html(Game.score);

	$("#end-correct-guesses").html(Game.correctGuesses.join("<br>"));

	changeScreen("end");
}

function resetIntroScreen() {
	$("#intro-screen").removeClass("wants-to-play-seed");
	$("#seed-input").val("");

	// Remove seed from URL
	const url = new URL(window.location.href);
	url.searchParams.delete("seed");
	history.replaceState(null, "", url.toString());
}


// Seed input
$("#seed-input").on("propertychange input", function() {
	let strictAscii = $(this).val().replace(/['"\x80-\uFFFF]/g, "");
	$(this).val(strictAscii);
});


// Submit word
function submitWord() {
	var wordInput = $("#word-input").val();

	// Check if entered word matches letters
	let alreadyGuessedCheck = Game.correctGuesses.includes(wordInput);
	let realWordCheck = wordList.includes(wordInput);
	let firstLetterCheck = wordInput.slice(0, 1) == Game.letter1;
	let middleLetterCheck = (wordInput.slice(1, -1)).includes(Game.letter2);
	let lastLetterCheck = wordInput.slice(-1) == Game.letter3;

	if (alreadyGuessedCheck) {
		let wrongDiv = $(`<div class="wrong-message">Already guessed!</div>`);
		addScoreMsg(wrongDiv);
	} else if (!realWordCheck || !(firstLetterCheck && middleLetterCheck && lastLetterCheck)) {
		let wrongDiv = $(`<div class="wrong-message">Invalid word!</div>`);
		addScoreMsg(wrongDiv);
	} else {
		Game.correctGuesses.push(wordInput);
		Game.score += wordInput.length;
		$(".current-score").html(Game.score);

		let pointsDiv = $(`<div class="points-message">+${wordInput.length} points!</div>`);
		addScoreMsg(pointsDiv);

		$("#word-input").val("");
		$("#word-input").focus();
	}
}


// Animate score message in score container
function addScoreMsg(el) {
	let fontSize = parseFloat($("#score-container").css("--font-size"));
	el.appendTo($("#score-container")).animate({
		"display": "none",
		"opacity": 0,
		"margin-top": (fontSize * 2.8).toString() + "rem"
	}, 500);
}


// Buttons
$("#today-intro-btn").click(function() {
	// New game backend
	Game = new PlateGame("daily");

	// New game frontend
	initGameScreen();
	changeScreen("loading");
	Promise.all([
		waitForImg(document.getElementById("plate-background")),
		waitForImg(document.getElementById("plate-divider"))
	]).then(() => {
		Game.startTimer();
		$("#word-input").focus();
		changeScreen("game");
	});
});

$("#seed-intro-btn").click(function() {
	$("#intro-screen").addClass("wants-to-play-seed");
	$("#seed-input").val("");
	$("#seed-input").focus();
});

$("#back-btn").click(function() {
	resetIntroScreen();
});

$("#play-seed-btn").click(function() {
	if ($("#seed-input").val().length > 0) {
		// New game backend
		let customSeedInput = $("#seed-input").val();
		Game = new PlateGame("seeded", customSeedInput);

		// Embed seed in URL
		let url = new URL(window.location.href);
		url.searchParams.set("seed", customSeedInput);
		history.replaceState(null, "", url.toString());

		// New game frontend
		initGameScreen();
		changeScreen("loading");
		Promise.all([
			waitForImg(document.getElementById("plate-background")),
			waitForImg(document.getElementById("plate-divider"))
		]).then(() => {
			Game.startTimer();
			$("#word-input").focus();
			changeScreen("game");
		});
	}
});

$("#submit-btn").click(() => submitWord());

$("#cancel-circle-btn").click(function() {
	Game.destroyTimer();
	resetIntroScreen();
	changeScreen("intro");
});

$("#play-again-btn").click(function() {
	resetIntroScreen();
	changeScreen("intro");
});

var copyResultsTimeout;
var copyBtnHtml = $("#share-btn").html();
$("#copy-results-btn").click(function() {
	let $this = $(this);
	let kind = (Game.kind == "daily") ? "Today's" : "Seeded";

	let formattedDate = `${Game.startTime.getFullYear()}/${String(Game.startTime.getMonth() + 1).padStart(2, "0")}/${String(Game.startTime.getDate()).padStart(2, "0")}`;
	let descriptor = (Game.kind == "daily") ?  `📅 ${formattedDate}` : `🌱 "${Game.seedInput}"`;

	navigator.clipboard.writeText(`${kind} Plate Game
${descriptor} → [ ${Game.plateNumber} ]
Found ${Game.correctGuesses.length} word${(Game.correctGuesses.length == 1) ? "" : "s"}
Scored ${Game.score} point${(Game.score == 1) ? "" : "s"}`);
	
	$this.html("Results Copied!");
	clearTimeout(copyResultsTimeout);
	copyResultsTimeout = setTimeout(function() {
		$this.html(`<i class="fa-regular fa-clipboard"></i>Copy Results`);
	}, 1000);
});

var copyLinkTimeout;
var shareBtnHtml = $("#share-btn").html();
$("#share-btn").click(function() {
	let $this = $(this);

	let url = new URL(window.location.href);
	navigator.clipboard.writeText(url);
	
	$this.html("Link Copied!");
	clearTimeout(copyLinkTimeout);
	copyLinkTimeout = setTimeout(function() {
		$this.html(shareBtnHtml);
	}, 1000);
});


// Keyboard controls
$(document).keydown(function(e) {
	if (e.keyCode === 13) {
		let currentInput = $(document.activeElement).attr("id");
		if (currentInput == "seed-input") $("#play-seed-btn").click();
		else if (currentInput == "word-input") submitWord();
	}
});
