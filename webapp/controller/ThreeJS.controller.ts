import Controller from 'sap/ui/core/mvc/Controller';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import CheckBox from 'sap/m/CheckBox';
import Event from 'sap/ui/base/Event';
import JSONModel from 'sap/ui/model/json/JSONModel';
import { TObject } from 'zsapbtpdecp/types/types';
import Button from 'sap/m/Button';

/**
 * @namespace zsapbtpdecp.controller
 */
export default class ThreeJS extends Controller {
	/**
	 * Name of the global JSON model.
	 */
	private static readonly MODEL_NAME = '3jsobject';
	/**
	 * Path to the objects array in the model.
	 */
	private static readonly MODEL_PROP = '/objects';
	/**
	 * ID of the HTML canvas element used for rendering.
	 */
	private static readonly CANVAS_ID = 'threejs-canvas';

	/**
	 * JSONModel instance holding 3D object data.
	 */
	private _3JSModel!: JSONModel;
	/**
	 * Array of objects representing 3D elements.
	 */
	private _3JSData!: TObject[];
	/**
	 * - global model for toggle controller
	 * - Map of object IDs to their corresponding Three.js objects.
	 */
	private _modelMaps: Map<string, THREE.Object3D | THREE.Mesh> = new Map();
	/**
	 * Array of all Three.js objects in the scene.
	 */
	private _objects: THREE.Object3D[] = [];

	/**
	 * Core Three.js components for rendering and interaction.
	 */
	private _camera!: THREE.PerspectiveCamera;
	/**
	 * Core Three.js components for rendering and interaction.
	 */
	private _controls!: OrbitControls;
	/**
	 * Core Three.js components for rendering and interaction.
	 */
	private _raycaster: THREE.Raycaster = new THREE.Raycaster();
	/**
	 * Core Three.js components for rendering and interaction.
	 */
	private _pointer: THREE.Vector2 = new THREE.Vector2();
	
	/**
	 * Tracks whether the Shift key is pressed.
	 */
	private _isShiftDown: boolean = false;

	/**
	 * Meshes and geometries used for voxel interaction.
	 */
	private _rollOverMesh!: THREE.Mesh;
	/**
	 * Meshes and geometries used for voxel interaction.
	 */
	private _cubeGeo!: THREE.BoxGeometry;
	/**
	 * Meshes and geometries used for voxel interaction.
 	 */
	private _cubeMaterial!: THREE.MeshLambertMaterial;
	/**
	 * Meshes and geometries used for voxel interaction.
	 */
	private _plane!: THREE.Mesh;

	public onInit(): void | undefined {
		this._updateGlobalModel()
	}

	public onAfterRendering(): void {
		this._initThreeJS();
	}

	/**
	 * Initializes the scene, camera, renderer, controls, lights, grid, interaction handlers, and starts the animation loop.
	 * @returns
	 */
	private _initThreeJS(): void {
		const container = this._getContainer();
		if (!container) return;

		const scene = this._createScene();
		this._camera = this._createCamera(container);
		const renderer = this._createRenderer(container);
		this._controls = this._createControls(this._camera, renderer);
		this._addLights(scene);
		this._addGrid(scene);
		this._handleContainerResize(container, this._camera, renderer);

		this._setupInteraction(scene, this._camera, renderer);
		this._loadObjects(scene);

		this._startAnimationLoop(scene, this._camera, renderer, this._controls);
	}

	/**
	 * Retrieves the canvas container element.
	 * @returns
	 */
	private _getContainer(): HTMLElement | null {
		const container = document.getElementById(ThreeJS.CANVAS_ID);
		if (!container) console.error('Three.js container not found.');

		return container;
	}

	/**
	 * Creates and configures the Three.js scene.
	 * @returns
	 */
	private _createScene(): THREE.Scene {
		const scene = new THREE.Scene();
		scene.background = new THREE.Color(0xf0f0f0);
		return scene;
	}

	/**
	 * Sets up the perspective camera.
	 * @param container
	 * @returns
	 */
	private _createCamera(container: HTMLElement): THREE.PerspectiveCamera {
		let aspect = container.clientWidth / container.clientHeight;
		const camera = new THREE.PerspectiveCamera(75, aspect, 1, 10000);
		camera.position.set(500, 800, 1300);
		camera.lookAt(0, 0, 0);
		return camera;
	}

	/**
	 * Initializes the WebGL renderer.
	 * @param container
	 * @returns
	 */
	private _createRenderer(container: HTMLElement): THREE.WebGLRenderer {
		const renderer = new THREE.WebGLRenderer({ antialias: true });
		renderer.setSize(container.clientWidth, container.clientHeight);
		renderer.shadowMap.enabled = true;
		renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		container.appendChild(renderer.domElement);
		return renderer;
	}

	/**
	 * Adds orbit controls for camera movement.
	 * @param camera
	 * @param renderer
	 * @returns
	 */
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

	/**
	 * Adds a grid helper to the scene.
	 * @param scene
	 */
	private _addGrid(scene: THREE.Scene): void {
		const size = 1000;
		const division = 20;
		const gridHelper = new THREE.GridHelper(size, division);
		scene.add(gridHelper);
	}

	/**
	 * Adds hemisphere, directional, and ambient lights.
	 * @param scene
	 */
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

