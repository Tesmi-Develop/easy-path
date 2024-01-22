import BezierCurve from "@rbxts/bezier";
import Intersection from "./Intersection";
import { Workspace } from "@rbxts/services";

interface INode {
	CFrame: CFrame;
	Progress: number;
}

const ANGLE_OFFSET = 2;
const BEZIER_PROGRESS = 0.1;

const IsNaN = (number: number) => number !== number;

export class EasyPath {
	private points: CFrame[];
	private nodes: INode[] = [];
	private length = 0;
	private visualizingParts: BasePart[] = [];

	constructor(nodes: CFrame[]) {
		this.points = table.clone(nodes);
		this.compileNodes();
	}

	public CalculateCFrame(t: number) {
		t = math.clamp(t, 0, 1);
		// TODO
	}

	public GetPoints() {
		return this.points as ReadonlyArray<CFrame>;
	}

	public GetLength() {
		return this.length;
	}

	public GetNodes() {
		return this.nodes as ReadonlyArray<Readonly<INode>>;
	}

	public Visualize(size = new Vector3(0.1, 0.1, 0.1), color = Color3.fromRGB(163, 162, 165)) {
		this.visualizingParts.forEach((part) => part.Destroy());

		this.nodes.forEach((node, index) => {
			const part = new Instance("Part", Workspace);
			part.Size = size;
			part.Color = color;
			part.Anchored = true;
			part.CanCollide = false;
			part.Name = `${index}`;
			part.CFrame = node.CFrame;
			this.visualizingParts.push(part);
		});
	}

	private createNodes() {
		const angleOffset = math.rad(ANGLE_OFFSET);
		this.points.forEach((point, index) => {
			if (index + 1 === this.points.size()) {
				this.nodes.push({
					CFrame: point,
					Progress: 1,
				});
				return;
			}
			const currentNode = point;
			const nextNode = this.points[index + 1];

			const deltaVector = nextNode.Position.sub(currentNode.Position);
			const deltaVectorLook = deltaVector.Unit;
			const lookVector = currentNode.LookVector;
			const angle = math.acos(deltaVectorLook.Dot(lookVector));
			const intersectionPoint = Intersection(currentNode, nextNode, true);

			if ((angle <= angleOffset && angle >= -angleOffset) || !intersectionPoint || IsNaN(angle)) {
				this.length += deltaVector.Magnitude;
				this.nodes.push({
					CFrame: CFrame.lookAt(currentNode.Position, nextNode.Position),
					Progress: 0,
				});
				return;
			}

			const curve = new BezierCurve([currentNode.Position, intersectionPoint, nextNode.Position]);
			const positions = [] as Vector3[];

			for (let i = 0; i < 1; i += BEZIER_PROGRESS) {
				positions.push(curve.calculate(i));
			}

			positions.forEach((position, index) => {
				if (index + 1 === positions.size()) return;
				const endPosition = positions[index + 1];

				this.length += endPosition.sub(position).Magnitude;
				this.nodes.push({
					CFrame: CFrame.lookAt(position, endPosition),
					Progress: 0,
				});
			});
		});
	}

	private calculeteProgressions() {
		let totalProgress = 0;
		this.nodes.forEach((node, index) => {
			if (index === this.nodes.size() - 1) {
				node.Progress = 1;
				return;
			}

			if (index - 1 === this.nodes.size() - 2) return;
			index === 0 && (node.Progress = 0);

			const nextNode = this.nodes[index + 1];
			const distance = nextNode.CFrame.Position.sub(node.CFrame.Position).Magnitude;
			const progress = distance / this.length;
			totalProgress += progress;
			nextNode.Progress = totalProgress;
		});
	}

	private compileNodes() {
		this.createNodes();
		this.calculeteProgressions();
	}
}
