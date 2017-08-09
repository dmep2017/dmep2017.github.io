
function isMobile(){
  if(window.innerWidth<640) return true;
  else return false;
}
var mobileZoom = false;
var width = isMobile()?window.innerWidth:(window.innerWidth*0.85);
var height = window.innerHeight;
var mouse = new THREE.Vector2();

var showMin = isMobile()?100:0;

var groupWrap = new THREE.Group();
var groupIn=new THREE.Group();
var groupOut=new THREE.Group();


var groupEarthWrap = new THREE.Group();
var groupAll = new THREE.Group()

var color = d3.scale.linear()
        .domain([0.2,0.8])
        .range(['#5e75ff','#ff4f4f']);



var opacity = d3.scale.linear()
        .domain([100000,500000])
        .range([0.35,1]);


function cleanScene(){  
  scene.remove(groupWrap);

  groupWrap = new THREE.Group();
  groupIn = new THREE.Group();
  groupOut = new THREE.Group();

  groupWrap.add(groupIn)
  groupWrap.add(groupOut)
  scene.add(groupWrap)

  paths=[];
  dataSet=[];
  curveObjects=[];
  movingBalls=[];
  
}




/*
         *camera:相机
         *angle：旋转角度
         *segs:分段，即圆弧对应的路径分为几段
         *during：动画执行的时间
*/

function greatCircleFunction(P, Q)
{
  var angle = P.angleTo(Q);
  return function(t)
  {
      var X = new THREE.Vector3().addVectors(
      P.clone().multiplyScalar(Math.sin( (1 - t) * angle )), 
      Q.clone().multiplyScalar(Math.sin(      t  * angle )))
      .divideScalar( Math.sin(angle) );
      return X;
  };
}

function createSphereArc(P,Q)
{
  var sphereArc = new THREE.Curve();
  sphereArc.getPoint = greatCircleFunction(P,Q);
  return sphereArc;
}

function rotateEarthTween(to, segs, during) {             
  var toLat=to[0];
  var toLon=to[1];

  var cameraPos=camera.position; //start

  var r=cameraPos.distanceTo(new THREE.Vector3(0,0,0)); 

  var xT = r * Math.cos(toLat) * Math.sin(-toLon);
  var yT = r * Math.sin(toLat);
  var zT = r * Math.cos(toLat) * Math.cos(-toLon);

  var newPos = new THREE.Vector3(xT,yT,zT);
  
  var cameraCurve = createSphereArc(cameraPos, newPos);
  
  var endPosArray = [];

  for(var i=0; i<segs; i++){
    var pt=cameraCurve.getPoint(i/segs)
    endPosArray.push([pt.x,pt.y,pt.z]);
  }
   
  var flag = 0;

      var id = setInterval(function () {
        if (flag == segs) {

          camera.position.x=xT
          camera.position.y=yT
          camera.position.z=zT

          camera.lookAt(new THREE.Vector3(0,0,0));
          clearInterval(id);


        } else {
          camera.position.x = endPosArray[flag][0];
          camera.position.y = endPosArray[flag][1];
          camera.position.z = endPosArray[flag][2];

          camera.lookAt(new THREE.Vector3(0,0,0));
  
          flag++;
        }

      }, during / segs);

      

            
  
}

function getRoundNumber(angle){
  for(var i=0; i<10000; i++){
      if (Math.abs(angle)-i*2*Math.PI<0) return angle<0?-i+1:i-1;
  }
}

var currentCoords=[0,0];
function convertToCoordinates(x,y,z){
  var lon,lat;
  var camera_radius = Math.sqrt(x*x+y*y+z*z);

  lat = Math.asin(y/camera_radius)*180/Math.PI;
 
  if (z > 0){
    lon = Math.atan(x/z)*180/Math.PI;
  } else if (x > 0) {
    lon = Math.atan(x/z)*180/Math.PI + 180;
  } else {
    lon = Math.atan(x/z)*180/Math.PI - 180;
  }

  currentCoords[0]=lat;
  currentCoords[1]=lon;
  
  return [lat,lon];

}



function drawPolicy(State){
  $(".policy-wrap").hide();
  $(".policy-bend").html("");
  $(".policy-bend-year").html("");
  var trend;
  //console.log(policy)
  //0 无变化  1 更加严格 2 更加宽松  3 难以评测   
  var bendColor =['#a8956d','#333','#ffcc00','#dad8d1']
  var yearTag = [1800,1900,1950,1960,1970,1980,1990,2000,2010]
  for(var i in policy){
    if(policy[i][0]==State){
      $(".policy-wrap").show();
      var yearId = 0;
      var yearTagShow = [0,0,0,0,0,0,0,0,0]
      for(var j=1; j<policy[i].length;j++){
        //console.log(policy[i][j])
        if(policy[i][j][1]==1) trend=1
        else if(policy[i][j][1]==2) trend=2
        else if(policy[i][j][1]==3) trend=3
        else if(policy[i][j][1]==0) trend=0
        var li="<li style='background-color:"+bendColor[trend]+"'></li>"
        $(".policy-bend").append(li);

        if(policy[i][j][0]>=yearTag[yearId]&&yearTagShow[yearId]==0){
          if(j>1){
            var year;
            if(yearId>1){
              if(j-yearTagShow[yearId-1]>(isMobile()?6:3)){
                year="<div class='policy-bend-year-each' style='left:"+(isMobile()?1:2)*(j-1)+"px'>"+yearTag[yearId]+"</div>"
                $(".policy-bend-year").append(year);
              }
            }else{
                year="<div class='policy-bend-year-each' style='left:"+(isMobile()?1:2)*(j-1)+"px'>"+yearTag[yearId]+"</div>"
                $(".policy-bend-year").append(year);
            }
          }
          yearTagShow[yearId]=j;
          yearId=yearId+1;
        }
      }
      break;
    }

  }
  var tmp = $(".policy-bend").width();
  //var left = (width - tmp)/2;
  //$(".policy-wrap").css("left",left+"px")


}

