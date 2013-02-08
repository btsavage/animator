window.onload = onLoaded;


const KNOB_RADIUS = 5;
const KNOB_RADIUS_SQUARED = KNOB_RADIUS*KNOB_RADIUS;
const TWO_PI = 2*Math.PI;

var dragIndex;
var draggedPath;
var endpointIndex;
var oppositeControlIndex;
var pathDragOffsetX;
var pathDragOffsetY;

var canvasNode;
var context;
var paths;

var snapshots = [];

function Path(name, fillColor, data, outline){
	this.name = name;
	this.fillColor = fillColor;
	this.data = data;
	this.outline = false;
}

Path.prototype = {
	contains: function contains(x, y){
		var totalIntersections = 0;
		for( var i = 0; i < this.data.length; i+= 3 ){
			totalIntersections += countCubicBezierIntersections(this.data[i], this.data[i+1], this.data[i+2], this.data[(i+3)%this.data.length], x, y);
		}
		return (totalIntersections % 2) == 1;
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
		], false),
		new Path( "Path 2", "rgb(240, 190, 210)", [
			[150, 100],
			[200, 50], [300, 100], [200, 200],
			[100, 300], [100, 150]
		], false),
		new Path( "Path 3", "rgb(100, 100, 250)", [
			[300, 100],
			[500, 200], [600, 300], [500, 400],
			[200, 500], [100, 400], [50, 200],
			[150, 100], [200, 200]
		], false),
		new Path( "Path 4", "rgb(0, 250, 185)", [
			[50, 50],
			[150, 50], [200, 20], [250, 15],
			[250, 200], [100, 200] 
		], false)
	];
	
	for( var i = 0; i < paths.length; i++ ){
		var path = paths[i];
		var layer = document.createElement("div");
		layer.classList.add("layered");
		layer.style.backgroundColor = path.fillColor;
		
		var hideButton = document.createElement("input");
		hideButton.type = "button";
		hideButton.value = "Hide";
		hideButton.style.float = "left";
		layer.appendChild(hideButton);
		
		var outlineButton = document.createElement("input");
		outlineButton.type = "button";
		outlineButton.value = "Outline";
		outlineButton.style.float = "left";
		layer.appendChild(outlineButton);
		listenForOutlineButtonClick(path, outlineButton);
		
		var pathNameInput = document.createElement("input");
		pathNameInput.type = "text";
		pathNameInput.value = path.name;
		pathNameInput.style.float = "left";
		pathNameInput.style.display = "none";
		layer.appendChild(pathNameInput);
		
		var pathNameLabel = document.createElement("label");
		pathNameLabel.textContent = path.name;
		pathNameLabel.style.float = "left";
		layer.appendChild(pathNameLabel);
		listenForPathNameLabelClick(path, pathNameLabel, pathNameInput);
		
		//layer.innerHTML = "<div><input style='float:left' type='button' value='Hide'/><p style='float:left'>" + path.name + "</p></div>"
//		layer.textContent = path.name;
		listenForIndexChanges(layer, path)
		
		document.getElementById('layers').appendChild(layer)
	}
}

function listenForOutlineButtonClick(path, button){
	button.addEventListener("click", function(e){
		path.outline = !path.outline;
		button.value = path.outline ? "Filled" : "Outline";
		requestAnimationFrame(repaint);
	})
}

function listenForPathNameLabelClick(path, label, input){
	input.addEventListener("change", function(e){
		path.name = input.value;
		label.textContent = path.name;
		console.log("Name changed to: " + path.name);
		input.style.display = "none";
		label.style.display = "block";
	})
	
	input.addEventListener("blur", function(e){
		input.style.display = "none";
		label.style.display = "block";
	})
	
	label.addEventListener("click", function(e){
		input.style.display = "block";
		label.style.display = "none";
		input.focus();
		input.select();
	})
}

function listenForIndexChanges(layer, path){
	layer.addEventListener( "indexUpdated", function(e){
		var layerIndex = 0;
		var temp = previousDiv(layer);
		while( temp != null ){
			layerIndex += 1;
			temp = previousDiv(temp);
		}
		
		var idx = paths.indexOf(path);
		paths.splice(idx, 1);
		paths.splice(layerIndex, 0, path);
		requestAnimationFrame(repaint);
	})
}

function savePosition( x ){
	throw new Error("out of date");
	/*
	var snapshot = [];
	for( var i = 0; i < path.length; i++ ){
		snapshot[i] = path[i].slice(0);
	}
	snapshots[x] = snapshot;
	*/
}

var tween = 0.5;
var velocity = 0.01;
function play(){
	throw new Error("out of date");
	/*
	for(var i = 0; i < path.length; i++){
		path[i][0] = snapshots[0][i][0]*tween + snapshots[1][i][0]*(1-tween);
		path[i][1] = snapshots[0][i][1]*tween + snapshots[1][i][1]*(1-tween);
	}
	tween += velocity;
	if( tween >= 1 ){
		tween = 1;
		velocity *= -1;
	}
	if( tween <= 0 ){
		tween = 0;
		velocity *= -1;
	}
	repaint();
	requestAnimationFrame(play);
	*/
}

