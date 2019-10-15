/* Main.js by O. Badajos, 2019 */


//----------calculate the radius of each proportional symbol----------
function calcPropRadius(attValue) {
    //scale factor to adjust symbol size evenly
    var scaleFactor = 0.001;
    //area based on attribute value and scale factor
    var area = attValue * scaleFactor;
    //radius calculated based on area
    var radius = Math.sqrt(area/Math.PI);

    return radius; 
};

//----------Calculate the max, mean, and min values for a given attribute----------
function getCircleValues(map, attribute){
    //start with min at highest possible and max at lowest possible number
    var min = 100000,
        max = -Infinity;

    map.eachLayer(function(layer){
        //get the attribute value
        if (layer.feature){
            var attributeValue = Number(layer.feature.properties[attribute]);

            /*//test for min
            if (attributeValue < min){
                min = attributeValue +1;
            };*/

            //test for max
            if (attributeValue > max){
                max = attributeValue;
            };
        };
    });

    //set mean
    var mean = (max + min) / 2;
    //console.log(mean);
    //console.log(max);
    //console.log(min)
    
    //return values as an object
    return {
        max: max,
        mean: mean,
        min: min
    };
};

//----------Update the legend with new attribute----------
function updateLegend(map, attribute){
    //create title
    var titleText = '<h2> Number of Immigrants Entering Each Country In: ' + attribute + '</h2>';
    $('#map-title').html(titleText);
    
    //create title for legend
    var content = "Immigrants in " + attribute;
    
    //replace legend title
    $('#temporal-legend').html(content);
    //console.log(content)
    
    //get the max, mean, and min values as an object
    var circleValues = getCircleValues(map, attribute);

    for (var key in circleValues){
        //get the radius
        var radius = calcPropRadius(circleValues[key]);

        
        //Step 3: assign the cy and r attributes
        $('#'+key).attr({
            cy: 110 - radius,
            r: radius
        });
        
        //console.log(key)
        //add legend text
        $('#'+key+'-text').text((Math.round((circleValues[key]*100)/100)/1000000).toFixed(1) + " million");
    };
 };

//----------create the legend----------
function createLegend(map, attributes){
    var LegendControl = L.Control.extend({
        options: {
            position: 'bottomright'
        },

        onAdd: function (map) {
            // create the control container with a particular class name
            var container = L.DomUtil.create('div', 'legend-control-container');

            //add temporal legend div to container
            $(container).append('<div id="temporal-legend">')
            
            //Step 1: start attribute legend svg string
            var svg = '<svg id="attribute-legend" width="200px" height="120px">';
            
            //array of circle names to base loop on
            var circles = {
                max: 60,
                mean: 80,
                min: 100
            };

            //Step 2: loop to add each circle and text to svg string
            for (var circle in circles){
            //circle string
            svg += '<circle class="legend-circle" id="' + circle + '" fill="#ed6a5a" fill-opacity="0.8" stroke="#97443a" cx="55"/>';
           // #ed6a5a
            //text string
            svg += '<text id="' + circle + '-text" x="120" y="' + circles[circle] + '"></text>';
        };

            //close svg string
            svg += "</svg>";

            //add attribute legend svg to container
            $(container).append(svg);
            
            //kill any mouse event listeners on the map
            $(container).on('mousedown dblclick', function(e){
                L.DomEvent.stopPropagation(e);
            });
             
            //Disable dragging when user's cursor enters the element
            container.addEventListener('mouseover', function () {
                map.dragging.disable();
            });
             
            //Re-enable dragging when user's cursor leaves the element
            container.addEventListener('mouseout', function () {
                map.dragging.enable();
            });
            
            //console.log(attributes[1])
            return container;
        }
    });

    map.addControl(new LegendControl());
    
    updateLegend(map, attributes[0]);
};

