export type TObject = {
	id: string;
	type: string;
	name: string;
	scale: number | { x: number; y: number; z: number };
	path: string;
	position: { x: number; y: number; z: number };
};
