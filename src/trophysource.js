/* trophysource

 (c) etienne benson
 		esbenson@gmail.com
 		www.etiennebenson.com

 free to use and distribute under GPLv3 license
 http://www.gnu.org/licenses/gpl.html
 
 maps of polar bear populations:
 	http://www.gpo.gov/fdsys/pkg/FR-1997-02-18/pdf/97-3954.pdf
 	http://www.ec.gc.ca/nature/default.asp?lang=En&n=F77294A3-1#_map2
 
 many thanks to federal register 2.0 and criticaljuncture for making 
 source data easily accessible.
	 federalregister.gov
	 https://github.com/criticaljuncture

 required libraries: 
	 	jquery
 		leaflet
 		jquery-ui
*/



// --------------------------------------------------------------------
window.onload = function () {
	var osm_url='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
	var trophy_json_url = "data/trophies.json";
	var zoom = 3; 
	var view_center = [64, -110];
	var tile_options = {attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
    					maxZoom: 18					}
	var marker_options = {riseOnHover:true}; // , icon:icon};

	// init map, add markers and population polygons
	var map = initMap(osm_url, tile_options, view_center, zoom);
	var polys = initPolys(map);
	var markers = initMarkers(map, polys, marker_options, trophy_json_url);
	
	return;
}


// --------------------------------------------------------------------
function initMap(osm_url, tile_options, view_center, zoom) {
	var map = L.map('map', {}).setView(view_center, zoom); //touchZoom:false, doubleClickZoom:false
	L.tileLayer(osm_url, tile_options).addTo(map);
	return map;
}

// --------------------------------------------------------------------
function initPolys(map) {
	var polys = [];
	var icon, icon_html;
	
	var point_list = [];
	var new_point, icon_html;	
	for (key in data) {
		point_list = []
		val = data[key];
		for (i = 0; i < val["points"].length; i++) {
			new_point = [val["points"][i][0], val["points"][i][1]];
			point_list.push(new_point);
		}
		polys.push(new L.Polygon(point_list, {fillOpacity:0.2, opacity:.5, weight:5,
											fillColor:val["color"], color:val["color"]}));
		polys[polys.length-1].state = "selected";
		polys[polys.length-1].color = val["color"];
		polys[polys.length-1].id = key;
		polys[polys.length-1].addTo(map);
		icon_html = key;
		icon = L.divIcon({className:"poly-icon",iconSize:null,
							html:icon_html}); // iconSize:null
		polys[polys.length-1].icon = new L.Marker(val["icon_point"], 
											{icon:icon, clickable:true}).addTo(map);		
	}

	return polys;
}



// --------------------------------------------------------------------
function initMarkers(map, polys, marker_options, trophy_json_url) {
	var markers = [];
	var marker_radius = 5;
	
	$.getJSON(trophy_json_url, function(data) {	
		//var markers = [];
		for (key in data) {
			val = data[key];
			markers.push(new L.CircleMarker([val.lat, val.lon], marker_radius));
			markers[markers.length-1].setRadius(marker_radius);
								// marker_radius)); //, marker_options));
			if (val.popn == "Grisefiord") {
				val.display_popn = "Grise Fiord (Lancaster Sound)";
				val.popn = "Lancaster Sound";
			} else if (val.popn == "Parry Channel") {
				val.display_popn = "Parry Channel (Lancaster Sound(?))";
				val.popn = "Lancaster Sound";
			} else if (val.popn == "Cambridge Bay") {
				val.display_popn = "Cambridge Bay (McClintock Channel)";
				val.popn = "McClintock Channel";
			} else if (val.popn == "Arctic Bay") {
				val.display_popn = "Arctic Bay (Lancaster Sound)";
				val.popn = "Lancaster Sound";
			} else if (val.popn == "Resolute Bay") {
				val.display_popn = "Resolute Bay (Lancaster Sound)";
				val.popn = "Lancaster Sound";
			} else {
				val.display_popn = val.popn;
			}
			markers[markers.length-1].bindPopup('<strong>' 
								+'<a href="https://www.federalregister.gov/articles/search?conditions%5Bterm%5D=%22'
								+ val.name+'%22+%26+%22polar+bear%22" target=%22_blank%22>' 
								+ val.name + "</a></strong><br/>" 
								+ val.city  + ", " 
								+ val.state + "<br/>Applied: " 
								+ val.day +" "+ val.month  +" "+ val.year
								+ "<br/>Source: " + val.display_popn);
			markers[markers.length-1].id = val.popn;
			markers[markers.length-1].year_selected = true;
			markers[markers.length-1].popn_selected = true;
			markers[markers.length-1].year = val.year;
			for (var i = 0; i < polys.length; i++) {
					if (markers[markers.length-1].id == polys[i].id) {
					markers[markers.length-1].setStyle({fillOpacity:0.2, 
										opacity:0.5, weight:2, 
										color:polys[i].color, fillColor:polys[i].color});
				}
			}
		}
		for (var i = 0; i < markers.length; i++) {
			markers[i].addTo(map);
		}
		initEvents(map, markers, polys);
	});

	return markers;
}


