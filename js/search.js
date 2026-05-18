// Letter input
$("#letter-input").on("propertychange input", function() {
	let $this = $(this);

	let upper = $this.val().toUpperCase().replace(/[^A-Z]/g, "");
	$this.val(upper);
	$("#letter-input-shadow").html(upper);

	if ($(this).val().length > 0)
		$("#letter-input-placeholder").hide();
	else
		$("#letter-input-placeholder").show();

	if ($(this).val().length == 3) {
		let letter1 = $this.val().charAt(0).toLowerCase();
		let letter2 = $this.val().charAt(1).toLowerCase();
		let letter3 = $this.val().charAt(2).toLowerCase();

		// Filter words from letters
		function filters(word) {
			let cond1 = word.charAt(0) == letter1;
			let cond2 = (word.slice(1, -1)).includes(letter2);
			let cond3 = word.slice(-1) == letter3;
			if (cond1 && cond2 && cond3) return true;
		}
		let filtered = wordList.filter(filters);

		// Convert words to HTML format
		let filteredAllHtml = "";
		for (word in filtered) filteredAllHtml += (`<div class="filtered-word">${filtered[word]}</div>`);

		// Calculate word with most characters in filtered array
		let longest = filtered.reduce(function(a, b) {
			return a.length > b.length ? a : b;
		});

		// Calculate word with average amount of characters in filtered array
		let middleLength = Math.floor(filtered.length / 2);
		let filteredSorted = filtered.sort(function(a, b) {
			return a.length - b.length
		});
		let middlest = filteredSorted[middleLength];

		// Calculate worst with least characters in filtered array
		let shortest = filtered.reduce(function(a, b) {
			return a.length <= b.length ? a : b;
		});


		// On finish
		$(".actual-count").html(filtered.length);

		let sampleList = $(".sample-word-list");
		sampleList.html(filteredAllHtml);
		if (sampleList[0].offsetHeight < sampleList[0].scrollHeight)
			$("#show-all-btn").removeClass("hide-btn");

		$(".actual-longest").html(longest);
		$(".actual-middlest").html(middlest);
		$(".actual-shortest").html(shortest);

		$(".all-word-list").html(filteredAllHtml);
	} else {
		$(".actual-count").html("0");
		$(".sample-word-list").html("");
		$("#show-all-btn").addClass("hide-btn");
		$(".actual-longest, .actual-middlest, .actual-shortest").html("???");
	}
});


// Buttons
$("#show-all-btn").click(function() {
	changeScreen("all-words");
});

$(".close-all-btn").click(function() {
	changeScreen("search");
});

const $sortInputs = $(`input[name="sort"]`);
const $labels = $sortInputs.next("label");
$sortInputs.on("change", function () {
	let words = $(".all-word-list .filtered-word").get();
	let sortFn = this.id === "alpha-sort"
		? (a, b) => $(a).text().localeCompare($(b).text())
		: (a, b) => $(a).text().length - $(b).text().length;
	
	words.sort(sortFn);

	$(".all-word-list").append(words);
	$labels.addClass("special-hover");
	$(this).next("label").removeClass("special-hover");
});
