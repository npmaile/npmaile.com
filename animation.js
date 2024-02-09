import { gsap } from "gsap";

let namezone = document.querySelector(".meganamezone")
namezone.addEventListener("click", goAway)

let width = document.body.clientWidth
var links = document.querySelectorAll(".linkbox")

function goAway() {
	links.forEach((dot, i) => {
		gsap.to(dot, {
			duration: .4,
			ease: links[i],
			delay: i * 0.06,
			rotationZ: 40,
			x: width,
		});
	})
	namezone.removeEventListener("click", goAway)
	namezone.addEventListener("click", comeBack)
}

function comeBack() {
		links.forEach((dot, i) => {
		gsap.to(dot, {
			duration: 1,
			ease: links[i],
			delay: i * 0.06,
			rotationZ: 0,
			x: 0,
		});
	})
	namezone.removeEventListener("click", comeBack)
	namezone.addEventListener("click", goAway)
}