var dataSet=[];
function drawData(year, State, mode, showMin){

 

  
  var animAngleLat = [];
  var animAngleLon = [];
  var animCoordinates = [];
  $(".state-rank-in").html("");
  $(".state-rank-out").html("");

  if(State!=null){
      
      var newCoordinates = getCapitalCoordinates(State)
      newCoordinates[0] = newCoordinates[0]*Math.PI/180;
      newCoordinates[1] = 0-newCoordinates[1]*Math.PI/180;
      rotateEarthTween(newCoordinates, 30, 500);
      drawPolicy(State);
      var stateCN=getStateNameCN(State)
      if(isMobile()){
        var no;
          for(var i=0; i<countryCodeMobile.length; i++){
            if(countryCodeMobile[i][0]==State) no=i;
          }
          var drop = document.getElementById("input-state-mobile");
          drop.options[no].selected = true;   
      }
      else
        document.getElementById("input-state").value=stateCN
  
        
  }

  var inOrOut="";
  //累加得到六个总移入／移出人数
  //if(!isMobile()){
    var totalDataIn=[0,0,0,0,0,0];
    var totalDataOut=[0,0,0,0,0,0];
    if(State!=null){
      
        for(var i=0; i<dataTotal.length; i++){
          if(dataTotal[i][0]==State){
            totalDataIn[0]=dataTotal[i][1]
            totalDataIn[1]=dataTotal[i][2]
            totalDataIn[2]=dataTotal[i][3]
            totalDataIn[3]=dataTotal[i][4]
            totalDataIn[4]=dataTotal[i][5]
            totalDataIn[5]=dataTotal[i][6]
          
            totalDataOut[0]=dataTotal[i][7]
            totalDataOut[1]=dataTotal[i][8]
            totalDataOut[2]=dataTotal[i][9]
            totalDataOut[3]=dataTotal[i][10]
            totalDataOut[4]=dataTotal[i][11]
            totalDataOut[5]=dataTotal[i][12]
          }
        }
      

      if(!isMobile()){drawTotalChart(totalDataIn, totalDataOut);}
      
      if(totalDataIn[5]>totalDataOut[5]) {
        inOrOut="in";       
      }
      else {
        inOrOut="out";
       
      }
    }
  //}



  //输出总数
  /*var str="";
  for(var n=0; n<countryCode.length;n++){
    
   
    var totalDataIn=[0,0,0,0,0,0];
    var totalDataOut=[0,0,0,0,0,0];
    var s = countryCode[n][0]
   
      for(var k=0; k<6; k++){
        var d=data[k];    
        for(var i=0; i<d.length; i++){
          if(d[i][1]==s){
            totalDataIn[k]+=d[i][2]
          }
          else if(d[i][0]==s){
            totalDataOut[k]+=d[i][2]
          }
        }
      }

      str+='["'+s+'",'+totalDataIn[0]+","+totalDataIn[1]+","+totalDataIn[2]+","+totalDataIn[3]+","+totalDataIn[4]+","+totalDataIn[5]+","+totalDataOut[0]+","+totalDataOut[1]+","+totalDataOut[2]+","+totalDataOut[3]+","+totalDataOut[4]+","+totalDataOut[5]+"],";
    }

     console.log(str);
*/
 
  

  dataSet = data[0];
  
  thisYear = 0;
  thisState = State;
  //thisMode = mode;
  thisMin = showMin;
  
  var fromArray=[];
  var toArray=[];

  for(var i=0; i<dataSet.length; i++){
  	if(State!=null){
			
      if(!isMobile()) 
        $(".state-rank-out-wrap, .state-rank-in-wrap").show();
			
      

      if(dataSet[i][1]==State){
	  			var toState = getStateNameCN(dataSet[i][0]);
	  			if(!isMobile()){
            var li = "<li>"+toState+"<span style='display:inline-block; float:right; margin-right:10px'>"+dataSet[i][2]+"</span></li>";
  	  			$(".state-rank-out").append(li);
          }
          toArray.push([dataSet[i][2],toState,dataSet[i][3],dataSet[i][0]])
	  		}
			else if(dataSet[i][0]==State){	  			
	  			var fromState = getStateNameCN(dataSet[i][1]);
	  			fromArray.push([dataSet[i][2],fromState,dataSet[i][3],dataSet[i][1]]);
	  		}
	  		
	     //分组成in和out组					
	  	if((dataSet[i][1]==State||dataSet[i][0]==State)&&dataSet[i][2]>showMin){
	  					var fromState = dataSet[i][0];
	  					var toState = dataSet[i][1];

	  					var fromCoordinates = getCapitalCoordinates(fromState);
	  					var toCoordinates = getCapitalCoordinates(toState);
	  					
              var objMode;
              if(dataSet[i][1]==State) objMode="in";
              else if(dataSet[i][0]==State) objMode="out";

	  					drawImmigrantLine(fromCoordinates, toCoordinates, radius, dataSet[i][2], dataSet[i][3]/dataSet[i][2], objMode)
              //console.log(mode);
              //console.log(groupIn)
	  	}
	    
	    


		}
					
		else if(State==null){
       
				if(dataSet[i][2]>showMin){
					var fromState = dataSet[i][0];
					var toState = dataSet[i][1];

					var fromCoordinates = getCapitalCoordinates(fromState);
					var toCoordinates = getCapitalCoordinates(toState);
					
					drawImmigrantLine(fromCoordinates, toCoordinates, radius, dataSet[i][2], dataSet[i][3]/dataSet[i][2],null)
				}
		}
	
	}

  groupWrap.add(groupIn)
  groupWrap.add(groupOut)

  $(".tab-in").removeClass("tab-chosen-in");
  $(".tab-both").removeClass("tab-chosen-both")
  $(".tab-out").removeClass("tab-chosen-out");

  if(inOrOut=="out"){    
    if(!mobileZoom) {
      $(".tab-out").addClass("tab-chosen-out"); 
      groupIn.visible=false;
      groupOut.visible=true;
      $(".flag-out").show();
      $(".flag-out").css("opacity",1);
      $(".flag-in").hide();
      $(".flag-in").css("opacity",0);
    }else{
      $(".tab-both").addClass("tab-chosen-both"); 
      groupIn.visible=true;
      groupOut.visible=true;
    }
  }else if(inOrOut=="in"){   
    if(!mobileZoom) {
      $(".tab-in").addClass("tab-chosen-in");
      groupIn.visible=true;
      groupOut.visible=false;
      $(".flag-out").hide();
      $(".flag-out").css("opacity",0);
      $(".flag-in").show();
      $(".flag-in").css("opacity",1);
    }else {
      $(".tab-both").addClass("tab-chosen-both"); 
      groupIn.visible=true;
      groupOut.visible=true;
    }
  }

	

  var fromOrderedArray = ordering(fromArray);
	FlagArrayFrom=[];
  for(var i=0; i<fromOrderedArray.length; i++){
    FlagArrayFrom.push(fromOrderedArray[i]);
		if(!isMobile()){
      var li = "<li>"+fromOrderedArray[i][1]+"<span style='display:inline-block; float:right; margin-right:10px'>"+fromOrderedArray[i][0]+"</span></li>";
	    $(".state-rank-in").append(li);
    }
	}


  FlagArrayTo=[];
  for(var i=0; i<toArray.length; i++){
    FlagArrayTo.push(toArray[i]);
  }

}

