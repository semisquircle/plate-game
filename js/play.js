// Game data
class PlateGame {
	constructor(kind, seed) {
		this.kind = kind;
		this.seed = seed(seed);

		this.word = wordList[Math.floor(this.seed * wordList.length)];
		this.plate = plateList[Math.floor(this.seed * plateList.length)];

		this.letter1 = this.word.slice(0, 1);
		let wordMiddle = this.word.slice(1, -1);
		this.letter2 = wordMiddle.charAt(Math.floor(this.seed * wordMiddle.length));
		this.letter3 = this.word.slice(-1);
		this.letString = (this.letter1 + this.letter2 + this.letter3).toUpperCase();
		this.numString = generateNumString(4);
		this.plateNumber = this.letString + this.numString;

		this.correctGuesses = [];
		this.score = 0;
		this.timeLeft = 5;
		this.timer = null;
	}

	startTimer() {
		this.timer = setInterval(() => {
			if (this.timeLeft > 0) {
				this.timeLeft--;
				$(".time-left").text(this.timeLeft);
			} else {
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

var Game;
const tiltExtreme = 1.5;

function generateNumString(length) {
	let string = "";
	let digits = "0123456789";
	for (var i = 0; i < length; i++) string += digits.charAt(Math.floor(Math.random() * digits.length));
	return string;
}

function startGameFrontEnd() {	
	$(".plate-background").attr("src", "img/plates/" + Game.plate.state + ".svg");

	// Apply CSS styles to plate
	$(".plate-number").attr("style", `
		font-size: calc(${Game.plate.text.size} * var(--plate-height));
		margin-top: calc(${Game.plate.text.offset} * var(--plate-height));
		color: ${Game.plate.text.color};
	`);

	// If plate has specified divider
	if (Game.plate.divider.name) {
		$(".plate-divider").load("img/dividers/" + Game.plate.divider.name + ".svg", function() {
			$(this).contents().unwrap();
	
			$(".plate-number svg").attr("style", `
				height: calc(${Game.plate.divider.width} * var(--plate-height)) !important;
				margin-left: calc(${Game.plate.divider.margin} * var(--plate-height));
				margin-right: calc(${Game.plate.divider.margin} * var(--plate-height));
			`);
	
			$(".plate-number svg > *").css("fill", Game.plate.text.color);
		});
	} else {
		$(".plate-divider").attr("style", `
			margin-left: calc(${Game.plate.divider.width / 2} * var(--plate-height));
			margin-right: calc(${Game.plate.divider.width / 2} * var(--plate-height));
		`);
	}

	// Randomly tilt license plate on game start
	let tilt = Math.floor(Math.random() * tiltExtreme) + 1;
		tilt *= Math.round(Math.random()) ? 1 : -1;
	$(".license-plate").css("transform", "rotate(" + tilt + "deg)")

	// Display letters and numbers onto plate
	$(".plate-chars1").html(Game.letString);
	$(".plate-chars2").html(Game.numString);

	// Timer functionality
	$(".time-left").html(Game.timeLeft);
	Game.startTimer();

	$(".word-input").focus();
}

function wrapup() {
	$(".word-input").blur();

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


// Start game from today's plate
$("#today-intro-btn").click(function() {
	var now = new Date();
	var daysSinceEpoch = Math.floor(now / 86400000);
	var todaySeed = new Math.seedrandom(daysSinceEpoch);
	Game = new PlateGame("daily", todaySeed);

	startGameFrontEnd();
	changeScreen("game");
});

$("#seed-intro-btn").click(function() {
	$("#intro-screen").addClass("wants-to-play-seed");
	$("#seed-input").val("");
	$("#seed-input").focus();
});

$("#back-btn").click(function() {
	$("#intro-screen").removeClass("wants-to-play-seed");
});

// Start game from seeded plate
$("#play-seed-btn").click(function() {
	if ($("#seed-input").val().length > 0) {
		var seedInput = $("#seed-input").val();
		var customSeed = new Math.seedrandom(seedInput);
		Game = new PlateGame("seeded", customSeed);

		startGameFrontEnd(customSeed);
		changeScreen("game");
	}
});


// Submit word
function submitWord() {
	var wordInput = $(".word-input").val();

	// Check if entered word matches letters
	let realWordCheck = wordList.includes(wordInput);
	let alreadyGuessedCheck = Game.correctGuesses.includes(wordInput);
	let firstLetterCheck = wordInput.slice(0, 1) == Game.letter1;
	let middleLetterCheck = (wordInput.slice(1, -1)).includes(Game.letter2);
	let lastLetterCheck = wordInput.slice(-1) == Game.letter3;

	if (realWordCheck && !alreadyGuessedCheck && firstLetterCheck && middleLetterCheck && lastLetterCheck) {
		Game.correctGuesses.push(wordInput);
		Game.score += wordInput.length;
		$(".score-amount").html(Game.score);

		let pointsDiv = $(`<div class="points-message">+${wordInput.length} points!</div>`);
		addScore(pointsDiv);

		$(".word-input").val("");
		$(".word-input").focus();
	} else {
		let wrongDiv = $(`<div class="wrong-message">Invalid word!</div>`);
		addScore(wrongDiv);
	}
}

$("#submit-btn").click(() => submitWord());


// Keyboard controls
$(document).keydown(function(e) {
	if (e.keyCode === 13) submitWord();
	// if (e.keyCode === 9) {
	// 	e.preventDefault();
	// 	$(".plate-number svg").replaceWith(`<div class="plate-divider"></div>`);
	// 	startGame(Math.random());
	// }
});


// Function to add score message in score container
function addScore(e) {
	let fontSize = parseFloat($(".score-container").css("--font-size"));
	e.appendTo($(".score-container")).animate({
		"display": "none",
		"opacity": 0,
		"margin-top": (fontSize * 2.8).toString() + "rem"
	}, 500);
}


// Cancel button
$("#cancel-circle-btn").click(function() {
	Game.destroyTimer();
	changeScreen("intro");
});


// End buttons
$("#play-again-btn").click(function() {
	changeScreen("intro");
});

$("#copy-results-btn").click(function() {
	let kind = (Game.kind == "daily") ? "📅 Today's" : "🌱 Seeded";

	let today = new Date();
	let formattedDate = `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, "0")}/${String(today.getDate()).padStart(2, "0")}`;
	let dateString = (Game.kind == "daily") ? formattedDate + " – " : "";

	navigator.clipboard.writeText(`${kind} Plate Game
${dateString}${Game.plateNumber}
Found ${Game.correctGuesses.length} word${(Game.correctGuesses.length == 1) ? "" : "s"}
Scored ${Game.score} point${(Game.score == 1) ? "" : "s"}`);
});
