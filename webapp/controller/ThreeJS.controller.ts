import Controller from 'sap/ui/core/mvc/Controller';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import CheckBox from 'sap/m/CheckBox';
import Event from 'sap/ui/base/Event';
import JSONModel from 'sap/ui/model/json/JSONModel';

/**
 * @namespace zsapbtpdecp.controller
 */
export default class ThreeJS extends Controller {
	/**
	 * global model for toggle controller
	 */
	private _models: Map<string, THREE.Object3D> = new Map();

	private _raycaster: THREE.Raycaster = new THREE.Raycaster();
	private _pointer: THREE.Vector2 = new THREE.Vector2();
	private _isShiftDown: boolean = false;
	private _rollOverMesh!: THREE.Mesh;
	private _cubeGeo!: THREE.BoxGeometry;
	private _cubeMaterial!: THREE.MeshLambertMaterial;
	private _objects: THREE.Object3D[] = [];
	private _plane!: THREE.Mesh;

	public onAfterRendering(): void {
		this._initThreeJS();
	}

	private _initThreeJS(): void {
		const container = this._getContainer();
		if (!container) return;

		const scene = this._createScene();
		const camera = this._createCamera(container);
		const renderer = this._createRenderer(container);
		const controls = this._createControls(camera, renderer);
		this._addLights(scene);
		this._addGrid(scene);
		this._loadModels(scene);

		this._handleContainerResize(container, camera, renderer);

		this._setupInteraction(scene, camera, renderer);
		this._addDefaultCubes(scene);

		this._startAnimationLoop(scene, camera, renderer, controls);
	}

	private _getContainer(): HTMLElement | null {
		const container = document.getElementById('threejs-canvas');
		if (!container) console.error('Three.js container not found.');

		return container;
	}

	private _createScene(): THREE.Scene {
		const scene = new THREE.Scene();
		scene.background = new THREE.Color(0xf0f0f0);
		return scene;
	}

	private _createCamera(container: HTMLElement): THREE.PerspectiveCamera {
		let aspect = container.clientWidth / container.clientHeight;
		const camera = new THREE.PerspectiveCamera(75, aspect, 1, 10000);
		camera.position.set(500, 800, 1300);
		camera.lookAt(0, 0, 0);
		return camera;
	}

	private _createRenderer(container: HTMLElement): THREE.WebGLRenderer {
		const renderer = new THREE.WebGLRenderer({ antialias: true });
		renderer.setSize(container.clientWidth, container.clientHeight);
		renderer.shadowMap.enabled = true;
		renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		container.appendChild(renderer.domElement);
		return renderer;
	}

	private _createControls(
		camera: THREE.Camera,
		renderer: THREE.WebGLRenderer
	): OrbitControls {
		const controls = new OrbitControls(camera, renderer.domElement);
		controls.enableDamping = true;
		controls.dampingFactor = 0.05;
		controls.enableZoom = true;
		controls.enablePan = false;
		// controls.autoRotate = true;
		return controls;
	}

	private _addGrid(scene: THREE.Scene): void {
		const size = 1000;
		const division = 20;
		const gridHelper = new THREE.GridHelper(size, division);
		scene.add(gridHelper);
	}

	private _addLights(scene: THREE.Scene): void {
		const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.5);
		hemiLight.position.set(0, 20, 0);
		scene.add(hemiLight);

		const dirLight = new THREE.DirectionalLight(0xffffff, 2);
		dirLight.position.set(5, 10, 7.5);
		dirLight.castShadow = true;
		dirLight.shadow.mapSize.set(1024, 1024);
		scene.add(dirLight);

