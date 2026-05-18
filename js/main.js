function changeScreen(screen) {
	$(".screen").removeClass("current-screen");
	$("#" + screen + "-screen").addClass("current-screen");
}