var FlagArrayFrom=[];
var FlagArrayTo=[];

function updateFlag(){
  $(".flag").css("top","-300px").css("left","-300px")
   if(FlagArrayFrom.length>0){
     for(var i=0; i<FlagArrayFrom.length; i++){
            if(i<5) drawFlag("out",i+1,FlagArrayFrom[i]);
           
      }
  }
  if(FlagArrayTo.length>0){
     for(var i=0; i<FlagArrayTo.length; i++){          
            if(i<5) drawFlag("in",i+1,FlagArrayTo[i]);
      }
  }
}

function drawFlag(type, rank, record){

  var type = type;
  var rank = rank;
  var value = record[0];
  var state = record[3];
  var stateCN = record[1]

  var coords = getCapitalCoordinates(state);
  var radius = 10;//width*0.17;
  var flagCoordsLat = coords[0] * Math.PI / 180;
  var flagCoordsLon = coords[1] * Math.PI / 180;
  var reverseLon=1, reversLat=1;

  
  var xF = radius * Math.cos(flagCoordsLat) * Math.sin(flagCoordsLon);
  var yF = radius * Math.sin(flagCoordsLat);
  var zF = radius * Math.cos(flagCoordsLat) * Math.cos(flagCoordsLon);
  
  var cameraPos = camera.position;

  //var projector = new THREE.Projector();  
  
  var world_vector = new THREE.Vector3(xF,yF,zF);  
  //console.log(world_vector,camera);

  var vector = world_vector.project(camera);  
   
  var halfWidth = $("#webgl-map").width() / 2;
  var halfHeight = $("#webgl-map").height() / 2;
    
  var result = {  
    
      x: Math.round(vector.x * halfWidth + halfWidth),  
      y: Math.round(-vector.y * halfHeight + halfHeight)  
      
  };  

  var disTarget = cameraPos.distanceTo(world_vector);
  var disCenter = cameraPos.distanceTo(new THREE.Vector3(0,0,0))
  
  var axisSame = 0;
  var xSame=0,ySame=0,zSame=0;
  if(zF*camera.position.z>0) {axisSame += 1; zSame=1}
  if(yF*camera.position.y>0) {axisSame += 1; ySame=1}
  if(xF*camera.position.x>0) {axisSame += 1; xSame=1}
  
  var flagClass=".flag-"+type+"-"+rank; //flag-out-4

  if(axisSame<2)
    $(flagClass).css("opacity",0.2);
  else $(flagClass).css("opacity",1);


  $(flagClass).css("left",result.x+"px");
  $(flagClass).css("top",result.y+"px");
  
  $(flagClass).find(".flag-ranking").html(rank);
  $(flagClass).find(".flag-right").find(".flag-state-name").html(stateCN+"<br/><span class='flag-data'>"+(value>1000?((value/10000).toFixed(1)+"万"):value)+"</span>");
  
}