		const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
		scene.add(ambientLight);
	}

	private _fetchGlobalModels(modelName: string, property?: string) {
		const oComponent = this.getOwnerComponent();
		if (!oComponent) return null;

		const oModel = oComponent.getModel(modelName) as JSONModel;
		if (!oModel) return null;

		if (property) return oModel.getProperty(`/${property}`);

		return oModel.getData();
	}

	private _loadModels(scene: THREE.Scene): void {
		const loader = new GLTFLoader();

		type TModelConfig = {
			name: string;
			path: string;
		};
		const modelConfigs: TModelConfig[] | null = this._fetchGlobalModels(
			'test1config',
			'model'
		) as TModelConfig[];
		if (!modelConfigs) {
			console.error('Failed to fetch models');
			return;
		}

		modelConfigs.forEach((config, index) => {
			loader.load(
				config.path,
				(gltf) => {
					const model = gltf.scene;
					model.position.x = index * 2;
					model.traverse((child) => {
						if ((child as THREE.Mesh).isMesh) {
							child.castShadow = true;
							child.receiveShadow = true;
						}
					});
					scene.add(model);

					// add model to global model for toggle controller
					this._models.set(config.name, model);
				},
				undefined,
				(error) => {
					console.error(`Error loading model at ${config.path}:`, error);
				}
			);
		});
	}

	private _startAnimationLoop(
		scene: THREE.Scene,
		camera: THREE.Camera,
		renderer: THREE.WebGLRenderer,
		controls: OrbitControls
	): void {
		const animate = () => {
			requestAnimationFrame(animate);
			controls.update();
			renderer.render(scene, camera);
		};
		animate();
	}

	/**
	 * Handle window resize events to update camera and renderer dimensions
	 */
	private _handleContainerResize(
		container: HTMLElement,
		camera: THREE.PerspectiveCamera,
		renderer: THREE.WebGLRenderer
	): void {
		window.addEventListener('resize', () => {
			let width = container.clientWidth;
			let height = container.clientHeight;
			camera.aspect = width / height;
			camera.updateProjectionMatrix();

			renderer.setSize(width, height);
		});
	}

	/**
	 * Toggle on/off model controller
	 * @param event
	 */
	public onToggleModel(event: Event): void {
		const checkbox: CheckBox = event.getSource();
		const modelKey = checkbox.getCustomData()[0].getValue();
		const visible = checkbox.getSelected();

		const model = this._models.get(modelKey);
		if (model) model.visible = visible;
	}

	/**
	 * Setup voxel interaction: roll-over mesh, raycasting, and event listeners
	 */
	private _setupInteraction(
		scene: THREE.Scene,
		camera: THREE.Camera,
		renderer: THREE.WebGLRenderer
	): void {
		const rollOverGeo = new THREE.BoxGeometry(50, 50, 50);
		const rollOverMaterial = new THREE.MeshBasicMaterial({
			color: 0xff0000,
			opacity: 0.5,
			transparent: true,
		});
		this._rollOverMesh = new THREE.Mesh(rollOverGeo, rollOverMaterial);
		scene.add(this._rollOverMesh);

		const texture = new THREE.TextureLoader().load(
			'/textures/square-outline-textured.png'
		);
		texture.colorSpace = THREE.SRGBColorSpace;
		this._cubeGeo = new THREE.BoxGeometry(50, 50, 50);
		this._cubeMaterial = new THREE.MeshLambertMaterial({
			color: 0xfeb74c,
			map: texture,
		});

		const geometry = new THREE.PlaneGeometry(1000, 1000);
		geometry.rotateX(-Math.PI / 2);
		this._plane = new THREE.Mesh(
			geometry,
			new THREE.MeshBasicMaterial({ visible: false })
		);
		scene.add(this._plane);
		this._objects.push(this._plane);

		document.addEventListener('pointermove', (e) =>
			this._onPointerMove(e, camera, renderer, scene)
		);
		document.addEventListener('pointerdown', (e) =>
			this._onPointerDown(e, camera, renderer, scene)
		);
		document.addEventListener('keydown', (e) => {
			if (e.key === 'Shift') this._isShiftDown = true;
		});
		document.addEventListener('keyup', (e) => {
			if (e.key === 'Shift') this._isShiftDown = false;
		});
	}

	private _onPointerMove(
		event: PointerEvent,
		camera: THREE.Camera,
		renderer: THREE.WebGLRenderer,
		scene: THREE.Scene
	): void {
		// Convert mouse coordinates to normalized device coordinates
		const rect = renderer.domElement.getBoundingClientRect();
		this._pointer.set(
			((event.clientX - rect.left) / rect.width) * 2 - 1,
			-((event.clientY - rect.top) / rect.height) * 2 + 1
		);
		// Set raycaster from camera and pointer
		this._raycaster.setFromCamera(this._pointer, camera);
		const intersects = this._raycaster.intersectObjects(this._objects, false);
		if (intersects.length > 0) {
			const intersect = intersects[0];
			this._rollOverMesh.position
				.copy(intersect.point)
				.add(intersect.face!.normal);
			// Snap the position to the voxel grid
			this._rollOverMesh.position
				.divideScalar(50)
				.floor()
				.multiplyScalar(50)
				.addScalar(25);
		}
	}

	private _onPointerDown(
		event: PointerEvent,
		camera: THREE.Camera,
		renderer: THREE.WebGLRenderer,
		scene: THREE.Scene
	): void {
		// Convert mouse coordinates to normalized device coordinates
		const rect = renderer.domElement.getBoundingClientRect();
		this._pointer.set(
			((event.clientX - rect.left) / rect.width) * 2 - 1,
			-((event.clientY - rect.top) / rect.height) * 2 + 1
		);
		// Set raycaster from camera and pointer
		this._raycaster.setFromCamera(this._pointer, camera);
		const intersects = this._raycaster.intersectObjects(this._objects, false);
		if (intersects.length > 0) {
			const intersect = intersects[0];
			if (this._isShiftDown) {
				// Remove the intersected voxel from the scene
				if (intersect.object !== this._plane) {
					scene.remove(intersect.object);
					this._objects.splice(this._objects.indexOf(intersect.object), 1);
				}
			} else {
				// Position the roll-over mesh or voxel at the intersection point
				const voxel = new THREE.Mesh(this._cubeGeo, this._cubeMaterial);
				voxel.position.copy(intersect.point).add(intersect.face!.normal);
				voxel.position
					.divideScalar(50)
					.floor()
					.multiplyScalar(50)
					.addScalar(25);

				scene.add(voxel);
				this._objects.push(voxel);
				console.log(this._objects);
			}
		}
	}

	/**
	 * Add default cubes to the scene at specified positions
	 */
	private _addDefaultCubes(scene: THREE.Scene): void {
		type TObject = {
			type: string;
			path: string;
			position: {
				x: number;
				y: number;
				z: number;
			};
		};
		let objs: TObject[] | null = this._fetchGlobalModels(
			'3jsobject',
			'objects'
		) as TObject[];
		if (!objs) return;
		// objs=[]

		// Convert each object's position to THREE.Vector3 and add cube
		objs.forEach((obj) => {
			// if (obj.type === 'cube') {
				const pos = new THREE.Vector3(
					obj.position.x,
					obj.position.y,
					obj.position.z
				);
				const voxel = new THREE.Mesh(this._cubeGeo, this._cubeMaterial);
				voxel.position.copy(pos);
				scene.add(voxel);
				this._objects.push(voxel);
			// }
		});
	}
}
