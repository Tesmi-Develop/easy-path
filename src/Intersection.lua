return function(a: CFrame, b: CFrame, inverse: boolean): Vector3?
    inverse = inverse or false
	local directionA = (a.LookVector * 1000 - a.Position).Unit
	local directionB = (b.LookVector * (if inverse then -1 else 1) * 1000 - b.Position).Unit

	if directionA:Cross(directionB).Magnitude == 0 then
		return
	end

	local ax = directionA.X + directionA.Y + directionA.Z > directionB.X + directionB.Y + directionB.Z
	local intersectionPoint = (if ax then a else b).Position + (if ax then directionA else directionB) * (b.Position - a.Position):Cross(directionB).Magnitude / directionA:Cross(directionB).Magnitude
	return Vector3.new(intersectionPoint.X, intersectionPoint.Y, intersectionPoint.Z)
end