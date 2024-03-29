import { Workspace } from "@rbxts/services";
import { EasyPath } from "../easy-path";

const Points = Workspace.FindFirstChild("Points") as Folder;
const nodes = [] as CFrame[];

Points.GetChildren().forEach((point) => {
	if (!point.IsA("BasePart")) return;

	point.Transparency = 1;
	nodes.push(point.CFrame);
});

const path = new EasyPath(nodes).Compile();
path.Visualize();

const part = new Instance("Part", Workspace);
part.Size = Vector3.one;
part.Anchored = true;
part.CanCollide = false;

let dist = 0;
while (dist <= path.GetLength()) {
	dist += 0.5;
	part.CFrame = path.CalculateCFrameByLength(dist);
	task.wait(0.05);
}
