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

function listenForHideButtonClick(path, button){
	button.addEventListener("click", function(e){
		path.visible = !path.visible;
		button.value = path.visible ? "Hide" : "Show";
		requestAnimationFrame(repaint);
	});
}

function listenForOutlineButtonClick(path, button){
	button.addEventListener("click", function(e){
		path.outline = !path.outline;
		button.value = path.outline ? "Filled" : "Outline";
		requestAnimationFrame(repaint);
	});
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

function getElementIndexForTag(element, tag){
	var layerIndex = 0;
	var temp = previousSiblingOfTag(element, tag);
	while( temp != null ){
		layerIndex += 1;
		temp = previousSiblingOfTag(temp, tag);
	}
	return layerIndex;
}

function listenForIndexChanges(layer, path){
	layer.addEventListener( "indexUpdated", function(e){
		var layerIndex = getElementIndexForTag(layer, "TR");
		
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
			selectedLayerByIndex(draggedPath);
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
	
	document.getElementById("addLayerButton").addEventListener("click", onAddLayerButtonClicked);
	document.getElementById("deleteLayerButton").addEventListener("click", onDeleteLayerButtonClicked);
	
	document.getElementById("layers").addEventListener("click", onLayerGridClicked);
	
	canvasNode.addEventListener('dragover', handleDragOver, false);
	canvasNode.addEventListener('drop', handleDrop, false);
}

function handleDragOver(e){
	e.stopPropagation();
	e.preventDefault();
	e.dataTransfer.dropEffect = 'copy';
}

function handleDrop(e){
	e.stopPropagation();
	e.preventDefault();
	
	var files = e.dataTransfer.files;
	
	for( var i = 0; i < files.length; i++ ){
		var file = files[i];
		doFile( file );
	}
}

function doFile(file){
	console.log("doing: " + file);
	var reader = new FileReader();
	
	reader.onload = function(e){
		console.log("it loaded!");
		var imgNode = document.createElement("img");
		imgNode.src = e.target.result;
		imgNode.classList.add("relative");
		document.getElementById("workarea").insertBefore( imgNode, document.getElementById("canvas") );
	}
	
	reader.readAsDataURL(file);
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

function onDeleteLayerButtonClicked(e){
	if( !selectedLayer ){
		return;
	}
	var layerIndex = getElementIndexForTag( selectedLayer, "TR" );
	var path = paths[layerIndex];
	paths.splice(layerIndex, 1);
	
	selectedLayer.parentElement.removeChild( selectedLayer );
	selectedLayer = null;
	
	requestAnimationFrame(repaint);
}

function getRow( cell ){
	
}

function onLayerGridClicked(e){
	var frame = e.target;
	if( frame.tagName == "TH" ){
		console.log("nope");
		return;
	}
	if( frame instanceof HTMLTableCellElement ){
		var column = getElementIndexForTag(frame, HTMLTableCellElement);
		var row = getElementIndexForTag(frame.parentElement, "TR");
		console.log("row: ", row, "column: ", column);
		
		if( e.shiftKey && selectedCell ){
			selectRegion( selectedCell, frame );
		}else{
			makeCellSelected( frame );
		}
	}
}

function onAddLayerButtonClicked(e){
	var fillColor = "rgb(" + Math.floor(255*Math.random()) + "," + Math.floor(255*Math.random()) + "," + Math.floor(255*Math.random()) + ")";
	var path = new Path( "New Path", fillColor, [
		[100,100], 
		[120,100], [140,120], [140,140],
		[140,160], [120,180], [100,180],
		[80, 180], [60, 160], [60, 140],
		[60, 120], [80, 100]
	], true, false);
	paths.push(path);
	addLayer( path )
	requestAnimationFrame(repaint);
}

function addLayer(path){
	var layer = document.createElement("TR");
	layer.classList.add("layered");
	layer.classList.add("unselectable");

	var layerInfo = document.createElement("th");
	layerInfo.style.backgroundColor = path.fillColor;
	layer.appendChild(layerInfo);
	
	listenForLayerDragInteraction(path, layer, layerInfo);

	var hideButton = document.createElement("input");
	hideButton.classList.add("unselectable");
	hideButton.type = "button";
	hideButton.value = "Hide";
	hideButton.style.float = "left";
	layerInfo.appendChild(hideButton);
	listenForHideButtonClick(path, hideButton);

	var outlineButton = document.createElement("input");
	outlineButton.classList.add("unselectable");
	outlineButton.type = "button";
	outlineButton.value = "Outline";
	outlineButton.style.float = "left";
	layerInfo.appendChild(outlineButton);
	listenForOutlineButtonClick(path, outlineButton);

	var pathNameInput = document.createElement("input");
	pathNameInput.classList.add("unselectable");
	pathNameInput.type = "text";
	pathNameInput.value = path.name;
	pathNameInput.style.float = "left";
	pathNameInput.style.display = "none";
	layerInfo.appendChild(pathNameInput);

	var pathNameLabel = document.createElement("label");
	pathNameLabel.classList.add("unselectable");
	pathNameLabel.textContent = path.name;
	pathNameLabel.style.float = "left";
	layerInfo.appendChild(pathNameLabel);
	listenForPathNameLabelClick(path, pathNameLabel, pathNameInput);
	
	for( var i = 0; i < 100; i++ ){
		var frame = document.createElement("TD");
		layer.appendChild(frame);
	}

	listenForIndexChanges(layer, path)

	document.getElementById('layers').appendChild(layer)
}

function deselect(){
	if(selectedCell && selectedRegionEnd){
		var startColumn = getElementIndexForTag(selectedCell, "TD");
		var startRow = getElementIndexForTag(selectedCell.parentElement, "TR");
		
		var endColumn = getElementIndexForTag(selectedRegionEnd, "TD");
		var endRow = getElementIndexForTag(selectedRegionEnd.parentElement, "TR");
		
		var allLayers = document.getElementById("layers").getElementsByClassName("layered");
		for( var row = Math.min(startRow, endRow); row <= Math.max(startRow, endRow); row++ ){
			var tempRow = allLayers.item(row);
			var frames = tempRow.getElementsByTagName("TD");
			for( var column = Math.min(startColumn, endColumn); column <= Math.max(startColumn, endColumn); column++ ){
				var tempFrame = frames.item(column);
				tempFrame.classList.remove("selected");
			}
		}
	}
	else if(selectedCell){
		selectedCell.classList.remove("selected");
	}
}

function selectRegion(startCell, endCell){
	deselect();
	
	selectedRegionEnd = endCell;
	
	var startColumn = getElementIndexForTag(startCell, "TD");
	var startRow = getElementIndexForTag(startCell.parentElement, "TR");
	
	var endColumn = getElementIndexForTag(endCell, "TD");
	var endRow = getElementIndexForTag(endCell.parentElement, "TR");
	
	var allLayers = document.getElementById("layers").getElementsByClassName("layered");
	for( var row = 0; row <= allLayers.length; row++ ){
		var tempRow = allLayers.item(row);
		if( row < Math.min(startRow, endRow) || row > Math.max(startRow, endRow) ){
			tempRow.classList.remove("selected");
		}else{
			tempRow.classList.add("selected");
			var frames = tempRow.getElementsByTagName("TD");
			for( var column = Math.min(startColumn, endColumn); column <= Math.max(startColumn, endColumn); column++ ){
				var tempFrame = frames.item(column);
				tempFrame.classList.add("selected");
			}
		}
	}
}

function makeCellSelected(cell){
	deselect();

	selectedCell = cell;
	cell.classList.add("selected");
	
	makeLayerSelected(cell.parentElement);
}

function makeLayerSelected(layer){
	if(selectedLayer){
		selectedLayer.classList.remove("selected");
	}
	selectedLayer = layer;
	layer.classList.add("selected");
}

function selectedLayerByIndex(index){
	var list = document.getElementById('layers').getElementsByClassName("layered");
	makeLayerSelected(list[index]);
}

function listenForLayerDragInteraction(path, layer, draggableSection){
	draggableSection.addEventListener("mousedown", function(e){
		draggedLayer = layer;
		makeLayerSelected(layer);

		document.addEventListener("mousemove", onLayerDrag);
		document.addEventListener("mouseup", onLayerDragEnd);
	});
}

function previousSiblingOfTag( element, tag ){
	var temp = element.previousSibling;
	while( true ){
		if( !temp ){
			return null;
		}
		if(temp.tagName == tag){
			return temp;
		}
		temp = temp.previousSibling;
	}
	return temp;
}

function nextSiblingOfTag( element, tag ){
	var temp = element.nextSibling;
	while( true ){
		if( !temp ){
			return null;
		}
		if(temp.tagName == tag){
			return temp;
		}
		temp = temp.nextSibling;
	}
	return temp;
}


function onLayerDrag(event){
	var above = previousSiblingOfTag(draggedLayer, "TR");
	var insertionIndex = null;
	
	while( above && event.y < above.getBoundingClientRect().bottom ){
		console.log("bottom");
		insertionIndex = above;
		above = previousSiblingOfTag(above, "TR");
	}
	
	if( insertionIndex ){
		draggedLayer.parentElement.insertBefore(draggedLayer, insertionIndex);
		draggedLayer.dispatchEvent( new Event("indexUpdated") );
		return;
	}
	
	var below = nextSiblingOfTag(draggedLayer, "TR");
	while( below && event.y > below.getBoundingClientRect().top ){
		console.log("top");
		insertionIndex = below;
		below = nextSiblingOfTag(below, "TR");
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