var paths=new Array();
var movingBalls=new Array();
var curveObjects=new Array();


function drawImmigrantLine(fromCoordinates, toCoordinates, radius, value, sexRatio, mode) {

  var movingBallAmount;
  if(value<500000) movingBallAmount=0;
  else movingBallAmount = Math.floor(value / 500000);
  
  if(isMobile()){
    if(movingBallAmount>20) movingBallAmount=20;
  }else{
    if(movingBallAmount>40) movingBallAmount=40;
  }

  
  
  var latF = fromCoordinates[0];
  var lonF = fromCoordinates[1];

  var phiFrom = latF * Math.PI / 180;
  var thetaFrom = lonF * Math.PI / 180;
 
  var xF = radius * Math.cos(phiFrom) * Math.sin(thetaFrom);
  var yF = radius * Math.sin(phiFrom);
  var zF = radius * Math.cos(phiFrom) * Math.cos(thetaFrom);

  var latT = toCoordinates[0];
  var lonT = toCoordinates[1];
  var phiTo = latT * Math.PI / 180;
  var thetaTo = lonT * Math.PI / 180;

  var xT = radius * Math.cos(phiTo) * Math.sin(thetaTo);
  var yT = radius * Math.sin(phiTo);
  var zT = radius * Math.cos(phiTo) * Math.cos(thetaTo);

  var vT = new THREE.Vector3(xT, yT, zT);
  var vF = new THREE.Vector3(xF, yF, zF);

 
  var dist = vF.distanceTo(vT);
 
  // here we are creating the control points for the first ones.
  // the 'c' in front stands for control.
  var cvT = vT.clone();
  var cvF = vF.clone();
 
  // then you get the half point of the vectors points.
  var xC = ( 0.5 * (vF.x + vT.x) );
  var yC = ( 0.5 * (vF.y + vT.y) );
  var zC = ( 0.5 * (vF.z + vT.z) );
 
  // then we create a vector for the midpoints.
  var mid = new THREE.Vector3(xC, yC, zC);

  var smoothDist = map(dist, 0, 11, 0, 17/dist );
  //var smoothDist=Math.sqrt(dist*0.5);
  //if(smoothDist>1.4) smoothDist=1.4;
  //smoothDist = 1.6;
  mid.setLength( radius * smoothDist );
 
  cvT.add(mid);
  cvF.add(mid);
 
  cvT.setLength( radius * smoothDist );
  cvF.setLength( radius * smoothDist );

  var curve = new THREE.CubicBezierCurve3( vF, cvF, cvT, vT );
 
  var geometry2 = new THREE.Geometry();
  geometry2.vertices = curve.getPoints( 100 );
  
  var movingBallColor = color(sexRatio)	 
  var lineOpacity = opacity(value)
  var material2 = new THREE.MeshBasicMaterial( { color : movingBallColor, transparent:true,  opacity: lineOpacity } );
 
  // Create the final Object3d to add to the scene
  var curveObject = new THREE.Line( geometry2, material2 );
  //curveObject.opacity = lineOpacity;
  paths.push(curve);
  if(mode=="in")
    groupIn.add(curveObject);
  else if(mode=="out")
    groupOut.add(curveObject);
  else
    groupWrap.add(curveObject);
  
  //console.log(groupWrap)
  curveObjects.push(curveObject);

  var movingPersonMaterial = new THREE.MeshPhongMaterial({
      color: movingBallColor,
      side: THREE.DoubleSide,
      transparent:true,
      opacity:1,
      //blending: THREE.AdditiveBlending
      
    });
  
  var movingBallMaterial = new THREE.MeshBasicMaterial({
            color:movingBallColor,
            //blending: THREE.AdditiveBlending,
            transparent:true,
            opacity:0.9,
            side:THREE.DoubleSide
        });

  var movingBallRow = new Array();
  
  
  if(movingBallAmount>0){
    for(var i=0; i<movingBallAmount; i++){
    	var obj = initSVGObject();
      var movingBall = addGeoObject(obj, movingPersonMaterial,value,fromCoordinates,toCoordinates,mode);
      
      if(mode=="in")
        groupIn.add(movingBall);
      else if(mode=="out")
        groupOut.add(movingBall);
      else
        groupWrap.add(movingBall);
    	
    	movingBallRow.push(movingBall)
    }
    movingBallRow.push(value);

  }else{
      var obj = new THREE.SphereGeometry((isMobile()?0.06:0.03), 6,6);
      var movingBall = new THREE.Mesh(obj, movingBallMaterial);
      
      if(mode=="in")
        groupIn.add(movingBall);
      else if(mode=="out")
        groupOut.add(movingBall);
      else
        groupWrap.add(movingBall);

      movingBallRow.push(movingBall)
      movingBallRow.push("ball");
  }

  movingBalls.push(movingBallRow)
  
}



