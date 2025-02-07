// Define base map layers
let googleTerrain = L.tileLayer('http://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',{
        maxZoom: 20,
        subdomains:['mt0','mt1','mt2','mt3']
      });

let grayscaleMap = L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
  attribution: '&copy; OpenStreetMap contributors'
});

let outdoorsMap = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
  attribution: '&copy; OpenTopoMap contributors'
});

// Create the map object with center and zoom options
let myMap = L.map("map", {
  center: [20, 0], // Centered globally
  zoom: 2,
  layers: [googleTerrain] // Default basemap
});

// Define base maps for toggling
let baseMaps = {
  "Google Terrain": googleTerrain,
  "Grayscale": grayscaleMap,
  "Outdoors": outdoorsMap
};

// Create the layer groups for earthquakes and tectonic plates
let earthquakeLayer = new L.LayerGroup();
let tectonicPlatesLayer = new L.LayerGroup();

// Define overlays for toggling earthquake and tectonic plate data
let overlays = {
  "Earthquakes": earthquakeLayer,
  "Tectonic Plates": tectonicPlatesLayer
};

// Add a control to the map that will allow the user to change which layers are visible.
L.control.layers(baseMaps, overlays, { collapsed: false }).addTo(myMap);

// Function to return the style for each earthquake marker.
function styleInfo(feature) {
  return {
    radius: getRadius(feature.properties.mag),
    fillColor: getColor(feature.geometry.coordinates[2]), // Depth
    color: "#000",
    weight: 0.5,
    opacity: 1,
    fillOpacity: 0.7
  };
}

// Function to determine the color of the marker based on depth
function getColor(depth) {
  return depth > 90 ? "#ff5f65" :
         depth > 70 ? "#fca35d" :
         depth > 50 ? "#fdb72a" :
         depth > 30 ? "#f7db11" :
         depth > 10 ? "#dcf400" :
                      "#a3f600";
}

// Function to determine the radius of the earthquake marker based on its magnitude
function getRadius(magnitude) {
  return magnitude > 0 ? magnitude * 4 : 4;
}

// Fetch earthquake data (PAST 24 HOURS) and add it to the earthquake layer
d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson").then(function(data) {
  console.log("Earthquake Data:", data); // Debugging - Check if data is correctly fetched

  // Create a GeoJSON layer for the earthquake data
  L.geoJson(data, {
    pointToLayer: function(feature, latlng) {
      return L.circleMarker(latlng);
    },
    style: styleInfo,
    onEachFeature: function(feature, layer) {
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

// Create a legend control object
let legend = L.control({ position: "bottomright" });

legend.onAdd = function() {
  let div = L.DomUtil.create("div", "info legend"),
      depthLevels = [-10, 10, 30, 50, 70, 90],
      colors = ["#a3f600", "#dcf400", "#f7db11", "#fdb72a", "#fca35d", "#ff5f65"];

  div.innerHTML += "<strong>Depth (km)</strong><br>";

  for (let i = 0; i < depthLevels.length; i++) {
    div.innerHTML += `<i style="background:${colors[i]}; width: 20px; height: 20px; display: inline-block; margin-right: 4px;"></i> 
                      ${depthLevels[i]}${depthLevels[i + 1] ? "&ndash;" + depthLevels[i + 1] + "<br>" : "+"}`;
  }

  return div;
};

// Add the legend to the map
legend.addTo(myMap);

// Fetch and plot tectonic plate boundaries
d3.json("https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json").then(function(plateData) {
  L.geoJson(plateData, {
    color: "#ff7800",
    weight: 2
  }).addTo(tectonicPlatesLayer);

  tectonicPlatesLayer.addTo(myMap);
});
