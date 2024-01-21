import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
//setup stuff
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

async function doeverything() {
	let scene = new THREE.Scene();
	const renderer = new THREE.WebGLRenderer({ alpha: true });
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);
	const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, .1, 10000);
	scene.background = getSkyBox()

	const lightColor = 0x888888;
	const intensity = .3;

	const globalLight = new THREE.AmbientLight(lightColor, intensity)
	scene.add(globalLight)

	let textureloader = new THREE.TextureLoader()
	const roadTexture = await textureloader.loadAsync('public/textures/road.png')
	let loader = new GLTFLoader()
	const wheelData = await loader.loadAsync('public/wheel.glb')
	const carData = await loader.loadAsync('public/car.glb')
	const palmData = await loader.loadAsync('public/palm.glb')
	const streetlightData = await loader.loadAsync('public/street_light.glb')

	const wheelMesh = wheelData.scene
	// get the rear right in the right location
	wheelMesh.position.y -= 40
	wheelMesh.position.x += 100
	wheelMesh.position.z += 140
	const rearLeft = wheelMesh.clone()
	// get the front left in the right position
	const frontLeft = wheelMesh.clone()
	frontLeft.position.z -= 285

	const rearRight = wheelMesh.clone()
	rearRight.position.x -= 200
	rearRight.rotateY(THREE.MathUtils.degToRad(180))
	const frontRight = wheelMesh.clone()
	frontRight.position.z -= 285
	frontRight.position.x -= 200
	frontRight.rotateY(THREE.MathUtils.degToRad(180))

	let carMesh = carData.scene
	carMesh.rotateX(THREE.MathUtils.degToRad(-90))
	scene.add(carMesh)
	camera.up.set(0, 0, 1)
	camera.position.y = 500
	camera.position.z = 150

	carMesh.add(frontLeft)
	carMesh.add(frontRight)
	carMesh.add(rearLeft)
	carMesh.add(rearRight)

	let wheels = []
	wheels.push(frontLeft)
	wheels.push(frontRight)
	wheels.push(rearLeft)
	wheels.push(rearRight)


	camera.lookAt(carMesh.position)

	const g = new THREE.Group()
	g.add(camera)
	scene.add(g)


	const backgroundElements = new THREE.Object3D()
	scene.add(backgroundElements)
	const palmMaterial = new THREE.MeshLambertMaterial()
	palmMaterial.color = 0x00FF00
	const palmGeometry = palmData.scene.children[0].geometry
	let palmMesh = new THREE.Mesh(palmGeometry, palmMaterial)

	palmMesh.scale.set(80, 80, 80)
	palmMesh.position.z = -2
	palmMesh.position.x = 1_200
	palmMesh.position.y = -3000// 
	palmMesh.rotateX(THREE.MathUtils.degToRad(97))

	let palmTrees = []
	for (let i = 0; i < 20; i++) {
		let newPalmMesh = palmMesh.clone(true)
		//newPalmMesh.scale.set(80, 80, 80)
		//newPalmMesh.position.x = 300
		if (i % 2 == 0) {
			newPalmMesh.position.x = -1_000
		}
		newPalmMesh.position.y = -20_000 + (1_000 * i)

		backgroundElements.add(newPalmMesh)
		palmTrees.push(newPalmMesh)
	}

	let streetlight = streetlightData.scene

	streetlight.scale.set(80, 80, 80)
	streetlight.rotateX(THREE.MathUtils.degToRad(90))
	streetlight.rotateY(THREE.MathUtils.degToRad(90))

	streetlight.position.z = 30
	streetlight.position.x = -400
	streetlight.position.y = -300// 

	//scene.add(streetlight)
	let spotLight = new THREE.SpotLight(0xffffff, 1, 0, Math.PI / 3);


	let spotLighttarget = new THREE.Object3D()
	streetlight.add(spotLighttarget)
	spotLight.lookAt(spotLighttarget)

	spotLight.position.y = 4.8
	spotLight.position.z = 1.9
	spotLight.position.x = -2.2
	spotLight.decay = 1
	spotLight.intensity = 1000
	spotLight.penumbra = .5

	let streetLights = []
	for (let i = 0; i < 20; i++) {
		let streetLightFrame = streetlight.clone(true)
		let streetLightLight = spotLight.clone(true)
		streetLightFrame.add(streetLightLight)
		streetLightFrame.add(streetLightLight.target)

		if (i % 2 == 0) {
			streetLightFrame.position.x += 800
			streetLightFrame.rotateY(THREE.MathUtils.degToRad(180))
		}
		streetLightFrame.position.y = -20_000 + (1_000 * i)

		backgroundElements.add(streetLightFrame)
		streetLights.push({
			frame: streetLightFrame,
			light: streetLightLight
		})
	}

	const roadGeometry = new THREE.PlaneGeometry(1500, 20000)
	const roadMaterial = new THREE.MeshPhongMaterial({
		map: roadTexture,
	})
	const roadMesh = new THREE.Mesh(roadGeometry, roadMaterial)
	backgroundElements.add(roadMesh)
	roadMesh.position.z = 2


	let speed = .4;
	let rotation = .4;
	document.onmousemove = function(event) {
		speed = calculateSpeedFromMouseY(event.y)
		rotation = calculateAngleOfRotationFromMouseX(event.x)

	}

	window.onresize = function() {

		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);

	}

	const composer = new EffectComposer(renderer)
	const renderPass = new RenderPass(scene, camera)
	composer.addPass(renderPass)
	const outputPass = new OutputPass()
	composer.addPass(outputPass)

	animate();

	function animate() {
		g.rotation.z = rotation
		let actualSpeed = THREE.MathUtils.clamp(speed *20,2,20)

		for (let i = 0; i < streetLights.length; i++) {
			if (streetLights[i].frame.position.y >= 2000) {
				streetLights[i].frame.position.y = -10_000
			}
			let size = THREE.MathUtils.smoothstep(streetLights[i].frame.position.y, -20_000, -2000) * 80
			streetLights[i].frame.scale.set(size, size, size)
			streetLights[i].frame.position.y += actualSpeed
		}

		for (let i = 0; i < palmTrees.length; i++) {
			if (palmTrees[i].position.y >= 1000) {
				palmTrees[i].position.y = -10_000
			}
			let size = THREE.MathUtils.smoothstep(palmTrees[i].position.y, -20_000, -2000) * 80
			palmTrees[i].scale.set(size, size, size)
			palmTrees[i].position.y += actualSpeed
		}

		let wheelRotation = THREE.MathUtils.degToRad(actualSpeed * .5)
		frontLeft.rotateX(wheelRotation)
		frontRight.rotateX(-wheelRotation)
		rearLeft.rotateX(wheelRotation)
		rearRight.rotateX(-wheelRotation)

		requestAnimationFrame(animate);
		composer.render(scene, camera);
	}


	function getSkyBox() {
		const cubeLoaderloader = new THREE.CubeTextureLoader();
		return cubeLoaderloader.load([
			'public/skybox/right.png',
			'public/skybox/left.png',
			'public/skybox/back.png',
			'public/skybox/background.png',
			'public/skybox/top.png',
			'public/skybox/bottom.png',
		]);
	}

	function calculateSpeedFromMouseY(Y) {
		const fullHeight = renderer.domElement.height
		if (Y == 0) {
			Y = 1
		}
		return 1 - (Y / fullHeight)

	}

	function calculateAngleOfRotationFromMouseX(X) {
		const fullWidth = renderer.domElement.width
		let middle = fullWidth / 2.0
		let something = (middle - X) / middle
		return something * Math.PI / 2
	}
}
doeverything()