function map( x,  in_min,  in_max,  out_min,  out_max){
  return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}


function getCapitalCoordinates(stateName){
	var coordinates = [];
	for(var i in countryCode){
		if (stateName==countryCode[i][0]){
			coordinates[0] = countryCode[i][3];
			coordinates[1] = countryCode[i][4];
			return coordinates;
		}
	}
	return null;
}

function getStateNameCN(stateName){
	for(var i in countryCode){
		if (stateName==countryCode[i][0]){
			return countryCode[i][5];
		}
	}
	return null;
}

function ordering(array){	
	for(var i=0; i<array.length;i++){
		for(var j=i; j<array.length;j++){
			if(array[j][0]>array[i][0]) {
				var tmp=array[j]
				array[j]=array[i];
				array[i]=tmp;
			}
			
		}
		
	}
	return array;
}

var mouseWindow=[];
function onMouseMove(event) {

  // calculate mouse position in normalized device coordinates
  // (-1 to +1) for both components
  mouseWindow[0]=event.clientX;
  mouseWindow[1]=event.clientY;

  mouse.x = ( event.clientX / width ) * 2 - 1;
  mouse.y = - ( event.clientY / height ) * 2 + 1;

}
window.addEventListener( 'mousemove', onMouseMove, false );

function onMouseClick(){
  var state = updateInfoBox(1);
  var stateAbbr = getStateAbbr(state);
  if(state){
    hightLightState(stateAbbr)
    cleanScene();
    drawData(thisYear, state, thisMode, showMin) 
  }
}

function isMobileState(state){
  for(var i=0; i<countryCodeMobile.length; i++){
    if(state==countryCodeMobile[i][0]) return true;
  }
  return false;
}

function isMobileStateAbbr(state){
  for(var i=0; i<countryCodeMobile.length; i++){
    if(state==countryCodeMobile[i][2]) return true;
  }
  return false;
}

function hightLightState(countyCode){

            if(countyCode=="CN"||countyCode=="US"||countyCode=="BR"||countyCode=="IN"||countyCode=="AU"||countyCode=="CL"||countyCode=="AR"||countyCode=="RU"||countyCode=="CA"||countyCode=="MX"||countyCode=="MN"||countyCode=="TH"||countyCode=="KZ"||countyCode=="UZ"){
              for(var a=0; a<maps.length; a++){
                maps[a].visible=false;
              }
              for(var i=0; i<stateShape.length;i++){              
                stateShape[i].material.opacity=0;
              }
              if(countyCode=="CN") scene.getObjectByName("earth-CN").visible=true;
              else if(countyCode=="US") scene.getObjectByName("earth-US").visible=true;
              else if(countyCode=="BR") scene.getObjectByName("earth-BR").visible=true;
              else if(countyCode=="IN") scene.getObjectByName("earth-IN").visible=true;
              else if(countyCode=="AU") scene.getObjectByName("earth-AU").visible=true;
              else if(countyCode=="CL") scene.getObjectByName("earth-CL").visible=true;
              else if(countyCode=="AR") scene.getObjectByName("earth-AR").visible=true;
              else if(countyCode=="RU") scene.getObjectByName("earth-RU").visible=true;
              else if(countyCode=="CA") scene.getObjectByName("earth-CA").visible=true;
              else if(countyCode=="MX") scene.getObjectByName("earth-MX").visible=true;
              else if(countyCode=="MN") scene.getObjectByName("earth-MN").visible=true;
              else if(countyCode=="TH") scene.getObjectByName("earth-TH").visible=true;
              else if(countyCode=="KZ") scene.getObjectByName("earth-KZ").visible=true;
              else if(countyCode=="UZ") scene.getObjectByName("earth-UZ").visible=true;
            }else{
              maps[0].visible=true;
              for(var a=1; a<maps.length; a++){
                maps[a].visible=false;
              }
              for(var i=0; i<stateShape.length;i++){              
                if(stateShape[i].name==countyCode) stateShape[i].material.opacity=1;
                else stateShape[i].material.opacity=0;
              }
            }        
       
}

function updateInfoBox(onclick) {
    
    raycaster.setFromCamera(mouse, camera);
    //console.log(groupEarthWrap.children)
    //console.log(mouse)
    var intersects = raycaster.intersectObjects(scene.children);
    //console.log(mouse,intersects);
    var html = '';
    var state = [];
    if(intersects.length>0){
         var countyCode = intersects[0].object.name;

         state = infoBoxStateName(countyCode);
         if(state){
          html = state[1];
          if(!isMobile()) $(".country-name").show();
          
         }else{
          html = "";
          $(".country-name").hide();
         }
         $(".country-name").html(html)
         $(".country-name").css("left", (mouseWindow[0]-20)+"px")
         $(".country-name").css("top", (mouseWindow[1]-30)+"px")
      

         //console.log(intersects[0].object)
    }else{
         $(".country-name").hide();
    }
    
    return state?state[0]:false;    

}

function infoBoxStateName(abbr){
  for(var i=0; i<countryCode.length;i++){
    if(abbr==countryCode[i][2]){
      var state=[0,0];
      state[0]=countryCode[i][0];
      state[1]=countryCode[i][5];
      return state;
    }
  }
}

