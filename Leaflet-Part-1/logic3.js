// Create different Tile Layers (Base Maps)
let satelliteMap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}?access_token=YOUR_MAPBOX_ACCESS_TOKEN", {
    attribution: '&copy; Mapbox contributors'
  });
  
  let grayscaleMap = L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
    attribution: '&copy; OpenStreetMap contributors'
  });
  
  let outdoorsMap = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; OpenTopoMap contributors'
  });
  
  // Create the Map Object
  let myMap = L.map("map", {
    center: [20, 0],
    zoom: 2,
    layers: [satelliteMap] // Default map
  });
  
  // Define base maps for toggling
  let baseMaps = {
    "Satellite": satelliteMap,
    "Grayscale": grayscaleMap,
    "Outdoors": outdoorsMap
  };
  
  // Create Layer Groups for Overlays (Earthquakes & Tectonic Plates)
  let earthquakeLayer = new L.LayerGroup();
  let tectonicPlatesLayer = new L.LayerGroup();
  
  // Define Overlays (Toggling Layers)
  let overlays = {
    "Earthquakes": earthquakeLayer,
    "Tectonic Plates": tectonicPlatesLayer
  };
  
  // Add Layer Control to Map
  L.control.layers(baseMaps, overlays, {
    collapsed: false
  }).addTo(myMap);
  
  // Function: Assign Marker Colors Based on Earthquake Depth
  function getColor(depth) {
    if (depth === undefined || depth === null) return "#ffffff"; // White for missing depth
  
    return depth > 90 ? "#ff5f65" :
           depth > 70 ? "#fca35d" :
           depth > 50 ? "#fdb72a" :
           depth > 30 ? "#f7db11" :
           depth > 10 ? "#dcf400" :
                        "#a3f600";
  }
  
  // Function: Assign Marker Size Based on Earthquake Magnitude
  function getRadius(magnitude) {
    return magnitude ? magnitude * 4 : 1;
  }
  
  // Function: Assign Style to Markers
  function styleInfo(feature) {
    return {
        radius: getRadius(feature.properties.mag),
        fillColor: getColor(feature.geometry.coordinates[2]),
        color: "#000",
        weight: 0.5,
        opacity: 1,
        fillOpacity: 0.7
    };
  }
  
  // Fetch Earthquake Data (Past 24 Hours)
  d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson").then(function (data) {
    L.geoJson(data, {
      pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng);
      },
      style: styleInfo,
      onEachFeature: function (feature, layer) {
        layer.bindPopup(
          `<h3>${feature.properties.place}</h3><hr>
           <p><strong>Magnitude:</strong> ${feature.properties.mag || "N/A"}</p>
           <p><strong>Depth:</strong> ${feature.geometry.coordinates[2] !== undefined ? feature.geometry.coordinates[2] : "N/A"} km</p>
           <p><strong>Time:</strong> ${new Date(feature.properties.time).toLocaleString()}</p>`
        );
      }
    }).addTo(earthquakeLayer);
  
    earthquakeLayer.addTo(myMap);
  });
  
  // Create Legend
  let legend = L.control({ position: "bottomright" });
  
  legend.onAdd = function () {
    let div = L.DomUtil.create("div", "info legend"),
        depthLevels = [-10, 10, 30, 50, 70, 90],
        colors = ["#a3f600", "#dcf400", "#f7db11", "#fdb72a", "#fca35d", "#ff5f65"];
  
    div.innerHTML += "<strong>Depth (km)</strong><br>";
  
    for (let i = 0; i < depthLevels.length; i++) {
      div.innerHTML += `<i style="background:${colors[i]}; width: 15px; height: 15px; display: inline-block;"></i> ${depthLevels[i]}${depthLevels[i + 1] ? "&ndash;" + depthLevels[i + 1] + "<br>" : "+"}`;
    }
    
    return div;
  };
  
  // Add Legend to Map
  legend.addTo(myMap);
  
  // Fetch Tectonic Plate Data & Add to Map
  d3.json("https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json").then(function (plateData) {
    L.geoJson(plateData, {
      color: "#ff7800",
      weight: 2
    }).addTo(tectonicPlatesLayer);
  
    tectonicPlatesLayer.addTo(myMap);
  });