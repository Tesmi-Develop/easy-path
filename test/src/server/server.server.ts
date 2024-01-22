import { Workspace } from "@rbxts/services";
import { EasyPath } from "../tower-defense-path";

const Points = Workspace.FindFirstChild("Points") as Folder;
const nodes = [] as CFrame[];

Points.GetChildren().forEach((point) => {
	if (!point.IsA("BasePart")) return;

	point.Transparency = 1;
	nodes.push(point.CFrame);
});

const path = new EasyPath(nodes);
path.Visualize();
print(path.GetLength());
