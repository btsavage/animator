window.onload = onLoaded;


const KNOB_RADIUS = 5;
const KNOB_RADIUS_SQUARED = KNOB_RADIUS*KNOB_RADIUS;
const TWO_PI = 2*Math.PI;

var dragIndex = -1;
var draggedPath = -1;
var endpointIndex;
var oppositeControlIndex;
var pathDragOffsetX;
var pathDragOffsetY;

var canvasNode;
var context;
var paths;

var selectedLayer;
var draggedLayer;

var selectedCell;
var selectedRegionEnd;

var snapshots = [];

function Path(name, fillColor, data, visible, outline){
	this.name = name;
	this.fillColor = fillColor;
	this.data = data;
	this.visible = visible;
	this.outline = outline;
}

Path.prototype = {
	contains: function contains(x, y){
		var totalIntersections = 0;
		for( var i = 0; i < this.data.length; i+= 3 ){
			totalIntersections += countCubicBezierIntersections(this.data[i], this.data[i+1], this.data[i+2], this.data[(i+3)%this.data.length], x, y);
		}
		return (totalIntersections % 2) == 1;
	},
	deletePointAt: function deletePointAt(index){
		var mod = index % 3;
		var nearestEndpoint;
		if( mod == 0 ){
			nearestEndpoint = index;
		}else if( mod == 1 ){
			nearestEndpoint = index - 1;
		}else if( mod == 2 ){
			if( index + 1 >= this.data.length ){
				nearestEndpoint = 0;
			}else{
				nearestEndpoint = index + 1;
			}
		}
		if( nearestEndpoint > 0 ){
			this.data.splice(nearestEndpoint-1, 3);
		}else{
			var foo = this.data.splice(0,3);
			this.data.splice(-1,1, foo[2]);
		}
	}
}

function lirp(start, end, t){
	return [
		(1-t)*start[0] + t*end[0],
		(1-t)*start[1] + t*end[1]
	];
}

const NUM_MIDPOINTS = 10;
function countCubicBezierIntersections(start, control1, control2, end, x, y){
	var total = 0;
	var last = start;
	
	for( var i = 0; i < NUM_MIDPOINTS; i++ ){
		var cur = cubicBezierAt(start, control1, control2, end, (i+1)/(NUM_MIDPOINTS+1));
		context.lineTo(cur[0], cur[1]);
		total += countLineIntersections(last, cur, x, y);
		last = cur;
	}
	
	total += countLineIntersections(last, end, x, y);
	return total;
}

function cubicBezierAt(start, control1, control2, end, t){
	var side1 = lirp(start, control1, t);
	var side2 = lirp(control1, control2, t);
	var side3 = lirp(control2, end, t);
	return lirp( lirp(side1, side2, t), lirp(side2, side3, t), t );
}

function countLineIntersections(start, end, x, y){
	var yMin = Math.min(start[1], end[1]);
	var yMax = Math.max(start[1], end[1]);
	if( (y < yMin) || (y > yMax) ){
		return 0;
	}
	var t = (y-start[1])/(end[1]-start[1]);
	if( x < start[0] + t*(end[0]-start[0]) ){
		return 1;
	}
	return 0;
}

function initPath(){
	paths = [
		new Path( "Path 1", "rgb(100, 135, 200)", [
			[100,100], 
			[140,100], [140,120], [140,140],
			[140,160], [120,180], [100,180],
			[80, 180], [60, 160], [60, 140],
			[60, 120], [80, 100]
		], true, false),
		new Path( "Path 2", "rgb(240, 190, 210)", [
			[150, 100],
			[200, 50], [300, 100], [200, 200],
			[100, 300], [100, 150]
		], true, false),
		new Path( "Path 3", "rgb(100, 100, 250)", [
			[300, 100],
			[500, 200], [600, 300], [500, 400],
			[200, 500], [100, 400], [50, 200],
			[150, 100], [200, 200]
		], true, false),
		new Path( "Path 4", "rgb(0, 250, 185)", [
			[50, 50],
			[150, 50], [200, 20], [250, 15],
			[250, 200], [100, 200] 
		], true, false)
	];
	
	for( var i = 0; i < paths.length; i++ ){
		var path = paths[i];
		addLayer(path);
	}
}


var tween = 0.5;
var velocity = 0.01;

