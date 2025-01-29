// Global Forest Change dataset (Hansen et al.)
var dataset = ee.Image('UMD/hansen/global_forest_change_2023_v1_11');

// individual layers
var treeCover2000 = dataset.select('treecover2000');  // Forest cover in 2000
var loss = dataset.select('loss');  // Deforestation (tree cover loss)
var gain = dataset.select('gain');  // Forest gain

// Lossyear layers (shows the year of loss for each pixel)
var lossYear = dataset.select('lossyear');

//  Boundary of the Amazon Basin using bounding box defined by Mapbiomas
var amazonBasin = ee.FeatureCollection('projects/ee-sokabbasnasir/assets/MAPBIOMAS/biomas');


treeCover2000 = treeCover2000.clip(amazonBasin);
loss = loss.clip(amazonBasin);
gain = gain.clip(amazonBasin);
lossYear = lossYear.clip(amazonBasin);

// Masking loss and gain for specific time intervals
var loss2001_2005 = lossYear.gte(1).and(lossYear.lte(5)).multiply(loss); // Loss between 2001 and 2005
var loss2006_2013 = lossYear.gte(6).and(lossYear.lte(13)).multiply(loss); // Loss between 2006 and 2013
var loss2014_2020 = lossYear.gte(14).and(lossYear.lte(20)).multiply(loss); // Loss between 2014 and 2020

var gain2001_2005 = lossYear.gte(1).and(lossYear.lte(5)).multiply(gain); // Gain between 2001 and 2005
var gain2006_2013 = lossYear.gte(6).and(lossYear.lte(13)).multiply(gain); // Gain between 2006 and 2013
var gain2014_2020 = lossYear.gte(14).and(lossYear.lte(20)).multiply(gain); // Gain between 2014 and 2020

// Masking the images to ensure we only show areas where gain or loss occurred
var maskedLoss2001_2005 = loss2001_2005.updateMask(loss2001_2005);
var maskedLoss2006_2013 = loss2006_2013.updateMask(loss2006_2013);
var maskedLoss2014_2020 = loss2014_2020.updateMask(loss2014_2020);

var maskedGain2001_2005 = gain2001_2005.updateMask(gain2001_2005);
var maskedGain2006_2013 = gain2006_2013.updateMask(gain2006_2013);
var maskedGain2014_2020 = gain2014_2020.updateMask(gain2014_2020);

// Masking the tree cover 2000 layer in the same way (show only where there was forest)
var maskedTreeCover2000 = treeCover2000.updateMask(treeCover2000);

// Adding the layers to the map with the defined color palettes
Map.centerObject(amazonBasin, 5);

// Adding the forest cover 2000 layer (Black for no forest, Green for forest cover)
Map.addLayer(maskedTreeCover2000, {min: 0, max: 100, palette: ['000000', '00FF00']}, 'Forest Cover 2000');

// Adjusting loss layers with more visible colors
Map.addLayer(maskedLoss2001_2005, {min: 0, max: 1, palette: ['white', 'magenta']}, 'Deforestation 2001-2005'); // Bright purple (magenta)
Map.addLayer(maskedLoss2006_2013, {min: 0, max: 1, palette: ['white', 'orange']}, 'Deforestation 2006-2013'); // Bright cyan
Map.addLayer(maskedLoss2014_2020, {min: 0, max: 1, palette: ['white', 'red']}, 'Deforestation 2014-2020'); // Bright red

// Adding the gain layers for different time periods (Blue for gain)
Map.addLayer(maskedGain2001_2005, {min: 0, max: 1, palette: ['white', 'dodgerblue']}, 'Forest Gain 2001-2005');
Map.addLayer(maskedGain2006_2013, {min: 0, max: 1, palette: ['white', 'yellowgreen']}, 'Forest Gain 2006-2013');
Map.addLayer(maskedGain2014_2020, {min: 0, max: 1, palette: ['white', 'darkturquoise']}, 'Forest Gain 2014-2020');

