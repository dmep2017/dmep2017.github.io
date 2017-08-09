/* Draw GeoJSON

Iterates through the latitude and longitude values, converts the values to XYZ coordinates,
and draws the geoJSON geometries.

*/

var x_values = [];
var y_values = [];
var z_values = [];

function drawThreeGeo(json, radius, shape, options) {

  var json_geom = createGeometryArray(json);
  //An array to hold the feature geometries.
  var convertCoordinates = getConversionFunctionName(shape);
  //Whether you want to convert to spherical or planar coordinates.
  var coordinate_array = [];
  //Re-usable array to hold coordinate values. This is necessary so that you can add
  //interpolated coordinates. Otherwise, lines go through the sphere instead of wrapping around.

  for (var geom_num = 0; geom_num < json_geom.length; geom_num++) {

    if (json_geom[geom_num][0].type == 'Polygon') {
      for (var segment_num = 0; segment_num < json_geom[geom_num][0].coordinates.length; segment_num++) {
        coordinate_array = createCoordinateArray(json_geom[geom_num][0].coordinates[segment_num]);

        for (var point_num = 0; point_num < coordinate_array.length; point_num++) {
          convertCoordinates(coordinate_array[point_num], radius);
        }
        drawLine(y_values, z_values, x_values, options , json_geom[geom_num][1]);
      }

    } else if (json_geom[geom_num][0].type == 'MultiPolygon') {
      for (var polygon_num = 0; polygon_num < json_geom[geom_num][0].coordinates.length; polygon_num++) {
        for (var segment_num = 0; segment_num < json_geom[geom_num][0].coordinates[polygon_num].length; segment_num++) {
            coordinate_array = createCoordinateArray(json_geom[geom_num][0].coordinates[polygon_num][segment_num]);

          for (var point_num = 0; point_num < coordinate_array.length; point_num++) {
            convertCoordinates(coordinate_array[point_num], radius);
          }
          drawLine(y_values, z_values, x_values, options, json_geom[geom_num][1]);
        }
      }
    } else {
      throw new Error('The geoJSON is not valid.');
    }
  }
}

function createGeometryArray(json) {
  var geometry_array = [];

  if (json.type == 'FeatureCollection') {
    for (var feature_num = 0; feature_num < json.features.length; feature_num++) {
      geometry_array.push([json.features[feature_num].geometry,json.features[feature_num].properties.iso_a2]);
    }
  } else {
    throw new Error('The geoJSON is not valid.');
  }
  //alert(geometry_array.length);
  return geometry_array;
}

function getConversionFunctionName(shape) {
  var conversionFunctionName;

  if (shape == 'sphere') {
    conversionFunctionName = convertToSphereCoords;
  } else if (shape == 'plane') {
    conversionFunctionName = convertToPlaneCoords;
  } else {
    throw new Error('The shape that you specified is not valid.');
  }
  return conversionFunctionName;
}

function createCoordinateArray(feature) {
  //Loop through the coordinates and figure out if the points need interpolation.
  var temp_array = [];
  var interpolation_array = [];

  for (var point_num = 0; point_num < feature.length; point_num++) {
    var point1 = feature[point_num];
    var point2 = feature[point_num - 1];

    if (point_num > 0) {
      if (needsInterpolation(point2, point1)) {
        interpolation_array = [point2, point1];
        interpolation_array = interpolatePoints(interpolation_array);

        for (var inter_point_num = 0; inter_point_num < interpolation_array.length; inter_point_num++) {
          temp_array.push(interpolation_array[inter_point_num]);
        }
      } else {
        temp_array.push(point1);
      }
    } else {
      temp_array.push(point1);
    }
  }
  return temp_array;
}

function needsInterpolation(point2, point1) {
  //If the distance between two latitude and longitude values is
  //greater than five degrees, return true.
  var lon1 = point1[0];
  var lat1 = point1[1];
  var lon2 = point2[0];
  var lat2 = point2[1];
  var lon_distance = Math.abs(lon1 - lon2);
  var lat_distance = Math.abs(lat1 - lat2);

  if (lon_distance > 5 || lat_distance > 5) {
    return true;
  } else {
    return false;
  }
}

function interpolatePoints(interpolation_array) {
  //This function is recursive. It will continue to add midpoints to the
  //interpolation array until needsInterpolation() returns false.
  var temp_array = [];
  var point1, point2;

  for (var point_num = 0; point_num < interpolation_array.length - 1; point_num++) {
    point1 = interpolation_array[point_num];
    point2 = interpolation_array[point_num + 1];

    if (needsInterpolation(point2, point1)) {
      temp_array.push(point1);
      temp_array.push(getMidpoint(point1, point2));
    } else {
      temp_array.push(point1);
    }
  }

  temp_array.push(interpolation_array[interpolation_array.length - 1]);

  if (temp_array.length > interpolation_array.length) {
    temp_array = interpolatePoints(temp_array);
  } else {
    return temp_array;
  }
  return temp_array;
}