function repaint() {
	console.log("repaint");
	canvas.width = canvas.width;
	
	for( var i = 0; i < paths.length; i++ ){
		var path = paths[i];
		if( !path.visible ){
			continue;
		}
		var pathData = path.data;
		
		context.beginPath();
		if( !path.outline ){
			context.fillStyle = path.fillColor;
		}
		context.moveTo(pathData[0][0], pathData[0][1]);
		var index = 1;
		while( index + 3 < pathData.length ){
			traceBezier(context, pathData[index], pathData[index+1], pathData[index+2]);
			index += 3;
		}
		traceBezier(context, pathData[index], pathData[index+1], pathData[0])
		
		if( draggedPath === i ){
			context.strokeStyle = 'rgb(255, 0, 0)';
		}else{
			context.strokeStyle = path.outline ? path.fillColor : 'rgb(0,0,0);';
		}

		context.stroke();
		if( !path.outline ){
			context.fill(path.fillColor);
		}
		
		index = 0;
		while( index + 3 < pathData.length ){
			drawHandles(context, pathData[index], pathData[index+1], draggedPath === i, dragIndex === (index+1));
			drawHandles(context, pathData[index+3], pathData[index+2], draggedPath === i, dragIndex === (index+2));
			index += 3;
		}
		drawHandles(context, pathData[index], pathData[index+1], draggedPath === i, dragIndex === (index+1));
		drawHandles(context, pathData[0], pathData[index+2], draggedPath === i, dragIndex === (index+2));
	
		index = 0;
		while( index < pathData.length ){
			drawCircle( pathData[index], draggedPath === i, dragIndex === (index) );
			index += 3;
		}
	}
}

function onInputBegin(event){
	event.preventDefault();
	// test for collisions
	for( var j = paths.length - 1; j >= 0; j-- ){
		var path = paths[j];
		if( !path.visible ){
			continue;
		}
		var pathData = path.data;

		var i;
		for( i = 0; i < pathData.length; i+=3 ){
			var dx = (pathData[i][0] - event.offsetX);
			var dy = (pathData[i][1] - event.offsetY);
			if( (dx*dx + dy*dy) < KNOB_RADIUS_SQUARED ){
				draggedPath = j;
				dragIndex = i;
				canvasNode.addEventListener("mousemove", onEndpointDrag);
				document.addEventListener("mouseup", onEndpointDragComplete);
				requestAnimationFrame(repaint);
				return;
			}
		}
	
		i = 0;
		while( i < pathData.length ){
			var dx = (pathData[i+1][0] - event.offsetX);
			var dy = (pathData[i+1][1] - event.offsetY);
			if( (dx*dx + dy*dy) < KNOB_RADIUS_SQUARED ){
				draggedPath = j;
				dragIndex = i+1;
				endpointIndex = i;
				oppositeControlIndex = i > 0 ? i - 1 : pathData.length - 1;
				canvasNode.addEventListener("mousemove", onControlPointDrag);
				document.addEventListener("mouseup", onControlPointDragComplete);
				requestAnimationFrame(repaint);
				return;
			}
		
			dx = (pathData[i+2][0] - event.offsetX);
			dy = (pathData[i+2][1] - event.offsetY);
			if( (dx*dx + dy*dy) < KNOB_RADIUS_SQUARED ){
				draggedPath = j;
				dragIndex = i+2;
				endpointIndex = (i+3) < pathData.length ? (i+3) : 0;
				oppositeControlIndex = (i+4) < pathData.length ? (i+4) : 1;
				canvasNode.addEventListener("mousemove", onControlPointDrag);
				document.addEventListener("mouseup", onControlPointDragComplete);
				requestAnimationFrame(repaint);
				return;
			}
			i += 3;
		}
		
		if( path.contains(event.offsetX, event.offsetY) ){
			draggedPath = j;
			dragIndex = -1;
			selectedLayerByIndex(draggedPath);
			pathDragOffsetX = (event.offsetX - pathData[0][0]);
			pathDragOffsetY = (event.offsetY - pathData[0][1]);
			canvasNode.addEventListener("mousemove", onPathDragged);
			document.addEventListener("mouseup", onPathDragComplete);
			requestAnimationFrame(repaint);
			return;
		}
	}
}
function onPathDragged(event){
	path = paths[draggedPath];
	var pathData = path.data;
	var dx = (event.offsetX - pathData[0][0]) - pathDragOffsetX;
	var dy = (event.offsetY - pathData[0][1]) - pathDragOffsetY;
	
	for( var i = 0; i < pathData.length; i++ ){
		pathData[i][0] += dx;
		pathData[i][1] += dy;
	}
	
	requestAnimationFrame(repaint);
}
function onPathDragComplete(event){
	canvasNode.removeEventListener("mousemove", onPathDragged);
	document.removeEventListener("mouseup", onPathDragComplete);
}

