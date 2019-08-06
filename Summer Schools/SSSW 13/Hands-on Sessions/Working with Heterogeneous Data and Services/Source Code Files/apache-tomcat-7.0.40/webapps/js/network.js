
// DURING INIT  - global variable

var colorhash = {};



//showNetwork(userField,networkRelation,"prop","<http://dbpedia.org/resource/Tim_Berners-Lee>");


function sparqlQuery(query, baseURL, format) {
		if(!format)
		format="application/jsonp";
	var params={
		"default-graph": "", "should-sponge": "soft", "query": query,
		"debug": "on", "timeout": "", "format": format,
		"save": "display", "fname": ""
	};
	
	var querypart="";
	for(var k in params) {
		querypart+=k+"="+encodeURIComponent(params[k])+"&";
	}
	var queryURL=baseURL + '?' + querypart;
	if (window.XMLHttpRequest) {
	xmlhttp=new XMLHttpRequest();
}
else {
	xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
}
xmlhttp.open("GET",queryURL,false);
xmlhttp.send();
return JSON.parse(xmlhttp.responseText);
}


function getColor(rel){
	console.log(colorhash);
	if (colorhash[rel] == undefined) {
		var reds = Math.floor((Math.random()*250)+1);
		var blues = Math.floor((Math.random()*250)+1);
		var greens = Math.floor((Math.random()*250)+1);		
		var col = "rgb("+reds+","+greens+","+blues+")";
		colorhash[rel]=col;
		return col;
	}
	else return colorhash[rel];
}


function showRelationList (divContainer,dsn,query,relationproperty, resource){
    var data=sparqlQuery(query,dsn, "json");
    var results= data.results.bindings;
    var headvariables = data.head.vars;
    var jsonobj = [];
    var adj=[];

    var elem= document.getElementById(divContainer);
    displ= resource.replace(/(\<|\>)/gm,"");
    var finalStr="relations for element: "+ displ+ "<br/>";
    for (var i=0;i<results.length;i++){
        var res = results[i];
        console.log(res[relationproperty].value);
        finalStr= finalStr+"<br/>"+(res[relationproperty].value+': '+res.conceptname.value);
    }
    elem.innerHTML=finalStr;

}

function showSemanticNetwork(divContainer,dsn,query,relationproperty, resource){
	var data=sparqlQuery(query,dsn, "json");
	var results= data.results.bindings;
	var headvariables = data.head.vars;

	var jsonobj = [];
	var adj=[];
	for (var i=0;i<results.length;i++){
		var res = results[i];
		console.log(res[relationproperty].value);
		var relationcolor = getColor(res[relationproperty].value);
		adj.push({"nodeTo":res[relationproperty].value+': '+res.conceptname.value,"nodeFrom":resource,"data":{"$color":relationcolor}});
	}
	if (adj.length>0){
               var theresource={};
               theresource["adjacencies"]=adj;
               theresource["id"]=resource;
               theresource["name"]=resource;
               theresource["data"]={
                   "$color": "#416D9C",
                   "$type": "circle",
                   "$dim": 7
               };
               jsonobj.push(theresource);
           }

	var fd = new $jit.ForceDirected({
    	injectInto: divContainer,
	          Navigation: {
       	enable: true,
	            panning: 'avoid nodes',
       zooming: 10 //zoom speed. higher is more sensible
     },
     // Change node and edge styles such as
     // color and width.
     // These properties are also set per node
     // with dollar prefixed data-properties in the
     // JSON structure.
     Node: {
       overridable: true
     },
     Edge: {
       overridable: true,
       color: '#23A4FF',
       lineWidth: 0.6
     },
     //Native canvas text styling
     Label: {
            overridable:true,
            type: "Native", //Native or HTML
            size: 10,
            color:'black',
            style: 'bold'
          },
     //Add Tips
     Tips: {
       enable: true,
       onShow: function(tip, node) {
         //count connections
         var count = 0;
         node.eachAdjacency(function() { count++; });
         //display node info in tooltip
         tip.innerHTML = "<div class=\"tip-title\">" + node.name + "</div>"
           + "<div class=\"tip-text\"><b>connections:</b> " + count + "</div>";
       }
     },
     // Add node events
     Events: {
       enable: true,
       type: 'Native',
       //Change cursor style when hovering a node
       onMouseEnter: function() {
         fd.canvas.getElement().style.cursor = 'move';
       },
       onMouseLeave: function() {
         fd.canvas.getElement().style.cursor = '';
       },
       //Update node positions when dragged
       onDragMove: function(node, eventInfo, e) {
           var pos = eventInfo.getPos();
           node.pos.setc(pos.x, pos.y);
           fd.plot();
       },
       //Implement the same handler for touchscreens
       onTouchMove: function(node, eventInfo, e) {
         $jit.util.event.stop(e); //stop default touchmove event
         this.onDragMove(node, eventInfo, e);
       },
       //Add also a click handler to nodes
       onClick: function(node) {
         if(!node) return;
         // Build the right column relations list.
         // This is done by traversing the clicked node connections.
         var html = "<h4>" + node.name + "</h4><b> connections:</b><ul><li>",
             list = [];
         node.eachAdjacency(function(adj){
           list.push(adj.nodeTo.name);
         });
         //append connections information
         $jit.id('inner-details').innerHTML = html + list.join("</li><li>") + "</li></ul>";
       }
     },
     //Number of iterations for the FD algorithm
     iterations: 200,
     //Edge length
     levelDistance: 130,
     // Add text to the labels. This method is only triggered
     // on label creation and only for DOM labels (not native canvas ones).
     onCreateLabel: function(domElement, node){
       domElement.innerHTML = node.name;
       var style = domElement.style;
       style.fontSize = "0.8em";
       style.color = "#ddd";
     },
     // Change node styles when DOM labels are placed
     // or moved.
     onPlaceLabel: function(domElement, node){
       var style = domElement.style;
       var left = parseInt(style.left);
       var top = parseInt(style.top);
       var w = domElement.offsetWidth;
       style.left = (left - w / 2) + 'px';
       style.top = (top + 10) + 'px';
       style.display = '';
     }
   });
   // load JSON data.
   fd.loadJSON(jsonobj);
   // compute positions incrementally and animate.
   fd.computeIncremental({
     iter: 40,
     property: 'end',
     onStep: function(perc){
//            Log.write(perc + '% loaded...');
     },
     onComplete: function(){
//            Log.write('done');
       fd.animate({
         modes: ['linear'],
         transition: $jit.Trans.Elastic.easeOut,
         duration: 2500
       });
     }
   });

}