function getMidpoint(point1, point2) {
  var midpoint_lon = (point1[0] + point2[0]) / 2;
  var midpoint_lat = (point1[1] + point2[1]) / 2;
  var midpoint = [midpoint_lon, midpoint_lat];

  return midpoint;
}

function convertToSphereCoords(coordinates_array, sphere_radius) {
  var lon = coordinates_array[0];
  var lat = coordinates_array[1];

  x_values.push(Math.cos(lat * Math.PI / 180) * Math.cos(lon * Math.PI / 180) *
    sphere_radius);
  y_values.push(Math.cos(lat * Math.PI / 180) * Math.sin(lon * Math.PI / 180) *
    sphere_radius);
  z_values.push(Math.sin(lat * Math.PI / 180) * sphere_radius);

  
}

function convertToPlaneCoords(coordinates_array, radius) {
  var lon = coordinates_array[0];
  var lat = coordinates_array[1];

  z_values.push((lat / 180) * radius);
  y_values.push((lon / 180) * radius);
}

function drawParticle(x, y, z, options) {
  var particle_geom = new THREE.Geometry();
  particle_geom.vertices.push(new THREE.Vector3(x, y, z));

  var particle_material = new THREE.ParticleSystemMaterial(options);

  var particle = new THREE.ParticleSystem(particle_geom, particle_material);
  scene.add(particle);

  clearArrays();
}

var stateShape=[];
function drawLine(x_values, y_values, z_values, options, name) {
  // container
  var obj = new THREE.Object3D();

  // lines
  /*var line_geom = new THREE.Geometry();
  createVertexForEachPoint(line_geom, x_values, y_values, z_values, "line");
  var line_material = new THREE.LineBasicMaterial({
    color: '#fff',
    //transparent: true,
    opacity:1
  });

  var line = new THREE.Line(line_geom, line_material);
  */
  //obj.add(line);
  //scene.add(line)
  // mesh
  
  var mesh_geom = new THREE.Geometry();
  //console.log(x_values, y_values, z_values,i++);
  createVertexForEachPoint(mesh_geom, x_values, y_values, z_values, "mesh", name);
  var mesh_material = new THREE.MeshLambertMaterial({
    color: '#ffff00',
    transparent:true,
    opacity:0,
    side: THREE.DoubleSide,
    //wireframe: true
  });
  var mesh = new THREE.Mesh(mesh_geom, mesh_material);
  mesh.name = name;
  
  stateShape.push(mesh);
  
  if(isMobile()){
    if(isMobileStateAbbr(name)) scene.add(mesh);
  }
  else scene.add(mesh);
  
  clearArrays();
}

function createVertexForEachPoint(object_geometry, values_axis1, values_axis2, values_axis3, type, abbr) {
  if(type=="mesh"){
    var mid = Math.floor(values_axis1.length/2);
    var pt0 = new THREE.Vector3(values_axis1[0], values_axis2[0], values_axis3[0]);
    var ptmid = new THREE.Vector3(values_axis1[mid], values_axis2[mid], values_axis3[mid]);
    var ptArc = createSphereArc(pt0 , ptmid);
    var ptCenteral = ptArc.getPoint(0.5)
    
    var ratio;
    switch(abbr){
      case "CN": {ratio = 1.04; break;}
      case "BR": {ratio = 1.03; break;}
      case "AU": {ratio = 1.04; break;}
      case "CL": {ratio = 1.03; break;}
      case "AR": {ratio = 1.03; break;}
      case "RU": {ratio = 1.06; break;}
      case "US": {ratio = 1.05; break;}
      case "CA": {ratio = 1.06; break;}
     
      default: ratio = 1.015;
    }
    
    //console.log(ptCenteral)
    ptCenteral.x=ptCenteral.x*ratio;
    ptCenteral.y=ptCenteral.y*ratio;
    ptCenteral.z=ptCenteral.z*ratio;
//console.log(ptCenteral)
    object_geometry.vertices.push(ptCenteral);
    
    for (var i = 0; i < values_axis1.length; i++) {
        object_geometry.vertices.push(new THREE.Vector3(values_axis1[i], values_axis2[i], values_axis3[i]));

        object_geometry.faces.push(new THREE.Face3(0, i + 1, i)); // <- add faces
      
    }
  }
  else if(type=="line"){
    for (var i = 0; i < values_axis1.length; i++) {
        object_geometry.vertices.push(new THREE.Vector3(values_axis1[i], values_axis2[i], values_axis3[i]));

        //object_geometry.faces.push(new THREE.Face3(0, i + 1, i)); // <- add faces
      
    }

  }
  
  
}

function clearArrays() {
  x_values.length = 0;
  y_values.length = 0;
  z_values.length = 0;
}