function getStateAbbr(state){
  for(var i=0; i<countryCode.length;i++){
    if(state==countryCode[i][0]){
      return countryCode[i][2];
    }
  }
}


var initSVGObject = function() {
var obj = {};

  /// The geo data from Taipei City, Keelung City, Taipei County in SVG form
obj.paths = [
    /// Taipei City
    "M28.256,11.163c-1.123-0.228-2.344-0.218-3.447,0.042c-7.493,0.878-9.926,9.551-9.239,16.164 c0.298,2.859,4.805,2.889,4.504,0c-0.25-2.41-0.143-6.047,1.138-8.632c0,3.142,0,6.284,0,9.425c0,0.111,0.011,0.215,0.016,0.322 c-0.003,0.051-0.015,0.094-0.015,0.146c0,7.479-0.013,14.955-0.322,22.428c-0.137,3.322,5.014,3.309,5.15,0 c0.242-5.857,0.303-11.717,0.317-17.578c0.244,0.016,0.488,0.016,0.732,0.002c0.015,5.861,0.074,11.721,0.314,17.576 c0.137,3.309,5.288,3.322,5.15,0c-0.309-7.473-0.32-14.949-0.32-22.428c0-0.232-0.031-0.443-0.078-0.646 c-0.007-3.247-0.131-6.497-0.093-9.742c1.534,2.597,1.674,6.558,1.408,9.125c-0.302,2.887,4.206,2.858,4.504,0 C38.678,20.617,36.128,11.719,28.256,11.163z"];

  //obj.amounts = [ 0.001];
  //obj.colors =  [ 0xC07000];
  //obj.center = { x:0.28, y:0 };

  return obj;
};

var addGeoObject = function( svgObject, material, value, fromCoors, toCoors, mode) {
  var movingBallRatio = isMobile()?2.6:1.6//value / 1000000;
  //if(movingBallRatio>5) movingBallRatio=5;
  //if(movingBallRatio<0.8) movingBallRatio=0.8;

  var i,j, len, len1;
  var path, mesh, color, material, amount, simpleShapes, simpleShape, shape3d, x, toAdd, results = [];
  var thePaths = svgObject.paths;
  
  
  var group = new THREE.Group();
  groupWrap.name="MovingLinesAndBalls"
  
  if(mode=="in")
    groupIn.add(group);
  else if(mode=="out")
    groupOut.add(group);
  else
    groupWrap.add(group);

  len = thePaths.length;
  
  for (i = 0; i < len; ++i) {
    path = $d3g.transformSVGPath( thePaths[i] );
    
    amount = 7;
    simpleShapes = path.toShapes(true);
    len1 = simpleShapes.length;
    for (j = 0; j < len1; ++j) {
      simpleShape = simpleShapes[j];
      shape3d = new THREE.ExtrudeGeometry(simpleShape,{
        amount: amount,
        bevelEnabled: false,
      });
      mesh = new THREE.Mesh(shape3d, material);
      mesh.rotation.x = Math.PI;
      mesh.rotation.y = Math.PI-(Math.abs(toCoors[0])-Math.abs(fromCoors[0]))-(Math.abs(toCoors[1])-Math.abs(fromCoors[1]));
      mesh.geometry.scale(0.01*movingBallRatio, 0.006*movingBallRatio, 0.01*movingBallRatio)
      mesh.translateZ( -0.04*movingBallRatio);
      mesh.translateX( -0.26*movingBallRatio);
      mesh.translateY( -0.02*movingBallRatio);
      group.add(mesh);
    }
    
    //var geometry = new THREE.CircleGeometry( 0.05, 10);
    
    var geometry = new THREE.SphereGeometry(0.05*movingBallRatio, 8,8 );
    var circle = new THREE.Mesh( geometry, material );
    //circle.rotation.y = Math.PI * 0.5;
    group.add(circle);
  }
  return group;

};

// From d3-threeD.js
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

