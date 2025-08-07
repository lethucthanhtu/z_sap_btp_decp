export type TObject = {
	id: string;
	type: string;
	name: string;
	scale: number | { x: number; y: number; z: number };
	path: string;
	visible: boolean;
	position: { x: number; y: number; z: number };
};