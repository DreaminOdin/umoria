# build-engine.ps1 -- rebuild the patched Umoria engine into engine/umoria.min.js
#
# Rebuilds the WebAssembly/asm.js engine from the real Umoria source with the
# personal-mod patch applied, then regenerates index.html.
#
# Prerequisites on PATH:
#   - emcc / emcmake   (Emscripten SDK, activated:  emsdk activate latest)
#   - cmake, ninja     (e.g. `pip install cmake ninja`)
#   - git, node
#
# Usage (from anywhere):  pwsh engine-patches/build-engine.ps1
$ErrorActionPreference = 'Stop'

$repo  = Split-Path -Parent $PSScriptRoot          # repo root (script lives in engine-patches/)
$src   = Join-Path $repo '_engine'                 # upstream checkout (git-ignored)
$patch = Join-Path $PSScriptRoot 'personal-mods.patch'
$upstream = 'https://github.com/jhirschberg70/browser-based-umoria.git'

# 1. Fetch the real Umoria browser source and apply our patch (once)
if (-not (Test-Path $src)) {
    git clone --depth 1 $upstream $src
    git -C $src apply --whitespace=nowarn $patch
    Write-Host "Cloned upstream and applied personal-mods.patch."
}

# 2. Configure + build with Emscripten
$build = Join-Path $src 'build-em'
emcmake cmake -S $src -B $build -G Ninja -DCMAKE_BUILD_TYPE=Release
cmake --build $build

# 3. Vendor the result and regenerate index.html
Copy-Item (Join-Path $build 'umoria/umoria.min.js') (Join-Path $repo 'engine/umoria.min.js') -Force
node (Join-Path $repo 'build-index.js')

Write-Host "Done. Updated engine/umoria.min.js and index.html."