// -----------------------------------------------------------------
// sets up event listeners
function initEvents(map, markers, polys) {
	var i, j;
	var onPolyClick = function (e) {
		if (this.state == "selected") {
			this.state = "off";
			this.setStyle({fillOpacity:0.0, opacity: 0.5, weight:5,
												color:'#03f', fillColor:'#03f'});
			for (var j = 0; j< markers.length; j++) {
				if (markers[j].id == this.id) {
					map.removeLayer(markers[j]);
					markers[j].popn_selected = false;
				}
			}
			console.log(" polyclick checked false " + this.id);
			$('input[value="'+this.id+'"]').prop("checked", false);
			console.log($('input[value="'+this.id+'"]').is(":checked"));
		} else if (this.state == "unselected") {
			this.state = "selected";
			this.setStyle({fillOpacity:0.2, opacity:0.7, weight:5, 
							color:this.color, fillColor:this.color});
			for (j = 0; j< markers.length; j++) {
				if (markers[j].id == this.id)  {
					markers[j].closePopup().setStyle({fillOpacity:0.4, 
							opacity:0.7, weight:2, 
							color:this.color, fillColor:this.color,
							clickable:true});
					markers[j].popn_selected = true;
				}
			}
			$('input[value="'+this.id+'"]').prop("checked", true);
		} else { // if (this.state == "off")
			this.state = "unselected";
			this.setStyle({fillOpacity:0.2, opacity:0.5, weight:5, 
							color:'#03f', fillColor:'#03f'});
			for (j = 0; j< markers.length; j++) {
				if (markers[j].id == this.id) {
					markers[j].closePopup().setStyle({fillOpacity:0.2, opacity:0.5, 
							weight:2, 
							color:'#03f', fillColor:'#03f',
							clickable:true});
					markers[j].popn_selected = true;
					if (markers[j].year_selected) {
						map.addLayer(markers[j]);
					}
				}
			}
			$('input[value="'+this.id+'"]').prop("checked", true);	
		}	
	};
	
	// when click on poly (or divicon), hide/show matching markers
	for (i = 0; i < polys.length; i++) {
		polys[i].on('click', onPolyClick);
		polys[i].icon.parent = polys[i];
		polys[i].icon.on('click', function(e) {
			this.parent.fire("click");
			});
	}

	// when hover on marker, highlight matching poly
	for (j = 0; j< markers.length; j++) {
 		markers[j].on("mouseover", function(e) {
			for (var i = 0; i < polys.length; i++) {	
				if (this.id == polys[i].id) {
					polys[i].setStyle({weight:10});
				}
			}
		});
 		markers[j].on("mouseout", function(e) {
			for (var i = 0; i < polys.length; i++) {	
				if (this.id == polys[i].id) {
					polys[i].setStyle({weight:5});
				}
			}
		});
	}


	// allow selected years to show
	var years = {}
	for (var i = 0; i < markers.length; i++) {
		years[markers[i].year] = true;
	}
	for (key in years) { 
		input_checkbox_html = '<input class="year-checkboxes" id="'+key+'" type="checkbox" checked="checked" value="'+key+'" name="' +key+ '"></input><label for="'+key+'">'+key+'</label>';
		$("#years").append(input_checkbox_html);
		$('input[value='+key+']').change(function (e) {
			if ($(this).is(':checked')) {
				for (i = 0; i < markers.length; i++) {
					if (markers[i].year == $(this).val()) {
						if (markers[i].popn_selected) {
							map.addLayer(markers[i]);
						}
						markers[i].year_selected = true;
					} 
				}
			} else {				
				for (i = 0; i < markers.length; i++) {
					if (markers[i].year == $(this).val()) {
						map.removeLayer(markers[i]);
						markers[i].year_selected = false;
					} 
				}
			}
		});		
	}	
	$("#years").buttonset();
	
	// toggle all years on/off
 	input_checkbox_html = '<input id="show-all-years" type="button" value="Show All" name="show-all-years"></input>';
 	$("#years-all").append(input_checkbox_html);
 	$("#show-all-years").click(function (e) {
		for (key in years) {
			$('input[value='+key+']').prop("checked", true);
			$('input[value='+key+']').trigger("change");
		}
 	});	
 	input_checkbox_html = '<input id="hide-all-years" type="button" value="Hide All" name="hide-all-years"></input>';
 	$("#years-all").append(input_checkbox_html);
 	$("#hide-all-years").click(function (e) {
		for (key in years) {
			$('input[value='+key+']').prop("checked", false);
			$('input[value='+key+']').trigger("change");
		}
 	});	
	$("#years-all").buttonset();
	
	// buttons to cycle through populations
	console.log("cycle");
	var popns = {}
	for (var i = 0; i < polys.length; i++) {
		popns[polys[i].id] = true;
	}
	var selector = {};
	for (key in popns) { 
		console.log(key);
		selector[key] = key.split(" ").join("-"); 
		input_checkbox_html = '<input class="population-checkboxes" id="'+selector[key]+'" type="checkbox" checked="checked" value="'+key+'" name="' +key+ '"></input><label for="'+selector[key]+'">'+key+'</label>';
		$("#populations-indiv").append(input_checkbox_html);
		console.log("setting " +key);
		$('input[value="'+key+'"]').change(function(e) {
			for (i = 0; i < polys.length; i++) {
				if (polys[i].id == $(this).context.value) {
					console.log($(this).context.value);
					if (polys[i].state == "off") {
						$(this).prop('checked', true);
					} else if (polys[i].state == "unselected") {
						$(this).prop('checked', true);
						$(this).css("border-style","solid");
						$(this).css("border-width","1px");
						$(this).css("border-color",polys[i].color);
					} else {
						$(this).prop('checked', false);
					}	
					polys[i].fire("click");
				}
			}
		});
	}
	$("#populations-indiv").buttonset();
	
	// show, hide, and highlight. hackery - through triggered events
	$("#show-all").on("click", function (e) {
		for (i = 0; i < polys.length; i++) {
			if (polys[i].state == "off") {
				polys[i].fire("click"); // ... then triggers click to advance to next			
			} else if (polys[i].state == "selected") {
				polys[i].fire("click"); // ... then triggers click to advance to next
				polys[i].fire("click"); // ... then triggers click to advance to next
			} 
		}
	});
	$("#hide-all").on("click", function (e) {
		for (i = 0; i < polys.length; i++) {
			if (polys[i].state == "selected") {
				polys[i].fire("click"); // ... then triggers click to advance to next			
			} else if (polys[i].state == "unselected") {
				polys[i].fire("click"); // ... then triggers click to advance to next
				polys[i].fire("click"); // ... then triggers click to advance to next
			} 
		}
	});
	$("#highlight-all").on("click", function (e) {
		for (i = 0; i < polys.length; i++) {
			if (polys[i].state == "off") {
				polys[i].fire("click"); // ... then triggers click to advance to next			
				polys[i].fire("click"); // ... then triggers click to advance to next
			} else if (polys[i].state == "unselected") {
				polys[i].fire("click"); // ... then triggers click to advance to next
			} 
		}
	});		
	$("#populations-all").buttonset();
	
	
	return;
}