//----------create the pop-ups----------
function createPopup(properties, attribute, layer, radius){
    //add city to popup content string
    var popupContent = "<p><b>Country:</b> " + properties["Country Name"] + "</p>";
    var over = (properties[attribute]/1000000).toFixed(1)
    var under = (properties[attribute])
    
    //format numbers in popup
    if (properties[attribute] == 1){
        popupContent += "<p><b>Immigrants  in " + attribute + ":</b> None</p>"; 
    }
    else if (properties[attribute]>=1000000){
        popupContent += "<p><b>" + attribute + ": </b>" +over+" million immigrants</p>"; 
        
    }
    else if (properties[attribute]<1000000){
        popupContent += "<p><b>" + attribute + ": </b>" +under.toLocaleString()+"  immigrants</p>"; 
    };                    
    //console.log(properties[attribute])
    
    //replace the layer popup
    layer.bindPopup(popupContent, {
        offset: new L.Point(0,-radius) 
    });
    
};
    
//----------Create new sequence controls----------
function createSequenceControls(map, attributes){   
    var SequenceControl = L.Control.extend({
        options: {
            position: 'bottomleft'
        },

         onAdd: function (map) {
            // create the control container with a particular class name
            var container = L.DomUtil.create('div', 'sequence-control-container');

            //create range input element (slider)
            $(container).append('<input class="range-slider" type="range">');
            
            //add skip buttons
            $(container).append('<button class="skip" id="reverse" title="Reverse">Reverse</button>');
            $(container).append('<button class="skip" id="forward" title="Forward">Skip</button>');
             
            //kill any mouse event listeners on the map
            $(container).on('mousedown dblclick', function(e){
                L.DomEvent.stopPropagation(e);
            });
             
            //Disable dragging when user's cursor enters the element
            container.addEventListener('mouseover', function () {
                map.dragging.disable();
            });
             
            //Re-enable dragging when user's cursor leaves the element
            container.addEventListener('mouseout', function () {
                map.dragging.enable();
            });
            //console.log(container)
            return container;
        }
    });

    map.addControl(new SequenceControl());
    
    //set slider attributes
    $('.range-slider').attr({
        max: 11,
        min: 0,
        value: 0, //start at this value
        step: 1 //move forward and back by this amt
    });
        
    //replace button content with images
    $('#reverse').html('<img src="img/reverse2_25.png">');
    $('#forward').html('<img src="img/forward2_25.png">');
    
    //click listener for buttons
    $('.skip').click(function(){
        //get the old index value
        var index = $('.range-slider').val();

        //increment or decrement depending on button clicked
        if ($(this).attr('id') == 'forward'){
            index++;
            
            //if past the last attribute, wrap around to first attribute
            index = index > 11 ? 0 : index;
        } else if ($(this).attr('id') == 'reverse'){
            index--;
            
            //if passed the first attribute, wrap around to last attribute
            index = index < 0 ? 11 : index;
        };
                
        //update slider
        $('.range-slider').val(index);
        console.log(index)
        console.log(attributes[index])
        //pass new attribute to update symbols
        
        updatePropSymbols(map, attributes[index]);
        updateLegend(map,attributes[index]);
    });
      
    //input listener for slider
    $('.range-slider').on('input', function(){
        //Step 6: get the new index value
        var index = $(this).val();
        console.log(index)
        
        //pass new attribute to update symbols
        updatePropSymbols(map, attributes[index]);
        updateLegend(map,attributes[index]);
    });
};

//----------Resize proportional symbols according to new attribute values----------
function updatePropSymbols(map, attribute){
    map.eachLayer(function(layer){
        if (layer.feature && layer.feature.properties[attribute]){
            //access feature properties
            var props = layer.feature.properties;
            
            //update each feature's radius based on new attribute values
            var radius = calcPropRadius(props[attribute]);
            layer.setRadius(radius);
            
            createPopup(props, attribute, layer, radius);
            
            //console.log(props[attribute])

            };
    });
};

