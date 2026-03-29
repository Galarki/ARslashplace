import WebGL from 'three/addons/capabilities/WebGL.js';

export const WebGLChecker = () => {
    if (WebGL.isWebGL2Available()) {
        return true;
    } else {
        const warning = WebGL.getWebGL2ErrorMessage();
        const WebGLWarningElement = document.querySelector('#WebGLWarning');
        WebGLWarningElement.style.display = "block"
        WebGLWarningElement.appendChild(warning);
    }
}