	/**
	 * Refreshes the local model and data from the global model.
	 */
	private _updateGlobalModel(): void { 
		this._3JSModel = this._fetchGlobalModels(ThreeJS.MODEL_NAME) as JSONModel;
		this._3JSData = this._3JSModel.getProperty(ThreeJS.MODEL_PROP)
	}

	/**
	 * - Minimize the code to fetch the model
	 * - Utility to fetch model or property from the component.
	 * @param modelName
	 * @param property
	 * @returns
	 */
	private _fetchGlobalModels(modelName: string, property?: string) {
		const oComponent = this.getOwnerComponent();
		if (!oComponent) return null;

		const oModel = oComponent.getModel(modelName) as JSONModel;
		if (!oModel) return null;

		if (property) return oModel.getProperty(`/${property}`);

		return oModel;
	}

	/**
	 * Continuously renders the scene.
	 * @param scene
	 * @param camera
	 * @param renderer
	 * @param controls
	 */
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

		const model = this._modelMaps.get(modelKey);
		if (model) model.visible = visible;
	}

	/**
	 * Navigate to a specific object in the scene
	 * @param event
	 */
	public onNavigateToObject(event: Event): void {
		const button = event.getSource() as Button;
		const modelKey = button.getCustomData()[0].getValue();

		this._updateGlobalModel();
		const object3D = this._3JSData.find((o) => o.id === modelKey);
		if (object3D) {
			// Move camera or controls to focus on the object
			this._controls.target.copy(object3D.position);
			this._camera.position.set(
				object3D.position.x + 200,
				object3D.position.y + 200,
				object3D.position.z + 200
			);
			this._controls.update();
		}
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

	/**
	 * Updates roll-over mesh position based on mouse movement.
	 * @param event
	 * @param camera
	 * @param renderer
	 * @param scene
	 */
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

	/**
	 * Adds or removes voxels based on click and Shift key state.
	 * @param event
	 *
	 * @param camera
	 * @param renderer
	 * @param scene
	 * @returns
	 */
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

					// Remove object from global model for toggle controller
					const removedId =
						intersect.object.userData.id || intersect.object.uuid;
					this._removeObjectFromModel(removedId);
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

				// Add object to global model for toggle controller
				this._addObjectToModel(voxel);
			}
		}
	}

	/**
	 *
	 * @param voxel
	 * @returns
	 */
	private _addObjectToModel(voxel: THREE.Mesh): void {
		this._updateGlobalModel();
		this._3JSData.push({
			id: voxel.uuid,
			type: 'cube',
			path: '',
			name: `cube ${this._3JSData.length}`,
			scale: 0,
			position: {
				x: voxel.position.x,
				y: voxel.position.y,
				z: voxel.position.z,
			},
		});
		this._3JSModel.setProperty(ThreeJS.MODEL_PROP, this._3JSData);
		this._3JSModel.refresh(true);

		// Add the voxel to the global models map
		this._modelMaps.set(voxel.uuid, voxel);
	}

	private _removeObjectFromModel(id: TObject['id']): void {
		this._updateGlobalModel();

		this._3JSData = this._3JSData.filter((obj) => obj.id !== id);
		this._3JSModel.setProperty(ThreeJS.MODEL_PROP, this._3JSData);
		this._3JSModel.refresh(true);
	}

	/**
	 * Load all objects in model to the scene at specified positions
	 */
	private _loadObjects(scene: THREE.Scene): void {
		// Convert each object's position to THREE.Vector3 and add cube
		this._3JSData.forEach((object, index) => {
			switch (object.type) {
				case 'cube':
					this._loadObjectCUBE(object, scene);
					break;

				case 'model':
					const fileType = object.path.split('.').pop()?.toLowerCase();
					switch (fileType) {
						case 'glb':
							this._loadObjectGLTF(object, scene);
							break;
						default:
							console.error(`Unsupported file type: ${fileType}`);
							break;
					}
					break;

				default:
					break;
			}
		});
	}

	/**
	 * Load cube from model
	 * @param object
	 * @param scene
	 */
	private _loadObjectCUBE(object: TObject, scene: THREE.Scene): void {
		const pos = new THREE.Vector3(
			object.position.x,
			object.position.y,
			object.position.z
		);
		const voxel = new THREE.Mesh(this._cubeGeo, this._cubeMaterial);
		voxel.userData.id = object.id;
		voxel.position.copy(pos);

		scene.add(voxel);
		this._objects.push(voxel);

		// add model to global model for toggle controller
		this._modelMaps.set(object.id, voxel);
	}

	/**
	 * Load GLTF Object from model
	 * @param object
	 * @param scene
	 */
	private _loadObjectGLTF(object: TObject, scene: THREE.Scene): void {
		const loader = new GLTFLoader();
		loader.load(
			object.path,
			(gltf) => {
				const model = gltf.scene;
				model.position.x = object.position.x;
				model.position.y = object.position.y;
				model.position.z = object.position.z;

				const scale = object.scale || 10;
				if (typeof scale === 'number') model.scale.set(scale, scale, scale);
				else model.scale.set(scale.x || 1, scale.y || 1, scale.z || 1);

				model.traverse((child) => {
					if ((child as THREE.Mesh).isMesh) {
						child.castShadow = true;
						child.receiveShadow = true;
					}
				});
				scene.add(model);

				// add model to global model for toggle controller
				this._modelMaps.set(object.id, model);
			},
			undefined,
			(error) => {
				console.error(`Error loading model at ${object.path}:`, error);
			}
		);
	}
}
