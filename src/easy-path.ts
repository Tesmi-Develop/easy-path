import BezierCurve from "@rbxts/bezier";
import Intersection from "./Intersection";
import { Workspace } from "@rbxts/services";

interface INode {
	CFrame: CFrame;
	Progress: number;
	Length: number;
}

const ANGLE_OFFSET = 2;
const BEZIER_PROGRESS = 0.1;

const IsNaN = (number: number) => number !== number;

export class EasyPath {
	private points: CFrame[];
	private nodes: INode[] = [];
	private normalizedNodes: number[] = [];
	private length = 0;
	private visualizingParts: BasePart[] = [];
	private minIteractionAmount = 0;
	private countNodes = 0;
	private countNormalizedNodes = 0;
	private pathFolder?: Folder;

	constructor(nodes: CFrame[]) {
		this.points = table.clone(nodes);
		this.compileNodes();
	}

	/**
	 * Calculates the CFrame at a given time, with an optional deviation.
	 *
	 * @param {number} t - The time parameter
	 * @param {number} deviation - The deviation (default 0)
	 * @return {CFrame} The calculated CFrame
	 */
	public CalculateCFrame(t: number, deviation: number = 0): CFrame {
		t = math.clamp(t, 0, 1);
		const isLastNode = t === 1;
		const index = math.min(math.floor(t * this.countNormalizedNodes), this.countNormalizedNodes - 1);
		// eslint-disable-next-line prettier/prettier
		const link = this.normalizedNodes[(!isLastNode && t < 1 && index + 1 === this.countNormalizedNodes) ? index - 1 : index];
		const node = this.nodes[link];
		const nextNode = isLastNode ? this.nodes[link] : this.nodes[link + 1];
		const normilizeT = isLastNode ? 1 : (t - node.Progress) / (nextNode.Progress - node.Progress);
		const finalPoint = node.CFrame.Lerp(nextNode.CFrame, normilizeT);

		return finalPoint.add(finalPoint.RightVector.mul(deviation));
	}

	/**
	 * Calculate the CFrame using the given length and deviation.
	 *
	 * @param {number} length - the length parameter
	 * @param {number} deviation - the deviation parameter, defaults to 0
	 * @return {CFrame} the calculated CFrame
	 */
	public CalculateCFrameByLength(length: number, deviation: number = 0): CFrame {
		return this.CalculateCFrame(length / this.length, deviation);
	}

	/**
	 * Gets the length of the path.
	 *
	 * @return {number} the length of path.
	 */
	public GetLength(): number {
		return this.length;
	}

	/**
	 * Returns an array of path nodes.
	 *
	 * @return {ReadonlyArray<Readonly<INode>>}
	 */
	public GetNodes(): ReadonlyArray<Readonly<INode>> {
		return this.nodes as ReadonlyArray<Readonly<INode>>;
	}

	/**
	 * Visualizes the path by creating and positioning part instances along the path.
	 *
	 * @param {Vector3} size - The size of the part instances
	 * @param {Color3} color - The color of the part instances
	 * @param {number} progressInteraction - The step size for visualizing the path
	 */
	public Visualize(
		size: Vector3 = new Vector3(0.1, 0.1, 0.1),
		color: Color3 = Color3.fromRGB(163, 162, 165),
		progressInteraction: number = 0.01,
	) {
		if (!this.pathFolder) {
			this.pathFolder = new Instance("Folder", Workspace);
			this.pathFolder.Name = "PathVisualizer";
		}

		this.visualizingParts.forEach((part) => part.Destroy());

		for (let i = 0; i <= 2; i += progressInteraction) {
			i = math.clamp(i, 0, 1);

			const cframe = this.CalculateCFrame(i);
			const part = new Instance("Part", this.pathFolder);
			part.Name = `${i}`;
			part.Size = size;
			part.Anchored = true;
			part.CanCollide = false;
			part.CFrame = cframe;
			part.Color = color;
			this.visualizingParts.push(part);

			if (i === 1) {
				break;
			}
		}
	}

	/**
	 * Destroys visual elements.
	 */
	public DestroyVisualize() {
		this.pathFolder?.Destroy();
		this.visualizingParts.forEach((part) => part.Destroy());
	}

	private createNodes() {
		const angleOffset = math.rad(ANGLE_OFFSET);

		this.points.forEach((point, index) => {
			if (index + 1 === this.points.size()) {
				this.nodes.push({
					CFrame: point,
					Progress: 1,
					Length: 0,
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
					Length: 0,
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
					Length: 0,
				});
			});
		});

		this.countNodes = this.nodes.size();
	}

	private calculetePropsForNodes() {
		let totalProgress = 0;
		let totalLength = 0;
		this.minIteractionAmount = 1;
		this.nodes.forEach((node, index) => {
			if (index === this.countNodes - 1) {
				node.Progress = 1;
				return;
			}

			if (index - 1 === this.countNodes - 2) return;
			if (index === 0) {
				node.Progress = 0;
				node.Length = 0;
			}

			const nextNode = this.nodes[index + 1];
			const distance = nextNode.CFrame.Position.sub(node.CFrame.Position).Magnitude;
			const progress = distance / this.length;
			this.minIteractionAmount = math.min(progress, this.minIteractionAmount);

			totalProgress += progress;
			totalLength += distance;
			nextNode.Length = totalLength;
			nextNode.Progress = totalProgress;
		});
	}

	private compileNormalizedNodes() {
		assert(this.minIteractionAmount > 0, "minIteractionAmount must be greater than 0");
		let totalProgress = 0;
		let nodeIndex = 0;

		while (totalProgress <= 1) {
			let nextNode = this.nodes[nodeIndex + 1];

			if (totalProgress >= nextNode.Progress) {
				nodeIndex++;
				nextNode = this.nodes[nodeIndex + 1];
			}

			this.normalizedNodes.push(nodeIndex);

			if (totalProgress === 1) {
				break;
			}

			totalProgress += this.minIteractionAmount;
			totalProgress = math.clamp(totalProgress, 0, 1);
		}

		this.countNormalizedNodes = this.normalizedNodes.size();
	}

	private compileNodes() {
		this.createNodes();
		this.calculetePropsForNodes();
		this.compileNormalizedNodes();
	}
}
