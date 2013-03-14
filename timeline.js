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
//	pathNameInput.classList.add("unselectable");
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