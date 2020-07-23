let scene;
let camera;
let controls;
let renderer;

let geometry;
let material;
let mesh;

let field = [];
let res = 0.5;
let xSize = 100;
let ySize = 100;
let zSize = 100;
let increment = 0.04;

let noise;

function setup() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    controls = new THREE.OrbitControls(camera);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    noise = new OpenSimplexNoise();

    // Calculate the Noise Field
    let xoff = 0;
    for (let i = 0; i < xSize; i++) {
        let yoff = 0;
        field[i] = [];
        for (let j = 0; j < ySize; j++) {
            let zoff = 0;
            field[i][j] = [];
            for (let k = 0; k < zSize; k++) {
                field[i][j][k] = noise.noise3D(xoff, yoff, zoff);
                zoff += increment;
            }
            yoff += increment;
        }
        xoff += increment;
    }

    let vertices = [];
    for (let i = 0; i < xSize - 1; i++) {
        let x = i * res;
        for (let j = 0; j < ySize - 1; j++) {
            let y = j * res;
            for (let k = 0; k < zSize - 1; k++) {
                let z = k * res;

                let values = [
                    field[i][j][k] + 1,
                    field[i + 1][j][k] + 1,
                    field[i + 1][j][k + 1] + 1,
                    field[i][j][k + 1] + 1,
                    field[i][j + 1][k] + 1,
                    field[i + 1][j + 1][k] + 1,
                    field[i + 1][j + 1][k + 1] + 1,
                    field[i][j + 1][k + 1] + 1,
                ];

                let edges = [
                    new THREE.Vector3(
                        lerp(x, x + res, (1 - values[0]) / (values[1] - values[0])),
                        y,
                        z
                    ),
                    new THREE.Vector3(
                        x + res,
                        y,
                        lerp(z, z + res, (1 - values[1]) / (values[2] - values[1]))
                    ),
                    new THREE.Vector3(
                        lerp(x, x + res, (1 - values[3]) / (values[2] - values[3])),
                        y,
                        z + res
                    ),
                    new THREE.Vector3(
                        x,
                        y,
                        lerp(z, z + res, (1 - values[0]) / (values[3] - values[0]))
                    ),
                    new THREE.Vector3(
                        lerp(x, x + res, (1 - values[4]) / (values[5] - values[4])),
                        y + res,
                        z
                    ),
                    new THREE.Vector3(
                        x + res,
                        y + res,
                        lerp(z, z + res, (1 - values[5]) / (values[6] - values[5]))
                    ),
                    new THREE.Vector3(
                        lerp(x, x + res, (1 - values[7]) / (values[6] - values[7])),
                        y + res,
                        z + res
                    ),
                    new THREE.Vector3(
                        x,
                        y + res,
                        lerp(z, z + res, (1 - values[4]) / (values[7] - values[4]))
                    ),
                    new THREE.Vector3(
                        x,
                        lerp(y, y + res, (1 - values[0]) / (values[4] - values[0])),
                        z
                    ),
                    new THREE.Vector3(
                        x + res,
                        lerp(y, y + res, (1 - values[1]) / (values[5] - values[1])),
                        z
                    ),
                    new THREE.Vector3(
                        x + res,
                        lerp(y, y + res, (1 - values[2]) / (values[6] - values[2])),
                        z + res
                    ),
                    new THREE.Vector3(
                        x,
                        lerp(y, y + res, (1 - values[3]) / (values[7] - values[3])),
                        z + res
                    ),

                    // Comment out the upper ones, and uncomment these commented ones
                    // to disable interpolation

                    // new THREE.Vector3(x + res / 2, y, z),
                    // new THREE.Vector3(x + res, y, z + res / 2),
                    // new THREE.Vector3(x + res / 2, y, z + res),
                    // new THREE.Vector3(x, y, z + res / 2),
                    // new THREE.Vector3(x + res / 2, y + res, z),
                    // new THREE.Vector3(x + res, y + res, z + res / 2),
                    // new THREE.Vector3(x + res / 2, y + res, z + res),
                    // new THREE.Vector3(x, y + res, z + res / 2),
                    // new THREE.Vector3(x, y + res / 2, z),
                    // new THREE.Vector3(x + res, y + res / 2, z),
                    // new THREE.Vector3(x + res, y + res / 2, z + res),
                    // new THREE.Vector3(x, y + res / 2, z + res),
                ];

                let state = getState(
                    Math.ceil(field[i][j][k]),
                    Math.ceil(field[i + 1][j][k]),
                    Math.ceil(field[i + 1][j][k + 1]),
                    Math.ceil(field[i][j][k + 1]),
                    Math.ceil(field[i][j + 1][k]),
                    Math.ceil(field[i + 1][j + 1][k]),
                    Math.ceil(field[i + 1][j + 1][k + 1]),
                    Math.ceil(field[i][j + 1][k + 1])
                );

                for (let edgeIndex of triangulationTable[state]) {
                    if (edgeIndex !== -1) {
                        vertices.push(edges[edgeIndex].x, edges[edgeIndex].y, edges[edgeIndex].z);
                    }
                }
            }
        }
    }

    geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(vertices), 3));
    geometry.computeVertexNormals();

    material = new THREE.MeshPhongMaterial({ color: 0x0055ff, side: THREE.DoubleSide });

    mesh = new THREE.Mesh(geometry, material);

    scene.add(mesh);

    let pointLight = new THREE.PointLight(0xffffff, 1, 0);
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);

    let pointLight2 = new THREE.PointLight(0xffffff, 1, 0);
    pointLight.position.set(50, 50, 50);
    scene.add(pointLight2);

    let ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    camera.position.x = 25;
    camera.position.y = 20;
    camera.position.z = 100;
}

function draw() {
    requestAnimationFrame(draw);

    renderer.render(scene, camera);
}

function lerp(start, end, amt) {
    return (1 - amt) * start + amt * end;
}

function getState(a, b, c, d, e, f, g, h) {
    return a * 1 + b * 2 + c * 4 + d * 8 + e * 16 + f * 32 + g * 64 + h * 128;
}

setup();
draw();