function d3threeD(exports) {

const DEGS_TO_RADS = Math.PI / 180, UNIT_SIZE = 100;

const DIGIT_0 = 48, DIGIT_9 = 57, COMMA = 44, SPACE = 32, PERIOD = 46, MINUS = 45;

exports.transformSVGPath =
function transformSVGPath(pathStr) {
  var path = new THREE.ShapePath();

  var idx = 1, len = pathStr.length, activeCmd,
    x = 0, y = 0, nx = 0, ny = 0, firstX = null, firstY = null,
    x1 = 0, x2 = 0, y1 = 0, y2 = 0,
    rx = 0, ry = 0, xar = 0, laf = 0, sf = 0, cx, cy;

  function eatNum() {
    var sidx, c, isFloat = false, s;
    // eat delims
    while (idx < len) {
      c = pathStr.charCodeAt(idx);
      if (c !== COMMA && c !== SPACE)
        break;
      idx++;
    }
    if (c === MINUS)
      sidx = idx++;
    else
      sidx = idx;
    // eat number
    while (idx < len) {
      c = pathStr.charCodeAt(idx);
      if (DIGIT_0 <= c && c <= DIGIT_9) {
        idx++;
        continue;
      }
      else if (c === PERIOD) {
        idx++;
        isFloat = true;
        continue;
      }

      s = pathStr.substring(sidx, idx);
      return isFloat ? parseFloat(s) : parseInt(s);
    }

    s = pathStr.substring(sidx);
    return isFloat ? parseFloat(s) : parseInt(s);
  }

  function nextIsNum() {
    var c;
    // do permanently eat any delims...
    while (idx < len) {
      c = pathStr.charCodeAt(idx);
      if (c !== COMMA && c !== SPACE)
        break;
      idx++;
    }
    c = pathStr.charCodeAt(idx);
    return (c === MINUS || (DIGIT_0 <= c && c <= DIGIT_9));
  }

  var canRepeat;
  activeCmd = pathStr[0];
  while (idx <= len) {
    canRepeat = true;
    switch (activeCmd) {
      // moveto commands, become lineto's if repeated
      case 'M':
        x = eatNum();
        y = eatNum();
        path.moveTo(x, y);
        activeCmd = 'L';
        firstX = x;
        firstY = y;
        break;
      case 'm':
        x += eatNum();
        y += eatNum();
        path.moveTo(x, y);
        activeCmd = 'l';
        firstX = x;
        firstY = y;
        break;
      case 'Z':
      case 'z':
        canRepeat = false;
        if (x !== firstX || y !== firstY)
          path.lineTo(firstX, firstY);
        break;
      // - lines!
      case 'L':
      case 'H':
      case 'V':
        nx = (activeCmd === 'V') ? x : eatNum();
        ny = (activeCmd === 'H') ? y : eatNum();
        path.lineTo(nx, ny);
        x = nx;
        y = ny;
        break;
      case 'l':
      case 'h':
      case 'v':
        nx = (activeCmd === 'v') ? x : (x + eatNum());
        ny = (activeCmd === 'h') ? y : (y + eatNum());
        path.lineTo(nx, ny);
        x = nx;
        y = ny;
        break;
      // - cubic bezier
      case 'C':
        x1 = eatNum(); y1 = eatNum();
      case 'S':
        if (activeCmd === 'S') {
          x1 = 2 * x - x2; y1 = 2 * y - y2;
        }
        x2 = eatNum();
        y2 = eatNum();
        nx = eatNum();
        ny = eatNum();
        path.bezierCurveTo(x1, y1, x2, y2, nx, ny);
        x = nx; y = ny;
        break;
      case 'c':
        x1 = x + eatNum();
        y1 = y + eatNum();
      case 's':
        if (activeCmd === 's') {
          x1 = 2 * x - x2;
          y1 = 2 * y - y2;
        }
        x2 = x + eatNum();
        y2 = y + eatNum();
        nx = x + eatNum();
        ny = y + eatNum();
        path.bezierCurveTo(x1, y1, x2, y2, nx, ny);
        x = nx; y = ny;
        break;
      // - quadratic bezier
      case 'Q':
        x1 = eatNum(); y1 = eatNum();
      case 'T':
        if (activeCmd === 'T') {
          x1 = 2 * x - x1;
          y1 = 2 * y - y1;
        }
        nx = eatNum();
        ny = eatNum();
        path.quadraticCurveTo(x1, y1, nx, ny);
        x = nx;
        y = ny;
        break;
      case 'q':
        x1 = x + eatNum();
        y1 = y + eatNum();
      case 't':
        if (activeCmd === 't') {
          x1 = 2 * x - x1;
          y1 = 2 * y - y1;
        }
        nx = x + eatNum();
        ny = y + eatNum();
        path.quadraticCurveTo(x1, y1, nx, ny);
        x = nx; y = ny;
        break;
      // - elliptical arc
      case 'A':
        rx = eatNum();
        ry = eatNum();
        xar = eatNum() * DEGS_TO_RADS;
        laf = eatNum();
        sf = eatNum();
        nx = eatNum();
        ny = eatNum();
        if (rx !== ry) {
          console.warn("Forcing elliptical arc to be a circular one :(",
            rx, ry);
        }
        // SVG implementation notes does all the math for us! woo!
        // http://www.w3.org/TR/SVG/implnote.html#ArcImplementationNotes
        // step1, using x1 as x1'
        x1 = Math.cos(xar) * (x - nx) / 2 + Math.sin(xar) * (y - ny) / 2;
        y1 = -Math.sin(xar) * (x - nx) / 2 + Math.cos(xar) * (y - ny) / 2;
        // step 2, using x2 as cx'
        var norm = Math.sqrt(
           (rx*rx * ry*ry - rx*rx * y1*y1 - ry*ry * x1*x1) /
           (rx*rx * y1*y1 + ry*ry * x1*x1));
        if (laf === sf)
          norm = -norm;
        x2 = norm * rx * y1 / ry;
        y2 = norm * -ry * x1 / rx;
        // step 3
        cx = Math.cos(xar) * x2 - Math.sin(xar) * y2 + (x + nx) / 2;
        cy = Math.sin(xar) * x2 + Math.cos(xar) * y2 + (y + ny) / 2;

        var u = new THREE.Vector2(1, 0),
          v = new THREE.Vector2((x1 - x2) / rx,
                                (y1 - y2) / ry);
        var startAng = Math.acos(u.dot(v) / u.length() / v.length());
        if (u.x * v.y - u.y * v.x < 0)
          startAng = -startAng;

        // we can reuse 'v' from start angle as our 'u' for delta angle
        u.x = (-x1 - x2) / rx;
        u.y = (-y1 - y2) / ry;

        var deltaAng = Math.acos(v.dot(u) / v.length() / u.length());
        // This normalization ends up making our curves fail to triangulate...
        if (v.x * u.y - v.y * u.x < 0)
          deltaAng = -deltaAng;
        if (!sf && deltaAng > 0)
          deltaAng -= Math.PI * 2;
        if (sf && deltaAng < 0)
          deltaAng += Math.PI * 2;

        path.absarc(cx, cy, rx, startAng, startAng + deltaAng, sf);
        x = nx;
        y = ny;
        break;
      default:
        throw new Error("weird path command: " + activeCmd);
    }
    // just reissue the command
    if (canRepeat && nextIsNum())
      continue;
    activeCmd = pathStr[idx++];
  }

  return path;
}
}

