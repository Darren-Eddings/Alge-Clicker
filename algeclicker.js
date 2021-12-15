"use strict";

var canvas;
var gl;
var program;
var numPositions  = 36;
var texSize = 64;
var positionsArray = [];
var normalsArray = [];
var colorsArray = [];
var framebuffer;
var flag = true;
var color = new Uint8Array(4);

var vertices = [
        vec4(-0.5, -0.5,  0.5, 1.0),
        vec4(-0.5,  0.5,  0.5, 1.0),
        vec4(0.5,  0.5,  0.5, 1.0),
        vec4(0.5, -0.5,  0.5, 1.0),
        vec4(-0.5, -0.5, -0.5, 1.0),
        vec4(-0.5,  0.5, -0.5, 1.0),
        vec4(0.5,  0.5, -0.5, 1.0),
        vec4(0.5, -0.5, -0.5, 1.0),
    ];

var vertexColors = [
        vec4(1.0, 1.0, 1.0, 1.0),  // black
        vec4(1.0, 1.0, 1.0, 1.0),  // red
        vec4(1.0, 1.0, 1.0, 1.0),  // yellow
        vec4(1.0, 1.0, 1.0, 1.0),  // green
        vec4(1.0, 1.0, 1.0, 1.0),  // blue
        vec4(1.0, 1.0, 1.0, 1.0),  // magenta
        vec4(1.0, 1.0, 1.0, 1.0),  // cyan
        vec4(1.0, 1.0, 1.0, 1.0),   // white
    ];

var texCoordsArray = new Float32Array([

      // select the top left image
      0,    0,
      0,    0.5,
      0.25, 0.5,
      0,    0,
      0.25, 0.5,
      0.25, 0,
  
      // select the top middle image
      0.25, 0,
      0.25, 0.5,
      0.5,  0.5,
      0.25, 0,
      0.5,  0.5,
      0.5,  0,
  
      // select to top right image
      0.5,  0,
      0.5,  0.5,
      0.75, 0.5,
      0.5,  0,
      0.75, 0.5,
      0.75, 0,

      // select the bottom left image
      0,    0.5,
      0,    1,
      0.25, 1,
      0,    0.5,
      0.25, 1,
      0.25, 0.5,
      
      // select the bottom middle image
      0.25, 0.5,
      0.25, 1,
      0.5,  1,
      0.25, 0.5,
      0.5,  1,
      0.5,  0.5,
  
      // select the bottom right image
      0.5,   0.5,
      0.5,   1,
      0.75,  1,
      0.5,   0.5,
      0.75,  1,
      0.75,  0.5
  
  
  ]);

var lightPosition = vec4(1.0, 1.0, 1.0, 0.0);
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4( .0, 1.0, 1.0, 1.0);
var materialAmbient = vec4(1.0, 1.0, 1.0, 1.0);
var materialDiffuse = vec4(0.5, 0.5, 0.5, 1.0);
var materialSpecular = vec4(1.0, 0.8, 0.0, 1.0);
var materialShininess = 200.0;
var ctm;
var ambientColor, diffuseColor, specularColor;
var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;
var viewMatrix;
var viewerPos;
var program;
var cTexture;
var texture;
var textureLocation;
var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var axis = xAxis;
var theta = vec3(45.0, 45.0, 45.0);
var thetaLoc;
var Index = 0;
var equNums = [];

function quad(a, b, c, d) {

     var t1 = subtract(vertices[b], vertices[a]);
     var t2 = subtract(vertices[c], vertices[b]);
     var normal = cross(t1, t2);
     normal = normalize(normal);

     positionsArray.push(vertices[a]);
     normalsArray.push(normal);
     colorsArray.push(vertexColors[a]);
     positionsArray.push(vertices[b]);
     normalsArray.push(normal);
     colorsArray.push(vertexColors[a]);
     positionsArray.push(vertices[c]);
     normalsArray.push(normal);
     colorsArray.push(vertexColors[a]);
     positionsArray.push(vertices[a]);
     normalsArray.push(normal);
     colorsArray.push(vertexColors[a]);
     positionsArray.push(vertices[c]);
     normalsArray.push(normal);
     colorsArray.push(vertexColors[a]);
     positionsArray.push(vertices[d]);
     normalsArray.push(normal);
     colorsArray.push(vertexColors[a]);
}


function colorCube()
{
    quad(1, 0, 3, 2);
    quad(2, 3, 7, 6);
    quad(3, 0, 4, 7);
    quad(6, 5, 1, 2);
    quad(4, 5, 6, 7);
    quad(5, 4, 0, 1);
}

function randNum(min, max) {

    return Math.floor(Math.random() * (max - min + 1) ) + min;
}

function playSnd(audio) {
    audio.play();
}

