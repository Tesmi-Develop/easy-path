# 📈 EasyPath
EasyPath will give you the ability to create smooth paths, this package is ideal for TD games where you want the most optimized enemy system possible.

## Example
A code snippet showing how to set up and use EasyPath.

```ts
const cframes = [
	new CFrame(11.39, 0.5, -14.8),
	new CFrame(11.39, 0.5, -30.03),
	new CFrame(13.7, 0.5, -32.44).mul(CFrame.fromOrientation(0, math.rad(90), 0))
]

const path = new EasyPath(cframes);
path.Visualize();

const part = new Instance("Part", Workspace);
part.Size = Vector3.one;
part.Anchored = true;
part.CanCollide = false;

let dist = 0;
while (dist <= path.GetLength()) {
	dist += 1;
	part.CFrame = path.CalculateCFrameByLength(dist, -1);
	task.wait(0.1);
}
```

## API

* new EasyPath(cframes: CFrame[])

Takes an array of cframes to be used as waypoints and returns a path object.

* Path.CalculateCFrame(t: number, deviation?: number)
  
Takes in a t value from 0-1 and returns a uniform cframe across the path object.

* Path.CalculateCFrameByLength(lenght: number, deviation?: number)
  
Takes the path length and returns a uniform frame over the entire path object.

* Path:GetPathLength()

Returns the path objects length.