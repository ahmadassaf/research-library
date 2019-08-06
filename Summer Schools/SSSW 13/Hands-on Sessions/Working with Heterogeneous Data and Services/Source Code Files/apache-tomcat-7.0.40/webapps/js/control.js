var solrUrl = "http://192.168.10.171:8983/solr/tweets/select";
var pieField = "hashtag";
var timeField = "createdate";
var timelineFacet = "hashtag";
var barField = "user";
var networkRelation = "mentions";
var userField = "user";
var entityField = "entities";




function getPositionsOnMap(divContainer, field, value) {
    var query;
    if (field == 'everything')
        query = '*:*';
    else query= field + ':\"' + value + '\"';

    $.ajax({
        'url': solrUrl,
        'data': {'wt':'json','q':query,'rows':10000},
        'success': function(data) {
            var docs = data.response.docs;
            var finalArray = [];
            for (var docindex in docs) {
                var locList=docs[docindex].location;
                for (var locindex in locList){
                    if (locList[locindex] != "") {
                        var elem = [];
                        elem[0] = locList[locindex];
                        elem[1] = docs[docindex].user+ ': '+docs[docindex].content;
                        finalArray[finalArray.length] = elem;
                    }
                }
            }
            var latlngList = finalArray;
            var latlng = '0.0, 0.0';
            if ((latlngList.length!=0) && (latlngList[0].length!=0))
                    latlng = latlngList[0][0];

            var commaPos = latlng.indexOf(',');
            var coordinatesLat = parseFloat(latlng.substring(0, commaPos));
            var coordinatesLong = parseFloat(latlng.substring(commaPos + 1, latlng.length));

            var myOptions = {
                zoom: 4,
                center: new google.maps.LatLng(coordinatesLat, coordinatesLong),
                mapTypeId: google.maps.MapTypeId.ROADMAP
            };
            var map = new google.maps.Map(document.getElementById(divContainer), myOptions);


            if ((latlngList.length!=0)&&(latlngList[0].length!=0)) {
                for (ix = 0; ix < Math.min(latlngList.length, 200); ix++) {
                    latlng = latlngList[ix][0];
                    var commaPos = latlng.indexOf(',');
                    coordinatesLat = parseFloat(latlng.substring(0, commaPos));
                    coordinatesLong = parseFloat(latlng.substring(commaPos + 1, latlng.length));
                    var marker = new google.maps.Marker({
                        position: new google.maps.LatLng(coordinatesLat, coordinatesLong),
                        map: map,
//                        title: "hello"
                        title: latlngList[ix][1]
                    });
                }
            }

        },
//        'error': function(XHR, textStatus, errorThrown){
//            console.log("ERROR: " + textStatus + " : " + errorThrown);
//        },
        'dataType': 'jsonp',
        'jsonp': 'json.wrf'
    });
}


function listData(divContainer, field, value) {
    var query;
    if (field == 'everything')
        query = '*:*';
    else query = field + ':\"' + value + '\"';

    var htmlstring = "<ul>";
    $.ajax({
        'url': solrUrl,
        'data': {'wt':'json','q':query,'rows':100},
        'success': function(data) {
            var docs = data.response.docs;
            for (var docindex in docs) {
                htmlstring += "<li><span style = 'color:blue'>" + docs[docindex].user + "</span>:" + docs[docindex].content + "</li>";
            }
            htmlstring += "</ul>";
            document.getElementById(divContainer).innerHTML = htmlstring;
        },
        'dataType': 'jsonp',
        'jsonp': 'json.wrf'
    });

}

