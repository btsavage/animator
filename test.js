window.onload = onLoaded;


const KNOB_RADIUS = 5;
const KNOB_RADIUS_SQUARED = KNOB_RADIUS*KNOB_RADIUS;
const TWO_PI = 2*Math.PI;

var dragIndex;
var draggedPath;
var endpointIndex;
var oppositeControlIndex;

var canvasNode;
var context;
var paths;

var snapshots = [];

function Path(fillColor, data){
	this.fillColor = fillColor;
	this.data = data;
}

function initPath(){
	paths = [
		new Path( "rgb(100, 135, 200)", [
			[100,100], 
			[140,100], [140,120], [140,140],
			[140,160], [120,180], [100,180],
			[80, 180], [60, 160], [60, 140],
			[60, 120], [80, 100]
		]),
		new Path( "rgb(240, 190, 210)", [
			[150, 100],
			[180, 100], [200, 120], [200, 140],
			[200, 160], [180, 140]
		])
	];
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
		context.fillStyle = path.fillColor;
		context.moveTo(pathData[0][0], pathData[0][1]);
		var index = 1;
		while( index + 3 < pathData.length ){
			traceBezier(context, pathData[index], pathData[index+1], pathData[index+2]);
			index += 3;
		}
		traceBezier(context, pathData[index], pathData[index+1], pathData[0])
		context.strokeStyle = 'rgb(0,0,0);';
		context.stroke();
		context.fill(path.fillColor);
	
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
	}
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
	console.log( event.keyCode );
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
		return;
	}
	
	var below = nextDiv(draggedLayer);
	while( below && event.y > below.getBoundingClientRect().top ){
		insertionIndex = below;
		below = nextDiv(below);
	}
	
	if( insertionIndex ){
		draggedLayer.parentElement.insertBefore(draggedLayer, insertionIndex.nextSibling);
	}
}

function onLayerDragEnd(event){
	var layer = event.target;
	
	document.removeEventListener("mousemove", onLayerDrag);
	document.removeEventListener("mouseup", onLayerDragEnd);
}