var $d3g = {};
d3threeD($d3g);

function drawTotalChart(inData, outData){
  d3.select("svg").remove()

  var margin = {top: 10, right: 5, bottom: 10, left: 5},
  width = 230 - margin.left - margin.right,
  height = 85 - margin.top - margin.bottom;
  var step = 33;

  var container = d3.select('.main-chart')
    .append('svg')
    .attr("class","total-line-in")
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom);

  var svg = container.append('g')
    .attr('class', 'content')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
  
  var max=0;
  var min=40000000;
  for(var i=0; i<6; i++){
    if(inData[i]<min) min=inData[i];
    if(inData[i]>max) max=inData[i];
  }
  for(var i=0; i<6; i++){
    if(outData[i]<min) min=outData[i];
    if(outData[i]>max) max=outData[i];
  }

  function getMaxNumber(max,min,type){
    var gap = max - min;

    for(var i=0; i<10; i++){
      if(gap<(Math.pow(10,i))) {var last = Math.pow(10,i-1); break;}
    }
    
    var fMax = Math.floor(max/last)+1;
    var fMin = Math.floor(min/last);
    if(type==1)return fMax*last;
    else return fMin*last;
  }
  
  var scaleMax = getMaxNumber(max,min,1);
  
  var scaleMin = getMaxNumber(max,min,2)
  var scaleMid = scaleMin+(scaleMax-scaleMin)/2
  

  var y = d3.scale.linear()
  .domain([scaleMin, scaleMax])
  .range([height, 0]);

  svg.append("text")
  .text((scaleMax/10000)+(scaleMax>1000?"万":""))
  .attr("font-size",10) 
  .attr("x",step*5+10)
  .attr("y",function(){return 5+y(scaleMax); })
  .style("fill","#999")

  svg.append("text")
  .text((scaleMid/10000)+(scaleMid>1000?"万":""))
  .attr("font-size",10) 
  .attr("x",step*5+10)
  .attr("y",function(){return 5+y(scaleMid); })
  .style("fill","#999")

  svg.append("text")
  .text((scaleMin/10000)+(scaleMin>1000?"万":""))
  .attr("font-size",10) 
  .attr("x",step*5+10)
  .attr("y",function(){return 5+y(scaleMin); })
  .style("fill","#999")

  var line = d3.svg.line()
    .x(function(d,i) { return i*step; })
    .y(function(d,i) { return y(d); })
    .interpolate('monotone');

  var path1 = svg.append('path')
  .attr('class', 'line')
  .attr('d', line(inData))
  .attr('stroke', '#ffbb00')
  .attr('stroke-width', 2)
  .attr('fill', 'none');

  var path2 = svg.append('path')
  .attr('class', 'line')
  .attr('d', line(outData))
  .attr('stroke', '#ff6600')
  .attr('stroke-width', 2)
  .attr('fill', 'none');
  


  var circles1 = svg.append('g').selectAll("circle")  
    .data(inData)          
    .enter()  
    .append("circle");    
  
  circles1.attr("cx", function(d, i) {
        return (i * step);  
    })  
    .attr("cy", function(d, i){return y(d);})   
    .attr("r", 3)
    .attr('fill', '#ffbb00')
    .attr('class','dot')
    .on("mouseover",function(d, i)
        { 
          tooltip.html((d/10000).toFixed(2)+"万")
              .style("left",(d3.event.pageX)+"px")
              .style("top",(d3.event.pageY-28)+"px")
              .style("opacity",1.0);
        })
    .on("mouseout",function(d)
        {
          tooltip.style("opacity",0.0);
        }); 
        


  var circles1 = svg.append('g').selectAll("circle")  
    .data(outData)          
    .enter()  
    .append("circle");    
  
  circles1.attr("cx", function(d, i) {
        return (i * step);  
    })  
    .attr("cy", function(d, i){return y(d);})   
    .attr("r", 3)
    .attr('fill', '#ff6600')
    .attr('class','dot')
    .on("mouseover",function(d, i)
        { 
          tooltip.html((d/10000).toFixed(2)+"万")
              .style("left",(d3.event.pageX)+"px")
              .style("top",(d3.event.pageY-28)+"px")
              .style("opacity",1.0);
        })
    .on("mouseout",function(d)
        {
          tooltip.style("opacity",0.0);
        }); 

 var tooltip = d3.select("body").append("div")
              .attr("class","tooltip") //用于css设置类样式
              .attr("opacity",0.0);

  

  
  
        

}