function showDetails(field, itsvalue) {
    var query;
    if (field == 'everything')
        query = '*:*';
    else query = field + ':\"' + itsvalue + '\"';

    var htmlstring = "<ul>";
    $.ajax({
        'url': solrUrl,
        'data': {'wt':'json','q':query,'fq':field + ':\"' + itsvalue + '\"','rows':100},
        'success': function(data) {
            var docs = data.response.docs;
            for (var docindex in docs) {
                htmlstring += "<li><span style = 'color:blue'>" + docs[docindex].user + "</span>:" + docs[docindex].content + "</li>";
            }
            htmlstring += "</ul>";
            document.getElementById("container1").innerHTML = htmlstring;
            console.log(data);
        },
        'dataType': 'jsonp',
        'jsonp': 'json.wrf'
    });


}

function showNetwork(networkrelation, divContainer, userfield, value) {
//    $(divContainer).innerHTML="";
    var query;
    if (userfield == 'everything')
        query = '*:*';
    else query = userfield + ':\"' + value + '\"';

    $.ajax({
        'url': solrUrl,
        'data': {'wt':'json', 'facet':'true','q':query ,'facet.pivot':userfield + ',' + networkrelation,'facet.limit':10,'rows':10},
        'success': function(data) {
            console.log(data.facet_counts.facet_pivot[userfield + "," + networkrelation]);
            var connections = data.facet_counts.facet_pivot[userfield + "," + networkrelation];
            var jsonobj = [];
            for (var i = 0; i < connections.length; i++) {
                console.log(connections[i].value);
                var username = connections[i].value;
                var mentions = connections[i].pivot;
                var adj = [];
                for (var j = 0; j < mentions.length; j++) {
                    var usermentioned = mentions[j].value;
                    var timesmentioned = mentions[j].count;
                    adj.push({"nodeTo":usermentioned,"nodeFrom":username,"data":{"$color":"#557EAA"}});
                }
                if (adj.length > 0) {
                    var auser = {};
                    auser["adjacencies"] = adj;
                    auser["id"] = username;
                    auser["name"] = username;
                    auser["data"] = {
                        "$color": "#416D9C",
                        "$type": "circle",
                        "$dim": 7
                    };
                    jsonobj.push(auser);
                }
            }

            console.log(jsonobj)

            var fd = new $jit.ForceDirected({
                //id of the visualization container
                injectInto: divContainer,
                //Enable zooming and panning
                //by scrolling and DnD
                Navigation: {
                    enable: true,
                    //Enable panning events only if we're dragging the empty
                    //canvas (and not a node).
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
                    lineWidth: 0.4
                },
                //Native canvas text styling
                Label: {
                    type: "HTML", //Native or HTML
                    size: 10,
                    style: 'bold'
                },
                //Add Tips
                Tips: {
                    enable: true,
                    onShow: function(tip, node) {
                        //count connections
                        var count = 0;
                        node.eachAdjacency(function() {
                            count++;
                        });
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
                        if (!node) return;
                        // Build the right column relations list.
                        // This is done by traversing the clicked node connections.
                        var html = "<h4>" + node.name + "</h4><b> connections:</b><ul><li>", list = [];
                        node.eachAdjacency(function(adj) {
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
                onCreateLabel: function(domElement, node) {
                    domElement.innerHTML = node.name;
                    var style = domElement.style;
                    style.fontSize = "0.8em";
                    style.color = "#ddd";
                },
                // Change node styles when DOM labels are placed
                // or moved.
                onPlaceLabel: function(domElement, node) {
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
                onStep: function(perc) {
//            Log.write(perc + '% loaded...');
                },
                onComplete: function() {
//            Log.write('done');
                    fd.animate({
                        modes: ['linear'],
                        transition: $jit.Trans.Elastic.easeOut,
                        duration: 2500
                    });
                }
            });

        },
        'dataType': 'jsonp',
        'jsonp': 'json.wrf'
    });
}

var currentPieField;

function showPieChart(divContainer, what, field, value) {
    var query;
    if (field == 'everything')
        query = '*:*';
    else query = field + ':\"' + value + '\"';

    var piefield = what;
    var mincount=1;
    if (field=="keywords") mincount=10;
    currentPieField = what;
    $.ajax({
        'url': solrUrl,
        'data': {'wt':'json', 'facet':'true','q':query ,'facet.field':what,'facet.mincount':mincount,'facet.limit':1000,'rows':10000},
        'success': function(data) {
            var seriesdata = [];
            var allfields = data.facet_counts.facet_fields[piefield];
            for (var i = 0; i < allfields.length; i = i + 2) {
                var field = allfields[i];
                var value = allfields[i + 1];
                seriesdata.push([field,value]);
            }
            $(divContainer).highcharts({
                chart: {
                    plotBackgroundColor: null,
                    plotBorderWidth: null,
                    plotShadow: false
                },
                title: {
                    text: "plot of " + piefield
                },
                tooltip: {
                    pointFormat: '{series.name}: <b>{point.percentage}%</b>',
                    percentageDecimals: 1
                },
                plotOptions: {
                    pie: {
                        allowPointSelect: true,
                        cursor: 'pointer',
                        dataLabels: {
                            enabled: true,
                            color: '#000000',
                            connectorColor: '#000000',
                            formatter: function() {
                                return '<b>' + this.point.name + '</b>';
                            }
                        },
                        events: {
                            click: function(e) {
                                var value = e.point.name;
                                showDetails(currentPieField, value);
                                showBarChart('#container4', currentPieField, userField, value);
                                getPositionsOnMap('container3', currentPieField, value);
                                //normalise the value by removing the http form that causes problems to sparql

                                var dsn="http://dbpedia.org/sparql";
                                var query='PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>  PREFIX res: <http://dbpedia.org/resource/>  SELECT DISTINCT ?property ?uri ?conceptname WHERE  { <'+value+'> ?property ?uri .   ?uri  rdfs:label ?conceptname.    FILTER langMatches(lang(?conceptname ), \"EN\") }';
                                var propertyVar="property";
                                showRelationList('container5', dsn, query, propertyVar, value);
                            }
                        }
                    }
                },
                series: [
                    {
                        type: 'pie',
                        name: 'count',
                        data:seriesdata
                    }
                ]
            });

        },
        'dataType': 'jsonp',
        'jsonp': 'json.wrf'
    });
}


function showBarChart(container, what, field, value) {
    var piefield = what;
    var qq;
    if (value == '*')
        query = '*:*';
    else query = field + ':\"' + value + '\"';
    var mincount=1;
    if (field=="keywords") mincount=10;

    $.ajax({
        'url': solrUrl,
        'data': {'wt':'json', 'facet':'true','q':query,'facet.field':what,'facet.mincount':mincount,'facet.limit':15},
        'success': function(data) {
            var counts = [];
            var categories = [];
            var allfields = data.facet_counts.facet_fields[piefield];
            for (var i = 0; i < allfields.length; i = i + 2) {
                var term = allfields[i];
                var value = allfields[i + 1];
                categories.push(term);
                counts.push(value);
//                seriesdata.push([field,value]);

            }
            $(container).highcharts({
                chart: {
                    type: 'bar'
                },
                title: {
                    text: 'No. of tweets by ' + field
                },
                xAxis: {
                    categories: categories,
                    title: {
                        text: null
                    }
                },
                yAxis: {
                    min: 0,
                    title: {
                        text: 'No. of tweets',
                        align: 'high'
                    },
                    labels: {
                        overflow: 'justify'
                    }
                },
                tooltip: {
                    valueSuffix: ''
                },
                plotOptions: {
                    bar: {
                        dataLabels: {
                            enabled: true
                        },
                        events: {
                            click: function(e) {
                                var value = "\"" + e.point.category + "\"";
                                showDetails(barField, value);


                            }
                        }
                    }
                },
                legend: {
                    layout: 'vertical',
                    align: 'right',
                    verticalAlign: 'top',
                    x: -100,
                    y: 100,
                    floating: true,
                    borderWidth: 1,
                    backgroundColor: '#FFFFFF',
                    shadow: true
                },
                credits: {
                    enabled: false
                },
                series: [
                    {
                        name: field,
                        data: counts
                    }
                ]
            });

        },
        'dataType': 'jsonp',
        'jsonp': 'json.wrf'
    });
}


function showTimeline(divContainer, field, value) {
    if (value == '*')
        query = '*:*';
    else query = field + ':\"' + value + '\"';

    $.ajax({
        'url': "http://localhost:8983/solr/tweets/select?q="+query+"&wt=json&indent=true&facet=true&f.date_hour_tdt.facet.limit=15&facet.pivot=hashtag,createdate",
        'success': function(data) {
            var seriesOptions = [];
            var facetPivot = data.facet_counts.facet_pivot[timelineFacet + "," + timeField];
            var seriesIndex = 0;
            for (var facet in facetPivot) {
                var tagFacet = facetPivot[facet];
                var tag = tagFacet.value;
                var results = [];
                for (var pivot in tagFacet.pivot) {
                    var value = tagFacet.pivot[pivot].value;
                    var count = parseInt(tagFacet.pivot[pivot].count);
                    var myfacetDate = new Date(value);
                    if (Object.prototype.toString.call(myfacetDate) === "[object Date]") {
                        // it is a date
                        if (!isNaN(myfacetDate.getTime())) {
                            // date is valid
                            var myfacetDateUTC = Date.UTC(myfacetDate.getUTCFullYear(),
                                    myfacetDate.getUTCMonth(),
                                    myfacetDate.getUTCDate(),
                                    myfacetDate.getUTCHours(),
                                    myfacetDate.getUTCMinutes(),
                                    myfacetDate.getUTCSeconds());

                            results.push([myfacetDateUTC, count]);
                        }
                    }
                }
                seriesOptions[seriesIndex] = {
                    name:tag,
                    data:results,
                    type:'spline'
                };
                seriesIndex++;
            }
            var chart = new Highcharts.StockChart(
                    {
                        chart:{
                            renderTo:divContainer,
                            alignTicks:false,
                            height:550
                        },
                        xAxis:{
                            plotBands:[
                                {
                                    color:'white'
                                }
                            ],
                            events:{
                                setExtremes:function (e) {
                                }
                            }
                        },

                        yAxis:{
                            type:'logarithmic',
                            min:1,
                            plotLines:[
                                {
                                    value:0,
                                    width:2,
                                    color:'silver'
                                }
                            ]
                        },

                        legend:{
                            enabled:true,
                            align:'right',
                            backgroundColor:'#FCFFC5',
                            borderColor:'black',
                            borderWidth:2,
                            layout:'vertical',
                            verticalAlign:'top',
                            shadow:true
                        },

                        rangeSelector:{
                            enabled:1,
                            buttons:[], // Zoom buttons
                            inputBoxStyle:{
                                left:'80px',
                                top:this.plotTop - 25
                            },
                            inputStyle:{
                                width:'120px'
                            },
                            inputDateFormat:'%b %e, %Y %H:%M',
                            inputEditDateFormat:'%Y-%m-%d %H:%M'
                        },

                        tooltip:{
//                            pointFormat:"<span style=color:{series.color}>{series.name}</span>: <b>{point.y}</b> ({point.change}%)<br/>",
                            valueDecimals:0
                        },

                        series:seriesOptions,
                        plotOptions:{
                            series:{
                                events:{
                                    legendItemClick:function(event) {
                                        if (event.browserEvent && event.browserEvent.shiftKey) {
                                            var selected = this.index;
                                            var allSeries = this.chart.series;

                                            for (var i = 0; i < allSeries.length; i++) {
                                                allSeries[i].setVisible(selected == i, false);
                                            }
                                            return false;
                                        }
                                    }
                                }
                            }
                        }
                    }


            );

        },
        'dataType': 'jsonp',
        'jsonp': 'json.wrf'
    });

}