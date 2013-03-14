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