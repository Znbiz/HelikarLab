/**
 *  Copyright (c) 2016, Helikar Lab.
 *  All rights reserved.
 *
 *  This source code is licensed under the GPLv3 License.
 *  Author: David Tichy
 */

ccNetViz.color = function (color) {
    this.a = 1;

    if (arguments.length >= 3) {
        this.r = arguments[0];
        this.g = arguments[1];
        this.b = arguments[2];
        arguments.length > 3 && (this.a = arguments[3]);
    }
    else if (/^rgb\((\d+), ?(\d+), ?(\d+)\)$/i.test(color)) {
        color = /^rgb\((\d+), ?(\d+), ?(\d+)\)$/i.exec(color);
        var get = v => parseInt(v, 10) / 255;

        this.r = get(color[1]);
        this.g = get(color[2]);
        this.b = get(color[3]);
    }
    else if (/^rgb\((\d+)\%, ?(\d+)\%, ?(\d+)\%\)$/i.test(color)) {
        color = /^rgb\((\d+)\%, ?(\d+)\%, ?(\d+)\%\)$/i.exec(color);
        var get = v => parseInt(v, 10) / 100;

        this.r = get(color[1]);
        this.g = get(color[2]);
        this.b = get(color[3]);
    }
    else if (/^\#([0-9a-f]{6})$/i.test(color)) {
        color = parseInt(color.substring(1), 16);
        this.r = (color >> 16 & 255) / 255;
        this.g = (color >> 8 & 255) / 255;
        this.b = (color & 255) / 255;
    }
    else {
        this.r = this.g = this.b = 0;
    }
};