window.onload = function init() {

    var clickSnd = document.getElementById("click");
    var winSnd = document.getElementById("win");
    var failSnd = document.getElementById("fail");  

    canvas = document.getElementById("gl-canvas");
    gl = canvas.getContext('webgl2');
    if (!gl) alert("WebGL 2.0 isn't available");

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.75, 0.75, 0.75, 1.0);

    gl.enable(gl.CULL_FACE);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    colorCube();
    var rand = randNum(-4, 11);
    document.getElementById("a").innerHTML = rand;

    //normal buffer
    var nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);
    var normalLoc = gl.getAttribLocation( program, "aNormal");
    gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(normalLoc);   

    //color buffer
    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW);
    var colorLoc = gl.getAttribLocation( program, "aColor");
    gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLoc);

    //vertex buffer
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positionsArray), gl.STATIC_DRAW);
    var positionLoc = gl.getAttribLocation(program, "aPosition");
    gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);

    //texture buffer
    var tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoordsArray, gl.STATIC_DRAW);
    var texCoordLoc = gl.getAttribLocation(program, "aTexCoord");
    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(texCoordLoc);

    //load an image
    var image = document.getElementById("texImage");
    configureTexture(image);
    modelViewMatrixLoc = gl.getUniformLocation(program, "uModelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "uProjectionMatrix");

    viewerPos = vec3(0.0, 0.0, 0.0);
    var up = vec3(0, 1, 0);
    var target = vec3(0, 0, 0);
    modelViewMatrix = lookAt(viewerPos, target, up);

    projectionMatrix = ortho(-1, 1, -1, 1, -100, 100);

    document.getElementById("ButtonX").onclick = function(){axis = xAxis;};
    document.getElementById("ButtonY").onclick = function(){axis = yAxis;};
    document.getElementById("ButtonZ").onclick = function(){axis = zAxis;};
    document.getElementById("ButtonT").onclick = function(){flag = !flag};

    gl.uniformMatrix4fv( gl.getUniformLocation(program, "uProjectionMatrix"),
       false, flatten(projectionMatrix));

    canvas.addEventListener("click", function(event) {

        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.clear( gl.COLOR_BUFFER_BIT);
        gl.uniform3fv(thetaLoc, theta);
        for(var i=0; i<6; i++) {
            gl.uniform1i(gl.getUniformLocation(program, "uColorIndex"), i+1);
            gl.drawArrays( gl.TRIANGLES, 6*i, 6 );
        }
        var x = event.clientX;
        var y = canvas.height-event.clientY;

        gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, color);

        if(color[0]==255) {
            playSnd(clickSnd);
            if(color[1]==255) {
                equNums.push(2);
            } else if(color[2]==255) {
                equNums.push(1);
            } else {
                 equNums.push(4);
            }
        } else if(color[1]==255) {
            playSnd(clickSnd);
            if(color[2]==255) {
                equNums.push(6);
            } else { 
                equNums.push(5);
            }
        } else if(color[2]==255) {
            playSnd(clickSnd);
            equNums.push(3);
        }

        if (equNums.length == 1) {
            
            document.getElementById("curVar").innerHTML = "Select Y";
            document.getElementById("x").innerHTML = "("+equNums[0];
        } else if (equNums.length == 2) {
            document.getElementById("curVar").innerHTML = "Select Z";
            document.getElementById("y").innerHTML = equNums[1]+")";
        } else if (equNums.length == 3) {
            document.getElementById("z").innerHTML = equNums[2];
            var temp = (equNums[0] + equNums[1]) - equNums[2];
            if (temp == document.getElementById("a").innerHTML) {
                playSnd(winSnd);
                alert("Correct!")
                window.location.reload();
            } else {
                playSnd(failSnd);
                document.getElementById("curVar").innerHTML = "Select X";
                document.getElementById("x").innerHTML = "(X";
                document.getElementById("y").innerHTML = "Y)";
                document.getElementById("z").innerHTML = "Z";
                equNums = [];
                alert("Incorrect, try again");
            }
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        gl.uniform1i(gl.getUniformLocation(program, "uColorIndex"), 0);
        gl.clear( gl.COLOR_BUFFER_BIT );
        gl.drawArrays(gl.TRIANGLES, 0, numPositions);

    });

    render();
}

//function for setting the texture
function configureTexture(image){
   texture = gl.createTexture();
   gl.bindTexture(gl.TEXTURE_2D, texture);
   gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, 
       new Uint8Array([0, 0, 255, 255]));
   gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
   //generate the Mipmap
   gl.generateMipmap(gl.TEXTURE_2D);
   gl.bindTexture(gl.TEXTURE_2D, texture);         
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
}

function render(){

   gl.clear( gl.COLOR_BUFFER_BIT );
   if(flag) theta[axis] += 1.0;

   gl.uniform4fv(gl.getUniformLocation(program, "uLightPosition"), lightPosition );
   viewMatrix = modelViewMatrix;
   viewMatrix = mult(viewMatrix, rotate(theta[xAxis], vec3(1, 0, 0)));
   viewMatrix = mult(viewMatrix, rotate(theta[yAxis], vec3(0, 1, 0)));
   viewMatrix = mult(viewMatrix, rotate(theta[zAxis], vec3(0, 0, 1)));
   gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(viewMatrix));
   gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

   var diffuseProduct = mult(lightDiffuse, materialDiffuse);
   gl.uniform4fv(gl.getUniformLocation(program, "uDiffuseProduct"), diffuseProduct);
   
   var ambientProduct = mult(lightAmbient, materialAmbient);
   gl.uniform4fv(gl.getUniformLocation(program, "uAmbientProduct"), ambientProduct);
   
   var specularProduct = mult(lightSpecular, materialSpecular);
   gl.uniform4fv(gl.getUniformLocation(program, "uSpecularProduct"), specularProduct);

   gl.uniform1f(gl.getUniformLocation(program, "uShininess"), materialShininess);

   gl.uniform1i(gl.getUniformLocation(program, "uColorIndex"), 0);
   gl.uniform1i(textureLocation, 0);
   gl.drawArrays( gl.TRIANGLES, 0, numPositions );

    requestAnimationFrame(render);
}
