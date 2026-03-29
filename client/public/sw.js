const CACHE_NAME = 'static-cache';

self.addEventListener('install', (event) => {
    console.log('Install sw')
});

self.addEventListener('activate', (event) => {
    console.log('activate sw')
});

self.addEventListener('fetch', (event) => {
    console.log('Fetch')
});
// preferable offload websockets & voxel logic into service workers. (a lot of data, some computation)