function repaint() {
	console.log("repaint");
	canvas.width = canvas.width;
	
	for( var i = 0; i < paths.length; i++ ){
		var path = paths[i];
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

		context.strokeStyle = path.outline ? path.fillColor : 'rgb(0,0,0);';

		context.stroke();
		if( !path.outline ){
			context.fill(path.fillColor);
		}
		
		if( path.outline ){
			continue;
		}
		
		context.fillStyle = "rgb(0,0,0)";
		index = 0;
		while( index + 3 < pathData.length ){
			drawHandles(context, pathData[index], pathData[index+1]);
			drawHandles(context, pathData[index+3], pathData[index+2]);
			index += 3;
		}
		drawHandles(context, pathData[index], pathData[index+1]);
		drawHandles(context, pathData[0], pathData[index+2]);
	
		index = 0;
		while( index < pathData.length ){
			drawCircle( pathData[index] );
			index += 3;
		}
	}
}

function onInputBegin(event){
	// test for collisions
	for( var j = paths.length - 1; j >= 0; j-- ){
		var path = paths[j];
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
				return;
			}
			i += 3;
		}
		
		if( path.contains(event.offsetX, event.offsetY) ){
			draggedPath = j;
			pathDragOffsetX = (event.offsetX - pathData[0][0]);
			pathDragOffsetY = (event.offsetY - pathData[0][1]);
			canvasNode.addEventListener("mousemove", onPathDragged);
			document.addEventListener("mouseup", onPathDragComplete);
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
	
	pathData[oppositeControlIndex][0] = pathData[endpointIndex][0] - (pathData[dragIndex][0] - pathData[endpointIndex][0]);
	pathData[oppositeControlIndex][1] = pathData[endpointIndex][1] - (pathData[dragIndex][1] - pathData[endpointIndex][1]);
	
	requestAnimationFrame(repaint);
}
function onControlPointDragComplete(event){
	canvasNode.removeEventListener("mousemove", onControlPointDrag);
	document.removeEventListener("mouseup", onControlPointDragComplete);
}

function onKeyDown(event){
	if( event.keyCode == 49 ){
		savePosition(0);
	}else if( event.keyCode == 50 ){
		savePosition(1);
	}else if( event.keyCode == 32 ){
		play();
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
	
	window.addEventListener("keydown", onKeyDown);
	window.addEventListener("keydown", onKeyUp);
	
	initPath();
	repaint();
	
	doLayersInit();
}

// Assumes that you have already called:
// context.beginPath(pathData[0][0], pathData[0][1]);
// context.moveTo()
function traceBezier(context, control1, control2, end){
	context.bezierCurveTo( control1[0], control1[1], control2[0], control2[1], end[0], end[1] );
}

// No assumptions made about context
function drawHandles(context, endpoint, controlPoint){
	context.beginPath();
	context.moveTo( endpoint[0], endpoint[1] );
	context.lineTo( controlPoint[0], controlPoint[1] );
	context.strokeStyle = 'rgb(0,0,0);';
	context.stroke();

	drawCircle(controlPoint)
}

function drawCircle( pt ){
	context.beginPath();
	context.arc( pt[0], pt[1], KNOB_RADIUS, 0, TWO_PI );
	context.fill();
}


//Layers

function doLayersInit(){
	var layersContainer = document.getElementById("layers");
	var layers = layersContainer.children;
	for( var i = 0; i < layers.length; i++ ){
		var layer = layers.item(i);
		layer.addEventListener("mousedown", onLayerMouseDown);		
	}
}

var draggedLayer;
function onLayerMouseDown(event){
	draggedLayer = event.target;
	
	document.addEventListener("mousemove", onLayerDrag);
	document.addEventListener("mouseup", onLayerDragEnd);
}

function previousDiv( layer ){
	var temp = layer.previousSibling;
	while( true ){
		if( !temp ){
			return null;
		}
		if(temp instanceof HTMLDivElement){
			return temp;
		}
		temp = temp.previousSibling;
	}
	return temp;
}

function nextDiv( layer ){
	var temp = layer.nextSibling;
	while( true ){
		if( !temp ){
			return null;
		}
		if(temp instanceof HTMLDivElement){
			return temp;
		}
		temp = temp.nextSibling;
	}
	return temp;
}


function onLayerDrag(event){
	var above = previousDiv(draggedLayer);
	var insertionIndex = null;
	while( above && event.y < above.getBoundingClientRect().bottom ){
		insertionIndex = above;
		above = previousDiv(above);
	}
	
	if( insertionIndex ){
		draggedLayer.parentElement.insertBefore(draggedLayer, insertionIndex);
		draggedLayer.dispatchEvent( new Event("indexUpdated") );
		return;
	}
	
	var below = nextDiv(draggedLayer);
	while( below && event.y > below.getBoundingClientRect().top ){
		insertionIndex = below;
		below = nextDiv(below);
	}
	
	if( insertionIndex ){
		draggedLayer.parentElement.insertBefore(draggedLayer, insertionIndex.nextSibling);
		draggedLayer.dispatchEvent( new Event("indexUpdated") );
	}
}

function onLayerDragEnd(event){
	var layer = event.target;
	
	document.removeEventListener("mousemove", onLayerDrag);
	document.removeEventListener("mouseup", onLayerDragEnd);
}