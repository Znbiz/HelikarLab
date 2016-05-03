/**
 *  Copyright (c) 2016, Helikar Lab.
 *  All rights reserved.
 *
 *  This source code is licensed under the GPLv3 License.
 *  Author: David Tichy
 */

ccNetViz.textures = function(onLoad) {
    var load = ccNetViz.utils.debounce(onLoad, 5);
    var textures = {};
    var pending = {};
    var n = 0;

    this.get = function(gl, img, action) {
        var p = pending[img];
        var t = textures[img];

        if (p) {
            p.push(action);
        }
        else if (t) {
            action && action();
        }
        else {
            p = pending[img] = [action];
            n++;
            textures[img] = t = ccNetViz.gl.createTexture(gl, img, () => {
                p.forEach(a => a && a());
                delete pending[img];
                --n || load();
            });
        }
        return t;
    }
}