function onEndpointDrag(event){
	var path = paths[draggedPath];
	var pathData = path.data;
	var dx = event.offsetX - pathData[dragIndex][0];
	var dy = event.offsetY - pathData[dragIndex][1];
	
	pathData[dragIndex][0] = event.offsetX;
	pathData[dragIndex][1] = event.offsetY;
	
	var prevIndex = dragIndex > 0 ? dragIndex - 1 : pathData.length - 1;
	var nextIndex = (dragIndex + 1) < pathData.length ? dragIndex + 1 : 0;
	
	pathData[prevIndex][0] += dx;
	pathData[prevIndex][1] += dy;
	
	pathData[nextIndex][0] += dx;
	pathData[nextIndex][1] += dy;
	
	requestAnimationFrame(repaint);
}
function onEndpointDragComplete(event){
	canvasNode.removeEventListener("mousemove", onEndpointDrag);
	document.removeEventListener("mouseup", onEndpointDragComplete);
}
function onControlPointDrag(event){
	var path = paths[draggedPath];
	var pathData = path.data;
	var dx = event.offsetX - pathData[dragIndex][0];
	var dy = event.offsetY - pathData[dragIndex][1];
	
	pathData[dragIndex][0] = event.offsetX;
	pathData[dragIndex][1] = event.offsetY;
	
	if( !event.altKey ){
		pathData[oppositeControlIndex][0] = pathData[endpointIndex][0] - (pathData[dragIndex][0] - pathData[endpointIndex][0]);
		pathData[oppositeControlIndex][1] = pathData[endpointIndex][1] - (pathData[dragIndex][1] - pathData[endpointIndex][1]);
	}
	requestAnimationFrame(repaint);
}
function onControlPointDragComplete(event){
	canvasNode.removeEventListener("mousemove", onControlPointDrag);
	document.removeEventListener("mouseup", onControlPointDragComplete);
}

function onKeyDown(event){
	if( event.keyCode == 8 ){
		event.preventDefault();
		if( draggedPath >= 0 ){
			if( dragIndex >= 0 ){
				deletePoint(draggedPath, dragIndex);
			}else{
				deleteLayer( draggedPath );
			}
		}
		
	}else{
		console.log( event.keyCode );
	}
}
function onKeyUp(event){
	//console.log( event.keyCode );
}

function onLoaded(){
	canvasNode = document.getElementById('canvas');
	context = canvasNode.getContext('2d');

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	
	canvasNode.addEventListener("mousedown", onInputBegin);
	
	document.addEventListener("keydown", onKeyDown);
	document.addEventListener("keydown", onKeyUp);
	
	initPath();
	repaint();
	
	document.getElementById("addLayerButton").addEventListener("click", onAddLayerButtonClicked);
	document.getElementById("deleteLayerButton").addEventListener("click", onDeleteLayerButtonClicked);
	
	document.getElementById("layers").addEventListener("click", onLayerGridClicked);
	
	canvasNode.addEventListener('dragover', handleDragOver, false);
	canvasNode.addEventListener('drop', handleDrop, false);
}

function deleteLayer(layerIndex){
	var path = paths[layerIndex];
	paths.splice(layerIndex, 1);
	
	var list = document.getElementById('layers').getElementsByClassName("layered");
	selectedLayer = list[layerIndex];
	selectedLayer.parentElement.removeChild( selectedLayer );
	selectedLayer = null;
	
	draggedPath = -1;
	dragIndex = -1;
	
	requestAnimationFrame(repaint);
}

function deletePoint(pathIndex, pointIndex){
	var path = paths[pathIndex];
	path.deletePointAt(pointIndex);
	
	requestAnimationFrame(repaint);
}

// Assumes that you have already called:
// context.beginPath(pathData[0][0], pathData[0][1]);
// context.moveTo()
function traceBezier(context, control1, control2, end){
	context.bezierCurveTo( control1[0], control1[1], control2[0], control2[1], end[0], end[1] );
}

// No assumptions made about context
function drawHandles(context, endpoint, controlPoint, pathSelected, endpointSelected){
	context.beginPath();
	context.moveTo( endpoint[0], endpoint[1] );
	context.lineTo( controlPoint[0], controlPoint[1] );
	var style = pathSelected ? (endpointSelected ? "rgb(0,0,255)" : "rgb(255,0,0)") : "rgb(0,0,0)";
	context.fillStyle = style;
	context.strokeStyle = style;
	context.stroke();

	drawCircle(controlPoint, pathSelected, endpointSelected)
}

function drawCircle( pt, pathSelected, endpointSelected ){
	context.beginPath();
	context.arc( pt[0], pt[1], KNOB_RADIUS, 0, TWO_PI );
	var style = pathSelected ? (endpointSelected ? "rgb(0,0,255)" : "rgb(255,0,0)") : "rgb(0,0,0)";
	context.fillStyle = style;
	context.fill();
}