//----------Add circle markers for point features to the map----------
function createPropSymbols(data, map, attributes){
    //Create title text
    var attribute = attributes[0];
    console.log(attributes[0])
    //create a Leaflet GeoJSON layer and add it to the map
    var myData =  L.layerGroup([]);
    
    var netMig = L.geoJson(data, {
         
       pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes);         
       }        
    });
    /*.addTo(map)*/;
    
    var myData =  L.layerGroup([]);
    myData.addLayer(netMig);
    myData.addTo(map); 
    IncomeSelect(myData, map);    
    /*console.log(attribute);*/
    return attribute; 
    return myData;
    
    //----------filter attempt--------------------
    function IncomeSelect(myData, map) {
    $("#IncomeGroup").change(function() {
     var choice = $("input[name=fltIncome]:checked").val()
 
//-----Add if/else here? to turn off filter and display all data 
//--------------.off("change")---------------------------------------------------------------------------------------------------------------     
     
        myData.clearLayers();
        map.removeLayer(myData);

        var netMig = L.geoJson(null, {

        pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes);
        },
        filter: function(feature, layer) {   
                    return (feature.properties.IncomeGroup == choice);
                },
        });

        // Get GeoJSON data and create features.

        $.getJSON(url, function(data) {
                netMig.addData(data);
        });

        myData.addLayer(netMig);
        myData.addTo(map); 
        });
    
    console.log(myData)
    };
};



//----------function to convert markers to circle markers----------
function pointToLayer(feature, latlng, attributes){
    //Assign the current attribute based on the first index of the attributes array
    var attribute = attributes[0];
    //check
    //console.log(attributes);
    
    //create marker options
    var options = {
        fillColor: "#ed6a5a",
        color: "#97443a",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };
    
    //For each feature, determine its value for the selected attribute
    var attValue = Number(feature.properties[attribute]);
    
    options.radius = calcPropRadius(attValue);

    //create circle marker layer
    var layer = L.circleMarker(latlng, options);
    
    createPopup(feature.properties, attribute, layer, options.radius);

    //return the circle marker to the L.geoJson pointToLayer option
    //console.log(layer)
    //console.log(feature.properties.IncomeGroup)
    return layer;
};



//----------build attribute arrays----------
function processData(data){
    //empty array to hold attributes
    var attributes = [];
    var properties = data.features[0].properties;
    //console.log(properties);
    
    //properties of the first feature in the dataset (0=first row)
    console.log(properties);
   
    //push each attribute name into attributes array
    for (var attribute in properties){
        attributes.push(attribute)
        /*if (attribute.indexOf("2" && "1") > -1){
            attributes.push(attribute);
        }
        else {
            attributes.push(attribute);*/
        /*};*/
    };

    //should return a list of 10 years [1962...2017]
    console.log(attributes)
    return attributes;  
};

//----------Import GeoJSON data; call processData; createPropSymbols; sequenceControls, Legend----------
/*var url = 'data/ImmPos.geojson';*/
function getData(map){
    //load the data
    $.ajax(url, {
        dataType: "json",
        success: function(response){
            //create an attributes array
            var attributes = processData(response);
            
            createPropSymbols(response, map, attributes);
            createSequenceControls(map, attributes);
            createLegend(map, attributes);
        }
    });  
};

//----------Create the map, call the data----------
function createMap(){
    //create the map
    var map = L.map('map', {
        center: [20, 0],
        zoom: 2,
        maxZoom: 10
    });

    //add OSM base tilelayer
    var osm = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(map);
    
    //Toner basemap
    var toner = L.tileLayer("http://tile.stamen.com/toner/{z}/{x}/{y}.png", {
        attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>.'
    });
    
    var baseMaps = {
        "Open Street Map": osm,
        "Toner": toner
    }
    
    //call getData function
    getData(map);
};

var url = 'data/ImmPos.geojson';  
//----------jquery method ready() makes sure entire page has loaded----------
$(document).ready(createMap);