var data = {"Foxe Basin": {"points": [
									[70.966064,-83.769531],
									[67.075043,-82.539062],
									[66.695511,-92.470703],
									[64.857239,-94.843750],
									[63.004025,-95.019531],
									[62.561859,-88.076172],
									[60.074585,-87.724609],
									[60.639679,-73.837891],
									[61.906776,-73.837891],
									[62.236095,-66.806641],
									[63.360889,-69.707031],
									[67.516037,-70.410156],
									[71.614441,-77.177734],
									[70.966064, -83.769531]
									],
							"color":"#FF0000",
							"icon_point": [66, -89]},
			"Gulf of Boothia": {"points": [
										[70.966064,-84.472656],
										[69.106903,-83.945312],
										[67.075043,-83.154297],
										[67.006477,-92.470703],
										[69.169502,-93.085938],
										[70.117126,-95.458984],
										[71.447388,-94.580078],
										[70.706406,-87.988281],
										[70.966064,-84.472656]
										],
								"color":"#FF9933",
							"icon_point": [70, -92]},
			"Norwegian Bay":{"points":  [
										[76.925034,-106.181641],
										[79.548157,-94.580078],
										[79.611740,-78.935547],
										[76.765015,-80.957031],
										[76.377220,-92.558594],
										[76.314980,-92.470703],
										[76.925034,-106.181641]
										],
							"color":"#FFFF00",
							"icon_point": [79, -95]},
			"Northern Beaufort Sea": {"points": [
											[67.040787,-122.705078],
											[70.413895,-123.847656],
											[72.133926,-140.546875],
											[81.217834,-138.437500],
											[79.338837,-108.291016],
											[77.297501,-108.906250],
											[76.785118,-118.310547],
											[74.145424,-119.453125],
											[73.903526,-117.431641],
											[71.558922,-117.871094],
											[71.108871,-110.136719],
											[66.937714,-110.751953],
											[66.937714,-110.488281]
											],
							"color":"#99FF66",
							"icon_point": [79, -138]},
			"Southern Beaufort Sea":{"points":  [
												[72.152804, -167.255988], 
												[67.773451, -161.98255],
												[66.580513,-122.25599],
												[70.10817, -122.607553],
												[71.963281, -140.71302],
												[72.788075, -140.62513]
												],
							"color":"#009933",
							"icon_point": [71, -160]},
			"Lancaster Sound": {"points": [[76.825249,-105.654297],
											[72.187782,-105.390625],
											[72.348389,-99.941406],
											[71.558922,-98.623047],
											[71.586700,-94.492188],
											[70.908661,-88.339844],
											[71.250633,-80.781250],
											[73.533936,-82.011719],
											[75.391624,-77.001953],
											[77.043800,-75.859375],
											[76.765015,-80.693359],
											[76.294167,-92.646484],
											[76.825249,-105.654297]
											],
							"color":"#660033",
							"icon_point": [75, -100]},
			"Davis Strait": {"points": [
										[67.151001,-69.628906],
										[63.722023,-68.398438],
										[62.236095,-66.455078],
										[61.490086,-73.046875],
										[56.955627,-73.398438],
										[52.010433,-59.423828],
										[46.086781,-58.457031],
										[46.269348,-51.250000],
										[61.865360,-46.328125],
										[68.080597,-43.867188],
										[66.168404,-64.345703],
										[67.1510010,-69.628906]
										],
							"color":"#66FFFF",
							"icon_point": [62, -65]},
			"Baffin Bay": {"points": [
										[71.807510,-77.177734],
										[71.614441,-79.990234],
										[73.484039,-81.484375],
										[75.369438,-76.035156],
										[77.258789,-75.068359],
										[77.432076,-63.466797],
										[74.987244,-51.865234],
										[68.309128,-43.867188],
										[66.450912,-64.521484],
										[67.716850,-69.970703],
										[71.807510, -77.177734]
										],
            					"color":"#9933FF",
							"icon_point": [75, -70]},
			"Viscount Melville Sound": {"points": [
										[76.944901,-118.046875],
										[74.217293,-118.837891],
										[73.927879,-116.464844],
										[71.862312,-116.289062],
										[71.023315,-111.191406],
										[71.307053,-105.654297],
										[76.925034,-106.269531],
										[76.925034,-117.080078],
										[76.944901, -118.046875]
										],
							"color":"#CC6600",
							"icon_point": [76, -117]},
			"Western Hudson Bay": {"points": [
									[62.317867,-88.691406],
									[54.786610,-88.779297],
									[54.988819,-97.304688],
									[62.803864,-95.019531],
									[62.3178670,-88.691406]
									],
							"color":"#4C6680",
							"icon_point": [59, -95]},
			"McClintock Channel": {"points": [
									[71.447388,-95.107422],
									[71.531097,-98.535156],
									[72.241470,-99.853516],
									[72.106949,-104.951172],
									[71.137306,-104.951172],
									[71.023315,-109.169922],
									[66.345345,-109.697266],
									[64.894554,-95.283203],
									[66.972115,-92.910156],
									[69.169502,-93.261719],
									[70.176826,-95.898438],
									[71.447388, -95.107422]
									],
							"color":"#ff77FF",
							"icon_point": [69, -108]},
			}
			
