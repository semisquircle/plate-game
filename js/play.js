$(document).ready(function() {
	let url = new URL(window.location.href);
	let seed = url.searchParams.get("seed");
	if (seed) {
		$("#intro-screen").addClass("wants-to-play-seed");
		$("#seed-input").val(seed);
	}
});


// Game data
class PlateGame {
	constructor(kind, seedInput) {
		this.kind = kind;

		this.startTime = new Date();
		if (seedInput) {
			this.seedInput = seedInput;
			let customSeed = new Math.seedrandom(seedInput);
			this.seed = customSeed(customSeed);
		} else {
			let daysSinceEpoch = Math.floor(this.startTime / 86400000);
			this.seedInput = daysSinceEpoch;
			let todaySeed = new Math.seedrandom(daysSinceEpoch);
			this.seed = todaySeed(todaySeed);
		}

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
		this.timeLeft = 60;
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

function resetIntro() {
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


// Function to add score message in score container
function addScore(e) {
	let fontSize = parseFloat($(".score-container").css("--font-size"));
	e.appendTo($(".score-container")).animate({
		"display": "none",
		"opacity": 0,
		"margin-top": (fontSize * 2.8).toString() + "rem"
	}, 500);
}


// Buttons
$("#today-intro-btn").click(function() {
	Game = new PlateGame("daily");
	startGameFrontEnd();
	changeScreen("game");
});

$("#seed-intro-btn").click(function() {
	$("#intro-screen").addClass("wants-to-play-seed");
	$("#seed-input").val("");
	$("#seed-input").focus();
});

$("#back-btn").click(function() {
	resetIntro();
});

$("#play-seed-btn").click(function() {
	if ($("#seed-input").val().length > 0) {
		let customSeedInput = $("#seed-input").val();
		Game = new PlateGame("seeded", customSeedInput);

		// Embed seed in URL
		let url = new URL(window.location.href);
		url.searchParams.set("seed", customSeedInput);
		history.replaceState(null, "", url.toString());

		startGameFrontEnd();
		changeScreen("game");
	}
});

$("#submit-btn").click(() => submitWord());

$("#cancel-circle-btn").click(function() {
	Game.destroyTimer();
	resetIntro();
	changeScreen("intro");
});

$("#play-again-btn").click(function() {
	resetIntro();
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
	if (e.keyCode === 13) submitWord();
	// if (e.keyCode === 9) {
	// 	e.preventDefault();
	// 	$(".plate-number svg").replaceWith(`<div class="plate-divider"></div>`);
	// 	startGame(Math.random());
	// }
});
