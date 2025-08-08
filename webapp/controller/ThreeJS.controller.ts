import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import CheckBox from 'sap/m/CheckBox';
import Event from 'sap/ui/base/Event';
import JSONModel from 'sap/ui/model/json/JSONModel';
import { TObject } from 'zsapbtpdecp/types/types';
import Button from 'sap/m/Button';
import ThreeJSRootController from './ThreeJSRoot.controller';
import BindingMode from 'sap/ui/model/BindingMode';

/**
 * @namespace zsapbtpdecp.controller
 */
export default class ThreeJS extends ThreeJSRootController {
	/** Name of the global JSON model. */
	private static readonly MODEL_NAME: string = '3jsobject';
	/** Path to the objects array in the model. */
	private static readonly MODEL_PROP: string = '/objects';
	/** ID of the HTML canvas element used for rendering. */
	private static readonly CANVAS_ID: string = 'threejs-canvas';
	/** Path to Mesh object's texture */
	private static readonly TEXTURE: string =
		'/textures/square-outline-textured.png';

	/** JSONModel instance holding 3D object data. */
	private _3JSModel!: JSONModel;
	/** Array of objects representing 3D elements. */
	private _3JSData!: TObject[];

	/**
	 * - global model for toggle controller
	 * - Map of object IDs to their corresponding Three.js objects.
	 */
	private _modelMaps: Map<string, THREE.Object3D | THREE.Mesh> = new Map();
	/** Array of all Three.js objects in the scene. */
	private _objects: THREE.Object3D[] = [];

	/** Tracks whether the Shift key is pressed. */
	private _isShiftDown: boolean = false;

	/** Meshes and geometries used for voxel interaction. */
	private _rollOverMesh!: THREE.Mesh;
	/** Meshes and geometries used for voxel interaction. */
	private _cubeGeo!: THREE.BoxGeometry;
	/** Meshes and geometries used for voxel interaction. */
	private _cubeMaterial!: THREE.MeshLambertMaterial;
	/** Meshes and geometries used for voxel interaction. */
	private _plane!: THREE.Mesh;

	public onInit(): void | undefined {
		this._3JSModel = this.fetchGlobalModels(ThreeJS.MODEL_NAME) as JSONModel;
		this._3JSData = this._3JSModel.getProperty(ThreeJS.MODEL_PROP);

		this._3JSModel.setDefaultBindingMode(BindingMode.TwoWay);
		this._3JSModel.setSizeLimit(100000);
	}

	public onAfterRendering(): void | undefined {
		this._initThreeJS();
	}

	/**
	 * Initializes the scene, camera, renderer, controls, lights, grid, interaction handlers, and starts the animation loop.
	 * @returns
	 */
	private _initThreeJS(): void {
		const container = this.getContainer(ThreeJS.CANVAS_ID);
		if (!container) return;

		const scene = this.createScene();
		this.camera = this.createCamera(container);
		const renderer = this.createRenderer(container);
		this.controls = this.createControls(this.camera, renderer);
		this.addLights(scene);
		this.addGrid(scene);
		this.handleContainerResize(container, this.camera, renderer);

		this._setupInteraction(scene, this.camera, renderer);
		this._loadObjects(scene);

		this.startAnimationLoop(scene, this.camera, renderer, this.controls);
	}

	/**
	 * Toggle on/off object(s) controller
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

		const object3D = this._3JSData.find((o) => o.id === modelKey);
		if (!object3D) {
			console.error(`Object with ID ${modelKey} not found in the model.`);
			return;
		}

		// Make object glow
		if (object3D.type === 'cube') {
			const model = this._modelMaps.get(modelKey);
			if (model && model instanceof THREE.Mesh)
				this._setMeshFlash(model, 0xff0000, 1000);
		}

		// Move camera or controls to focus on the object
		this.controls.target.copy(object3D.position);
		this.camera.position.set(
			object3D.position.x + 200,
			object3D.position.y + 200,
			object3D.position.z + 200
		);
		this.controls.update();
	}

	/**
	 * Make Mesh object flash with a color for a specified timeout
	 * @param object
	 * @param color
	 * @param timeout
	 * @returns
	 */
	private _setMeshFlash(
		object: THREE.Mesh,
		color: number,
		timeout: number
	): void {
		// Ensure the material supports emissive (e.g., MeshStandardMaterial, MeshPhongMaterial)
		const originalMaterial = object.material as THREE.MeshStandardMaterial;
		if (!originalMaterial.emissive) {
			console.warn('Material does not support emissive property.');
			return;
		}

		// Clone material to avoid affecting other meshes using the same material
		const clonedMaterial = originalMaterial.clone();
		object.material = clonedMaterial;

		// Save the original emissive color
		const originalEmissive = clonedMaterial.emissive.clone();

		// Apply glow color
		clonedMaterial.emissive.setHex(color);

		// Restore after timeout
		setTimeout(() => {
			clonedMaterial.emissive.copy(originalEmissive);
		}, timeout);
	}

	/**
	 * Setup voxel interaction: roll-over mesh, raycasting, and event listeners
	 * @param scene
	 * @param camera
	 * @param renderer
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

		const texture = new THREE.TextureLoader().load(ThreeJS.TEXTURE);
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
		this.pointer.set(
			((event.clientX - rect.left) / rect.width) * 2 - 1,
			-((event.clientY - rect.top) / rect.height) * 2 + 1
		);
		// Set raycaster from camera and pointer
		this.raycaster.setFromCamera(this.pointer, camera);
		const intersects = this.raycaster.intersectObjects(this._objects, false);
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
		this.pointer.set(
			((event.clientX - rect.left) / rect.width) * 2 - 1,
			-((event.clientY - rect.top) / rect.height) * 2 + 1
		);
		// Set raycaster from camera and pointer
		this.raycaster.setFromCamera(this.pointer, camera);
		const intersects = this.raycaster.intersectObjects(this._objects, false);
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
	 * Add new Mesh object to global model
	 * @param voxel
	 * @returns
	 */
	private _addObjectToModel(voxel: THREE.Mesh): void {
		this._3JSData.push({
			id: voxel.uuid,
			type: 'cube',
			path: '',
			name: `cube ${this._3JSData.length}`,
			scale: 0,
			visible: true,
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

	/**
	 * Remove object from Global model by ID
	 * @param id
	 */
	private _removeObjectFromModel(id: TObject['id']): void {
		this._3JSData = this._3JSData.filter((obj) => obj.id !== id);
		this._3JSModel.setProperty(ThreeJS.MODEL_PROP, this._3JSData);
		this._3JSModel.refresh(true);
	}

	/** Load all objects in model to the scene at specified positions */
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

		console.log('mesh data: ', this._objects);
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
		voxel.visible = object.visible;

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
				model.visible = object.visible;

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
