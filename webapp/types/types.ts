/** Represents a 3D object stored in database. */
export type TSceneObject = {
	id: string;
	type: string;
	name: string;
	scale: number | { x: number; y: number; z: number; };
	path: string;
	visible: boolean;
	position: { x: number; y: number; z: number; };
};

/** Stores the 3D coordinates. */
export type TCoordinate = { x: number; y: number; z: number; };

/** Store type of TSceneObject['type'] */
export type TObjectType = 'cube' | 'model';