function changeScreen(screen) {
	$(".screen").removeClass("current-screen");
	$("#" + screen + "-screen").addClass("current-screen");
}

function hideScreen(screen) {
	$("#" + screen + "-screen").removeClass("current-screen");
}
