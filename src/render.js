var electron = require('electron');
const ipc = require('electron').ipcRenderer
const selectDirBtn = document.getElementById('getFile')
const fullscreenBtn = document.getElementById('fullscreen')
const THREE = require('three');
// import perspectiveTransform from 'perspective-transform';
const perspectiveTransform = require('perspective-transform');

var camera, scene, renderer;
var video, geometry, material, texture, mesh;
var videoWidth = window.innerWidth;
var videoHeight = window.innerHeight;
var corners = [[-10, 10], [videoWidth-90, 0], [videoWidth-50, videoHeight-100], [200, videoHeight]];
init();
animate();
// watch out for keyboard actions
document.body.addEventListener('keydown', onKeyPress);

function init() {
    const aspectRatio = videoWidth / videoHeight;
    const fov = 75;
    const canvasShortestEdge = Math.min(videoWidth, videoHeight);
    const cameraDistance = canvasShortestEdge / 2 / Math.tan(Math.PI * fov / 360);
    camera = new THREE.PerspectiveCamera(fov, aspectRatio, 0.1, 1000); 
    camera.position.z = cameraDistance;
    scene = new THREE.Scene();
    video = document.getElementById( 'video' );
    video.src = 'file://' + __dirname + '/../assets/video/lama.mp4';
    video.height = videoHeight
    video.width = videoWidth
    video.play()
    texture = new THREE.VideoTexture( video );
    texture.anisotropy = 16;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.format = THREE.RGBFormat;

    geometry = new THREE.PlaneGeometry( videoWidth, videoHeight);


    material = new THREE.MeshBasicMaterial( { map: texture, side:THREE.FrontSide} );

    mesh = new THREE.Mesh( geometry, material );
    remesh();
    scene.add( mesh );

    renderer = new THREE.WebGLRenderer( { 
        antialias: false, // true is more G/CPU heavy
        powerPreference: "high-performance", // GPU preference high-performance, low-power or default*
    } );
    renderer.setSize( window.innerWidth, window.innerHeight );

    document.body.appendChild( renderer.domElement );

}

function animate() {
    // note: three.js includes requestAnimationFrame shim
    requestAnimationFrame( animate );
    render()
    // displayCurrentFrame()
    renderer.render( scene, camera );
}
function displayCurrentFrame(){
    currentFrameInfo.text(Math.floor(video.currentTime));
}
function render() {
    if ( video.readyState === video.HAVE_ENOUGH_DATA ) {
        // videoImageContext.drawImage( video, 0, 0 );
        if ( texture ){
            texture.needsUpdate = true;
        }
    }

    renderer.render( scene, camera );
}

function remesh(){
    // solution from https://bitbucket.org/mattwilson1024/perspective-transform/src/master/
    // Source points come from the clicked corner points - flatten `this.corners` (an array of dimensions) into a single array of alternating x/y coordinates
    // e.g. `[[0, 1], [2, 3], [4, 5], [6, 7]]` becomes `[0, 1, 2, 3, 4, 5, 6, 7]`
    const srcPts = corners.reduce((acc, point) => {
      const [x, y] = point;
      return [...acc, x, y];
    }, []);

    // Destination points - this is the four corners of the visible viewport (bottom left, bottom right, top right, top left)
    // These are half the width & height because the origin is at the centre
    const w = window.innerWidth;
    const h = window.innerHeight;
    // const destPts = [
    //  -w, -h, // bottom left
    //   w, -h, // bottom right
    //   w, h, // top right
    //   -w, h, // top left
    // ];
    const destPts = [
     0, 0, // bottom left
      w, 0, // bottom right
      w, h, // top right
      0, h, // top left
    ];

    // Debug
    console.log('src', srcPts);
    console.log('destPts', destPts);

    // Get the coefficience for a perspective transform mapping from the source to the destination
    const perspT = perspectiveTransform(srcPts, destPts);
    const [a1, a2, a3, b1, b2, b3, c1, c2, c3] = perspT.coeffs;
    // Create a 4x4 transformation matrix.
    // Transform x and y coordinate, but leave the z coordinates of the homogenous coordinate vectors alone
    // For info, see https://math.stackexchange.com/a/339033
    // https://threejs.org/docs/#api/en/math/Matrix4
    const transformMatrix = new THREE.Matrix4();
    transformMatrix.set(a1, a2, 0, a3, 
                        b1, b2, 0, b3, 
                        0,  0,  1, 0, 
                        c1, c2, 0, c3);
    // non transformed  [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
    // Apply the tranform to the video mesh
    mesh.matrix = transformMatrix;
    console.log('mesh.matrix',  mesh.matrix);
    mesh.matrixAutoUpdate = false;
}


function onKeyPress(e){
    switch(e.key) {
    case 'p':
        video.play();
        console.log('play')
        break;
    case 's':
        video.pause();
        console.log('stop')
        break;
    case 'r':
        video.currentTime = 0;
        console.log('seek to 0')
        break;
  }
  e.preventDefault();
}

// fullscreen
fullscreenBtn.addEventListener('click', function (event) {
     toogleFullscreen()
});

function toogleFullscreen(){
    var app = electron.remote.getCurrentWindow();
    if (app.isFullScreen()) {
        app.setFullScreen(false);
    }else{
        app.setFullScreen(true);
    }
    setTimeout(function () {
        renderer.setSize( window.innerWidth, window.innerHeight );
        console.log(window.innerWidth, window.innerHeight)
    }, 800);
}

// change video file
selectDirBtn.addEventListener('click', function (event) {
     ipc.send('open-file-dialog')
});

//Getting back the information after selecting the file
ipc.on('selected-file', function (event, path) {
    //do what you want with the path/file selected, for example:
    console.log(path);
    video.pause()
    video.src = path;
    video.play()

});