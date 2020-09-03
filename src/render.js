const THREE = require('three');

var camera, scene, renderer;
var video, geometry, material, texture, mesh;

init();
animate();

function init() {

    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
    camera.position.z = 900;

    scene = new THREE.Scene();

    var videoWidth = window.innerWidth;
    var videoHeight = window.innerHeight;
    video = document.getElementById( 'video' );
    video.src = 'file://' + __dirname + '/../assets/video/lama.mp4';
    video.height = videoHeight
    video.width = videoWidth
    video.play()
    texture = new THREE.VideoTexture( video );
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.format = THREE.RGBFormat;

    geometry = new THREE.PlaneGeometry( 1600, 900);

    material = new THREE.MeshBasicMaterial( { map: texture, side:THREE.FrontSide} );

    mesh = new THREE.Mesh( geometry, material );
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
    renderer.render( scene, camera );
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


document.body.addEventListener('keydown', update);
function update(e){
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