// Adding the Amazon Basin boundary for reference
Map.addLayer(amazonBasin, {color: 'blue'}, 'Amazon Basin Boundary');

// Function to add a legend to the map
function addLegend(title, colorLabels) {
  var legend = ui.Panel({style: {position: 'bottom-left'}});
  var titleLabel = ui.Label(title, {fontWeight: 'bold'});
  legend.add(titleLabel);
 
  colorLabels.forEach(function(label) {
    var colorBox = ui.Label('', {backgroundColor: label.color, padding: '8px', margin: '0 0 4px 0'});
    var description = ui.Label(label.label, {margin: '0 0 4px 6px'});
    var row = ui.Panel([colorBox, description], ui.Panel.Layout.Flow('horizontal'));
    legend.add(row);
  });

  Map.add(legend);
}

// Adding legends for deforestation and gain in each time period
addLegend('Deforestation (Loss)', [
  {color: 'magenta', label: '2001-2005'},
  {color: 'orange', label: '2006-2013'},
  {color: 'red', label: '2014-2020'}
]);

addLegend('Forest Gain', [
  {color: 'dodgerblue', label: '2001-2005'},
  {color: 'yellowgreen', label: '2006-2013'},
  {color: 'darkturquoise', label: '2014-2020'}
]);



// The size of layers is big and exceeds the payload limits provided by GEE so I divide the layers into tiles
// and export them in QGIS to stich them together
// Defining the bounds and grid size for tiles
var bounds = amazonBasin.geometry().bounds();
var gridSize = 608000;  // Tile size in meters (~608 km for ~20 tiles)

// Creating a grid of tiles over the Amazon Basin
var grid = bounds.coveringGrid({
  proj: ee.Projection('EPSG:4326'),  // Use EPSG:4326 projection
  scale: gridSize
});

// Exporting the Amazon Basin Boundary
Export.table.toDrive({
  collection: amazonBasin,
  description: 'AmazonBasinBoundary',
  folder: 'GEE_Export', // my folder in Gdrive
  fileFormat: 'GeoJSON'  // Exporting as Shapefile
});

// Function to export each tile
function exportTile(tile, index) {
  // Convert the tile to geometry and ensure it's in the correct projection (EPSG:4326)
  var region = ee.Geometry(tile).transform('EPSG:4326', 1);  // Reproject to EPSG:4326

  // Exporting Deforestation Layers for 2001-2005
  Export.image.toDrive({
    image: maskedLoss2001_2005,
    description: 'Deforestation_2001_2005_Tile_' + index,
    folder: 'GEE_Export',
    scale: 30,  // Keeping the scale at 30 meters for higher resolution
    region: region,
    maxPixels: 1e13  // lower values returned errors due to payload issues 
  });

  // Exporting Deforestation Layers for 2006-2013
  Export.image.toDrive({
    image: maskedLoss2006_2013,
    description: 'Deforestation_2006_2013_Tile_' + index,
    folder: 'GEE_Export',
    scale: 30,  
    region: region,
    maxPixels: 1e13  
  });

  // Exporting Deforestation Layers for 2014-2020
  Export.image.toDrive({
    image: maskedLoss2014_2020,
    description: 'Deforestation_2014_2020_Tile_' + index,
    folder: 'GEE_Export',
    scale: 30,  
    region: region,
    maxPixels: 1e13  
  });

  
  // Export tree cover 2000 
  Export.image.toDrive({
    image: maskedTreeCover2000,
    description: 'TreeCover2000_Tile_' + index,
    folder: 'GEE_Export',
    scale: 30,  
    region: region,
    maxPixels: 1e13  
  });
}

// Extracting geometries and export the tiles
grid.geometry().geometries().evaluate(function(geometries) {
  geometries.forEach(function(geometry, index) {
    exportTile(geometry, index);
  });
});
